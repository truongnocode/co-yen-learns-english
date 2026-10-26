// Read-only presentation audit, including the legacy grade 10 source.
// Run: node scripts/audit-exam-layout.mjs
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { compactExamHtml, compactExamText, compactExamInstruction } from '../src/lib/compactExamContent.ts';
import { splitExamChoices } from '../src/lib/examChoiceLayout.ts';

const dom = new JSDOM('');
for (const name of ['document', 'Node', 'NodeFilter', 'Element', 'DOMParser']) globalThis[name] = dom.window[name];
const output = resolve('tmp/exam-compact-audit');
mkdirSync(output, { recursive: true });
const rows = [];
const issues = [];
const changes = [];
const parse = html => { const el = document.createElement('div'); el.innerHTML = html; return el; };
const onlyPrint = text => /^(?:[\s_.…–—-]+|[-–—\s]*(?:the\s+end|hết)[-–—\s.!]*)$/i.test(text);
const words = text => (compactExamInstruction(text).toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).sort().join('|');
const flags = value => ({ longBlank: /(?:[_….][ \t]*){12,}|[-–—]{10,}/.test(value), wideSpaces: /[ \t\u00a0]{8,}/.test(value) });

for (const grade of [6, 7, 8, 9]) {
  const dir = resolve(`public/data/grade${grade}-midterm`);
  const row = { grade, papers: 0, questions: 0, fields: 0, changedFields: 0, longBlankBefore: 0, longBlankAfter: 0, images: 0, audio: 0, followingInstructions: 0 };
  for (const file of readdirSync(dir).filter(f => /^vedec.*\.json$/.test(f))) {
    const exam = JSON.parse(readFileSync(resolve(dir, file), 'utf8'));
    row.papers++; row.audio += exam.audio.length;
    for (const section of exam.sections) {
      row.questions += section.questions.length;
      const fields = [{ key: `${section.id}/intro`, html: section.introHtml, options: {} }];
      for (const q of section.questions) {
        fields.push({ key: q.id, html: q.html, options: { questionNumber: q.number, manual: q.kind === 'manual' }, labels: q.options });
        if (q.referenceHtml) fields.push({ key: q.id + '/reference', html: q.referenceHtml, options: {} });
      }
      for (const field of fields) {
        row.fields++;
        const after = compactExamHtml(field.html, field.options);
        const beforeRoot = parse(field.html); const afterRoot = parse(after);
        const key = `${exam.id}/${field.key}`;
        row.longBlankBefore += Number(flags(beforeRoot.textContent).longBlank);
        row.longBlankAfter += Number(flags(afterRoot.textContent).longBlank);
        if (after !== field.html) { row.changedFields++; changes.push(key); }
        const beforeImages = [...beforeRoot.querySelectorAll('img')].map(i => i.getAttribute('src'));
        row.images += beforeImages.length;
        if (JSON.stringify(beforeImages) !== JSON.stringify([...afterRoot.querySelectorAll('img')].map(i => i.getAttribute('src')))) issues.push({ key, issue: 'image changed' });
        for (const p of beforeRoot.querySelectorAll('p')) if (!p.querySelector('img,table') && onlyPrint(p.textContent.trim())) p.remove();
        let expected = beforeRoot.textContent;
        const prefix = expected.match(/^\s*(?:(?:Question\s*n?|Câu)\s*)?(\d+)\s*[.:)]\s*/i);
        if (prefix && prefix[1] === field.options.questionNumber) expected = expected.slice(prefix[0].length);
        afterRoot.querySelectorAll('details.exam-rubric > summary').forEach(el => el.remove());
        if (words(expected) !== words(afterRoot.textContent)) issues.push({ key, issue: 'words changed', before: expected.slice(0, 260), after: afterRoot.textContent.slice(0, 260) });
        if (field.labels) {
          const layout = splitExamChoices(after, field.labels);
          if (layout?.afterHtml) row.followingInstructions++;
        }
      }
    }
  }
  rows.push(row);
}
const grade10 = JSON.parse(readFileSync('public/data/grade10_tests.json', 'utf8'));
const row = { grade: 10, papers: Object.keys(grade10).length, questions: 0, fields: 0, changedFields: 0, longBlankBefore: 0, longBlankAfter: 0 };
function visit(value, key = '') {
  if (Array.isArray(value)) { value.forEach((v, i) => visit(v, `${key}/${i}`)); return; }
  if (!value || typeof value !== 'object') return;
  if (typeof value.q === 'string') row.questions++;
  for (const [name, item] of Object.entries(value)) {
    if (['q', 'passage', 'opts'].includes(name)) {
      for (const [i, text] of (Array.isArray(item) ? item : [item]).entries()) {
        if (typeof text !== 'string') continue;
        row.fields++;
        const after = compactExamText(text);
        row.longBlankBefore += Number(flags(text).longBlank); row.longBlankAfter += Number(flags(after).longBlank);
        if (after !== text) { row.changedFields++; changes.push(`grade10/${key}/${name}/${i}`); }
        const expected = text.split(/\r?\n/).filter(line => !onlyPrint(line.trim())).join('\n');
        if (words(expected) !== words(after)) issues.push({ key: `${key}/${name}/${i}`, issue: 'words changed' });
      }
    } else if (typeof item === 'object') visit(item, `${key}/${name}`);
  }
}
visit(grade10); rows.push(row);
const report = { rows, issues, result: issues.length ? 'FAIL' : 'PASS' };
writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2));
writeFileSync(resolve(output, 'changed-fields.txt'), changes.join('\n'));
console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
