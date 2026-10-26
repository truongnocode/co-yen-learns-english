import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { loadSubmission, loadSubmissionPage, loadTeacherReview, saveTeacherReview, type SubmissionRecord, type TeacherReview } from '@/lib/examSubmissions';
import type { QueryDocumentSnapshot } from 'firebase/firestore';

const field = 'w-full rounded-xl border border-border bg-card px-3 py-2.5';
const button = 'min-h-11 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50';
const date = (value: number) => new Date(value).toLocaleString('vi-VN');
const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const duration = (start: number, end: number) => `${Math.max(1, Math.round((end - start) / 60000))} phút`;

export default function StudentResults() {
  const [rows, setRows] = useState<SubmissionRecord[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot>();
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [grade, setGrade] = useState('');
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('');
  async function load(more = false) {
    setLoading(true); setError('');
    try {
      const page = await loadSubmissionPage(more ? cursor : undefined);
      setRows(previous => more ? [...previous, ...page.rows] : page.rows);
      setCursor(page.cursor); setHasMore(page.hasMore);
    } catch { setError('Không tải được kết quả. Kiểm tra kết nối và quyền giáo viên rồi thử lại.'); }
    finally { setLoading(false); }
  }
  // Initial fetch deliberately has no cursor; later pages use the explicit button.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);
  const filtered = rows.filter(row => (!grade || String(row.grade) === grade) && (!mode || row.mode === mode) && normalize(`${row.studentName} ${row.className} ${row.examTitle} ${row.examId}`).includes(normalize(search.trim())));
  return <div className="mx-auto max-w-6xl">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-2xl font-extrabold">Kết quả học sinh</h2><p className="mt-1 text-sm text-muted-foreground">Bài đã được học sinh gửi cho cô · Lớp 6–10</p></div><button className={button} disabled={loading} onClick={() => void load()}>Làm mới</button></div>
    <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_10rem_12rem]">
      <input aria-label="Tìm học sinh, lớp hoặc đề" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên học sinh, lớp hoặc đề…" className={field} />
      <select aria-label="Khối lớp" value={grade} onChange={e => setGrade(e.target.value)} className={field}><option value="">Tất cả khối</option>{[6, 7, 8, 9, 10].map(g => <option key={g} value={g}>Lớp {g}</option>)}</select>
      <select aria-label="Chế độ làm bài" value={mode} onChange={e => setMode(e.target.value)} className={field}><option value="">Cả hai chế độ</option><option value="test">Kiểm tra</option><option value="practice">Luyện tập</option></select>
    </div>
    {error && <p role="alert" className="mb-4 text-destructive">{error}</p>}
    <p role="status" className="mb-3 text-sm text-muted-foreground">{loading ? 'Đang tải kết quả…' : `${filtered.length} bài phù hợp trong ${rows.length} bài đã tải${hasMore ? ' · Còn bài cũ hơn, bấm Tải thêm bên dưới.' : ''}`}</p>
    <div className="space-y-3">{filtered.map(row => <Link key={row.id} to={`/admin/results/${row.id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-1 hover:border-primary">
      <div className="min-w-0"><h3 className="break-words font-extrabold">{row.studentName} <span className="font-normal text-muted-foreground">· {row.className}</span></h3><p className="mt-1 break-words text-sm">Lớp {row.grade} · {row.examTitle}</p><p className="mt-1 text-xs text-muted-foreground">{date(row.finishedAt)} · {duration(row.startedAt, row.finishedAt)} · {row.mode === 'test' ? 'Kiểm tra' : 'Luyện tập — xem đáp án ngay'}</p></div>
      <div className="text-right"><strong className="text-xl text-primary">{row.score}/10</strong><p className="text-xs">Đúng {row.correct}/{row.total}</p>{row.manual > 0 && <p className="mt-1 text-xs text-muted-foreground">{row.manual} câu cần cô xem</p>}<span className="mt-2 block text-sm font-bold text-primary">Xem bài →</span></div>
    </Link>)}</div>
    {!loading && !error && !filtered.length && <p className="rounded-2xl border p-6 text-center text-muted-foreground">Chưa có bài nộp phù hợp. Học sinh cần nộp và thấy thông báo “Đã gửi kết quả cho cô”.</p>}
    {hasMore && <button className={`${button} mt-5`} disabled={loading} onClick={() => void load(true)}>Tải thêm bài cũ hơn</button>}
    <p className="mt-5 text-xs leading-relaxed text-muted-foreground">Điểm tự động do ứng dụng chấm theo đáp án, các câu cùng trọng số; chưa phải điểm toàn đề gốc. Tên và lớp do học sinh khai. Bài luyện tập có thể đã xem đáp án trước khi gửi. Bài lưu trên thiết bị trước khi có tính năng này chỉ xuất hiện khi học sinh mở lại và gửi kết quả.</p>
  </div>;
}

export function StudentResultDetail() {
  const { resultId } = useParams();
  const { user } = useAuth();
  const [row, setRow] = useState<SubmissionRecord | null>(null);
  const [review, setReview] = useState<TeacherReview>({ comment: '', writingScore: null, reviewedBy: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    Promise.all([loadSubmission(resultId!), loadTeacherReview(resultId!)]).then(([data, feedback]) => { if (active) { setRow(data); if (feedback) setReview(feedback); } }).catch(() => { if (active) setError('Không tải được bài nộp. Hãy thử lại.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [resultId, retry]);
  async function save() {
    if (!resultId || !user || review.writingScore !== null && (!Number.isFinite(review.writingScore) || review.writingScore < 0 || review.writingScore > 10)) return;
    setSaving(true); setSaved(false); setError('');
    try { await saveTeacherReview(resultId, { ...review, reviewedBy: user.email || user.uid }); setSaved(true); }
    catch { setError('Chưa lưu được nhận xét. Vui lòng thử lại.'); }
    finally { setSaving(false); }
  }
  return <div className="mx-auto max-w-4xl">
    <Link to="/admin/results" className="mb-4 inline-block font-bold text-primary">← Kết quả học sinh</Link>
    {error && <p role="alert" className="mb-3 text-destructive">{error} <button onClick={() => setRetry(x => x + 1)} className="underline">Tải lại</button></p>}
    {loading ? <p role="status">Đang tải bài làm…</p> : !row ? <p>Không tìm thấy bài nộp.</p> : <>
      <header className="mb-5 rounded-2xl border bg-card p-5"><h2 className="break-words font-display text-2xl font-extrabold">{row.studentName} · {row.className}</h2><p className="mt-2">Lớp {row.grade} · {row.examTitle}</p><p className="mt-1 text-sm text-muted-foreground">{date(row.finishedAt)} · {duration(row.startedAt, row.finishedAt)} · {row.mode === 'test' ? 'Kiểm tra' : 'Luyện tập — xem đáp án ngay'}</p><p className="mt-3 text-xl font-bold text-primary">Điểm tự động: {row.score}/10 · Đúng {row.correct}/{row.total}</p><p className="mt-1 text-sm text-muted-foreground">{row.manual} câu / bài cần cô xem riêng. Các câu tự động có cùng trọng số.</p></header>
      <section aria-label="Nhận xét của giáo viên" className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-4"><h3 className="mb-3 font-extrabold">Nhận xét của cô</h3><label className="block text-sm font-bold">Điểm phần cô chấm (0–10, có thể để trống)<input type="number" min="0" max="10" step="0.1" value={review.writingScore ?? ''} onChange={e => { setSaved(false); setReview({ ...review, writingScore: e.target.value === '' ? null : Number(e.target.value) }); }} className={`${field} mt-1 max-w-36`} /></label><p className="mt-1 text-xs text-muted-foreground">Lưu riêng, không cộng vào điểm tự động vì mỗi đề có cách chia điểm khác nhau.</p><label className="mt-3 block text-sm font-bold">Nhận xét<textarea maxLength={5000} rows={3} value={review.comment} onChange={e => { setSaved(false); setReview({ ...review, comment: e.target.value }); }} className={`${field} mt-1`} /></label><button onClick={() => void save()} disabled={saving || review.writingScore !== null && (!Number.isFinite(review.writingScore) || review.writingScore < 0 || review.writingScore > 10)} className={`${button} mt-3`}>{saving ? 'Đang lưu…' : 'Lưu nhận xét'}</button>{saved && <p role="status" className="mt-2 font-bold text-primary">Đã lưu nhận xét.</p>}</section>
      <h3 className="mb-3 font-display text-xl font-extrabold">Chi tiết bài làm</h3>
      <div className="space-y-3">{row.questions.map((q, i) => <article key={`${q.id}-${i}`} className="rounded-2xl border bg-card p-4" aria-label={`Câu ${q.number}`}><div className="mb-2 flex flex-wrap justify-between gap-2"><strong>Câu {q.number} · {q.section}</strong><span className={`text-sm font-bold ${q.status === 'correct' ? 'text-primary' : q.status === 'manual' ? 'text-muted-foreground' : 'text-destructive'}`}>{q.status === 'correct' ? 'Đúng' : q.status === 'manual' ? 'Cần cô xem' : q.answer.trim() ? 'Chưa đúng' : 'Chưa trả lời'}</span></div>{q.context && <details className="mb-2 text-sm"><summary className="cursor-pointer text-primary">Đoạn đọc / hướng dẫn</summary><p className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-muted p-3">{q.context}</p></details>}<p className="whitespace-pre-wrap break-words">{q.prompt}</p>{q.options.length > 0 && <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">{q.options.map((option, n) => <span key={n} className="break-words">{option}</span>)}</div>}<div className="mt-3 rounded-xl bg-muted p-3"><p className="text-xs font-bold text-muted-foreground">HỌC SINH TRẢ LỜI</p><p className="mt-1 whitespace-pre-wrap break-words">{q.answer || '— Chưa trả lời —'}</p></div>{q.expected.length > 0 && <p className="mt-2 whitespace-pre-wrap break-words text-sm"><strong>Đáp án{q.status === 'manual' ? ' tham khảo' : ''}:</strong> {q.expected.join(' / ')}</p>}</article>)}</div>
    </>}
  </div>;
}
