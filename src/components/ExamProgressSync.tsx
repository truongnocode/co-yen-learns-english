import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { queueExamProgress, sendExamProgress, type ExamSubmission, type StudentIdentity } from '@/lib/examSubmissions';

export default function ExamProgressSync({ id, value, identity }: { id: string; value: Omit<ExamSubmission, 'uid' | 'studentName' | 'className'>; identity: StudentIdentity }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<'waiting' | 'saved' | 'error' | 'conflict'>('waiting');
  const [retry, setRetry] = useState(0);
  const revision = useRef(value.revision); revision.current = value.revision;
  useEffect(() => {
    if (!user) return;
    let active = true; setStatus('waiting');
    const snapshot: ExamSubmission = { ...value, ...identity, uid: user.uid, state: 'in_progress' };
    queueExamProgress(id, snapshot);
    const timer = window.setTimeout(() => { void sendExamProgress(id, snapshot).catch(() => { if (active) setStatus('error'); }); }, 1200);
    const receive = (event: Event) => { const detail = (event as CustomEvent).detail; if (detail.id === id && detail.revision === revision.current && active) setStatus(detail.outdated ? 'conflict' : 'saved'); };
    window.addEventListener('exam-progress-saved', receive);
    return () => { active = false; window.clearTimeout(timer); window.removeEventListener('exam-progress-saved', receive); };
  }, [id, value, identity, user, retry]);
  return <p className="mt-2 text-xs text-muted-foreground" role="status">{status === 'saved' ? '✓ Cô đã nhận tiến trình mới nhất' : status === 'conflict' ? 'Có phiên mới hơn hoặc bài đã nộp. Em hãy mở lại đề để kiểm tra.' : status === 'error' ? <>Chưa đồng bộ được cho cô. <button onClick={() => setRetry(x => x + 1)} className="font-bold text-primary underline">Thử lại</button></> : 'Đang đồng bộ tiến trình cho cô…'}</p>;
}
