import { z } from 'zod';
import { newSubmissionId, studentAttemptKey, type StudentIdentity } from './examSubmissions';
const schema = z.object({
  id: z.string().min(10).max(80), startedAt: z.number().positive(), revision: z.number().int().positive(), finishedAt: z.number(),
  identity: z.object({ studentName: z.string().min(2).max(100), className: z.string().min(1).max(60) }),
  current: z.number().int().nonnegative(), selected: z.number().int().nonnegative().nullable(), submitted: z.boolean(), score: z.number().int().nonnegative(), finished: z.boolean(),
  partCAnswers: z.array(z.string().max(10000)), partCSubmitted: z.boolean(), showPartC: z.boolean(), partCScore: z.number().int().nonnegative(),
  reviewMode: z.enum(['instant', 'after']), timeLimit: z.number().nonnegative(), userAnswers: z.array(z.number().int().nonnegative().nullable()), timerStarted: z.boolean(), timerStartedAt: z.number().nonnegative(),
});
export interface Grade10Attempt {
  id: string; startedAt: number; revision: number; finishedAt: number; identity: StudentIdentity;
  current: number; selected: number | null; submitted: boolean; score: number; finished: boolean;
  partCAnswers: string[]; partCSubmitted: boolean; showPartC: boolean; partCScore: number;
  reviewMode: 'instant' | 'after'; timeLimit: number; userAnswers: (number | null)[]; timerStarted: boolean; timerStartedAt: number;
}
export const grade10AttemptKey = (id: string, identity: StudentIdentity) => studentAttemptKey(`coyen:grade10:attempt:v1:${id}`, identity);
export function examSignature(test: unknown) {
  let hash = 2166136261; for (const character of JSON.stringify(test)) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(16);
}
export function newGrade10Attempt(count: number, identity: StudentIdentity): Grade10Attempt {
  return { id: newSubmissionId(), identity, startedAt: Date.now(), revision: Date.now(), finishedAt: 0, current: 0, selected: null, submitted: false, score: 0, finished: false, partCAnswers: [], partCSubmitted: false, showPartC: false, partCScore: 0, reviewMode: 'instant', timeLimit: 0, userAnswers: Array(count).fill(null), timerStarted: false, timerStartedAt: 0 };
}
export function restoreGrade10Attempt(key: string, signature: string, options: string[][], writingCount: number): Grade10Attempt | null {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || 'null');
    if (raw?.signature !== signature) return null;
    const result = schema.safeParse(raw.attempt); if (!result.success) return null;
    const a = result.data;
    if (a.current >= options.length || a.userAnswers.length !== options.length || a.partCAnswers.length > writingCount || a.userAnswers.some((answer, i) => answer !== null && answer >= options[i].length) || a.selected !== null && a.selected >= options[a.current].length || a.score > options.length || a.partCScore > writingCount) return null;
    return a as Grade10Attempt;
  } catch { return null; }
}
