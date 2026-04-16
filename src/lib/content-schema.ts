/**
 * Content import schema — Zod + TypeScript types used by the admin import pipeline.
 *
 * These schemas are shared between:
 *  - Cloudflare Worker (`workers/content-importer`) — validates Claude's structured output
 *    before returning preview to the admin UI.
 *  - Admin UI (`src/pages/admin/ImportExam.tsx`) — drives the preview/edit form.
 *  - The content-processor skill (`.claude/skills/content-processor`) — authoring guidance.
 *
 * These intentionally mirror but do NOT replace `src/data/types.ts`, which is the runtime
 * contract for the student-facing app. When schema shapes diverge, add a small mapper
 * in `src/lib/content-loader.ts` rather than coupling the two.
 */

import { z } from "zod";

// ─── Primitives ─────────────────────────────────────────────────────────────

export const McqSchema = z.object({
  q: z.string().min(1).describe("Question text, may contain '______' for cloze blanks"),
  opts: z.array(z.string().min(1)).length(4).describe("Exactly 4 options A/B/C/D"),
  ans: z.number().int().min(0).max(3).describe("Index of correct option (0=A, 3=D)"),
  explain: z
    .string()
    .optional()
    .describe("Short Vietnamese explanation of why the correct answer is right"),
  image: z
    .string()
    .optional()
    .describe(
      "Optional path to a source-extracted image that belongs to this question, " +
        "relative to public/ (e.g. 'data/images/extracted/grade10/test3/vocab-5.png'). " +
        "Set when the question references a diagram, chart, or illustration.",
    ),
});
export type Mcq = z.infer<typeof McqSchema>;

export const VocabItemSchema = z.object({
  en: z.string().min(1),
  ipa: z.string().optional().describe("IPA pronunciation, e.g. '/ˈɑːtɪzæn/'"),
  type: z
    .enum([
      "n",
      "v",
      "adj",
      "adv",
      "prep",
      "idiom",
      "conj",
      "det",
      "phr",
      "v phr",
      "n/v",
      "v/n",
      "n/adj",
      "adj/n",
      "adj/adv",
    ])
    .describe("Word class"),
  vi: z.string().min(1).describe("Vietnamese meaning"),
});
export type VocabItem = z.infer<typeof VocabItemSchema>;

export const FreeAnswerQuestionSchema = z.object({
  q: z.string().min(1),
  answer: z
    .array(z.string().min(1))
    .min(1)
    .describe("List of acceptable answer variants for string matching"),
});
export type FreeAnswerQuestion = z.infer<typeof FreeAnswerQuestionSchema>;

// ─── Exam building blocks ───────────────────────────────────────────────────

export const ReadingPassageSchema = z.object({
  title: z.string().min(1),
  passage: z.string().min(20),
  image: z
    .string()
    .optional()
    .describe(
      "Optional header illustration extracted from the source PDF, relative to public/ " +
        "(e.g. 'data/images/extracted/grade10/test3/reading1-hero.png').",
    ),
  questions: z.array(McqSchema).min(1),
});
export type ReadingPassage = z.infer<typeof ReadingPassageSchema>;

export const SignQuestionSchema = z.object({
  sign: z.string().describe("Sign text or emoji, may contain <b>...</b> HTML for bold"),
  image: z
    .string()
    .optional()
    .describe(
      "Path to the extracted sign image, relative to public/ " +
        "(e.g. 'data/images/extracted/grade10/test3/sign-1.png'). " +
        "Prefer this over the legacy 'images/signs/*.png' icons for source-based content.",
    ),
  q: z.string(),
  opts: z.array(z.string()).length(4),
  ans: z.number().int().min(0).max(3),
  explain: z.string().optional(),
});
export type SignQuestion = z.infer<typeof SignQuestionSchema>;

export const ArrangeParagraphSchema = z.object({
  num: z.number().int().optional(),
  sentences: z
    .array(z.string().min(1))
    .min(3)
    .describe("Jumbled sentences, each prefixed with its letter key (e.g. 'a. First sentence')"),
  answer: z
    .array(z.string().min(1))
    .optional()
    .describe("Correct order as letter keys, e.g. ['b','d','a','c','e']"),
});
export type ArrangeParagraph = z.infer<typeof ArrangeParagraphSchema>;

export const ArrangeWordsSchema = z.object({
  num: z.number().int().optional(),
  words: z.string().min(1).describe("Scrambled words separated by ' / '"),
  answer: z.string().min(1).describe("Correctly arranged sentence"),
});
export type ArrangeWords = z.infer<typeof ArrangeWordsSchema>;

export const FillInSchema = z.object({
  num: z.number().int().optional(),
  q: z.string().min(1),
  answer: z.array(z.string().min(1)).min(1),
});
export type FillIn = z.infer<typeof FillInSchema>;

export const WritingPromptSchema = z.object({
  num: z.number().int().optional(),
  prompt: z.string().min(10),
  suggestions: z.array(z.string()).optional(),
  /** Word-count target for free writing (e.g. "100-120 words"). */
  wordCount: z.string().optional(),
});
export type WritingPrompt = z.infer<typeof WritingPromptSchema>;

// ─── Full exam ──────────────────────────────────────────────────────────────

export const ExamPartASchema = z.object({
  instruction: z.string().min(1),
  questions: z.array(McqSchema).min(1),
});

export const ExamPartBSchema = z.object({
  cloze: z
    .object({
      passage: z.string().min(20),
      questions: z.array(McqSchema).min(1),
    })
    .optional(),
  signs: z.array(SignQuestionSchema).optional(),
  reading1: ReadingPassageSchema.optional(),
  reading2: ReadingPassageSchema.optional(),
});

export const ExamPartCSchema = z.object({
  arrange_paragraph: z.array(ArrangeParagraphSchema).optional(),
  arrange_words: z.array(ArrangeWordsSchema).optional(),
  fill_in: z.array(FillInSchema).optional(),
  writing: WritingPromptSchema.optional(),
});

export const ExamSchema = z.object({
  title: z.string().min(1),
  grade: z
    .number()
    .int()
    .min(3)
    .max(12)
    .optional()
    .describe(
      "Target grade level. Optional for legacy grade10_tests.json entries (implicitly 10); " +
        "new imports should always set this.",
    ),
  partA: ExamPartASchema,
  partB: ExamPartBSchema,
  partC: ExamPartCSchema.optional(),
});
export type Exam = z.infer<typeof ExamSchema>;

// ─── Non-exam content types ─────────────────────────────────────────────────

export const SgkUnitSchema = z.object({
  title: z.string().min(1),
  vocabulary: z.array(VocabItemSchema).min(1),
  grammar: z.array(z.string()).optional(),
  grammar_notes: z.string().optional().describe("Vietnamese grammar notes, 200-500 words"),
  exercises: z.array(McqSchema).min(1),
});
export type SgkUnit = z.infer<typeof SgkUnitSchema>;

export const Grade10VocabTopicSchema = z.object({
  name: z.string().min(1),
  questions: z.array(McqSchema).min(1),
});
export type Grade10VocabTopic = z.infer<typeof Grade10VocabTopicSchema>;

export const Grade10GrammarExercisesSchema = z.object({
  mcq: z
    .object({
      instruction: z.string(),
      questions: z.array(McqSchema),
    })
    .optional(),
  rearrange: z
    .object({
      instruction: z.string(),
      questions: z.array(FreeAnswerQuestionSchema),
    })
    .optional(),
  completion: z
    .object({
      instruction: z.string(),
      questions: z.array(FreeAnswerQuestionSchema),
    })
    .optional(),
  rewrite: z
    .object({
      instruction: z.string(),
      questions: z.array(FreeAnswerQuestionSchema),
    })
    .optional(),
});

export const Grade10GrammarTopicSchema = z.object({
  name: z.string().min(1),
  exercises: Grade10GrammarExercisesSchema,
});
export type Grade10GrammarTopic = z.infer<typeof Grade10GrammarTopicSchema>;

// ─── Discriminated import result ────────────────────────────────────────────

export const ContentKind = {
  Exam: "exam",
  SgkUnit: "sgk_unit",
  Grade10Vocab: "grade10_vocab",
  Grade10Grammar: "grade10_grammar",
} as const;
export type ContentKind = (typeof ContentKind)[keyof typeof ContentKind];

export const ImportResultSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal(ContentKind.Exam),
    exam: ExamSchema,
  }),
  z.object({
    kind: z.literal(ContentKind.SgkUnit),
    grade: z.number().int().min(3).max(9),
    unitKey: z.string().describe("Numeric unit key as string, e.g. '0', '1', '2'"),
    unit: SgkUnitSchema,
  }),
  z.object({
    kind: z.literal(ContentKind.Grade10Vocab),
    topicId: z.string(),
    topic: Grade10VocabTopicSchema,
  }),
  z.object({
    kind: z.literal(ContentKind.Grade10Grammar),
    topicId: z.string(),
    topic: Grade10GrammarTopicSchema,
  }),
]);
export type ImportResult = z.infer<typeof ImportResultSchema>;

/**
 * The minimum fields Claude needs to return for the admin panel preview.
 * The Worker validates against this schema with `.safeParse()` and asks Claude
 * to self-correct if validation fails.
 */
export const EXAM_IMPORT_SYSTEM_PROMPT = `You are a content extraction engine for an English-learning platform used by Vietnamese students (grades 3-10).

Given a Word or PDF exam paper, extract every question into the exact JSON shape the schema requires. Rules:

1. **Every MCQ has exactly 4 options** and the "ans" index points to the CORRECT option (0=A, 1=B, 2=C, 3=D).
2. **Add a short Vietnamese "explain"** for each MCQ: explain why the correct answer is right, 1-2 sentences.
3. **Preserve original question numbering** where possible (the "num" field for Part C items).
4. **Keep passages verbatim** — do not paraphrase reading or cloze text.
5. **Infer the grade level** from exam title, vocabulary difficulty, and question type (Grade 10 exams typically have a cloze + 2 reading passages + Part C writing).
6. **If the source is ambiguous** (e.g. missing answer key), mark "ans" as your best inference based on grammar/vocabulary rules, and note any uncertainty in "explain".
7. **Do not invent content** that is not in the source. If a section is missing, omit the optional field rather than fabricating.

Return valid JSON matching the provided schema exactly.`;
