/**
 * Seed Firestore from `public/data/*.json`.
 *
 * Runs once to bootstrap the admin-managed collections from the legacy JSON
 * dataset. Idempotent — honours `feedback_skip_existing`: a document is only
 * written if it does NOT already exist (unless `--force` is passed).
 *
 * Usage:
 *   node scripts/migrate-json-to-firestore.mjs           # seed all
 *   node scripts/migrate-json-to-firestore.mjs --force   # overwrite
 *   node scripts/migrate-json-to-firestore.mjs --only=exams,sgk
 *
 * Requires Firebase admin credentials — see scripts/grant-admin.mjs for
 * the credential loading convention.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import admin from "firebase-admin";

const args = process.argv.slice(2);
const force = args.includes("--force");
const onlyArg = args.find((a) => a.startsWith("--only="));
const only = onlyArg ? onlyArg.replace("--only=", "").split(",") : null;
const wants = (name) => !only || only.includes(name);

function loadCredentials() {
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    resolve("serviceAccount.json"),
  ].filter(Boolean);
  for (const p of candidates) {
    try {
      return JSON.parse(readFileSync(p, "utf-8"));
    } catch {
      /* continue */
    }
  }
  throw new Error(
    "Service account not found. Set GOOGLE_APPLICATION_CREDENTIALS or place serviceAccount.json in repo root.",
  );
}

admin.initializeApp({ credential: admin.credential.cert(loadCredentials()) });
const db = admin.firestore();

function loadJson(relPath) {
  const abs = resolve(relPath);
  if (!existsSync(abs)) return null;
  return JSON.parse(readFileSync(abs, "utf-8"));
}

async function setIfMissing(docRef, data, label) {
  if (!force) {
    const existing = await docRef.get();
    if (existing.exists) {
      console.log(`  skip (exists): ${label}`);
      return false;
    }
  }
  await docRef.set({
    ...data,
    seededAt: admin.firestore.FieldValue.serverTimestamp(),
    seededFrom: "public/data",
  });
  console.log(`  wrote: ${label}`);
  return true;
}

async function migrateSgk() {
  let total = 0;
  for (const grade of [3, 4, 5, 6, 7, 8, 9]) {
    const data = loadJson(`public/data/sgk_eng${grade}_data.json`);
    if (!data?.units) continue;
    console.log(`SGK grade ${grade}: ${Object.keys(data.units).length} units`);
    for (const [unitKey, unit] of Object.entries(data.units)) {
      const ref = db.doc(`sgk/grade${grade}/units/${unitKey}`);
      const payload = {
        kind: "sgk_unit",
        grade,
        unitKey,
        title: unit.title,
        vocabulary: unit.vocabulary ?? [],
        grammar: unit.grammar ?? null,
        grammar_notes: unit.grammar_notes ?? null,
        exercises: unit.exercises ?? [],
      };
      if (await setIfMissing(ref, payload, `sgk/grade${grade}/${unitKey}`)) total++;
    }
  }
  console.log(`SGK migration: ${total} docs written.\n`);
}

async function migrateGrade10Tests() {
  const data = loadJson("public/data/grade10_tests.json");
  if (!data) return;
  const keys = Object.keys(data);
  console.log(`Grade 10 tests: ${keys.length}`);
  let total = 0;
  for (const key of keys) {
    const exam = data[key];
    if (!exam || typeof exam !== "object") continue;
    const ref = db.doc(`exams/grade10/tests/${key}`);
    const payload = { kind: "exam", ...exam };
    if (await setIfMissing(ref, payload, `exams/grade10/tests/${key}`)) total++;
  }
  console.log(`Grade 10 tests: ${total} docs written.\n`);
}

async function migrateGrade10Vocab() {
  const data = loadJson("public/data/grade10_vocab.json");
  if (!data) return;
  const keys = Object.keys(data);
  console.log(`Grade 10 vocab: ${keys.length} topics`);
  let total = 0;
  for (const key of keys) {
    const topic = data[key];
    const ref = db.doc(`grade10_vocab/${key}`);
    const payload = { kind: "grade10_vocab", topicId: key, ...topic };
    if (await setIfMissing(ref, payload, `grade10_vocab/${key}`)) total++;
  }
  console.log(`Grade 10 vocab: ${total} docs written.\n`);
}

async function migrateGrade10Grammar() {
  const data = loadJson("public/data/grade10_grammar.json");
  if (!data) return;
  const keys = Object.keys(data);
  console.log(`Grade 10 grammar: ${keys.length} topics`);
  let total = 0;
  for (const key of keys) {
    const topic = data[key];
    const ref = db.doc(`grade10_grammar/${key}`);
    const payload = { kind: "grade10_grammar", topicId: key, ...topic };
    if (await setIfMissing(ref, payload, `grade10_grammar/${key}`)) total++;
  }
  console.log(`Grade 10 grammar: ${total} docs written.\n`);
}

// Entrypoint ─────────────────────────────────────────────────────────────────
if (wants("sgk")) await migrateSgk();
if (wants("exams")) await migrateGrade10Tests();
if (wants("vocab")) await migrateGrade10Vocab();
if (wants("grammar")) await migrateGrade10Grammar();

console.log("Done.");
process.exit(0);
