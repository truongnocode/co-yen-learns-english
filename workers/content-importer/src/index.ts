/**
 * co-yen-content-importer — Cloudflare Worker backend.
 *
 * Routes:
 *   GET  /health                     — liveness check
 *   POST /api/import/exam            — upload PDF/DOCX → Gemini → preview JSON
 *   POST /api/import/sgk             — upload source → SGK unit preview
 *   POST /api/grade/speaking         — student audio → Gemini → pronunciation verdict
 *
 * Firestore writes happen client-side (Firebase SDK from the admin UI) so this
 * Worker doesn't need a Firebase service account — only a Gemini API key.
 *
 * All /api/import/* routes require a Firebase ID token with `admin: true` custom claim.
 * /api/grade/speaking requires any signed-in user.
 */

import { Hono, type Context } from "hono";
import { cors } from "hono/cors";

import {
  EXAM_IMPORT_SYSTEM_PROMPT,
  ExamSchema,
  SgkUnitSchema,
} from "../../../src/lib/content-schema";
import type { Env } from "./env";
import { requireAdmin, requireUser, type DecodedToken } from "./auth";
import { extractStructured, GeminiError } from "./gemini";
import { scoreSpeaking } from "./speaking";

type Variables = { user: DecodedToken };

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("*", async (c, next) => {
  const origin = c.env.ALLOWED_ORIGIN;
  const handler = cors({
    origin: [origin, "http://localhost:5173", "http://localhost:8080"],
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    maxAge: 600,
  });
  return handler(c, next);
});

app.get("/health", (c) =>
  c.json({ ok: true, service: "co-yen-content-importer", ts: Date.now() }),
);

// ─── Error helper: map GeminiError to a client-friendly response ────────────
function geminiErrorResponse(c: AppContext, e: unknown): Response {
  if (e instanceof GeminiError) {
    const httpStatus =
      e.kind === "quota"
        ? 429
        : e.kind === "auth"
          ? 502
          : e.kind === "unavailable"
            ? 503
            : e.kind === "invalid_input"
              ? 400
              : 502;
    return c.json(
      {
        error: e.vi,
        kind: e.kind,
        detail: e.message,
      },
      httpStatus,
    );
  }
  return c.json(
    { error: "Internal error", detail: (e as Error).message },
    502,
  );
}

// ─── Import: exam ────────────────────────────────────────────────────────
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

const ALLOWED_MIMES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
};

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

async function readUpload(
  c: AppContext,
): Promise<{ filename: string; mimeType: string; bytes: ArrayBuffer } | Response> {
  const ct = c.req.header("content-type") ?? "";
  if (!ct.includes("multipart/form-data")) {
    return c.json({ error: "Expected multipart/form-data" }, 400);
  }
  const form = await c.req.formData();
  const file = form.get("file");
  if (
    !file ||
    typeof file === "string" ||
    typeof (file as Blob).arrayBuffer !== "function"
  ) {
    return c.json({ error: "Missing `file` field" }, 400);
  }
  const blob = file as Blob & { name?: string };
  if (blob.size > MAX_BYTES) {
    return c.json({ error: `File too large (${blob.size} > ${MAX_BYTES})` }, 413);
  }
  const mime = blob.type || "application/octet-stream";
  if (!ALLOWED_MIMES[mime]) {
    return c.json({ error: `Unsupported file type: ${mime}` }, 415);
  }
  const bytes = await blob.arrayBuffer();
  return {
    filename: blob.name ?? "upload",
    mimeType: mime,
    bytes,
  };
}

app.post("/api/import/exam", requireAdmin, async (c) => {
  const upload = await readUpload(c);
  if (upload instanceof Response) return upload;

  const gradeParam = c.req.query("grade");
  const grade = gradeParam ? parseInt(gradeParam, 10) : 10;

  try {
    const { data, attempts } = await extractStructured({
      apiKey: c.env.GEMINI_API_KEY,
      filename: upload.filename,
      fileBytes: upload.bytes,
      mimeType: upload.mimeType,
      schema: ExamSchema,
      systemPrompt: EXAM_IMPORT_SYSTEM_PROMPT,
      userInstruction: `Extract this exam paper as JSON. Target grade level: ${grade}. The paper likely has Part A (MCQ), Part B (cloze / signs / reading), and Part C (arrange / fill-in / writing). Preserve original question numbering in Part C.`,
    });

    return c.json({ kind: "exam", exam: data, attempts });
  } catch (e) {
    return geminiErrorResponse(c, e);
  }
});

app.post("/api/import/sgk", requireAdmin, async (c) => {
  const upload = await readUpload(c);
  if (upload instanceof Response) return upload;

  const grade = parseInt(c.req.query("grade") ?? "0", 10);
  const unitKey = c.req.query("unitKey") ?? "";
  if (!grade || grade < 3 || grade > 9) {
    return c.json({ error: "`grade` query param required (3-9)" }, 400);
  }
  if (!unitKey) {
    return c.json({ error: "`unitKey` query param required" }, 400);
  }

  try {
    const { data, attempts } = await extractStructured({
      apiKey: c.env.GEMINI_API_KEY,
      filename: upload.filename,
      fileBytes: upload.bytes,
      mimeType: upload.mimeType,
      schema: SgkUnitSchema,
      systemPrompt: EXAM_IMPORT_SYSTEM_PROMPT,
      userInstruction: `Extract SGK unit content for grade ${grade}, unit ${unitKey}. Include: title, at least 35 vocabulary items with IPA + Vietnamese meaning + word-class, a 200-500 word Vietnamese grammar_notes section with examples, and at least 20 MCQ exercises with Vietnamese explanations. If the source has fewer items than the floors, generate supplementary items that stay within the unit's topic/grammar scope.`,
    });

    return c.json({
      kind: "sgk_unit",
      grade,
      unitKey,
      unit: data,
      attempts,
    });
  } catch (e) {
    return geminiErrorResponse(c, e);
  }
});

// ─── Speaking: Gemini native audio scoring ─────────────────────────────────

const AUDIO_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const AUDIO_MIMES = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/aac",
]);

app.post("/api/grade/speaking", requireUser, async (c) => {
  const ct = c.req.header("content-type") ?? "";
  if (!ct.includes("multipart/form-data")) {
    return c.json({ error: "Expected multipart/form-data" }, 400);
  }
  const form = await c.req.formData();
  const file = form.get("audio");
  const targetText = String(form.get("target") ?? "").trim();
  if (!targetText) return c.json({ error: "Missing `target` field" }, 400);
  if (
    !file ||
    typeof file === "string" ||
    typeof (file as Blob).arrayBuffer !== "function"
  ) {
    return c.json({ error: "Missing `audio` field" }, 400);
  }
  const blob = file as Blob & { name?: string };
  if (blob.size > AUDIO_MAX_BYTES) {
    return c.json({ error: `Audio too large (${blob.size} bytes)` }, 413);
  }
  const mime = blob.type || "audio/webm";
  const baseMime = mime.split(";")[0];
  if (!AUDIO_MIMES.has(baseMime) && !mime.startsWith("audio/")) {
    return c.json({ error: `Unsupported audio type: ${mime}` }, 415);
  }
  const bytes = await blob.arrayBuffer();

  try {
    const verdict = await scoreSpeaking(c.env, {
      audio: bytes,
      mime,
      filename: blob.name ?? "audio.webm",
      targetText,
    });
    return c.json(verdict);
  } catch (e) {
    return geminiErrorResponse(c, e);
  }
});

// ─── Error boundary ──────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error", detail: err.message }, 500);
});

export default app;
