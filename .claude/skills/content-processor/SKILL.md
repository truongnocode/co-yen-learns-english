---
name: content-processor
description: >
  Process educational documents (PDF, DOCX, XLSX) into structured JSON for the
  co-yen-learns-english web app. Extracts vocabulary, grammar, exercises, reading passages,
  and mock exams from textbook files (SGK iLearn Smart Start grades 3-5, Global Success
  grades 6-9, Grade 10 prep) and outputs JSON that matches the Zod schemas in
  `src/lib/content-schema.ts`. Also generates supplementary exercises when source
  material is thin. Trigger this skill when the user mentions: "xử lý tài liệu",
  "import sách", "chuyển đổi nội dung", "process content", "import textbook",
  "nhập dữ liệu bài học", "xử lý file sách", "thêm đề thi", "thêm unit", "cập nhật dữ
  liệu sách", "add exam", "add lesson data", or drops a PDF/DOCX/XLSX with English
  textbook content. Even casual requests like "xử lý cái này cho tôi" or "thêm vào
  trang web" should trigger this skill.
---

# Content Processor — Docs to JSON Pipeline

You are a content-extraction engine for co-yen-learns-english. Your job: take raw
educational documents and produce structured JSON that the React app can consume
directly (either via Firestore after admin upload, or by merging into the legacy
`public/data/*.json` files).

## When this skill runs

Two entry points:

1. **Admin panel (production)** — the teacher uploads a file at `/admin/import`.
   The Cloudflare Worker `workers/content-importer` calls Claude with
   `output_format: json_schema`, validates the result with Zod, and returns a
   preview to the admin UI. **You (the skill) are not invoked in this path.**

2. **Local batch (this skill)** — the user runs Claude Code in the repo with a
   stack of files. You read them, produce JSON, and either:
   - Save to `public/data/*.json` (bootstrap/fallback dataset), or
   - Write to Firestore via the helper at `scripts/seed-firestore.ts`.

Both paths produce JSON matching the same schemas.

## Step 1 — Read the source

- **PDF** → use the `/pdf` skill
- **DOCX** → use the `/docx` skill
- **XLSX** → use the `/xlsx` skill
- **Raw text** → skip file reading

For long files, feed the file reference directly rather than dumping the whole
extracted text into prompts — keeps token usage down and quality up.

## Step 2 — Classify content type

Scan the source and decide which Zod schema from `src/lib/content-schema.ts` applies:

| Source | Schema | Output location |
|---|---|---|
| Full mock exam (40Q, parts A/B/C) | `ExamSchema` | `public/data/grade10_tests.json` → add new `testN` key |
| SGK unit (grades 3-9) | `SgkUnitSchema` | `public/data/sgk_eng{grade}_data.json` → add to `units` map |
| Grade 10 vocabulary topic | `Grade10VocabTopicSchema` | `public/data/grade10_vocab.json` → add topic key |
| Grade 10 grammar topic | `Grade10GrammarTopicSchema` | `public/data/grade10_grammar.json` → add topic key |
| Reading comprehension only | `ReadingPassageSchema[]` | `public/data/grade10_reading.json` |
| Writing prompts only | `WritingPromptSchema[]` | `public/data/grade10_writing.json` |
| Raw vocab list | `VocabItem[]` | Needs unit assignment — ask user |

If ambiguous, ask: "Nội dung này thuộc lớp mấy và loại gì (đề thi / unit SGK / vocab /
grammar)?"

## Step 3 — Extract with Claude's structured output

**When working server-side (Worker)**: pass the raw file bytes + the JSON Schema
derived from the Zod schema. Claude's `output_format: json_schema` enforces the
shape, so you mostly need a good system prompt and examples.

**When working as this skill in Claude Code**: you ARE the extraction engine. Produce
JSON directly matching the schema. After generation, you MUST run `z.safeParse()` in
your head (or via a small test script) against the schema — if any field fails, fix
it before writing.

### Required validations

Every output must pass these checks:

1. **MCQ shape**: exactly 4 `opts`, `ans` ∈ 0..3, and `ans` points to the genuinely
   correct option (verify against grammar rules).
2. **No empty strings** in required fields (`q`, `en`, `vi`, `title`, `passage`).
3. **Passages verbatim**: reading/cloze text is copied without paraphrasing.
4. **Vietnamese explanations**: every MCQ's `explain` field is in Vietnamese, 1-2
   sentences, says why the correct answer is right. Add explanations for questions
   that are missing them in the source.
5. **No duplicates** within the same unit/exam.
6. **Vocabulary `type`** only uses enum values from the schema: `n`, `v`, `adj`, `adv`,
   `prep`, `idiom`, `n/v`, `v/n`, `v phr`, `phr`, `conj`, `det`.

### Minimum counts per SGK unit

If source is thin, **generate supplementary items** to hit these floors:

- Vocabulary: 35 items
- Exercises: 20 MCQ
- Grammar notes: 200-500 words Vietnamese with examples

Supplementary items must stay within the unit's topic and grammar scope — do not
drift to unrelated vocabulary.

## Step 4 — Merge, don't overwrite

Read the existing JSON file from `public/data/` first, merge the new content, and
write back.

**Never overwrite** existing keys unless the user explicitly says "replace test2" or
similar. Default: add alongside. This is also a project rule
(`feedback_no_delete_data` in user memory).

**Idempotent runs**: before generating a unit, check if the target unit key already
exists in the output file with non-trivial content. If yes, skip (log "already
processed, skipping"). This matches the `feedback_skip_existing` rule.

## Step 5 — Report

```
✓ Processed: [filename]
  Kind: [exam | sgk_unit | grade10_vocab | grade10_grammar]
  Grade: [N] | Unit/Test: [id]
  Stats: [N vocab, N MCQ, N reading passages, ...]
  Output: public/data/[filename].json
  Generated (supplementary): [N items — always reported when > 0]
```

If anything was generated (not from source), always call it out so the teacher can
review.

## References

- Authoritative schemas: [src/lib/content-schema.ts](../../../src/lib/content-schema.ts)
- App types: [src/data/types.ts](../../../src/data/types.ts)
- Existing data files (read for format examples):
  - `public/data/sgk_eng6_data.json` — SGK unit format
  - `public/data/grade10_vocab.json` — Grade 10 vocab
  - `public/data/grade10_grammar.json` — Grade 10 grammar
  - `public/data/grade10_tests.json` — Mock exam
  - `public/data/grade10_reading.json` — Reading
  - `public/data/grade10_writing.json` — Writing prompts
