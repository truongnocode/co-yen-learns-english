/**
 * AI speaking scoring for the Shadowing game.
 *
 * Pipeline:
 *   1. Whisper (`gpt-4o-transcribe` or `whisper-1`) transcribes the student audio
 *      with word-level timestamps + confidence proxy.
 *   2. Claude compares the transcript to the target sentence and produces:
 *        - overall_score (0-100)
 *        - per-word verdicts (correct / wrong / missing / extra)
 *        - fluency notes in Vietnamese
 *   3. We return a compact JSON the React UI renders as a color-coded transcript.
 *
 * Why not score in the browser? Whisper needs the API key and Claude handles
 * the comparison logic more reliably than JS string-diff. The Worker is the
 * natural home for both calls.
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Env } from "./env";

const CLAUDE_MODEL = "claude-opus-4-6";

// ─── Schema returned to the client ──────────────────────────────────────────

export const SpeakingVerdictSchema = z.object({
  overall_score: z
    .number()
    .min(0)
    .max(100)
    .describe("0-100 accuracy+fluency score for the whole utterance"),
  accuracy_score: z.number().min(0).max(100),
  fluency_score: z.number().min(0).max(100),
  words: z
    .array(
      z.object({
        target: z.string().describe("The target word (from the reference sentence)"),
        heard: z
          .string()
          .describe(
            "What Whisper transcribed at this position, or empty string if missing",
          ),
        verdict: z.enum(["correct", "close", "wrong", "missing"]),
        tip: z.string().optional().describe("Short pronunciation tip in Vietnamese"),
      }),
    )
    .describe("Per-target-word verdicts, in target order"),
  extra_words: z
    .array(z.string())
    .describe("Words the student said that are NOT in the target"),
  vn_feedback: z
    .string()
    .describe(
      "Short Vietnamese feedback for the student (2-3 sentences, encouraging but honest)",
    ),
});

export type SpeakingVerdict = z.infer<typeof SpeakingVerdictSchema>;

// ─── Whisper transcription ──────────────────────────────────────────────────

interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

interface WhisperResponse {
  text: string;
  words?: WhisperWord[];
}

async function transcribe(
  apiKey: string,
  audio: ArrayBuffer,
  mime: string,
  filename: string,
): Promise<WhisperResponse> {
  const form = new FormData();
  form.append("file", new Blob([audio], { type: mime }), filename);
  // `whisper-1` is the only model that accepts `timestamp_granularities[]`;
  // it's cheap and good enough for L2 English scoring.
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  form.append("language", "en");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Whisper transcription failed (${res.status}): ${text}`);
  }

  return (await res.json()) as WhisperResponse;
}

// ─── Claude scoring ─────────────────────────────────────────────────────────

const SCORING_SYSTEM_PROMPT = `You are a friendly Vietnamese English teacher helping a Vietnamese student practice English pronunciation via shadowing.

The student tried to read a target English sentence. A speech-recognition system transcribed what they actually said (it may be imperfect on accent). Compare the transcript to the target and score:

- accuracy_score (0-100): how closely the transcript matches the target (ignore case and trailing punctuation; treat common recognizer slips like "gonna" ↔ "going to" charitably)
- fluency_score (0-100): based on word-level timings — if gaps between words are very long or words run together abnormally, penalize
- overall_score: weighted accuracy:fluency = 70:30

For each target word, return verdict:
- "correct": exact or near-exact match
- "close": minor pronunciation or recognizer slip (e.g. "the" heard as "a")
- "wrong": different word was said
- "missing": nothing was said for this position

Keep vn_feedback SHORT (max 3 Vietnamese sentences), encouraging, and specific (name 1-2 words to practice). Use casual Vietnamese suitable for a Grade 6-10 student.

Return ONLY the tool call.`;

export async function scoreSpeaking(env: Env, params: {
  audio: ArrayBuffer;
  mime: string;
  filename: string;
  targetText: string;
}): Promise<SpeakingVerdict & { transcript: string }> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured on this Worker");
  }

  const whisper = await transcribe(
    env.OPENAI_API_KEY,
    params.audio,
    params.mime,
    params.filename,
  );

  const transcript = (whisper.text ?? "").trim();
  const wordTimings = (whisper.words ?? []).map((w) => ({
    word: w.word,
    start: w.start,
    end: w.end,
  }));

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const tool = {
    name: "emit_verdict",
    description: "Emit the speaking verdict using the required schema.",
    input_schema: zodToJsonSchema(SpeakingVerdictSchema, {
      target: "openApi3",
      $refStrategy: "none",
    }) as Record<string, unknown>,
  };

  const userPrompt = [
    `TARGET: ${params.targetText}`,
    `TRANSCRIPT: ${transcript || "(silence)"}`,
    `WORD_TIMINGS_JSON: ${JSON.stringify(wordTimings)}`,
  ].join("\n\n");

  const maxRetries = 1;
  let lastError: string | null = null;
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: [{ type: "text", text: userPrompt }] },
  ];

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: SCORING_SYSTEM_PROMPT,
      tools: [tool as unknown as Anthropic.Tool],
      tool_choice: { type: "tool", name: "emit_verdict" },
      messages,
    });

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    if (!toolUse) {
      lastError = "Claude did not emit a tool_use block";
      continue;
    }

    const parsed = SpeakingVerdictSchema.safeParse(toolUse.input);
    if (parsed.success) {
      return { ...parsed.data, transcript };
    }
    lastError = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");

    messages.push({ role: "assistant", content: response.content });
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: `Your previous verdict failed schema validation:\n${lastError}\nPlease retry.`,
        },
      ],
    });
  }

  throw new Error(`Scoring failed: ${lastError ?? "unknown"}`);
}
