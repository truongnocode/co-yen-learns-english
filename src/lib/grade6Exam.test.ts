import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { examResult, isCorrectExamAnswer, newAttempt, normalizeExamAnswer, restoreAttempt, type ExamQuestion, type Grade6Exam } from './grade6Exam';

const choice: ExamQuestion = { id: 'a', number: '1', kind: 'choice', html: '', answers: ['B'], options: ['A', 'B', 'C'] };
const text: ExamQuestion = { id: 'b', number: '2', kind: 'text', html: '', answers: ['are not'] };
describe('grade 6 exam scoring and saved attempts', () => {
  it('accepts harmless text variants but rejects incorrect grammar', () => {
    expect(isCorrectExamAnswer(text, ' Aren’t. ')).toBe(true);
    expect(isCorrectExamAnswer(text, 'is not')).toBe(false);
    expect(normalizeExamAnswer('black / mouth')).toBe(normalizeExamAnswer('black/mouth'));
  });
  it('excludes open writing and ambiguous source questions from the score', () => {
    const qs = [choice, text, { ...choice, id: 'c', kind: 'manual' as const }, { ...choice, id: 'd', unscored: true }];
    expect(examResult(qs, { a: 'B' })).toEqual({ correct: 1, total: 2, score: 5, manual: 2 });
    expect(examResult(qs, {}).correct).toBe(0);
  });
  it('restores valid answers and rejects stale, malformed or impossible selections', () => {
    const saved = { ...newAttempt(), answers: { a: 'D', b: 'are not', unknown: 'answer' }, checked: ['a', 'b', 'unknown'] };
    expect(restoreAttempt(JSON.stringify(saved), [choice, text])?.answers).toEqual({ b: 'are not' });
    expect(restoreAttempt(JSON.stringify(saved), [choice, text])?.checked).toEqual(['b']);
    expect(restoreAttempt('{broken', [choice])).toBeNull();
    expect(restoreAttempt('{"answers":null}', [choice])).toBeNull();
  });
});

describe('published VEDEC content', () => {
  const root = resolve('public/data/grade6-midterm');
  const exams = readdirSync(root).filter(f => /^vedec.*\.json$/.test(f)).map(f => JSON.parse(readFileSync(resolve(root, f), 'utf8')) as Grade6Exam);
  it('contains every paper, complete question groups and locally available media', () => {
    expect(exams).toHaveLength(18);
    for (const exam of exams) {
      const qs = exam.sections.flatMap(s => s.questions);
      expect(qs.length, exam.id).toBeGreaterThanOrEqual(37);
      expect(new Set(qs.map(q => q.id)).size).toBe(qs.length);
      expect(exam.audio.length).toBeGreaterThan(0);
      for (const track of exam.audio) {
        expect(track.duration).toBeGreaterThan(10);
        expect(existsSync(resolve('public', track.src.slice(1)))).toBe(true);
      }
      for (const q of qs) {
        if (q.kind === 'manual' || q.unscored) continue;
        expect(q.answers.length, `${exam.id}/${q.id}`).toBeGreaterThan(0);
        for (const answer of q.answers) {
          expect(answer.trim()).not.toBe('');
          expect(answer).not.toMatch(/Chỗ trống|^The end$/i);
          if (q.options) expect(q.options).toContain(answer);
        }
      }
      for (const src of JSON.stringify(exam).matchAll(/src=\\"(\/data\/[^\\"]+)/g)) {
        expect(existsSync(resolve('public', src[1].slice(1)))).toBe(true);
      }
    }
  });
});
