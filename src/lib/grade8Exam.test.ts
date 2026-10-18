import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { attemptKey, examResult, isCorrectExamAnswer, isValidMidtermExamId, MIDTERM_EXAM_COUNTS, type ExamSummary, type Grade6Exam } from './grade6Exam';

const root = resolve('public/data/grade8-midterm');
const manifest: ExamSummary[] = JSON.parse(readFileSync(resolve(root, 'index.json'), 'utf8'));
const exams: Grade6Exam[] = manifest.map(e => JSON.parse(readFileSync(resolve(root, e.id + '.json'), 'utf8')));
const question = (n: number, id: string) => exams[n - 1].sections.flatMap(s => s.questions).find(q => q.id === id)!;

describe('grade 8 VEDEC content and routing', () => {
  it('retains all 659 tasks across 17 papers with complete local media and answer groups', () => {
    expect(exams.map(e => e.number)).toEqual(Array.from({ length: 17 }, (_, i) => i + 1));
    const counts = [46, 37, 39, 37, 37, 37, 37, 36, 37, 40, 46, 37, 37, 37, 37, 40, 42];
    const tracks = new Set<string>();
    const images = new Set<string>();
    const allQuestions = exams.flatMap(e => e.sections.flatMap(s => s.questions));
    expect(allQuestions).toHaveLength(659);
    expect(examResult(allQuestions, {}).total).toBe(635);
    for (const [i, exam] of exams.entries()) {
      expect(isValidMidtermExamId(8, exam.id)).toBe(true);
      expect(exam.subtitle).toContain('Tiếng Anh 8');
      const qs = exam.sections.flatMap(s => s.questions);
      expect(qs.length, exam.id).toBe(counts[i]);
      expect(manifest[i].questionCount).toBe(qs.length);
      expect(new Set(qs.map(q => q.id)).size).toBe(qs.length);
      for (const q of qs) {
        if (q.kind === 'manual' || q.unscored) continue;
        expect(q.answers.length, `${exam.id}/${q.id}`).toBeGreaterThan(0);
        for (const a of q.answers) {
          expect(a.trim()).not.toBe('');
          expect(a).not.toMatch(/Chỗ trống|^The end$|Giải thích:|A B C D/);
          if (q.options) expect(q.options).toContain(a);
        }
      }
      const listening = exam.sections.filter(s => s.part === 'LISTENING' && s.questions.length);
      expect(i === 15 ? listening.length === 0 && exam.audio.length === 0 : listening.length === 2).toBe(true);
      listening.forEach((s, j) => {
        const a = exam.audio[exam.audio.length === 1 ? 0 : j];
        expect(a, `${exam.id}/${s.id}`).toBeDefined();
        expect(s.audioStart ?? 0).toBeLessThan(a.duration);
      });
      for (const a of exam.audio) {
        expect(a.duration).toBeGreaterThan(10);
        expect(existsSync(resolve('public', a.src.slice(1)))).toBe(true);
        tracks.add(a.src);
      }
      for (const src of JSON.stringify(exam).matchAll(/src=\\"(\/data\/[^\\"]+)/g)) {
        expect(existsSync(resolve('public', src[1].slice(1)))).toBe(true);
        images.add(src[1]);
      }
    }
    expect(tracks.size).toBe(27);
    expect(images.size).toBe(9);
  });
  it('keeps missing table controls and Word letter labels usable', () => {
    expect(exams[11].sections.find(s => s.id === 's2')!.questions.map(q => q.answers[0])).toEqual(['community', 'share', 'like', 'spacious']);
    expect(exams[13].sections.find(s => s.id === 's3')!.questions.map(q => q.answers[0])).toEqual(['F', 'F', 'T', 'T', 'T']);
    expect(exams[10].sections.find(s => s.id === 's3')!.questions).toHaveLength(15);
    expect(question(1, 's13-q1').html).toContain('a.');
    expect(question(7, 's2-q1').html).toContain('A. knitting kit');
    expect(question(7, 's2-q1').html).not.toContain('E. pen');
    expect(question(16, 's6-q1').options).toEqual(['A', 'B', 'C', 'D']);
  });
  it('requires both verb blanks, accepts completed rewrites, and excludes ambiguous original items', () => {
    expect(isCorrectExamAnswer(question(8, 's9-q4'), 'were')).toBe(false);
    expect(isCorrectExamAnswer(question(8, 's9-q4'), 'were / doing')).toBe(true);
    expect(isCorrectExamAnswer(question(13, 's7-q2'), 'Did / visit')).toBe(true);
    expect(isCorrectExamAnswer(question(10, 's12-q4'), 'You can go around and take a look.')).toBe(true);
    expect(isCorrectExamAnswer(question(7, 's13-q2'), 'I do')).toBe(false);
    expect(question(15, 's8-q1').unscored).toBe(true);
    expect(question(13, 's3-q3').unscored).toBe(true);
  });
  it('rejects papers outside the supplied set and preserves earlier grade storage keys', () => {
    expect(MIDTERM_EXAM_COUNTS[8]).toBe(17);
    expect(isValidMidtermExamId(8, 'vedec-g8-2026-18')).toBe(false);
    expect(isValidMidtermExamId(8, 'vedec-g7-2026-01')).toBe(false);
    expect(isValidMidtermExamId(7, 'vedec-g7-2026-18')).toBe(true);
    expect(attemptKey('vedec-g8-2026-01', 'practice')).toBe('coyen:grade8:v1:vedec-g8-2026-01:practice');
    expect(attemptKey('vedec-g7-2026-01', 'test')).toBe('coyen:grade7:v1:vedec-g7-2026-01:test');
    expect(attemptKey('vedec-2026-01', 'practice')).toBe('coyen:grade6:v1:vedec-2026-01:practice');
  });
});
