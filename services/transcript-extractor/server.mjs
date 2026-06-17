import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT ?? 8788);
const HOST = process.env.HOST ?? "127.0.0.1";
const TOKEN = process.env.TRANSCRIPT_EXTRACTOR_TOKEN ?? "";
const SERVICE_DIR = path.dirname(fileURLToPath(import.meta.url));
const YTDLP_BIN = process.env.YTDLP_BIN ?? "yt-dlp";
const FFMPEG_BIN = process.env.FFMPEG_BIN ?? "ffmpeg";
const PYTHON_BIN = process.env.PYTHON_BIN ?? process.env.PYTHON ?? "python";
const YTDLP_TIMEOUT_MS = Number(process.env.YTDLP_TIMEOUT_MS ?? 180_000);
const FFMPEG_TIMEOUT_MS = Number(process.env.FFMPEG_TIMEOUT_MS ?? 90_000);
const SYNTAX_ANALYZER_TIMEOUT_MS = Number(process.env.SYNTAX_ANALYZER_TIMEOUT_MS ?? 180_000);
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES ?? 32_768);
const AUDIO_SAMPLE_RATE = Number(process.env.AUDIO_RHYTHM_SAMPLE_RATE ?? 16_000);
const AUDIO_FRAME_MS = Number(process.env.AUDIO_RHYTHM_FRAME_MS ?? 20);
const AUDIO_LOW_DURATION_SECONDS = Number(process.env.AUDIO_RHYTHM_LOW_DURATION ?? 0.08);
const AUDIO_DB_DROP = Number(process.env.AUDIO_RHYTHM_DB_DROP ?? 7);
const MAX_AUDIO_PCM_BYTES = Number(process.env.MAX_AUDIO_PCM_BYTES ?? 80_000_000);
const RHYTHM_ENGINE = process.env.RHYTHM_ENGINE ?? "whisperx";
const WHISPERX_BIN = process.env.WHISPERX_BIN ?? "whisperx";
const WHISPERX_MODEL = process.env.WHISPERX_MODEL ?? "large-v3";
const WHISPERX_DEVICE = process.env.WHISPERX_DEVICE ?? "cuda";
const WHISPERX_COMPUTE_TYPE = process.env.WHISPERX_COMPUTE_TYPE ?? "float16";
const WHISPERX_BATCH_SIZE = Number(process.env.WHISPERX_BATCH_SIZE ?? 8);
const WHISPERX_TIMEOUT_MS = Number(process.env.WHISPERX_TIMEOUT_MS ?? 900_000);
const SYNTAX_ANALYZER_PATH = path.join(SERVICE_DIR, "syntax-boundaries.py");
const DEFAULT_RHYTHM_GRADE = Number(process.env.RHYTHM_DEFAULT_GRADE ?? 6);

class PublicError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function normalizeRhythmEngine(value) {
  const engine = String(value ?? "").trim().toLowerCase();
  if (engine === "whisperx" || engine === "ffmpeg") return engine;
  throw new PublicError("RHYTHM_ENGINE chỉ hỗ trợ 'whisperx' hoặc 'ffmpeg'.", 400);
}

export async function extractTranscript(urlOrId, options = {}) {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) {
    throw new PublicError("URL YouTube không hợp lệ.", 400);
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const workDir = await mkdtemp(path.join(tmpdir(), "co-yen-ytdlp-"));

  try {
    const { stdout, stderr } = await runYtDlp(canonicalUrl, workDir);
    const outputLines = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const idIndex = outputLines.findIndex((line) => /^[a-zA-Z0-9_-]{11}$/.test(line));
    const resolvedVideoId = idIndex >= 0 ? outputLines[idIndex] : videoId;
    const title = outputLines[idIndex + 1] || `YouTube ${resolvedVideoId}`;

    const files = await readdir(workDir);
    const captionFile = pickCaptionFile(files, resolvedVideoId);
    if (!captionFile) {
      const detail = summarizeYtDlpError(stderr);
      throw new PublicError(
        detail
          ? `Không tìm thấy phụ đề tiếng Anh bằng yt-dlp: ${detail}`
          : "Không tìm thấy phụ đề tiếng Anh bằng yt-dlp.",
        422,
      );
    }

    const fullPath = path.join(workDir, captionFile);
    const raw = await readFile(fullPath, "utf8");
    let lines = captionFile.endsWith(".json3")
      ? parseJson3(raw)
      : parseWebVtt(raw);
    const timingFile = pickTimingCaptionFile(files, resolvedVideoId, captionFile);
    let wordTimings = [];
    if (timingFile) {
      const timingRaw = timingFile === captionFile ? raw : await readFile(path.join(workDir, timingFile), "utf8");
      wordTimings = parseJson3WordTimings(timingRaw);
    }

    if (lines.length === 0) {
      throw new PublicError("Phụ đề tải được nhưng chưa có nội dung đọc được.", 422);
    }

    lines = stripRhythmChunks(lines);
    const audioFile = pickAudioFile(files, resolvedVideoId);
    if (!audioFile) {
      throw new PublicError("yt-dlp did not download usable audio. WhisperX/ffmpeg rhythm analysis requires audio.", 422);
    }

    let rhythmSource = "none";
    const rhythmEngine = normalizeRhythmEngine(RHYTHM_ENGINE);
    let energy = null;
    let rhythmWordTimings = [];

    if (rhythmEngine === "whisperx") {
      rhythmWordTimings = await transcribeWordTimingsWithWhisperX(path.join(workDir, audioFile), workDir);
    } else {
      rhythmWordTimings = wordTimings.length > 1 ? wordTimings : buildLineWordTimings(lines);
    }

    energy = await analyzeAudioEnergy(path.join(workDir, audioFile));
    const syntaxProfiles = await analyzeSyntaxProfiles(lines);
    rhythmSource =
      rhythmEngine === "whisperx"
        ? syntaxProfiles.size > 0
          ? "whisperx-syntax-v4"
          : "whisperx-hybrid-v1"
        : syntaxProfiles.size > 0
          ? "ffmpeg-syntax-v4"
          : "ffmpeg-hybrid-v1";

    lines = applyProsodyRhythm(lines, rhythmWordTimings, energy, syntaxProfiles, {
      grade: normalizeGrade(options.grade),
    });
    if (!lines.some((line) => Array.isArray(line.rhythmChunks) && line.rhythmChunks.length > 1)) {
      rhythmSource = "none";
    }

    return {
      videoId: resolvedVideoId,
      title,
      source: captionFile.toLowerCase().includes("-orig") ? "auto_caption" : "caption",
      languageCode: languageFromFilename(captionFile),
      lines,
      rhythmSource,
      extractor: {
        engine: `yt-dlp+${rhythmEngine}-syntax-first-prosody`,
        captionFile,
        timingFile,
        audioFile,
        syntaxEngine: syntaxProfiles.size > 0 ? "spacy+benepar_en3_large" : null,
      },
    };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function transcribeWordTimingsWithWhisperX(audioPath, workDir) {
  const outputDir = path.join(workDir, "whisperx-output");
  await mkdir(outputDir, { recursive: true });

  const args = [
    audioPath,
    "--model",
    WHISPERX_MODEL,
    "--language",
    "en",
    "--device",
    WHISPERX_DEVICE,
    "--compute_type",
    WHISPERX_COMPUTE_TYPE,
    "--batch_size",
    String(WHISPERX_BATCH_SIZE),
    "--output_format",
    "json",
    "--output_dir",
    outputDir,
  ];

  await runWhisperX(args);

  const files = await readdir(outputDir);
  const jsonFile = files.find((file) => file.toLowerCase().endsWith(".json"));
  if (!jsonFile) {
    throw new PublicError("WhisperX did not create a JSON transcript.", 2);
  }

  const parsed = JSON.parse(await readFile(path.join(outputDir, jsonFile), "utf8"));
  const words = [];
  for (const segment of Array.isArray(parsed.segments) ? parsed.segments : []) {
    for (const word of Array.isArray(segment.words) ? segment.words : []) {
      const text = normalizeCaptionText(word.word ?? word.text ?? "");
      const start = roundTime(Number(word.start));
      const end = roundTime(Number(word.end));
      if (text && Number.isFinite(start) && Number.isFinite(end) && end > start) {
        words.push({ text, start, end, score: Number(word.score ?? 0) });
      }
    }
  }

  words.sort((a, b) => a.start - b.start);
  if (words.length < 2) {
    throw new PublicError("WhisperX did not return usable word timestamps.", 2);
  }

  return words.map(({ text, start, end }) => ({ text, start, end }));
}

function runWhisperX(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(WHISPERX_BIN, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new PublicError("WhisperX timed out.", 2));
    }, WHISPERX_TIMEOUT_MS);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.length > 1_000_000) stdout = stdout.slice(-500_000);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      if (stderr.length > 2_000_000) stderr = stderr.slice(-1_000_000);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(
        new PublicError(
          error.code === "ENOENT"
            ? "WhisperX is not installed or WHISPERX_BIN is not in PATH."
            : `Cannot run WhisperX: ${error.message}`,
          2,
        ),
      );
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new PublicError(`WhisperX failed. ${summarizeYtDlpError(stderr) || stderr.slice(-500)}`.trim(), 2));
    });
  });
}

function runYtDlp(url, workDir) {
  const args = [
    "--js-runtimes",
    process.env.YTDLP_JS_RUNTIMES ?? "node",
    "--remote-components",
    process.env.YTDLP_REMOTE_COMPONENTS ?? "ejs:github",
    "--format",
    process.env.YTDLP_AUDIO_FORMAT ?? "bestaudio[ext=m4a]/bestaudio/best",
    "--write-subs",
    "--write-auto-subs",
    "--sub-langs",
    process.env.YTDLP_SUB_LANGS ?? "en,en-orig,en-US,en-GB",
    "--sub-format",
    process.env.YTDLP_SUB_FORMAT ?? "json3/vtt",
    "--no-playlist",
    "--no-simulate",
    "--print",
    "%(id)s",
    "--print",
    "%(title)s",
    "-o",
    path.join(workDir, "%(id)s.%(ext)s"),
    url,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(YTDLP_BIN, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new PublicError("yt-dlp chạy quá lâu, hãy thử lại sau.", 504));
    }, YTDLP_TIMEOUT_MS);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.length > 1_000_000) child.kill("SIGTERM");
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      if (stderr.length > 2_000_000) stderr = stderr.slice(-1_000_000);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(
        new PublicError(
          error.code === "ENOENT"
            ? "Máy chủ chưa cài yt-dlp hoặc yt-dlp chưa có trong PATH."
            : `Không chạy được yt-dlp: ${error.message}`,
          502,
        ),
      );
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(
        new PublicError(
          `yt-dlp chưa lấy được phụ đề. ${summarizeYtDlpError(stderr)}`.trim(),
          422,
        ),
      );
    });
  });
}

function pickCaptionFile(files, videoId) {
  const candidates = files.filter(
    (file) =>
      file.startsWith(`${videoId}.`) &&
      (file.toLowerCase().endsWith(".json3") || file.toLowerCase().endsWith(".vtt")),
  );
  if (candidates.length === 0) return null;

  return candidates.sort((a, b) => scoreCaptionFile(a) - scoreCaptionFile(b))[0];
}

function pickTimingCaptionFile(files, videoId, textFile) {
  const candidates = files.filter(
    (file) => file.startsWith(`${videoId}.`) && file.toLowerCase().endsWith(".json3"),
  );
  if (candidates.length === 0) return textFile.toLowerCase().endsWith(".json3") ? textFile : null;
  return candidates.sort((a, b) => scoreTimingCaptionFile(a, textFile) - scoreTimingCaptionFile(b, textFile))[0];
}

function pickAudioFile(files, videoId) {
  const audioExtensions = new Set([".m4a", ".webm", ".mp3", ".opus", ".wav", ".mp4", ".mkv"]);
  const candidates = files.filter((file) => {
    if (!file.startsWith(`${videoId}.`)) return false;
    return audioExtensions.has(path.extname(file).toLowerCase());
  });
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => scoreAudioFile(a) - scoreAudioFile(b))[0];
}

function scoreCaptionFile(file) {
  const lower = file.toLowerCase();
  let score = 1000;
  if (lower.endsWith(".json3")) score -= 200;
  if (lower.includes(".en.json3")) score -= 500;
  else if (lower.includes(".en-us.")) score -= 450;
  else if (lower.includes(".en-gb.")) score -= 440;
  else if (lower.includes(".en-orig.")) score -= 350;
  else if (/\.(en[-_][a-z]+|en)\./.test(lower)) score -= 250;
  return score;
}

function scoreTimingCaptionFile(file, textFile) {
  const lower = file.toLowerCase();
  let score = 1000;
  if (lower.includes(".en-orig.")) score -= 600;
  if (lower.includes(".en-us.")) score -= 420;
  if (lower.includes(".en-gb.")) score -= 400;
  if (lower.includes(".en.")) score -= 250;
  if (file === textFile) score -= 25;
  return score;
}

function scoreAudioFile(file) {
  const ext = path.extname(file).toLowerCase();
  const rank = [".m4a", ".webm", ".opus", ".mp3", ".mp4", ".wav", ".mkv"];
  const index = rank.indexOf(ext);
  return index >= 0 ? index : 999;
}

function languageFromFilename(file) {
  const parts = file.split(".");
  if (parts.length < 3) return "en";
  return parts.slice(1, -1).join(".").replace("-orig", "") || "en";
}

function parseJson3(raw) {
  const parsed = JSON.parse(raw);
  return compactCaptionEvents(Array.isArray(parsed.events) ? parsed.events : []);
}

function parseJson3WordTimings(raw) {
  const parsed = JSON.parse(raw);
  const events = Array.isArray(parsed.events) ? parsed.events : [];
  const words = [];

  for (const event of events) {
    if (!Array.isArray(event.segs)) continue;
    const eventStart = Number(event.tStartMs ?? 0) / 1000;
    const eventEnd = eventStart + Math.max(Number(event.dDurationMs ?? 1200) / 1000, 0.4);
    const textSegments = event.segs
      .map((segment, index) => ({ segment, index }))
      .filter(({ segment }) => normalizeCaptionText(segment.utf8 ?? "") && !isNoiseCaption(normalizeCaptionText(segment.utf8 ?? "")));

    for (let i = 0; i < textSegments.length; i++) {
      const { segment } = textSegments[i];
      const text = normalizeCaptionText(segment.utf8 ?? "");
      if (!text) continue;
      const start = eventStart + Number(segment.tOffsetMs ?? 0) / 1000;
      const nextOffset = textSegments[i + 1]?.segment?.tOffsetMs;
      const end = nextOffset == null ? Math.min(eventEnd, start + 0.45) : eventStart + Number(nextOffset) / 1000;
      pushWordPieces(words, text, start, end);
    }
  }

  words.sort((a, b) => a.start - b.start);
  for (let i = 0; i < words.length; i++) {
    const next = words[i + 1];
    if (next && next.start > words[i].start && words[i].end > next.start) {
      words[i].end = Math.min(next.start, words[i].start + 0.45);
    }
    if (words[i].end <= words[i].start) words[i].end = words[i].start + 0.2;
    words[i].start = roundTime(words[i].start);
    words[i].end = roundTime(words[i].end);
  }

  return words;
}

function analyzeAudioEnergy(audioPath) {
  const args = [
    "-hide_banner",
    "-nostdin",
    "-i",
    audioPath,
    "-vn",
    "-ac",
    "1",
    "-ar",
    String(AUDIO_SAMPLE_RATE),
    "-f",
    "s16le",
    "pipe:1",
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(FFMPEG_BIN, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const chunks = [];
    let byteLength = 0;
    let stderr = "";
    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill("SIGTERM");
      reject(error);
    };

    const timer = setTimeout(() => {
      fail(new PublicError("ffmpeg phân tích audio quá lâu, hãy thử video ngắn hơn.", 504));
    }, FFMPEG_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      if (settled) return;
      byteLength += chunk.length;
      if (byteLength > MAX_AUDIO_PCM_BYTES) {
        fail(new PublicError("Audio quá dài để phân tích nhịp trong chế độ local.", 413));
        return;
      }
      chunks.push(chunk);
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      if (stderr.length > 1_000_000) stderr = stderr.slice(-500_000);
    });

    child.on("error", (error) => {
      fail(
        new PublicError(
          error.code === "ENOENT"
            ? "Máy chưa cài ffmpeg hoặc ffmpeg chưa có trong PATH."
            : `Không chạy được ffmpeg: ${error.message}`,
          502,
        ),
      );
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        reject(new PublicError(`ffmpeg chưa đọc được audio. ${summarizeYtDlpError(stderr)}`.trim(), 422));
        return;
      }
      resolve(computeAudioFrames(Buffer.concat(chunks, byteLength)));
    });
  });
}

function computeAudioFrames(buffer) {
  const frameSamples = Math.max(1, Math.round((AUDIO_SAMPLE_RATE * AUDIO_FRAME_MS) / 1000));
  const bytesPerFrame = frameSamples * 2;
  const frames = [];

  for (let offset = 0; offset + 1 < buffer.length; offset += bytesPerFrame) {
    const availableSamples = Math.min(frameSamples, Math.floor((buffer.length - offset) / 2));
    if (availableSamples <= 0) continue;

    let sumSquares = 0;
    for (let i = 0; i < availableSamples; i++) {
      const sample = buffer.readInt16LE(offset + i * 2) / 32768;
      sumSquares += sample * sample;
    }

    const rms = Math.sqrt(sumSquares / availableSamples);
    const db = 20 * Math.log10(rms + 1e-8);
    const samplePosition = offset / 2 + availableSamples / 2;
    frames.push({
      time: samplePosition / AUDIO_SAMPLE_RATE,
      db,
    });
  }

  return {
    sampleRate: AUDIO_SAMPLE_RATE,
    frameMs: AUDIO_FRAME_MS,
    frameSeconds: AUDIO_FRAME_MS / 1000,
    frames,
  };
}

async function analyzeSyntaxProfiles(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return new Map();

  try {
    const payload = JSON.stringify({
      lines: lines.map((line) => ({
        id: line.id,
        text: normalizeCaptionText(line.text),
        originalText: line.text,
      })),
    });
    const { stdout } = await runSyntaxAnalyzer(payload);
    const parsed = JSON.parse(stdout);
    if (!parsed?.ok || !Array.isArray(parsed.lines)) return new Map();

    const profiles = new Map();
    for (const line of parsed.lines) {
      const profile = normalizeSyntaxProfile(line);
      if (profile) profiles.set(String(line.id), profile);
    }
    return profiles;
  } catch (error) {
    console.warn(`Syntax parser unavailable: ${error instanceof Error ? error.message : String(error)}`);
    return new Map();
  }
}

function runSyntaxAnalyzer(payload) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [SYNTAX_ANALYZER_PATH], {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("Syntax parser timed out."));
    }, SYNTAX_ANALYZER_TIMEOUT_MS);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.length > 5_000_000) stdout = stdout.slice(-2_500_000);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      if (stderr.length > 1_000_000) stderr = stderr.slice(-500_000);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(summarizeYtDlpError(stderr) || stderr.slice(-500) || `Syntax parser exited with ${code}.`));
    });

    child.stdin.end(payload);
  });
}

function normalizeSyntaxProfile(input) {
  const tokenCount = Number(input?.tokenCount ?? 0);
  const boundaries = new Map();
  if (!Number.isInteger(tokenCount) || tokenCount < 2 || !Array.isArray(input?.boundaries)) return null;

  for (const boundary of input.boundaries) {
    const index = Number(boundary?.index);
    if (!Number.isInteger(index) || index < 0 || index >= tokenCount - 1) continue;
    boundaries.set(index, {
      index,
      breakScore: Number(boundary.breakScore ?? 0),
      noBreakScore: Number(boundary.noBreakScore ?? 0),
      clean: Boolean(boundary.clean),
      tight: Boolean(boundary.tight),
      labels: Array.isArray(boundary.labels) ? boundary.labels.map(String).slice(0, 6) : [],
      sources: Array.isArray(boundary.sources) ? boundary.sources.map(String).slice(0, 6) : [],
      depth: Number.isFinite(Number(boundary.depth)) ? Number(boundary.depth) : null,
    });
  }

  const spans = Array.isArray(input?.spans)
    ? input.spans
        .map((span) => ({
          start: Number(span?.start),
          end: Number(span?.end),
          label: String(span?.label ?? ""),
          depth: Number.isFinite(Number(span?.depth)) ? Number(span.depth) : null,
        }))
        .filter((span) => Number.isInteger(span.start) && Number.isInteger(span.end) && span.end > span.start && span.label)
    : [];

  return { tokenCount, boundaries, spans };
}

function applyProsodyRhythm(lines, words, energy, syntaxProfiles = new Map(), options = {}) {
  if (!Array.isArray(words) || words.length < 2) {
    return lines;
  }

  return lines.map((line) => {
    const nearby = words.filter((word) => word.end >= line.start - 0.12 && word.start <= line.end + 0.12);
    const timedTokens = buildTimedTokens(line, nearby);
    if (timedTokens.length < 2) return line;

    const syntaxProfile = syntaxProfiles.get(line.id);
    const usableSyntaxProfile = usableSyntaxProfileForLine(line, timedTokens, syntaxProfile);
    const groups = groupTimedTokensForProsody(line, timedTokens, energy, usableSyntaxProfile, options);
    if (groups.length <= 1) return line;

    const rhythmChunks = buildRhythmChunksFromTimedGroups(line, groups, energy, usableSyntaxProfile);
    return rhythmChunks.length > 1 ? { ...line, rhythmChunks } : line;
  });
}

function usableSyntaxProfileForLine(line, timedTokens, syntaxProfile) {
  if (!syntaxProfile) return null;
  if (syntaxProfile.tokenCount === timedTokens.length) return syntaxProfile;

  const normalizedTokenCount = tokenizeForChunks(normalizeCaptionText(line.text)).length;
  if (syntaxProfile.tokenCount === normalizedTokenCount && normalizedTokenCount === timedTokens.length) {
    return syntaxProfile;
  }

  console.warn(
    `Syntax profile token mismatch for ${line.id}: parser=${syntaxProfile.tokenCount}, tokens=${timedTokens.length}. Falling back to non-syntax scoring for this line.`,
  );
  return null;
}

function buildTimedTokens(line, nearbyWords) {
  const tokens = tokenizeForChunks(line.text);
  if (tokens.length === 0) return [];

  const cleanWords = nearbyWords.filter((word) => normalizeCaptionText(word.text ?? ""));
  if (cleanWords.length < 2) return interpolateTimedTokens(tokens, line.start, line.end);

  const aligned = alignCaptionTokensToWordTimings(tokens, cleanWords, line.start, line.end);
  if (aligned) return aligned;

  return interpolateTimedTokens(tokens, line.start, line.end).map((token) => ({
    ...token,
    alignmentConfidence: 0,
  }));
}

function alignCaptionTokensToWordTimings(tokens, words, lineStart, lineEnd) {
  const tokenCores = tokens.map(wordCore);
  const wordCores = words.map((word) => wordCore(word.text ?? ""));
  const matches = longestCommonWordMatches(tokenCores, wordCores);
  const confidence = tokens.length ? matches.length / tokens.length : 0;
  if (confidence < 0.35) return null;

  const matchByToken = new Map(matches.map((match) => [match.tokenIndex, match.wordIndex]));
  const matchedTokenIndexes = matches.map((match) => match.tokenIndex);
  const timed = tokens.map((token, index) => {
    const matchedWordIndex = matchByToken.get(index);
    if (Number.isInteger(matchedWordIndex)) {
      const word = words[matchedWordIndex];
      return {
        text: token,
        index,
        start: Number.isFinite(word.start) ? word.start : lineStart,
        end: Number.isFinite(word.end) ? word.end : lineEnd,
        alignmentConfidence: roundConfidence(confidence),
      };
    }

    const previousTokenIndex = [...matchedTokenIndexes].reverse().find((matchedIndex) => matchedIndex < index);
    const nextTokenIndex = matchedTokenIndexes.find((matchedIndex) => matchedIndex > index);
    const previousWordIndex = Number.isInteger(previousTokenIndex) ? matchByToken.get(previousTokenIndex) : null;
    const nextWordIndex = Number.isInteger(nextTokenIndex) ? matchByToken.get(nextTokenIndex) : null;
    const segmentStart = Number.isInteger(previousWordIndex) ? words[previousWordIndex].end : lineStart;
    const segmentEnd = Number.isInteger(nextWordIndex) ? words[nextWordIndex].start : lineEnd;
    const segmentTokenStart = Number.isInteger(previousTokenIndex) ? previousTokenIndex + 1 : 0;
    const segmentTokenEnd = Number.isInteger(nextTokenIndex) ? nextTokenIndex - 1 : tokens.length - 1;
    const segmentCount = Math.max(1, segmentTokenEnd - segmentTokenStart + 1);
    const offset = index - segmentTokenStart;
    const duration = Math.max(0.18 * segmentCount, segmentEnd - segmentStart);
    const start = segmentStart + (duration / segmentCount) * offset;
    const end = offset === segmentCount - 1 ? segmentEnd : segmentStart + (duration / segmentCount) * (offset + 1);

    return {
      text: token,
      index,
      start,
      end: end > start ? end : start + 0.18,
      alignmentConfidence: roundConfidence(confidence),
    };
  });

  return ensureTimedTokenOrder(timed, lineStart, lineEnd).map((token) => ({
    ...token,
    alignmentConfidence: roundConfidence(confidence),
  }));
}

function longestCommonWordMatches(left, right) {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = left.length - 1; i >= 0; i--) {
    for (let j = right.length - 1; j >= 0; j--) {
      dp[i][j] = left[i] && left[i] === right[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const matches = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] && left[i] === right[j]) {
      matches.push({ tokenIndex: i, wordIndex: j });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return matches;
}

function interpolateTimedTokens(tokens, lineStart, lineEnd) {
  const duration = Math.max(0.4, lineEnd - lineStart);
  return tokens.map((token, index) => {
    const start = lineStart + (duration / tokens.length) * index;
    const end = index === tokens.length - 1 ? lineEnd : lineStart + (duration / tokens.length) * (index + 1);
    return { text: token, index, start, end };
  });
}

function ensureTimedTokenOrder(tokens, lineStart, lineEnd) {
  const safeStart = roundTime(lineStart);
  const safeEnd = roundTime(lineEnd > lineStart ? lineEnd : lineStart + 1);
  let previousEnd = safeStart;

  return tokens.map((token, index) => {
    const fallback = interpolateTokenTime(index, tokens.length, safeStart, safeEnd);
    let start = Number.isFinite(token.start) ? Math.max(safeStart, Math.min(safeEnd, token.start)) : fallback.start;
    let end = Number.isFinite(token.end) ? Math.max(safeStart, Math.min(safeEnd, token.end)) : fallback.end;

    if (start < previousEnd - 0.05) start = fallback.start;
    if (start < previousEnd) start = Math.min(safeEnd, previousEnd);
    if (end <= start) end = fallback.end > start ? fallback.end : start + 0.18;
    end = Math.min(safeEnd, end);
    previousEnd = end;

    return {
      ...token,
      text: token.text,
      index: Number.isInteger(token.index) ? token.index : index,
      start: roundTime(start),
      end: roundTime(end),
    };
  });
}

function interpolateTokenTime(index, count, lineStart, lineEnd) {
  const duration = Math.max(0.4, lineEnd - lineStart);
  const start = lineStart + (duration / count) * index;
  const end = index === count - 1 ? lineEnd : lineStart + (duration / count) * (index + 1);
  return { start, end };
}

function groupTimedTokensForProsody(line, tokens, energy, syntaxProfile = null, options = {}) {
  if (tokens.length <= 1) return [tokens];

  const alignedTokens = alignTimedTokensToAudio(line, tokens, energy);
  const targetSyllables = targetSyllablesForGrade(options.grade);

  const boundaries = selectProsodyBoundaries(line, alignedTokens, energy, syntaxProfile, options);

  let groups;
  if (boundaries.length === 0) {
    groups = [alignedTokens];
  } else {
    groups = [];
    let start = 0;
    for (const boundary of boundaries) {
      groups.push(alignedTokens.slice(start, boundary + 1));
      start = boundary + 1;
    }
    groups.push(alignedTokens.slice(start));
    groups = groups.filter((group) => group.length > 0);
  }

  // Verb-balancing pass: force a split inside any group still over the syllable
  // budget. The boundary scorer keeps long clauses together (subject-predicate,
  // copula-complement and NP-internal gaps all get high noBreakScore), so without
  // this pass a 15-syllable clause stays one unbroken chunk. Here length pressure
  // overrides the tight-veto at genuine syntactic seams, while det+noun /
  // prep+object / to+infinitive stay protected (isHardTightGap).
  groups = splitOverBudgetGroups(groups, syntaxProfile, targetSyllables);
  return groups.filter((group) => group.length > 0);
}

const OVER_BUDGET_MARGIN = Number(process.env.RHYTHM_OVER_BUDGET_MARGIN ?? 2);
const HARD_TIGHT_NOBREAK = Number(process.env.RHYTHM_HARD_TIGHT_NOBREAK ?? 6.8);
const MAX_BALANCE_SPLIT_DEPTH = 4;
const DP_BREAK_COST = Number(process.env.RHYTHM_DP_BREAK_COST ?? 2.5);
const MIN_SPLIT_SCORE = Number(process.env.RHYTHM_MIN_SPLIT_SCORE ?? 0.5);

function groupSyllables(group) {
  return group.reduce((sum, token) => sum + estimateSyllables(token.text), 0);
}

function splitOverBudgetGroups(groups, syntaxProfile, targetSyllables) {
  const output = [];
  for (const group of groups) {
    output.push(...splitGroupToBudget(group, syntaxProfile, targetSyllables, 0));
  }
  return output;
}

function splitGroupToBudget(group, syntaxProfile, targetSyllables, depth) {
  if (depth >= MAX_BALANCE_SPLIT_DEPTH || group.length < 4) return [group];
  if (groupSyllables(group) <= targetSyllables + OVER_BUDGET_MARGIN) return [group];

  const splitIndex = bestBalancedSplit(group, syntaxProfile);
  if (splitIndex === null) return [group];

  const left = group.slice(0, splitIndex + 1);
  const right = group.slice(splitIndex + 1);
  if (left.length === 0 || right.length === 0) return [group];

  return [
    ...splitGroupToBudget(left, syntaxProfile, targetSyllables, depth + 1),
    ...splitGroupToBudget(right, syntaxProfile, targetSyllables, depth + 1),
  ];
}

// Pick the best place to cut an over-budget group: the Gee & Grosjean / Bachenko-
// Fitzpatrick length-balancing idea (equalize syllables on both sides) plus a
// seam-quality bonus that REWARDS the syntactic seams a long clause should break
// at (clause edge, subject|predicate, copula|complement, coordination) and avoids
// the tight bigrams that must never split.
function bestBalancedSplit(group, syntaxProfile) {
  const total = groupSyllables(group);
  let best = null;

  for (let i = 0; i < group.length - 1; i++) {
    const leftLen = i + 1;
    const rightLen = group.length - leftLen;
    if (leftLen < 2 || rightLen < 2) continue;
    const feature = syntaxBoundaryFeature(group, i, syntaxProfile);
    if (isHardTightGap(feature)) continue;
    const leftSyl = groupSyllables(group.slice(0, i + 1));
    const balance = -Math.abs(leftSyl - (total - leftSyl)) * 0.5;
    const score = balance + seamBonusForSplit(feature, group, i);
    if (!best || score > best.score) best = { score, index: i };
  }

  // Only force a split when a reasonably good seam exists. Better to leave a
  // chunk slightly over budget than to cut a tight unit (e.g. "very tiny /
  // organism") just to satisfy the syllable target.
  if (best && best.score >= MIN_SPLIT_SCORE) return best.index;
  return null;
}

function isHardTightGap(feature) {
  if (!feature) return false;
  if (Number(feature.noBreakScore ?? 0) >= HARD_TIGHT_NOBREAK) return true;
  return (feature.sources ?? []).includes("infinitive-marker");
}

function seamBonusForSplit(feature, group, index) {
  if (!feature) {
    const previousCore = wordCore(group[index].text);
    const nextCore = wordCore(group[index + 1].text);
    let bonus = 0;
    if (BOUNDARY_BEFORE_WORDS.has(nextCore)) bonus += 4;
    if (BOUNDARY_AFTER_WORDS.has(previousCore)) bonus += 1.2;
    if (NO_BREAK_AFTER_WORDS.has(previousCore)) bonus -= 4;
    if (NO_BREAK_BEFORE_WORDS.has(nextCore)) bonus -= 3;
    return bonus;
  }

  const sources = feature.sources ?? [];
  let bonus = Number(feature.breakScore ?? 0) - Number(feature.noBreakScore ?? 0) * 0.4;
  if (isClauseSyntaxFeature(feature)) bonus += 6;
  if (sources.includes("clause-starter") || sources.includes("conjunction")) bonus += 4;
  if (sources.includes("subject-predicate")) bonus += 7; // override the tight-veto for long subjects
  if (sources.includes("copula-complement")) bonus += 4.5;
  return bonus;
}

function hasUsableAudioEnergy(energy) {
  return Array.isArray(energy?.frames) && energy.frames.length > 0 && Number.isFinite(energy.frameSeconds);
}

function alignTimedTokensToAudio(line, tokens, energy) {
  if (!hasUsableAudioEnergy(energy)) return tokens;

  const lineFrames = framesInRange(energy, line.start, line.end);
  if (lineFrames.length === 0) return tokens;

  const frameSeconds = energy.frameSeconds || AUDIO_FRAME_MS / 1000;
  const dbValues = lineFrames.map((frame) => frame.db);
  const speechDb = percentile(dbValues, 0.64) ?? -28;
  const floorDb = percentile(dbValues, 0.18) ?? speechDb - 12;
  const voicedThreshold = Math.max(floorDb + 3, speechDb - AUDIO_DB_DROP);

  const aligned = tokens.map((token) => {
    if (Number(token.alignmentConfidence ?? 1) < 0.6) return token;
    const windowStart = Math.max(line.start, token.start - 0.08);
    const windowEnd = Math.min(line.end, token.end + 0.1);
    const frames = framesInRange(energy, windowStart, windowEnd);
    const voiced = frames.filter((frame) => frame.db >= voicedThreshold);
    if (voiced.length < 2) return token;

    const first = voiced[0];
    const last = voiced[voiced.length - 1];
    const start = clampTime(first.time - frameSeconds / 2, line.start, line.end);
    const end = clampTime(last.time + frameSeconds / 2, start + 0.08, line.end);
    return {
      ...token,
      start: roundTime(start),
      end: roundTime(end),
    };
  });

  return ensureTimedTokenOrder(aligned, line.start, line.end);
}

function clampTime(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function selectProsodyBoundaries(line, tokens, energy, syntaxProfile = null, options = {}) {
  const count = tokens.length;
  const targetSyllables = targetSyllablesForGrade(options.grade);
  const maxChunkWords = count <= 9 ? 5 : Math.max(6, Math.ceil(targetSyllables / 1.25));
  const minChunkWords = count <= 3 ? 1 : count <= 12 ? 2 : 3;
  const totalSyllables = tokens.reduce((sum, token) => sum + estimateSyllables(token.text), 0);
  const boundaryScores = tokens
    .slice(0, -1)
    .map((_, index) => scoreProsodyBoundary(line, tokens, index, energy, syntaxProfile));
  const strongestBoundary = Math.max(...boundaryScores);
  const needsSplit = count > maxChunkWords || totalSyllables > targetSyllables + 1 || strongestBoundary >= 5;
  const minGroups = needsSplit
    ? Math.max(2, Math.ceil(count / (maxChunkWords + 2)), Math.ceil(totalSyllables / (targetSyllables + 3)))
    : 1;
  const maxGroups = needsSplit ? Math.max(minGroups, Math.ceil(count / minChunkWords)) : 1;
  const memo = new Map();

  const solve = (position, groupsLeft) => {
    const key = `${position}:${groupsLeft}`;
    if (memo.has(key)) return memo.get(key);
    const remaining = count - position;

    if (groupsLeft === 1) {
      if (remaining <= 0) return null;
      const score = chunkShapeScore(tokens, position, count - 1, targetSyllables, maxChunkWords);
      const result = { score, boundaries: [] };
      memo.set(key, result);
      return result;
    }

    let best = null;
    const minEnd = position + minChunkWords - 1;
    const maxEnd = count - (groupsLeft - 1) * minChunkWords - 1;
    for (let boundary = minEnd; boundary <= maxEnd; boundary++) {
      const next = solve(boundary + 1, groupsLeft - 1);
      if (!next) continue;
      // DP_BREAK_COST makes each cut "pay for itself": the DP only places a
      // boundary where a real seam (clause edge, comma, coordination) clears the
      // cost. Weak verb->object seams ("gives / us light") no longer get cut just
      // to balance length; genuinely over-long chunks are handled afterwards by
      // splitOverBudgetGroups (verb balancing).
      const score =
        chunkShapeScore(tokens, position, boundary, targetSyllables, maxChunkWords) +
        boundaryScores[boundary] -
        DP_BREAK_COST +
        next.score;
      if (!best || score > best.score) {
        best = { score, boundaries: [boundary, ...next.boundaries] };
      }
    }

    memo.set(key, best);
    return best;
  };

  let best = null;
  for (let groups = minGroups; groups <= maxGroups; groups++) {
    const candidate = solve(0, groups);
    if (!candidate) continue;
    if (!best || candidate.score > best.score) best = { ...candidate };
  }

  if (!best) {
    console.warn(`Prosody DP produced no partition for ${line.id}; using strongest boundaries fallback.`);
    return fallbackProsodyBoundaries(tokens, boundaryScores, minGroups);
  }
  if (best.boundaries.length === 0) return [];
  if (count <= 2 && strongestBoundary < 1.5) return [];
  return best.boundaries;
}

function chunkShapeScore(tokens, start, end, targetSyllables, maxChunkWords) {
  const length = end - start + 1;
  const syllables = tokens.slice(start, end + 1).reduce((sum, token) => sum + estimateSyllables(token.text), 0);
  let score = 6 - Math.abs(syllables - targetSyllables) * 0.45 - Math.abs(length - 4.6) * 0.45;
  if (length <= 1) score -= 8;
  if (length > maxChunkWords) score -= (length - maxChunkWords) * 1.15;
  if (syllables > targetSyllables + 5) score -= (syllables - targetSyllables - 5) * 0.7;
  return score;
}

function fallbackProsodyBoundaries(tokens, boundaryScores, minGroups) {
  const needed = Math.max(1, Math.min(tokens.length - 1, minGroups - 1));
  return boundaryScores
    .map((score, index) => ({ score, index }))
    .sort((a, b) => b.score - a.score)
    .slice(0, needed)
    .map((entry) => entry.index)
    .sort((a, b) => a - b);
}

function targetSyllablesForGrade(grade) {
  const safeGrade = normalizeGrade(grade);
  if (safeGrade <= 5) return 10;
  if (safeGrade >= 8) return 7;
  return 8.5;
}

function estimateSyllables(text) {
  const core = wordCore(text).replace(/(?:e|es|ed)$/i, "");
  if (!core) return 1;
  const groups = core.match(/[aeiouy]+/g);
  return Math.max(1, groups?.length ?? 1);
}

function scoreProsodyBoundary(line, tokens, index, energy, syntaxProfile = null) {
  const previous = tokens[index];
  const next = tokens[index + 1];
  const previousCore = wordCore(previous.text);
  const nextCore = wordCore(next.text);
  const previousPreviousCore = index > 0 ? wordCore(tokens[index - 1].text) : "";
  const nextNextCore = index + 2 < tokens.length ? wordCore(tokens[index + 2].text) : "";
  const nextNextNextCore = index + 3 < tokens.length ? wordCore(tokens[index + 3].text) : "";
  const syntaxFeature = syntaxBoundaryFeature(tokens, index, syntaxProfile);
  const hasSyntax = Boolean(syntaxProfile);
  const alignmentConfidence = Math.min(
    Number(previous.alignmentConfidence ?? 1),
    Number(next.alignmentConfidence ?? 1),
  );
  let score = 0;

  if (/[.!?]$/.test(previous.text)) score += 7;
  else if (/[,;:]$/.test(previous.text)) score += 5;
  else if (/[)]$/.test(previous.text)) score += 1.2;

  score += silenceBoundaryScore(line, previous, next, energy, alignmentConfidence);

  if (syntaxFeature) {
    score += syntaxFeature.breakScore * 1.6;
    score -= syntaxFeature.noBreakScore * 1.8;
    if (syntaxFeature.clean) score += 1.1;
    if (syntaxFeature.tight) score -= 3.2;
    if (isClauseSyntaxFeature(syntaxFeature)) score += 1.6;
    else if (isPhraseSyntaxFeature(syntaxFeature)) score += 0.55;
  } else if (!hasSyntax) {
    const tightPenalty = syntaxTightPenalty(previousCore, nextCore, previousPreviousCore, nextNextCore, nextNextNextCore);
    if (INTRO_WORDS.has(previousCore)) score += 1.4;
    if (BOUNDARY_BEFORE_WORDS.has(nextCore)) score += 1.8;
    if (BOUNDARY_AFTER_WORDS.has(previousCore)) score += 1.2;
    if (NO_BREAK_AFTER_WORDS.has(previousCore)) score -= 2.2;
    if (NO_BREAK_BEFORE_WORDS.has(nextCore)) score -= 1.8;
    score -= tightPenalty;
  }

  const leftLength = index + 1;
  const rightLength = tokens.length - leftLength;
  if (leftLength < 2 || rightLength < 2) score -= 5;
  return score;
}

function silenceBoundaryScore(line, previous, next, energy, alignmentConfidence = 1) {
  if (alignmentConfidence < 0.6) return 0;
  const gap = Math.max(0, next.start - previous.end);
  let score = Math.min(2.2, (gap / 0.6) * 2.2);
  if (hasUsableAudioEnergy(energy)) {
    score += Math.min(0.8, audioDipScore(line, previous.end, next.start, energy) / 4);
  }
  return Math.min(3, score);
}

function syntaxBoundaryFeature(tokens, index, syntaxProfile) {
  if (!syntaxProfile?.boundaries) return null;
  const originalIndex = Number.isInteger(tokens[index]?.index) ? tokens[index].index : index;
  return syntaxProfile.boundaries.get(originalIndex) ?? null;
}

function isClauseSyntaxFeature(feature) {
  return Boolean(feature?.labels?.some((label) => ["S", "SBAR", "SBARQ", "SINV", "SQ"].includes(label)));
}

function isMajorClauseSyntaxFeature(feature) {
  return isClauseSyntaxFeature(feature) && Number(feature?.breakScore ?? 0) >= 2.8;
}

function isPhraseSyntaxFeature(feature) {
  return Boolean(feature?.labels?.some((label) => ["NP", "VP", "PP", "ADJP", "ADVP", "WHNP", "WHADVP"].includes(label)));
}

function audioDipScore(line, start, end, energy) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  const frames = framesInRange(energy, Math.max(line.start, start - 0.02), Math.min(line.end, end + 0.02));
  if (frames.length === 0) return 0;

  const lineFrames = framesInRange(energy, line.start, line.end);
  const localDb = percentile(lineFrames.map((frame) => frame.db), 0.65) ?? -28;
  const minDb = Math.min(...frames.map((frame) => frame.db));
  const lowDuration = frames.filter((frame) => frame.db <= localDb - AUDIO_DB_DROP).length * energy.frameSeconds;

  let score = 0;
  if (minDb <= localDb - 5) score += 1.4;
  if (lowDuration >= 0.04) score += 1.4;
  if (lowDuration >= AUDIO_LOW_DURATION_SECONDS) score += 1.2;
  return score;
}

function buildRhythmChunksFromTimedGroups(line, groups, energy, syntaxProfile = null) {
  const chunks = groups.map((group) => {
    const start = Math.max(line.start, group[0].start);
    const end = Math.min(line.end, group[group.length - 1].end);
    return {
      text: normalizeCaptionText(group.map((token) => token.text).join(" ")),
      start: roundTime(start),
      end: roundTime(end > start ? end : start + 0.35),
    };
  });

  for (let i = 0; i < chunks.length - 1; i++) {
    const boundaryAfter = buildBoundaryAfter(line, groups[i], groups[i + 1], energy, syntaxProfile);
    if (boundaryAfter) chunks[i].boundaryAfter = boundaryAfter;
  }

  return normalizeRhythmChunks(chunks, line.start, line.end) ?? [];
}

function buildBoundaryAfter(line, currentGroup, nextGroup, energy, syntaxProfile = null) {
  if (!Array.isArray(currentGroup) || !Array.isArray(nextGroup) || currentGroup.length === 0 || nextGroup.length === 0) {
    return null;
  }

  const previous = currentGroup[currentGroup.length - 1];
  const next = nextGroup[0];
  const previousCore = wordCore(previous.text);
  const nextCore = wordCore(next.text);
  const gapSeconds = Math.max(0, next.start - previous.end);
  const pauseMs = Math.round(gapSeconds * 1000);
  const audioScore = hasUsableAudioEnergy(energy) ? audioDipScore(line, previous.end, next.start, energy) : 0;
  const punctuationType = /[.!?]$/.test(previous.text) ? "major" : /[,;:]$/.test(previous.text) ? "minor" : null;
  const syntaxFeature = syntaxBoundaryFeature(currentGroup, currentGroup.length - 1, syntaxProfile);
  const syntax = assessSyntaxBoundary(previousCore, nextCore, currentGroup, nextGroup, syntaxFeature);
  const boundaryScore = scoreProsodyBoundary(
    line,
    [...currentGroup, ...nextGroup],
    currentGroup.length - 1,
    energy,
    syntaxProfile,
  );
  const alignmentConfidence = Math.min(
    Number(previous.alignmentConfidence ?? 1),
    Number(next.alignmentConfidence ?? 1),
  );
  const sources = new Set();

  if (pauseMs >= 150) sources.add("silence");
  if (punctuationType) sources.add("punctuation");
  if (syntax.clean) sources.add("syntax");
  if (currentGroup.length >= 6 || nextGroup.length >= 6) sources.add("length");
  if (audioScore >= 1.2) sources.add("audio");

  let type = punctuationType === "major" || syntax.majorClause ? "major" : "minor";
  if (type === "minor" && pauseMs >= 650 && syntax.clean && !syntax.tight && boundaryScore >= 4.5) {
    type = "major";
  }

  let confidence = 1 / (1 + Math.exp(-(boundaryScore - 2.2) / 2.1));
  if (punctuationType === "major") confidence += 0.14;
  else if (punctuationType === "minor") confidence += 0.08;
  if (syntax.clean) confidence += 0.12;
  if (syntax.majorClause) confidence += 0.08;
  if (pauseMs >= 370 && audioScore >= 1.2) confidence += 0.08;
  if (alignmentConfidence < 0.6) confidence -= 0.16;
  if (syntax.tight) confidence -= 0.28;
  if (currentGroup.length === 1 || nextGroup.length === 1) confidence -= 0.08;

  return {
    type,
    pauseMs,
    confidence: roundConfidence(confidence),
    sources: [...sources],
  };
}

function assessSyntaxBoundary(previousCore, nextCore, currentGroup, nextGroup, syntaxFeature = null) {
  const previousPreviousCore = currentGroup.length >= 2 ? wordCore(currentGroup[currentGroup.length - 2].text) : "";
  const nextNextCore = nextGroup.length >= 2 ? wordCore(nextGroup[1].text) : "";
  const nextNextNextCore = nextGroup.length >= 3 ? wordCore(nextGroup[2].text) : "";
  const hasParserFeature = Boolean(syntaxFeature);
  const manualTight = !hasParserFeature && syntaxTightPenalty(previousCore, nextCore, previousPreviousCore, nextNextCore, nextNextNextCore) >= 2.5;
  const parserTight =
    Boolean(syntaxFeature?.tight) ||
    (Number(syntaxFeature?.noBreakScore ?? 0) >= 4.5 &&
      Number(syntaxFeature?.noBreakScore ?? 0) > Number(syntaxFeature?.breakScore ?? 0) + 0.8);
  const tight = manualTight || parserTight;
  const parserClean =
    Boolean(syntaxFeature?.clean) ||
    (Number(syntaxFeature?.breakScore ?? 0) >= 1.2 && !parserTight);
  const clauseBoundary =
    isClauseSyntaxFeature(syntaxFeature) ||
    (!hasParserFeature &&
      (BOUNDARY_BEFORE_WORDS.has(nextCore) ||
        BOUNDARY_AFTER_WORDS.has(previousCore) ||
        INTRO_WORDS.has(previousCore)));
  const balancedLength = currentGroup.length >= 2 && nextGroup.length >= 2;
  return {
    tight,
    clause: clauseBoundary,
    majorClause: isMajorClauseSyntaxFeature(syntaxFeature),
    clean: !tight && (parserClean || clauseBoundary || balancedLength),
  };
}

function syntaxTightPenalty(previousCore, nextCore, previousPreviousCore = "", nextNextCore = "", nextNextNextCore = "") {
  let penalty = 0;
  if (DETERMINER_WORDS.has(previousCore)) penalty += 3.2;
  if (PREPOSITION_WORDS.has(previousCore)) penalty += 2.8;
  if (AUXILIARY_WORDS.has(previousCore)) penalty += 3;
  if (previousCore === "to" && !isLikelyInfinitiveVerb(nextCore)) penalty += 3.4;
  if (isProtectedToInfinitiveBoundary(previousCore, nextCore, nextNextCore, previousPreviousCore, nextNextNextCore)) penalty += 7.5;
  if (NO_BREAK_AFTER_WORDS.has(previousCore)) penalty += 1.4;
  if (NO_BREAK_BEFORE_WORDS.has(nextCore)) penalty += 1.2;
  if (nextCore === "n't" || nextCore === "not") penalty += 2.2;
  return penalty;
}

function isProtectedToInfinitiveBoundary(previousCore, nextCore, nextNextCore, previousPreviousCore = "", nextNextNextCore = "") {
  const headCore = infinitiveHeadCore(nextNextCore, nextNextNextCore);
  if (nextCore !== "to" || !isLikelyInfinitiveVerb(headCore)) return false;
  return INFINITIVE_LEFT_TRIGGERS.has(previousCore) || INFINITIVE_LEFT_TRIGGERS.has(previousPreviousCore);
}

function infinitiveHeadCore(firstCore, secondCore = "") {
  return TO_INFINITIVE_SKIP_WORDS.has(firstCore) ? secondCore : firstCore;
}

function isLikelyInfinitiveVerb(core) {
  if (!core || !/^[a-z][a-z']*$/.test(core)) return false;
  if (core === "be" || core === "do" || core === "have") return true;
  return !TO_OBJECT_STARTERS.has(core);
}

function roundConfidence(value) {
  return Math.max(0.05, Math.min(0.98, Math.round(value * 100) / 100));
}

const INTRO_WORDS = new Set(["well", "so", "now", "actually", "okay", "ok", "sorry"]);
const BOUNDARY_BEFORE_WORDS = new Set([
  "and",
  "but",
  "because",
  "before",
  "after",
  "when",
  "while",
  "where",
  "which",
  "who",
  "that",
  "if",
  "so",
]);
const BOUNDARY_AFTER_WORDS = new Set(["then", "therefore", "however", "instead", "right"]);
const DETERMINER_WORDS = new Set(["a", "an", "the", "this", "that", "these", "those", "my", "your", "our", "their", "his", "her", "its"]);
const PREPOSITION_WORDS = new Set(["of", "in", "on", "at", "for", "with", "from", "by", "about", "into", "over", "under", "through", "between", "among"]);
const AUXILIARY_WORDS = new Set(["am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "can", "could", "should", "would", "will", "may", "might", "must"]);
const INFINITIVE_LEFT_TRIGGERS = new Set([
  "able",
  "about",
  "afford",
  "affords",
  "afforded",
  "aim",
  "aims",
  "aimed",
  "allow",
  "allows",
  "allowed",
  "attempt",
  "attempts",
  "attempted",
  "attempting",
  "begin",
  "begins",
  "began",
  "begun",
  "choose",
  "chooses",
  "chose",
  "decide",
  "decides",
  "decided",
  "enough",
  "expect",
  "expects",
  "expected",
  "fail",
  "fails",
  "failed",
  "going",
  "had",
  "has",
  "have",
  "help",
  "helps",
  "helped",
  "hope",
  "hopes",
  "hoped",
  "how",
  "learn",
  "learns",
  "learned",
  "learning",
  "like",
  "likes",
  "liked",
  "love",
  "loves",
  "loved",
  "need",
  "needs",
  "needed",
  "order",
  "plan",
  "plans",
  "planned",
  "promise",
  "promises",
  "promised",
  "ready",
  "refuse",
  "refuses",
  "refused",
  "seem",
  "seems",
  "seemed",
  "start",
  "starts",
  "started",
  "supposed",
  "tend",
  "tends",
  "tended",
  "time",
  "try",
  "tries",
  "tried",
  "trying",
  "used",
  "want",
  "wants",
  "wanted",
  "way",
  "wish",
  "wishes",
  "wished",
]);
const TO_OBJECT_STARTERS = new Set([
  ...DETERMINER_WORDS,
  ...PREPOSITION_WORDS,
  ...BOUNDARY_BEFORE_WORDS,
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "not",
  "n't",
  "too",
  "very",
  "more",
  "most",
]);
const TO_INFINITIVE_SKIP_WORDS = new Set(["not", "never", "just", "really", "quickly", "slowly"]);
const NO_BREAK_AFTER_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "but",
  "or",
  "of",
  "in",
  "on",
  "at",
  "for",
  "with",
  "from",
  "by",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "can",
  "could",
  "should",
  "would",
  "will",
  "may",
  "might",
  "must",
  "not",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "too",
  "very",
  "just",
  "your",
  "my",
  "our",
  "their",
  "his",
  "her",
  "its",
]);
const NO_BREAK_BEFORE_WORDS = new Set([
  "'s",
  "s",
  "n't",
  "not",
  "too",
  "very",
  "more",
  "most",
  "am",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "can",
  "could",
  "should",
  "would",
  "will",
  "may",
  "might",
  "must",
]);

function wordCore(text) {
  return normalizeCaptionText(text)
    .toLowerCase()
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
}

function framesInRange(energy, start, end) {
  if (!Array.isArray(energy?.frames) || end <= start) return [];
  return energy.frames.filter((frame) => frame.time >= start && frame.time <= end);
}

function percentile(values, percentileValue) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * percentileValue)));
  return sorted[index];
}

function stripRhythmChunks(lines) {
  return lines.map((line) => {
    const clean = { ...line };
    delete clean.rhythmChunks;
    return clean;
  });
}

function buildLineWordTimings(lines) {
  const words = [];
  for (const line of lines) {
    const tokens = tokenizeForChunks(line.text);
    if (tokens.length === 0) continue;
    const duration = Math.max(0.35, line.end - line.start);
    tokens.forEach((token, index) => {
      const start = line.start + (duration / tokens.length) * index;
      const end = index === tokens.length - 1 ? line.end : line.start + (duration / tokens.length) * (index + 1);
      words.push({
        text: token,
        start: roundTime(start),
        end: roundTime(end > start ? end : start + 0.18),
      });
    });
  }
  return words;
}

function pushWordPieces(words, text, start, end) {
  const pieces = normalizeCaptionText(text)
    .split(/\s+/)
    .map((piece) => piece.trim())
    .filter(Boolean);
  if (pieces.length === 0) return;

  const duration = Math.max(0.12, end - start);
  pieces.forEach((piece, index) => {
    const pieceStart = start + (duration / pieces.length) * index;
    const pieceEnd = index === pieces.length - 1 ? end : start + (duration / pieces.length) * (index + 1);
    words.push({ text: piece, start: pieceStart, end: pieceEnd });
  });
}

function tokenizeForChunks(text) {
  return normalizeCaptionText(text).match(/\S+/g) ?? [];
}

function compactCaptionEvents(events) {
  const lines = [];
  let start = 0;
  let end = 0;
  let text = "";
  let rhythmChunks = [];

  const flush = () => {
    const clean = normalizeCaptionText(text);
    if (clean) {
      const safeEnd = end > start ? end : start + 2;
      const normalizedChunks = normalizeRhythmChunks(rhythmChunks, start, safeEnd);
      lines.push({
        id: `line-${String(lines.length + 1).padStart(3, "0")}`,
        start: roundTime(start),
        end: roundTime(safeEnd),
        text: clean,
        ...(normalizedChunks ? { rhythmChunks: normalizedChunks } : {}),
      });
    }
    start = 0;
    end = 0;
    text = "";
    rhythmChunks = [];
  };

  for (const event of events) {
    const rawText = Array.isArray(event.segs)
      ? event.segs.map((segment) => segment.utf8 ?? "").join("")
      : "";
    const chunk = normalizeCaptionText(rawText);
    if (!chunk || isNoiseCaption(chunk)) continue;

    const eventStart = Number(event.tStartMs ?? 0) / 1000;
    const eventEnd = eventStart + Math.max(Number(event.dDurationMs ?? 1200) / 1000, 0.8);

    if (!text) start = eventStart;
    text = joinCaptionText(text, chunk);
    end = eventEnd;
    rhythmChunks.push({
      text: chunk,
      start: roundTime(eventStart),
      end: roundTime(eventEnd > eventStart ? eventEnd : eventStart + 0.8),
    });

    const duration = end - start;
    const words = text.split(/\s+/).filter(Boolean).length;
    if (/[.!?]$/.test(chunk) || duration >= 8 || words >= 14) {
      flush();
    }
  }

  if (text) flush();
  return mergeShortLines(lines);
}

function parseWebVtt(vtt) {
  const lines = [];
  const rows = vtt.replace(/\r/g, "").split("\n");

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.includes("-->")) continue;

    const [startRaw, endRaw] = row.split("-->").map((part) => part.trim().split(/\s+/)[0]);
    const start = parseVttTime(startRaw);
    const end = parseVttTime(endRaw);
    const textRows = [];

    i++;
    while (i < rows.length && rows[i].trim()) {
      textRows.push(rows[i]);
      i++;
    }

    const text = normalizeCaptionText(
      textRows
        .join(" ")
        .replace(/<[^>]+>/g, "")
        .replace(/\{\\an\d\}/g, ""),
    );
    if (!text || isNoiseCaption(text)) continue;
    lines.push({
      id: `line-${String(lines.length + 1).padStart(3, "0")}`,
      start: roundTime(start),
      end: roundTime(end > start ? end : start + 2),
      text,
      rhythmChunks: [
        {
          text,
          start: roundTime(start),
          end: roundTime(end > start ? end : start + 2),
        },
      ],
    });
  }

  return mergeShortLines(lines);
}

function mergeShortLines(input) {
  const merged = [];
  let current = null;

  const flush = () => {
    if (!current) return;
    const line = { ...current };
    delete line.rhythmChunks;
    const rhythmChunks = normalizeRhythmChunks(current.rhythmChunks, current.start, current.end);
    merged.push({
      ...line,
      id: `line-${String(merged.length + 1).padStart(3, "0")}`,
      text: normalizeCaptionText(current.text),
      ...(rhythmChunks ? { rhythmChunks } : {}),
    });
    current = null;
  };

  for (const line of input) {
    if (!current) {
      current = { ...line };
    } else if (shouldMerge(current, line)) {
      current.rhythmChunks = [...rhythmChunksForLine(current), ...rhythmChunksForLine(line)];
      current.end = line.end;
      current.text = joinCaptionText(current.text, line.text);
    } else {
      flush();
      current = { ...line };
    }

    const duration = current.end - current.start;
    const words = current.text.split(/\s+/).filter(Boolean).length;
    if (/[.!?]$/.test(line.text) || duration >= 8 || words >= 14) {
      flush();
    }
  }
  flush();
  return merged;
}

function rhythmChunksForLine(line) {
  return normalizeRhythmChunks(line.rhythmChunks, line.start, line.end) ?? [
    {
      text: normalizeCaptionText(line.text),
      start: roundTime(line.start),
      end: roundTime(line.end > line.start ? line.end : line.start + 2),
    },
  ];
}

function normalizeRhythmChunks(input, lineStart, lineEnd) {
  if (!Array.isArray(input)) return undefined;
  const normalized = input
    .map((chunk) => {
      if (!chunk || typeof chunk !== "object") return null;
      const text = normalizeCaptionText(chunk.text ?? "");
      const start = roundTime(chunk.start);
      const end = roundTime(chunk.end);
      if (!text || !Number.isFinite(start) || !Number.isFinite(end)) return null;
      const safeStart = Math.max(roundTime(lineStart), start);
      const targetEnd = end > safeStart + 0.28 ? end : safeStart + 0.35;
      const safeEnd = Math.min(roundTime(lineEnd), targetEnd);
      if (safeEnd <= safeStart) return null;
      const boundaryAfter = normalizeBoundaryAfter(chunk.boundaryAfter);
      return { text, start: safeStart, end: safeEnd, ...(boundaryAfter ? { boundaryAfter } : {}) };
    })
    .filter(Boolean);

  return normalized.length > 1 ? normalized : undefined;
}

function normalizeBoundaryAfter(input) {
  if (!input || typeof input !== "object") return undefined;
  const type = input.type === "major" ? "major" : input.type === "minor" ? "minor" : null;
  if (!type) return undefined;
  const pauseMs = Math.max(0, Math.round(Number(input.pauseMs ?? 0)));
  const confidence = roundConfidence(Number(input.confidence ?? 0.4));
  const allowedSources = new Set(["silence", "punctuation", "syntax", "length", "audio"]);
  const sources = Array.isArray(input.sources)
    ? input.sources.map((source) => String(source)).filter((source) => allowedSources.has(source))
    : [];
  return {
    type,
    pauseMs,
    confidence,
    sources: [...new Set(sources)],
  };
}

function shouldMerge(current, next) {
  const gap = next.start - current.end;
  if (gap > 1.5) return false;
  const duration = next.end - current.start;
  const words = `${current.text} ${next.text}`.split(/\s+/).filter(Boolean).length;
  return duration <= 9 && words <= 16;
}

function parseVttTime(value) {
  const parts = value.split(":");
  if (parts.length === 2) {
    const [mm, ss] = parts;
    return Number(mm) * 60 + Number(ss.replace(",", "."));
  }
  if (parts.length === 3) {
    const [hh, mm, ss] = parts;
    return Number(hh) * 3600 + Number(mm) * 60 + Number(ss.replace(",", "."));
  }
  return 0;
}

function joinCaptionText(current, chunk) {
  if (!current) return chunk;
  if (/^[,.;:!?]/.test(chunk)) return `${current}${chunk}`;
  return `${current} ${chunk}`;
}

function normalizeCaptionText(text) {
  return decodeHtmlEntities(String(text))
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+\.\./g, "..")
    .trim();
}

function decodeHtmlEntities(text) {
  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: "\"",
    apos: "'",
    nbsp: " ",
  };
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity[0] === "#") {
      const isHex = entity[1]?.toLowerCase() === "x";
      const value = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : match;
    }
    return named[entity] ?? match;
  });
}

function isNoiseCaption(text) {
  const lower = text.toLowerCase();
  return (
    /^(\[.*\]|\(.*\))$/.test(lower) ||
    lower === "♪" ||
    lower.includes("[music]") ||
    lower.includes("[applause]")
  );
}

function roundTime(value) {
  return Math.max(0, Math.round(Number(value) * 100) / 100);
}

function normalizeGrade(value) {
  const grade = Number(value ?? DEFAULT_RHYTHM_GRADE);
  if (Number.isInteger(grade) && grade >= 3 && grade <= 10) return grade;
  return DEFAULT_RHYTHM_GRADE;
}

function extractYouTubeVideoId(input) {
  const trimmed = String(input ?? "").trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (url.hostname.includes("youtube.com")) {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery && /^[a-zA-Z0-9_-]{11}$/.test(fromQuery)) return fromQuery;

      const parts = url.pathname.split("/").filter(Boolean);
      const embedIndex = parts.findIndex((part) => part === "embed" || part === "shorts");
      if (embedIndex >= 0) {
        const id = parts[embedIndex + 1];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function summarizeYtDlpError(stderr) {
  const lines = String(stderr)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const errorLine = lines.find((line) => line.startsWith("ERROR:"));
  if (errorLine) return errorLine.replace(/^ERROR:\s*/, "");
  return lines.slice(-2).join(" ");
}

function requireToken(req) {
  if (!TOKEN) return;
  const auth = req.headers.authorization ?? "";
  if (auth !== `Bearer ${TOKEN}`) {
    throw new PublicError("Không có quyền gọi transcript extractor.", 401);
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_BYTES) {
        reject(new PublicError("Request quá lớn.", 413));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new PublicError("Body phải là JSON.", 400));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "authorization,content-type",
  });
  res.end(JSON.stringify(data));
}

async function handleRequest(req, res) {
  const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(res, 200, { ok: true, service: "co-yen-transcript-extractor", ts: Date.now() });
    return;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/transcript") {
    requireToken(req);
    const body = await readJsonBody(req);
    const transcript = await extractTranscript(body.url, { grade: body.grade });
    sendJson(res, 200, transcript);
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}

async function main() {
  if (process.argv[2] === "--extract") {
    const url = process.argv[3];
    const gradeArg = process.argv.find((arg) => arg.startsWith("--grade="));
    const transcript = await extractTranscript(url, { grade: gradeArg ? gradeArg.slice("--grade=".length) : undefined });
    console.log(JSON.stringify(transcript, null, 2));
    return;
  }

  const server = createServer((req, res) => {
    handleRequest(req, res).catch((error) => {
      const status = error instanceof PublicError ? error.status : 500;
      sendJson(res, status, {
        error: error instanceof Error ? error.message : "Internal error",
      });
    });
  });

  server.listen(PORT, HOST, () => {
    console.log(`co-yen-transcript-extractor listening on http://${HOST}:${PORT}`);
  });
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

// Text-only segmentation entry point for offline tests (no audio / WhisperX).
// Given a sentence and the parsed syntax line from syntax-boundaries.py, returns
// the chunked rhythm with `/` (minor) and `//` (major) marks.
export function segmentLineForTest({ text, syntaxLine = null, grade } = {}) {
  const tokens = tokenizeForChunks(text).map((token, index) => ({
    text: token,
    index,
    start: index,
    end: index + 1,
    alignmentConfidence: 0,
  }));
  if (tokens.length === 0) return { marked: "", chunks: [], usedSyntax: false };

  const line = { id: "test", text, start: 0, end: tokens.length };
  const profile = syntaxLine ? normalizeSyntaxProfile(syntaxLine) : null;
  const usableProfile = profile && profile.tokenCount === tokens.length ? profile : null;
  const groups = groupTimedTokensForProsody(line, tokens, null, usableProfile, { grade });
  const chunks = buildRhythmChunksFromTimedGroups(line, groups, null, usableProfile);

  const parts = [];
  chunks.forEach((chunk, index) => {
    parts.push(chunk.text);
    if (index < chunks.length - 1) {
      parts.push(chunk.boundaryAfter?.type === "major" ? "//" : "/");
    }
  });

  return { marked: parts.join(" "), chunks, usedSyntax: Boolean(usableProfile) };
}
