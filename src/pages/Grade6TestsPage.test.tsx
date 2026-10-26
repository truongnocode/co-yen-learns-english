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
  it('makes the full reflowed option clickable without duplicating its text or changing grading', async () => {
    const compact = { ...fixture, sections: [{ ...fixture.sections[0], questions: [{ id: 'q1', number: '1', kind: 'choice', html: '<p>Choose the answer.</p><p>A. first</p><p>B. second</p><p>C. third</p><p>D. fourth</p>', answers: ['B'], options: ['A', 'B', 'C', 'D'] }] }] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, headers: { get: () => 'application/json' }, json: async () => compact }));
    mount();
    const article = await screen.findByRole('article', { name: 'Câu 1' });
    expect(within(article).getAllByText('B. second')).toHaveLength(1);
    fireEvent.click(within(article).getByText('B. second'));
    expect(within(article).getByRole('button', { name: 'B' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(article).getByText('✓ Chính xác!')).toBeInTheDocument();
  });
  it('cancels the result focus task when the learner leaves immediately after submitting', async () => {
    const view = mount('test');
    await screen.findByRole('article', { name: 'Câu 1' });
    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Nộp bài và xem kết quả' }));
      fireEvent.click(screen.getByRole('button', { name: /^Nộp bài$/ }));
      view.unmount();
      const lookup = vi.spyOn(document, 'getElementById');
      vi.advanceTimersByTime(100);
      expect(lookup).not.toHaveBeenCalledWith('exam-result');
    } finally { vi.useRealTimers(); }
  });
  it.each([{ grade: 8 as const, last: 17 }, { grade: 9 as const, last: 16 }])('opens the last grade $grade paper in test mode and saves it separately', async ({ grade, last }) => {
    const grade8 = { ...fixture, id: `vedec-g${grade}-2026-${last}`, subtitle: `Tiếng Anh ${grade}` };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, headers: { get: () => 'application/json' }, json: async () => grade8 });
    vi.stubGlobal('fetch', fetchMock);
    render(<MemoryRouter initialEntries={[`/grade/${grade}/tests/vedec-g${grade}-2026-${last}?mode=test`]}><Routes><Route path="/grade/:grade/tests/:examId" element={<Grade6TestsPage grade={grade} />} /></Routes></MemoryRouter>);
    expect(await screen.findByText(`Tiếng Anh ${grade}`)).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe(`/data/grade${grade}-midterm/vedec-g${grade}-2026-${last}.json`);
    expect(fetchMock.mock.calls[0][1].cache).toBe('no-cache');
    const first = screen.getByRole('article', { name: 'Câu 1' });
    fireEvent.click(within(first).getByRole('button', { name: 'T · Đúng' }));
    expect(screen.queryByText('✓ Chính xác!')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Chọn đề khác' })).toHaveAttribute('href', `/grade/${grade}/tests`);
    expect(localStorage.getItem(attemptKey(grade8.id, 'test'))).toContain('"q1":"T"');
    expect(localStorage.getItem(attemptKey(grade8.id, 'practice'))).toBeNull();
  });
  it('loads grade 7 data, links back to grade 7, and seeks shared recordings to the matching task', async () => {
    const grade7: Grade6Exam = {
      ...fixture, id: 'vedec-g7-2026-01', subtitle: 'Tiếng Anh 7',
      audio: [{ title: 'Bản ghi đầy đủ', src: '/shared.mp3', duration: 300, sourceName: 'source.mp3', sectionIds: ['s1'] }],
      sections: [{ ...fixture.sections[0], audioStart: 173 }],
    };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, headers: { get: () => 'application/json' }, json: async () => grade7 });
    vi.stubGlobal('fetch', fetchMock);
    render(<MemoryRouter initialEntries={['/grade/7/tests/vedec-g7-2026-01?mode=practice']}><Routes><Route path="/grade/7/tests/:examId" element={<Grade6TestsPage grade={7} />} /></Routes></MemoryRouter>);
    expect(await screen.findByText('Tiếng Anh 7')).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe('/data/grade7-midterm/vedec-g7-2026-01.json');
    expect(screen.getByRole('link', { name: 'Chọn đề khác' })).toHaveAttribute('href', '/grade/7/tests');
    const audio = document.querySelector('audio')!;
    fireEvent.loadedMetadata(audio);
    expect(audio.currentTime).toBe(173);
    fireEvent.click(within(screen.getByRole('article', { name: 'Câu 1' })).getByRole('button', { name: 'T · Đúng' }));
    expect(screen.getByText('✓ Chính xác!')).toBeInTheDocument();
    expect(localStorage.getItem(attemptKey(grade7.id, 'practice'))).toContain('"q1":"T"');
    expect(localStorage.getItem(attemptKey(fixture.id, 'practice'))).toBeNull();
  });
  it('places progress above the matching listening players, including shared full recordings', async () => {
    const listening: Grade6Exam = {
      ...fixture,
      audio: [
        { title: 'Bài nghe 1', src: '/first.mp3', duration: 60, sourceName: 'first.mp3' },
        { title: 'Bài nghe 2', src: '/second.mp3', duration: 90, sourceName: 'second.mp3' },
      ],
      sections: [
        { ...fixture.sections[0], title: 'Listening I', questions: [fixture.sections[0].questions[0]] },
        { ...fixture.sections[0], id: 's2', title: 'Listening II', questions: [fixture.sections[0].questions[1]] },
        { ...fixture.sections[0], id: 's3', title: 'Writing', part: 'WRITING', questions: [fixture.sections[0].questions[2]] },
      ],
    };
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => listening })));
    const view = mount();
    const progress = await screen.findByText('Đã làm 0/3 câu / bài');
    const first = document.querySelector('#s1 audio')!;
    expect(first).toHaveAttribute('src', '/first.mp3');
    expect(document.querySelector('#s2 audio')).toHaveAttribute('src', '/second.mp3');
    expect(document.querySelector('#s3 audio')).toBeNull();
    expect(progress.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    view.unmount();
    listening.audio = [listening.audio[0]];
    mount();
    await screen.findByText('Listening II');
    expect(document.querySelector('#s1 audio')).toHaveAttribute('src', '/first.mp3');
    expect(document.querySelector('#s2 audio')).toHaveAttribute('src', '/first.mp3');
    expect(document.querySelector('#s1 audio')?.id).not.toBe(document.querySelector('#s2 audio')?.id);
  });
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
