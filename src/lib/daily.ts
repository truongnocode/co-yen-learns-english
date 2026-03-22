import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { UserProgress } from "./progress";

export interface DailyTasks {
  date: string;
  reviewWords: boolean;
  quizDone: boolean;
  listenDone: boolean;
}

const defaultDailyTasks: DailyTasks = {
  date: "",
  reviewWords: false,
  quizDone: false,
  listenDone: false,
};

/** Today as "YYYY-MM-DD" in Vietnam timezone (UTC+7) */
export const getDailyDate = (): string => {
  const now = new Date();
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return vnTime.toISOString().slice(0, 10);
};

/** Get daily tasks for today, auto-reset if it's a new day */
export const getDailyTasks = (progress: UserProgress): DailyTasks => {
  const today = getDailyDate();
  const tasks = progress.dailyTasks;
  if (!tasks || tasks.date !== today) {
    return { ...defaultDailyTasks, date: today };
  }
  return tasks;
};

/** Count completed tasks */
export const countCompletedTasks = (tasks: DailyTasks): number => {
  let count = 0;
  if (tasks.reviewWords) count++;
  if (tasks.quizDone) count++;
  if (tasks.listenDone) count++;
  return count;
};

/** Check if yesterday was the day before today (for streak) */
const isConsecutiveDay = (lastDate: string, today: string): boolean => {
  if (!lastDate) return false;
  const last = new Date(lastDate + "T00:00:00+07:00");
  const curr = new Date(today + "T00:00:00+07:00");
  const diffMs = curr.getTime() - last.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  return diffDays === 1;
};

/** Update streak when user becomes active today */
export const checkAndUpdateStreak = async (
  uid: string,
  progress: UserProgress,
): Promise<{ streak: number; isNewDay: boolean }> => {
  const today = getDailyDate();
  const lastActive = progress.lastActiveDate || "";

  // Already active today
  if (lastActive === today) {
    return { streak: progress.dailyStreak || 0, isNewDay: false };
  }

  // Calculate new streak
  let newStreak: number;
  if (isConsecutiveDay(lastActive, today)) {
    newStreak = (progress.dailyStreak || 0) + 1;
  } else if (!lastActive) {
    newStreak = 1;
  } else {
    newStreak = 1; // streak broken
  }

  // Reset daily tasks for new day
  const newTasks: DailyTasks = { ...defaultDailyTasks, date: today };

  const ref = doc(db, "progress", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, {
      dailyStreak: newStreak,
      lastActiveDate: today,
      dailyTasks: newTasks,
    });
  } else {
    await setDoc(ref, {
      quizzesDone: 0,
      highScore: 0,
      wordsLearned: [],
      quizHistory: [],
      dailyStreak: newStreak,
      lastActiveDate: today,
      dailyTasks: newTasks,
    });
  }

  return { streak: newStreak, isNewDay: true };
};

/** Mark a daily task as completed */
export const completeDailyTask = async (
  uid: string,
  taskKey: "reviewWords" | "quizDone" | "listenDone",
  progress: UserProgress,
): Promise<DailyTasks> => {
  const today = getDailyDate();
  const current = getDailyTasks(progress);

  // Already done
  if (current[taskKey]) return current;

  const updated: DailyTasks = { ...current, date: today, [taskKey]: true };

  const ref = doc(db, "progress", uid);
  await updateDoc(ref, { dailyTasks: updated });

  return updated;
};

/** Streak XP multiplier */
export const getStreakMultiplier = (streak: number): number => {
  if (streak >= 8) return 2;
  if (streak >= 4) return 1.5;
  return 1;
};
