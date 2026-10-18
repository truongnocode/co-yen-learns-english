import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { attemptKey, examResult, isCorrectExamAnswer, isValidMidtermExamId, MIDTERM_EXAM_COUNTS, type ExamSummary, type Grade6Exam } from './grade6Exam';

const root = resolve('public/data/grade9-midterm');
const manifest: ExamSummary[] = JSON.parse(readFileSync(resolve(root, 'index.json'), 'utf8'));
const exams: Grade6Exam[] = manifest.map(e => JSON.parse(readFileSync(resolve(root, e.id + '.json'), 'utf8')));
const question = (n: number, id: string) => exams[n - 1].sections.flatMap(s => s.questions).find(q => q.id === id)!;

describe('grade 9 VEDEC papers', () => {
  it('retains 608 real tasks, all answer controls and local media across the 16 supplied papers', () => {
    expect(exams.map(e => e.number)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
    const counts = [37, 37, 37, 37, 37, 37, 37, 40, 50, 37, 37, 37, 37, 34, 40, 37];
    const tracks = new Set<string>();
    const images = new Set<string>();
    const all = exams.flatMap(e => e.sections.flatMap(s => s.questions));
    expect(all).toHaveLength(608);
    expect(examResult(all, {}).total).toBe(589);
    expect(all.filter(q => q.kind === 'manual')).toHaveLength(14);
    expect(all.filter(q => q.unscored)).toHaveLength(5);
    for (const [i, exam] of exams.entries()) {
      expect(isValidMidtermExamId(9, exam.id)).toBe(true);
      expect(exam.subtitle).toContain('Tiếng Anh 9');
      const qs = exam.sections.flatMap(s => s.questions);
      expect(qs.length, exam.id).toBe(counts[i]);
      expect(manifest[i].questionCount).toBe(qs.length);
      expect(new Set(qs.map(q => q.id)).size).toBe(qs.length);
      for (const q of qs) {
        expect(q.number).not.toBe('0');
        if (q.kind === 'manual' || q.unscored) continue;
        expect(q.answers.length, `${exam.id}/${q.id}`).toBeGreaterThan(0);
        for (const a of q.answers) {
          expect(a.trim()).not.toBe('');
          expect(a).not.toMatch(/Chỗ trống|Question|The end|Giải thích:|A B C D/);
          if (q.options) expect(q.options).toContain(a);
        }
      }
      const listening = exam.sections.filter(s => s.part === 'LISTENING' && s.questions.length);
      expect(listening.length).toBe([6, 7, 8, 11, 12, 13].includes(i + 1) ? 2 : 0);
      for (const s of listening) {
        const a = exam.audio.find(a => a.sectionIds?.includes(s.id));
        expect(a, `${exam.id}/${s.id}`).toBeDefined();
        expect(s.audioStart ?? 0).toBeLessThan(a!.duration);
      }
      for (const a of exam.audio) {
        expect(a.duration).toBeGreaterThan(30);
        expect(existsSync(resolve('public', a.src.slice(1)))).toBe(true);
        tracks.add(a.src);
      }
      for (const src of JSON.stringify(exam).matchAll(/src=\\"(\/data\/[^\\"]+)/g)) {
        expect(existsSync(resolve('public', src[1].slice(1)))).toBe(true);
        images.add(src[1]);
      }
    }
    expect(tracks.size).toBe(8);
    expect(images.size).toBe(15);
  });
  it('restores table blanks and letter choices, preserves worked examples without scoring them, and seeks shared audio', () => {
    expect(exams[6].sections.find(s => s.id === 's2')!.questions.map(q => q.answers[0])).toEqual(['interest', 'used', 'performing', 'stairs']);
    expect(exams[11].sections.find(s => s.id === 's3')!.questions.map(q => q.answers[0])).toEqual(['cinemas', 'widen', 'entertainment', 'lazy', 'teach']);
    expect(exams[11].sections.find(s => s.id === 's3')!.introHtml).toContain('<table>');
    expect(exams[11].sections.find(s => s.id === 's14')!.questions[0].kind).toBe('manual');
    expect(exams[11].sections.find(s => s.part === 'SPEAKING')!.questions).toHaveLength(1);
    expect(exams[12].sections.find(s => s.id === 's2')!.introHtml).toContain('Đáp án ví dụ: T');
    expect(exams[12].sections.find(s => s.id === 's2')!.questions).toHaveLength(4);
    expect(question(1, 's6-q1').options).toEqual(['A', 'B', 'C', 'D']);
    expect(question(14, 's5-q1').answers).toEqual(['D']);
    expect(question(15, 's5-q1').kind).toBe('choice');
    expect(question(15, 's5-q1').answers).toEqual(['C']);
    expect(exams[6].sections.find(s => s.id === 's3')!.audioStart).toBe(170);
    expect(exams[11].sections.find(s => s.id === 's3')!.audioStart).toBe(161);
    expect(exams[12].sections.find(s => s.id === 's3')!.audioStart).toBe(160);
  });
  it('accepts complete and missing-part rewrites, corrects key errors, and excludes invalid original questions', () => {
    expect(isCorrectExamAnswer(question(16, 's8-q1'), 'try harder, you cannot pass')).toBe(true);
    expect(isCorrectExamAnswer(question(16, 's8-q1'), 'Unless you try harder, you cannot pass the next exam.')).toBe(true);
    expect(isCorrectExamAnswer(question(7, 's12-q1'), 'Do you get on well with your classmates?')).toBe(true);
    expect(isCorrectExamAnswer(question(10, 's10-q1'), "If you don't finish your homework, you can't go out with your friend.")).toBe(true);
    expect(question(13, 's2-q3').answers).toEqual(['T']);
    expect(question(12, 's7-q4').answers).toEqual(['B']);
    expect(question(1, 's8-q6').answers).toEqual(['B']);
    expect(question(5, 's2-q2').unscored).toBe(true);
    expect(question(9, 's10-q5').unscored).toBe(true);
    expect(question(10, 's2-q1').unscored).toBe(true);
  });
  it('limits grade 9 IDs to the source set and keeps all grades and modes in separate saved attempts', () => {
    expect(MIDTERM_EXAM_COUNTS[9]).toBe(16);
    expect(isValidMidtermExamId(9, 'vedec-g9-2026-16')).toBe(true);
    expect(isValidMidtermExamId(9, 'vedec-g9-2026-17')).toBe(false);
    expect(isValidMidtermExamId(9, 'vedec-g8-2026-01')).toBe(false);
    expect(attemptKey('vedec-g9-2026-01', 'practice')).toBe('coyen:grade9:v1:vedec-g9-2026-01:practice');
    expect(attemptKey('vedec-g8-2026-01', 'test')).toBe('coyen:grade8:v1:vedec-g8-2026-01:test');
    expect(attemptKey('vedec-g7-2026-01', 'practice')).toBe('coyen:grade7:v1:vedec-g7-2026-01:practice');
    expect(attemptKey('vedec-2026-01', 'test')).toBe('coyen:grade6:v1:vedec-2026-01:test');
  });
});
