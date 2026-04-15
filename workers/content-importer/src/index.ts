/**
 * co-yen-content-importer — Cloudflare Worker backend.
 *
 * Routes:
 *   GET  /health                     — liveness check
 *   POST /api/import/exam            — upload PDF/DOCX → Claude → preview JSON
 *   POST /api/import/sgk             — upload source → SGK unit preview
 *   POST /api/import/save            — save verified JSON to Firestore
 *
 * All /api/import/* routes require a Firebase ID token with `admin: true` custom claim.
 */

import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";

import {
  EXAM_IMPORT_SYSTEM_PROMPT,
  ExamSchema,
  ImportResultSchema,
  SgkUnitSchema,
} from "../../../src/lib/content-schema";
import type { Env } from "./env";
import { requireAdmin, requireUser, type DecodedToken } from "./auth";
import { extractStructured } from "./claude";
import { setDocument, getDocument } from "./firestore";
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
      apiKey: c.env.ANTHROPIC_API_KEY,
      filename: upload.filename,
      fileBytes: upload.bytes,
      mimeType: upload.mimeType,
      schema: ExamSchema,
      systemPrompt: EXAM_IMPORT_SYSTEM_PROMPT,
      userInstruction: `Extract this exam paper as JSON. Target grade level: ${grade}. The paper likely has Part A (MCQ), Part B (cloze / signs / reading), and Part C (arrange / fill-in / writing). Preserve original question numbering in Part C.`,
    });

    return c.json({
      kind: "exam",
      exam: data,
      attempts,
    });
  } catch (e) {
    return c.json(
      { error: "Extraction failed", detail: (e as Error).message },
      502,
    );
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
      apiKey: c.env.ANTHROPIC_API_KEY,
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
    return c.json(
      { error: "Extraction failed", detail: (e as Error).message },
      502,
    );
  }
});

// ─── Save: write verified JSON to Firestore ─────────────────────────────
const SaveBodySchema = z.object({
  result: ImportResultSchema,
  /**
   * If true, overwrite an existing doc at the target path. Defaults to false —
   * matches the `feedback_skip_existing` project rule.
   */
  overwrite: z.boolean().optional().default(false),
});

app.post("/api/import/save", requireAdmin, async (c) => {
  const raw = await c.req.json().catch(() => null);
  const parsed = SaveBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid body", issues: parsed.error.issues },
      400,
    );
  }
  const { result, overwrite } = parsed.data;
  const user = c.get("user");

  const docPath = resolveDocPath(result);

  if (!overwrite) {
    const existing = await getDocument(c.env, docPath);
    if (existing && Object.keys(existing).length > 0) {
      return c.json(
        {
          error: "Document already exists",
          docPath,
          hint: "Pass overwrite: true to replace.",
        },
        409,
      );
    }
  }

  const payload: Record<string, unknown> = {
    ...flattenResult(result),
    updatedAt: new Date(),
    updatedBy: user.uid,
  };

  await setDocument(c.env, docPath, payload);

  return c.json({ ok: true, docPath });
});

function resolveDocPath(result: z.infer<typeof ImportResultSchema>): string {
  // Firestore paths: collections must have an odd number of segments and
  // documents an even number. We key content under these top-level collections:
  //   exams/grade{N}/tests/{examId}       — 3-part collection `exams/grade{N}/tests`
  //   sgk/grade{N}/units/{unitKey}        — 3-part collection `sgk/grade{N}/units`
  //   grade10_vocab/{topicId}             — 1-part collection
  //   grade10_grammar/{topicId}           — 1-part collection
  switch (result.kind) {
    case "exam":
      return `exams/grade${result.exam.grade}/tests/${slugify(result.exam.title)}`;
    case "sgk_unit":
      return `sgk/grade${result.grade}/units/${result.unitKey}`;
    case "grade10_vocab":
      return `grade10_vocab/${result.topicId}`;
    case "grade10_grammar":
      return `grade10_grammar/${result.topicId}`;
  }
}

function flattenResult(
  result: z.infer<typeof ImportResultSchema>,
): Record<string, unknown> {
  switch (result.kind) {
    case "exam":
      return { kind: "exam", ...result.exam };
    case "sgk_unit":
      return {
        kind: "sgk_unit",
        grade: result.grade,
        unitKey: result.unitKey,
        ...result.unit,
      };
    case "grade10_vocab":
      return { kind: "grade10_vocab", topicId: result.topicId, ...result.topic };
    case "grade10_grammar":
      return { kind: "grade10_grammar", topicId: result.topicId, ...result.topic };
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ─── Speaking: Whisper + Claude scoring ─────────────────────────────────────
const AUDIO_MAX_BYTES = 10 * 1024 * 1024; // 10 MB is plenty for a single shadow
const AUDIO_MIMES = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/m4a",
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
  // Whisper accepts a range of mimes; we allow any audio/* but warn on unknowns.
  const mime = blob.type || "audio/webm";
  if (!AUDIO_MIMES.has(mime.split(";")[0]) && !mime.startsWith("audio/")) {
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
    return c.json(
      { error: "Speaking scoring failed", detail: (e as Error).message },
      502,
    );
  }
});

// ─── Error boundary ──────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error", detail: err.message }, 500);
});

export default app;
