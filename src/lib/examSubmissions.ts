import { collection, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, setDoc, startAfter, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { z } from 'zod';

export interface StudentIdentity { studentName: string; className: string }
export interface SubmittedQuestion {
  id: string; number: string; section: string; prompt: string; context: string;
  options: string[]; answer: string; expected: string[];
  status: 'correct' | 'incorrect' | 'manual';
}
export interface ExamSubmission extends StudentIdentity {
  version: 1; uid: string; grade: number; examId: string; examTitle: string;
  mode: 'practice' | 'test'; startedAt: number; finishedAt: number;
  correct: number; total: number; manual: number; score: number;
  questions: SubmittedQuestion[];
}
export interface TeacherReview { comment: string; writingScore: number | null; reviewedBy: string; updatedAt?: unknown }
export type SubmissionRecord = ExamSubmission & { id: string };
const questionSchema = z.object({ id: z.string(), number: z.string(), section: z.string(), prompt: z.string(), context: z.string(), options: z.array(z.string()), answer: z.string(), expected: z.array(z.string()), status: z.enum(['correct', 'incorrect', 'manual']) });
function readRecord(id: string, data: Record<string, unknown>): SubmissionRecord {
  // A student can craft a payload outside the UI. Never render arbitrary HTML or
  // assume nested fields are well formed just because the envelope passed rules.
  const questions = (Array.isArray(data.questions) ? data.questions : []).map((value, i) => {
    const parsed = questionSchema.safeParse(value);
    return parsed.success ? parsed.data : { id: `invalid-${i}`, number: String(i + 1), section: '', prompt: 'Dữ liệu câu hỏi không hợp lệ. Cần kiểm tra lại bài nộp này.', context: '', options: [], answer: '', expected: [], status: 'manual' as const };
  });
  return { ...data, id, questions } as SubmissionRecord;
}
const prefix = 'coyen:pending-submission:';
const receiptKey = (uid: string, id: string) => `coyen:submission-sent:${uid}:${id}`;
const inFlight = new Map<string, Promise<void>>();
export const newSubmissionId = () => crypto.randomUUID();
export const validIdentity = (identity: StudentIdentity) => identity.studentName.trim().length >= 2 && identity.studentName.trim().length <= 100 && identity.className.trim().length >= 1 && identity.className.trim().length <= 60;
export function readStudentIdentity(): StudentIdentity {
  try { const p = JSON.parse(localStorage.getItem('coyen:exam-student') || '{}'); return { studentName: typeof p.studentName === 'string' ? p.studentName.slice(0, 100) : '', className: typeof p.className === 'string' ? p.className.slice(0, 60) : '' }; } catch { return { studentName: '', className: '' }; }
}
export function rememberStudentIdentity(identity: StudentIdentity) { try { localStorage.setItem('coyen:exam-student', JSON.stringify(identity)); } catch { /* Sending still works without local storage. */ } }
export function hasSubmissionReceipt(uid: string, id: string) { try { return !!localStorage.getItem(receiptKey(uid, id)); } catch { return false; } }
export function submissionSummary(questions: SubmittedQuestion[]) {
  const total = questions.filter(q => q.status !== 'manual').length;
  const correct = questions.filter(q => q.status === 'correct').length;
  return { correct, total, manual: questions.length - total, score: total ? Math.round(correct / total * 100) / 10 : 0 };
}
export function plainExamText(html: string) {
  const element = document.createElement('div');
  element.innerHTML = html.replace(/<\/(?:p|div|li|tr|h[1-6])>|<br\s*\/?>/gi, '\n$&');
  const text = (element.textContent || '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
  const images = [...element.querySelectorAll('img')].map(img => img.getAttribute('src')).filter(Boolean);
  return text + (images.length ? '\n[Hình trong đề: ' + images.join(', ') + ']' : '');
}
// A stable document ID + transaction makes retries append-only and idempotent.
// The browser's score is a practice score, not a supervised examination grade.
export function sendExamSubmission(id: string, submission: ExamSubmission): Promise<void> {
  if (inFlight.has(id)) return inFlight.get(id)!;
  try { localStorage.setItem(prefix + id, JSON.stringify({ id, submission })); } catch { /* Report network failure below; keep the rendered answers. */ }
  const promise = runTransaction(db, async transaction => {
    const ref = doc(db, 'exam_submissions', id);
    const existing = await transaction.get(ref);
    if (existing.exists()) {
      if (existing.data().uid !== submission.uid) throw new Error('Bài nộp thuộc phiên đăng nhập khác.');
      return;
    }
    transaction.set(ref, { ...submission, receivedAt: serverTimestamp() });
  }).then(() => {
    try { localStorage.setItem(receiptKey(submission.uid, id), 'sent'); localStorage.removeItem(prefix + id); } catch { /* Remote receipt is authoritative. */ }
    window.dispatchEvent(new CustomEvent('exam-submission-sent', { detail: id }));
  }).finally(() => { inFlight.delete(id); });
  inFlight.set(id, promise);
  return promise;
}
export async function resendPendingSubmissions(uid: string) {
  const pending: { id: string; submission: ExamSubmission }[] = [];
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith(prefix)) {
      try { const item = JSON.parse(localStorage.getItem(key)!); if (item.submission?.uid === uid && item.id === key.slice(prefix.length)) pending.push(item); } catch { /* Ignore malformed local entries. */ }
    }
  } catch { return; }
  await Promise.allSettled(pending.map(item => sendExamSubmission(item.id, item.submission)));
}
export async function loadSubmissionPage(cursor?: QueryDocumentSnapshot) {
  const ref = collection(db, 'exam_submissions');
  const snapshot = await getDocs(query(ref, orderBy('receivedAt', 'desc'), ...(cursor ? [startAfter(cursor)] : []), limit(100)));
  return { rows: snapshot.docs.map(d => readRecord(d.id, d.data())), cursor: snapshot.docs.at(-1), hasMore: snapshot.size === 100 };
}
export async function loadSubmission(id: string) {
  const snapshot = await getDoc(doc(db, 'exam_submissions', id));
  return snapshot.exists() ? readRecord(snapshot.id, snapshot.data()) : null;
}
export async function loadTeacherReview(id: string) {
  const snapshot = await getDoc(doc(db, 'exam_submissions', id, 'reviews', 'teacher'));
  return snapshot.exists() ? snapshot.data() as TeacherReview : null;
}
export function saveTeacherReview(id: string, review: TeacherReview) {
  return setDoc(doc(db, 'exam_submissions', id, 'reviews', 'teacher'), { ...review, updatedAt: serverTimestamp() });
}
