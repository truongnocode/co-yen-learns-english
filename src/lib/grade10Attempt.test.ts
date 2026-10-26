import { beforeEach, describe, expect, it } from 'vitest';
import { examSignature, grade10AttemptKey, newGrade10Attempt, restoreGrade10Attempt } from './grade10Attempt';
const identity = { studentName: 'Test Student', className: '10A1' };
beforeEach(() => localStorage.clear());
describe('grade 10 content matching', () => {
  it('ignores Firestore field order and import metadata, but detects changed answers', () => {
    const a = { title: 'Paper', partA: { questions: [{ q: 'Question', opts: ['A', 'B'], ans: 0 }] }, partB: {}, partC: {}, seededAt: 1 };
    const b = { seededAt: 2, partC: {}, partB: {}, partA: { questions: [{ ans: 0, opts: ['A', 'B'], q: 'Question' }] }, title: 'Paper' };
    expect(examSignature(a)).toBe(examSignature(b));
    b.partA.questions[0].ans = 1;
    expect(examSignature(a)).not.toBe(examSignature(b));
  });
  it('migrates the initial order-dependent checksum without losing an unfinished attempt', () => {
    const key = grade10AttemptKey('test1', identity);
    const attempt = { ...newGrade10Attempt(2, identity), current: 1, userAnswers: [0, null] };
    localStorage.setItem(key, JSON.stringify({ signature: 'abc123', attempt }));
    expect(restoreGrade10Attempt(key, 'v2:changed-order', [['A', 'B'], ['C', 'D']], 0)).toEqual(attempt);
    localStorage.setItem(key, JSON.stringify({ signature: 'v2:different-content', attempt }));
    expect(restoreGrade10Attempt(key, 'v2:changed-order', [['A', 'B'], ['C', 'D']], 0)).toBeNull();
  });
});
