/**
 * Dynamic test generator — creates randomized tests from SGK question bank.
 */

import type { MCQuestion, SGKData } from "@/data/types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Generate a test from specific units */
export const generateTest = (
  data: SGKData,
  unitKeys: string[],
  count: number,
): MCQuestion[] => {
  const pool: MCQuestion[] = [];
  unitKeys.forEach((key) => {
    const unit = data.units[key];
    if (unit?.exercises) pool.push(...unit.exercises);
  });
  return shuffle(pool).slice(0, count).map(shuffleOptions);
};

/** Generate a mixed test from all units */
export const generateMixedTest = (data: SGKData, count: number): MCQuestion[] => {
  const pool: MCQuestion[] = [];
  Object.values(data.units).forEach((unit) => {
    if (unit?.exercises) pool.push(...unit.exercises);
  });
  return shuffle(pool).slice(0, count).map(shuffleOptions);
};

/** Shuffle answer options within a question */
function shuffleOptions(q: MCQuestion): MCQuestion {
  const correctOpt = q.opts[q.ans];
  const shuffled = shuffle([...q.opts]);
  return { ...q, opts: shuffled, ans: shuffled.indexOf(correctOpt) };
}
