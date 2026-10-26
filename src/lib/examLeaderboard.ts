import { z } from 'zod';

// This is the entire public projection. Never add answers, account IDs, or reviews.
export const leaderboardEntrySchema = z.object({
  version: z.literal(1), studentName: z.string().min(2).max(100), className: z.string().min(1).max(60),
  grade: z.number().int().min(6).max(10), examId: z.string().max(100), examTitle: z.string().max(1000),
  mode: z.enum(['test', 'practice']), score: z.number().min(0).max(10), finishedAt: z.number().positive(),
}).strict();
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export type LeaderboardRecord = LeaderboardEntry & { id: string };
const clean = (s: string) => s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
export const searchLeaderboardText = (s: string) => clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const isTestName = (s: string) => /^(kiem thu|codex)\b/.test(searchLeaderboardText(s));

export function publicExamResult(source: Omit<LeaderboardEntry, 'version'> & { version: number; state?: string; total: number }): LeaderboardEntry | null {
  if (source.state !== undefined && source.state !== 'submitted' || !Number.isInteger(source.total) || source.total <= 0) return null;
  const result = leaderboardEntrySchema.safeParse({ version: 1, studentName: source.studentName, className: source.className, grade: source.grade, examId: source.examId, examTitle: source.examTitle, mode: source.mode, score: source.score, finishedAt: source.finishedAt });
  // Production smoke records are explicitly labelled, and must not compete with pupils.
  return result.success && !isTestName(result.data.studentName) ? result.data : null;
}

export interface RankedStudent {
  key: string; studentName: string; className: string; points: number; average: number; papers: number; rank: number;
}
export function rankExamStudents(entries: LeaderboardRecord[], grade: number, mode: LeaderboardEntry['mode'], examId = ''): RankedStudent[] {
  const students = new Map<string, { studentName: string; className: string; best: Map<string, number> }>();
  for (const entry of entries) {
    if (entry.grade !== grade || entry.mode !== mode || examId && entry.examId !== examId || isTestName(entry.studentName)) continue;
    const key = JSON.stringify([clean(entry.studentName), clean(entry.className)]);
    let student = students.get(key);
    if (!student) { student = { studentName: entry.studentName.trim(), className: entry.className.trim(), best: new Map() }; students.set(key, student); }
    const ticks = Math.round(entry.score * 10);
    student.best.set(entry.examId, Math.max(ticks, student.best.get(entry.examId) ?? -1));
  }
  const rows = [...students].map(([key, student]) => {
    const ticks = [...student.best.values()].reduce((sum, n) => sum + n, 0);
    return { key, studentName: student.studentName, className: student.className, points: ticks / 10, average: ticks / student.best.size / 10, papers: student.best.size, rank: 0 };
  }).sort((a, b) => b.points - a.points || b.average - a.average || a.studentName.localeCompare(b.studentName, 'vi') || a.className.localeCompare(b.className, 'vi'));
  rows.forEach((row, i) => { row.rank = i && row.points === rows[i - 1].points && row.average === rows[i - 1].average ? rows[i - 1].rank : i + 1; });
  return rows;
}
