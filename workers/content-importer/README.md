# co-yen-content-importer

Cloudflare Worker backend for the Co Yến admin panel and AI scoring features.

## Routes

| Method | Path                   | Auth        | Purpose                                           |
|--------|------------------------|-------------|---------------------------------------------------|
| GET    | `/health`              | public      | Liveness probe                                    |
| POST   | `/api/import/exam`     | admin       | Upload PDF/DOCX exam → Gemini → preview JSON      |
| POST   | `/api/import/sgk`      | admin       | Upload source → SGK unit preview                  |
| POST   | `/api/grade/speaking`  | any user    | Score a shadowing attempt (Gemini native audio)   |

Auth is a Firebase ID token in `Authorization: Bearer <token>`. Admin routes
additionally require the `admin: true` custom claim (set via
`scripts/grant-admin.mjs` in the repo root).

Firestore writes happen **client-side** via the Firebase SDK, not through this
Worker — `src/lib/api-client.ts::saveImportResult` uses the admin user's own
ID token + Firestore security rules. The Worker stays credential-light.

## Setup

```bash
cd workers/content-importer
npm install
```

### Configure secrets

```bash
npx wrangler secret put GEMINI_API_KEY   # get one at https://aistudio.google.com/apikey
```

That's the only Worker secret — Gemini handles both PDF/DOCX parsing and
native audio scoring. Firestore writes happen client-side via the admin user's
own Firebase SDK session. Vars (`ALLOWED_ORIGIN`, `FIREBASE_PROJECT_ID`) live
in `wrangler.jsonc`.

### Error handling

Gemini failures are classified into typed responses (see `GeminiError` in
`src/gemini.ts`):

| `kind`         | HTTP | Surfaced Vietnamese message |
|----------------|-----:|-----------------------------|
| `quota`        |  429 | "Gemini API đã hết quota. Cô Yến vui lòng đợi vài phút rồi thử lại…" |
| `auth`         |  502 | "Gemini API key không hợp lệ hoặc đã bị thu hồi." |
| `unavailable`  |  503 | "Gemini tạm thời gián đoạn. Xin thử lại sau ít phút." |
| `invalid_input`|  400 | "File hoặc dữ liệu gửi lên không hợp lệ…" |
| `unknown`      |  502 | "Gemini trả lỗi không xác định…" |

The admin UI / shadowing page `toast.error()` on `res.error` so the student
sees the VI message directly.

## Local dev

```bash
npm run dev          # wrangler dev on :8787
```

From the React app set `VITE_API_BASE_URL=http://localhost:8787` and the
browser will talk to your local worker. CORS already allows
`localhost:5173` and `localhost:8080`.

## Deploy

```bash
npm run deploy
```

### DNS (one-time)

1. In Cloudflare → your domain → DNS, ensure `tienganhcoyen.online` is
   an existing zone.
2. Uncomment the `routes` entry in `wrangler.jsonc`:
   ```jsonc
   "routes": [
     { "pattern": "api.tienganhcoyen.online/*", "zone_name": "tienganhcoyen.online" }
   ]
   ```
3. `npm run deploy` — wrangler will create the subdomain route.
4. Wait ~1 minute, then `curl https://api.tienganhcoyen.online/health` — should return `{"ok":true,...}`.

## Observability

`observability.enabled = true` in `wrangler.jsonc` — logs appear in the
Cloudflare dashboard. For live tailing during incident triage:

```bash
npm run tail
```

## Type-checking

```bash
npm run types   # tsc --noEmit
```

The tsconfig includes `../../src/lib/content-schema.ts` so the Zod schemas
are shared verbatim with the React app — one source of truth.
