import { doc, getDoc, setDoc, updateDoc, arrayUnion, increment, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import type { SRSItem } from "./srs";

export interface UserProfile {
  displayName: string;
  photoURL: string;
  grade: number | null;
  createdAt: string;
}

export interface DailyTasks {
  date: string;
  reviewWords: boolean;
  quizDone: boolean;
  listenDone: boolean;
}

export interface UserProgress {
  quizzesDone: number;
  highScore: number;
  wordsLearned: string[];
  quizHistory: { date: string; grade: number; unit: string; score: number; total: number }[];
  dailyStreak: number;
  lastActiveDate: string;
  dailyTasks: DailyTasks;
  srsData: Record<string, SRSItem>;
}

const defaultProgress: UserProgress = {
  quizzesDone: 0,
  highScore: 0,
  wordsLearned: [],
  quizHistory: [],
  dailyStreak: 0,
  lastActiveDate: "",
  dailyTasks: { date: "", reviewWords: false, quizDone: false, listenDone: false },
  srsData: {},
};

// --- Profile ---

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

export const createUserProfile = async (
  uid: string,
  data: { displayName: string; photoURL: string }
): Promise<UserProfile> => {
  const profile: UserProfile = {
    displayName: data.displayName,
    photoURL: data.photoURL,
    grade: null,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "users", uid), profile);
  return profile;
};

export const setUserGrade = async (uid: string, grade: number) => {
  await updateDoc(doc(db, "users", uid), { grade });
};

export const updateUserProfile = async (
  uid: string,
  data: { displayName?: string; photoURL?: string }
) => {
  await updateDoc(doc(db, "users", uid), data);
};

// --- Progress ---

export const getProgress = async (uid: string): Promise<UserProgress> => {
  const snap = await getDoc(doc(db, "progress", uid));
  if (snap.exists()) return snap.data() as UserProgress;
  await setDoc(doc(db, "progress", uid), defaultProgress);
  return defaultProgress;
};

export const saveQuizResult = async (
  uid: string,
  grade: number,
  unit: string,
  score: number,
  total: number
) => {
  const ref = doc(db, "progress", uid);
  const snap = await getDoc(ref);
  const current = snap.exists() ? (snap.data() as UserProgress) : defaultProgress;

  const newHighScore = Math.max(current.highScore, Math.round((score / total) * 100));
  const entry = { date: new Date().toISOString(), grade, unit, score, total };

  if (snap.exists()) {
    await updateDoc(ref, {
      quizzesDone: increment(1),
      highScore: newHighScore,
      quizHistory: arrayUnion(entry),
    });
  } else {
    await setDoc(ref, {
      ...defaultProgress,
      quizzesDone: 1,
      highScore: newHighScore,
      quizHistory: [entry],
    });
  }
};

export const addLearnedWords = async (uid: string, words: string[]) => {
  const ref = doc(db, "progress", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { wordsLearned: arrayUnion(...words) });
  } else {
    await setDoc(ref, { ...defaultProgress, wordsLearned: words });
  }
};

// --- XP calculation ---

export const calcXP = (p: UserProgress): number => {
  const base = (p.wordsLearned?.length || 0) * 10 + (p.quizzesDone || 0) * 30;
  const streak = p.dailyStreak || 0;
  const multiplier = streak >= 8 ? 2 : streak >= 4 ? 1.5 : 1;
  return Math.round(base * multiplier);
};

// --- Leaderboard ---

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string;
  grade: number | null;
  xp: number;
}

export const getLeaderboard = async (gradeFilter?: number): Promise<LeaderboardEntry[]> => {
  // Fetch all users and their progress in parallel
  const [usersSnap, progressSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "progress")),
  ]);

  const progressMap = new Map<string, UserProgress>();
  progressSnap.forEach((d) => progressMap.set(d.id, d.data() as UserProgress));

  const entries: LeaderboardEntry[] = [];
  usersSnap.forEach((d) => {
    const profile = d.data() as UserProfile;
    if (gradeFilter && profile.grade !== gradeFilter) return;
    const progress = progressMap.get(d.id) || defaultProgress;
    const xp = calcXP(progress);
    if (xp > 0) {
      entries.push({
        uid: d.id,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        grade: profile.grade,
        xp,
      });
    }
  });

  entries.sort((a, b) => b.xp - a.xp);
  return entries.slice(0, 20);
};

// --- Weekly Missions ---

export interface WeeklyMission {
  completed: number;
  target: number;
}

export const getWeeklyMission = (progress: UserProgress): WeeklyMission => {
  const target = 5;
  const now = new Date();
  // Get Monday of current week
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const completed = (progress.quizHistory || []).filter((q) => {
    const d = new Date(q.date);
    return d >= monday;
  }).length;

  return { completed: Math.min(completed, target), target };
};
