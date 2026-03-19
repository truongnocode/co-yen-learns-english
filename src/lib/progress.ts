import { doc, getDoc, setDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db } from "./firebase";

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
