# Quy trình nội dung — Học cùng cô Yến

Tài liệu mô tả cách nội dung học (đề thi, unit SGK, vocab/grammar, từ điển) được tạo ra, kiểm tra và nạp vào ứng dụng. Đọc kèm [ARCHITECTURE.md](./ARCHITECTURE.md) (kiến trúc tổng thể) và [OPERATIONS.md](./OPERATIONS.md) (deploy).

---

## Mục lục

1. [Mô hình nội dung](#1-mô-hình-nội-dung)
2. [Các nguồn nội dung trên đĩa](#2-các-nguồn-nội-dung-trên-đĩa)
3. [Schema dùng chung (Zod)](#3-schema-dùng-chung-zod)
4. [Pipeline A — Import hàng loạt đề thi (batch-import)](#4-pipeline-a--import-hàng-loạt-đề-thi-batch-import)
5. [Pipeline B — Import qua trang admin (1 file, có Gemini)](#5-pipeline-b--import-qua-trang-admin-1-file-có-gemini)
6. [Pipeline C — Sinh lời giải MCQ hàng loạt](#6-pipeline-c--sinh-lời-giải-mcq-hàng-loạt)
7. [Pipeline D — Sinh từ điển (dict)](#7-pipeline-d--sinh-từ-điển-dict)
8. [Skill content-processor](#8-skill-content-processor)
9. [Seed JSON → Firestore](#9-seed-json--firestore)
10. [Cách thêm bài học / đề mới](#10-cách-thêm-bài-học--đề-mới)

---

## 1. Mô hình nội dung

Nội dung tồn tại ở **hai tầng** (xem [ARCHITECTURE.md §8](./ARCHITECTURE.md#8-cơ-chế-nội-dung-firestore-first--json-fallback)):

- **JSON tĩnh** trong `public/data/*.json` — bộ dữ liệu gốc, ship kèm bundle frontend, không bao giờ bị xoá.
- **Firestore** — nội dung do admin import, đè/bổ sung lên JSON tại runtime.

Các file JSON gốc:

| File | Nội dung |
|---|---|
| `public/data/sgk_eng{3..9}_data.json` | Unit SGK lớp 3–9 (title, vocabulary, grammar, exercises) |
| `public/data/grade10_tests.json` | Đề thi thử lớp 10 (Part A/B/C) — ~9 MB |
| `public/data/grade10_vocab.json` | Chuyên đề từ vựng lớp 10 (MCQ) |
| `public/data/grade10_grammar.json` | Chuyên đề ngữ pháp lớp 10 (MCQ + rearrange + completion + rewrite) |
| `public/data/grade10_reading.json` | Bài đọc / biển báo / cloze lớp 10 |
| `public/data/grade10_writing.json` | Bài luyện viết lớp 10 |
| `public/data/images/` | Ảnh nhúng (biển báo, minh hoạ) |

Quy ước bất biến (toàn dự án):
- **Không xoá** dữ liệu cũ — chỉ thêm cạnh.
- **Bỏ qua key đã tồn tại** (idempotent) — pipeline không ghi đè trừ khi được yêu cầu rõ ("replace"/"overwrite"/`--force`).

---

## 2. Các nguồn nội dung trên đĩa

```
content-sources/                      # INPUT thô cho batch-import
└── tienganh/
    └── files/                        # ← INPUT_ROOT của batch-import.ts
        ├── 601_NB_de_01/
        │   ├── NB - Đề số 01.docx          (đề)
        │   └── NB - Đề số 01 - KEY.docx    (đáp án)
        ├── 602_NB_de_02/
        └── ...                       # Mỗi thư mục NNN_* → testKey "testNNN"

tmp/                                  # Workspace tạm (không commit)
├── batch-import/                     # Output trung gian của batch-import
│   ├── <testKey>/unpacked|extracted|output.json
│   ├── batch.log, failed.json, run.stdout.log
└── dict/                             # Pipeline từ điển (xem §7)
    ├── base.json, dictionary.json
    ├── batch{1..12}.json, out{1..12}.json
    └── *.cjs (build_base, fix_ipa, merge_deriv, make_docx, ...)

deliverables/                         # Sản phẩm từ điển đã build
├── TuDien_TiengAnh_THCS_Lop6-9.docx + .data.json
├── TuDien_TiengAnh_TieuHoc_Lop1-5.docx + .data.json
└── TuDien_TuMoi_NgoaiGlossary.csv
```

> **Quan trọng — verify đường dẫn:** `INPUT_ROOT` của `scripts/batch-import.ts` được định nghĩa ở dòng 34:
> ```ts
> const INPUT_ROOT = path.join(PROJECT_ROOT, "content-sources", "tienganh", "files");
> ```
> tức `D:\co-yen-learns-english\content-sources\tienganh\files`. Mỗi thư mục con phải đặt tên dạng `NNN_...` (3 chữ số đầu) để map thành `testKey = "testNNN"`.

---

## 3. Schema dùng chung (Zod)

`src/lib/content-schema.ts` là **một nguồn sự thật** cho cấu trúc nội dung — vừa dùng ở frontend, vừa import trực tiếp vào Worker (tsconfig của Worker `include` file này: `"../../src/lib/content-schema.ts"`). Các schema chính:

- `ExamSchema` — đề thi (partA/partB/partC).
- `SgkUnitSchema` — unit SGK.
- `Grade10VocabTopicSchema`, `Grade10GrammarTopicSchema`.
- `ReadingPassageSchema`, `WritingPromptSchema`, `VocabItem`, `McqSchema`, `SignQuestionSchema`.
- `EXAM_IMPORT_SYSTEM_PROMPT` — system prompt cho Gemini khi import.

Type runtime (consumed bởi page) khai báo trong `src/data/types.ts` (`SGKData`, `Grade10Test`, `MCQuestion`, ...). Quy ước MCQ: `ans` là index đáp án đúng (A=0, B=1, C=2, D=3); field `explain` (tiếng Việt) là lời giải.

---

## 4. Pipeline A — Import hàng loạt đề thi (batch-import)

Script: `scripts/batch-import.ts` (chạy bằng **Bun**). Dùng để nạp nhiều đề DOCX/RAR cùng lúc vào `public/data/grade10_tests.json`.

### Luồng xử lý (mỗi thư mục `NNN_*`)
1. Map tên thư mục → `testKey` (`/^(\d{3})_/` → `testNNN`). Nếu `testKey` đã có trong `grade10_tests.json` → **SKIP** (idempotent).
2. Giải nén `.rar` (qua `UnRAR.exe`) / `.zip` (qua `unzip`), hoặc copy thẳng `.docx`/`.pdf` vào `tmp/batch-import/<testKey>/unpacked/`.
3. Trích xuất mỗi DOCX bằng Python `extract_docx.py` (của skill content-processor) → `extracted/doc-N/source.md` + `images/`. PDF đưa thẳng cho Claude qua Read tool.
4. **Gọi Claude CLI** (`claude.exe -p --model sonnet`) với prompt dùng skill `content-processor` để phân loại nguồn (EXAM / ANSWER_KEY / VOCAB_UNIT / ...) và trích đề thành `ExamSchema`, ghi `output.json`.
5. Validate `output.json` bằng `validate.ts --kind exam`.
6. Copy ảnh liên quan sang `public/data/images/extracted/grade10/<testKey>/`.
7. Merge vào `public/data/grade10_tests.json` (đọc lại file ngay trước khi ghi để tránh race với worker song song).

### Cấu hình quan trọng (đầu file, dòng 29–41)
```ts
const CLAUDE_EXE = "C:\\Users\\Truong\\AppData\\Roaming\\Claude\\claude-code\\2.1.142\\claude.exe";
const UNRAR_EXE  = "C:\\Program Files\\WinRAR\\UnRAR.exe";
const PYTHON     = "python";
const INPUT_ROOT = .../content-sources/tienganh/files
const WORK_ROOT  = .../tmp/batch-import
const IMAGES_ROOT= .../public/data/images/extracted/grade10
const TESTS_JSON = .../public/data/grade10_tests.json
const EXTRACT_SCRIPT  = .../.claude/skills/content-processor/scripts/extract_docx.py
const VALIDATE_SCRIPT = .../.claude/skills/content-processor/scripts/validate.ts
```
> Lưu ý: `CLAUDE_EXE` trỏ tới một phiên bản cụ thể của Claude Code (`2.1.142`). Khi Claude Code cập nhật, **phải sửa đường dẫn này** cho khớp phiên bản đã cài.

### Lệnh chạy
```bash
# Chạy tất cả thư mục (tuần tự theo tên, concurrency mặc định 3)
bun scripts/batch-import.ts

# Chỉ 3 thư mục đầu (pilot)
bun scripts/batch-import.ts --limit 3

# Resume từ thư mục 610, 5 cái
bun scripts/batch-import.ts --from 610 --limit 5

# 5 worker song song
bun scripts/batch-import.ts --concurrency 5

# Lên kế hoạch, không gọi LLM
bun scripts/batch-import.ts --dry-run

# Chạy nền ở cửa sổ cmd riêng (log vào tmp/batch-import/run.*.log)
scripts\run-batch.bat --limit 5
```

Tham số: `--limit N`, `--from NNN` (mặc định `002`), `--concurrency N` (mặc định 3), `--dry-run`, `--retry N` (mặc định 1).

Log: `tmp/batch-import/batch.log`; thư mục thất bại: `tmp/batch-import/failed.json`.

> Pipeline này dùng **Claude CLI cục bộ**, KHÔNG dùng Gemini, nên **không phụ thuộc** `GEMINI_API_KEY`. Chỉ cần máy đã cài Claude Code, WinRAR, Python (kèm deps của skill — xem [§8](#8-skill-content-processor)).

---

## 5. Pipeline B — Import qua trang admin (1 file, có Gemini)

Dành cho cô Yến import **một file** qua giao diện web, tại `/admin/import` (trang `src/pages/admin/ImportExam.tsx`).

### Luồng
1. Cô Yến đăng nhập Google (tài khoản có claim `admin`), vào `/admin/import`.
2. Chọn loại (`exam` lớp 10 / `sgk_unit` lớp 3–9), chọn lớp + unitKey, upload PDF/DOCX.
3. `api-client.ts::importExam|importSgkUnit` gọi Worker `POST /api/import/exam|sgk` (đính ID token).
4. Worker gửi file cho **Gemini** kèm `ExamSchema`/`SgkUnitSchema` → trả JSON đã trích xuất → hiển thị preview để cô Yến sửa.
5. Cô Yến bấm lưu → `api-client.ts::saveImportResult` ghi **trực tiếp** vào Firestore bằng Firebase SDK (không qua Worker), đường dẫn theo `kind` (xem [ARCHITECTURE.md §8](./ARCHITECTURE.md#8-cơ-chế-nội-dung-firestore-first--json-fallback)).

> **Trạng thái hiện tại:** bước 4 cần `GEMINI_API_KEY` trên Worker. Vì key chưa cấu hình nên import qua admin **tạm thời không trích xuất được** (Worker trả lỗi `auth`). Đây là tính năng tạm tắt, không phải lỗi — xem [ARCHITECTURE.md §9](./ARCHITECTURE.md#9-tính-năng-ai-hiện-tạm-tắt). Khi cần dùng, hãy nạp lại key (hướng dẫn ở [OPERATIONS.md](./OPERATIONS.md)). Khi đó pipeline B sẽ hoạt động ngay mà không cần đổi code.

So với pipeline A: A nạp **hàng loạt** vào JSON tĩnh (qua Claude CLI), B nạp **từng file** thẳng vào Firestore (qua Gemini), không động vào JSON.

---

## 6. Pipeline C — Sinh lời giải MCQ hàng loạt

Script: `scripts/generate_explanations.cjs` (chạy bằng **Node**). Quét toàn bộ file JSON trong `public/data/`, thêm field `explain` (tiếng Việt) cho mọi câu MCQ **chưa có** lời giải. Gửi câu hỏi theo lô 20 câu cho Gemini.

### Lệnh
```bash
# Windows
set GEMINI_API_KEY=your-key
node scripts/generate_explanations.cjs

# bash
export GEMINI_API_KEY=your-key
node scripts/generate_explanations.cjs
```

- Xử lý: `sgk_eng{6..9}_data.json`, `grade10_vocab.json`, `grade10_grammar.json`, `grade10_tests.json`, `grade10_reading.json`.
- Xoay vòng nhiều model Gemini (`gemini-2.5-flash`, `gemini-2.0-flash-lite`, `gemini-2.0-flash`, `gemini-2.5-flash-lite`) nếu gặp rate-limit (HTTP 429).
- Bỏ qua câu đã có `explain` (idempotent). Ghi kết quả ngược lại file gốc (và `dist/data/` nếu tồn tại).

> Cần `GEMINI_API_KEY`. Hiện key đã gỡ nên script sẽ báo lỗi và thoát ngay nếu chạy — đây là tình trạng tạm tắt của các tính năng Ans AI. Lời giải đã sinh trước đây vẫn nằm trong JSON, học sinh dùng bình thường.

---

## 7. Pipeline D — Sinh từ điển (dict)

Workspace: `tmp/dict/` — bộ script CommonJS (`.cjs`) tự build, dùng package `docx` để xuất file Word từ điển. Sản phẩm cuối nằm trong `deliverables/`.

### Thành phần `tmp/dict/`
| File | Vai trò |
|---|---|
| `build_base.cjs` | Dựng `base.json` (danh sách từ gốc) |
| `batch{1..12}.json`, `out{1..12}.json` | Lô dữ liệu trung gian (input/output theo từng đợt) |
| `fix_ipa.cjs` | Chuẩn hoá IPA |
| `merge_deriv.cjs` | Gộp từ phái sinh |
| `analyze.cjs` | Kiểm tra/thống kê |
| `dictionary.json` | Từ điển đã gộp hoàn chỉnh |
| `make_docx.cjs` | Xuất `deliverables/TuDien_TiengAnh_THCS_Lop6-9.docx` (đọc `dictionary.json`) |
| `make_docx_cap1.cjs` | Xuất bản tiểu học (lớp 1–5) |

### Lệnh (thư mục tmp/dict)
```bash
# Cài dep cục bộ của pipeline dict (chỉ package "docx")
cd tmp/dict && npm install

# Build file Word từ điển THCS từ dictionary.json
node make_docx.cjs
# → ghi ra deliverables/TuDien_TiengAnh_THCS_Lop6-9.docx
```

### Sản phẩm trong `deliverables/`
- `TuDien_TiengAnh_THCS_Lop6-9.docx` + `.data.json` — từ điển lớp 6–9.
- `TuDien_TiengAnh_TieuHoc_Lop1-5.docx` + `.data.json` — từ điển tiểu học.
- `TuDien_TuMoi_NgoaiGlossary.csv` — danh sách từ mới (CSV).

> Quy ước IPA: British RP, non-rhotic (theo quy ước chung của dự án).

---

## 8. Skill content-processor

Skill ở `.claude/skills/content-processor/` — "bộ não trích xuất" cho mọi tài liệu giáo trình (PDF/DOCX/XLSX → JSON). Được pipeline A gọi tự động, và Claude Code gọi khi cô Yến nói "xử lý tài liệu", "thêm đề thi", "thêm unit", hoặc thả file vào.

### Cấu trúc
```
.claude/skills/content-processor/
├── SKILL.md                    # Hướng dẫn 7 bước (extract → classify → extract → image → validate → merge → report)
├── requirements.txt            # pymupdf4llm, mammoth, pillow, beautifulsoup4
├── scripts/
│   ├── extract_docx.py         # DOCX → source.md + images/ (dùng mammoth)
│   ├── extract_pdf.py          # PDF → source.md + images/ (dùng pymupdf4llm)
│   └── validate.ts             # Validate JSON theo Zod schema (Bun)
└── references/
    ├── extraction_examples.md  # Ví dụ trích xuất mẫu cho từng schema
    ├── prompt_patterns.md      # Checklist + vòng tự sửa
    └── image_handling.md       # Quy tắc gắn ảnh vào câu hỏi
```

### Cài deps Python (một lần)
```bash
pip install -r .claude/skills/content-processor/requirements.txt
```

### 7 bước (tóm tắt từ SKILL.md)
1. **Extract**: chạy `extract_pdf.py`/`extract_docx.py` → `tmp/extract/<stem>/` (source.md + images/ + extraction.json). Nếu `needs_ocr: true` → nguồn là ảnh scan, dừng và yêu cầu file có text layer.
2. **Classify**: chọn ONE schema (`SgkUnitSchema` / `ExamSchema` / `Grade10VocabTopicSchema` / ...) theo loại nội dung.
3. **Extract per type**: trích theo thứ tự title → vocabulary (≥35) → grammar_notes (200–500 từ tiếng Việt) → exercises (MCQ ≥20) → reading → writing.
4. **Image**: gắn ảnh vào đúng field (`McqSchema.image`, `SignQuestionSchema.image`, ...). Không tự sinh icon; thiếu ảnh thì để trống.
5. **Validate**: `bun .claude/skills/content-processor/scripts/validate.ts <output.json> --kind <kind>` (kind: `exam|sgk_unit|grade10_vocab|grade10_grammar|reading|writing|vocab_list`). Exit 0 = an toàn ghi.
6. **Merge + persist images**: idempotent (bỏ qua key đã có), copy ảnh sang `public/data/images/extracted/<folder>/`, rewrite path, merge vào file đích.
7. **Report**: tóm tắt số liệu; nêu rõ nếu có item được sinh bổ sung (generated) để cô Yến review.

> Validate dùng Bun (`validate.ts`). Trích xuất ảnh dùng Python. Không cần GPU.

---

## 9. Seed JSON → Firestore

Sau khi `public/data/*.json` cập nhật, để đưa nội dung lên Firestore (cho phần Firestore-first hoạt động), chạy:

```bash
node scripts/migrate-json-to-firestore.mjs            # seed tất cả
node scripts/migrate-json-to-firestore.mjs --force    # ghi đè
node scripts/migrate-json-to-firestore.mjs --only=exams,sgk   # chỉ một số loại
```

- Yêu cầu **Firebase service account** (giống `grant-admin.mjs`): set `GOOGLE_APPLICATION_CREDENTIALS` trỏ tới JSON, hoặc đặt `serviceAccount.json` ở thư mục gốc repo (gitignored).
- `setIfMissing`: chỉ ghi nếu doc chưa tồn tại (idempotent), trừ khi `--force`.
- Map: `sgk_eng{N}_data.json` → `sgk/grade{N}/units/{unitKey}`; `grade10_tests.json` → `exams/grade10/tests/{key}`; `grade10_vocab.json` → `grade10_vocab/{key}`; `grade10_grammar.json` → `grade10_grammar/{key}`.

Pipeline này KHÔNG cần Gemini.

---

## 10. Cách thêm bài học / đề mới

### Thêm một đề thi lớp 10 (cách nhanh, hàng loạt — không cần Gemini)
1. Tạo thư mục `content-sources/tienganh/files/NNN_<tên>/` (NNN là 3 chữ số mới, chưa trùng).
2. Bỏ file đề `.docx`/`.pdf` (và file `KEY` đáp án nếu có) vào.
3. Chạy `bun scripts/batch-import.ts --from NNN --limit 1` (cần Claude Code + WinRAR + Python).
4. Kiểm tra `tmp/batch-import/batch.log`; đề mới được merge vào `public/data/grade10_tests.json` dưới key `testNNN`.
5. (Tuỳ chọn) đưa lên Firestore: `node scripts/migrate-json-to-firestore.mjs --only=exams`.
6. Commit + push `main` để deploy (xem [OPERATIONS.md](./OPERATIONS.md)).

### Thêm một unit SGK lớp 3–9 (thủ công + skill)
1. Thả file giáo trình vào Claude Code và yêu cầu "thêm unit" → skill `content-processor` chạy 7 bước, ghi vào `public/data/sgk_eng{N}_data.json` (thêm key trong `units`).
2. (Tuỳ chọn) sinh lời giải: `node scripts/generate_explanations.cjs` (cần Gemini key).
3. (Tuỳ chọn) seed Firestore: `node scripts/migrate-json-to-firestore.mjs --only=sgk`.
4. Commit + push.

### Thêm một file qua giao diện admin (cần Gemini key)
Vào `/admin/import`, chọn loại + lớp + unitKey, upload → preview → lưu (ghi thẳng Firestore). Xem [§5](#5-pipeline-b--import-qua-trang-admin-1-file-có-gemini). Hiện tạm tắt cho tới khi nạp lại Gemini key.

### Sửa trực tiếp JSON
Vì page đọc theo cấu trúc cố định (`src/data/types.ts`), có thể sửa tay `public/data/*.json` (giữ đúng schema), rồi `bun run build` + push. Luôn giữ quy ước: không xoá key cũ, `ans` là index (A=0..D=3), `explain` là tiếng Việt.
