#!/usr/bin/env node
// Audio-faithful rhythm builder for ReadFlow video lessons.
//
// Goal: produce `/` (short pause) and `//` (long pause) marks that match HOW THE
// SPEAKER ACTUALLY TALKS, so Vietnamese beginners can shadow real spoken US
// English. Pauses are detected from caption word-timing (the times are aligned to
// the real audio): silence-after-word = gap - estimated spoken duration of the
// word, graded by how long the silence is. No GPU / WhisperX / benepar needed,
// so it works anytime, even on videos whose audio download is DRM-blocked.
//
// Usage:
//   node scripts/rhythm-from-captions.mjs <youtube-url> [--grade N] [--topic "..."]
//        [--density moderate|faithful|sparse] [--out file.json] [--write]
//
// Without --write it prints/saves the lesson JSON (dry run). With --write it
// upserts into Firestore collection `video_lessons` (needs firebase-admin +
// GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON).

import { spawn } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const RHYTHM_SOURCE = "caption-audio-v1";

// ---- pause-detection model (tuned on real kids'-video captions) ----
const DENSITY = {
  // minorMs / majorMs = silence (ms) needed for a `/` resp. `//` boundary.
  sparse: { minorMs: 380, majorMs: 620 },
  moderate: { minorMs: 280, majorMs: 520 }, // default: real phrasing, drops micro-emphasis
  faithful: { minorMs: 180, majorMs: 430 },
};
const WORD_BASE_MS = 120; // onset cost of any word
const PER_SYLLABLE_MS = 95; // spoken time per syllable

function parseArgs(argv) {
  const args = { url: null, grade: 6, topic: "", density: "moderate", out: null, write: false, source: RHYTHM_SOURCE, title: "" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--write") args.write = true;
    else if (a === "--grade") args.grade = Number(argv[++i]);
    else if (a === "--title") args.title = String(argv[++i]); // override video title (yt-dlp info-json is flaky)
    else if (a === "--topic") args.topic = String(argv[++i]);
    else if (a === "--density") args.density = String(argv[++i]);
    else if (a === "--out") args.out = String(argv[++i]);
    else if (a === "--source") args.source = String(argv[++i]); // override rhythmSource label
    else if (a === "--captions-dir") args.captionsDir = String(argv[++i]); // use pre-fetched json3 caption files (skip yt-dlp)
    else if (a === "--transcript-file") args.transcriptFile = String(argv[++i]); // punctuated transcript for auto-only videos
    else if (!args.url) args.url = a;
  }
  return args;
}

function extractVideoId(input) {
  const s = String(input || "").trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(/(?:v=|\/shorts\/|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const core = (s) => String(s || "").toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
const syllables = (w) => {
  const c = core(w).replace(/(?:e|es|ed)$/i, "");
  return Math.max(1, (c.match(/[aeiouy]+/g) || []).length);
};
const wordDurMs = (w) => WORD_BASE_MS + syllables(w) * PER_SYLLABLE_MS;
const round2 = (n) => Math.round(n * 100) / 100;

function run(cmd, cmdArgs, { cwd } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, { cwd, windowsHide: true });
    let out = "", err = "";
    child.stdout.on("data", (c) => (out += c));
    child.stderr.on("data", (c) => (err += c));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, out, err }));
  });
}

async function fetchCaptions(videoId, workDir, captionsDir) {
  let dir = captionsDir;
  if (!dir) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    // Player clients that return captions without a JS runtime; ignore DRM/format
    // errors because we only need the subtitle tracks. --sleep-requests throttles
    // to avoid HTTP 429 from YouTube.
    await run("yt-dlp", [
      "--extractor-args", "youtube:player_client=tv,mweb,web",
      "--ignore-no-formats-error", "--no-warnings", "--skip-download", "--sleep-requests", "2",
      "--write-auto-subs", "--write-subs", "--sub-langs", "en.*", "--sub-format", "json3",
      "--write-info-json",
      "-o", path.join(workDir, "%(id)s.%(ext)s"), url,
    ]);
    dir = workDir;
  }

  const files = (await readdir(dir)).filter((f) => f.startsWith(`${videoId}.`) && f.endsWith(".json3"));
  if (files.length === 0) throw new Error("No English captions found for this video.");

  // Score each track: a MANUAL track has sentence punctuation (best for text); an
  // AUTO track has per-word timing (tOffsetMs, best for pause detection). YouTube
  // exposes both (e.g. en-US = manual, en/en-orig = auto), so pick each by strength.
  const tracks = [];
  for (const f of files) {
    let data;
    try { data = JSON.parse(await readFile(path.join(dir, f), "utf8")); } catch { continue; }
    const events = data.events ?? [];
    const text = events.flatMap((e) => (e.segs ?? []).map((s) => s.utf8 ?? "")).join("");
    const punct = (text.match(/[.!?]/g) ?? []).length;
    const wordSegs = events.reduce((n, e) => n + (e.segs ?? []).filter((s) => Number.isFinite(s.tOffsetMs)).length, 0);
    tracks.push({ f, raw: JSON.stringify(data), punct, wordSegs, isOrig: /-orig\.json3$/.test(f) });
  }
  if (tracks.length === 0) throw new Error("No readable English captions for this video.");

  const cleanTrack = [...tracks].sort((a, b) => b.punct - a.punct || Number(a.isOrig) - Number(b.isOrig))[0];
  const wordTrack = [...tracks].sort((a, b) => b.wordSegs - a.wordSegs)[0];

  let title = `YouTube ${videoId}`;
  try {
    const info = (await readdir(dir)).find((f) => f === `${videoId}.info.json`);
    if (info) title = JSON.parse(await readFile(path.join(dir, info), "utf8")).title || title;
  } catch {}

  return {
    title,
    cleanText: trackText(cleanTrack.raw),
    words: parseJson3Words(wordTrack.raw),
    autoCaption: cleanTrack.punct === 0,
  };
}

// Join a caption track into one plain transcript string (strip [Music] etc.).
// The TEXT comes from the punctuated/manual track; sentence splitting + accurate
// per-sentence timing are done later by buildLinesFromTranscript against the
// word-timed (auto) track — so a manual track with bad sentence-level timing
// (some have all events squeezed into a few seconds) no longer breaks alignment.
function trackText(raw) {
  const data = JSON.parse(raw);
  return (data.events ?? [])
    .map((ev) => (ev.segs ?? []).map((s) => s.utf8 ?? "").join(""))
    .join(" ")
    .replace(/\[[^\]]*\]/g, " ") // [Music] [Applause]
    .replace(/\s+/g, " ")
    .trim();
}

function parseJson3Words(raw) {
  const data = JSON.parse(raw);
  const words = [];
  for (const ev of data.events ?? []) {
    const base = ev.tStartMs ?? 0;
    for (const seg of ev.segs ?? []) {
      const t = (seg.utf8 ?? "").replace(/\n/g, " ").trim();
      if (t) words.push({ core: core(t), startMs: base + (seg.tOffsetMs ?? 0) });
    }
  }
  return words;
}

// Longest-common-subsequence match between two arrays of word "cores".
function lcsMatches(a, b) {
  const rows = a.length + 1, cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => new Int32Array(cols));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] && a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const matches = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] && a[i] === b[j]) { matches.push({ ai: i, bi: j }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return matches;
}

// For videos with ONLY auto-captions (no punctuation), a human/LLM supplies a
// punctuated transcript (same words, with capitalization + . ! ? added). We align
// its tokens to the auto word-timing stream (LCS), give every token a time, then
// cut into sentence lines. Result feeds buildRhythm exactly like a manual track.
function buildLinesFromTranscript(text, words) {
  const tokens = String(text).replace(/\s+/g, " ").trim().match(/\S+/g) ?? [];
  if (tokens.length === 0 || words.length === 0) return [];
  const firstMs = words[0].startMs;
  const lastMs = words[words.length - 1].startMs + 500;
  const matchByToken = new Map(lcsMatches(tokens.map(core), words.map((w) => w.core)).map((m) => [m.ai, m.bi]));
  const times = tokens.map((_, i) => (matchByToken.has(i) ? words[matchByToken.get(i)].startMs : null));
  const anchors = [
    { i: -1, t: firstMs },
    ...times.map((t, i) => (t != null ? { i, t } : null)).filter(Boolean),
    { i: tokens.length, t: lastMs },
  ];
  for (let a = 0; a < anchors.length - 1; a++) {
    const L = anchors[a], R = anchors[a + 1];
    for (let i = L.i + 1; i < R.i; i++) times[i] = L.t + ((R.t - L.t) * (i - L.i)) / (R.i - L.i);
  }
  const lines = [];
  let cur = [];
  let curStart = firstMs;
  const flush = () => {
    if (!cur.length) return;
    lines.push({ text: cur.map((c) => c.tok).join(" "), startMs: Math.round(curStart), endMs: Math.round(cur[cur.length - 1].t + 300) });
    cur = [];
  };
  for (let i = 0; i < tokens.length; i++) {
    if (!cur.length) curStart = times[i];
    cur.push({ tok: tokens[i], t: times[i] });
    if (/[.!?…]['")\]]*$/.test(tokens[i])) flush();
  }
  flush();
  return lines;
}

// Assign each caption token a start time (seconds) using the word-timing stream
// restricted to this line's time window (avoids global drift). Unmatched tokens
// are linearly interpolated between matched anchors so chunk times stay monotonic.
function alignLineTokens(tokens, words, lineStart, lineEnd) {
  const windowWords = words.filter((w) => w.startMs / 1000 >= lineStart - 0.3 && w.startMs / 1000 <= lineEnd + 0.3);
  const matchByToken = new Map(
    lcsMatches(tokens.map(core), windowWords.map((w) => w.core)).map((m) => [m.ai, m.bi]),
  );
  const times = tokens.map((_, i) =>
    matchByToken.has(i) ? { sec: windowWords[matchByToken.get(i)].startMs / 1000, matched: true } : { sec: null, matched: false },
  );
  // interpolate gaps between anchors (virtual anchors at line bounds)
  const anchors = [{ i: -1, sec: lineStart }, ...times.map((t, i) => (t.matched ? { i, sec: t.sec } : null)).filter(Boolean), { i: tokens.length, sec: lineEnd }];
  for (let a = 0; a < anchors.length - 1; a++) {
    const L = anchors[a], R = anchors[a + 1];
    for (let i = L.i + 1; i < R.i; i++) {
      times[i].sec = L.sec + ((R.sec - L.sec) * (i - L.i)) / (R.i - L.i);
    }
  }
  return times;
}

// Build rhythmChunks per line: detect silence after each token (only between
// tokens whose timing came from the real audio, not interpolation), grade into
// minor/major, and emit chunks with accurate start/end for the "play chunk" UI.
function buildRhythm(lines, words, density) {
  const { minorMs, majorMs } = DENSITY[density] ?? DENSITY.moderate;

  return lines.map((line) => {
    const tokens = line.text.match(/\S+/g) ?? [];
    const lineStart = round2(line.startMs / 1000);
    const lineEnd = Math.max(lineStart + 0.4, round2(line.endMs / 1000));
    if (tokens.length < 2) return toLine(line, lineStart, lineEnd);

    const times = alignLineTokens(tokens, words, lineStart, lineEnd);

    const groups = [];
    let cur = { tokens: [], startIdx: 0 };
    for (let i = 0; i < tokens.length; i++) {
      cur.tokens.push(tokens[i]);
      if (i === tokens.length - 1) break;
      // silence only trustworthy when both tokens are real (matched) and adjacent
      const silence =
        times[i].matched && times[i + 1].matched ? (times[i + 1].sec - times[i].sec) * 1000 - wordDurMs(tokens[i]) : -1;
      if (silence >= minorMs) {
        cur.boundary = { silence, type: silence >= majorMs ? "major" : "minor", punct: /[,.;:!?]$/.test(tokens[i]) };
        groups.push(cur);
        cur = { tokens: [], startIdx: i + 1 };
      }
    }
    groups.push(cur);
    if (groups.length < 2) return toLine(line, lineStart, lineEnd);

    let prevEnd = lineStart;
    const chunks = groups.map((g, gi) => {
      const start = round2(Math.max(prevEnd, times[g.startIdx].sec ?? lineStart));
      const nextStart = gi < groups.length - 1 ? times[groups[gi + 1].startIdx].sec : lineEnd;
      const end = round2(Math.max(start + 0.2, Math.min(lineEnd, nextStart)));
      prevEnd = end;
      const chunk = { text: g.tokens.join(" "), start, end };
      if (g.boundary) {
        const sources = ["silence"];
        if (g.boundary.punct) sources.push("punctuation");
        chunk.boundaryAfter = {
          type: g.boundary.type,
          pauseMs: Math.max(0, Math.round(g.boundary.silence)),
          confidence: g.boundary.type === "major" ? 0.92 : 0.82,
          sources,
        };
      }
      return chunk;
    });

    return { ...toLine(line, lineStart, lineEnd), rhythmChunks: chunks };
  });
}

function toLine(line, start, end) {
  return { id: "", start, end, text: line.text };
}

function buildLesson({ videoId, title, grade, topic, lines, autoCaption, source }) {
  return {
    title,
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    videoId,
    source: autoCaption ? "auto_caption" : "caption",
    languageCode: "en",
    grade: Number.isFinite(grade) ? grade : null,
    topic: topic || "",
    lines: lines.map((l, i) => ({ ...l, id: `l${i}` })),
    rhythmSource: source || RHYTHM_SOURCE,
  };
}

async function writeToFirestore(lesson) {
  const { initializeApp, applicationDefault, cert } = await import("firebase-admin/app");
  const { getFirestore, FieldValue } = await import("firebase-admin/firestore");
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  initializeApp({ credential: saJson ? cert(JSON.parse(saJson)) : applicationDefault() });
  const db = getFirestore();
  await db.collection("video_lessons").doc(lesson.videoId).set(
    { ...lesson, updatedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp(), createdBy: "skill:rhythm-from-captions" },
    { merge: true },
  );
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.url) { console.error("Usage: node scripts/rhythm-from-captions.mjs <youtube-url> [--grade N] [--write]"); process.exit(1); }
  const videoId = extractVideoId(args.url);
  if (!videoId) { console.error("Invalid YouTube URL/ID."); process.exit(1); }

  const workDir = await mkdtemp(path.join(tmpdir(), "rhythm-cap-"));
  try {
    const fetched = await fetchCaptions(videoId, workDir, args.captionsDir);
    const title = args.title || fetched.title;
    const cleanText = args.transcriptFile ? await readFile(args.transcriptFile, "utf8") : fetched.cleanText;
    const lines = buildLinesFromTranscript(cleanText, fetched.words);
    const withRhythm = buildRhythm(lines, fetched.words, args.density);
    const lesson = buildLesson({ videoId, title, grade: args.grade, topic: args.topic, lines: withRhythm, autoCaption: fetched.autoCaption, source: args.source });

    const withMarks = withRhythm.filter((l) => l.rhythmChunks && l.rhythmChunks.length > 1).length;
    console.error(`[rhythm] ${videoId} "${title}" — ${withRhythm.length} lines, ${withMarks} with rhythm, density=${args.density}`);

    if (args.out) await writeFile(args.out, JSON.stringify(lesson, null, 2), "utf8");
    if (args.write) { await writeToFirestore(lesson); console.error(`[rhythm] wrote video_lessons/${videoId} to Firestore`); }
    else console.log(JSON.stringify(lesson, null, 2));
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.stack : e); process.exit(1); });
