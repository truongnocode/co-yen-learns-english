import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LeaderboardPage from './LeaderboardPage';
const mock = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('@/components/PageShell', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/lib/examLeaderboardStore', () => ({ loadExamLeaderboard: mock.load }));
afterEach(cleanup);
describe('public rankings page', () => {
  it('separates practice scores, preserves actual ranks when searching, and switches grades', async () => {
    const row = { version: 1, studentName: 'An', className: '6A', grade: 6, examId: 'paper', examTitle: 'Đề 1', mode: 'test', score: 9, finishedAt: 1 };
    mock.load.mockImplementation(async (grade: number) => grade === 6 ? [{ ...row, id: 'a' }, { ...row, id: 'b', studentName: 'Bình', score: 8 }, { ...row, id: 'p', studentName: 'Lan', mode: 'practice', score: 10 }] : []);
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={['/leaderboard?grade=6']}><LeaderboardPage /></MemoryRouter></QueryClientProvider>);
    expect(await screen.findByText('Bình')).toBeVisible();
    expect(screen.queryByText('Lan')).toBeNull();
    fireEvent.change(screen.getByRole('textbox', { name: 'Tìm học sinh hoặc lớp' }), { target: { value: 'binh' } });
    expect(screen.getByRole('row', { name: /Bình/ })).toHaveTextContent('2');
    expect(screen.queryByText('An')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Luyện tập', exact: true }));
    expect(await screen.findByText('Lan')).toBeVisible();
    expect(screen.queryByText('Bình')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Lớp 7', exact: true }));
    await waitFor(() => expect(mock.load).toHaveBeenCalledWith(7));
    expect(await screen.findByText('Chưa có kết quả ở mục này')).toBeVisible();
  });
});
