# Vận hành & triển khai — Học cùng cô Yến

Hướng dẫn deploy, cấu hình hạ tầng, backup và clone instance cho giáo viên/trung tâm khác. Đọc kèm [ARCHITECTURE.md](./ARCHITECTURE.md) (kiến trúc) và [CONTENT-PIPELINE.md](./CONTENT-PIPELINE.md) (nội dung).

---

## Mục lục

1. [Thành phần hạ tầng](#1-thành-phần-hạ-tầng)
2. [Chạy local (dev)](#2-chạy-local-dev)
3. [Deploy frontend (GitHub Pages)](#3-deploy-frontend-github-pages)
4. [Deploy Cloudflare Worker](#4-deploy-cloudflare-worker)
5. [Cấu hình Firebase](#5-cấu-hình-firebase)
6. [Cấp quyền admin cho giáo viên](#6-cấp-quyền-admin-cho-giáo-viên)
7. [Bật lại tính năng AI (Gemini key)](#7-bật-lại-tính-năng-ai-gemini-key)
8. [Backup & Git](#8-backup--git)
9. [Clone instance cho giáo viên/trung tâm khác](#9-clone-instance-cho-giáo-viêntrung-tâm-khác)
10. [Sự cố thường gặp](#10-sự-cố-thường-gặp)

---

## 1. Thành phần hạ tầng

Không có máy chủ luôn chạy. Toàn bộ là dịch vụ managed/serverless:

| Thành phần | Nhà cung cấp | Định danh production | Cách deploy |
|---|---|---|---|
| Frontend (static SPA) | GitHub Pages | `tienganhcoyen.online` (CNAME) | push `main` → GitHub Actions |
| API backend | Cloudflare Workers | `co-yen-content-importer` @ `api.tienganhcoyen.online` | `wrangler deploy` |
| Auth + Database | Firebase / Google Cloud | project `english-class-28f06` | Firebase Console / `firebase deploy` (rules) |
| Source + CI | GitHub | `github.com/truongnocode/co-yen-learns-english` (public) | `git push` |

> Không cần watchdog, scheduled task, Docker hay tunnel cho dự án này. Mọi thứ tự host trên hạ tầng đám mây.

---

## 2. Chạy local (dev)

### Yêu cầu
- [Bun](https://bun.sh) ≥ 1.0 (runtime chính; Node 20+ cũng chạy được phần lớn script).
- Một Firebase project (có thể dùng project hiện tại `english-class-28f06` hoặc tạo riêng).

### Frontend
```bash
bun install
cp .env.example .env.local
# Điền VITE_FIREBASE_* + VITE_API_BASE_URL vào .env.local
bun run dev
```
Mở <http://localhost:5173>.

| Lệnh | Tác dụng |
|---|---|
| `bun run dev` | Vite dev server (HMR), port 5173 |
| `bun run build` | Build production vào `dist/` (đồng thời tạo `404.html` cho SPA routing) |
| `bun run preview` | Xem thử bản build |
| `bun run test` | Vitest (unit test) |
| `bun run lint` | ESLint |

### Worker (nếu cần test tính năng AI cục bộ)
```bash
cd workers/content-importer
npm install
npm run dev          # wrangler dev trên port 8787
```
Đặt `VITE_API_BASE_URL=http://localhost:8787` trong `.env.local` để frontend gọi Worker local. CORS đã cho phép `localhost:5173` và `localhost:8080`.

---

## 3. Deploy frontend (GitHub Pages)

CI/CD tự động qua `.github/workflows/deploy.yml`:

1. Push lên nhánh `main`.
2. GitHub Actions chạy: `bun install --frozen-lockfile` → `bun run lint` → `bun run test` → `bun run build` → upload `dist/` lên GitHub Pages.
3. Pages phục vụ tại custom domain `tienganhcoyen.online` (file `public/CNAME`).

### Secrets cần có trên GitHub repo (Settings → Secrets and variables → Actions)
`deploy.yml` inject các biến build-time từ repo secrets:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_API_BASE_URL          # = https://api.tienganhcoyen.online
```
> Nếu thiếu một secret `VITE_FIREBASE_*` bắt buộc, build vẫn chạy nhưng app sẽ ném lỗi runtime ("Missing environment variable ...") vì `src/lib/firebase.ts::requireEnv`.

### Lưu ý GitHub Pages + SPA
`bun run build` copy `dist/index.html` → `dist/404.html`. Đây là cơ chế bắt buộc để deep link (vd `/grade/10/tests`) không bị 404 — đừng bỏ bước này khỏi script `build`.

---

## 4. Deploy Cloudflare Worker

Thư mục: `workers/content-importer/`. Cấu hình: `wrangler.jsonc`.

```bash
cd workers/content-importer
npm install
npm run deploy          # = wrangler deploy
```

### Vars (đã khai báo trong wrangler.jsonc, không phải secret)
```jsonc
"vars": {
  "ALLOWED_ORIGIN": "https://tienganhcoyen.online",
  "FIREBASE_PROJECT_ID": "english-class-28f06"
}
```

### Secret
```bash
npx wrangler secret put GEMINI_API_KEY    # tính năng AI; HIỆN ĐANG TRỐNG/ĐÃ GỠ
```

### Gắn vào domain `api.tienganhcoyen.online` (một lần)
1. Đảm bảo zone `tienganhcoyen.online` đã có trên Cloudflare.
2. Bỏ comment phần `routes` trong `wrangler.jsonc`:
   ```jsonc
   "routes": [
     { "pattern": "api.tienganhcoyen.online/*", "zone_name": "tienganhcoyen.online" }
   ]
   ```
3. `npm run deploy` → wrangler tạo route subdomain.
4. Kiểm tra: `curl https://api.tienganhcoyen.online/health` → `{"ok":true,...}`.

### Lệnh tiện ích
| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Wrangler dev trên :8787 |
| `npm run deploy` | Deploy lên Cloudflare |
| `npm run tail` | Xem log realtime (triage sự cố) |
| `npm run types` | `tsc --noEmit` (type-check, dùng chung schema với frontend) |

Observability đã bật (`observability.enabled = true`) — log hiển thị trong Cloudflare dashboard.

---

## 5. Cấu hình Firebase

Project hiện tại: **`english-class-28f06`**.

### Auth
- Bật **Google** provider và **Anonymous** provider (Firebase Console → Authentication → Sign-in method).
- Thêm domain được uỷ quyền (Authorized domains): `tienganhcoyen.online`, `truongnocode.github.io`, `localhost`.

### Firestore
- Database mode: Native.
- Deploy security rules từ `firestore.rules`:
  ```bash
  firebase deploy --only firestore:rules
  ```
  (`firebase.json` đã trỏ `firestore.rules`.) Rules là lớp bảo mật chính — kiểm soát ai đọc/ghi collection nào (xem [ARCHITECTURE.md §6](./ARCHITECTURE.md#6-firebase-auth--firestore)).

### Web API key
Key client trong `.env.local` / repo secrets được giới hạn HTTP referrer (`tienganhcoyen.online`, `truongnocode.github.io`, `localhost:5173`) tại Google Cloud Console → Credentials. Đây là cách Firebase thiết kế — bảo mật thực sự nằm ở Firestore rules, không phải ở việc giấu key.

---

## 6. Cấp quyền admin cho giáo viên

Quyền admin là custom claim `admin: true` trong ID token.

```bash
# Cần Firebase service account JSON
#   - set GOOGLE_APPLICATION_CREDENTIALS=path\to\serviceAccount.json
#   - HOẶC đặt serviceAccount.json ở thư mục gốc repo (gitignored)
node scripts/grant-admin.mjs teacher@example.com
```

Sau khi cấp, giáo viên phải **đăng xuất và đăng nhập lại** (hoặc refresh ID token) để claim mới có hiệu lực. Trang `/admin` đọc `user.getIdTokenResult().claims.admin` để gate.

> Lấy service account: Firebase Console → Project settings → Service accounts → Generate new private key. File này CỰC KỲ nhạy cảm, không bao giờ commit.

---

## 7. Bật lại tính năng AI (Gemini key)

Mọi tính năng AI (chấm phát âm, import qua admin, sinh lời giải) dùng **Google Gemini** và cần `GEMINI_API_KEY`. **Key hiện đã gỡ → các tính năng này tạm tắt** (xem [ARCHITECTURE.md §9](./ARCHITECTURE.md#9-tính-năng-ai-hiện-tạm-tắt)). Phần học/luyện tập/đề có sẵn không bị ảnh hưởng.

Để bật lại:
1. Tạo key tại <https://aistudio.google.com/apikey>.
2. Nạp vào Worker:
   ```bash
   cd workers/content-importer
   npx wrangler secret put GEMINI_API_KEY
   npm run deploy
   ```
3. (Tuỳ chọn) chạy script sinh lời giải cục bộ:
   ```bash
   set GEMINI_API_KEY=your-key      # Windows
   node scripts/generate_explanations.cjs
   ```

Sau khi nạp key, các route `/api/grade/speaking`, `/api/import/exam`, `/api/import/sgk` hoạt động lại ngay, không cần đổi code.

> `/api/grade/writing` (chấm viết) là tính năng **chưa triển khai** — route chưa tồn tại trong Worker. Đây là việc làm trong tương lai, không phải cấu hình.

---

## 8. Backup & Git

- **Remote**: `origin` = `https://github.com/truongnocode/co-yen-learns-english.git` (public).
- **Nhánh chính**: `main` (push vào đây trigger deploy).
- Nhánh khác hiện có: `security-key-rotation`, `v2-migration`.

### Quy ước
- Push `main` = deploy production. Cân nhắc test (`bun run test && bun run lint`) trước khi push.
- `.env.local` và `serviceAccount.json` **gitignored** — không bao giờ commit key thật.
- Toàn bộ source + nội dung JSON nằm trong git → bản thân repo public trên GitHub là một bản backup. Để backup riêng: `git clone --mirror` hoặc đẩy thêm remote.
- File lớn: `public/data/grade10_tests.json` ~9 MB — vẫn nằm trong git (không phải LFS).

---

## 9. Clone instance cho giáo viên/trung tâm khác

Mỗi instance độc lập gồm **3 thành phần riêng**: 1 Firebase project + 1 Cloudflare Worker + 1 GitHub Pages repo. Các bước:

### Bước 1 — Fork/clone source
```bash
git clone https://github.com/truongnocode/co-yen-learns-english.git ten-trung-tam-english
# Tạo repo GitHub mới (vd github.com/<org>/ten-trung-tam-english), đổi remote origin
```

### Bước 2 — Firebase project mới
1. Tạo project mới ở [Firebase Console](https://console.firebase.google.com).
2. Bật Authentication (Google + Anonymous) + thêm authorized domains (domain mới + `localhost`).
3. Tạo Firestore (Native) + deploy rules: `firebase deploy --only firestore:rules`.
4. Tạo Web App → lấy config, điền vào `.env.local` (dev) và repo secrets (production):
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`.

### Bước 3 — Cloudflare Worker mới
1. Trong `workers/content-importer/wrangler.jsonc`, đổi:
   - `name` (vd `tentrungtam-content-importer`),
   - `vars.ALLOWED_ORIGIN` (domain mới),
   - `vars.FIREBASE_PROJECT_ID` (project id mới),
   - `routes` (subdomain api của domain mới).
2. `npm install && npm run deploy`.
3. (Khi cần AI) `npx wrangler secret put GEMINI_API_KEY`.
4. Đặt `VITE_API_BASE_URL` (repo secret) = URL Worker mới.

### Bước 4 — Domain + GitHub Pages
1. Sửa `public/CNAME` thành domain mới.
2. Cấu hình DNS domain mới trỏ về GitHub Pages.
3. Đặt 8 repo secrets (7 `VITE_FIREBASE_*` + `VITE_API_BASE_URL`).
4. Push `main` → CI deploy.

### Bước 5 — Nội dung + admin
1. Nội dung gốc trong `public/data/*.json` đi kèm sẵn. Để đưa lên Firestore mới: `node scripts/migrate-json-to-firestore.mjs` (cần service account của project mới).
2. Cấp admin cho giáo viên: `node scripts/grant-admin.mjs <email>` (service account project mới).

> Điểm cần thay khi clone (checklist nhanh): `wrangler.jsonc` (name/vars/routes), `public/CNAME`, 8 repo secrets, service account + Firebase config của project mới. Code không cần sửa.

---

## 10. Sự cố thường gặp

| Triệu chứng | Nguyên nhân khả dĩ | Cách xử lý |
|---|---|---|
| App trắng trang, console "Missing environment variable VITE_FIREBASE_*" | Thiếu repo secret / `.env.local` | Điền đủ biến `VITE_FIREBASE_*` |
| Deep link (vd `/grade/10/tests`) bị 404 trên Pages | Thiếu `dist/404.html` | Đảm bảo script `build` chạy bước copy `index.html → 404.html` |
| Đăng nhập Google báo `auth/unauthorized-domain` | Domain chưa nằm trong authorized domains | Thêm domain vào Firebase Auth |
| Trang admin báo "Không có quyền" dù đã cấp admin | Token cũ chưa có claim | Đăng xuất + đăng nhập lại |
| Import file / chấm phát âm báo lỗi "Gemini API key không hợp lệ" | `GEMINI_API_KEY` trống/đã gỡ (trạng thái hiện tại) | Nạp lại key (xem [§7](#7-bật-lại-tính-năng-ai-gemini-key)) — đây là tính năng tạm tắt, không phải bug |
| Ghi Firestore bị từ chối (permission denied) | Sai security rules hoặc thiếu claim admin | Kiểm tra `firestore.rules` đã deploy; với `grade10_vocab/*`, `grade10_grammar/*` cần bổ sung rule (hiện chưa có) |
| `batch-import.ts` không gọi được Claude | `CLAUDE_EXE` trỏ sai phiên bản | Sửa đường dẫn `CLAUDE_EXE` ở `scripts/batch-import.ts` cho khớp phiên bản Claude Code đã cài |
| `curl api.../health` không trả về | Worker chưa deploy / route chưa gắn | `npm run deploy` + kiểm tra `routes` trong `wrangler.jsonc` |
