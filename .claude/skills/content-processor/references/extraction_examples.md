# Few-Shot Extraction Examples

Copy these patterns when you (the LLM) emit JSON. Each example shows a realistic
fragment of source markdown (as produced by `extract_pdf.py` / `extract_docx.py`)
and the JSON it should become. Match field names, types, and conventions exactly.

> **Schema source of truth**: [src/lib/content-schema.ts](../../../../src/lib/content-schema.ts).
> If anything here diverges, the `.ts` file wins.

---

## Example 1 — SGK unit (Grade 7, Unit 3)

### Source markdown

```markdown
## UNIT 3: COMMUNITY SERVICE

### Vocabulary

![](images/p18-0.png)

- volunteer (n) /ˌvɒlənˈtɪə(r)/ — tình nguyện viên
- donate (v) /dəʊˈneɪt/ — quyên góp
- charity (n) /ˈtʃærəti/ — từ thiện
... (32 more)

### Grammar

**Past simple vs Present perfect**

Use Past simple for completed actions in the past with a specific time.
Use Present perfect for actions that started in the past and continue or have
present relevance.

Examples:
- Last year, I **donated** 1,000,000 VND to the orphanage.
- I **have donated** to charity many times.

### Exercise 1 — Choose the correct answer.

1. She _____ to the elderly home every Saturday last month.
   A. goes  B. went  C. has gone  D. going

2. They _____ over $5,000 since the campaign started.
   A. raised  B. raise  C. have raised  D. raising
```

### Output JSON (matches `SgkUnitSchema`)

```json
{
  "title": "Community Service",
  "vocabulary": [
    { "en": "volunteer", "ipa": "/ˌvɒlənˈtɪə(r)/", "type": "n", "vi": "tình nguyện viên" },
    { "en": "donate", "ipa": "/dəʊˈneɪt/", "type": "v", "vi": "quyên góp" },
    { "en": "charity", "ipa": "/ˈtʃærəti/", "type": "n", "vi": "từ thiện" }
  ],
  "grammar": ["Past simple vs Present perfect"],
  "grammar_notes": "Trong unit này học sinh phân biệt **thì quá khứ đơn (Past simple)** với **thì hiện tại hoàn thành (Present perfect)**.\n\n- **Past simple** dùng cho hành động đã hoàn tất trong quá khứ, thường đi kèm mốc thời gian cụ thể (yesterday, last week, in 2020…). Ví dụ: *Last year, I donated 1,000,000 VND to the orphanage.*\n- **Present perfect** (have/has + V3) dùng khi hành động bắt đầu trong quá khứ và còn liên quan tới hiện tại, hoặc khi không nêu mốc thời gian cụ thể. Ví dụ: *I have donated to charity many times.*\n\nDấu hiệu nhận biết Present perfect: since, for, ever, never, just, already, yet, recently, so far.\nDấu hiệu nhận biết Past simple: yesterday, ago, last…, in + năm đã qua.\n\nKhi câu nhấn mạnh **kết quả còn ở hiện tại** → Present perfect. Khi câu nhấn mạnh **thời điểm xảy ra** → Past simple.",
  "exercises": [
    {
      "q": "She _____ to the elderly home every Saturday last month.",
      "opts": ["goes", "went", "has gone", "going"],
      "ans": 1,
      "explain": "\"Last month\" là mốc thời gian cụ thể trong quá khứ → dùng quá khứ đơn \"went\"."
    },
    {
      "q": "They _____ over $5,000 since the campaign started.",
      "opts": ["raised", "raise", "have raised", "raising"],
      "ans": 2,
      "explain": "\"Since the campaign started\" báo hiệu hành động kéo dài tới hiện tại → dùng hiện tại hoàn thành \"have raised\"."
    }
  ]
}
```

**Notes**
- The `images/p18-0.png` is a vocabulary illustration — it belongs to the
  vocabulary list as a whole, not a specific item, so it doesn't go into the
  JSON. (See [image_handling.md](image_handling.md) for when an image *does*
  bind to a question.)
- Vietnamese grammar notes target ~250 words, with at least one example per
  rule and clear signal-word lists.
- `explain` is always Vietnamese, 1-2 sentences, and explicitly references
  the grammar/vocab rule that justifies the answer.

---

## Example 2 — Mock exam (Grade 10, Part B, signs)

### Source markdown

```markdown
**Part B — Question 11.** Look at the sign.

![](images/p3-2.png)

What does the sign mean?
A. Parking is allowed only for permit holders.
B. Parking is free for one hour.
C. Cars must move within one minute.
D. The street is closed.
```

### Output JSON (item in `partB.signs[]`, matches `SignQuestionSchema`)

```json
{
  "sign": "PERMIT PARKING ONLY",
  "image": "images/p3-2.png",
  "q": "What does the sign mean?",
  "opts": [
    "Parking is allowed only for permit holders.",
    "Parking is free for one hour.",
    "Cars must move within one minute.",
    "The street is closed."
  ],
  "ans": 0,
  "explain": "Biển ghi \"Permit Parking Only\" → chỉ những xe có giấy phép mới được đậu, đúng phương án A."
}
```

**Notes**
- The `image` field is the **relative path** as it appears in the source
  markdown — copy it verbatim.
- The `sign` field is the **text actually visible inside the sign image** (you
  can read it from the rendered PDF page; if the sign is purely pictorial,
  use a short English description like `"NO U-TURN"`).
- See [image_handling.md](image_handling.md) for how to bind an image to a
  question by adjacency.

---

## Example 3 — Cloze passage (Grade 10, Part B)

### Source markdown

```markdown
**Part B — Read the passage and choose the best answer.**

Vietnamese students (1) _____ very hard at school. They usually start their
day at 7 a.m. and finish at 5 p.m. After school, many of them (2) _____ extra
classes for English, Maths, or Science. Despite the long hours, most students
(3) _____ time to play sports or join clubs.

1. A. work  B. works  C. working  D. worked
2. A. attend  B. attends  C. attending  D. attended
3. A. find  B. finds  C. finding  D. found
```

### Output JSON (`partB.cloze`)

```json
{
  "passage": "Vietnamese students (1) _____ very hard at school. They usually start their day at 7 a.m. and finish at 5 p.m. After school, many of them (2) _____ extra classes for English, Maths, or Science. Despite the long hours, most students (3) _____ time to play sports or join clubs.",
  "questions": [
    {
      "q": "Question 1",
      "opts": ["work", "works", "working", "worked"],
      "ans": 0,
      "explain": "Chủ ngữ \"Vietnamese students\" số nhiều → động từ chia ở dạng nguyên thể \"work\"."
    },
    {
      "q": "Question 2",
      "opts": ["attend", "attends", "attending", "attended"],
      "ans": 0,
      "explain": "Cùng cấu trúc với câu 1 — chủ ngữ \"many of them\" số nhiều, hành động lặp lại ở hiện tại → \"attend\"."
    },
    {
      "q": "Question 3",
      "opts": ["find", "finds", "finding", "found"],
      "ans": 0,
      "explain": "\"Most students\" số nhiều, mệnh đề mô tả thói quen hiện tại → \"find\"."
    }
  ]
}
```

**Notes**
- Keep `passage` **verbatim** with `(N) _____` numbered blanks intact. Do not
  paraphrase or shorten.
- For `q`, when the source has only numbered options (no separate prompt),
  use `"Question N"` as the placeholder so the UI can render correctly.

---

## Example 4 — Grade 10 grammar topic (mixed exercise types)

### Source markdown

```markdown
## 2.3 — Conditional sentences (Type 1)

### MCQ
1. If it _____ tomorrow, we'll cancel the picnic.
   A. rains  B. will rain  C. rained  D. would rain

### Rearrange
1. tomorrow / I / if / will / call / you / am / free / I
   → If I am free tomorrow, I will call you.

### Completion
1. If she (study) _____ harder, she (pass) _____ the exam.
   → studies, will pass

### Rewrite
1. I don't have enough money, so I won't buy that book.
   → If I had enough money, I would buy that book.
```

### Output JSON (one entry under key `"2.3"` in `grade10_grammar.json`)

```json
{
  "name": "Conditional sentences (Type 1)",
  "exercises": {
    "mcq": {
      "instruction": "Mark the letter A, B, C, or D for the correct option.",
      "questions": [
        {
          "q": "If it _____ tomorrow, we'll cancel the picnic.",
          "opts": ["rains", "will rain", "rained", "would rain"],
          "ans": 0,
          "explain": "Câu điều kiện loại 1 — mệnh đề if dùng hiện tại đơn → \"rains\"."
        }
      ]
    },
    "rearrange": {
      "instruction": "Rearrange the words to make a meaningful sentence.",
      "questions": [
        {
          "q": "tomorrow / I / if / will / call / you / am / free / I",
          "answer": ["If I am free tomorrow, I will call you.", "If I am free tomorrow I will call you."]
        }
      ]
    },
    "completion": {
      "instruction": "Complete the sentence using the correct form of the verb in brackets.",
      "questions": [
        {
          "q": "If she (study) _____ harder, she (pass) _____ the exam.",
          "answer": ["studies, will pass", "studies will pass"]
        }
      ]
    },
    "rewrite": {
      "instruction": "Rewrite the sentence so the meaning stays the same.",
      "questions": [
        {
          "q": "I don't have enough money, so I won't buy that book.",
          "answer": [
            "If I had enough money, I would buy that book.",
            "If I had enough money I would buy that book."
          ]
        }
      ]
    }
  }
}
```

**Notes**
- `answer` is always an **array of acceptable variants** (the app does string
  matching). Always include at least one variant **with** terminal punctuation
  and one **without** — students often forget the period.
- For multi-blank `completion` items, separate filled values with `, ` so the
  matcher can tolerate either order or comma form.

---

## Example 5 — Reading passage with question

### Source markdown

```markdown
**Reading 1.**

Da Lat is a small city in the Central Highlands of Vietnam, famous for its
cool climate, pine forests, and colourful flowers. It is often called "the
city of eternal spring" because temperatures rarely exceed 25°C even in
summer. Tourists love Da Lat for its French colonial architecture and the
beautiful Xuan Huong Lake at the city centre.

1. Why is Da Lat called "the city of eternal spring"?
   A. Because flowers bloom all year.
   B. Because the temperature is always cool.
   C. Because the city is small.
   D. Because of the French architecture.
```

### Output JSON (item in `reading1` or `reading2`, matches `ReadingPassageSchema`)

```json
{
  "title": "Da Lat — the city of eternal spring",
  "passage": "Da Lat is a small city in the Central Highlands of Vietnam, famous for its cool climate, pine forests, and colourful flowers. It is often called \"the city of eternal spring\" because temperatures rarely exceed 25°C even in summer. Tourists love Da Lat for its French colonial architecture and the beautiful Xuan Huong Lake at the city centre.",
  "questions": [
    {
      "q": "Why is Da Lat called \"the city of eternal spring\"?",
      "opts": [
        "Because flowers bloom all year.",
        "Because the temperature is always cool.",
        "Because the city is small.",
        "Because of the French architecture."
      ],
      "ans": 1,
      "explain": "Bài đọc nói nhiệt độ Đà Lạt hiếm khi vượt 25°C ngay cả mùa hè → khí hậu mát quanh năm = lý do được gọi \"eternal spring\"."
    }
  ]
}
```

---

## Common pitfalls (read before extracting)

1. **Don't fabricate `ans`**. If the source PDF omits the answer key, infer
   from grammar rules and **note the uncertainty** in `explain` (e.g. `"Suy ra
   từ quy tắc ngữ pháp — đáp án nguồn bị thiếu"`).
2. **Don't paraphrase passages**. `passage` strings must be byte-equivalent
   to the source after whitespace normalization.
3. **Don't strip diacritics**. Vietnamese explanations must preserve full
   diacritics (ô, ơ, ư, …).
4. **Don't replace images with descriptions**. If the source has an image,
   use the actual `images/...png` path. Only describe-instead-of-show when the
   image extractor failed and you've already noted that in the run summary.
5. **Don't drift the grammar/vocab scope** when generating supplementary
   items. A unit on "Past simple" should not have supplementary MCQs about
   "Future continuous".
