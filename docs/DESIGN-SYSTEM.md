# Design System — "Học cùng cô Yến" (tienganhcoyen.online)

> **Status:** New design standard for the TOTAL redesign. Replaces the old *Candy Glass / glassmorphism* look. This document is the source of truth for tokens, components, IA, and rollout.
>
> **Stack:** React + Vite + Tailwind v3 + shadcn/ui + framer-motion, GitHub Pages.
> **Audience:** Vietnamese K-12 ESL students, grades 3-10.
> **Codename:** **"Sân trường" (Schoolyard)** — bright, warm, clean, school-appropriate.

---

## 0. What changes vs. today (one-paragraph brief)

We are killing the glassmorphism (`.glass`, `.glass-subtle`, `.glass-strong`), the 10+ ad-hoc gradients (`.gradient-rainbow`, `.gradient-energy`, `.gradient-purple-card`…), the animated `gradient-hero` background, and all hardcoded color classes (`text-indigo-800`, `from-pink-500 to-orange-500`). In comes a **flat + soft-shadow** surface system, a **small semantic token set**, **one chunky pressable CTA style**, **rounded-but-not-blurry** cards, and a **simplified 4-tab IA**. Reasoning throughout is grounded in the research; rules are cited inline like `[KA color rebuild]`.

---

## 1. Design principles

Anchor every decision on these. Derive tokens from principles, not the other way around `[Wonder Blocks principles]`. An "endless rainbow of saturated colors is NOT a good palette" — restraint + a meaning system is what separates *cheerful* from *chaotic* `[Lollypop 2025]`.

1. **Vui (Joyful).** Celebrate progress with color, shape, motion, and the mascot — but only at *moments* (lesson complete, streak, level-up), never layered over active learning `[Engageli; StudyPulse]`.
2. **Rõ ràng (Clear & uncluttered).** One primary action per screen, generous whitespace, ≤5 nav destinations, no dense walls of text `[Lollypop 2025; M3 nav]`.
3. **Trao quyền (Empowering, age-aware).** Don't patronize. Grades 3-6 lead with mascot/pet/quests; grades 7-10 surface leagues/streaks/self-directed paths `[age-aware gamification arXiv]`.
4. **Tin cậy (Credible & legible).** Minimal, efficient, classroom-warm. WCAG AA is a **release gate**, not a nicety `[KA color rebuild; WCAG 2.x]`.
5. **An toàn cho mắt (Eye-safe).** Saturated brights for *fills/illustrations/headings*; deepened hues for *text/borders*. Off-white reading surface, not glaring pure white `[BDA 2023; WebAIM]`.
6. **Nhất quán (Consistent & tokenized).** All color/spacing/radius flow from semantic tokens. No raw hex in components `[Wonder Blocks]`.
7. **Chạm dễ (Touch-first).** ≥44px targets, ≥8px gaps, big rounded controls for developing motor skills `[NN/g kids physical dev; WCAG 2.5.8]`.

---

## 2. Color system

### 2.1 Strategy

- 1 saturated brand hue + 3-4 saturated accents + near-white background + dark-gray (not black) text `[Duolingo tokens]`.
- Saturated hues are **fills/illustrations/headings**, never small body text on white (e.g. yellow text fails contrast) `[Duolingo; WebAIM]`.
- Separation comes from **lightness**, not just hue (protects ~5-8% color-vision-deficient users) `[KA; WCAG 1.4.1]`.
- Cultural read: **gold = achievement/coins/stars**, **red = celebration** (Tet/luck) — NOT the default error color. Use **amber/orange for "try again"** so red stays auspicious `[Vietnamese color symbolism]`.

### 2.2 Brand & accent ramps (HEX)

Each hue has a small ramp; UI uses the bold mid + a deep step for text/borders.

| Role | Light fill (bright) | Deep (text/border, AA on white) | Tint (subtle bg / track) |
|---|---|---|---|
| **Primary — Sky Blue** (action, links, brand) | `#2F6FED` | `#1B4FB5` | `#E8F0FE` |
| **Secondary — Leaf Green** (success, "correct", continue) | `#28B463` | `#1B7A45` | `#E6F7EE` |
| **Accent — Sun Gold** (XP, coins, stars, streak fill) | `#FFC42E` | `#A66A00` (text on white) | `#FFF6DC` |
| **Accent 2 — Coral** (highlight, mascot, fun CTAs) | `#FF6B5E` | `#C23A2E` | `#FFE9E6` |
| **Accent 3 — Grape** (video/play hub, badges) | `#8B5CF6` | `#5B34B0` | `#F1EAFE` |
| **Streak — Flame Orange** | `#FF8A1E` | `#B25400` | `#FFF0E0` |

> Gold `#FFC42E` is **fill-only** — its deep partner `#A66A00` is the only gold that may be text/icon on white (≥4.5:1). Yellow text on white is banned.

### 2.3 Semantic / status

| Token | Light HEX | Use | Non-color cue required |
|---|---|---|---|
| **success** | `#28B463` fill / `#1B7A45` text | correct answer, mastered | ✔ check icon |
| **warning ("try again")** | `#F59E0B` fill / `#92500A` text | wrong answer, retry, gentle nudge | ↻ / ✗ icon |
| **danger** | `#E5484D` fill / `#B4232A` text | destructive/admin only (delete) | ⚠ icon + label |
| **celebrate** | `#E5484D` + `#FFC42E` | confetti, milestone burst | n/a (decorative) |
| **info** | `#2F6FED` | tips, neutral status | ℹ icon |

Never use color alone — pair with icon/label/shape `[WCAG 1.4.1]`.

### 2.4 Neutrals & surfaces

| Token | Light | Dark | Notes |
|---|---|---|---|
| `background` | `#FBFAF6` (warm off-white) | `#13151B` | Soft, not `#FFF` glare `[BDA]` |
| `card` | `#FFFFFF` | `#1B1E26` | Flat + soft shadow + 1px border |
| `muted` (subtle panel) | `#F1F1EC` | `#22262F` | section fills, skeletons |
| `foreground` (body) | `#26272B` | `#ECEDEF` | dark gray ~13:1 on bg, not pure black |
| `muted-foreground` | `#5C5F66` | `#9AA0AA` | meta text, ≥4.5:1 |
| `border` | `#E4E4DE` | `#2C313B` | 1px edge "non-negotiable" `[halfaccessible]` |
| `input` border | `#CFCFC8` | `#39404B` | ≥3:1 non-text contrast `[WCAG 1.4.11]` |
| `ring` (focus) | `#2F6FED` | `#5B8DEF` | ≥3:1, visible focus |

### 2.5 Contrast verification (AA gate)

| Pair | Ratio | Result |
|---|---|---|
| `#26272B` on `#FBFAF6` | ~13.3:1 | AAA body ✔ |
| `#5C5F66` on `#FFFFFF` | ~6.2:1 | AA body ✔ |
| `#1B4FB5` on `#FFFFFF` | ~7.3:1 | AAA link ✔ |
| white on `#2F6FED` | ~4.9:1 | AA button ✔ |
| white on `#28B463` | ~3.0:1 | large/bold only — use ≥18.66px bold labels ✔ |
| `#26272B` on `#FFC42E` | ~10:1 | AAA (near-black on gold) ✔ |
| white on `#FF6B5E` | ~3.1:1 | large/bold only ✔ |

> **Rule:** filled-button labels are always ≥16px **bold (700+)** so green/coral/gold fills clear the 3:1 large-text bar. Test the real rendered pair in WebAIM, not intent `[WebAIM]`.

### 2.6 Token mapping (semantic aliases)

```
--background      → page bg (warm off-white)
--foreground      → body text
--card / --card-foreground
--popover / --popover-foreground
--primary / --primary-foreground   (Sky Blue / white)
--secondary / --secondary-foreground (light neutral panel / dark text)
--success / --success-foreground
--warning / --warning-foreground   (amber "try again")
--destructive / --destructive-foreground (admin only)
--accent (Coral) / --accent-2 (Grape) / --xp (Gold) / --streak (Flame)
--muted / --muted-foreground
--border / --input / --ring
```

Reserve meaning: **blue = interactive, green = success, amber = retry, red = destructive/celebration, gold = reward.** Do NOT use status colors for decoration or subject domains `[Wonder Blocks]`. Subject/grade color-coding uses the *accent* hues (coral/grape/sky/leaf), never success/danger.

---

## 3. Typography

All faces verified to ship the **Vietnamese subset** with purpose-built diacritics so stacked marks (Ớ, Ễ, ậ, ữ) don't clip `[Google Fonts language support; Align.vn]`.

### 3.1 Faces (Google Fonts)

| Role | Font | Weights | Why |
|---|---|---|---|
| **Display** (headings, mascot speech, big CTAs) | **Baloo 2** | 600, 700, 800 | Plump rounded "children's book grown up"; VN subset `[Baloo 2 specimen]` |
| **Body / UI** | **Be Vietnam Pro** | 400, 500, 600, 700 | Purpose-built for Vietnamese, diacritic-adaptive, neutral, highly legible `[Vietnamese Typography]` |
| **Reading mode (opt-in)** | **Lexend** | 400, 500 | Research-validated reading-fluency gain; VN subset; user toggle on long passages `[Google Design Lexend study]` |

> Keep it to these 3. Old build used Baloo 2 + Nunito; **swap body Nunito → Be Vietnam Pro** for proper diacritics. Constrain to ~14 styles total `[Khan Academy reduction]`.

`@import`:
```
https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700&family=Lexend:wght@400;500&display=swap&subset=vietnamese,latin
```

### 3.2 Type scale (base 16px, Major Third ≈1.25; fluid via clamp)

| Token | Size (px / clamp) | LH | Weight | Use |
|---|---|---|---|---|
| `display` | clamp(30, …, 48) | 1.1 | Baloo 800 | hero, page hero |
| `h1` | clamp(26, …, 36) | 1.15 | Baloo 800 | page title |
| `h2` | 24 | 1.2 | Baloo 700 | section title |
| `h3` | 20 | 1.25 | Baloo 700 | card title / sub-section |
| `body-lg` | 18 | 1.6 | BVP 400/500 | reading passages, lesson body |
| `body` | 16 | 1.5 | BVP 400 | default UI/body (floor 16px) `[learnui]` |
| `label` | 14 | 1.4 | BVP 600 | buttons, chips, meta-emphasis |
| `caption` | 13 | 1.4 | BVP 500 | meta, helper (≥`#5C5F66`) |

Rules: body ≥16px; reading/young-learner body 18px `[learnui]`. Line-height 1.5 body, 1.6 reading, headings 1.1-1.25 `[WCAG 1.4.12; greadme]`. Reading column **max-width 65ch**, **left-aligned, never justified** `[Bringhurst; BDA]`. Inputs ≥16px (prevents iOS zoom). Emphasis via **bold**, not ALL-CAPS/italics `[BDA]`. Hierarchy via **weight + color**, not size alone `[Refactoring UI]`. Reading-mode toggle applies Lexend + letter-spacing 0.03em + LH 1.7.

---

## 4. Spacing, radius, shadow

### 4.1 Spacing (4/8 scale) `[Lollypop; Refactoring UI]`

`4, 8, 12, 16, 24, 32, 48, 64` px → Tailwind `1,2,3,4,6,8,12,16`.
- Card interior padding: **16-24px** (`p-4`/`p-6`).
- Gap between interactive elements: **≥8px** (avoid mis-tap) `[WCAG 2.5.8]`.
- Page gutter mobile `px-4`, desktop `px-6`. Section vertical rhythm `space-y-6`/`space-y-8`.
- **Standardize** content widths: reading `max-w-[65ch]`, forms/quiz `max-w-2xl`, hub grids `max-w-6xl`, dashboard `max-w-7xl`. (Fixes the max-w-5xl/3xl/4xl/lg fragmentation.)

### 4.2 Radius (no sharp corners) `[Duolingo radius; rounded-corner psychology]`

| Token | px | Use |
|---|---|---|
| `--radius-sm` | 10 | chips, inputs, small tags |
| `--radius` (md) | 14 | buttons, small cards |
| `--radius-lg` | 18 | cards |
| `--radius-xl` | 24 | sheets, modals, hero panels |
| `--radius-full` | 9999 | pills, avatars, progress bars, badges |

> Old `.glass{border-radius:32px}` is retired; max card radius now 24px (less bloated, still friendly).

### 4.3 Elevation (flat + shallow soft shadows) `[M3 elevation; halfaccessible; Refactoring UI]`

| Level | Shadow | + Border | Use |
|---|---|---|---|
| **0** | none | optional 1px | page bg, list rows |
| **1** | `0 2px 8px rgba(20,20,40,.08)` | `1px solid --border` | resting cards |
| **2** | `0 8px 24px rgba(20,20,40,.12)` | `1px` | popover, dialog, dropdown |
| **3** | `0 16px 40px rgba(20,20,40,.16)` | `1px` | sheet, dragged card |
| **press (CTA only)** | `0 4px 0 <deep hue>` solid, no blur | — | pressable primary button |

**No neumorphism. No backdrop-blur on content surfaces.** Glass allowed ONLY on a purely decorative overlay with no critical text. Shadows are transparent-dark, soft, used as hierarchy — if everything floats, nothing has depth.

---

## 5. Iconography, illustration, mascot, motion

### 5.1 Icons
- **lucide-react only** (filled/rounded family). Retire emoji-as-icons in dialogs/cards/pet (the `getWordIcon()` + hardcoded-emoji mix). Emoji allowed only as *content* (flashcard fronts), never as UI affordances `[KA icon guidance]`.
- Default 20-24px; nav 24px; touch button hit area ≥44px `[NN/g; WCAG 2.5.8]`.
- Icons/graphical objects meet **3:1** boundary contrast `[WCAG 1.4.11]`.
- Always pair nav icons with **text labels** — text alone is noise for early readers, novel icons (pet, league) especially need labels `[NN/g; DuoPlanet]`.

### 5.2 Illustration & mascot
- **Flat, geometric, multi-color, rounded** illustrations (multi-color reads as more joyful); no heavy 3D/gradient renders, no thin clip-art `[KA brand]`.
- **Mascot** = persistent round companion (name it, e.g. **"Bống"** the owl/dragon, big eyes, limited palette so it reads small) `[mascot trends; Duolingo Duo]`.
  - Functional, not decoration: celebrates lesson/streak/level wins; **encourages** (never scolds) on wrong answers / missed days `[mascot studies]`.
  - Grades 3-6: foreground mascot + pet + quests. Grades 7-10: cooler styling, mascot recedes, leagues/streaks lead `[age-aware]`.

### 5.3 Motion `[web.dev reduced-motion; M3 Expressive]`
- Durations: micro 100-150ms (press/hover), enter 200-300ms, celebration 400-700ms. Easing `cubic-bezier(0.22,1,0.36,1)` for enters; spring only for celebrations.
- **Centralize** framer-motion presets (`src/lib/motion.ts`: `fadeUp`, `pop`, `stagger`, `celebrate`) — kill the per-file inline `transition={{duration:0.7…}}` duplication.
- Calm during learning; dopamine bursts (XP, badge, level-up, league) only between/after lessons.
- **prefers-reduced-motion:** keep the global reset (animations→0.01ms, looping bg static); decorative motion → opacity fade or none; gate JS animation on `matchMedia('(prefers-reduced-motion: reduce)')`.

---

## 6. Core components

> Build on existing shadcn/ui primitives in `src/components/ui/*`. Re-skin with tokens; do not fork. Extract the inline ad-hoc versions (`SectionCard`, `ResultScreen`, inline hero, inline buttons) into shared components.

### 6.1 Buttons (`Button`) — one Filled primary per screen `[M3 buttons; Duolingo press]`
Sentence case, never ALL-CAPS. Sizing: `sm 36 / md 44 / lg 52 / xl 60` px height, radius 14, label 14-16 bold.

| Variant | Look | Use |
|---|---|---|
| **primary (pressable)** | fill `--primary`, white bold label, `box-shadow:0 4px 0 #1B4FB5`; `:active translateY(4px); shadow 0 0` | Start / Continue / Submit |
| **success-pressable** | fill `--success`, deep `#1B7A45` edge | "Tiếp tục", correct-flow CTA |
| **secondary** | `--secondary` fill, dark label, soft shadow lvl-1 | secondary action |
| **outline** | transparent, 1.5px `--border`, primary text | medium emphasis |
| **ghost/text** | no border, primary/muted text | Skip, Cancel, tertiary |
| **destructive** | `--destructive` (admin delete only) | rare |

States: hover (lighten 4%/raise), focus-visible (3px ring `--ring`, offset 2px), disabled (40% + no shadow), loading (spinner, label hidden, width locked). No layout shift — use box-shadow press, not border-bottom.

### 6.2 Cards
Base: `bg-card`, radius-lg (18), `1px border`, shadow lvl-1; hover raises to lvl-2 + translateY(-2px) on hover-capable pointers only. **One depth cue** — never stack shadow+fill+heavy border `[M3 cards]`.

**LessonCard / CourseCard anatomy** `[M3 cards; Refactoring UI]`:
thumbnail (16:9 or 1:1, radius-md) → level/category **chip** → title (Baloo 700, `line-clamp-2`) → 1-line meta (muted, duration · X bài) → **progress bar (h-2, rounded-full, brand fill on tint track) + "X/Y · NN%"** → primary CTA (Start/Continue). Interior `p-4`, stack gap `gap-3`.

### 6.3 Inputs (`Input`,`Textarea`,`Select`)
Height 44-48px, radius-md, `1px --input` border (≥3:1), `bg-card`, text ≥16px, padding `px-4`. Focus: 2px ring `--ring` + border→primary. Error: border `--danger` + helper text + ✗ icon (not color alone). Search input = leading magnifier icon, pill radius. (Replaces inline-styled spelling/search inputs.)

### 6.4 Badges / Chips (`Badge`)
Pill (radius-full), `label` 13px/600, `px-2.5 py-1`. Variants use **tint bg + deep text** (AA): `chip-primary` (`#E8F0FE`/`#1B4FB5`), `chip-success`, `chip-warning`, `chip-grape`, `chip-gold` (`#FFF6DC`/`#A66A00`). Status badges carry an icon. (Replaces inline gradient `<span>` badges.)

### 6.5 Progress bar & ring `[M3 progress]`
- **Bar:** `h-2` (4-6px), rounded-full, brand fill on same-hue 10-12% tint track; M3 stop-dot at end; **always paired with text value** ("30/50", "60%"). Determinate wherever progress is known.
- **Ring:** 56-96px dashboard hero, rounded cap, value centered ("30/50 XP"), animate fill on load, celebratory state + mascot at 100%. One variant per process (bar on edges, ring when centered).

### 6.6 Navigation
**Top bar (desktop/tablet):** sticky, `bg-card/95` solid (no blur over content), 1px bottom border, height 64px. Left logo+mascot, center/right tabs with icon+label, right: streak chip (flame+count) · XP chip (gold) · avatar. (Unifies the 3 divergent nav implementations into one `<AppNav>`.)

**Bottom bar (mobile):** persistent, **4 labeled** destinations, 56-64px + safe-area, icon 24px + 12px label, active = primary fill pill behind icon. **No hamburger for primary nav** — drawer only for overflow/settings `[NN/g hamburger; M3 nav]`.

### 6.7 Tabs (`Tabs`)
Underline or pill segmented control, label 14/600, active = primary text + 2px underline / filled pill. **Extract one `<LearningModeTabs>`** for the Dictionary/Flashcard/Quiz/Spelling modes shared by Vocab/Grammar/Exercises (kills the triplicated tab code). Min 44px tap height; scrollable on mobile, never wrap-collapse.

### 6.8 Dialog / Sheet
Dialog: `bg-popover` solid, radius-xl, shadow lvl-2, scrim `rgba(0,0,0,0.4)`, max-w-md, focus-trapped, ESC/overlay close, `:focus-visible` ring. Sheet (mobile): bottom slide, radius-xl top, drag handle, safe-area pad. (Replaces `backdrop-blur-2xl` GradeSelectDialog.) One centralized modal/grade-select state to prevent stacking.

### 6.9 Leaderboard row `[Trophy UI; ui-patterns]`
rank → avatar → name (+byline) → score with unit (XP/pts). Top-3 = gold/silver/bronze crown. **Current user row pinned + highlighted** (primary tint, sticky if off-screen). Default **weekly** window; small relegation leagues; reset weekly so no one is permanently last. **Off by default for grades 3-6** `[StudyPulse]`. Row height ≥56px.

### 6.10 Flashcard `[Mochi; flashcard UX]`
Centered card, 3D flip (front prompt / back answer), tap/space to flip; supports text+image+audio (TTS speaker button). After flip: color-coded recall buttons (Again `#F59E0B` / Good `#2F6FED` / Easy `#28B463`) — color + label, not color alone. Deck counter "thẻ X/Y" + due count. Swipe gestures on touch.

### 6.11 Quiz option `[Max Maier; M3]` — FOUR states
default (1.5px `--border`) · selected (primary border+tint, no judgment) · correct (`--success` fill + ✔) · wrong (`--warning` fill + ✗, **and reveal correct option in green**). Color **+ icon + border** always. Lock options after submit. Question progress "3/10"; timer only if timed (turns warning in final seconds). Option min-height 52px.

### 6.12 Reading passage `[UXPin; BDA; MIT]`
Single centered column `max-w-[65ch]`, body 18px, LH 1.6, **left-aligned**, generous margins, short paragraphs. Sticky controls: font-size A-/A+, **Lexend toggle**, audio narration, tap-to-define vocabulary. Controls must NOT shift body position after load.

### 6.13 Dashboard widgets `[Duolingo; 925studios]`
**DailyGoalRing** (ring + streak flame beside it), **ContinueCard** (single prominent resume → last lesson, one tap), **StatTile** (icon + big number + label), **MissionCard** (today's task + progress), **LeaderboardMini**, **PetWidget**. Consistent semantic palette: green=success, orange=streak, gold=XP, one accent for the primary CTA.

### 6.14 Empty / loading states `[NN/g empty states; NN/g skeletons]`
Three distinct empty types — **first-use** (illustration + heading + 1-2 lines + primary CTA), **no-results** (neutral + adjust-filter), **error** (friendly + Retry). Never reuse one for all. **Skeletons** (not spinners) for content areas — mirror real layout shapes + subtle shimmer, show only for waits >~1s; spinner reserved for short actions (submit). If skeleton load fails → swap to error empty state. (Replaces bare "Đang tải…/Không tìm thấy…".)

---

## 7. Information architecture & navigation

### 7.1 Simplified IA — 4 hubs (cap at 5, never more) `[M3 nav; Duolingo core-tabs]`

Collapse the ~33 routes / 25 content types into **4 labeled hubs**, each a hub-and-spoke `[NN/g hub-and-spoke]`:

| Tab (label + icon) | Spokes (content types absorbed) |
|---|---|
| **Học** (BookOpen) | Grades → Grade detail/units → Vocab · Grammar · Reading/Exercises (multi-mode-quiz); Phonetics; Grade-10 vocab/grammar/reading/writing; learning-path map |
| **Luyện tập** (Dumbbell) | Practice game-menu → Word match, Listen&Choose, Sentence puzzle, Shadowing, Flashcard match, Listen-picture; **SRS review**; **Tests** (test-list/grid, custom test builder); Camera game |
| **Video** (Play) | Video-lessons hub → series → player (transcript/shadowing) |
| **Tiến trình** (TrendingUp) | Progress analytics, quiz history, achievements/badges, **Leaderboard** (age-gated), **Pet** (grades 3-6 may surface pet here or on Home) |

**Home/Dashboard** is the default landing (not a bare menu) — answers "what do I do now?" `[KA learner dashboard; NN/g hub-and-spoke]`. Admin is a separate authenticated area, **not** in the student nav.

### 7.2 Dashboard-home model `[Duolingo; 925studios]`
Top-down priority order: (1) greeting + avatar, (2) **daily-goal ring + streak** (highest return-driver, top zone), (3) **Continue-learning hero** (one-tap resume), (4) recommended row (horizontal scroll), (5) stats/achievements, (6) mascot/pet. Progressive disclosure: show "continue" + 1-2 next steps, not the full catalog `[NN/g progressive disclosure]`.

### 7.3 Learn spine = path/map, not flat catalog `[Duolingo path; CHI MapUncover]`
Render units as a vertical **learning path** of node states: **completed** (filled brand + check), **current** (the only highlighted/ringed node), **locked** (gray + lock). Unit headers ("Unit 3 · Greetings") with section progress bar. Exactly one "continue" target so the eye lands immediately `[925studios]`.

### 7.4 Hub grids `[Red Hat tiles; UXPin grids]`
12-col responsive: **1 col phone / 2 tablet / 3-4 desktop**, tiles min 4-col (≤3/row), 16px internal pad, equal gutters, uniform aspect ratios. Each card = **one title + one visual + one action**, ≤3-5 choices per screen for kids `[NN/g kids cognition]`.

### 7.5 Mobile pattern
Persistent **bottom bar** (4 labeled tabs). Within a section, **top tabs** switch views. Breadcrumbs only on **3+ level** pages (Subject › Grade › Unit › Lesson), location-based, skipped on path/flat screens `[NN/g breadcrumbs]`. Reuse familiar patterns, offload work (smart defaults, visuals over text), strip decoration `[NN/g cognitive load]`.

---

## 8. Page layout templates

Common shell: `<AppNav>` (top, + bottom on mobile) · page hero (token gradient, ≤2 hues, no animated bg) · content `max-w-*` centered · consistent gutters. **One `<PageHero>` component** (kills per-page hero duplication).

| Page (content type) | Layout recipe |
|---|---|
| **Dashboard** (`/dashboard`) | Mobile: single scroll — greeting, ring+streak, ContinueCard, mission, recommended row, stats, pet. Desktop: 12-col → left rail nav (cols 1-2, or use top nav), center path+hero (cols 3-8), right rail (cols 9-12) ring/mission/leaderboard-mini/pet. **Replace** the brittle triple-sticky/nested-scroll layout with simple sticky rails + single page scroll. |
| **Landing** (`/`) | Hero (mascot + 1 CTA "Bắt đầu học") → bento feature cards (uniform radius-lg) → game highlights row → footer CTA. No glass, no animated rainbow bg. |
| **Grades** (`/grades`) | PageHero + segmented level tabs (Tiểu học 3-5 · THCS 6-9 · Lớp 10) → responsive grade-card grid (1/2/3-4). |
| **Grade detail** (`/grade/:id`) | PageHero + breadcrumb → learning-path map (units) → per-unit action chips (Từ vựng/Ngữ pháp/Bài tập) → collections/featured grid below. |
| **Vocab / Grammar / Reading** (multi-mode-quiz) | Sticky compact header (back, unit title, slim progress) → **`<LearningModeTabs>`** (Tự điển · Flashcard · Quiz · Đánh vần) → mode body in `max-w-2xl`. Quiz/Spelling reuse shared **`<ResultScreen>`**. Fix mobile nested-scroll: single page scroll, no `max-h-[50vh]` inside flex-1. |
| **Quiz / Test** (quiz-interface / test-list / grid) | Test-list: search + paginated card grid + featured collection. In-test: question progress + (timed) countdown, one question/screen, 4-state options, sticky Submit, shared ResultScreen + ReviewAllAnswers. |
| **Custom Test Builder** (`/test/custom`) | Stepped form (difficulty → topics → types → time) on `max-w-2xl`, FilterBar chips, summary, primary CTA "Tạo đề". |
| **Game** (game-interface) | Full-focus play surface: top HUD (score/lives/progress), centered play area, big touch controls, end → ResultScreen + Retry. Shadowing/recording adds waveform + record button + playback compare. |
| **Video hub** (`/video-lessons`) | Series cards (MediaCard: 16:9 thumb + title + progress) grid → lesson list with progress bars. **One `<MediaCard>`** for all video thumbnails. |
| **Video player** (`/video-lessons/:id`) | Top: 16:9 YouTube player. Below/side: line-by-line transcript (current line highlighted), shadowing mode toggle, progress. Reading column for transcript ≤65ch. |
| **Progress** (`/progress`) | StatTiles row (words/quizzes/high score) → quiz-history timeline (date · score · unit) → Continue CTA → badges grid (locked = gray silhouette + "7/10"). |
| **Pet** (`/pet`) | Centered stage: mascot/pet illustration (evolves by XP), care actions (feed/dress) as pressable buttons, XP-to-next-level ring, lucide icons (retire emoji). |
| **Phonetics** (`/phonetics/:id`) | IPA chart grid (tap = audio), drill cards, big play buttons, progress. |
| **Admin** (`/admin/*`) | Separate utilitarian shell: top tabs (Import · Exams · Analytics · Videos), DataTable (sortable, searchable, paginated), forms with shared Input/Button. Calmer palette, same tokens, no kid gamification. |
| **404** (`*`) | Centered mascot + friendly line + primary "Về trang chủ". |

---

## 9. Tailwind token mapping (paste-in)

### 9.1 `src/index.css` — `@layer base`

```css
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700&family=Lexend:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* surfaces (HSL so Tailwind hsl(var(--x)) keeps working) */
    --background: 48 33% 97%;          /* #FBFAF6 warm off-white */
    --foreground: 225 6% 16%;          /* #26272B */
    --card: 0 0% 100%;
    --card-foreground: 225 6% 16%;
    --popover: 0 0% 100%;
    --popover-foreground: 225 6% 16%;

    /* brand + accents (bright fill) */
    --primary: 220 84% 55%;            /* #2F6FED */
    --primary-foreground: 0 0% 100%;
    --primary-deep: 222 74% 41%;       /* #1B4FB5 text/edge */
    --secondary: 60 14% 94%;           /* #F1F1EC neutral panel */
    --secondary-foreground: 225 6% 16%;
    --accent: 6 100% 68%;              /* #FF6B5E coral */
    --accent-foreground: 0 0% 100%;
    --accent-2: 258 90% 66%;           /* #8B5CF6 grape */
    --accent-2-foreground: 0 0% 100%;
    --xp: 45 100% 59%;                 /* #FFC42E gold */
    --xp-foreground: 225 6% 16%;       /* near-black on gold */
    --streak: 28 100% 56%;             /* #FF8A1E flame */
    --streak-foreground: 0 0% 100%;

    /* status */
    --success: 145 62% 43%;            /* #28B463 */
    --success-foreground: 0 0% 100%;
    --success-deep: 145 64% 29%;       /* #1B7A45 */
    --warning: 38 92% 50%;             /* #F59E0B try-again */
    --warning-foreground: 30 92% 18%;
    --destructive: 358 76% 59%;        /* #E5484D admin */
    --destructive-foreground: 0 0% 100%;

    /* neutrals / chrome */
    --muted: 60 9% 93%;
    --muted-foreground: 222 5% 38%;    /* #5C5F66 */
    --border: 52 11% 88%;              /* #E4E4DE */
    --input: 52 8% 80%;                /* #CFCFC8 */
    --ring: 220 84% 55%;

    /* tints (subtle bg / progress track) */
    --primary-tint: 218 89% 95%;
    --success-tint: 145 60% 93%;
    --xp-tint: 48 100% 93%;

    --radius: 14px;                    /* md (buttons) */
    --radius-sm: 10px;
    --radius-lg: 18px;
    --radius-xl: 24px;

    --shadow-1: 0 2px 8px rgba(20,20,40,.08);
    --shadow-2: 0 8px 24px rgba(20,20,40,.12);
    --shadow-3: 0 16px 40px rgba(20,20,40,.16);

    --font-display: 'Baloo 2', system-ui, cursive;
    --font-body: 'Be Vietnam Pro', system-ui, sans-serif;
    --nav-h: 4rem;
  }

  .dark {
    --background: 222 16% 9%;          /* #13151B */
    --foreground: 220 9% 92%;          /* #ECEDEF */
    --card: 222 15% 13%;               /* #1B1E26 */
    --card-foreground: 220 9% 92%;
    --popover: 222 15% 13%;
    --popover-foreground: 220 9% 92%;
    --primary: 220 80% 65%;
    --primary-foreground: 0 0% 100%;
    --primary-deep: 220 80% 72%;
    --secondary: 222 12% 18%;
    --secondary-foreground: 220 9% 92%;
    --accent: 6 90% 68%;
    --accent-2: 258 80% 70%;
    --xp: 45 95% 60%; --xp-foreground: 30 40% 12%;
    --streak: 28 90% 60%;
    --success: 145 55% 50%; --success-deep: 145 50% 60%;
    --warning: 38 88% 56%; --warning-foreground: 30 50% 12%;
    --destructive: 358 66% 58%;
    --muted: 222 12% 18%;
    --muted-foreground: 220 7% 64%;
    --border: 222 12% 22%;
    --input: 222 12% 26%;
    --ring: 220 80% 65%;
    --primary-tint: 220 40% 20%;
    --success-tint: 145 30% 18%;
    --xp-tint: 45 40% 20%;
    --shadow-1: 0 2px 8px rgba(0,0,0,.4);
    --shadow-2: 0 8px 24px rgba(0,0,0,.5);
    --shadow-3: 0 16px 40px rgba(0,0,0,.6);
  }

  * { @apply border-border; }
  body { @apply bg-background text-foreground; font-family: var(--font-body); }
  h1,h2,h3,h4,h5,h6 { font-family: var(--font-display); }
  html { scroll-padding-top: var(--nav-h); }
  img,video,svg,canvas { max-width: 100%; height: auto; }
  button,a,[role="button"],label,summary { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
  :focus-visible { outline: 3px solid hsl(var(--ring)); outline-offset: 2px; }
}

@layer components {
  /* the single pressable CTA */
  .btn-press { box-shadow: 0 4px 0 hsl(var(--primary-deep)); transition: transform .1s, box-shadow .1s; }
  .btn-press:active { transform: translateY(4px); box-shadow: 0 0 0 hsl(var(--primary-deep)); }
}

@media (prefers-reduced-motion: reduce) {
  *,*::before,*::after { animation-duration:.01ms!important; animation-iteration-count:1!important; transition-duration:.01ms!important; scroll-behavior:auto!important; }
}
```

### 9.2 `tailwind.config.ts` — `theme.extend`

```ts
extend: {
  fontFamily: {
    display: ["Baloo 2", "system-ui", "cursive"],
    body: ["Be Vietnam Pro", "system-ui", "sans-serif"],
    reading: ["Lexend", "system-ui", "sans-serif"],
  },
  colors: {
    border: "hsl(var(--border))", input: "hsl(var(--input))", ring: "hsl(var(--ring))",
    background: "hsl(var(--background))", foreground: "hsl(var(--foreground))",
    primary:   { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))", deep: "hsl(var(--primary-deep))", tint: "hsl(var(--primary-tint))" },
    secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
    accent:    { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
    accent2:   { DEFAULT: "hsl(var(--accent-2))", foreground: "hsl(var(--accent-2-foreground))" },
    xp:        { DEFAULT: "hsl(var(--xp))", foreground: "hsl(var(--xp-foreground))", tint: "hsl(var(--xp-tint))" },
    streak:    { DEFAULT: "hsl(var(--streak))", foreground: "hsl(var(--streak-foreground))" },
    success:   { DEFAULT: "hsl(var(--success))", foreground: "hsl(var(--success-foreground))", deep: "hsl(var(--success-deep))", tint: "hsl(var(--success-tint))" },
    warning:   { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-foreground))" },
    destructive:{ DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
    muted:     { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
    card:      { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
    popover:   { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
  },
  borderRadius: { sm: "var(--radius-sm)", DEFAULT: "var(--radius)", md: "var(--radius)", lg: "var(--radius-lg)", xl: "var(--radius-xl)" },
  boxShadow: { 1: "var(--shadow-1)", 2: "var(--shadow-2)", 3: "var(--shadow-3)" },
  fontSize: {
    "fluid-display": ["clamp(1.875rem,1.3rem+2.75vw,3rem)", { lineHeight: "1.1" }],
    "fluid-h1": ["clamp(1.625rem,1.2rem+1.6vw,2.25rem)", { lineHeight: "1.15" }],
    "body-lg": ["1.125rem", { lineHeight: "1.6" }],
  },
  maxWidth: { reading: "65ch" },
}
```

> **Removed from old config/css:** all `.glass*`, `--glass-*`, `.gradient-*` (rainbow/energy/purple-card/orange-card/cool/warm/text…), `gradient-hero` animated bg, `--primary-glow`, `pink`/`cyan`/`energy` ad-hoc colors, `--radius` 16→14, glass 32px radius. Keep: safe-area spacing, `hoverOnlyWhenSupported`, fluid type, reduced-motion block, tailwindcss-animate.

---

## 10. Phased rollout (ship incrementally, never break live)

Live site = GitHub Pages; redesign behind incremental PRs. **Tokens & primitives first, leaf pages last.**

| Phase | Scope | Why first / safety |
|---|---|---|
| **0 — Audit & freeze** | Grep & inventory every `glass*`, `gradient-*`, hardcoded color (`text-indigo-800`, `from-pink-…`), inline button/card/hero. Add visual-regression snapshots. | Know blast radius before touching tokens. |
| **1 — Tokens** | Paste §9 css vars + tailwind extend. Keep OLD `.glass`/`.gradient-*` temporarily as deprecated shims so nothing 500s. Swap font import Nunito→Be Vietnam Pro. | Pure additive; existing components still render. |
| **2 — Primitives** | Re-skin shadcn `Button` (pressable), `Card`, `Input`, `Badge`, `Progress`, `Tabs`, `Dialog`/`Sheet`, `Skeleton` to tokens. Build shared `PageHero`, `AppNav` (top+bottom), `EmptyState`, `MediaCard`, `LearningModeTabs`, `ResultScreen`, `motion.ts`. | One source of truth; downstream pages inherit automatically. |
| **3 — Shell & IA** | Replace 3 divergent navs with `AppNav`; collapse routes into 4 hubs (Học·Luyện tập·Video·Tiến trình); bottom bar mobile; standardize page widths/gutters. | Highest clutter win; touches layout not content logic. |
| **4 — Dashboard + Home** | Rebuild dashboard (ring, ContinueCard, rails, single scroll) + landing. Retire animated bg/glass there. | Most-seen screens; proves the look. |
| **5 — Learn flow** | Grades, Grade detail (path/map), Vocab/Grammar/Reading via `LearningModeTabs` + shared `ResultScreen`; flashcard/quiz/spelling option states. | Core value; fixes triplicated tabs + nested-scroll. |
| **6 — Practice & Tests** | Game menu + 7 games (HUD, ResultScreen), SRS, test-list/grid, custom builder, shadowing/camera. | Reuses primitives + ResultScreen. |
| **7 — Video & Progress & Pet** | Video hub/player (MediaCard, transcript), progress analytics/badges, leaderboard (age-gate), pet (lucide, evolve ring). | Gamification polish. |
| **8 — Admin** | Re-skin admin shell/DataTable/forms with tokens (no kid gamification). | Internal, low-risk, last. |
| **9 — Cleanup gate** | Delete deprecated `.glass*`/`.gradient-*` shims; grep confirms zero refs; run WCAG-AA contrast + reduced-motion + 44px target audit as the release gate. Sync docs/UI text per repo "docs-sync" rule. | Removes dead system only once nothing references it. |

**Per-phase gate:** AA contrast pass, focus-visible present, ≥44px targets, prefers-reduced-motion respected, mobile bottom-nav reachable, no horizontal scroll on 360px.

---

### Quick reference — banned vs. required
- ❌ glassmorphism on content · neumorphism · ALL-CAPS body · justified text · pure-white reading bg · color-only state · hamburger for primary nav · emoji as UI icons · raw hex in components · >5 nav tabs · animated rainbow background.
- ✅ flat + soft-shadow + 1px border · pressable Filled CTA · tokens only · 16px+ body / 18px reading · ≤65ch measure · 4 labeled tabs · lucide icons · mascot at win-moments · skeletons · 44px targets · AA as release gate.
