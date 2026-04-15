/**
 * Claude API client for content extraction.
 *
 * Uses Anthropic's Files API to upload the source document once, then references
 * it in a Messages request with a Zod-derived JSON schema tool. This is cheaper
 * than re-uploading per retry and lets Claude see PDFs/DOCX natively.
 *
 * Docs:
 *   https://docs.anthropic.com/en/docs/build-with-claude/files
 *   https://docs.anthropic.com/en/docs/build-with-claude/tool-use
 */

import Anthropic from "@anthropic-ai/sdk";
import { z, type ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const MODEL = "claude-opus-4-6";
const MAX_TOKENS = 16_000;
const FILES_BETA = "files-api-2025-04-14";

export interface ExtractParams<T extends ZodTypeAny> {
  apiKey: string;
  /** Original filename (for the upload's Content-Disposition). */
  filename: string;
  /** Raw file bytes (PDF, DOCX, etc.). */
  fileBytes: ArrayBuffer;
  /** MIME type — application/pdf or application/vnd.openxmlformats-officedocument.wordprocessingml.document. */
  mimeType: string;
  /** Zod schema describing the expected output shape. */
  schema: T;
  /** System prompt. */
  systemPrompt: string;
  /** User-facing instruction (e.g. "Extract this Grade 10 mock exam..."). */
  userInstruction: string;
  /** Max retries if Zod validation fails. Default 2 (so total 3 attempts). */
  maxRetries?: number;
}

export interface ExtractResult<T> {
  data: T;
  attempts: number;
  fileId: string;
}

/**
 * Upload → ask Claude → validate → (if invalid) ask Claude to correct → repeat.
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

  const client = new Anthropic({ apiKey });

  // 1. Upload file once.
  const fileId = await uploadFile(apiKey, filename, fileBytes, mimeType);

  // 2. Build tool schema from Zod.
  const jsonSchema = zodToJsonSchema(schema, {
    target: "openApi3",
    $refStrategy: "none",
  }) as Record<string, unknown>;

  const tool = {
    name: "emit_content",
    description: "Emit the extracted content matching the required schema.",
    input_schema: jsonSchema,
  };

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: [
        {
          type: "document",
          source: {
            type: "file",
            file_id: fileId,
          },
        } as unknown as Anthropic.ContentBlockParam,
        { type: "text", text: userInstruction },
      ],
    },
  ];

  let lastError: string | null = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        tools: [tool as unknown as Anthropic.Tool],
        tool_choice: { type: "tool", name: "emit_content" },
        messages,
      },
      { headers: { "anthropic-beta": FILES_BETA } },
    );

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    if (!toolUse) {
      lastError = "Claude did not emit a tool_use block";
    } else {
      const parsed = schema.safeParse(toolUse.input);
      if (parsed.success) {
        return { data: parsed.data, attempts: attempt, fileId };
      }
      lastError = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");

      // Feed error back so Claude can self-correct on the next turn.
      messages.push({ role: "assistant", content: response.content });
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `The previous output failed schema validation:\n${lastError}\n\nPlease retry and emit a corrected \`emit_content\` tool call.`,
          },
        ],
      });
    }
  }

  throw new Error(
    `Extraction failed after ${maxRetries + 1} attempts. Last error: ${lastError ?? "unknown"}`,
  );
}

/**
 * Upload a file to Anthropic's Files API and return the file_id.
 *
 * The SDK wraps the Files API but at time of writing keeps it behind a beta flag;
 * we POST directly to keep the implementation explicit and future-proof.
 */
async function uploadFile(
  apiKey: string,
  filename: string,
  bytes: ArrayBuffer,
  mimeType: string,
): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mimeType }), filename);

  const res = await fetch("https://api.anthropic.com/v1/files", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": FILES_BETA,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`File upload failed (${res.status}): ${text}`);
  }

  const body = (await res.json()) as { id?: string };
  if (!body.id) throw new Error(`File upload returned no id: ${JSON.stringify(body)}`);
  return body.id;
}
