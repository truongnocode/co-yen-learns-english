import { describe, expect, it } from 'vitest';
import { compactExamHtml, compactExamInstruction, compactExamText } from './compactExamContent';
import { splitExamChoices } from './examChoiceLayout';

const root = (html: string) => {
  const el = document.createElement('div'); el.innerHTML = html; return el;
};

describe('paper formatting adapted for online exams', () => {
  it('shortens dotted and underlined blanks even when Word split them across runs', () => {
    const result = root(compactExamHtml('<p><strong>Question 33:</strong> There are many flowers in our garden.</p><p>=&gt; Our\n garden<u>________________</u><strong>___________________</strong>.</p>', { questionNumber: '33' }));
    expect(result.textContent).toContain('Our garden ____.');
    expect(result.textContent).toContain('There are many flowers in our garden.');
    expect(result.textContent).not.toMatch(/Question 33|_{5,}|\n/);
  });
  it('removes paper-only lines and end markers while retaining images, numbered blanks and passage content', () => {
    const result = root(compactExamHtml('<p>Read this passage. (1) …………….. cats; (2) ________ dogs.</p><p>.......................</p><p><img src="/sign.png"></p><p>---The end---</p><p> </p>'));
    expect(result.textContent).toBe('Read this passage. (1) ____ cats; (2) ____ dogs.');
    expect(result.querySelector('img')).toHaveAttribute('src', '/sign.png');
    expect(result.querySelectorAll('p')).toHaveLength(2);
  });
  it('keeps error-correction labels attached to the correct underlined phrases', () => {
    const result = root(compactExamHtml('<p><u>They</u> <u>is</u> <u>at</u> <u>school</u>.</p><p>A       B              C           D</p>'));
    expect([...result.querySelectorAll('u')].map(el => [el.textContent, el.nextElementSibling?.textContent?.trim()])).toEqual([['They', 'A'], ['is', 'B'], ['at', 'C'], ['school', 'D']]);
    expect(result.querySelectorAll('p')).toHaveLength(1);
  });
  it('keeps split-word underlining and images before a printed question number intact', () => {
    const result = root(compactExamHtml('<p><img src="/sign.png"></p><p>Question 2. We <u>d</u><u>onate</u> <u>books</u> to <u>schools</u>.</p><p>A    B    C    D</p>', { questionNumber: '2' }));
    expect(result.querySelector('img')).toHaveAttribute('src', '/sign.png');
    expect(result.textContent).toContain('We donate books');
    expect(result.querySelector('sup')).toBeNull();
    expect(result.querySelector('.exam-label-line')).not.toBeNull();
  });
  it('folds writing criteria without hiding the writing prompt or losing any criteria', () => {
    const result = root(compactExamHtml('<p>Write about your friend. Include name, age and hobbies.</p><p>1. Format: one paragraph.</p><p>2. Content: ideas and details.</p><p>3. Language: vocabulary.</p>', { manual: true }));
    expect(result.firstElementChild?.textContent).toContain('Write about your friend');
    expect(result.querySelector('details')?.textContent).toContain('Content: ideas and details.');
    expect(result.querySelector('details')).not.toHaveAttribute('open');
  });
  it('preserves word limits, scores, contractions, dates and natural ellipses', () => {
    const text = 'Write 100–120 words (1.0 pt). Use NO MORE THAN FIVE WORDS. Wait... don’t change 12.5 or 2026-2027.';
    expect(compactExamText(text)).toBe(text);
    const title = compactExamInstruction('I. Circle the letter A, B, C, or D to indicate the word whose underlined part is pronounced differently in each of the following questions. (0.5 point)');
    expect(title).toContain('underlined part is pronounced differently');
    expect(title).toContain('(0.5 point)');
    expect(title).not.toContain('in each of the following questions');
  });
  it('keeps the next exercise instruction outside option D and sizes only the actual answers', () => {
    const html = '<p>Choose a sentence.</p><p>A. First B. Second C. Third D. Fourth</p><p>Mark the letter A, B, C or D on your answer sheet to indicate the best arrangement of sentences in each of the following questions.</p>';
    const result = splitExamChoices(compactExamHtml(html), ['A', 'B', 'C', 'D'])!;
    expect(result.choices[3].html).not.toContain('best arrangement');
    expect(result.afterHtml).toContain('best arrangement');
    expect(result.size).toBe('short');
  });
});
