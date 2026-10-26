import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendExamSubmission } from '@/lib/examSubmissions';
import Grade10TestsPage from './Grade10TestsPage';

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'student-test' }, profile: null, loading: false }) }));
vi.mock('@/lib/examSubmissions', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/examSubmissions')>(), sendExamSubmission: vi.fn().mockResolvedValue(undefined), queueExamProgress: vi.fn(), sendExamProgress: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/components/PageShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/data/loader', () => ({ loadGrade10Tests: vi.fn().mockResolvedValue({ test1: {
  title: 'Practice Test 1', partA: { questions: [{ q: 'Yesterday, he ____________________ home.', opts: ['went', 'go', 'going', 'goes'], ans: 0 }] },
  partB: {}, partC: { fill_in: [{ q: 'There are many flowers.\nOur garden________________________________________________.', answer: ['has many flowers'] }] },
} }) }));
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
afterEach(cleanup);

describe('grade 10 compact presentation', () => {
  it('restores the writing stage and typed answer after reopening the same paper and student', async () => {
    let view = render(<MemoryRouter><Grade10TestsPage /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: /Practice Test 1/ }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Họ và tên học sinh' }), { target: { value: 'Minh Anh' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Lớp / nhóm học' }), { target: { value: '10A1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu làm bài' }));
    fireEvent.click(screen.getByRole('button', { name: 'A. went' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành' }));
    fireEvent.click(screen.getByRole('button', { name: 'Làm Part C →' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'has many flowers' } });
    view.unmount(); view = render(<MemoryRouter><Grade10TestsPage /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: /Practice Test 1/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục làm bài' }));
    expect(screen.getByRole('textbox')).toHaveValue('has many flowers');
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }));
    expect(screen.getByText('2/2')).toBeInTheDocument();
    expect(await screen.findByText(/^✓ Đã gửi kết quả cho cô/)).toBeInTheDocument();
  });
  it('shortens the MCQ and writing blanks while preserving both scores', async () => {
    render(<MemoryRouter><Grade10TestsPage /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: /Practice Test 1/ }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Họ và tên học sinh' }), { target: { value: 'Minh Anh' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Lớp / nhóm học' }), { target: { value: '10A1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu làm bài' }));
    expect(screen.getByText('Yesterday, he ____ home.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'A. went' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }));
    expect(screen.getByText('Chính xác!')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành' }));
    fireEvent.click(screen.getByRole('button', { name: 'Làm Part C →' }));
    expect(sendExamSubmission).not.toHaveBeenCalled();
    expect(screen.getByText(/Our garden ____\./)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'has many flowers' } });
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }));
    expect(screen.getByText('2/2')).toBeInTheDocument();
    expect(await screen.findByText(/^✓ Đã gửi kết quả cho cô/)).toBeInTheDocument();
    expect(sendExamSubmission).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ grade: 10, examId: 'test1', correct: 2, total: 2, score: 10, questions: expect.arrayContaining([expect.objectContaining({ answer: 'has many flowers', status: 'correct' })]) }));
  });
});
