/**
 * Typed HTTP client for the co-yen content-importer Cloudflare Worker.
 *
 * Base URL comes from `VITE_API_BASE_URL`. Every call attaches the current
 * user's Firebase ID token so the Worker can verify admin custom claims.
 *
 * Firestore writes (saveImportResult) happen directly via the Firebase SDK —
 * the Worker stays credential-light (only Gemini API key), and the user's own
 * identity + Firestore security rules gate the write.
 */

import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type {
  Exam,
  ImportResult,
  SgkUnit,
} from "@/lib/content-schema";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8787";

async function authHeader(): Promise<Record<string, string>> {
  const u = auth.currentUser;
  if (!u) throw new Error("Not signed in");
  const token = await u.getIdToken(/* forceRefresh */ false);
  return { Authorization: `Bearer ${token}` };
}

export interface ImportExamResponse {
  kind: "exam";
  exam: Exam;
  attempts: number;
}

export interface ImportSgkResponse {
  kind: "sgk_unit";
  grade: number;
  unitKey: string;
  unit: SgkUnit;
  attempts: number;
}

export async function importExam(
  file: File,
  grade = 10,
): Promise<ImportExamResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(
    `${BASE_URL}/api/import/exam?grade=${grade}`,
    {
      method: "POST",
      headers: await authHeader(),
      body: form,
    },
  );
  if (!res.ok) throw await toError(res);
  return (await res.json()) as ImportExamResponse;
}

export async function importSgkUnit(
  file: File,
  grade: number,
  unitKey: string,
): Promise<ImportSgkResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(
    `${BASE_URL}/api/import/sgk?grade=${grade}&unitKey=${encodeURIComponent(unitKey)}`,
    {
      method: "POST",
      headers: await authHeader(),
      body: form,
    },
  );
  if (!res.ok) throw await toError(res);
  return (await res.json()) as ImportSgkResponse;
}

export interface SpeakingVerdict {
  overall_score: number;
  accuracy_score: number;
  fluency_score: number;
  words: Array<{
    target: string;
    heard: string;
    verdict: "correct" | "close" | "wrong" | "missing";
    tip?: string;
  }>;
  extra_words: string[];
  vn_feedback: string;
  transcript: string;
}

export async function gradeSpeaking(
  audio: Blob,
  targetText: string,
): Promise<SpeakingVerdict> {
  const form = new FormData();
  form.append("audio", audio, "speech.webm");
  form.append("target", targetText);
  const res = await fetch(`${BASE_URL}/api/grade/speaking`, {
    method: "POST",
    headers: await authHeader(),
    body: form,
  });
  if (!res.ok) throw await toError(res);
  return (await res.json()) as SpeakingVerdict;
}

// ─── Firestore save (client-side via Firebase SDK) ──────────────────────────

function resolveDocPath(result: ImportResult): string {
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

function flattenResult(result: ImportResult): Record<string, unknown> {
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

export async function saveImportResult(
  result: ImportResult,
  overwrite = false,
): Promise<{ ok: true; docPath: string }> {
  const u = auth.currentUser;
  if (!u) throw new Error("Not signed in");

  const docPath = resolveDocPath(result);
  const ref = doc(db, docPath);

  if (!overwrite) {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const err = new Error(
        `Document already exists at ${docPath}. Pass overwrite=true to replace.`,
      );
      (err as Error & { status?: number }).status = 409;
      throw err;
    }
  }

  await setDoc(ref, {
    ...flattenResult(result),
    updatedAt: serverTimestamp(),
    updatedBy: u.uid,
  });

  return { ok: true, docPath };
}

async function toError(res: Response): Promise<Error> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    try {
      body = await res.text();
    } catch {
      body = null;
    }
  }
  const msg =
    (body && typeof body === "object" && "error" in body && String(body.error)) ||
    (typeof body === "string" && body) ||
    `HTTP ${res.status}`;
  const err = new Error(msg);
  (err as Error & { status?: number; body?: unknown }).status = res.status;
  (err as Error & { status?: number; body?: unknown }).body = body;
  return err;
}
