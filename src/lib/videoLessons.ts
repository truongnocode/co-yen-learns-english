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
import { auth, db } from "@/lib/firebase";

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

export interface VideoLessonProgress {
  lessonId: string;
  completedLineIds: string[];
  difficultLineIds: string[];
  currentLineIndex: number;
  hideLevelByLine: Record<string, number>;
  updatedAt?: unknown;
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
  const lines = normalizeLessonLines(lesson.lines);
  // Mọi câu BẮT BUỘC có bản dịch tiếng Việt — học sinh luôn thấy nghĩa, không câu nào trống.
  const missingVi = lines.filter((l) => !l.vi || !l.vi.trim());
  if (missingVi.length) {
    const ids = missingVi.slice(0, 5).map((l) => l.id).join(", ");
    throw new Error(
      `JSON không hợp lệ: ${missingVi.length} câu thiếu bản dịch tiếng Việt ('vi') — vd: ${ids}. Mọi câu đều cần có 'vi'.`,
    );
  }
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
      lines,
      rhythmSource: trustedRhythmSource(lesson.rhythmSource),
      createdBy: u.uid,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
  return id;
}

// The audio-faithful skill (scripts/rhythm-from-captions.mjs) is the only rhythm
// engine; it emits "caption-audio-v1". Anything else is treated as "no rhythm".
function trustedRhythmSource(source: string | undefined): string {
  return source === "caption-audio-v1" ? source : "none";
}

// Every line's id is used by VideoLessonPage as the React key and as the per-line
// progress key (completedLineIds, hideLevelByLine), so each must be a non-empty,
// unique string. Hand-edited import JSON can break that. We mirror the skill's
// positional ids (scripts/rhythm-from-captions.mjs: `l${i}`) for any line missing
// one — preserving valid explicit ids so progress survives line reorders — then
// reject leftover duplicates rather than silently corrupting the student view.
function normalizeLessonLines(lines: VideoLessonLine[]): VideoLessonLine[] {
  const normalized = lines.map((line, i) => {
    const id = typeof line.id === "string" ? line.id.trim() : "";
    return id ? { ...line, id } : { ...line, id: `l${i}` };
  });
  const seen = new Set<string>();
  for (const line of normalized) {
    if (seen.has(line.id)) {
      throw new Error(
        `JSON không hợp lệ: 'id' của dòng bị trùng lặp ("${line.id}"). Mỗi dòng cần một id duy nhất.`,
      );
    }
    seen.add(line.id);
  }
  return normalized;
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
