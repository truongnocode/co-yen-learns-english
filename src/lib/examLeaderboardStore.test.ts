import { describe, expect, it, vi } from 'vitest';
import { loadExamLeaderboard } from './examLeaderboardStore';
const mock = vi.hoisted(() => ({ getDocs: vi.fn() }));
vi.mock('./firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({ collection: vi.fn(), getDocs: mock.getDocs, limit: vi.fn(), query: vi.fn(), startAfter: vi.fn(), where: vi.fn() }));
describe('public ranking pagination', () => {
  it('loads older pages before computing ranks and discards unexpected private fields', async () => {
    const data = { version: 1, studentName: 'An', className: '6A', grade: 6, examId: 'p1', examTitle: 'Đề 1', mode: 'test', score: 8, finishedAt: 1 };
    mock.getDocs.mockResolvedValueOnce({ size: 500, docs: Array.from({ length: 500 }, (_, i) => ({ id: String(i), data: () => data })) }).mockResolvedValueOnce({ size: 2, docs: [{ id: 'older', data: () => data }, { id: 'invalid', data: () => ({ ...data, questions: ['private'] }) }] });
    const rows = await loadExamLeaderboard(6);
    expect(rows).toHaveLength(501);
    expect(rows.at(-1)?.id).toBe('older');
    expect(mock.getDocs).toHaveBeenCalledTimes(2);
  });
});
