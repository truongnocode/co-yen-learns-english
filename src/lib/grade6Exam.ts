import { normalizeAnswer } from './answerMatch';

export const MIDTERM_EXAM_COUNTS = { 6: 18, 7: 18, 8: 17, 9: 16 } as const;
export type ExamGrade = keyof typeof MIDTERM_EXAM_COUNTS;
export const isExamGrade = (grade: number): grade is ExamGrade => grade in MIDTERM_EXAM_COUNTS;
export function isValidMidtermExamId(grade: ExamGrade, id: string) {
  const prefix = grade === 6 ? 'vedec-2026-' : `vedec-g${grade}-2026-`;
  const number = id.slice(prefix.length);
  return id.startsWith(prefix) && /^\d{2}$/.test(number) && Number(number) >= 1 && Number(number) <= MIDTERM_EXAM_COUNTS[grade];
}

export interface ExamQuestion {
  id: string;
  number: string;
  html: string;
  kind: 'choice' | 'tf' | 'text' | 'manual';
  options?: string[];
  answers: string[];
  referenceHtml?: string;
  note?: string;
  unscored?: boolean;
}
export interface ExamSection {
  id: string;
  title: string;
  part: string;
  introHtml: string;
  audioStart?: number;
  questions: ExamQuestion[];
}
export interface Grade6Exam {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  sections: ExamSection[];
  audio: { title: string; src: string; duration: number; sectionIds?: string[]; sourceName: string }[];
}
export interface ExamSummary {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  questionCount: number;
  audioCount: number;
}
export type ExamMode = 'practice' | 'test';
export interface ExamAttempt {
  submissionId?: string;
  finishedAt?: number;
  identity?: { studentName: string; className: string };
  revision?: number;
  answers: Record<string, string>;
  checked: string[];
  submitted: boolean;
  startedAt: number;
}
export const newAttempt = (): ExamAttempt => ({ submissionId: crypto.randomUUID(), revision: Date.now(), answers: {}, checked: [], submitted: false, startedAt: Date.now() });
export const attemptKey = (id: string, mode: ExamMode) => `coyen:grade${id.startsWith('vedec-g9-') ? 9 : id.startsWith('vedec-g8-') ? 8 : id.startsWith('vedec-g7-') ? 7 : 6}:v1:${id}:${mode}`;

// Short answers accept case, punctuation, apostrophe and contraction variants.
// They deliberately do not use fuzzy matching, which could accept wrong grammar.
export function normalizeExamAnswer(value: string) {
  return normalizeAnswer(value)
    .replace(/\b(aren't|isn't|don't|doesn't|can't|won't)\b/g, m => ({ "aren't": 'are not', "isn't": 'is not', "don't": 'do not', "doesn't": 'does not', "can't": 'cannot', "won't": 'will not' })[m]!)
    .replace(/\s*([,;])\s*/g, '$1 ')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+'s\b/g, "'s")
    .trim();
}
export const isAutoScored = (q: ExamQuestion) => q.kind !== 'manual' && !q.unscored && q.answers.length > 0;
export const isCorrectExamAnswer = (q: ExamQuestion, value: string) =>
  !!value.trim() && q.answers.some(a => normalizeExamAnswer(a) === normalizeExamAnswer(value));

export function examResult(questions: ExamQuestion[], answers: Record<string, string>) {
  const scored = questions.filter(isAutoScored);
  const correct = scored.filter(q => isCorrectExamAnswer(q, answers[q.id] ?? '')).length;
  return { correct, total: scored.length, score: scored.length ? Math.round(correct / scored.length * 100) / 10 : 0, manual: questions.filter(q => !isAutoScored(q)).length };
}

export function restoreAttempt(raw: string | null, questions: ExamQuestion[]): ExamAttempt | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value.answers !== 'object' || !value.answers || !Array.isArray(value.checked) || typeof value.submitted !== 'boolean' || !Number.isFinite(value.startedAt)) return null;
    const ids = new Set(questions.map(q => q.id));
    const answers: Record<string, string> = {};
    for (const [id, answer] of Object.entries(value.answers)) {
      const q = questions.find(q => q.id === id);
      if (q && typeof answer === 'string' && answer.length <= 10000 && (!q.options || q.options.includes(answer))) answers[id] = answer;
    }
    return { answers, checked: value.checked.filter((id: unknown): id is string => typeof id === 'string' && ids.has(id) && !!answers[id]?.trim()), submitted: value.submitted, startedAt: value.startedAt,
      submissionId: typeof value.submissionId === 'string' && /^[a-zA-Z0-9-]{10,80}$/.test(value.submissionId) ? value.submissionId : crypto.randomUUID(),
      finishedAt: Number.isFinite(value.finishedAt) ? value.finishedAt : undefined,
      revision: Number.isSafeInteger(value.revision) && value.revision > 0 ? value.revision : Date.now(),
      identity: typeof value.identity?.studentName === 'string' && typeof value.identity?.className === 'string' ? { studentName: value.identity.studentName.slice(0, 100), className: value.identity.className.slice(0, 60) } : undefined,
    };
  } catch { return null; }
}
