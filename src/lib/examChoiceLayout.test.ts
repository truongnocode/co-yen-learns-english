import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { splitExamChoices } from './examChoiceLayout';
import type { Grade6Exam } from './grade6Exam';

const source = (html: string) => {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
};
const text = (html: string) => source(html).textContent!.replace(/\s+/g, '');

describe('compact exam choice layout', () => {
  it('retains underlining, separate Word runs and the stem image while reflowing the choices', () => {
    const html = '<p>Choose the word.<img src="/sign.png"></p><p><strong>A</strong>. h<u>e</u>lper\t<strong>B.</strong> email</p><p>C. special<br>D. network</p>';
    const result = splitExamChoices(html, ['A', 'B', 'C', 'D'])!;
    expect(result.size).toBe('short');
    expect(result.choices).toHaveLength(4);
    expect(result.stemHtml).toContain('/sign.png');
    expect(result.choices[0].html).toContain('<u>e</u>');
    expect(text(result.stemHtml + result.choices.map(c => c.html).join(''))).toBe(text(html));
  });
  it('leaves labelled arrangement sentences in the stem and keeps only their trailing answer choices', () => {
    const html = '<p>Arrange: A. Opening. B. Next. C. Finally. D. Goodbye. E. Regards.</p><p>A. A-B-C-D-E B. A-C-B-D-E C. B-A-C-D-E D. E-D-C-B-A</p>';
    const result = splitExamChoices(html, ['A', 'B', 'C', 'D'])!;
    expect(text(result.stemHtml)).toContain('Arrange:A.Opening.');
    expect(result.choices[0].text).toBe('A-B-C-D-E');
    expect(result.choices[3].text).toBe('E-D-C-B-A');
  });
  it('keeps unusual or incomplete sources intact instead of guessing at option boundaries', () => {
    expect(splitExamChoices('<p>A B C D</p>', ['A', 'B', 'C', 'D'])).toBeNull();
    expect(splitExamChoices('<p>A. First C. Third D. Fourth</p>', ['A', 'B', 'C', 'D'])).toBeNull();
    expect(splitExamChoices('<p>A. <img src="/answer.png"> B. second</p>', ['A', 'B'])).toBeNull();
    expect(splitExamChoices('<p>True or false?</p>', ['T', 'F'])).toBeNull();
  });
  it('uses two rows for sentence answers and four only for very long options', () => {
    const options = (length: number) => ['A', 'B', 'C', 'D'].map(label => `<p>${label}. ${'word '.repeat(length)}</p>`).join('');
    expect(splitExamChoices(options(18), ['A', 'B', 'C', 'D'])!.size).toBe('medium');
    expect(splitExamChoices(options(30), ['A', 'B', 'C', 'D'])!.size).toBe('long');
  });
  it('preserves every character, underline and image across all four grades', () => {
    let reflowed = 0;
    for (const grade of [6, 7, 8, 9]) {
      const dir = resolve(`public/data/grade${grade}-midterm`);
      for (const file of readdirSync(dir).filter(f => /^vedec.*\.json$/.test(f))) {
        const exam: Grade6Exam = JSON.parse(readFileSync(resolve(dir, file), 'utf8'));
        for (const q of exam.sections.flatMap(s => s.questions)) {
          const result = splitExamChoices(q.html, q.options);
          if (!result) continue;
          reflowed++;
          const joined = result.stemHtml + result.choices.map(c => c.html).join('');
          const before = source(q.html);
          const after = source(joined);
          expect(after.textContent!.replace(/\s+/g, ''), `${file}/${q.id}`).toBe(before.textContent!.replace(/\s+/g, ''));
          expect(after.querySelectorAll('img').length).toBe(before.querySelectorAll('img').length);
          expect([...after.querySelectorAll('u')].map(u => u.textContent).join('')).toBe([...before.querySelectorAll('u')].map(u => u.textContent).join(''));
          expect(result.choices.map(c => c.label)).toEqual(q.options);
        }
      }
    }
    expect(reflowed).toBeGreaterThan(1500);
  }, 30000);
});
