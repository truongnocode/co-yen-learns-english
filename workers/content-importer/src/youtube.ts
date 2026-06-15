import { z } from "zod";
import { generateStructured } from "./gemini";

export interface TranscriptLine {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface YouTubeTranscriptResult {
  videoId: string;
  title: string;
  source: "caption" | "auto_caption" | "gemini";
  languageCode: string;
  lines: TranscriptLine[];
}

interface CaptionTrack {
  baseUrl?: string;
  languageCode?: string;
  name?: { simpleText?: string; runs?: Array<{ text?: string }> };
  kind?: string;
  vssId?: string;
}

interface PlayerResponse {
  videoDetails?: { title?: string; videoId?: string };
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
}

interface TimedTextEvent {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: Array<{ utf8?: string }>;
}

interface TimedTextResponse {
  events?: TimedTextEvent[];
}

const GeminiTranscriptSchema = z.object({
  title: z.string().optional(),
  lines: z
    .array(
      z.object({
        start: z.number().min(0),
        end: z.number().min(0),
        text: z.string().min(1),
      }),
    )
    .min(1),
});

export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
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
      const embedIndex = parts.findIndex((p) => p === "embed" || p === "shorts");
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

export async function fetchYouTubeTranscript(
  urlOrId: string,
  apiKey?: string,
): Promise<YouTubeTranscriptResult> {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) {
    throw new Error("URL YouTube không hợp lệ.");
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const watchUrl = `${canonicalUrl}&hl=en&persist_hl=1`;
  const res = await fetch(watchUrl, {
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    },
  });
  if (!res.ok) {
    throw new Error(`Không tải được trang YouTube (HTTP ${res.status}).`);
  }

  const html = await res.text();
  const playerResponse = extractPlayerResponse(html);
  const title = playerResponse.videoDetails?.title ?? `YouTube ${videoId}`;

  let captionError: Error | null = null;
  try {
    const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    if (tracks.length === 0) {
      throw new Error("Video này không có phụ đề công khai để tạo bài học tự động.");
    }

    const track = pickEnglishTrack(tracks);
    if (!track?.baseUrl) {
      throw new Error("Không tìm thấy phụ đề tiếng Anh công khai trong video này.");
    }

    const lines = await fetchCaptionLines(track.baseUrl);
    if (lines.length === 0) {
      throw new Error("Phụ đề của video này rỗng hoặc chưa đọc được.");
    }

    return {
      videoId,
      title,
      source: track.kind === "asr" ? "auto_caption" : "caption",
      languageCode: track.languageCode ?? "en",
      lines,
    };
  } catch (e) {
    captionError = e as Error;
  }

  if (apiKey) {
    return transcribeYouTubeWithGemini({
      apiKey,
      videoId,
      title,
      url: canonicalUrl,
    });
  }

  throw new Error(
    `${captionError?.message ?? "Không đọc được phụ đề YouTube."} Nếu muốn tự tạo transcript cho video này, cần cấu hình GEMINI_API_KEY trên Worker.`,
  );
}

async function transcribeYouTubeWithGemini(params: {
  apiKey: string;
  videoId: string;
  title: string;
  url: string;
}): Promise<YouTubeTranscriptResult> {
  const { data } = await generateStructured({
    apiKey: params.apiKey,
    schema: GeminiTranscriptSchema,
    systemPrompt:
      "You create short English transcript lines for Vietnamese students learning by memorizing YouTube dialogue. Return only accurate spoken English from the video, split into short teachable lines with timestamps in seconds.",
    parts: [
      {
        fileData: {
          fileUri: params.url,
          mimeType: "video/*",
        },
      },
      {
        text:
          "Transcribe the spoken English in this public YouTube video. Split it into short lines suitable for weak Vietnamese English learners to repeat and memorize. Each line should usually be 3-8 seconds long. Return JSON with title and lines: [{start,end,text}]. Use seconds for timestamps. Omit non-speech noises and music-only captions.",
      },
    ],
    maxRetries: 1,
  });

  const lines = data.lines
    .map((line, index) => ({
      id: `line-${String(index + 1).padStart(3, "0")}`,
      start: roundTime(line.start),
      end: roundTime(line.end > line.start ? line.end : line.start + 2),
      text: normalizeCaptionText(line.text),
    }))
    .filter((line) => line.text && !isNoiseCaption(line.text));

  if (lines.length === 0) {
    throw new Error("Gemini chưa tạo được transcript dùng được cho video này.");
  }

  return {
    videoId: params.videoId,
    title: data.title?.trim() || params.title,
    source: "gemini",
    languageCode: "en",
    lines,
  };
}

async function fetchCaptionLines(baseUrl: string): Promise<TranscriptLine[]> {
  const headers = {
    "accept-language": "en-US,en;q=0.9",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
  };

  const jsonUrl = new URL(baseUrl);
  jsonUrl.searchParams.set("fmt", "json3");
  const jsonRes = await fetch(jsonUrl.toString(), { headers });
  if (jsonRes.ok) {
    const timedText = (await jsonRes.json().catch(() => null)) as TimedTextResponse | null;
    const lines = compactCaptionEvents(timedText?.events ?? []);
    if (lines.length > 0) return lines;
  }

  const vttUrl = new URL(baseUrl);
  vttUrl.searchParams.set("fmt", "vtt");
  const vttRes = await fetch(vttUrl.toString(), { headers });
  if (!vttRes.ok) {
    throw new Error(`Không tải được phụ đề YouTube (HTTP ${vttRes.status}).`);
  }
  return parseWebVtt(await vttRes.text());
}

function pickEnglishTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  const english = tracks.filter((t) => (t.languageCode ?? "").toLowerCase().startsWith("en"));
  const pool = english.length > 0 ? english : tracks;
  return (
    pool.find((t) => t.kind !== "asr") ??
    pool.find((t) => t.vssId?.startsWith(".en")) ??
    pool[0] ??
    null
  );
}

function extractPlayerResponse(html: string): PlayerResponse {
  const marker = "ytInitialPlayerResponse";
  const idx = html.indexOf(marker);
  if (idx < 0) throw new Error("Không đọc được dữ liệu video từ YouTube.");

  const start = html.indexOf("{", idx);
  if (start < 0) throw new Error("Không đọc được dữ liệu video từ YouTube.");

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === "\"") {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        const json = html.slice(start, i + 1);
        return JSON.parse(json) as PlayerResponse;
      }
    }
  }

  throw new Error("Không đọc được dữ liệu video từ YouTube.");
}

function compactCaptionEvents(events: TimedTextEvent[]): TranscriptLine[] {
  const lines: TranscriptLine[] = [];
  let start = 0;
  let end = 0;
  let text = "";

  const flush = () => {
    const clean = normalizeCaptionText(text);
    if (clean) {
      const safeEnd = end > start ? end : start + 2;
      lines.push({
        id: `line-${String(lines.length + 1).padStart(3, "0")}`,
        start: roundTime(start),
        end: roundTime(safeEnd),
        text: clean,
      });
    }
    start = 0;
    end = 0;
    text = "";
  };

  for (const event of events) {
    const raw = event.segs?.map((s) => s.utf8 ?? "").join("") ?? "";
    const chunk = normalizeCaptionText(raw);
    if (!chunk || isNoiseCaption(chunk)) continue;

    const eventStart = (event.tStartMs ?? 0) / 1000;
    const eventEnd = eventStart + Math.max((event.dDurationMs ?? 1200) / 1000, 0.8);

    if (!text) start = eventStart;
    text = joinCaptionText(text, chunk);
    end = eventEnd;

    const duration = end - start;
    const words = text.split(/\s+/).filter(Boolean).length;
    if (/[.!?]$/.test(chunk) || duration >= 8 || words >= 14) {
      flush();
    }
  }

  if (text) flush();
  return lines;
}

function parseWebVtt(vtt: string): TranscriptLine[] {
  const lines: TranscriptLine[] = [];
  const rows = vtt.replace(/\r/g, "").split("\n");

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.includes("-->")) continue;

    const [startRaw, endRaw] = row.split("-->").map((part) => part.trim().split(/\s+/)[0]);
    const start = parseVttTime(startRaw);
    const end = parseVttTime(endRaw);
    const textRows: string[] = [];

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
    });
  }

  return mergeShortLines(lines);
}

function mergeShortLines(input: TranscriptLine[]): TranscriptLine[] {
  const merged: TranscriptLine[] = [];
  let current: TranscriptLine | null = null;

  const flush = () => {
    if (!current) return;
    merged.push({
      ...current,
      id: `line-${String(merged.length + 1).padStart(3, "0")}`,
      text: normalizeCaptionText(current.text),
    });
    current = null;
  };

  for (const line of input) {
    if (!current) {
      current = { ...line };
    } else {
      current.end = line.end;
      current.text = joinCaptionText(current.text, line.text);
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

function parseVttTime(value: string): number {
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

function joinCaptionText(current: string, chunk: string): string {
  if (!current) return chunk;
  if (/^[,.;:!?]/.test(chunk)) return `${current}${chunk}`;
  return `${current} ${chunk}`;
}

function normalizeCaptionText(text: string): string {
  return decodeHtmlEntities(text)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function decodeHtmlEntities(text: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: "\"",
    apos: "'",
    nbsp: " ",
  };
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, entity) => {
    if (entity[0] === "#") {
      const isHex = entity[1]?.toLowerCase() === "x";
      const value = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : m;
    }
    return named[entity] ?? m;
  });
}

function isNoiseCaption(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    /^(\[.*\]|\(.*\))$/.test(lower) ||
    lower === "♪" ||
    lower.includes("[music]") ||
    lower.includes("[applause]")
  );
}

function roundTime(value: number): number {
  return Math.max(0, Math.round(value * 100) / 100);
}
