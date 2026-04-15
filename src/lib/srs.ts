/**
 * Simplified SM-2 Spaced Repetition Algorithm.
 * Adapted for middle school students.
 */

export interface SRSItem {
  word: string;
  ease: number;       // 1.3 to 2.5
  interval: number;   // days until next review
  nextReview: string;  // "YYYY-MM-DD"
  repetitions: number; // consecutive correct
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/**
 * Update SRS item based on answer quality.
 * quality: 0-2 = wrong/hard, 3 = ok, 4-5 = easy
 */
export const updateSRS = (item: SRSItem, quality: number): SRSItem => {
  const today = new Date().toISOString().slice(0, 10);
  const q = clamp(quality, 0, 5);

  if (q < 3) {
    // Failed: reset
    return { ...item, repetitions: 0, interval: 1, ease: clamp(item.ease - 0.2, 1.3, 2.5), nextReview: addDays(today, 1) };
  }

  const reps = item.repetitions + 1;
  let interval: number;
  if (reps === 1) interval = 1;
  else if (reps === 2) interval = 3;
  else interval = Math.round(item.interval * item.ease);

  const newEase = clamp(item.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)), 1.3, 2.5);

  return { ...item, repetitions: reps, interval, ease: newEase, nextReview: addDays(today, interval) };
};

/** Get words due for review today */
export const getDueWords = (srsData: Record<string, SRSItem>): SRSItem[] => {
  const today = new Date().toISOString().slice(0, 10);
  return Object.values(srsData).filter((item) => item.nextReview <= today);
};

/** Initialize SRS for a list of words */
export const initSRSItems = (words: string[]): Record<string, SRSItem> => {
  const today = new Date().toISOString().slice(0, 10);
  const result: Record<string, SRSItem> = {};
  words.forEach((w) => {
    result[w] = { word: w, ease: 2.5, interval: 0, nextReview: today, repetitions: 0 };
  });
  return result;
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
