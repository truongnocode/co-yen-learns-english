---
name: content-processor
description: >
  Process educational documents (PDF, DOCX, XLSX) into structured JSON content for the
  co-yen-learns-english web app. Extracts vocabulary, grammar, exercises, reading passages,
  and mock exams from textbook files (SGK Global Success grades 6-9, Grade 10 prep) and
  outputs production-ready JSON matching the app's TypeScript interfaces. Also generates
  supplementary exercises when source material is thin. Use this skill whenever the user
  mentions: "xử lý tài liệu", "import sách", "chuyển đổi nội dung", "process content",
  "import textbook", "nhập dữ liệu bài học", "xử lý file sách", "content processor",
  "tạo nội dung từ file", "thêm bài học", "thêm unit", "cập nhật dữ liệu sách",
  "add lesson data", or provides a PDF/DOCX/XLSX file containing English textbook content.
  Even if the user just drops a file and says something casual like "xử lý cái này cho tôi"
  or "thêm vào trang web", trigger this skill.
---

# Content Processor — SGK to JSON Pipeline

You are a content extraction and transformation engine. Your job: take raw educational
documents and produce structured JSON that the co-yen-learns-english web app can consume
directly.

## Step 1: Read the source file

Use the appropriate skill to read the input:
- **PDF** → use `/pdf` skill to extract text
- **DOCX** → use `/docx` skill to extract text
- **XLSX** → use `/xlsx` skill to extract structured data

If the user provides multiple files, process them in order. If the user pastes raw text
instead of a file, that works too — skip the file reading step.

## Step 2: Identify the content type

Scan the extracted text and classify it. The source material will be one or more of:

| Content Type | How to Recognize | Output Format |
|---|---|---|
| **SGK Unit (grades 6-9)** | Unit number + title, word lists, grammar explanations, exercises | `SGKUnit` → merge into `sgk_eng{grade}_data.json` |
| **Grade 10 Vocabulary** | Topic-based vocab exercises, MCQ format | `Grade10VocabTopic` → merge into `grade10_vocab.json` |
| **Grade 10 Grammar** | Grammar topic + mixed exercise types (MCQ, rearrange, rewrite) | `Grade10GrammarTopic` → merge into `grade10_grammar.json` |
| **Mock Exam** | Full test with parts A-D, 40 questions, 60 minutes | Test object → merge into `grade10_tests.json` |
| **Reading Comprehension** | Passages + comprehension questions | Reading exercises → merge into `grade10_reading.json` |
| **Writing Exercises** | Sentence rearrangement, word formation, rewrite | Writing exercises → merge into `grade10_writing.json` |
| **Raw word list** | Just English-Vietnamese pairs without structure | `VocabItem[]` — needs unit assignment |

If unclear, ask the user: "Nội dung này thuộc lớp mấy và unit nào?"

## Step 3: Extract and structure data

### For SGK Units (grades 6-9)

Each unit MUST produce this structure:

```json
{
  "title": "Unit Title in English",
  "vocabulary": [
    { "en": "word", "type": "n", "vi": "nghĩa tiếng Việt" }
  ],
  "grammar": ["Grammar Topic 1", "Grammar Topic 2"],
  "grammar_notes": "Giải thích ngữ pháp bằng tiếng Việt. Chi tiết, có ví dụ minh họa.",
  "exercises": [
    { "q": "Question text with _____ blank.", "opts": ["A", "B", "C", "D"], "ans": 0 }
  ]
}
```

**Quality benchmarks per unit:**
- Vocabulary: **35-45 items** (extract all from source, supplement if < 35)
- Grammar topics: **1-3 topics** per unit
- Grammar notes: **200-500 words** in Vietnamese, with examples
- Exercises: **20 MCQ** (extract from source, generate more if < 20)

**Vocabulary `type` field values:**
`n` (noun), `v` (verb), `adj` (adjective), `adv` (adverb), `prep` (preposition),
`idiom`, `n/v` (can be both), `v phr` (verb phrase), `phr` (phrase),
`conj` (conjunction), `det` (determiner)

### For Grade 10 Vocabulary

```json
{
  "topic_id": {
    "name": "Topic Name",
    "questions": [
      { "q": "Sentence with _____ blank.", "opts": ["A", "B", "C", "D"], "ans": 0 }
    ]
  }
}
```

Use hierarchical IDs like `"1.1.1"`, `"1.1.2"`, etc.

### For Grade 10 Grammar

```json
{
  "topic_id": {
    "name": "Grammar Topic Name",
    "exercises": {
      "mcq": {
        "instruction": "Mark the letter A, B, C, or D...",
        "questions": [{ "q": "...", "opts": ["A","B","C","D"], "ans": 0 }]
      },
      "rearrange": {
        "instruction": "Rearrange the words/phrases...",
        "questions": [{ "q": "scrambled / words / here", "answer": ["correct", "order", "here"] }]
      },
      "completion": {
        "instruction": "Complete using the correct form...",
        "questions": [{ "q": "Sentence with (word)...", "answer": ["correct form"] }]
      },
      "rewrite": {
        "instruction": "Rewrite the sentence...",
        "questions": [{ "q": "Original sentence → ...", "answer": ["rewritten sentence"] }]
      }
    }
  }
}
```

Not all exercise types are required — include only what the source material provides.
Use IDs like `"2.1"`, `"2.2"`, etc.

### For Mock Exams

```json
{
  "test_id": {
    "title": "Practice Test N",
    "partA": { "instruction": "...", "questions": [MCQuestion] },
    "partB": { "instruction": "...", "questions": [MCQuestion] },
    "partC": { "instruction": "...", "questions": [MCQuestion] },
    "partD": { "instruction": "...", "questions": [MCQuestion] }
  }
}
```

## Step 4: Validate

Run these checks before writing output:

1. **MCQ validation**: Every `MCQuestion` has exactly 4 `opts` and `ans` is 0-3
2. **No empty fields**: All `en`, `vi`, `q` fields are non-empty strings
3. **Answer correctness**: Verify `ans` index points to the actually correct option
4. **Vietnamese content**: `grammar_notes` is written in Vietnamese
5. **Minimum counts**: vocabulary ≥ 35, exercises ≥ 20 per unit
6. **No duplicates**: No duplicate vocabulary items within the same unit
7. **Type accuracy**: `type` field uses only the allowed values listed above

If any check fails, fix it before proceeding. If vocabulary or exercises are below
minimum, generate additional items that match the unit's topic and difficulty level.

## Step 5: Merge into existing data

Read the existing JSON file from `public/data/`, merge the new content, and write back.

**IMPORTANT**: Never overwrite existing units/topics unless the user explicitly says to
replace them. Default behavior is to ADD new content alongside existing content.

```
Existing file: public/data/sgk_eng6_data.json
→ Read current JSON
→ Add new unit(s) to the "units" object
→ Write back the merged JSON
```

If creating a completely new file, match the naming convention:
- `sgk_eng{grade}_data.json` for grades 6-9
- `grade10_{type}.json` for grade 10 content

## Step 6: Report to user

After processing, show a summary:

```
✓ Đã xử lý: [filename]
  Lớp: [grade] | Unit: [unit numbers]
  Từ vựng: [count] items
  Ngữ pháp: [count] topics
  Bài tập: [count] MCQ
  Output: public/data/[filename].json

  [Any warnings about generated/supplemented content]
```

## Generating supplementary exercises

When source material has fewer than 20 exercises per unit, generate additional MCQ
following these patterns:

1. **Vocabulary MCQ**: "The word '___' means..." or "Choose the correct word for..."
2. **Grammar MCQ**: "She _____ to school every day." (test the unit's grammar point)
3. **Fill-in-blank**: Contextual sentences using unit vocabulary
4. **Error identification**: "Find the mistake in the sentence..."

All generated exercises must:
- Use vocabulary FROM the same unit
- Test grammar points FROM the same unit
- Have exactly 4 plausible options (no obvious wrong answers)
- Include the correct answer at a random position (not always option A)

## Reference: Existing data files

Read these for format reference if needed:
- `public/data/sgk_eng6_data.json` — Grade 6 example (12 units)
- `public/data/grade10_vocab.json` — Grade 10 vocab format
- `public/data/grade10_grammar.json` — Grade 10 grammar format
- `public/data/grade10_tests.json` — Mock exam format
