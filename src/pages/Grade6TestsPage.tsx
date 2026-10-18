import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Headphones, RotateCcw, Save, Zap } from 'lucide-react';
import PageShell from '@/components/PageShell';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MIDTERM_EXAM_COUNTS, isValidMidtermExamId, type ExamGrade, attemptKey, examResult, isAutoScored, isCorrectExamAnswer, newAttempt, restoreAttempt, type ExamAttempt, type ExamMode, type ExamQuestion, type ExamSummary, type Grade6Exam } from '@/lib/grade6Exam';
import './grade6-tests.css';

const button = 'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50';
const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 font-bold hover:bg-muted';

async function getData<T,>(grade: ExamGrade, path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`/data/grade${grade}-midterm/${path}`, { signal, cache: 'no-cache' });
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Không tải được đề. Em hãy thử lại.');
  return response.json();
}

function ModePicker({ mode, onChange }: { mode: ExamMode; onChange: (mode: ExamMode) => void }) {
  return <fieldset className="grid gap-3 sm:grid-cols-2">
    <legend className="mb-3 font-display text-lg font-extrabold">Em muốn học theo cách nào?</legend>
    {([
      { id: 'practice', title: 'Luyện tập', detail: 'Chọn đáp án là biết đúng sai. Câu điền từ có nút kiểm tra.', icon: Zap },
      { id: 'test', title: 'Làm bài kiểm tra', detail: 'Tự làm toàn bộ đề. Chỉ xem đáp án và kết quả sau khi nộp.', icon: ClipboardCheck },
    ] as const).map(item => <label key={item.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 ${mode === item.id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
      <input type="radio" name="exam-mode" value={item.id} checked={mode === item.id} onChange={() => onChange(item.id)} className="mt-1 accent-primary" />
      <span><span className="flex items-center gap-2 font-extrabold"><item.icon className="h-4 w-4" />{item.title}</span><span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{item.detail}</span></span>
    </label>)}
  </fieldset>;
}

function ExamCatalog({ grade }: { grade: ExamGrade }) {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [mode, setMode] = useState<ExamMode>('practice');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setError('');
    getData<ExamSummary[]>(grade, 'index.json', controller.signal).then(setExams).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [grade, retry]);
  return <PageShell><main className="mx-auto max-w-5xl px-4 pb-16 pt-28 sm:px-6">
    <Link to={`/grade/${grade}`} className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Lớp {grade}</Link>
    <header className="my-6 rounded-3xl bg-primary p-6 text-primary-foreground sm:p-9">
      <span className="text-sm font-bold opacity-85">GLOBAL SUCCESS · VEDEC 2026</span>
      <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Cùng ôn thi giữa kỳ I</h1>
      <p className="mt-3 max-w-2xl leading-relaxed opacity-90">{MIDTERM_EXAM_COUNTS[grade]} đề Tiếng Anh lớp {grade}, có bài nghe và đáp án. Chọn cách học, chọn một đề và bắt đầu nhé!</p>
      <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold"><span className="rounded-full bg-white/15 px-3 py-1.5">{MIDTERM_EXAM_COUNTS[grade]} đề tham khảo</span><span className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5"><Headphones className="h-4 w-4" /> Có file nghe gốc</span></div>
    </header>
    <ModePicker mode={mode} onChange={setMode} />
    <p className="my-5 text-sm leading-relaxed text-muted-foreground">Phần viết đoạn văn và nói để em tự luyện, đối chiếu hướng dẫn hoặc nhờ cô chấm. Bài làm được lưu trên trình duyệt của thiết bị này.</p>
    {error ? <div role="alert" className="rounded-2xl border p-5">{error}<button className={`${secondary} ml-3`} onClick={() => setRetry(x => x + 1)}>Thử lại</button></div> : !exams.length ? <p role="status">Đang tải danh sách đề…</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {exams.map(exam => <Link key={exam.id} to={`/grade/${grade}/tests/${exam.id}?mode=${mode}`} className="group rounded-2xl border border-border bg-card p-5 shadow-1 transition hover:-translate-y-1 hover:shadow-2">
        <div className="mb-4 flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 font-display text-xl font-extrabold text-primary">{String(exam.number).padStart(2, '0')}</span><Headphones className="h-5 w-5 text-primary" aria-hidden /></div>
        <h2 className="font-display text-xl font-extrabold">{exam.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Giữa học kỳ I · Tiếng Anh {grade}</p>
        <p className="mt-3 text-sm text-muted-foreground">{exam.questionCount} câu / bài · {exam.audioCount} file nghe</p>
        <span className="mt-5 flex items-center gap-2 font-bold text-primary">{mode === 'practice' ? 'Vào luyện tập' : 'Vào làm bài'}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
      </Link>)}
    </div>}
  </main></PageShell>;
}

function AudioTrack({ track, sectionId, startAt }: { track: Grade6Exam['audio'][number]; sectionId: string; startAt?: number }) {
  const [error, setError] = useState(false);
  return <div className="rounded-2xl border border-border bg-card p-4">
    <label htmlFor={`track-${sectionId}`} className="mb-2 block font-bold">{track.title}</label>
    <audio id={`track-${sectionId}`} aria-label={track.title} controls preload="metadata" src={track.src} onLoadedMetadata={event => { if (startAt) event.currentTarget.currentTime = startAt; }} onError={() => setError(true)} onPlay={event => {
      document.querySelectorAll('audio').forEach(player => { if (player !== event.currentTarget) player.pause(); });
    }} className="w-full" />
    <a className="mt-2 inline-block text-xs font-semibold text-primary underline" href={track.src} target="_blank" rel="noreferrer">{error ? 'Chưa phát được. Mở file nghe riêng' : 'Mở file nghe riêng'}</a>
  </div>;
}

function RichText({ value }: { value: string }) {
  // Only trusted static HTML produced by the local DOCX importer; never student HTML.
  return <div className="exam-source" lang="en" dangerouslySetInnerHTML={{ __html: value }} />;
}

function QuestionCard({ question: q, attempt, mode, onAnswer, onCheck }: { question: ExamQuestion; attempt: ExamAttempt; mode: ExamMode; onAnswer: (id: string, answer: string) => void; onCheck: (id: string) => void }) {
  const value = attempt.answers[q.id] ?? '';
  const revealed = attempt.submitted || (mode === 'practice' && attempt.checked.includes(q.id));
  const scored = isAutoScored(q);
  const correct = isCorrectExamAnswer(q, value);
  const locked = attempt.submitted || (revealed && scored);
  return <article id={q.id} className="scroll-mt-24 rounded-2xl border border-border bg-card p-4 shadow-1 sm:p-6" aria-label={`Câu ${q.number}`}>
    <div className="mb-3 flex items-center justify-between gap-3"><span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-extrabold">Câu {q.number}</span>{q.kind === 'manual' && <span className="text-xs font-bold text-muted-foreground">Tự luyện · nhờ cô chấm</span>}</div>
    <RichText value={q.html} />
    {q.options ? <div role="group" aria-label={`Đáp án câu ${q.number}`} className="mt-4 flex flex-wrap gap-3">
      {q.options.map(option => <button key={option} type="button" disabled={locked} aria-pressed={value === option} onClick={() => onAnswer(q.id, option)} className={`min-h-12 min-w-14 rounded-xl border-2 px-4 py-3 font-extrabold transition-colors disabled:cursor-default ${value === option ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary hover:bg-primary/5'} ${revealed && scored && q.answers.includes(option) ? '!border-success !bg-success/10 !text-foreground' : ''}`}>{option === 'T' ? 'T · Đúng' : option === 'F' ? 'F · Sai' : option}</button>)}
    </div> : <div className="mt-4">
      <label htmlFor={`answer-${q.id}`} className="mb-2 block text-sm font-bold">{q.kind === 'manual' ? 'Bài làm của em' : 'Câu trả lời của em'}</label>
      {q.kind === 'manual' ? <><textarea id={`answer-${q.id}`} lang="en" value={value} disabled={locked} maxLength={10000} onChange={e => onAnswer(q.id, e.target.value)} rows={6} className="w-full rounded-xl border-2 border-border bg-background p-3 outline-none focus:border-primary" placeholder="Viết bài hoặc ghi chú để luyện nói…" /><p className="mt-1 text-xs text-muted-foreground">{value.trim() ? value.trim().split(/\s+/).length : 0} từ</p></> : <><input id={`answer-${q.id}`} lang="en" autoComplete="off" spellCheck={false} value={value} disabled={locked} maxLength={1000} onChange={e => onAnswer(q.id, e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && mode === 'practice' && value.trim()) onCheck(q.id); }} className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="Nhập phần còn thiếu hoặc câu trả lời đầy đủ" /><p className="mt-2 text-xs text-muted-foreground">Nếu có nhiều chỗ trống, nhập theo thứ tự, cách nhau bằng dấu /.</p></>}
      {mode === 'practice' && !revealed && q.kind !== 'manual' && <button className={`${button} mt-3`} disabled={!value.trim()} onClick={() => onCheck(q.id)}>Kiểm tra câu này</button>}
    </div>}
    {q.note && (!scored || revealed) && <p className="mt-4 rounded-xl bg-muted p-3 text-sm leading-relaxed">{q.note}</p>}
    {revealed && <div role="status" className={`mt-4 rounded-xl p-4 text-sm leading-relaxed ${scored && correct ? 'bg-success/10' : 'bg-muted'}`}>
      {scored ? <><p className="font-extrabold">{!value.trim() ? 'Em chưa trả lời câu này.' : correct ? '✓ Chính xác!' : q.kind === 'text' ? 'Câu trả lời chưa khớp đáp án mẫu.' : 'Em chưa chọn đúng.'}</p><p className="mt-1">Đáp án{q.kind === 'text' ? ' mẫu' : ''}: <strong lang="en">{q.kind === 'text' ? q.answers[0] : q.answers.join(' / ')}</strong></p></> : <p className="font-semibold">{q.kind === 'manual' ? 'Em có thể nhờ cô xem và chấm bài này.' : 'Câu này không tính vào điểm tự động.'}</p>}
      {q.referenceHtml && <details className="mt-3"><summary className="cursor-pointer font-bold text-primary">{q.kind === 'manual' ? 'Xem hướng dẫn / bài tham khảo' : 'Xem đối chiếu đáp án'}</summary><div className="mt-3"><RichText value={q.referenceHtml} /></div></details>}
    </div>}
  </article>;
}

function ExamPlayer({ exam, mode, grade }: { exam: Grade6Exam; mode: ExamMode; grade: ExamGrade }) {
  const questions = exam.sections.flatMap(s => s.questions);
  const listeningSections = exam.sections.filter(s => s.part === 'LISTENING' && s.questions.length);
  const [attempt, setAttempt] = useState<ExamAttempt>(() => {
    try { return restoreAttempt(localStorage.getItem(attemptKey(exam.id, mode)), questions) ?? newAttempt(); } catch { return newAttempt(); }
  });
  const [storageError, setStorageError] = useState(false);
  const [confirm, setConfirm] = useState<'submit' | 'reset' | null>(null);
  const resultFocusTimer = useRef<number>();
  useEffect(() => () => {
    if (resultFocusTimer.current !== undefined) window.clearTimeout(resultFocusTimer.current);
  }, []);
  const result = examResult(questions, attempt.answers);
  const answered = questions.filter(q => !!attempt.answers[q.id]?.trim()).length;
  const unanswered = questions.length - answered;
  useEffect(() => {
    try { localStorage.setItem(attemptKey(exam.id, mode), JSON.stringify(attempt)); setStorageError(false); } catch { setStorageError(true); }
  }, [attempt, exam.id, mode]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      // Flush the latest attempt even when navigation happens before the debounce.
      try { localStorage.setItem(attemptKey(exam.id, mode), JSON.stringify(attempt)); } catch { if (!attempt.submitted && answered) { event.preventDefault(); event.returnValue = ''; } }
    };
    window.addEventListener('beforeunload', guard);return () => window.removeEventListener('beforeunload', guard);
  }, [attempt, answered, exam.id, mode]);
  const onAnswer = (id: string, answer: string) => setAttempt(current => {
    if (current.submitted || mode === 'practice' && current.checked.includes(id) && isAutoScored(questions.find(q => q.id === id)!)) return current;
    return { ...current, answers: { ...current.answers, [id]: answer }, checked: mode === 'practice' && questions.find(q => q.id === id)?.options ? [...new Set([...current.checked, id])] : current.checked };
  });
  return <>
    <div className="my-6 flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-bold text-primary">{mode === 'practice' ? 'LUYỆN TẬP · CHẤM NGAY' : 'LÀM BÀI KIỂM TRA · CHẤM SAU KHI NỘP'}</p><h1 className="mt-2 font-display text-3xl font-extrabold">{exam.title} · Giữa kỳ I</h1><p className="mt-2 text-sm text-muted-foreground">{exam.subtitle}</p></div>
      <button className={secondary} onClick={() => setConfirm('reset')}><RotateCcw className="h-4 w-4" /> Làm lại</button>
    </div>
    <div className="sticky top-20 z-20 mb-6 rounded-2xl border border-border bg-card/95 p-4 shadow-1 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-bold">{attempt.submitted ? 'Đã nộp bài' : `Đã làm ${answered}/${questions.length} câu / bài`}</p><span className={`flex items-center gap-1 text-xs ${storageError ? 'text-destructive' : 'text-muted-foreground'}`}><Save className="h-3 w-3" />{storageError ? 'Không lưu được trên thiết bị này' : 'Lưu trên thiết bị này'}</span></div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${answered / Math.max(1, questions.length) * 100}%` }} /></div>
      <nav aria-label="Các phần trong đề" className="mt-3 flex flex-wrap gap-2">{exam.sections.filter((s, i, sections) => s.questions.length && sections.findIndex(other => other.part === s.part && other.questions.length) === i).map(s => <a key={s.id} href={`#${s.id}`} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-bold hover:bg-primary/10">{s.part === 'LISTENING' ? 'Nghe' : s.part === 'READING' ? 'Đọc' : s.part === 'WRITING' ? 'Viết' : s.part === 'SPEAKING' ? 'Nói' : 'Ngôn ngữ'}</a>)}</nav>
    </div>
    {attempt.submitted && <section id="exam-result" tabIndex={-1} className="mb-8 scroll-mt-52 rounded-3xl border-2 border-primary bg-primary/5 p-6" aria-label="Kết quả bài làm">
      <CheckCircle2 className="mb-3 h-8 w-8 text-primary" /><h2 className="font-display text-2xl font-extrabold">Em đã hoàn thành!</h2>
      <p className="mt-3 text-xl font-bold">Đúng {result.correct}/{result.total} câu chấm tự động</p><p className="mt-2 text-sm text-muted-foreground">Điểm luyện tập quy đổi: <strong className="text-foreground">{result.score}/10</strong>. Các câu có cùng trọng số.</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{result.manual} câu / bài cần tự đối chiếu hoặc nhờ cô chấm, không tính trong điểm trên. Đây là kết quả phần tự động, chưa phải điểm toàn bộ đề gốc.</p>
      <p className="mt-3 font-semibold">Xem từng câu phía dưới để đối chiếu và học lại nhé.</p>
    </section>}
    <div className="space-y-6">{exam.sections.map(section => {
      const listeningIndex = listeningSections.findIndex(s => s.id === section.id);
      const track = exam.audio.find(a => a.sectionIds?.includes(section.id)) ?? (listeningIndex >= 0 && !exam.audio.some(a => a.sectionIds) ? exam.audio[exam.audio.length === 1 ? 0 : listeningIndex] : undefined);
      return <section key={section.id} id={section.id} className="scroll-mt-52">
      <h2 className={`mb-4 font-display font-extrabold ${section.questions.length ? 'text-lg' : 'border-b border-border pb-3 text-xl text-primary'}`}>{section.title}</h2>
      {track && <div role="region" aria-label={`Bài nghe cho ${section.title}`} className="mb-4 rounded-3xl bg-primary/5 p-4 sm:p-6">
        <h3 className="mb-2 flex items-center gap-2 font-display text-lg font-extrabold"><Headphones className="h-5 w-5 text-primary" /> Nghe cùng bài</h3>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{exam.audio.length === 1 && listeningSections.length > 1 ? 'File nghe đầy đủ dùng chung cho các phần nghe của đề. Em có thể tua đến phần đang làm.' : 'Nghe file bên dưới để trả lời các câu hỏi trong phần này. Em có thể tạm dừng, tua và nghe lại.'}</p>
        <AudioTrack track={track} sectionId={section.id} startAt={section.audioStart} />
      </div>}
      {section.introHtml && <div className="mb-4 rounded-2xl border border-border bg-card p-4 sm:p-6"><RichText value={section.introHtml} /></div>}
      <div className="space-y-4">{section.questions.map(q => <QuestionCard key={q.id} question={q} attempt={attempt} mode={mode} onAnswer={onAnswer} onCheck={id => setAttempt(current => ({ ...current, checked: [...new Set([...current.checked, id])] }))} />)}</div>
    </section>; })}</div>
    <div className="my-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{attempt.submitted ? 'Em có thể làm lại hoặc thử một đề khác.' : `${unanswered} câu / bài chưa trả lời. Em vẫn có thể nộp và xem kết quả.`}</p>
      {attempt.submitted ? <Link to={`/grade/${grade}/tests`} className={button}>Chọn đề khác <ArrowRight className="h-4 w-4" /></Link> : <button className={button} onClick={() => setConfirm('submit')}><ClipboardCheck className="h-4 w-4" /> Nộp bài và xem kết quả</button>}
    </div>
    <AlertDialog open={confirm !== null} onOpenChange={open => { if (!open) setConfirm(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirm === 'reset' ? 'Làm lại từ đầu?' : 'Em muốn nộp bài?'}</AlertDialogTitle><AlertDialogDescription>{confirm === 'reset' ? 'Bài làm đã lưu của đề này trong chế độ hiện tại sẽ được thay bằng một lượt làm mới.' : unanswered ? `Còn ${unanswered} câu / bài chưa trả lời. Khi nộp, em sẽ xem được kết quả và đáp án; câu chấm tự động chưa trả lời tính là chưa đúng.` : 'Sau khi nộp, em sẽ xem được kết quả và đáp án từng câu.'}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Quay lại</AlertDialogCancel><AlertDialogAction onClick={() => {
      const action = confirm; setConfirm(null);
      if (action === 'reset') { setAttempt(newAttempt()); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      else { setAttempt(current => ({ ...current, submitted: true })); resultFocusTimer.current = window.setTimeout(() => { const result = document.getElementById('exam-result'); result?.focus(); result?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); }
    }}>{confirm === 'reset' ? 'Làm lại' : 'Nộp bài'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}

function ExamDetail({ examId, grade }: { examId: string; grade: ExamGrade }) {
  const [exam, setExam] = useState<Grade6Exam | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [params, setParams] = useSearchParams();
  const selected = params.get('mode');
  const mode = selected === 'test' ? 'test' : 'practice';
  const [setupMode, setSetupMode] = useState<ExamMode>('practice');
  useEffect(() => {
    const controller = new AbortController(); setExam(null); setError('');
    if (!isValidMidtermExamId(grade, examId)) { setError('Không tìm thấy đề này.'); return; }
    getData<Grade6Exam>(grade, examId + '.json', controller.signal).then(setExam).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [examId, grade, retry]);
  return <PageShell><main className="mx-auto max-w-4xl px-4 pb-12 pt-28 sm:px-6">
    <Link to={`/grade/${grade}/tests`} className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Chọn đề khác</Link>
    {error ? <div role="alert" className="mt-8 rounded-2xl border p-5">{error}<button className={`${secondary} ml-3`} onClick={() => setRetry(x => x + 1)}>Thử lại</button></div> : !exam ? <p role="status" className="py-10">Đang mở đề…</p> : selected !== 'practice' && selected !== 'test' ? <div className="py-8"><h1 className="mb-6 font-display text-3xl font-extrabold">{exam.title} · Giữa kỳ I · Lớp {grade}</h1><ModePicker mode={setupMode} onChange={setSetupMode} /><button className={`${button} mt-6`} onClick={() => setParams({ mode: setupMode })}>Bắt đầu làm bài <ArrowRight className="h-4 w-4" /></button></div> : <ExamPlayer key={exam.id + mode} exam={exam} mode={mode} grade={grade} />}
  </main></PageShell>;
}

export default function Grade6TestsPage({ grade = 6 }: { grade?: ExamGrade }) {
  const { examId } = useParams();
  return examId ? <ExamDetail key={grade + examId} examId={examId} grade={grade} /> : <ExamCatalog key={grade} grade={grade} />;
}
