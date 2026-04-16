---
name: content-processor
description: >
  Process Vietnamese English-textbook PDFs, DOCX, and XLSX files into structured JSON
  for the co-yen-learns-english web app (tienganhcoyen.online). Covers SGK iLearn
  Smart Start grades 3-5, SGK Global Success grades 6-9, and Grade 10 prep materials.
  Extracts vocabulary, grammar notes, MCQ exercises, reading passages, cloze tests,
  sentence-rearrange items, and mock exams. PRESERVES embedded images (signs, diagrams,
  vocabulary illustrations) and binds them to the correct questions. Validates output
  against the project's Zod schemas before writing. Trigger on: "xử lý tài liệu",
  "import sách", "chuyển đổi nội dung", "thêm đề thi", "thêm unit", "process content",
  "import textbook", "add lesson data", "add exam", or when the user drops a PDF/DOCX/XLSX.
  Casual prompts like "xử lý cái này cho tôi" or "thêm vào trang web" should also trigger.
---

# Content Processor — Textbook to JSON Pipeline

You are the content-extraction engine for co-yen-learns-english, running inside Claude
Code. Your job: take raw educational documents and produce structured JSON the React
app can consume directly, with **real embedded images preserved** (no auto-generated
placeholder icons).

**You ARE the extraction brain.** Helper scripts handle the mechanical work (PDF/DOCX
parsing, image extraction, schema validation); you do the classification, structuring,
explanation-writing, and supplementary generation.

## Prerequisites (first run only)

Install Python deps for the extractor scripts (one-time):

```bash
pip install -r .claude/skills/content-processor/requirements.txt
```

This installs `pymupdf4llm` (PDF), `mammoth` (DOCX), `pillow`, `beautifulsoup4`. All
work on Windows with no GPU.

Bun is already the project's runtime — no extra install needed for `validate.ts`.

## The 7 steps

### Step 1 — Run the extractor

Produce markdown + real images from the source file:

```bash
# PDF
python .claude/skills/content-processor/scripts/extract_pdf.py <input.pdf>

# DOCX
python .claude/skills/content-processor/scripts/extract_docx.py <input.docx>

# XLSX
# Use the built-in /xlsx skill — no custom wrapper needed.
```

Output lands in `tmp/extract/<stem>/`:
- `source.md` — markdown with `![](images/…)` placeholders at correct positions
- `images/` — real PNG/JPG files extracted from the document
- `images.json` — per-image metadata (bbox, size, SHA-256)
- `extraction.json` — summary + `needs_ocr` flag if source is scanned

Read `extraction.json` first. If `needs_ocr: true`, the source is scanned — stop and
tell the user to provide a text-layer PDF or export from Word (scanned OCR is a future
enhancement).

If the user pasted raw text instead of a file, skip this step.

### Step 2 — Classify the content type

Scan `source.md` and pick ONE schema from
[src/lib/content-schema.ts](../../src/lib/content-schema.ts):

| Source looks like | Schema | Output target |
|---|---|---|
| SGK unit (grades 3-9), title + vocab + grammar + exercises | `SgkUnitSchema` | `public/data/sgk_eng{grade}_data.json` → `units.{key}` |
| Mock exam with Parts A/B/C | `ExamSchema` | `public/data/grade10_tests.json` → new `testN` key |
| Grade 10 vocab topic (MCQ-only) | `Grade10VocabTopicSchema` | `public/data/grade10_vocab.json` → hierarchical key e.g. `"1.1.1"` |
| Grade 10 grammar topic (MCQ+rearrange+completion+rewrite) | `Grade10GrammarTopicSchema` | `public/data/grade10_grammar.json` → key e.g. `"2.1"` |
| Reading passages only | `ReadingPassageSchema[]` | `public/data/grade10_reading.json` |
| Writing prompts only | `WritingPromptSchema[]` | `public/data/grade10_writing.json` |
| Raw word list, no structure | `VocabItem[]` | Ask user where to merge |

If unclear, ask: **"Nội dung này thuộc lớp mấy và loại gì (đề thi / unit SGK / vocab /
grammar)?"**

### Step 3 — Extract per content type

Process **one content type at a time**, in this order for full units/exams:

1. Title + metadata
2. Vocabulary list (all items from source first, then supplement to ≥ 35)
3. Grammar notes (Vietnamese, 200-500 words, with examples)
4. Exercises (extract from source first, then supplement MCQ to ≥ 20)
5. Reading passages (verbatim, no paraphrase)
6. Writing prompts

**Full playbook + per-type checklist**: [references/prompt_patterns.md](references/prompt_patterns.md)

**Fully-worked examples to match**: [references/extraction_examples.md](references/extraction_examples.md)

### Step 4 — Handle images

When the markdown has `![](images/p3-2.png)` right before a question, that image
belongs to that question. Copy the path into the appropriate schema field:

- `McqSchema.image` — question references a diagram/illustration
- `SignQuestionSchema.image` — exam sign questions (always set)
- `ReadingPassageSchema.image` — passage header illustration

**Full binding rules + fallback heuristics**: [references/image_handling.md](references/image_handling.md)

**Never auto-generate icons**. If an image is missing from the source, leave the
`image` field unset — the UI falls back to text-only rendering.

### Step 5 — Validate

Before writing to `public/data/`, run:

```bash
bun .claude/skills/content-processor/scripts/validate.ts <output.json> --kind <kind>
```

Where `<kind>` is one of: `exam | sgk_unit | grade10_vocab | grade10_grammar | reading | writing | vocab_list`.

Exit 0 = safe to write. Exit 1 = fix the reported errors and re-validate. Do not
write a file that fails validation.

### Step 6 — Merge + persist images

**Idempotent check first**: read the target JSON file. If the target key already
exists with non-trivial content, skip (log `"already processed, skipping"`). To force
re-generation, the user must explicitly say "replace" or "overwrite".

**Never overwrite** existing keys. Default behavior is ADD alongside. (Matches global
rules `feedback_no_delete_data` and `feedback_skip_existing`.)

Then:

1. Copy images from `tmp/extract/<stem>/images/*` to a stable webapp location:
   - SGK: `public/data/images/extracted/sgk{grade}/unit{key}/`
   - Exam: `public/data/images/extracted/grade10/test{N}/`
   - Vocab topic: `public/data/images/extracted/grade10/vocab-{key}/`
   - Grammar topic: `public/data/images/extracted/grade10/grammar-{key}/`
2. Rewrite `image` paths in the JSON from `images/p3-2.png` → `data/images/extracted/<folder>/<stable-name>.png`.
3. Merge the JSON entry into the target file.
4. Write the file back.

### Step 7 — Report

```
✓ Đã xử lý: <filename>
  Loại: <kind>
  Lớp: <N>  |  Unit/Test/Topic: <key>
  Từ vựng: <N items>  Bài tập: <N MCQ>  Reading: <N>  Writing: <N>
  Ảnh giữ lại: <N files>  →  public/data/images/extracted/<folder>/
  Output: public/data/<filename>.json
  Đã bổ sung (generated): <N items — call out when > 0>
  Validate: ok
```

If you generated supplementary items (not from source), **always say so** so the
teacher can review before pushing to Firestore.

## Pushing to Firestore (optional)

After `public/data/*.json` is updated, the user may want the new content live:

```bash
node scripts/migrate-json-to-firestore.mjs
```

Uses `setIfMissing` — safe to re-run, won't overwrite existing Firestore docs.

Images in `public/data/images/extracted/` ship with the static build (GitHub Pages
deploy) — no separate CDN step needed.

## References (bundled with the skill)

- [references/extraction_examples.md](references/extraction_examples.md) — fully-worked examples for each schema kind
- [references/prompt_patterns.md](references/prompt_patterns.md) — per-type checklists + self-correction loop
- [references/image_handling.md](references/image_handling.md) — bbox correlation, filtering, ingest

## External references (project files)

- **Authoritative Zod schemas** → [src/lib/content-schema.ts](../../src/lib/content-schema.ts)
- **Runtime types** → [src/data/types.ts](../../src/data/types.ts)
- **Firestore seed script** → [scripts/migrate-json-to-firestore.mjs](../../scripts/migrate-json-to-firestore.mjs)
- **Existing data files (format examples)**:
  - `public/data/sgk_eng6_data.json` — SGK unit format
  - `public/data/grade10_tests.json` — mock exam format
  - `public/data/grade10_vocab.json` — vocab topic format
  - `public/data/grade10_grammar.json` — grammar topic format
  - `public/data/grade10_reading.json` — reading passages
  - `public/data/grade10_writing.json` — writing prompts
