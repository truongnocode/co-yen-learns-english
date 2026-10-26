import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Grade10TestsPage from './Grade10TestsPage';

vi.mock('@/components/PageShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/data/loader', () => ({ loadGrade10Tests: vi.fn().mockResolvedValue({ test1: {
  title: 'Practice Test 1', partA: { questions: [{ q: 'Yesterday, he ____________________ home.', opts: ['went', 'go', 'going', 'goes'], ans: 0 }] },
  partB: {}, partC: { fill_in: [{ q: 'There are many flowers.\nOur garden________________________________________________.', answer: ['has many flowers'] }] },
} }) }));
afterEach(cleanup);

describe('grade 10 compact presentation', () => {
  it('shortens the MCQ and writing blanks while preserving both scores', async () => {
    render(<MemoryRouter><Grade10TestsPage /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: /Practice Test 1/ }));
    expect(screen.getByText('Yesterday, he ____ home.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'A. went' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }));
    expect(screen.getByText('Chính xác!')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành' }));
    fireEvent.click(screen.getByRole('button', { name: 'Làm Part C →' }));
    expect(screen.getByText(/Our garden ____\./)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'has many flowers' } });
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }));
    expect(screen.getByText('2/2')).toBeInTheDocument();
  });
});
