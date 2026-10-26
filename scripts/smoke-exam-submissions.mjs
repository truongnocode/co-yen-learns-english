// Opt-in production smoke test. Creates one clearly named test submission; never
// deletes data. Uses normal Firebase client ID tokens, so Security Rules apply.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
if (!process.argv.includes('--write-test-record')) throw new Error('Pass --write-test-record to create a labelled production test record.');
const env = Object.fromEntries((await readFile('.env.local', 'utf8')).split(/\r?\n/).filter(line => /^VITE_FIREBASE_\w+=/.test(line)).map(line => { const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')]; }));
const project = env.VITE_FIREBASE_PROJECT_ID;
const key = env.VITE_FIREBASE_API_KEY;
const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
const documentBase = `projects/${project}/databases/(default)/documents`;
const headers = { 'Content-Type': 'application/json', Referer: 'https://tienganhcoyen.online/' };
async function request(url, token, method = 'GET', body) {
  const response = await fetch(url, { method, headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json() };
}
async function anonymous() {
  const result = await request(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${key}`, null, 'POST', { returnSecureToken: true });
  assert.equal(result.status, 200, `Anonymous login failed: ${result.data.error?.message}`);
  return result.data;
}
function field(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(field) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, field(v)])) } };
}
function write(path, data, timestampField) {
  return { update: { name: `${documentBase}/${path}`, fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, field(v)])) }, ...(timestampField ? { updateTransforms: [{ fieldPath: timestampField, setToServerValue: 'REQUEST_TIME' }] } : {}) };
}
const owner = await anonymous();
const stranger = await anonymous();
const id = `codex-permissions-${crypto.randomUUID()}`;
const path = `exam_submissions/${id}`;
const startedAt = Date.now();
const submission = { version: 1, uid: owner.localId, studentName: 'KIỂM THỬ QUYỀN CODEX', className: 'TEST - Không phải học sinh', grade: 6, examId: 'codex-permission-check', examTitle: 'Kiểm thử quyền đọc / ghi', mode: 'test', startedAt, finishedAt: startedAt, correct: 1, total: 1, manual: 1, score: 10, questions: [
  { id: 'q1', number: '1', section: 'TEST', prompt: 'Permission test', context: '', options: ['T', 'F'], answer: 'T', expected: ['T'], status: 'correct' },
  { id: 'q2', number: '2', section: 'TEST', prompt: 'Writing test', context: '', options: [], answer: 'This is a labelled test submission.', expected: [], status: 'manual' },
] };
const results = [];
async function check(name, expectedStatus, result) {
  results.push({ name, expectedStatus, status: result.status });
  assert.equal(result.status, expectedStatus, `${name}: ${result.data.error?.message || 'Unexpected response'}`);
  console.log(`PASS ${name} (${result.status})`);
}
await check('owner can read an absent attempt for idempotent creation', 404, await request(`${base}/${path}`, owner.idToken));
await check('owner can submit', 200, await request(`${base}:commit`, owner.idToken, 'POST', { writes: [write(path, submission, 'receivedAt')] }));
await check('owner can read own submission', 200, await request(`${base}/${path}`, owner.idToken));
await check('signed-out visitor cannot read submission', 403, await request(`${base}/${path}`, null));
await check('another student cannot read submission', 403, await request(`${base}/${path}`, stranger.idToken));
await check('another student cannot list submissions', 403, await request(`${base}/exam_submissions`, stranger.idToken));
await check('owner cannot alter submitted answers', 403, await request(`${base}:commit`, owner.idToken, 'POST', { writes: [write(path, { ...submission, score: 0 }, 'receivedAt')] }));
await check('student cannot forge another owner', 403, await request(`${base}:commit`, stranger.idToken, 'POST', { writes: [write(`exam_submissions/codex-forged-${crypto.randomUUID()}`, submission, 'receivedAt')] }));
const review = { comment: 'Bài kiểm thử quyền của Codex, không phải kết quả học sinh.', writingScore: 8, reviewedBy: 'truongnq.vie@gmail.com' };
await check('student cannot grade own work', 403, await request(`${base}:commit`, owner.idToken, 'POST', { writes: [write(`${path}/reviews/teacher`, review, 'updatedAt')] }));
const draftPath = `exam_submissions/codex-draft-${crypto.randomUUID()}`;
const draft = { ...submission, studentName: 'KIỂM THỬ TIẾN TRÌNH CODEX', state: 'in_progress', revision: 10, answered: 1 };
await check('owner can create unfinished paper', 200, await request(`${base}:commit`, owner.idToken, 'POST', { writes: [write(draftPath, draft, 'receivedAt')] }));
const publicPath = draftPath.replace('exam_submissions/', 'exam_leaderboard/');
const publicSummary = Object.fromEntries(['version', 'studentName', 'className', 'grade', 'examId', 'examTitle', 'mode', 'score', 'finishedAt'].map(k => [k, draft[k]]));
await check('unfinished paper cannot be published to rankings', 403, await request(`${base}:commit`, owner.idToken, 'POST', { writes: [write(publicPath, publicSummary)] }));
await check('owner can save newer draft', 200, await request(`${base}:commit`, owner.idToken, 'POST', { writes: [write(draftPath, { ...draft, revision: 12, answered: 2 }, 'receivedAt')] }));
await check('stale draft revision is rejected', 403, await request(`${base}:commit`, owner.idToken, 'POST', { writes: [write(draftPath, { ...draft, revision: 11 }, 'receivedAt')] }));
await check('another student cannot edit draft', 403, await request(`${base}:commit`, stranger.idToken, 'POST', { writes: [write(draftPath, { ...draft, uid: stranger.localId, revision: 13 }, 'receivedAt')] }));
await check('draft cannot be reassigned to a different student name', 403, await request(`${base}:commit`, owner.idToken, 'POST', { writes: [write(draftPath, { ...draft, studentName: 'Another student', revision: 13 }, 'receivedAt')] }));
await check('draft finalizes and publishes safe summary atomically', 200, await request(`${base}:commit`, owner.idToken, 'POST', { writes: [write(draftPath, { ...draft, state: 'submitted', revision: 13 }, 'receivedAt'), write(publicPath, publicSummary)] }));
await check('delayed draft cannot reopen submitted paper', 403, await request(`${base}:commit`, owner.idToken, 'POST', { writes: [write(draftPath, { ...draft, revision: 14 }, 'receivedAt')] }));
const publicRead = await request(`${base}/${publicPath}`, null);
await check('signed-out visitor can read public score summary', 200, publicRead);
assert.deepEqual(Object.keys(publicRead.data.fields).sort(), Object.keys(publicSummary).sort());
await check('signed-out visitor can list rankings', 200, await request(`${base}/exam_leaderboard?pageSize=1`, null));
await check('another pupil cannot alter public summary', 403, await request(`${base}:commit`, stranger.idToken, 'POST', { writes: [write(publicPath, publicSummary)] }));
await check('owner cannot forge a different public score', 403, await request(`${base}:commit`, owner.idToken, 'POST', { writes: [write(publicPath, { ...publicSummary, score: 0 })] }));
await check('private answers cannot be added to public projection', 403, await request(`${base}:commit`, owner.idToken, 'POST', { writes: [write(publicPath, { ...publicSummary, questions: submission.questions })] }));
await check('owner cannot publish a result without a source paper', 403, await request(`${base}:commit`, owner.idToken, 'POST', { writes: [write(`exam_leaderboard/codex-missing-${crypto.randomUUID()}`, publicSummary)] }));
await check('signed-out visitor cannot read answers behind public ranking', 403, await request(`${base}/${draftPath}`, null));
await mkdir('tmp/exam-results', { recursive: true });
await writeFile('tmp/exam-results/permissions-smoke.json', JSON.stringify({ at: new Date().toISOString(), project, submissionId: id, draftPath, results }, null, 2));
console.log(`All ${results.length} production permission checks passed. Test record: ${id}`);
