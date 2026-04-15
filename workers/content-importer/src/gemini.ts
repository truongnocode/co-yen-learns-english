/**
 * Gemini API client for content extraction and speech scoring.
 *
 * Uses Google's Gemini API:
 *   - Files API for uploading PDF/DOCX/audio (up to 20MB inline, File API for larger)
 *   - generateContent with responseMimeType=application/json + responseSchema for
 *     structured output (equivalent to Claude's tool_use with input_schema).
 *
 * Docs:
 *   https://ai.google.dev/gemini-api/docs/files
 *   https://ai.google.dev/gemini-api/docs/structured-output
 *   https://ai.google.dev/gemini-api/docs/audio
 */

import { z, type ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const GEMINI_MODEL = "gemini-2.5-flash";
const FILES_UPLOAD_URL = "https://generativelanguage.googleapis.com/upload/v1beta/files";
const GENERATE_URL = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

/**
 * A user-facing error with a Vietnamese message. Thrown when the Gemini API
 * returns a quota / rate-limit / auth error so the React app can show the
 * student/teacher something more helpful than a raw HTTP 429.
 */
export class GeminiError extends Error {
  readonly status: number;
  readonly vi: string;
  readonly kind: "quota" | "auth" | "unavailable" | "invalid_input" | "unknown";

  constructor(opts: {
    status: number;
    kind: GeminiError["kind"];
    vi: string;
    detail?: string;
  }) {
    super(opts.detail ?? opts.vi);
    this.status = opts.status;
    this.kind = opts.kind;
    this.vi = opts.vi;
  }
}

function classifyGeminiError(status: number, body: string): GeminiError {
  // Gemini returns JSON like:
  //   { "error": { "code": 429, "status": "RESOURCE_EXHAUSTED", "message": "..." } }
  let geminiStatus = "";
  let geminiMsg = "";
  try {
    const parsed = JSON.parse(body) as {
      error?: { status?: string; message?: string };
    };
    geminiStatus = parsed.error?.status ?? "";
    geminiMsg = parsed.error?.message ?? "";
  } catch {
    // non-JSON response — fall through to status-code classification
  }

  if (status === 429 || geminiStatus === "RESOURCE_EXHAUSTED") {
    return new GeminiError({
      status,
      kind: "quota",
      vi: "Gemini API đã hết quota. Cô Yến vui lòng đợi vài phút rồi thử lại, hoặc kiểm tra hạn mức billing tại https://aistudio.google.com/apikey.",
      detail: geminiMsg || body,
    });
  }
  if (status === 401 || status === 403 || geminiStatus === "UNAUTHENTICATED" || geminiStatus === "PERMISSION_DENIED") {
    return new GeminiError({
      status,
      kind: "auth",
      vi: "Gemini API key không hợp lệ hoặc đã bị thu hồi. Vui lòng cập nhật key mới.",
      detail: geminiMsg || body,
    });
  }
  if (status === 503 || status === 504 || geminiStatus === "UNAVAILABLE" || geminiStatus === "DEADLINE_EXCEEDED") {
    return new GeminiError({
      status,
      kind: "unavailable",
      vi: "Gemini tạm thời gián đoạn. Xin thử lại sau ít phút.",
      detail: geminiMsg || body,
    });
  }
  if (status === 400 || status === 413 || status === 415 || geminiStatus === "INVALID_ARGUMENT") {
    return new GeminiError({
      status,
      kind: "invalid_input",
      vi: "File hoặc dữ liệu gửi lên không hợp lệ. Thử file khác hoặc giảm kích thước.",
      detail: geminiMsg || body,
    });
  }
  return new GeminiError({
    status,
    kind: "unknown",
    vi: `Gemini trả lỗi không xác định (HTTP ${status}). Xem log để biết chi tiết.`,
    detail: geminiMsg || body,
  });
}

// ─── File upload ────────────────────────────────────────────────────────────

interface UploadedFile {
  uri: string;
  mimeType: string;
  name: string;
}

/**
 * Upload a file to Gemini using the resumable upload protocol.
 * Returns a `file_uri` that can be referenced in generateContent calls.
 *
 * The protocol requires two requests:
 *   1. POST to the upload endpoint with headers describing the file → get upload URL
 *   2. POST bytes to the returned URL → get the file metadata
 */
export async function uploadToGemini(params: {
  apiKey: string;
  filename: string;
  bytes: ArrayBuffer;
  mimeType: string;
}): Promise<UploadedFile> {
  const { apiKey, filename, bytes, mimeType } = params;

  const startRes = await fetch(`${FILES_UPLOAD_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(bytes.byteLength),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: filename } }),
  });
  if (!startRes.ok) {
    throw classifyGeminiError(startRes.status, await startRes.text());
  }
  const uploadUrl = startRes.headers.get("x-goog-upload-url");
  if (!uploadUrl) {
    throw new Error("Gemini did not return an upload URL");
  }

  const finRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(bytes.byteLength),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: bytes,
  });
  if (!finRes.ok) {
    throw classifyGeminiError(finRes.status, await finRes.text());
  }
  const body = (await finRes.json()) as {
    file?: { uri?: string; mimeType?: string; name?: string };
  };
  if (!body.file?.uri || !body.file?.name) {
    throw new Error(`Gemini upload returned no uri/name: ${JSON.stringify(body)}`);
  }
  return {
    uri: body.file.uri,
    mimeType: body.file.mimeType ?? mimeType,
    name: body.file.name,
  };
}

// ─── Structured content extraction ──────────────────────────────────────────

/**
 * Gemini's responseSchema only supports a subset of JSON Schema (no `$ref`,
 * no `oneOf`/`anyOf` in some SDK versions). We flatten the Zod-derived schema
 * and strip unsupported fields.
 */
function sanitizeSchemaForGemini(schema: unknown): unknown {
  if (Array.isArray(schema)) {
    return schema.map(sanitizeSchemaForGemini);
  }
  if (schema && typeof schema === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(schema as Record<string, unknown>)) {
      // Gemini rejects these keys
      if (k === "$schema" || k === "additionalProperties" || k === "$ref" || k === "definitions") continue;
      // Gemini uses uppercase types (STRING/NUMBER/...) OR lowercase; both work,
      // but it rejects `null` in type arrays. We leave types as-is.
      out[k] = sanitizeSchemaForGemini(v);
    }
    return out;
  }
  return schema;
}

export interface ExtractParams<T extends ZodTypeAny> {
  apiKey: string;
  filename: string;
  fileBytes: ArrayBuffer;
  mimeType: string;
  schema: T;
  systemPrompt: string;
  userInstruction: string;
  /** Max retries on schema-validation failure. Default 2 (total 3 attempts). */
  maxRetries?: number;
}

export interface ExtractResult<T> {
  data: T;
  attempts: number;
  fileName: string;
}

/**
 * Upload a file → ask Gemini for structured JSON → validate with Zod →
 * (on failure) re-ask with the validation error feedback.
 */
export async function extractStructured<T extends ZodTypeAny>(
  params: ExtractParams<T>,
): Promise<ExtractResult<z.infer<T>>> {
  const {
    apiKey,
    filename,
    fileBytes,
    mimeType,
    schema,
    systemPrompt,
    userInstruction,
    maxRetries = 2,
  } = params;

  const file = await uploadToGemini({ apiKey, filename, bytes: fileBytes, mimeType });

  const jsonSchema = zodToJsonSchema(schema, {
    target: "openApi3",
    $refStrategy: "none",
  });
  const responseSchema = sanitizeSchemaForGemini(jsonSchema);

  // Build the contents array — system prompt goes via system_instruction.
  const contents: Array<{ role: string; parts: unknown[] }> = [
    {
      role: "user",
      parts: [
        { fileData: { fileUri: file.uri, mimeType: file.mimeType } },
        { text: userInstruction },
      ],
    },
  ];

  let lastError: string | null = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const body = {
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
        maxOutputTokens: 16000,
      },
    };

    const res = await fetch(`${GENERATE_URL(GEMINI_MODEL)}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw classifyGeminiError(res.status, await res.text());
    }
    const json = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
      promptFeedback?: unknown;
    };

    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) {
      lastError = `Gemini returned no text (finishReason=${json.candidates?.[0]?.finishReason ?? "unknown"})`;
    } else {
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch (e) {
        lastError = `Gemini returned non-JSON: ${(e as Error).message}. Raw: ${text.slice(0, 500)}`;
        continue;
      }
      const parsed = schema.safeParse(data);
      if (parsed.success) {
        return { data: parsed.data, attempts: attempt, fileName: file.name };
      }
      lastError = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");

      // Push the failure back and let Gemini try again.
      contents.push({
        role: "model",
        parts: [{ text }],
      });
      contents.push({
        role: "user",
        parts: [
          {
            text: `The previous output failed schema validation:\n${lastError}\n\nPlease emit corrected JSON matching the required schema.`,
          },
        ],
      });
    }
  }

  throw new Error(
    `Extraction failed after ${maxRetries + 1} attempts. Last error: ${lastError ?? "unknown"}`,
  );
}

// ─── One-shot JSON generation (no file upload, for speaking scoring etc.) ──

export async function generateStructured<T extends ZodTypeAny>(params: {
  apiKey: string;
  schema: T;
  systemPrompt: string;
  parts: unknown[]; // already-built parts array (can include inlineData for audio)
  maxRetries?: number;
}): Promise<{ data: z.infer<typeof params.schema>; attempts: number }> {
  const { apiKey, schema, systemPrompt, parts, maxRetries = 1 } = params;

  const jsonSchema = zodToJsonSchema(schema, {
    target: "openApi3",
    $refStrategy: "none",
  });
  const responseSchema = sanitizeSchemaForGemini(jsonSchema);

  const contents: Array<{ role: string; parts: unknown[] }> = [
    { role: "user", parts },
  ];

  let lastError: string | null = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const body = {
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
        maxOutputTokens: 4000,
      },
    };

    const res = await fetch(`${GENERATE_URL(GEMINI_MODEL)}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw classifyGeminiError(res.status, await res.text());
    }
    const json = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) {
      lastError = `Gemini returned no text (finishReason=${json.candidates?.[0]?.finishReason ?? "unknown"})`;
      continue;
    }
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch (e) {
      lastError = `Gemini returned non-JSON: ${(e as Error).message}`;
      continue;
    }
    const parsed = schema.safeParse(data);
    if (parsed.success) {
      return { data: parsed.data, attempts: attempt };
    }
    lastError = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");

    contents.push({ role: "model", parts: [{ text }] });
    contents.push({
      role: "user",
      parts: [
        {
          text: `The previous output failed schema validation:\n${lastError}\nReturn corrected JSON.`,
        },
      ],
    });
  }

  throw new Error(`Generation failed: ${lastError ?? "unknown"}`);
}
