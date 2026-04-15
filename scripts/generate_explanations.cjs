/**
 * Batch generate explanations for all MCQ questions using Gemini API.
 *
 * Usage: node scripts/generate_explanations.js
 *
 * Processes all JSON data files and adds "explain" field to every MCQ question.
 * Sends questions in batches of 20 to Gemini for efficient processing.
 * Skips questions that already have explanations.
 */

const fs = require("fs");
const path = require("path");

const GEMINI_API_KEY = "AIzaSyBFT2EEz_Gtv_O7YD9r5stkhMTknLhEMSM";
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
];
const BATCH_SIZE = 20;
const DATA_DIR = path.join(__dirname, "..", "public", "data");
const DIST_DIR = path.join(__dirname, "..", "dist", "data");

let currentModelIdx = 0;
let requestCount = 0;

async function callGemini(prompt, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const model = MODELS[currentModelIdx % MODELS.length];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        }),
      });

      requestCount++;

      if (res.status === 429) {
        console.log(`  Rate limited on ${model}, switching model & waiting...`);
        currentModelIdx++;
        await sleep(5000);
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        console.log(`  API error (${res.status}): ${err.substring(0, 200)}`);
        currentModelIdx++;
        await sleep(1000);
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response");
      return JSON.parse(text);
    } catch (e) {
      console.log(`  Attempt ${attempt + 1} failed: ${e.message}`);
      if (attempt < retries - 1) {
        currentModelIdx++;
        await sleep(1500);
      }
    }
  }
  return null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function buildPrompt(questions) {
  const items = questions.map((q, i) => ({
    idx: i,
    question: q.q,
    options: q.opts.map((o, j) => `${String.fromCharCode(65 + j)}. ${o}`),
    correct: String.fromCharCode(65 + q.ans),
  }));

  return `You are an English teacher explaining answers to Vietnamese middle/high school students.
For each multiple-choice question below, write a SHORT explanation in Vietnamese (1-3 sentences max).
The explanation must:
1. Briefly say WHY the correct answer is right (grammar rule, meaning, context)
2. If relevant, briefly note why 1-2 common wrong choices are incorrect
3. Keep it simple, easy to understand for grade 6-10 students
4. Use Vietnamese language

Return a JSON array of objects with "idx" (number) and "explain" (string).

Questions:
${JSON.stringify(items, null, 2)}

Return format: [{"idx": 0, "explain": "..."}, {"idx": 1, "explain": "..."}, ...]`;
}

async function processBatch(questions, label) {
  const prompt = buildPrompt(questions);
  const result = await callGemini(prompt);

  if (!result || !Array.isArray(result)) {
    console.log(`  WARNING: Failed to get explanations for batch "${label}"`);
    return 0;
  }

  let count = 0;
  for (const item of result) {
    if (item.idx >= 0 && item.idx < questions.length && item.explain) {
      questions[item.idx].explain = item.explain;
      count++;
    }
  }
  return count;
}

async function processFile(filename, extractFn, label) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filename} (not found)`);
    return;
  }

  console.log(`\n=== Processing ${label} (${filename}) ===`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const allQuestions = extractFn(data);

  // Filter questions without explanations
  const needExplain = allQuestions.filter(q => !q.explain);
  console.log(`  Total MCQ: ${allQuestions.length}, Need explanations: ${needExplain.length}`);

  if (needExplain.length === 0) {
    console.log("  All questions already have explanations. Skipping.");
    return;
  }

  // Process in batches
  for (let i = 0; i < needExplain.length; i += BATCH_SIZE) {
    const batch = needExplain.slice(i, i + BATCH_SIZE);
    const batchLabel = `${label} [${i + 1}-${Math.min(i + BATCH_SIZE, needExplain.length)}/${needExplain.length}]`;
    process.stdout.write(`  ${batchLabel}...`);

    const count = await processBatch(batch, batchLabel);
    console.log(` ${count}/${batch.length} done`);

    // Rate limit protection
    await sleep(1500);
  }

  // Save back to both public and dist
  const output = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, output);
  const distPath = path.join(DIST_DIR, filename);
  if (fs.existsSync(DIST_DIR)) fs.writeFileSync(distPath, output);
  console.log(`  Saved ${filename}`);
}

// === Extraction functions ===

function extractSGK(data) {
  const all = [];
  for (const unit of Object.values(data.units)) {
    if (unit.exercises) all.push(...unit.exercises);
  }
  return all;
}

function extractGrade10Vocab(data) {
  const all = [];
  for (const topic of Object.values(data)) {
    if (topic.questions) all.push(...topic.questions);
  }
  return all;
}

function extractGrade10Grammar(data) {
  const all = [];
  for (const topic of Object.values(data)) {
    if (topic.exercises?.mcq?.questions) all.push(...topic.exercises.mcq.questions);
  }
  return all;
}

function extractGrade10Tests(data) {
  const all = [];
  for (const test of Object.values(data)) {
    if (test.partA?.questions) all.push(...test.partA.questions);
    if (test.partB?.cloze?.questions) all.push(...test.partB.cloze.questions);
    if (test.partB?.signs) all.push(...test.partB.signs);
    if (test.partB?.reading1?.questions) all.push(...test.partB.reading1.questions);
    if (test.partB?.reading2?.questions) all.push(...test.partB.reading2.questions);
  }
  return all;
}

function extractGrade10Reading(data) {
  const all = [];
  if (data.signs) {
    for (const ex of Object.values(data.signs)) {
      if (ex.questions) all.push(...ex.questions);
    }
  }
  if (data.cloze) {
    for (const item of data.cloze) {
      if (item.questions) all.push(...item.questions);
    }
  }
  if (data.comprehension) {
    for (const item of data.comprehension) {
      if (item.questions) all.push(...item.questions);
    }
  }
  return all;
}

// === Main ===

async function main() {
  console.log("Generating explanations for all MCQ questions...");
  console.log(`Data dir: ${DATA_DIR}`);
  console.log(`Batch size: ${BATCH_SIZE}`);

  const startTime = Date.now();

  // SGK Grades 6-9
  for (const grade of [6, 7, 8, 9]) {
    await processFile(`sgk_eng${grade}_data.json`, extractSGK, `SGK Grade ${grade}`);
  }

  // Grade 10
  await processFile("grade10_vocab.json", extractGrade10Vocab, "Grade 10 Vocab");
  await processFile("grade10_grammar.json", extractGrade10Grammar, "Grade 10 Grammar");
  await processFile("grade10_tests.json", extractGrade10Tests, "Grade 10 Tests");
  await processFile("grade10_reading.json", extractGrade10Reading, "Grade 10 Reading");

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone! ${requestCount} API requests in ${elapsed}s`);
}

main().catch(console.error);
