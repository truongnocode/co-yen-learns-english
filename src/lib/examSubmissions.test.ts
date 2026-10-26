import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hasSubmissionReceipt, resendPendingSubmissions, sendExamSubmission, type ExamSubmission } from './examSubmissions';
const mock = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn(), transaction: vi.fn() }));
vi.mock('./firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(), doc: vi.fn((...args) => args.slice(1).join('/')), getDoc: vi.fn(), getDocs: vi.fn(), limit: vi.fn(), orderBy: vi.fn(), query: vi.fn(), startAfter: vi.fn(), setDoc: vi.fn(), serverTimestamp: () => 'SERVER_TIME',
  runTransaction: (...args: unknown[]) => mock.transaction(...args),
}));
const submission: ExamSubmission = { version: 1, uid: 'owner', studentName: 'Test Student', className: '6A1', grade: 6, examId: 'paper', examTitle: 'Paper', mode: 'test', startedAt: 1, finishedAt: 2, correct: 0, total: 0, manual: 1, score: 0, questions: [{ id: 'q1', number: '1', section: 'Writing', prompt: 'Write', context: '', options: [], answer: 'My essay.', expected: [], status: 'manual' }] };
beforeEach(() => {
  localStorage.clear(); vi.clearAllMocks();
  mock.read.mockResolvedValue({ exists: () => false });
  mock.transaction.mockImplementation(async (_db, action) => action({ get: mock.read, set: mock.write }));
});
describe('persistent idempotent exam delivery', () => {
  it('queues before sending, keeps failed payloads, and only retries the current owner', async () => {
    mock.transaction.mockRejectedValueOnce(new Error('offline'));
    await expect(sendExamSubmission('attempt-queue', submission)).rejects.toThrow('offline');
    expect(hasSubmissionReceipt('owner', 'attempt-queue')).toBe(false);
    expect(localStorage.getItem('coyen:pending-submission:attempt-queue')).toContain('My essay.');
    await resendPendingSubmissions('another-student');
    expect(mock.transaction).toHaveBeenCalledTimes(1);
    await resendPendingSubmissions('owner');
    expect(mock.write).toHaveBeenCalledWith('exam_submissions/attempt-queue', { ...submission, receivedAt: 'SERVER_TIME' });
    expect(hasSubmissionReceipt('owner', 'attempt-queue')).toBe(true);
    expect(localStorage.getItem('coyen:pending-submission:attempt-queue')).toBeNull();
  });
  it('does not overwrite an acknowledged submission when the receipt was lost', async () => {
    mock.read.mockResolvedValue({ exists: () => true, data: () => ({ ...submission }) });
    await sendExamSubmission('attempt-existing', submission);
    expect(mock.write).not.toHaveBeenCalled();
    expect(hasSubmissionReceipt('owner', 'attempt-existing')).toBe(true);
  });
  it('rejects a conflicting document owned by someone else', async () => {
    mock.read.mockResolvedValue({ exists: () => true, data: () => ({ uid: 'someone-else' }) });
    await expect(sendExamSubmission('attempt-conflict', submission)).rejects.toThrow('phiên đăng nhập khác');
    expect(mock.write).not.toHaveBeenCalled();
    expect(hasSubmissionReceipt('owner', 'attempt-conflict')).toBe(false);
  });
});
