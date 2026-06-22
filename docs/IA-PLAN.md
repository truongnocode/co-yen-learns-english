# Information Architecture Plan — "Học cùng cô Yến"

> **Status:** Master plan for reorganizing the whole app. Drives the rollout. Pairs with `docs/DESIGN-SYSTEM.md` ("Sân trường" visual system) — that doc owns *how it looks*, this doc owns *how it's structured and navigated*.
>
> **Stack:** React + Vite + Tailwind v3 + shadcn/ui + framer-motion, GitHub Pages.
> **Audience:** Vietnamese K-12 ESL students, grades 3-10.
> **Today's problem:** ~35 routes, 3 divergent nav systems, grade-10-specific pages duplicating generic grade pages, triplicated learning-mode tabs, overlapping games, gamification scattered across 5+ surfaces, several orphan/dead routes.
> **Target:** 4 hubs + a Dashboard home + account, ONE nav system, ONE templated grade flow, deduplicated games, deduplicated quiz engine, gamification consolidated.

---

## 1. IA Principles

These are the tie-breakers. When two layouts are both "fine," the one that better satisfies a higher-numbered-down principle wins.

1. **Ít đích đến, rõ ràng (Few clear destinations).** Exactly **4 hubs** (Học · Luyện tập · Video · Tiến trình) + a **Dashboard home**. Never more than 5 top-level destinations. Everything else is a *spoke inside a hub*, reached by drill-down, never by adding a nav item. `[M3 nav; Duolingo core-tabs; NN/g hub-and-spoke]`
2. **Một con đường cho mỗi việc (One path per task).** Every activity has exactly **one canonical route and one canonical entry point**. Duplicate entry points (same game reachable 3 ways, "flashcard" meaning 3 things) are bugs, not features. Cross-links are allowed, but there is always one home for each feature.
3. **Một khuôn cho mọi lớp (One template across grades).** Grade 10 is **not special-cased**. The same `GradePage` template renders grades 3-10; the difference is *data* (unit-based vs. exam-section-based), not *code path*. No `/grade/10/*` parallel page tree.
4. **Phù hợp lứa tuổi (Age-aware emphasis).** Same IA, different *prominence*. Grades 3-6 foreground mascot, pet, quests; leaderboard off by default. Grades 7-10 foreground streaks, leagues, self-directed paths, exam prep. The tree doesn't change — the dashboard weighting does. `[age-aware gamification]`
5. **Dashboard trả lời "giờ học gì?" (Home answers "what now?").** The landing after login is a *decision-made-for-you* screen (Continue card + today's mission + streak), not a catalog. Catalog browsing is a deliberate act inside Học. `[KA learner dashboard]`
6. **Học vs. Luyện tập là hai trục rõ ràng (Clear Study/Practice split).** **Học = structured, curriculum-sequential, mastery-tracked** (units, lessons, reading). **Luyện tập = self-selected drills & games, scored, replayable** (games, SRS, tests, camera). Every feature lands on one side of this line; the word "ôn tập" is retired as a third synonym.

---

## 2. New Sitemap

Four hubs, one home, one account area, one separate admin area. The tree below is the **target**; §4 maps every current route into it.

```
/  (Landing — guests only; logged-in users land on /dashboard)

/dashboard  ──────────────────────────────  HOME (default landing, "what now?")
  ├─ Continue card (resume last lesson, one tap)
  ├─ Daily Checkpoint  (streak ring + today's 3 missions — the ONE gamification widget)
  ├─ Recommended row (next unit / weak-word SRS / a video)
  ├─ Pet peek         (grades 3-6 prominent; 7-10 collapsed) → /pet
  └─ Leaderboard mini (grades 7-10 only)        → Tiến trình

HỌC  (BookOpen · mascot: Gấu)  ───────────  STRUCTURED CURRICULUM
  /grades                       Level-segmented grade picker (Tiểu học 3-5 · THCS 6-9 · Lớp 10)
  /grade/:gradeId               Grade hub = learning-path map of units  [ONE template, all grades]
     ├─ unit node → /grade/:gradeId/vocab/:unitKey      Vocab  (LearningModeTabs: Từ điển·Flashcard·Quiz·Đánh vần)
     ├─ unit node → /grade/:gradeId/grammar/:unitKey    Grammar (notes + Quiz tab; free-answer tabs when data exists)
     ├─ unit node → /grade/:gradeId/reading/:unitKey    Reading/Bài tập (multi-type quiz)
     └─ skills    → /grade/:gradeId/phonetics           Phonetics drill (was orphan /phonetics/:gradeId)
  Grade 10 = same /grade/10 hub, its "units" are exam sections:
     ├─ /grade/10/vocab/:unitKey      (was /grade/10/vocab — now templated)
     ├─ /grade/10/grammar/:unitKey    (was /grade/10/grammar)
     ├─ /grade/10/reading/:unitKey    (was the mislabeled /grade/10/exercises)
     └─ /grade/10/writing/:unitKey    (was /grade/10/writing — Học because it's curriculum content)

LUYỆN TẬP  (Dumbbell · mascot: Cà Rốt)  ──  SELF-SELECTED DRILLS, GAMES, TESTS
  /practice                     Practice hub — 2 sections: "Trò chơi" (games) + "Ôn & Kiểm tra" (review/tests)
     Games:
       ├─ /practice/word-match/:gradeId        Nối từ
       ├─ /practice/sentence-puzzle/:gradeId   Xếp câu
       ├─ /practice/listen/:gradeId            Nghe & Chọn  [text|picture mode toggle — merged]
       ├─ /practice/memory/:gradeId            Lật thẻ ghép cặp  (renamed from flashcard-match — it's a memory game)
       ├─ /practice/shadowing/:gradeId         Luyện nói (Shadowing)
       └─ /practice/camera/:gradeId            Camera (cử chỉ)  (relocated from /grade/:id/camera)
     Review & Test:
       ├─ /practice/srs-review                 Ôn từ vựng thông minh (SRS)
       └─ /tests                               Test hub (list/grid + custom builder)
            ├─ /tests/custom                   Custom test builder (was orphan /test/custom)
            └─ /tests/10/:collection           Grade-10 mock exams (was /grade/10/tests/:collection)

VIDEO  (Play · mascot: Thỏ)  ─────────────  VIDEO LESSONS
  /video-lessons                Series grid → episode list (?topic=)
  /video-lessons/:lessonId      Player (transcript, masking, shadowing, rhythm marks)

TIẾN TRÌNH  (TrendingUp · mascot: Gấu, in coach pose)  ──  PROGRESS, GAMIFICATION, PET
  /progress                     Stats, quiz history, achievements/badges
     ├─ Leaderboard section     (grade-scoped; age-gated to 7-10)        (was a dashboard widget)
     └─ Pet entry               → /pet
  /pet                          Virtual pet adopt/profile/evolution

ACCOUNT  (avatar menu — NOT a hub tab)
  ├─ Change grade               (was buried in LearningOverview; now first-class)
  ├─ Profile / avatar
  ├─ Sign in / out
  └─ Admin link                 (only if isAdmin) → /admin

/admin/*  (separate authenticated shell — never in student nav)
  ├─ /admin/import   ├─ /admin/exams   ├─ /admin/analytics
  └─ /admin/video-lessons  ├─ /admin/video-lessons/:lessonId

*  → /404 (mascot + "Về trang chủ" + 4 hub shortcuts)
```

### How duplications/orphans are resolved in the tree

- **Grade-10 vs. generic duplication →** killed. There is no `/grade/10/vocab` page component anymore; `/grade/10/vocab/:unitKey` flows through the **same** `VocabPage` + unified data loader. `GradePage` renders grades 3-10 from one component; Grade 10's "units" are exam sections fed by the same `{ units }` shape. (§6 `useGradeData`.)
- **Overlapping listening games →** `ListenChooseGame` + `ListenChoosePicture` merge into **one** `/practice/listen/:gradeId` with a `text|picture` mode toggle.
- **Three "flashcard" meanings →** disambiguated: (1) **Flashcard** = a *tab* inside Vocab (study flip cards), no separate route; (2) **SRS** = `/practice/srs-review` ("Ôn từ vựng thông minh"); (3) the memory matching game is renamed **"Lật thẻ ghép cặp" / Memory** at `/practice/memory/:gradeId`. The word "flashcard" only ever means the Vocab study tab.
- **Three quiz entry points (QuizPage / DynamicTestPage / Grade10VocabPage) →** all consume one `<QuizEngine>` + `<ResultScreen>` (§6). `QuizPage.tsx` (unrouted dead file) is deleted; unit vocab quiz is the Quiz tab inside Vocab.
- **SRS placement →** **Luyện tập** (it's a self-selected drill), surfaced ALSO from the dashboard Daily Checkpoint, but its home is `/practice/srs-review`.
- **Phonetics →** **Học**, as a per-grade skill at `/grade/:gradeId/phonetics`, linked from the grade hub's skills row. No longer orphan.
- **Spelling →** there is no standalone spelling page. Spelling is the **"Đánh vần" tab** inside Vocab. Dead `SpellingPage.tsx` deleted.
- **Shadowing & Camera →** both are **Luyện tập** activities. Camera relocates from `/grade/:id/camera` to `/practice/camera/:gradeId` so it's discoverable in the practice hub.
- **Tests →** promoted to a top-level spoke `/tests` inside Luyện tập, holding the custom builder **and** grade-10 mock exams under one roof (today's `/test/custom` orphan + `/grade/10/tests`).
- **Pet & Leaderboard →** live in **Tiến trình** (gamification home), with a dashboard *peek/mini*. Pet is age-weighted up for 3-6.
- **Progress page →** **kept and upgraded** into the Tiến trình hub (not deleted): it becomes the canonical home for stats + history + badges + leaderboard + pet entry, removing those duplicates from the dashboard.

---

## 3. Navigation Model

### 3.1 One system replaces three

Today: (1) landing nav in `Index.tsx`, (2) shared `Navbar.tsx` on `PageShell`, (3) dashboard `DashboardSidebar.tsx` + `DashboardMobileNav.tsx`, (4) `AdminLayout`. **Replace 1-3 with a single `<AppNav>`.** Admin keeps its own utilitarian shell (intentionally separate). All nav items come from **one config** `src/data/nav.ts` (a `NavConfig` array) consumed by both desktop and mobile renders — no more duplicated `menuItems` arrays.

- **Desktop / tablet (≥768px): top bar.** Sticky, solid `bg-card/95` (no blur over content), 64px, 1px bottom border.
  - Left: logo + mascot (click → `/dashboard` when logged in, `/` when guest).
  - Center: the 4 hub tabs (icon + **text label**, active = primary text + 2px underline).
  - Right: **streak chip** (flame + count) · **XP chip** (gold) · **avatar menu** (account/grade/admin).
- **Mobile (<768px): persistent bottom tab bar.** 4 labeled destinations, 56-64px + safe-area, icon 24px + 12px label, active = primary fill pill behind icon. **No hamburger for primary nav.** A drawer is used only for the avatar/account overflow.
- The streak/XP chips are the **single canonical gamification display** in the chrome; they are removed from HeroBanner, LearningOverview, and elsewhere.

### 3.2 The four tabs (label · icon · route · mascot)

| Tab | Label | lucide icon | Route | Mascot | Mascot role |
|---|---|---|---|---|---|
| 1 | **Học** | `BookOpen` | `/grades` (→ `/grade/:gradeId` once grade set) | **Gấu** (Bear) | The steady study buddy / teacher's helper — appears at lesson-complete and unit unlock. |
| 2 | **Luyện tập** | `Dumbbell` | `/practice` | **Cà Rốt** (Carrot) | The energetic coach — cheers game wins, counts down, celebrates high scores. |
| 3 | **Video** | `Play` | `/video-lessons` | **Thỏ** (Rabbit) | The quick, playful presenter — intros series, nudges "watch one more". |
| 4 | **Tiến trình** | `TrendingUp` | `/progress` | **Gấu (coach pose)** | Reviews stats, hands out badges, introduces/cares for the pet. |

> Dashboard/Home is reached via the **logo**, not a 5th tab (keeps to ≤4 and matches the "home is special" model). The avatar menu is the **Account** surface, also not a tab.

### 3.3 Dashboard's role as home

`/dashboard` is the default post-login landing and the logo target. It is **not** a hub and has no children — it *points into* the hubs (Continue → Học, missions → relevant hub, pet peek → Tiến trình). It answers "what now?" and never tries to be a catalog. (Layout per DESIGN-SYSTEM §7.2/§8.)

### 3.4 Movement: grade ↔ subject ↔ mode ↔ activity

A student descends and ascends a clean 4-level spine:

```
Grade picker         /grades                         ← Học tab, or "Change grade" in account
   ↓ pick grade
Grade hub (path map) /grade/:gradeId                 ← learning-path of units; breadcrumb root
   ↓ pick unit + subject (Vocab/Grammar/Reading/Phonetics)
Subject page         /grade/:gradeId/vocab/:unitKey  ← LearningModeTabs switch MODE in place (no nav)
   ↓ pick mode tab (Từ điển/Flashcard/Quiz/Đánh vần)
Activity             (mode body)                     ← play; finish → ResultScreen → back up one level
```

- **Mode switching never navigates** — it's tabs within the subject page (kills the triplicated tab nav). 
- **Back/up** is always "one level up the spine," provided by `<PageHeader>`'s back button.
- **Breadcrumbs** appear only on 3+ level pages (`Học › Lớp 7 › Unit 3 › Từ vựng`), location-derived, hidden on the path map and flat hubs. `[NN/g breadcrumbs]`
- **Luyện tập** is a *flat* hub (game grid → game), so it uses back-button only, no breadcrumb.
- Cross-spine jumps (e.g., from a Reading result, "luyện từ yếu" → SRS) are explicit CTA buttons, not nav restructuring.

---

## 4. Per-Feature Disposition Table

Every current route from the audit. Target = where it lives in the new IA. **Bold** = behavior/route change.

### Core learning content

| Current route | Disposition | Target location | Reason |
|---|---|---|---|
| `/grades` | **keep** | Học → grade picker | Entry to structured curriculum; add level segments. |
| `/grade/:gradeId` | **rework** | Học → grade hub (one template) | Stop redirecting 3-9 to dashboard; render path-map for ALL grades including 10. |
| `/grade/:gradeId/vocab/:unitKey` | keep | Học → Vocab (LearningModeTabs) | Canonical vocab; absorbs Grade-10 vocab via unified loader. |
| `/grade/10/vocab` | **merge → delete page** | `/grade/10/vocab/:unitKey` via `VocabPage` | Duplicate UX/different data source; unify under one component. |
| `/grade/:gradeId/grammar/:unitKey` | keep | Học → Grammar | Canonical grammar; gains free-answer tabs when data present. |
| `/grade/10/grammar` | **merge → delete page** | `/grade/10/grammar/:unitKey` via `GrammarPage` | Duplicate; fold its MCQ/Rearrange/Completion/Rewrite into shared grammar tabs. |
| `/grade/:gradeId/exercises/:unitKey` | **rework → rename** | `/grade/:gradeId/reading/:unitKey` | "Bài tập"/reading drills; standardize route noun to `reading`. |
| `/grade/10/exercises` (→ Grade10ReadingPage) | **rework → rename + merge** | `/grade/10/reading/:unitKey` | Misrouted (label says exercises, content is reading). Fix + route through reading template. |
| `/grade/10/writing` | keep | **Học** → `/grade/10/writing/:unitKey` | Curriculum content (not a game); keep G10-only but templated. |
| `/grade/10/tests`, `/grade/10/tests/:collection` | **relocate** | **Luyện tập** → `/tests/10/:collection` | Tests are self-selected assessment → Test hub, not buried in grade tree. |
| `/phonetics/:gradeId` | **relocate (rescue orphan)** | Học → `/grade/:gradeId/phonetics` | Was unreachable; make it a per-grade skill linked from grade hub. |
| `/spelling/:unitId` (SpellingPage, unrouted) | **cut** | — (delete `SpellingPage.tsx`) | Dead code, old data source; replaced by Vocab "Đánh vần" tab. |
| `QuizPage.tsx` (unrouted) | **cut** | — (delete file) | Unrouted dead duplicate; unit quiz = Vocab "Quiz" tab via `QuizEngine`. |
| `FlashcardPage.tsx` (unrouted) | **cut** | — (delete file) | Unrouted; flashcard = Vocab "Flashcard" tab. |
| `UnitCard` component | keep | Học → grade hub | Reusable unit node; now also used to render Grade-10 sections. |

### Practice & games

| Current route | Disposition | Target location | Reason |
|---|---|---|---|
| `/practice` | **rework** | Luyện tập hub | Becomes 2-section hub (Games · Review&Test); add SRS, camera, tests; remove video card. |
| `/practice/word-match/:gradeId` | keep | Luyện tập → Games | Distinct mechanic. |
| `/practice/sentence-puzzle/:gradeId` | keep | Luyện tập → Games | Distinct mechanic. |
| `/practice/listen/:gradeId` | keep (absorb sibling) | Luyện tập → Games | Becomes the merged listening game (default text mode). |
| `/practice/listen-picture/:gradeId` | **merge → delete page** | `/practice/listen/:gradeId?mode=picture` | Near-identical to listen-choose; mode toggle instead of 2nd route. |
| `/practice/flashcard-match/:gradeId` | **rework → rename** | `/practice/memory/:gradeId` | It's a memory/pairing game, not flashcards; rename kills "flashcard" ambiguity. |
| `/practice/shadowing/:gradeId` | keep | Luyện tập → Games (Speaking) | Specialized speaking drill. |
| `/practice/srs-review` | keep | **Luyện tập** → Review&Test | Self-selected drill; add to practice hub (was dashboard-only). |
| `/grade/:gradeId/camera` | **relocate** | `/practice/camera/:gradeId` | Make discoverable in practice hub; remove from grade tree. |
| "Học thuộc video" card on `/practice` | **cut (card only)** | — (link removed) | Video isn't a game; reachable via Video tab. Removes context-break. |

### Quizzes & tests

| Current route | Disposition | Target location | Reason |
|---|---|---|---|
| `/test/custom` (DynamicTestPage) | **relocate (rescue orphan)** | Luyện tập → `/tests/custom` | Major hidden feature; surface it in the Test hub. |
| `/grade/10/tests/:collection` | relocate | `/tests/10/:collection` | Group all tests under `/tests` (see above). |
| `ExamReport`, `ReviewAllAnswers`, `QuizSettingsBar`, `CountdownTimer`, `ExplanationBox` | keep (as parts) | Inside `<QuizEngine>`/`<ResultScreen>` | Reusable test sub-components; consolidate, don't duplicate per page. |
| `TestExam` (in Grade10TestsPage) | keep | Test hub exam runner | Full mock-exam engine; refactor Part C into a sheet, not a page transition. |

### Dashboard, video, progress, pet, gamification

| Current route/widget | Disposition | Target location | Reason |
|---|---|---|---|
| `/dashboard` | **rework** | HOME | Slim to Continue + Daily Checkpoint + recommended + pet peek + mini-leaderboard; kill widget sprawl. |
| `LearningPath` | keep | Dashboard + grade hub | Core spine; reuse the path-map component in `/grade/:gradeId`. |
| `DailyMission` | **merge** | Dashboard "Daily Checkpoint" | Merge with HeroBanner; render once (not sidebar+inline). |
| `HeroBanner` | **merge** | Dashboard "Daily Checkpoint" | Duplicates daily-task logic; fold into one widget. |
| `LearningOverview` | **rework / split** | Stats → Tiến trình; XP/streak → nav chips | Heavy redundant widget; relocate stats, drop duplicated gamification. |
| `Leaderboard` | **relocate** | Tiến trình (+ dashboard mini) | One home; age-gate to 7-10; cache fetch. |
| `ReviewCorner` | **cut (component)** | — (links absorbed by Luyện tập) | Duplicates practice/games access; one games hub only. |
| `PetWidget` | keep (as peek) | Dashboard peek → `/pet` | Compact entry to pet; main page is `/pet`. |
| `/pet` (VirtualPetPage) | keep | Tiến trình → `/pet` | Dedicated pet page; broaden energy sources beyond quizzes. |
| `GradeSelectDialog` | **rework** | Onboarding + Account "Change grade" | Move out of jarring dashboard-load modal into onboarding; add change-grade entry. |
| `DashboardSidebar` / `DashboardMobileNav` | **cut → replace** | `<AppNav>` | Folded into the single nav system. |
| `Navbar.tsx` (PageShell) | **cut → replace** | `<AppNav>` | Folded into single nav. |
| `Index.tsx` nav | **rework** | `<AppNav>` (guest variant) | One nav config; guest variant of AppNav. |
| `NavLink.tsx` (unused) | **rework** | Used inside `<AppNav>` | Adopt for semantic/accessible links (currently dead). |
| `/grades` overview (nav "Bài học") | keep | Học | Curriculum entry (same as core table). |
| `/progress` (ProgressPage) | **rework (upgrade, do NOT cut)** | Tiến trình hub | Becomes canonical stats/history/badges/leaderboard/pet home; removes the dashboard duplication that made it look redundant. |
| `/video-lessons`, `/video-lessons/:lessonId` | keep | Video hub + player | Clean 2-level UX; surface more prominently via Video tab + dashboard recommended row. |

### Navigation & admin

| Current route | Disposition | Target location | Reason |
|---|---|---|---|
| `/` (Landing) | keep | Guest landing | Marketing/teaser; logged-in users auto-go `/dashboard`. |
| `/admin` (+ import/exams/analytics/video-lessons/:id) | keep | Separate admin shell | Teacher tools; keep isolated, add "Back to app" + responsive nav; reachable via avatar menu when isAdmin. |
| `/admin/video-lessons` + `/admin/video-lessons/:lessonId` | keep (consolidate UI) | Admin → Videos (list/detail) | One nested list→detail flow. |
| `*` (NotFound) | keep (improve) | 404 | Add 4-hub shortcuts + mascot per design. |

---

## 5. Key User Journeys (redesigned)

### (a) Brand-new visitor
1. Lands on `/` → mascot + one CTA "Bắt đầu học" (no glass/rainbow).
2. Taps CTA → sign-in (Google) or continue as guest.
3. **Onboarding** (not a dashboard modal): pick grade via segmented picker → optional pet adoption (3-6 weighted).
4. Lands on `/dashboard` → **Continue card** pre-points to Unit 1 of their grade; Daily Checkpoint shows 3 starter missions.
5. One tap → first Vocab unit in Học → LearningModeTabs (Từ điển first). Finish → ResultScreen → back to grade hub path map, next node now "current".

### (b) Returning daily learner
1. Opens app → auto-land `/dashboard` (logo = home).
2. Sees **streak ring** (Daily Checkpoint) + **Continue card** (resume exact last lesson).
3. Tap Continue → straight into the next unit activity (no menu hunting).
4. Mission "ôn 10 từ" → tap → `/practice/srs-review` → rate cards → returns; mission auto-checks.
5. Mission "nghe & nói" → Video tab or Shadowing game. Streak/XP chips in nav update live.
6. Optional: Tiến trình tab → see badge earned, feed pet (energy now also from videos/games).

### (c) Grade-10 exam prep
1. Student with grade=10 lands `/dashboard` → dashboard age-weighting favors streak + "Ôn thi vào 10" continue card; pet/peek collapsed.
2. Học tab → `/grade/10` → **same path-map template**, units are exam sections (Vocab · Grammar · Reading · Writing).
3. Works a Reading section → `/grade/10/reading/:unitKey` via shared reading quiz template → ResultScreen with weak-area diagnostic → CTA "luyện điểm yếu".
4. For full mocks: Luyện tập → `/tests` → grade-10 mock-exam collection (`/tests/10/ninh-binh`) → timed Part A/B/C runner → `<ResultScreen>` + ExamReport + ReviewAllAnswers.
5. Wants a quick custom drill → `/tests/custom` builder (count/topics/types/timer) → run → diagnostic. All tests live in one hub.

---

## 6. Shared Components to Build (kill duplication)

Build these once; every page consumes them. (Aligns with DESIGN-SYSTEM §6/§8 component list.)

| Component | Replaces / kills | Responsibility |
|---|---|---|
| **`<AppNav>`** | Navbar.tsx, DashboardSidebar, DashboardMobileNav, Index nav (3 nav systems) | Top bar (desktop) + bottom bar (mobile) from one `nav.ts` config; streak/XP/avatar chips; guest vs. logged-in variant. |
| **`src/data/nav.ts`** | duplicated `menuItems` arrays | Single source of truth for the 4 hubs (label, icon, route, mascot). |
| **`src/data/routes.ts`** | scattered string literals + hardcoded `/grade/10` links | Typed route constants/builders; one place to change paths. |
| **`<PageHeader>` / `<PageHero>`** | per-page inline heroes | Title, back button, breadcrumb slot, optional hero gradient (≤2 hues). |
| **`<Breadcrumb>`** | ad-hoc back-only headers | Location-derived crumbs on 3+ level pages only. |
| **`<LearningModeTabs>`** | triplicated Dictionary/Flashcard/Quiz/Spelling tab code across Vocab/Grammar/Reading | One tab strip + mode bodies; 44px tap, scrollable mobile. |
| **`<QuizEngine>`** | QuizPage, Grade10VocabPage, Grade10GrammarPage, ExercisesPage, DynamicTestPage quiz bodies | Takes a `source` (unit vocab / G10 topic / grammar / reading / custom) → one MCQ+free-answer flow; embeds QuizSettingsBar, CountdownTimer (via `useCountdown`), ExplanationBox. |
| **`<ResultScreen>`** | three divergent result layouts (QuizPage / DynamicTest / Grade10Tests) | Unified `(score,total,report?,questions,reviewMode,onRetry)`; always offers "Show all answers" + retry (same semantics everywhere). |
| **`<MediaCard>`** | per-page video thumbnails | 16:9 thumb + title + progress for all video/series cards. |
| **`<GameShell>`** | per-game HUD/result boilerplate | Top HUD (score/lives/progress) + centered play area + big controls + `<ResultScreen>` on finish; shadowing/camera variants add waveform/camera surface. |
| **`<DailyCheckpoint>`** | HeroBanner + DailyMission (+ inline dupes) | One widget: streak ring + today's 3 missions + single CTA; reads one `getDailyTasks()`. |
| **`useGradeData(gradeId)`** | SGKData vs Grade10VocabData/Grammar/Reading/Writing split | Returns grade-agnostic `{ units: Record<string,Unit> }`; hides the G10 vs SGK distinction from UI. |
| **`useCountdown` / `useTestSetup`** | 3 timer impls + DynamicTest setup | Shared timer + test-generation hooks. |
| **`gamification.ts` config** | scattered magic numbers (3 tasks, 4x/8x multipliers, pet thresholds) | One tunable config for XP/streak/pet balancing + in-app explanations. |

---

## 7. Phased Rollout Order

Live site = GitHub Pages. Each phase is independently shippable and must not break live. **Shell/IA first, leaf content last.** Mascots (Gấu/Thỏ/Cà Rốt) + Sân trường tokens applied progressively; tokens land in Phase 0 so every later phase inherits them. This sequences *on top of* DESIGN-SYSTEM §10 (which handles token/primitive re-skin); here the emphasis is the IA reorg.

| Phase | Scope | Ships safely because… |
|---|---|---|
| **0 — Tokens & primitives** | Land Sân trường tokens (DS §9) + re-skin shadcn primitives; build `routes.ts`, `nav.ts`, `motion.ts`. Keep old `.glass`/`.gradient-*` as deprecated shims. | Purely additive; nothing routes differently yet. |
| **1 — Shell & nav & IA** | Build `<AppNav>` (top+bottom), `<PageHeader>`, `<Breadcrumb>`; replace all 3 navs. Introduce the 4 hubs + redirects: old routes 301-style redirect to new (`/grade/10/vocab`→`/grade/10/vocab/:firstUnit`, `/test/custom`→`/tests/custom`, `/grade/:id/camera`→`/practice/camera/:id`, `/phonetics/:id`→`/grade/:id/phonetics`, `/grade/10/exercises`→`/grade/10/reading`). | Redirects keep old links alive; nav unified without touching activity logic. |
| **2 — Dashboard / Home** | Rebuild `/dashboard`: `<DailyCheckpoint>`, Continue card, recommended row, pet peek, mini-leaderboard. Move GradeSelect to onboarding + account "Change grade". Streak/XP move to nav chips. | Most-seen screen; proves the system; old sub-pages still reachable. |
| **3 — Learn flow** | Unify `GradePage` to one template (path-map all grades, G10 included via `useGradeData`). Build `<LearningModeTabs>`; route Vocab/Grammar/Reading through it; rescue Phonetics into grade hub. **Delete** `SpellingPage.tsx`, `QuizPage.tsx`, `FlashcardPage.tsx`, and the `Grade10Vocab/Grammar/Reading` page components after merge. | Core value; redirects from Phase 1 already cover old G10 URLs. |
| **4 — Practice & Tests** | Rework `/practice` into 2-section hub; merge listen games (mode toggle), rename memory game, relocate camera + SRS into hub; build `<GameShell>` + `<QuizEngine>` + `<ResultScreen>`; build `/tests` hub (custom + G10 mocks). | Reuses primitives + ResultScreen; each game migrates independently. |
| **5 — Video & Progress & Pet** | `<MediaCard>` across video hub/player; build Tiến trình hub (absorb stats/history/badges + leaderboard + pet entry); broaden pet energy sources; age-gate + cache leaderboard. | Gamification polish; isolated from learn/practice. |
| **6 — Admin** | Re-skin admin shell/DataTable/forms with tokens; add "Back to app" + responsive nav; consolidate video list→detail. | Internal, low-risk, no kid gamification. |
| **7 — Cleanup gate** | Remove deprecated `.glass*`/`.gradient-*` shims and dead components (`ReviewCorner`, old nav files); grep confirms zero refs to deleted routes/files; run AA-contrast + reduced-motion + 44px-target audit; sync all docs/UI text (repo "docs-sync" rule) + grep removed names. | Dead system removed only once nothing references it. |

**Per-phase release gate:** AA contrast pass · focus-visible present · ≥44px targets · prefers-reduced-motion respected · mobile bottom-nav reachable · no horizontal scroll at 360px · all old URLs still resolve (redirect or page).
