import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StudentResults, { StudentResultDetail } from './StudentResults';
import { loadSubmissionPage, loadSubmission, loadTeacherReview, saveTeacherReview } from '@/lib/examSubmissions';
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'teacher', email: 'truongnq.vie@gmail.com' } }) }));
vi.mock('@/lib/examSubmissions', () => ({ loadSubmissionPage: vi.fn(), loadSubmission: vi.fn(), loadTeacherReview: vi.fn(), saveTeacherReview: vi.fn() }));
const row = { id: 'a1', version: 1, uid: 'student', studentName: 'Nguyễn Minh Anh', className: '6A1', grade: 6, examId: 'paper1', examTitle: 'Đề 01', mode: 'test', startedAt: 1000, finishedAt: 61000, correct: 1, total: 2, manual: 1, score: 5, questions: [{ id: 'q3', number: '3', section: 'Writing', prompt: 'Write about a friend.', context: '', options: [], answer: '<img src=x onerror=alert(1)> My friend is kind.', expected: [], status: 'manual' }] };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(loadSubmissionPage).mockResolvedValue({ rows: [row, { ...row, id: 'a2', studentName: 'Lan', grade: 9, className: '9B', mode: 'practice' }] as never, cursor: undefined, hasMore: false });
  vi.mocked(loadSubmission).mockResolvedValue(row as never);
  vi.mocked(loadTeacherReview).mockResolvedValue(null);
  vi.mocked(saveTeacherReview).mockResolvedValue(undefined);
});
afterEach(cleanup);
describe('teacher results', () => {
  it('filters by grade, mode and Vietnamese student/class names', async () => {
    render(<MemoryRouter><StudentResults /></MemoryRouter>);
    await screen.findByRole('link', { name: /Nguyễn Minh Anh/ });
    fireEvent.change(screen.getByRole('combobox', { name: 'Khối lớp' }), { target: { value: '6' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Tìm học sinh, lớp hoặc đề' }), { target: { value: 'nguyen minh' } });
    expect(screen.getByRole('link', { name: /Nguyễn Minh Anh/ })).toHaveAttribute('href', '/admin/results/a1');
    expect(screen.queryByRole('link', { name: /Lan/ })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 bài phù hợp');
  });
  it('shows the complete writing response as text and saves the teacher review separately', async () => {
    render(<MemoryRouter initialEntries={['/admin/results/a1']}><Routes><Route path="/admin/results/:resultId" element={<StudentResultDetail />} /></Routes></MemoryRouter>);
    const question = await screen.findByRole('article', { name: 'Câu 3' });
    expect(within(question).getByText(row.questions[0].answer)).toBeInTheDocument();
    expect(within(question).queryByRole('img')).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '8.5' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Nhận xét', exact: true }), { target: { value: 'Em viết rõ ý.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu nhận xét' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Đã lưu nhận xét');
    expect(saveTeacherReview).toHaveBeenCalledWith('a1', { writingScore: 8.5, comment: 'Em viết rõ ý.', reviewedBy: 'truongnq.vie@gmail.com' });
    expect(screen.getByText('Điểm tự động: 5/10 · Đúng 1/2')).toBeInTheDocument();
  });
});
