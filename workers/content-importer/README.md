# co-yen-content-importer

Cloudflare Worker backend for the Co Yến admin panel and AI scoring features.

## Routes

| Method | Path                   | Auth        | Purpose                                           |
|--------|------------------------|-------------|---------------------------------------------------|
| GET    | `/health`              | public      | Liveness probe                                    |
| POST   | `/api/import/exam`     | admin       | Upload PDF/DOCX exam → Claude → preview JSON      |
| POST   | `/api/import/sgk`      | admin       | Upload source → SGK unit preview                  |
| POST   | `/api/import/save`     | admin       | Persist a verified `ImportResult` to Firestore    |
| POST   | `/api/grade/speaking`  | any user    | Score a shadowing attempt (Whisper + Claude)      |

Auth is a Firebase ID token in `Authorization: Bearer <token>`. Admin routes
additionally require the `admin: true` custom claim (set via
`scripts/grant-admin.mjs` in the repo root).

## Setup

```bash
cd workers/content-importer
npm install
```

### Configure secrets

```bash
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put OPENAI_API_KEY          # for Whisper / speaking
npx wrangler secret put FIREBASE_CLIENT_EMAIL   # service-account email
npx wrangler secret put FIREBASE_PRIVATE_KEY    # service-account private key
```

The `FIREBASE_PRIVATE_KEY` value should be the full PEM with literal `\n`
newlines preserved (copy the string from your JSON service account file
exactly). Vars (`ALLOWED_ORIGIN`, `FIREBASE_PROJECT_ID`) live in
`wrangler.jsonc`.

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
