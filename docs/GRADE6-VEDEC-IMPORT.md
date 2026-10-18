# Grade 6 VEDEC midterm practice

Public entry: `/grade/6/tests`. Individual papers: `/grade/6/tests/vedec-2026-01` through `18`.
The home page, grade 6 page and grade 6 practice hub link to the collection.
Shared exam links work without onboarding; other learning routes keep their existing rules.

## Content and source fidelity

The teacher supplied 18 exam DOCX files, 18 answer DOCX files and 31 audio files.
The importer reads OOXML directly, preserving question text, underlines, bold, pictures,
reading passages, word banks and writing/speaking prompts. It resolves Word numbering,
table rows and column-based multiple-choice layouts. Empty paper answer lines are omitted.
Original source files are not modified or committed.

`scripts/import-grade6-vedec.py SOURCE_FOLDER --audio` regenerates
`public/data/grade6-midterm`. Review its report in `tmp/grade6-import/review.txt`.
The reviewed amendments in `scripts/grade6-vedec-overrides.json` are part of the import,
not manual changes to generated JSON. Input hashes are retained with each paper and track.
The current collection has 671 answer controls: 643 automatically scored questions,
22 writing/speaking exercises and six questions excluded because of source ambiguity.

The 31 complete recordings are converted to MP3 for browser playback, including WAV/WMA
inputs. Audio is never trimmed, speed-adjusted or replaced with speech synthesis.
All 31 output files decode without errors; source/output duration differences are less
than one second. Total audio size is approximately 45.8 MiB. Paper 14's source filenames
are reversed relative to its listening sections: the Nam interview plays first, then
Mai's house recording. Both original filenames and hashes are recorded in its JSON.
All 11 distinct source pictures are retained as PNGs.

## Learning and assessment

- Practice mode reveals feedback immediately for choices and on request for typed answers.
- Test mode permits changes and reveals feedback only after confirmed submission.
- An incomplete submission requires confirmation. Unanswered scored questions earn no credit.
- Each paper and mode has its own local attempt. Reloading restores answers and results.
  No student responses or identity data are sent to a server by this feature.
- Paragraph writing and speaking remain available with text areas and reference/rubric
  material where supplied. They are not automatically marked against a single sentence.
- Short-answer marking accepts reviewed alternatives, case, terminal punctuation,
  apostrophe and contraction variants. It does not infer semantic equivalence.
  Feedback says the response does not match the sample, rather than claiming every
  unrecognized phrasing is ungrammatical.
- The displayed score is a practice conversion to 10 with equal question weights.
  It explicitly excludes manual/ambiguous questions and is not the original paper's total.

## Source corrections and exclusions

The original paper/key wording is retained in the reference material unless a correction
would otherwise present a demonstrably wrong answer. The reviewed exceptions include:

- Paper 2 has duplicate “getting” choices; both C and D are accepted.
- Paper 12 asks where Anna's father works without specifying it in the passage: unscored.
- Paper 14 describes creativity but has no appropriate option: unscored.
- Paper 15 omits “some Vietnamese” from the listening choices: unscored. Its malformed
  Lucy question differs between paper and key: also unscored. The television question is
  answered as the yes/no question actually printed. Both intelligent/clever are accepted.
- Paper 17 accepts both “walk” and “go” with “to school on foot”.
- Paper 18 does not state the children's ages, and its school-level statement is ambiguous:
  both are unscored. The funny-stories answer is B, and the no-smoking picture means C,
  correcting inconsistent markings in the supplied key.

## Validation

Required delivery checks: repository ESLint, Vitest and production Vite build.
Tests cover immediate versus deferred feedback, changes before submission, confirmation,
reload recovery, mode separation, scoring exclusions, text normalization, all 18 data files
and local media references. Manual browser checks cover small-screen layout, phonetic
underlines, source images, audio metadata, submission and persisted results.

An additional TypeScript-only check finds five existing diagnostics in video lesson code
and `analytics.test.ts`. The unchanged HEAD was extracted and checked independently with
the same dependencies and produces the same five diagnostics; the new exam code adds none.
This project's existing deployment workflow requires lint, tests and build, not that check.

Deployment follows the existing `main` → GitHub Actions → GitHub Pages workflow.
Verify the deployed catalog, a paper, images and MP3 responses before reporting it live.
