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

export async function createTranscriptFromYouTube(url: string): Promise<VideoTranscriptPreview> {
  const res = await fetch(`${BASE_URL}/api/video-lessons/transcript`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeader()),
    },
    body: JSON.stringify({ url }),
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
    createdBy: u.uid,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function listVideoLessons(): Promise<VideoLesson[]> {
  const snap = await getDocs(query(collection(db, "video_lessons"), orderBy("updatedAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VideoLesson, "id">) }));
}

export async function getVideoLesson(id: string): Promise<VideoLesson | null> {
  const snap = await getDoc(doc(db, "video_lessons", id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<VideoLesson, "id">) }) : null;
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
