import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { apiBaseUrl } from "@/lib/apiBase";
import { auth, db } from "@/lib/firebase";

const BASE_URL = apiBaseUrl();

export interface VideoLessonLine {
  id: string;
  start: number;
  end: number;
  text: string;
  vi?: string;
  rhythmChunks?: VideoLessonRhythmChunk[];
}

export interface VideoLessonRhythmChunk {
  text: string;
  start: number;
  end: number;
  boundaryAfter?: VideoLessonRhythmBoundary;
}

export interface VideoLessonRhythmBoundary {
  type: "minor" | "major";
  pauseMs: number;
  confidence: number;
  sources: Array<"silence" | "punctuation" | "syntax" | "length" | "audio">;
}

export interface VideoLesson {
  id: string;
  title: string;
  youtubeUrl: string;
  videoId: string;
  source: "caption" | "auto_caption" | "gemini";
  languageCode: string;
  grade: number | null;
  topic: string;
  lines: VideoLessonLine[];
  rhythmSource?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
}

export interface VideoTranscriptPreview {
  videoId: string;
  title: string;
  source: "caption" | "auto_caption" | "gemini";
  languageCode: string;
  lines: VideoLessonLine[];
  rhythmSource?: string;
}

export interface VideoLessonProgress {
  lessonId: string;
  completedLineIds: string[];
  difficultLineIds: string[];
  currentLineIndex: number;
  hideLevelByLine: Record<string, number>;
  updatedAt?: unknown;
}

async function authHeader(): Promise<Record<string, string>> {
  const u = auth.currentUser;
  if (!u) throw new Error("Chưa đăng nhập.");
  const token = await u.getIdToken(false);
  return { Authorization: `Bearer ${token}` };
}

export async function createTranscriptFromYouTube(url: string, options: { grade?: number | null } = {}): Promise<VideoTranscriptPreview> {
  const res = await fetch(`${BASE_URL}/api/video-lessons/transcript`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeader()),
    },
    body: JSON.stringify({ url, grade: options.grade ?? undefined }),
  });
  if (!res.ok) throw await toError(res);
  return (await res.json()) as VideoTranscriptPreview;
}

export async function saveVideoLesson(params: {
  youtubeUrl: string;
  grade: number | null;
  topic: string;
  preview: VideoTranscriptPreview;
}): Promise<string> {
  const u = auth.currentUser;
  if (!u) throw new Error("Chưa đăng nhập.");

  const id = params.preview.videoId;
  const ref = doc(db, "video_lessons", id);
  await setDoc(ref, {
    title: params.preview.title,
    youtubeUrl: params.youtubeUrl,
    videoId: params.preview.videoId,
    source: params.preview.source,
    languageCode: params.preview.languageCode,
    grade: params.grade,
    topic: params.topic.trim(),
    lines: params.preview.lines,
    rhythmSource: trustedRhythmSource(params.preview.rhythmSource),
    createdBy: u.uid,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return id;
}

// Publish a full lesson object produced offline by the audio-faithful skill
// (scripts/rhythm-from-captions.mjs). Writes via the admin's browser auth — no
// Firebase Admin service account needed. Upserts video_lessons/<videoId>.
export async function importVideoLesson(
  lesson: Partial<VideoLesson> & { videoId: string; lines: VideoLessonLine[] },
): Promise<string> {
  const u = auth.currentUser;
  if (!u) throw new Error("Chưa đăng nhập.");
  if (!lesson.videoId || !Array.isArray(lesson.lines) || lesson.lines.length === 0) {
    throw new Error("JSON không hợp lệ: cần có 'videoId' và 'lines'.");
  }
  const id = lesson.videoId;
  await setDoc(
    doc(db, "video_lessons", id),
    {
      title: lesson.title ?? `YouTube ${id}`,
      youtubeUrl: lesson.youtubeUrl ?? `https://www.youtube.com/watch?v=${id}`,
      videoId: id,
      source: lesson.source ?? "caption",
      languageCode: lesson.languageCode ?? "en",
      grade: lesson.grade ?? null,
      topic: (lesson.topic ?? "").trim(),
      lines: lesson.lines,
      rhythmSource: trustedRhythmSource(lesson.rhythmSource),
      createdBy: u.uid,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
  return id;
}

function trustedRhythmSource(source: string | undefined): string {
  if (
    source === "ffmpeg-hybrid-v1" ||
    source === "ffmpeg-syntax-v2" ||
    source === "ffmpeg-syntax-v3" ||
    source === "ffmpeg-syntax-v4" ||
    source === "whisperx-syntax-v2" ||
    source === "whisperx-syntax-v3" ||
    source === "whisperx-syntax-v4" ||
    source === "whisperx-hybrid-v1" ||
    source === "caption-audio-v1"
  ) {
    return source;
  }
  return "none";
}

export async function listVideoLessons(): Promise<VideoLesson[]> {
  const snap = await getDocs(query(collection(db, "video_lessons"), orderBy("updatedAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VideoLesson, "id">) }));
}

export async function getVideoLesson(id: string): Promise<VideoLesson | null> {
  const snap = await getDoc(doc(db, "video_lessons", id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<VideoLesson, "id">) }) : null;
}

export async function saveVideoLessonReview(params: {
  lessonId: string;
  lines: VideoLessonLine[];
  rhythmSource?: string;
}): Promise<void> {
  await setDoc(
    doc(db, "video_lessons", params.lessonId),
    {
      lines: params.lines,
      rhythmSource: trustedRhythmSource(params.rhythmSource),
      rhythmReviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function isLatestVideoLessonRhythmSource(source: string | undefined): boolean {
  // caption-audio-v1 is produced by the audio-faithful skill (scripts/rhythm-from-captions.mjs).
  // Mark it "latest" so the admin auto-refresh in VideoLessonPage does NOT overwrite it
  // by re-running the old extractor pipeline.
  return source === "ffmpeg-syntax-v4" || source === "whisperx-syntax-v4" || source === "caption-audio-v1";
}

export async function refreshVideoLessonRhythm(lesson: VideoLesson): Promise<VideoLesson> {
  const url = lesson.youtubeUrl || `https://www.youtube.com/watch?v=${lesson.videoId || lesson.id}`;
  const preview = await createTranscriptFromYouTube(url, { grade: lesson.grade });
  if (preview.videoId !== lesson.videoId && preview.videoId !== lesson.id) {
    throw new Error("Transcript mới không khớp video hiện tại.");
  }

  const rhythmSource = trustedRhythmSource(preview.rhythmSource);
  await saveVideoLessonReview({
    lessonId: lesson.id,
    lines: preview.lines,
    rhythmSource,
  });

  return {
    ...lesson,
    title: lesson.title || preview.title,
    source: preview.source,
    languageCode: preview.languageCode,
    lines: preview.lines,
    rhythmSource,
  };
}

export async function getVideoLessonProgress(
  uid: string,
  lessonId: string,
): Promise<VideoLessonProgress> {
  const snap = await getDoc(doc(db, "video_lesson_progress", uid, "lessons", lessonId));
  if (snap.exists()) return snap.data() as VideoLessonProgress;
  return {
    lessonId,
    completedLineIds: [],
    difficultLineIds: [],
    currentLineIndex: 0,
    hideLevelByLine: {},
  };
}

export async function saveVideoLessonProgress(
  uid: string,
  lessonId: string,
  progress: VideoLessonProgress,
): Promise<void> {
  await setDoc(
    doc(db, "video_lesson_progress", uid, "lessons", lessonId),
    {
      ...progress,
      lessonId,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

async function toError(res: Response): Promise<Error> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = await res.text().catch(() => null);
  }
  const message =
    (body && typeof body === "object" && "error" in body && String(body.error)) ||
    (typeof body === "string" && body) ||
    `HTTP ${res.status}`;
  const err = new Error(message);
  (err as Error & { status?: number; body?: unknown }).status = res.status;
  (err as Error & { status?: number; body?: unknown }).body = body;
  return err;
}
