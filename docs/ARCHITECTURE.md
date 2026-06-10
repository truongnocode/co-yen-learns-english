# Kiến trúc hệ thống — Học cùng cô Yến

Tài liệu mô tả kiến trúc hiện tại của ứng dụng học tiếng Anh **Học cùng cô Yến** (production: <https://tienganhcoyen.online>), dành cho học sinh Việt Nam lớp 3–10. Đọc tài liệu này trước khi sửa code hoặc thêm tính năng.

Hai tài liệu đi kèm:
- [CONTENT-PIPELINE.md](./CONTENT-PIPELINE.md) — quy trình tạo và nạp nội dung (đề thi, unit SGK, từ điển).
- [OPERATIONS.md](./OPERATIONS.md) — deploy, cấu hình hạ tầng, backup, clone instance cho giáo viên/trung tâm khác.

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Sơ đồ thành phần](#2-sơ-đồ-thành-phần)
3. [Sơ đồ thư mục](#3-sơ-đồ-thư-mục)
4. [Frontend (React + Vite)](#4-frontend-react--vite)
5. [Cloudflare Worker (API backend)](#5-cloudflare-worker-api-backend)
6. [Firebase (Auth + Firestore)](#6-firebase-auth--firestore)
7. [Luồng xác thực (Auth)](#7-luồng-xác-thực-auth)
8. [Cơ chế nội dung: Firestore-first + JSON fallback](#8-cơ-chế-nội-dung-firestore-first--json-fallback)
9. [Tính năng AI (hiện tạm tắt)](#9-tính-năng-ai-hiện-tạm-tắt)
10. [Biến môi trường](#10-biến-môi-trường)
11. [Bảng route / endpoint / port](#11-bảng-route--endpoint--port)

---

## 1. Tổng quan

Ứng dụng là một **SPA (Single Page Application)** tĩnh, không có server truyền thống. Ba thành phần độc lập:

| Thành phần | Công nghệ | Host production | Vai trò |
|---|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind + shadcn/ui | GitHub Pages (`tienganhcoyen.online`) | Toàn bộ giao diện học sinh + trang admin của cô Yến |
| **API backend** | Cloudflare Worker (Hono) | `api.tienganhcoyen.online` | Verify Firebase ID token (RS256), chấm AI, import nội dung từ file |
| **Auth + DB** | Firebase Auth (Google) + Cloud Firestore | Google Cloud (project `english-class-28f06`) | Đăng nhập, lưu tiến độ học, nội dung do admin import |

Đặc điểm kiến trúc quan trọng:
- **Không có máy chủ luôn chạy.** Frontend là file tĩnh trên GitHub Pages; Worker là serverless (Cloudflare); DB là managed (Firebase). Không có process nào cần "bật/tắt" hay watchdog.
- **Nội dung học có hai nguồn**: Firestore (do admin import) ưu tiên, JSON tĩnh trong bundle là fallback. Xem [mục 8](#8-cơ-chế-nội-dung-firestore-first--json-fallback).
- **Worker giữ "credential-light"**: Worker KHÔNG có Firebase service account. Mọi ghi Firestore xảy ra ở client (Firebase SDK), được kiểm soát bằng Firestore security rules + custom claim `admin`.

---

## 2. Sơ đồ thành phần

```
                  ┌─────────────────────────────────────────┐
                  │   Trình duyệt học sinh / cô Yến          │
                  │   (SPA React tải từ GitHub Pages)        │
                  └───────────┬──────────────────┬──────────┘
                              │                  │
            Firebase SDK      │                  │  fetch() + Bearer <ID token>
        (Auth + Firestore     │                  │
         đọc/ghi trực tiếp)   │                  │
                              ▼                  ▼
        ┌───────────────────────────┐   ┌───────────────────────────────┐
        │  Firebase                 │   │  Cloudflare Worker             │
        │  - Auth (Google + ẩn danh)│   │  co-yen-content-importer       │
        │  - Firestore (NoSQL)      │   │  api.tienganhcoyen.online      │
        │    users / progress / pets│   │  - verify RS256 ID token       │
        │    exams / sgk            │   │  - /api/import/* (admin)       │
        │    *_attempts             │   │  - /api/grade/speaking         │
        └───────────────────────────┘   │  - gọi Gemini API (AI)*        │
                                         └───────────────┬───────────────┘
                                                         │ *cần GEMINI_API_KEY
                                                         ▼
                                              ┌────────────────────────┐
                                              │  Google Gemini API     │
                                              │  (HIỆN TẠM TẮT — chưa  │
                                              │   cấu hình API key)    │
                                              └────────────────────────┘
```

Tĩnh JSON (nội dung dự phòng) ship kèm bundle frontend trên GitHub Pages — không qua mạng riêng.

---

## 3. Sơ đồ thư mục

```
D:\co-yen-learns-english\
├── index.html                  # Entry HTML cho Vite
├── package.json                # Frontend deps + scripts (dev/build/test/lint)
├── vite.config.ts              # Cấu hình Vite (alias @ → src/)
├── tailwind.config.ts          # Theme Tailwind + shadcn
├── firebase.json               # Trỏ tới firestore.rules (dùng cho deploy rules)
├── firestore.rules             # Security rules cho Firestore (CỐT LÕI bảo mật)
├── .env.example                # Mẫu biến môi trường (commit được)
├── .env.local                  # Biến môi trường dev (gitignored)
│
├── src/                        # ─── FRONTEND ───
│   ├── main.tsx                # Bootstrap React
│   ├── App.tsx                 # Router (React Router 6) — toàn bộ route
│   ├── pages/                  # Trang theo route
│   │   ├── Index.tsx           # Trang chủ
│   │   ├── DashboardPage.tsx   # Bảng tiến độ học sinh
│   │   ├── GradesPage.tsx      # Chọn lớp
│   │   ├── GradePage.tsx       # Trang một lớp (3–9): unit, vocab, grammar
│   │   ├── VocabPage.tsx / GrammarPage.tsx / ExercisesPage.tsx
│   │   ├── Grade10*.tsx        # Lớp 10: Vocab/Grammar/Reading/Tests/Writing
│   │   ├── PracticePage.tsx    # Hub các game luyện tập
│   │   ├── games/              # WordMatch, ListenChoose, SentencePuzzle,
│   │   │                       #   Shadowing, FlashcardMatch, ListenChoosePicture
│   │   ├── PhoneticsPage.tsx   # Bảng phiên âm IPA
│   │   ├── VirtualPetPage.tsx  # Thú ảo (gamification)
│   │   ├── DynamicTestPage.tsx # Đề tự sinh
│   │   ├── CameraPage.tsx      # Bài tập đọc biển báo qua camera
│   │   └── admin/              # Trang admin (chỉ tài khoản có claim admin)
│   │       ├── ImportExam.tsx  # Upload file → preview → lưu Firestore
│   │       ├── ExamList.tsx    # Danh sách đề đã import
│   │       └── Analytics.tsx   # Thống kê lớp học
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── admin/              # RequireAdmin (gate), AdminLayout
│   │   ├── dashboard/          # Widget bảng tiến độ
│   │   ├── Navbar.tsx, ExamReport.tsx, SpeakingFeedback.tsx, ...
│   ├── contexts/
│   │   └── AuthContext.tsx     # Quản lý phiên đăng nhập + profile
│   ├── data/
│   │   ├── loader.ts           # Nạp nội dung: Firestore-first + JSON fallback
│   │   ├── types.ts            # Type runtime (SGKData, Grade10Test, ...)
│   │   ├── vocabulary.ts       # Dữ liệu vocab tĩnh phụ
│   │   └── emojiMap.ts
│   ├── lib/
│   │   ├── firebase.ts         # Khởi tạo Firebase app (auth, db, googleProvider)
│   │   ├── api-client.ts       # Client gọi Worker + ghi Firestore (admin)
│   │   ├── content-schema.ts   # Zod schema — DÙNG CHUNG với Worker (1 nguồn)
│   │   ├── progress.ts         # Đọc/ghi tiến độ học sinh (Firestore)
│   │   ├── analytics.ts        # Tổng hợp thống kê cho trang admin
│   │   ├── pet.ts, srs.ts, daily.ts, diagnostics.ts, testGenerator.ts
│   │   ├── tts.ts              # Text-to-Speech (Puter.js → Web Speech API)
│   │   ├── recorder.ts         # Ghi âm mic cho game Shadowing
│   │   ├── answerMatch.ts      # So khớp đáp án tự luận
│   │   └── *.test.ts           # Unit test (Vitest)
│   └── hooks/                  # use-toast, use-mobile
│
├── public/
│   ├── CNAME                   # "tienganhcoyen.online" (custom domain GitHub Pages)
│   └── data/                   # ─── NỘI DUNG JSON TĨNH (fallback) ───
│       ├── sgk_eng{3..9}_data.json   # Unit SGK lớp 3–9
│       ├── grade10_tests.json        # Đề thi thử lớp 10 (~9 MB)
│       ├── grade10_vocab.json / grade10_grammar.json
│       ├── grade10_reading.json / grade10_writing.json
│       └── images/                   # Ảnh nhúng (biển báo, minh hoạ)
│
├── workers/                    # ─── CLOUDFLARE WORKER ───
│   └── content-importer/
│       ├── wrangler.jsonc      # Cấu hình Worker (name, vars, routes)
│       ├── package.json        # Scripts: dev/deploy/types/tail
│       ├── README.md           # Hướng dẫn deploy Worker
│       └── src/
│           ├── index.ts        # Hono app — định nghĩa route
│           ├── auth.ts         # Verify RS256 Firebase ID token + middleware
│           ├── gemini.ts       # Client gọi Gemini API
│           ├── speaking.ts     # Chấm phát âm (Shadowing)
│           └── env.ts          # Type binding biến môi trường Worker
│
├── scripts/                    # ─── SCRIPT VẬN HÀNH / NỘI DUNG ───
│   ├── batch-import.ts         # Import hàng loạt đề thi DOCX (Bun)
│   ├── generate_explanations.cjs  # Sinh lời giải MCQ bằng Gemini
│   ├── migrate-json-to-firestore.mjs  # Seed Firestore từ public/data
│   ├── grant-admin.mjs         # Cấp claim admin cho tài khoản giáo viên
│   ├── run-batch.bat           # Chạy batch-import.ts ở cửa sổ riêng
│   └── download-*.mjs, fix-signs*.mjs, process_lang_focus.py  # Tiện ích ảnh/biển báo
│
├── content-sources/            # Nguồn đề thi thô (DOCX/RAR) — INPUT cho batch-import
│   └── tienganh/files/<NNN>_*/
│
├── deliverables/               # Sản phẩm từ điển đã build (DOCX + JSON + CSV)
├── tmp/                        # Workspace tạm (batch-import, dict pipeline)
│
├── .claude/
│   ├── launch.json
│   └── skills/content-processor/   # Skill xử lý tài liệu → JSON
│
└── .github/workflows/deploy.yml    # CI/CD → GitHub Pages
```

---

## 4. Frontend (React + Vite)

### Công nghệ
- **React 18 + TypeScript**, bundle bằng **Vite 5** (plugin `@vitejs/plugin-react-swc`).
- **Tailwind CSS 3** + **shadcn/ui** (primitives Radix UI trong `src/components/ui/`).
- **React Router 6** (`BrowserRouter`) — toàn bộ route khai báo trong `src/App.tsx`.
- **TanStack Query** (`QueryClient`) cho cache/async state.
- **Framer Motion** (animation), **Recharts** (biểu đồ analytics), **Sonner** (toast).

### Điểm vào
- `index.html` → `src/main.tsx` → `src/App.tsx`.
- `App.tsx` bọc cây component bằng (theo thứ tự): `QueryClientProvider` → `AuthProvider` → `TooltipProvider` → `BrowserRouter` → `Routes`.

### Nhóm route chính (xem bảng đầy đủ ở [mục 11](#11-bảng-route--endpoint--port))
- Học theo lớp: `/grades`, `/grade/:gradeId`, và route riêng cho lớp 10 (`/grade/10/vocab|grammar|tests|writing|exercises`).
- Luyện tập / game: `/practice`, `/practice/word-match/:gradeId`, `/practice/shadowing/:gradeId`, ...
- Cá nhân: `/dashboard`, `/progress`, `/pet`, `/phonetics/:gradeId`.
- Admin: `/admin` (và con `import`, `exams`, `analytics`) — bọc bằng `<RequireAdmin>`.

### Build cho GitHub Pages
`bun run build` chạy `vite build` rồi **copy `dist/index.html` → `dist/404.html`**. Vì GitHub Pages không hiểu client-side routing, file `404.html` trùng nội dung `index.html` cho phép SPA tự xử lý mọi đường dẫn sâu (deep link) mà không 404.

---

## 5. Cloudflare Worker (API backend)

Worker tên **`co-yen-content-importer`** (thư mục `workers/content-importer/`), viết bằng **Hono**. Đây là backend duy nhất, chạy serverless trên Cloudflare. Port local dev: **8787**.

### Trách nhiệm
1. **Verify Firebase ID token** (RS256) — không dùng `firebase-admin` (không chạy được trên Workers vì cần Node API). Thay vào đó, `src/auth.ts` tự verify JWT:
   - Tải public cert của Google từ `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`, cache theo `Cache-Control` (per-isolate).
   - Trích `SubjectPublicKeyInfo` từ cert X.509, import thành `CryptoKey`, verify chữ ký `RSASSA-PKCS1-v1_5 / SHA-256`.
   - Kiểm tra `iss == https://securetoken.google.com/{FIREBASE_PROJECT_ID}`, `aud == {FIREBASE_PROJECT_ID}`, `exp` còn hạn, `iat` không ở tương lai, có `sub` (uid).
   - Hai middleware: `requireAdmin` (bắt buộc claim `admin: true`) và `requireUser` (chỉ cần đăng nhập).
2. **Import nội dung** (route `/api/import/exam`, `/api/import/sgk`): nhận file PDF/DOCX (multipart, ≤ 20 MB), gửi cho Gemini với Zod schema để trích xuất JSON, trả preview về cho admin. **Worker KHÔNG ghi Firestore** — admin tự ghi từ client (xem [mục 8](#8-cơ-chế-nội-dung-firestore-first--json-fallback)).
3. **Chấm phát âm** (`/api/grade/speaking`): nhận audio (≤ 10 MB) + câu mẫu, gửi Gemini (audio native), trả về verdict điểm + lời khuyên tiếng Việt.

### CORS
Cho phép origin: `ALLOWED_ORIGIN` (production = `https://tienganhcoyen.online`), `http://localhost:5173`, `http://localhost:8080`.

### Mã lỗi Gemini
`src/gemini.ts` phân loại lỗi Gemini thành `quota | auth | unavailable | invalid_input | unknown`, mỗi loại có HTTP status + thông điệp tiếng Việt (`vi`) để UI hiển thị cho cô Yến/học sinh. Ví dụ `quota` → HTTP 429 → "Gemini API đã hết quota...".

---

## 6. Firebase (Auth + Firestore)

- **Project**: `english-class-28f06` (xem `.env.example` / `wrangler.jsonc`).
- **Auth domain**: `english-class-28f06.firebaseapp.com`.

### Phương thức đăng nhập
- **Google** (`signInWithPopup`, fallback `signInWithRedirect` nếu popup bị chặn).
- **Ẩn danh** (`signInAnonymously`): mọi khách chưa đăng nhập tự được cấp một identity ẩn danh để tiến độ / thú ảo hoạt động cục bộ theo thiết bị. Trang admin từ chối tài khoản ẩn danh.

### Collections Firestore (cấu trúc + quyền)

Tệp `firestore.rules` là cốt lõi kiểm soát quyền. Tóm tắt:

| Collection / path | Đọc | Ghi |
|---|---|---|
| `users/{uid}` | mọi user đã đăng nhập (cho leaderboard/analytics) | tạo: chính chủ; sửa: chính chủ hoặc admin; xoá: cấm |
| `progress/{uid}` | mọi user đã đăng nhập | tạo/sửa: chính chủ; xoá: cấm |
| `pets/{uid}` | mọi user đã đăng nhập | tạo/sửa: chính chủ; xoá: cấm |
| `exams/{grade}/tests/{examId}` | mọi user đã đăng nhập | chỉ admin |
| `sgk/{grade}/units/{unitId}` | mọi user đã đăng nhập | chỉ admin |
| `speaking_attempts/{uid}/items/{attemptId}` | chính chủ hoặc admin | tạo: chính chủ; sửa/xoá: cấm (append-only) |
| `writing_attempts/{uid}/items/{attemptId}` | chính chủ hoặc admin | tạo: chính chủ; sửa/xoá: cấm (append-only) |
| mọi path khác | cấm | cấm |

Helper trong rules: `isSignedIn()`, `isOwner(uid)` (`request.auth.uid == uid`), `isAdmin()` (`request.auth.token.admin == true`).

> Lưu ý: có thêm collection `grade10_vocab/{topicId}` và `grade10_grammar/{topicId}` được `api-client.ts::saveImportResult` và `loader.ts` dùng. Hiện chưa có rule riêng cho hai path này nên chúng rơi vào quy tắc "cấm mọi path khác" — chỉ ghi/đọc được nếu bổ sung rule. Đề thi và unit SGK (`exams/*`, `sgk/*`) là hai loại đã có rule đầy đủ và đang hoạt động.

### Quyền admin
Là **custom claim** `admin: true` trong ID token, được cấp bằng `scripts/grant-admin.mjs <email>` (cần Firebase service account — xem [OPERATIONS.md](./OPERATIONS.md)). Sau khi cấp, giáo viên phải đăng xuất/đăng nhập lại để token mới có claim.

---

## 7. Luồng xác thực (Auth)

Quản lý trong `src/contexts/AuthContext.tsx`:

1. Khi tải trang, `getRedirectResult(auth)` thu kết quả nếu trước đó đã fallback sang redirect.
2. `onAuthStateChanged` lắng nghe trạng thái:
   - Nếu **chưa có user** → tự gọi `signInAnonymously(auth)` (guard `anonInFlight` chống gọi trùng). Listener sẽ fire lại với user ẩn danh.
   - Nếu **có user** → load profile từ Firestore (`getUserProfile`), tạo mới nếu chưa có (`createUserProfile`), set `loading = false`.
3. `signInWithGoogle()`: thử `signInWithPopup`; nếu popup bị chặn/đóng (`auth/popup-blocked`, `auth/popup-closed-by-user`, ...) thì fallback `signInWithRedirect`.
4. Context expose: `user`, `profile`, `loading`, `signInWithGoogle`, `logout`, `selectGrade`, `refreshProfile`.

**Gate admin** (`src/components/admin/RequireAdmin.tsx`):
- Đọc `user.getIdTokenResult()`, kiểm tra `claims.admin === true`.
- `granted` → render trang admin. `denied` + ẩn danh → hiện nút "Đăng nhập với Google". `denied` + đã đăng nhập nhưng không phải admin → "Không có quyền".

**Worker verify**: mỗi request tới `/api/*` đính `Authorization: Bearer <ID token>`. Worker tự verify RS256 (xem [mục 5](#5-cloudflare-worker-api-backend)); route import yêu cầu claim `admin`.

---

## 8. Cơ chế nội dung: Firestore-first + JSON fallback

Logic trong `src/data/loader.ts`. Mỗi dataset:

1. **Luôn nạp file JSON tĩnh** từ `public/data/*.json` làm baseline (đi kèm bundle, nhanh, không bao giờ xoá).
2. **Thử đọc Firestore** cùng loại:
   - SGK lớp 3–9: collection `sgk/grade{N}/units` → merge đè lên `units` của JSON.
   - Đề lớp 10: collection `exams/grade10/tests` → thêm vào theo doc id (không ghi đè key `test1/test2/...` của JSON).
   - Vocab/Grammar lớp 10: collection `grade10_vocab` / `grade10_grammar` → merge theo key.
3. **Nếu Firestore trống hoặc lỗi** → dùng nguyên JSON (log cảnh báo, không vỡ UI).
4. Kết quả cache in-memory (`Map`); `clearContentCache()` xoá cache sau khi admin lưu nội dung mới.

> Triết lý: JSON tĩnh là "bộ dữ liệu gốc" (bootstrap), không bao giờ bị xoá. Khi cô Yến import một unit/đề vào Firestore, bản Firestore sẽ đè/bổ sung lên JSON tại runtime.

### Đường ghi nội dung mới (admin)
`src/lib/api-client.ts::saveImportResult` ghi **trực tiếp** vào Firestore bằng Firebase SDK (dùng ID token của chính admin + security rules), KHÔNG qua Worker. Đường dẫn doc resolve theo `kind`:
- `exam` → `exams/grade{N}/tests/{slug-title}`
- `sgk_unit` → `sgk/grade{N}/units/{unitKey}`
- `grade10_vocab` / `grade10_grammar` → `grade10_vocab/{topicId}` / `grade10_grammar/{topicId}`

Mặc định không ghi đè (kiểm tra tồn tại trước, ném lỗi 409); truyền `overwrite=true` để thay.

---

## 9. Tính năng AI (hiện tạm tắt)

Các tính năng AI gọi **Google Gemini API** qua Worker. Worker cần secret `GEMINI_API_KEY`. **Hiện tại API key chưa được cấu hình (đã bị gỡ), nên toàn bộ tính năng AI tạm thời không hoạt động.** Đây là trạng thái có chủ đích, **không phải lỗi** — phần còn lại của ứng dụng (học, luyện tập, làm đề có sẵn, tiến độ, thú ảo) hoạt động bình thường vì không phụ thuộc Gemini.

Các tính năng AI và trạng thái hiện tại:

| Tính năng | Endpoint / script | Trạng thái khi thiếu key |
|---|---|---|
| Chấm phát âm (game Shadowing) | Worker `POST /api/grade/speaking` (`speaking.ts`) → dùng ở `src/pages/games/ShadowingPage.tsx::gradeSpeaking` | Trả lỗi `auth` (HTTP 502) → UI hiện thông điệp tiếng Việt; phần ghi âm/nghe vẫn chạy nhưng không có điểm AI |
| Import đề thi / unit từ file | Worker `POST /api/import/exam`, `POST /api/import/sgk` → trang `/admin/import` | Trả lỗi `auth` → không trích xuất được; admin vẫn có thể nhập tay nếu cần |
| Chấm viết (writing) | Dự kiến `POST /api/grade/writing` | **Chưa triển khai** (route chưa tồn tại). Trang `Grade10WritingPage.tsx` ghi rõ là tính năng tương lai |
| Sinh lời giải MCQ hàng loạt | Script `scripts/generate_explanations.cjs` (chạy thủ công bằng `node`, cần `GEMINI_API_KEY`) | Báo lỗi và thoát nếu thiếu key |

Mọi đề/unit/lời giải đã sinh **trước đây** vẫn nằm trong `public/data/*.json` và Firestore, học sinh dùng bình thường — AI chỉ cần thiết để tạo nội dung MỚI hoặc chấm bài realtime.

> Để bật lại: tạo Gemini API key (<https://aistudio.google.com/apikey>), nạp vào Worker bằng `npx wrangler secret put GEMINI_API_KEY` rồi `npm run deploy`. Chi tiết ở [OPERATIONS.md](./OPERATIONS.md).

Model Gemini đang khai báo trong code: `gemini-2.5-flash` (`workers/content-importer/src/gemini.ts`). Script sinh lời giải xoay vòng nhiều model nếu bị rate-limit.

---

## 10. Biến môi trường

### Frontend (build-time, prefix `VITE_`)
Khai báo trong `.env.local` (dev, gitignored) và **repo secrets GitHub** (production, inject qua `deploy.yml`). `src/lib/firebase.ts` bắt buộc phải có (`requireEnv`) — thiếu sẽ ném lỗi rõ ràng.

| Biến | Ý nghĩa |
|---|---|
| `VITE_FIREBASE_API_KEY` | Web API key của Firebase (referrer-restricted) |
| `VITE_FIREBASE_AUTH_DOMAIN` | `english-class-28f06.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `english-class-28f06` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `english-class-28f06.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `968347388200` |
| `VITE_FIREBASE_APP_ID` | App ID Firebase |
| `VITE_FIREBASE_MEASUREMENT_ID` | ID Analytics (tuỳ chọn) |
| `VITE_API_BASE_URL` | URL Worker. Dev: `http://localhost:8787`; Prod: `https://api.tienganhcoyen.online` |

### Worker
- **Vars** (trong `wrangler.jsonc`): `ALLOWED_ORIGIN`, `FIREBASE_PROJECT_ID`.
- **Secret** (qua `wrangler secret put`): `GEMINI_API_KEY` — **hiện trống/đã gỡ**, xem [mục 9](#9-tính-năng-ai-hiện-tạm-tắt).

> Web API key của Firebase an toàn để lộ ở client (đây là cách Firebase thiết kế), nhưng được giới hạn HTTP referrer (`tienganhcoyen.online`, `truongnocode.github.io`, `localhost:5173`). Bảo mật thực sự nằm ở **Firestore security rules** + **App Check** (nếu bật), không phải ở việc giấu key.

---

## 11. Bảng route / endpoint / port

### Port (local dev)
| Process | Lệnh | Port |
|---|---|---|
| Frontend (Vite dev) | `bun run dev` | **5173** |
| Worker (Wrangler dev) | `npm run dev` (trong `workers/content-importer/`) | **8787** |
| Vite preview (build) | `bun run preview` | 4173 (mặc định Vite) |

### Route frontend (`src/App.tsx`)
| Route | Trang |
|---|---|
| `/` | Index |
| `/dashboard` | DashboardPage |
| `/grades` | GradesPage |
| `/grade/:gradeId` | GradePage (lớp 3–9) |
| `/grade/:gradeId/vocab/:unitKey` | VocabPage |
| `/grade/:gradeId/grammar/:unitKey` | GrammarPage |
| `/grade/:gradeId/exercises/:unitKey` | ExercisesPage |
| `/grade/:gradeId/camera` | CameraPage |
| `/grade/10/vocab` | Grade10VocabPage |
| `/grade/10/grammar` | Grade10GrammarPage |
| `/grade/10/exercises` | Grade10ReadingPage |
| `/grade/10/tests` và `/grade/10/tests/:collection` | Grade10TestsPage |
| `/grade/10/writing` | Grade10WritingPage |
| `/progress` | ProgressPage |
| `/practice` | PracticePage |
| `/practice/word-match/:gradeId` | WordMatchGame |
| `/practice/listen/:gradeId` | ListenChooseGame |
| `/practice/sentence-puzzle/:gradeId` | SentencePuzzle |
| `/practice/shadowing/:gradeId` | ShadowingPage (cần AI để chấm) |
| `/practice/flashcard-match/:gradeId` | FlashcardMatchGame |
| `/practice/listen-picture/:gradeId` | ListenChoosePicture |
| `/practice/srs-review` | SRSReviewPage |
| `/phonetics/:gradeId` | PhoneticsPage |
| `/pet` | VirtualPetPage |
| `/test/custom` | DynamicTestPage |
| `/admin` (+ `import`, `exams`, `analytics`) | Trang admin (gate `RequireAdmin`) |
| `*` | NotFound |

### Endpoint Worker (`workers/content-importer/src/index.ts`)
| Method | Path | Auth | Mục đích |
|---|---|---|---|
| GET | `/health` | public | Liveness probe — trả `{ ok: true, ... }` |
| POST | `/api/import/exam` | admin | Upload PDF/DOCX đề thi → Gemini → preview JSON |
| POST | `/api/import/sgk` | admin | Upload nguồn → preview unit SGK (lớp 3–9) |
| POST | `/api/grade/speaking` | user đã đăng nhập | Chấm phát âm bài Shadowing (Gemini audio native) |

Giới hạn upload: file import ≤ 20 MB (MIME pdf/docx/doc); audio ≤ 10 MB (các MIME `audio/*`).
