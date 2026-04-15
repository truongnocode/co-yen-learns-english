/**
 * Typed HTTP client for the co-yen content-importer Cloudflare Worker.
 *
 * Base URL comes from `VITE_API_BASE_URL`. Every call attaches the current
 * user's Firebase ID token so the Worker can verify admin custom claims.
 */

import { auth } from "@/lib/firebase";
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

export async function saveImportResult(
  result: ImportResult,
  overwrite = false,
): Promise<{ ok: true; docPath: string }> {
  const res = await fetch(`${BASE_URL}/api/import/save`, {
    method: "POST",
    headers: {
      ...(await authHeader()),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ result, overwrite }),
  });
  if (!res.ok) throw await toError(res);
  return (await res.json()) as { ok: true; docPath: string };
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
