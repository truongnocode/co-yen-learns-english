import { describe, expect, it } from 'vitest';
import { publicExamResult, rankExamStudents, leaderboardEntrySchema, type LeaderboardRecord } from './examLeaderboard';
const base: LeaderboardRecord = { id: '1', version: 1, studentName: 'Nguyễn An', className: '6A', grade: 6, examId: 'paper1', examTitle: 'Đề 01', mode: 'test', score: 8, finishedAt: 1000 };
describe('public exam rankings', () => {
  it('keeps only safe summary fields, excluding drafts, manual-only and labelled tests', () => {
    const source = { ...base, total: 10, state: 'submitted', uid: 'private', questions: ['private answer'], reviews: 'private feedback' };
    expect(publicExamResult(source)).toEqual({ version: 1, studentName: base.studentName, className: base.className, grade: 6, examId: 'paper1', examTitle: 'Đề 01', mode: 'test', score: 8, finishedAt: 1000 });
    expect(publicExamResult({ ...source, state: 'in_progress' })).toBeNull();
    expect(publicExamResult({ ...source, total: 0 })).toBeNull();
    expect(publicExamResult({ ...source, studentName: 'KIỂM THỬ TIẾN TRÌNH A' })).toBeNull();
    expect(leaderboardEntrySchema.safeParse(source).success).toBe(false);
  });
  it('counts the best score per different paper, normalizes identity, and separates grade/mode', () => {
    const entries = [base, { ...base, id: '2', score: 9, studentName: '  nguyễn   an ' }, { ...base, id: '3', score: 1 }, { ...base, id: '4', examId: 'paper2', score: 7 }, { ...base, id: '5', mode: 'practice' as const, score: 10 }, { ...base, id: '6', grade: 7, score: 10 }];
    expect(rankExamStudents(entries, 6, 'test')).toMatchObject([{ rank: 1, points: 16, average: 8, papers: 2 }]);
    expect(rankExamStudents(entries, 6, 'test', 'paper1')).toMatchObject([{ points: 9, papers: 1 }]);
    expect(rankExamStudents(entries, 6, 'practice')).toMatchObject([{ points: 10, papers: 1 }]);
  });
  it('uses average for equal totals, gives equal ranks to ties, and distinguishes classes', () => {
    const rows = rankExamStudents([base, { ...base, id: '2', studentName: 'Bình', score: 4 }, { ...base, id: '3', studentName: 'Bình', examId: 'paper2', score: 4 }, { ...base, id: '4', className: '6B' }], 6, 'test');
    expect(rows.map(r => [r.rank, r.points, r.papers])).toEqual([[1, 8, 1], [1, 8, 1], [3, 8, 2]]);
  });
  it('keeps decimal ties stable and hides smoke records even if published externally', () => {
    expect(rankExamStudents([base, { ...base, id: '2', examId: 'p2', score: 0.1 }, { ...base, id: '3', examId: 'p3', score: 0.2 }, { ...base, id: '4', studentName: 'Bình', score: 8.3 }, { ...base, id: '5', studentName: 'CODEX smoke', score: 10 }], 6, 'test').map(r => r.points)).toEqual([8.3, 8.3]);
    expect(rankExamStudents([], 7, 'test')).toEqual([]);
  });
});
