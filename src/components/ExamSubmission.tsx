import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasSubmissionReceipt, readStudentIdentity, rememberStudentIdentity, resendPendingSubmissions, sendExamSubmission, validIdentity, type ExamSubmission as Submission, type StudentIdentity } from '@/lib/examSubmissions';

export function StudentIdentityFields({ value, onChange }: { value: StudentIdentity; onChange: (value: StudentIdentity) => void }) {
  return <div className="grid gap-3 text-left sm:grid-cols-2">
    <label className="text-sm font-bold">Họ và tên học sinh<input required autoComplete="name" maxLength={100} value={value.studentName} onChange={e => onChange({ ...value, studentName: e.target.value })} className="mt-1 block w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 font-normal" placeholder="Ví dụ: Nguyễn Minh Anh" /></label>
    <label className="text-sm font-bold">Lớp / nhóm học<input required maxLength={60} value={value.className} onChange={e => onChange({ ...value, className: e.target.value })} className="mt-1 block w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 font-normal" placeholder="Ví dụ: 6A1 hoặc nhóm cô Yến" /></label>
  </div>;
}

export function PendingExamSubmissions() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const sync = () => { void resendPendingSubmissions(user.uid); };
    sync(); window.addEventListener('online', sync); window.addEventListener('pagehide', sync);
    const interval = window.setInterval(sync, 15000);
    return () => { window.clearInterval(interval); window.removeEventListener('online', sync); window.removeEventListener('pagehide', sync); };
  }, [user]);
  return null;
}

export default function ExamSubmission({ id, value, identity: initialIdentity, autoSend = false }: { id: string; value: Omit<Submission, 'uid' | 'studentName' | 'className'>; identity?: StudentIdentity; autoSend?: boolean }) {
  const { user, profile, loading } = useAuth();
  const [identity, setIdentity] = useState<StudentIdentity>(() => initialIdentity ?? { ...readStudentIdentity(), studentName: readStudentIdentity().studentName || profile?.studentName || '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(() => user && hasSubmissionReceipt(user.uid, id) ? 'sent' : 'idle');
  const autoStarted = useRef(false);
  const [error, setError] = useState('');
  const send = useCallback(async () => {
    if (!user || !validIdentity(identity)) return;
    setStatus('sending'); setError('');
    const clean = { studentName: identity.studentName.trim(), className: identity.className.trim() };
    rememberStudentIdentity(clean);
    try { await sendExamSubmission(id, { ...value, ...clean, uid: user.uid }); setStatus('sent'); }
    catch { setStatus('error'); setError('Chưa gửi được cho cô. Kiểm tra kết nối rồi bấm Gửi lại. Bài làm vẫn ở trên thiết bị này.'); }
  }, [id, value, identity, user]);
  useEffect(() => {
    if (autoSend && !autoStarted.current && user && validIdentity(identity) && status !== 'sent') { autoStarted.current = true; void send(); }
  }, [autoSend, identity, user, send, status]);
  useEffect(() => {
    const receive = (event: Event) => { if ((event as CustomEvent).detail === id) setStatus('sent'); };
    window.addEventListener('exam-submission-sent', receive);
    return () => window.removeEventListener('exam-submission-sent', receive);
  }, [id]);
  return <section className="my-4 rounded-2xl border border-border bg-card p-4 text-left" aria-label="Gửi kết quả cho giáo viên">
    {status === 'sent' ? <p role="status" className="font-bold text-primary">✓ Đã gửi kết quả cho cô · {identity.studentName} · {identity.className}</p> : <>
      <h3 className="mb-2 font-display text-lg font-extrabold">Nộp kết quả cho cô</h3>
      <p className="mb-3 text-sm text-muted-foreground">Cô sẽ xem được điểm, từng câu trả lời và phần viết của em.</p>
      <fieldset disabled={status === 'sending'}><StudentIdentityFields value={identity} onChange={setIdentity} /></fieldset>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {!loading && !user && <p role="alert" className="mt-3 text-sm text-destructive">Chưa kết nối được phiên học sinh. Em hãy tải lại trang để thử lại.</p>}
      <button type="button" onClick={() => void send()} disabled={loading || !user || !validIdentity(identity) || status === 'sending'} className="mt-3 min-h-11 rounded-xl bg-primary px-5 py-2.5 font-bold text-primary-foreground disabled:opacity-50">{status === 'sending' ? 'Đang gửi…' : status === 'error' ? 'Gửi lại kết quả' : 'Gửi kết quả cho cô'}</button>
      <p className="mt-2 text-xs text-muted-foreground">Chỉ khi hiện “Đã gửi kết quả cho cô” thì cô mới nhận được bài.</p>
    </>}
  </section>;
}
