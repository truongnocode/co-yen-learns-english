# Co Yến Learns English

English learning platform for Vietnamese students (grades 3–10). Production: **[tienganhcoyen.online](https://tienganhcoyen.online)**

## What it does

- **Self-study lessons** by grade, aligned to SGK iLearn Smart Start (grades 3-9) and Global Success (grade 10)
- **Practice games**: word matching, listen-and-choose, sentence puzzles, shadowing, flashcard matching, listen-to-picture
- **Practice exams**: Multi-part grade-10 mock tests with auto-grading and explanations
- **Progress tracking**: quiz history, streaks, virtual pet that evolves with study activity
- **Admin panel** (teacher-only): upload Word/PDF → AI-parsed JSON → publish exams without code changes

## Tech stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router 6, TanStack Query, Framer Motion, Recharts
- **Auth & DB**: Firebase Auth (Google), Firestore
- **Backend API**: Cloudflare Worker (Hono) — handles AI content import, writing grading, speech scoring
- **AI**: Claude API (structured outputs for content extraction + writing feedback) + Whisper API (pronunciation scoring)
- **Hosting**: GitHub Pages (static site) + Cloudflare Workers (API at `api.tienganhcoyen.online`)

## Repo layout

```
.
├── src/                    # React app
│   ├── pages/              # Route pages (dashboard, grade/*, practice/*, admin/*)
│   ├── components/         # Reusable UI (shadcn + custom)
│   ├── contexts/           # AuthContext
│   ├── data/               # Content loader + TypeScript types
│   ├── lib/                # firebase.ts, answerMatch, utils
│   └── hooks/
├── public/
│   ├── data/               # Static JSON content (legacy; fallback if Firestore empty)
│   └── images/signs/       # Sign-reading exam visuals
├── workers/                # Cloudflare Worker(s) — created in Phase 3
│   └── content-importer/
├── scripts/                # One-off migration scripts
├── .claude/skills/         # content-processor skill (PDF/DOCX → JSON)
└── .github/workflows/      # CI/CD
```

## Local development

### Prereqs
- [Bun](https://bun.sh) >= 1.0 (or Node 20+ with npm)
- A Firebase project (get one at [console.firebase.google.com](https://console.firebase.google.com))

### Setup
```bash
bun install
cp .env.example .env.local
# Edit .env.local with your Firebase credentials
bun run dev
```

The app runs at <http://localhost:5173>.

### Scripts
| Command | What it does |
|---|---|
| `bun run dev` | Vite dev server with HMR |
| `bun run build` | Production build to `dist/` (also creates `404.html` for GitHub Pages SPA routing) |
| `bun run test` | Vitest unit tests |
| `bun run lint` | ESLint |
| `bun run preview` | Preview the production build locally |

## Content pipeline

Adding a new exam used to require hand-editing `public/data/grade10_tests.json`. The new flow:

1. Teacher logs in to `/admin` (Firebase custom claim `admin: true`)
2. Uploads a Word/PDF exam paper on `/admin/import`
3. Worker forwards the file to Claude API with a structured-output schema (`src/lib/content-schema.ts`)
4. Preview → edit → save to Firestore `exams/{grade}/{examId}`
5. Students fetch via `src/lib/content-loader.ts` (Firestore-first, JSON fallback)

Legacy JSON files in `public/data/` remain as the bootstrap dataset (never deleted, per project policy).

## Deployment

- `main` branch push triggers GitHub Actions (`.github/workflows/deploy.yml`) which builds via Bun and publishes `dist/` to GitHub Pages
- Firebase config and API base URL are injected from repo secrets (`VITE_FIREBASE_*`, `VITE_API_BASE_URL`)
- Cloudflare Worker is deployed separately via `wrangler deploy` (see `workers/content-importer/README.md`)
- Custom domain `tienganhcoyen.online` is configured via `public/CNAME`

## Security notes

- Firebase web API key **was previously hardcoded** in `src/lib/firebase.ts` — it has been moved to env vars. Rotate the leaked key `AIzaSyBU_...` in Firebase Console if it has not been rotated yet.
- `.env.local` is gitignored. Never commit real keys.
- Firestore security rules (`firestore.rules`) restrict writes to owners and admins.
- Cloudflare Worker verifies Firebase ID tokens and requires admin claim for content-mutation routes.

## Migration notes

This repo was migrated on 2026-04-15 from `D:\WORK\Claude Desktop\co-yen-learns-english`. See the full plan at `C:\Users\Truong\.claude\plans\inherited-launching-wand.md`.
