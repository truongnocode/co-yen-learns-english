import { doc, getDoc, setDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db } from "./firebase";

export interface UserProfile {
  displayName: string;
  photoURL: string;
  grade: number | null;
  createdAt: string;
}

export interface UserProgress {
  quizzesDone: number;
  highScore: number;
  wordsLearned: string[];
  quizHistory: { date: string; grade: number; unit: string; score: number; total: number }[];
}

const defaultProgress: UserProgress = {
  quizzesDone: 0,
  highScore: 0,
  wordsLearned: [],
  quizHistory: [],
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
