# Prompt Patterns — One Content Type at a Time

When extracting, do **one content type per pass**, not all at once. Mixed
prompts hallucinate structure. This file is the playbook for what to focus on,
in what order, and how to self-check.

## The golden rule

> **Schema first, prose second.** Before you write any JSON, read the target
> schema in [src/lib/content-schema.ts](../../../../src/lib/content-schema.ts)
> for that content kind. Then produce JSON. Then validate with
> `scripts/validate.ts`. If it fails, fix it in place before writing to
> `public/data/`.

## Pass order for a full textbook unit

1. **Title + metadata** — unit number, title, theme, grammar targets.
2. **Vocabulary** — extract ALL word entries from the word list first, then
   supplement if below 35.
3. **Grammar notes** — write the 200-500 word Vietnamese explanation now,
   while the unit's rules are fresh in context.
4. **Exercises (MCQ)** — extract every MCQ from the source, then generate
   supplementary until ≥ 20.
5. **Validate** — run `bun scripts/validate.ts out.json --kind sgk_unit`.
6. **Merge** — read existing `sgk_eng{N}_data.json`, add under `units.{key}`,
   write back.

Do NOT interleave: finishing vocabulary before starting exercises prevents
"mystery vocab" from showing up in exercises that isn't in the vocab list.

## Pass order for a mock exam

1. **Exam shell** — title, grade, part structure (A/B/C).
2. **Part A MCQs** — usually 20 single-sentence grammar/vocab items.
3. **Part B cloze** — passage verbatim + numbered questions.
4. **Part B signs** — each sign is its own `SignQuestionSchema`; bind images
   by adjacency (see [image_handling.md](image_handling.md)).
5. **Part B reading 1 + 2** — passages verbatim + 5 questions each.
6. **Part C** — arrange paragraph, arrange words, fill-in, writing prompt.
7. **Validate + merge** into `grade10_tests.json` under a new `testN` key.

## Per-type focus checklist

### MCQ (`McqSchema`)

- [ ] Exactly 4 `opts`, no empty strings
- [ ] `ans` is 0..3 and **correct** — verify by grammar/vocab rule
- [ ] `explain` in Vietnamese, 1-2 sentences, names the rule
- [ ] No duplicate options, no obvious throwaways
- [ ] Question text copied verbatim (don't "fix typos" unless asked)

### Vocabulary (`VocabItemSchema`)

- [ ] `en` lowercase unless a proper noun
- [ ] `ipa` in /slash/ notation, British or American — pick one consistent
      dialect per textbook series (SGK Global Success = British)
- [ ] `type` ∈ {`n`, `v`, `adj`, `adv`, `prep`, `idiom`, `conj`, `det`,
      `phr`, `v phr`, `n/v`, `v/n`, `n/adj`, `adj/n`, `adj/adv`}
      — use combinations only when the word genuinely fills both roles in the unit
- [ ] `vi` is the Vietnamese gloss, not a translation of an example sentence
- [ ] No duplicates within the unit (case-insensitive)

### Reading passage (`ReadingPassageSchema`)

- [ ] `passage` **verbatim** (whitespace normalized, nothing else)
- [ ] ≥ 1 question, each a valid `McqSchema`
- [ ] `title` is either the source heading or a short English summary if none

### Cloze (`partB.cloze`)

- [ ] `passage` keeps `(1) _____`, `(2) _____`, … blanks intact
- [ ] Question count === blank count
- [ ] Each `q` is `"Question N"` when source only numbers options

### Sign question (`SignQuestionSchema`)

- [ ] `sign` is the visible text inside the sign image (if any)
- [ ] `image` is the exact relative path from the extractor's markdown
- [ ] Question asks what the sign means / where it would appear

### Sentence rearrange (`ArrangeWordsSchema` / `ArrangeParagraphSchema`)

- [ ] `words` uses ` / ` as separator between tokens
- [ ] `answer` has both punctuated and unpunctuated variants
- [ ] Source ordering of sentences preserved in `num` field when numbered

### Writing prompt (`WritingPromptSchema`)

- [ ] `prompt` ≥ 10 chars, includes the full question
- [ ] `wordCount` present if source specifies ("120-150 words" → keep string)
- [ ] `suggestions` only if source has hints/outline; don't invent

## Self-correction loop

If `validate.ts` reports errors:

1. Read the failures array. Each entry has `label` and `errors`.
2. For each error, locate the offending field in your JSON.
3. Fix in place — do NOT re-extract from scratch.
4. Re-run `validate.ts`.
5. Repeat up to 3 times. If still failing, stop and report to user — the
    schema may have diverged or source is ambiguous.

## Cost-conscious tips

- Feed the extractor output directly (markdown) — don't re-read the PDF.
- For very long sources, split by section (use the `## Part A`, `## Part B`
  headings the extractor emits) and process sections independently.
- When a run is idempotent (see SKILL.md Step 4), skip re-extraction by
  checking the target file first.

## When to ask the user

Ask a clarifying question (not write tentative JSON) when:

- The source has **no grade marker** and you can't tell from content whether
  it's Grade 6 or Grade 9.
- A unit's **structure is non-standard** (e.g. 3 reading passages, or writing
  section before MCQ) — ask where each piece should map in the schema.
- The **answer key is missing** AND the questions have ambiguous correct
  answers (common in draft worksheets).
- An image is clearly part of a question but the extractor missed it —
  suggest re-running `extract_pdf.py` with lower `--min-px` first.
