/**
 * AI speaking scoring for the Shadowing game — powered by Gemini.
 *
 * Gemini 2.0 Flash accepts audio natively, so we do it in one API call
 * (no separate transcription step). The model hears the audio, compares it to
 * the target sentence, and emits a structured JSON verdict.
 */

import { z } from "zod";
import type { Env } from "./env";
import { generateStructured, GeminiError } from "./gemini";

// ─── Schema returned to the client ──────────────────────────────────────────

export const SpeakingVerdictSchema = z.object({
  overall_score: z
    .number()
    .min(0)
    .max(100)
    .describe("0-100 accuracy+fluency score for the whole utterance"),
  accuracy_score: z.number().min(0).max(100),
  fluency_score: z.number().min(0).max(100),
  transcript: z
    .string()
    .describe("What the model heard the student say, in English"),
  words: z
    .array(
      z.object({
        target: z.string().describe("The target word (from the reference sentence)"),
        heard: z
          .string()
          .describe("What was heard at this position, or empty string if missing"),
        verdict: z.enum(["correct", "close", "wrong", "missing"]),
        tip: z.string().describe("Short pronunciation tip in Vietnamese; empty string if correct"),
      }),
    )
    .describe("Per-target-word verdicts, in target order"),
  extra_words: z
    .array(z.string())
    .describe("Words the student said that are NOT in the target"),
  vn_feedback: z
    .string()
    .describe("2-3 sentence Vietnamese feedback, encouraging but specific"),
});

export type SpeakingVerdict = z.infer<typeof SpeakingVerdictSchema>;

const SCORING_SYSTEM_PROMPT = `You are a friendly Vietnamese English teacher helping a Vietnamese student practice English pronunciation via shadowing.

You will receive:
- An audio recording of the student reading an English sentence
- The target English sentence they were trying to say

Listen to the audio and compare to the target. Score:
- accuracy_score (0-100): how closely the spoken words match the target (ignore case/trailing punctuation; treat "gonna"↔"going to" charitably)
- fluency_score (0-100): natural pacing, clear word boundaries, few long pauses, no stammering
- overall_score: weighted accuracy:fluency = 70:30

For each target word, emit a verdict:
- "correct": pronounced clearly and accurately
- "close": recognizable but with noticeable accent/pronunciation issue
- "wrong": a different word was said
- "missing": the student skipped this word

Provide a "heard" field for each target word with what you actually heard (empty string if missing).

Also emit a "transcript" field with the full English transcription of what the student said.

Keep vn_feedback SHORT (max 3 Vietnamese sentences), encouraging, and specific — name 1-2 words to practice. Use casual Vietnamese suitable for a Grade 6-10 student (e.g. "em" / "con").`;

function bytesToBase64(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  // Chunked conversion to avoid stack overflow on large arrays.
  const CHUNK = 0x8000;
  let bin = "";
  for (let i = 0; i < arr.length; i += CHUNK) {
    bin += String.fromCharCode(...arr.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export async function scoreSpeaking(env: Env, params: {
  audio: ArrayBuffer;
  mime: string;
  filename: string;
  targetText: string;
}): Promise<SpeakingVerdict> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured on this Worker");
  }

  // Inline audio (<20MB is fine for Gemini; we cap at 10MB upstream anyway).
  const audioBase64 = bytesToBase64(params.audio);

  const parts = [
    {
      inlineData: {
        mimeType: params.mime,
        data: audioBase64,
      },
    },
    {
      text: `TARGET SENTENCE:\n${params.targetText}\n\nListen to the audio and score the student's pronunciation against this target.`,
    },
  ];

  try {
    const { data } = await generateStructured({
      apiKey: env.GEMINI_API_KEY,
      schema: SpeakingVerdictSchema,
      systemPrompt: SCORING_SYSTEM_PROMPT,
      parts,
      maxRetries: 1,
    });
    return data;
  } catch (e) {
    if (e instanceof GeminiError) throw e;
    throw new Error(`Speaking scoring failed: ${(e as Error).message}`);
  }
}
