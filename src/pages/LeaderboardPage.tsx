import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Trophy } from 'lucide-react';
import PageShell from '@/components/PageShell';
import { loadExamLeaderboard } from '@/lib/examLeaderboardStore';
import { rankExamStudents, searchLeaderboardText } from '@/lib/examLeaderboard';

const number = (value: number) => value.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
export default function LeaderboardPage() {
  const [params, setParams] = useSearchParams();
  const grade = [6, 7, 8, 9, 10].includes(Number(params.get('grade'))) ? Number(params.get('grade')) : 6;
  const mode = params.get('mode') === 'practice' ? 'practice' : 'test';
  const exam = params.get('exam') || '';
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(50);
  const { data = [], isLoading, isFetching, error, refetch, dataUpdatedAt } = useQuery({ queryKey: ['exam-leaderboard', grade], queryFn: () => loadExamLeaderboard(grade), staleTime: 30_000 });
  function select(values: Record<string, string>) { setParams({ grade: String(grade), mode, ...values }); setShown(50); setSearch(''); }
  const papers = useMemo(() => [...new Map(data.filter(r => r.mode === mode).map(r => [r.examId, r.examTitle])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'vi', { numeric: true })), [data, mode]);
  const ranked = useMemo(() => rankExamStudents(data, grade, mode, exam), [data, grade, mode, exam]);
  const filtered = ranked.filter(row => searchLeaderboardText(`${row.studentName} ${row.className}`).includes(searchLeaderboardText(search)));
  return <PageShell><main className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6">
    <header className="mb-6 flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="mb-2 flex items-center gap-2 text-xs font-extrabold text-primary sm:text-sm"><Trophy className="h-5 w-5" aria-hidden /> CÙNG NHAU TIẾN BỘ</p><h1 className="font-display text-3xl font-extrabold sm:text-4xl">Bảng xếp hạng</h1><p className="mt-2 text-sm text-muted-foreground sm:text-base">Điểm bài đã nộp · Ai cũng xem được</p></div>
      <button aria-label="Làm mới" title="Làm mới" onClick={() => void refetch()} disabled={isFetching} className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border bg-card px-3 font-bold disabled:opacity-50 sm:px-4"><RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden /><span className="hidden sm:inline">Làm mới</span></button>
    </header>
    <div className="mb-4 grid grid-cols-5 gap-2" aria-label="Chọn khối lớp">{[6, 7, 8, 9, 10].map(g => <button key={g} aria-pressed={grade === g} onClick={() => select({ grade: String(g), exam: '' })} className={`min-h-12 rounded-xl border px-1 text-sm font-extrabold sm:text-base ${grade === g ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary'}`}>Lớp {g}</button>)}</div>
    <div className="mb-5 flex flex-wrap gap-2" aria-label="Chọn chế độ">{(['test', 'practice'] as const).map(m => <button key={m} aria-pressed={mode === m} onClick={() => select({ mode: m, exam: '' })} className={`min-h-11 rounded-full px-5 font-bold ${mode === m ? 'bg-primary/10 text-primary ring-1 ring-primary/30' : 'bg-muted text-muted-foreground'}`}>{m === 'test' ? 'Kiểm tra' : 'Luyện tập'}</button>)}</div>
    <details className="mb-5 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm leading-relaxed"><summary className="cursor-pointer font-bold text-primary">Cộng điểm cao nhất mỗi đề · Cách tính</summary><p className="mt-2">Cộng điểm cao nhất của mỗi đề (thang 10). Làm lại cùng đề không cộng thêm lượt. Bằng tổng điểm thì xét điểm trung bình; bằng cả hai thì đồng hạng.</p>{mode === 'practice' && <p className="mt-1 font-semibold">Bảng luyện tập riêng vì học sinh có thể xem đáp án ngay.</p>}<p className="mt-1 text-muted-foreground">Chỉ tính điểm tự động, chưa gồm phần cô chấm riêng. Tên và lớp do học sinh nhập.</p></details>
    <div className="mb-4 grid gap-3 sm:grid-cols-2"><input aria-label="Tìm học sinh hoặc lớp" value={search} onChange={e => { setSearch(e.target.value); setShown(50); }} placeholder="Tìm tên học sinh hoặc lớp…" className="min-h-11 min-w-0 rounded-xl border bg-card px-3" /><select aria-label="Lọc theo đề" value={exam} onChange={e => select({ exam: e.target.value })} className="min-h-11 min-w-0 rounded-xl border bg-card px-3"><option value="">Tất cả đề trong khối</option>{papers.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></div>
    {error && <p role="alert" className="mb-4 rounded-xl border border-destructive/30 p-4 text-destructive">Chưa tải được bảng xếp hạng. Kiểm tra kết nối rồi bấm Làm mới.</p>}
    {isLoading ? <p role="status" className="py-12 text-center text-muted-foreground">Đang tải bảng xếp hạng…</p> : <>
      <p role="status" className="mb-3 text-sm text-muted-foreground">{filtered.length} học sinh{dataUpdatedAt > 0 && ` · Cập nhật ${new Date(dataUpdatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}</p>
      {filtered.length > 0 ? <div className="overflow-hidden rounded-2xl border bg-card shadow-1"><table className="w-full table-fixed text-sm"><caption className="sr-only">Xếp hạng lớp {grade} · {mode === 'test' ? 'Kiểm tra' : 'Luyện tập'}</caption><thead className="bg-muted/60 text-left text-xs text-muted-foreground"><tr><th scope="col" className="w-12 px-2 py-3 text-center sm:w-16">Hạng</th><th scope="col" className="px-2 py-3">Học sinh</th><th scope="col" className="w-20 px-2 py-3 text-right sm:w-28">Tổng điểm</th><th scope="col" className="hidden w-20 px-2 py-3 text-center sm:table-cell">Số đề</th><th scope="col" className="w-16 px-2 py-3 text-right sm:w-28">TB /10</th></tr></thead><tbody>{filtered.slice(0, shown).map(row => <tr key={row.key} className="border-t"><td className="px-2 py-4 text-center"><span className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-extrabold ${row.rank === 1 ? 'bg-xp text-xp-foreground' : row.rank <= 3 ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>{row.rank}</span></td><th scope="row" className="break-words px-2 py-4 text-left font-bold">{row.studentName}<span className="mt-1 block text-xs font-normal text-muted-foreground">{row.className}<span className="sm:hidden"> · {row.papers} đề</span></span></th><td className="px-2 py-4 text-right text-base font-extrabold text-primary">{number(row.points)}</td><td className="hidden px-2 py-4 text-center sm:table-cell">{row.papers}</td><td className="px-2 py-4 text-right font-bold">{number(row.average)}</td></tr>)}</tbody></table></div> : !error && <div className="rounded-2xl border border-dashed p-8 text-center"><Trophy className="mx-auto mb-3 h-9 w-9 text-primary/60" aria-hidden /><p className="font-extrabold">{search ? 'Chưa tìm thấy học sinh phù hợp' : 'Chưa có kết quả ở mục này'}</p><p className="mt-2 text-sm text-muted-foreground">{search ? 'Thử tìm lại tên hoặc lớp.' : 'Nộp bài để ghi điểm trên bảng xếp hạng nhé!'}</p><Link to={`/grade/${grade}/tests`} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-bold text-primary-foreground">Chọn đề lớp {grade} →</Link></div>}
      {filtered.length > shown && <button className="mt-4 min-h-11 w-full rounded-xl border bg-card font-bold text-primary" onClick={() => setShown(n => n + 50)}>Xem thêm học sinh</button>}
    </>}
  </main></PageShell>;
}
