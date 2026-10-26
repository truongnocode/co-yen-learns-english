import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ExamSubmission from './ExamSubmission';
import { sendExamSubmission } from '@/lib/examSubmissions';

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'student-1' }, profile: null, loading: false }) }));
vi.mock('@/lib/examSubmissions', async original => ({ ...await original<typeof import('@/lib/examSubmissions')>(), sendExamSubmission: vi.fn() }));
const value = { version: 1 as const, grade: 6, examId: 'vedec-2026-01', examTitle: 'Đề 01', mode: 'test' as const, startedAt: 100, finishedAt: 200, correct: 1, total: 1, manual: 1, score: 10, questions: [
  { id: 'q1', number: '1', section: 'Listening', prompt: 'Question', context: '', options: ['T', 'F'], answer: 'T', expected: ['T'], status: 'correct' as const },
  { id: 'q2', number: '2', section: 'Writing', prompt: 'Write', context: '', options: [], answer: 'My school is small.', expected: [], status: 'manual' as const },
] };
beforeEach(() => { localStorage.clear(); vi.mocked(sendExamSubmission).mockReset(); });
afterEach(cleanup);
describe('student submission delivery', () => {
  it('requires name/class and only confirms receipt after the remote write succeeds', async () => {
    let acknowledge: () => void;
    vi.mocked(sendExamSubmission).mockImplementation(() => new Promise(resolve => { acknowledge = resolve; }));
    render(<ExamSubmission id="attempt-1" value={value} />);
    const send = screen.getByRole('button', { name: 'Gửi kết quả cho cô' });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Họ và tên học sinh' }), { target: { value: 'Minh Anh' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Lớp / nhóm học' }), { target: { value: '6A1' } });
    fireEvent.click(send);
    expect(screen.getByRole('button', { name: 'Đang gửi…' })).toBeDisabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    acknowledge!();
    expect(await screen.findByRole('status')).toHaveTextContent('Đã gửi kết quả cho cô');
    expect(sendExamSubmission).toHaveBeenCalledWith('attempt-1', expect.objectContaining({ uid: 'student-1', studentName: 'Minh Anh', className: '6A1', questions: value.questions }));
  });
  it('keeps the same attempt ID and answers when retrying a failed automatic send', async () => {
    vi.mocked(sendExamSubmission).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
    render(<ExamSubmission id="attempt-retry" value={value} identity={{ studentName: 'Minh Anh', className: '6A1' }} autoSend />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa gửi được cho cô');
    fireEvent.click(screen.getByRole('button', { name: 'Gửi lại kết quả' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Đã gửi kết quả cho cô');
    const calls = vi.mocked(sendExamSubmission).mock.calls;
    expect(calls).toHaveLength(2); expect(calls[0]).toEqual(calls[1]);
  });
});
