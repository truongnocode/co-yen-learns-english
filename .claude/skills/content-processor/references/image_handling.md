# Image Handling — Preserve, Place, Persist

The old pipeline dropped source images and generated useless icon-style
placeholders. This version keeps the real bytes from the PDF/DOCX and correlates
them to questions by position. This doc explains how.

## Why preserve originals

A traffic-sign image in a Part B exam is **part of the question**. Replacing it
with a clip-art icon breaks the question. Same for:

- Vocabulary illustrations (pictures of "cat", "bicycle", …)
- Diagrams in reading passages
- Photos of Vietnamese cultural content in "About Vietnam" units
- Charts/tables rendered as images instead of text

## Pipeline

```
PDF / DOCX
  ↓  scripts/extract_pdf.py  (or extract_docx.py)
  ↓
tmp/extract/<stem>/
  ├── source.md        ← markdown WITH inline ![](images/p3-2.png) refs
  ├── source.html      ← (DOCX only) full HTML with <img src="images/…">
  ├── images/          ← real embedded PNG/JPG bytes
  ├── images.json      ← per-image metadata (bbox, size, hash)
  └── extraction.json  ← summary (page count, needs_ocr, etc.)
```

**Key property**: the `![](...)` or `<img>` in the markdown/HTML is placed at
the correct reading-order position. So when the LLM extracts a question that
appears right after an image marker, that image belongs to that question.

## Binding images to JSON fields

The Zod schemas accept an optional `image` field on every MCQ-ish shape:

- `McqSchema.image` — for vocabulary MCQs with an illustration, reading MCQs
  with a chart, etc.
- `SignQuestionSchema.image` — required in practice (the sign IS the image)
- `ReadingPassageSchema.image` — for passages with a header illustration

When writing JSON, copy the `images/filename.png` path **verbatim** from the
source markdown. Do not rename. The path is relative to the extraction output
folder; the final ingest step (Step 6 in SKILL.md) moves files to
`public/data/images/extracted/<grade>/<unit-or-test>/` and rewrites paths.

## Correlation heuristic

When the extractor drops an image but the markdown structure doesn't make its
owner obvious (e.g. two images in a row between two questions), use this
fallback:

1. Read `images.json` for the image's `bbox` (`[x0, y0, x1, y1]`) and `page`.
2. Find the text block whose bbox is closest *vertically* to the image bbox on
   the same page. "Closest vertically" = smallest `|image_y_center − text_y_center|`.
3. If two candidates are within 30px of each other, prefer the one **below**
   the image (reading-order tie-breaker).
4. If still ambiguous, pass the cropped image + surrounding text to Claude
   vision and ask "Which question does this image belong to?".

The Python extractor emits bbox info so you can compute (1)-(3) without
re-opening the PDF.

## Filtering noise

`extract_pdf.py --min-px 60` skips images smaller than 60×60px by default —
this filters bullet dots, horizontal rules, and decorative dividers. Raise to
`--min-px 100` if a textbook has many tiny-but-important icons (rare). Lower
to `--min-px 30` only if a source uses small-but-meaningful glyphs (e.g.
Chinese-style radical drills — not applicable to our SGK).

`extract_pdf.py` also dedupes by SHA-256: if the same logo appears on every
page header, you get **one** file on disk, not fifty.

## Ingest into `public/data/images/`

After validation passes, copy the extracted images into the app's public
folder with a stable naming convention:

```
public/data/images/extracted/
  grade10/test3/
    sign-1.png
    sign-2.png
    reading1-hero.png
  sgk7/unit3/
    vocab-hero.png
```

Then **rewrite the `image` paths** in your JSON from
`images/p3-2.png` (extraction-relative) to
`data/images/extracted/grade10/test3/sign-1.png` (webapp-relative).

The SKILL.md Step 6 script does this rewrite; you (the LLM) shouldn't hand-edit
paths once the ingest is automated.

## When extraction fails

If `extraction.json.image_files_kept == 0` but the source clearly has images:

- Check `needs_ocr`: if true, the source is scanned — images ARE the text.
  Route through OCR (future work — Surya OCR is the planned tool).
- Check `--min-px`: lower it and retry.
- Try the DOCX path if a PDF export failed; mammoth tends to be more
  forgiving on images embedded as OLE objects.
- As a last resort: ask the user for a higher-quality source (scanned-to-PDF
  vs. export-to-PDF from Word makes a big difference).

## Do NOT regenerate

The previous pipeline called an image-generation API ("give me an icon for
'no swimming'") and dumped results into `public/images/signs/`. Do NOT do
this. If an image is missing from the source:

1. Ask the user to provide a better source file, OR
2. Leave the `image` field unset in the JSON — the UI gracefully falls back
   to text-only rendering.

The **only** exception is the legacy `public/images/signs/` folder, which
retains its hand-curated icons for Grade 10 exam questions authored before
v2. New content must use source-extracted images.

## License reminder

Images extracted from copyrighted textbooks stay on the teacher's local
machine and get served to her students via the app — this is the same
use-case as photocopying the textbook for class, covered by Vietnamese
education fair-use norms for this deployment. Don't publish raw images to
public channels (GitHub issues, blog posts, etc.) without stripping / replacing.
