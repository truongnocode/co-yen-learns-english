// Publishes only the safe score projection of existing finalized papers.
// Dry run by default. Uses the owner's existing Firebase CLI login, never browser tokens.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { publicExamResult } from '../src/lib/examLeaderboard.ts';
const args = process.argv.slice(2);
const authModule = args.find(a => a.startsWith('--firebase-cli-auth='))?.split('=').slice(1).join('=');
if (!authModule) throw new Error('Supply --firebase-cli-auth=<installed firebase-tools/lib/auth.js>. Add --publish after reviewing dry-run counts.');
const publish = args.includes('--publish');
const login = JSON.parse(await readFile(join(homedir(), '.config/configstore/firebase-tools.json'), 'utf8'));
const { getAccessToken } = createRequire(import.meta.url)(authModule);
const token = await getAccessToken(login.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
const env = Object.fromEntries((await readFile('.env.local', 'utf8')).split(/\r?\n/).filter(line => /^VITE_FIREBASE_\w+=/.test(line)).map(line => { const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')]; }));
const project = env.VITE_FIREBASE_PROJECT_ID;
if (project !== 'english-class-28f06') throw new Error('Unexpected project; review target before proceeding.');
const root = `projects/${project}/databases/(default)/documents`;
const base = `https://firestore.googleapis.com/v1/${root}`;
async function request(url, body) {
  const response = await fetch(url, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok) throw new Error(`Firestore request failed: ${response.status} ${data.error?.status || ''}`);
  return data;
}
function decode(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  return null;
}
const safeFields = ['version', 'studentName', 'className', 'grade', 'examId', 'examTitle', 'mode', 'score', 'finishedAt', 'state', 'total'];
let pageToken = '', scanned = 0;
const writes = [], byGrade = {};
do {
  const params = new URLSearchParams({ pageSize: '500', ...(pageToken ? { pageToken } : {}) });
  safeFields.forEach(f => params.append('mask.fieldPaths', f));
  const page = await request(`${base}/exam_submissions?${params}`);
  for (const item of page.documents || []) {
    scanned++;
    const summary = publicExamResult(Object.fromEntries(Object.entries(item.fields || {}).map(([k, v]) => [k, decode(v)])));
    if (!summary) continue;
    byGrade[summary.grade] = (byGrade[summary.grade] || 0) + 1;
    writes.push({ update: { name: `${root}/exam_leaderboard/${item.name.split('/').at(-1)}`, fields: Object.fromEntries(Object.entries(summary).map(([k, v]) => [k, typeof v === 'string' ? { stringValue: v } : Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }])) } });
  }
  pageToken = page.nextPageToken || '';
} while (pageToken);
if (publish) for (let i = 0; i < writes.length; i += 400) await request(`${base}:commit`, { writes: writes.slice(i, i + 400) });
const report = { at: new Date().toISOString(), project, published: publish, scanned, eligible: writes.length, byGrade, excluded: scanned - writes.length };
await mkdir('tmp/exam-results', { recursive: true });
await writeFile('tmp/exam-results/leaderboard-backfill.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
