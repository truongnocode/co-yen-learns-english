import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Grade6TestsPage from './Grade6TestsPage';
import { attemptKey, type Grade6Exam } from '@/lib/grade6Exam';

vi.mock('@/components/PageShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
const fixture: Grade6Exam = {
  id: 'vedec-2026-01', number: 1, title: 'Đề 01', subtitle: 'Tiếng Anh 6', audio: [],
  sections: [{ id: 's1', title: 'LISTENING', part: 'LISTENING', introHtml: '', questions: [
    { id: 'q1', number: '1', kind: 'tf', html: '<p>A listening statement.</p>', answers: ['T'], options: ['T', 'F'] },
    { id: 'q2', number: '2', kind: 'text', html: '<p>Fill in the blank.</p>', answers: ['are not'] },
    { id: 'q3', number: '3', kind: 'manual', html: '<p>Write about your house.</p>', answers: [] },
  ] }],
};
function mount(mode = 'practice') {
  return render(<MemoryRouter initialEntries={[`/grade/6/tests/vedec-2026-01?mode=${mode}`]}><Routes><Route path="/grade/6/tests/:examId" element={<Grade6TestsPage />} /></Routes></MemoryRouter>);
}
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, headers: { get: () => 'application/json' }, json: async () => fixture }));
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('exam modes', () => {
  it('gives immediate choice feedback, checks typed answers on request, and resumes after reload', async () => {
    const view = mount();
    const first = await screen.findByRole('article', { name: 'Câu 1' });
    fireEvent.click(within(first).getByRole('button', { name: 'T · Đúng' }));
    expect(within(first).getByText('✓ Chính xác!')).toBeInTheDocument();
    expect(within(first).getByRole('button', { name: 'F · Sai' })).toBeDisabled();
    const second = screen.getByRole('article', { name: 'Câu 2' });
    fireEvent.change(within(second).getByRole('textbox'), { target: { value: "aren't" } });
    expect(within(second).queryByText('✓ Chính xác!')).not.toBeInTheDocument();
    fireEvent.click(within(second).getByRole('button', { name: 'Kiểm tra câu này' }));
    expect(within(second).getByText('✓ Chính xác!')).toBeInTheDocument();
    view.unmount(); mount();
    expect(await screen.findAllByText('✓ Chính xác!')).toHaveLength(2);
  });
  it('hides feedback until confirmed submission, allows changes, and separates mode progress', async () => {
    localStorage.setItem(attemptKey(fixture.id, 'practice'), JSON.stringify({ answers: { q1: 'T' }, checked: ['q1'], submitted: true, startedAt: Date.now() }));
    mount('test');
    const first = await screen.findByRole('article', { name: 'Câu 1' });
    fireEvent.click(within(first).getByRole('button', { name: 'F · Sai' }));
    fireEvent.click(within(first).getByRole('button', { name: 'T · Đúng' }));
    expect(screen.queryByText(/Đáp án:/)).not.toBeInTheDocument();
    expect(screen.queryByText('✓ Chính xác!')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài và xem kết quả' }));
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }));
    expect(screen.queryByText('Em đã hoàn thành!')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài và xem kết quả' }));
    fireEvent.click(screen.getByRole('button', { name: /^Nộp bài$/ }));
    expect(await screen.findByText('Đúng 1/2 câu chấm tự động')).toBeInTheDocument();
    expect(screen.getByText('1 câu / bài cần tự đối chiếu hoặc nhờ cô chấm, không tính trong điểm trên. Đây là kết quả phần tự động, chưa phải điểm toàn bộ đề gốc.')).toBeInTheDocument();
  });
});
