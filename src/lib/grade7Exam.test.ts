import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { attemptKey, isAutoScored, isCorrectExamAnswer, type ExamSummary, type Grade6Exam } from './grade6Exam';

const root = resolve('public/data/grade7-midterm');
const manifest: ExamSummary[] = JSON.parse(readFileSync(resolve(root, 'index.json'), 'utf8'));
const exams: Grade6Exam[] = manifest.map(e => JSON.parse(readFileSync(resolve(root, e.id + '.json'), 'utf8')));
const question = (n: number, id: string) => exams[n - 1].sections.flatMap(s => s.questions).find(q => q.id === id)!;

describe('grade 7 VEDEC import', () => {
  it('preserves all 18 papers, question groups, answer controls and local media', () => {
    expect(exams.map(e => e.number)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
    const counts = [37, 37, 36, 37, 37, 37, 37, 37, 37, 40, 36, 37, 37, 37, 37, 37, 36, 40];
    for (const [i, exam] of exams.entries()) {
      expect(exam.id).toBe(`vedec-g7-2026-${String(i + 1).padStart(2, '0')}`);
      const qs = exam.sections.flatMap(s => s.questions);
      expect(qs.length, exam.id).toBe(counts[i]);
      expect(manifest[i].questionCount).toBe(qs.length);
      expect(new Set(qs.map(q => q.id)).size).toBe(qs.length);
      for (const q of qs) {
        if (q.kind === 'manual' || q.unscored) continue;
        expect(q.answers.length, `${exam.id}/${q.id}`).toBeGreaterThan(0);
        for (const a of q.answers) {
          expect(a.trim()).not.toBe('');
          expect(a).not.toMatch(/Chỗ trống|^The end$|A B C D/);
          if (q.options) expect(q.options).toContain(a);
        }
      }
      for (const track of exam.audio) {
        expect(track.duration).toBeGreaterThan(10);
        expect(existsSync(resolve('public', track.src.slice(1)))).toBe(true);
        expect(track.src).toContain('/grade7-midterm/');
      }
      for (const src of JSON.stringify(exam).matchAll(/src=\\"(\/data\/[^\\"]+)/g)) {
        expect(existsSync(resolve('public', src[1].slice(1)))).toBe(true);
      }
      const listening = exam.sections.filter(s => s.part === 'LISTENING' && s.questions.length);
      expect(i === 17 ? listening.length === 0 && exam.audio.length === 0 : listening.length > 0).toBe(true);
      listening.forEach((s, j) => {
        const track = exam.audio.find(a => a.sectionIds?.includes(s.id)) ?? (exam.audio.some(a => a.sectionIds) ? undefined : exam.audio[exam.audio.length === 1 ? 0 : j]);
        expect(track, `${exam.id}/${s.id}`).toBeDefined();
        expect(s.audioStart ?? 0).toBeLessThan(track!.duration);
      });
    }
  });
  it('repairs missing options and key extraction without accepting half-filled answers', () => {
    expect(isCorrectExamAnswer(question(1, 's6-q1'), 'Does')).toBe(false);
    expect(isCorrectExamAnswer(question(1, 's6-q1'), 'Does / go')).toBe(true);
    expect(isCorrectExamAnswer(question(8, 's7-q4'), 'boils')).toBe(false);
    expect(isCorrectExamAnswer(question(8, 's7-q4'), 'boils / changes')).toBe(true);
    const cloze = exams[7].sections.find(s => s.id === 's9')!;
    expect(cloze.questions.map(q => q.number)).toEqual(['21', '22', '23', '24', '25']);
    expect(cloze.questions.map(q => q.answers[0])).toEqual(['C', 'B', 'A', 'D', 'C']);
    expect(question(17, 's5-q10').answers).toEqual(['C']);
    expect(question(18, 's2-q4').answers).toEqual(['A']);
    expect(question(6, 's5-q8').html).toContain('<img');
    expect(isAutoScored(question(6, 's5-q8'))).toBe(true);
    expect(question(18, 's7-q2').html).toContain('<img');
    expect(isAutoScored(question(18, 's7-q2'))).toBe(true);
    expect(isAutoScored(question(18, 's1-q1'))).toBe(false);
  });
  it('uses verified replacement recordings and isolates grade 7 saved work', () => {
    expect(exams[3].audio[0].src).toContain('01-2.mp3');
    expect(exams[15].audio[0].src).toContain('01-1.mp3');
    expect(exams[16].audio[0].src).toContain('07-1.mp3');
    expect(attemptKey(exams[0].id, 'practice')).toContain('grade7:');
    expect(attemptKey('vedec-2026-01', 'practice')).toBe('coyen:grade6:v1:vedec-2026-01:practice');
    expect(attemptKey(exams[0].id, 'practice')).not.toBe(attemptKey(exams[0].id, 'test'));
  });
});
