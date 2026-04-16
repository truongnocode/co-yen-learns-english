#!/usr/bin/env bun
/**
 * batch-import.ts — Batch-import grade-10 exam DOCX files into grade10_tests.json
 *
 * Pipeline per folder:
 *   1. Unrar .rar → tmp/batch-import/<testKey>/unpacked/
 *   2. Identify DOCX files (exam vs answer-key heuristic by filename/content)
 *   3. Run extract_docx.py → extracted/source.md + extracted/images/
 *   4. Spawn `claude -p --model sonnet` with prompt pointing at source.md
 *   5. Claude writes output.json to tmp/batch-import/<testKey>/output.json
 *   6. Validate with bun validate.ts
 *   7. Copy images to public/data/images/extracted/grade10/<testKey>/
 *   8. Merge into public/data/grade10_tests.json (idempotent — skip existing keys)
 *
 * Usage:
 *   bun scripts/batch-import.ts                          # process all
 *   bun scripts/batch-import.ts --limit 3                # only first 3 (pilot)
 *   bun scripts/batch-import.ts --from 010 --limit 5     # resume from folder 010
 *   bun scripts/batch-import.ts --concurrency 5          # parallel workers (default 3)
 *   bun scripts/batch-import.ts --dry-run                # plan only, no LLM calls
 */

import { spawn } from "bun";
import { readdir, mkdir, copyFile, rm, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// ─── Config ─────────────────────────────────────────────────────────────────
const CLAUDE_EXE = "C:\\Users\\Truong\\AppData\\Roaming\\Claude\\claude-code\\2.1.92\\claude.exe";
const UNRAR_EXE = "C:\\Program Files\\WinRAR\\UnRAR.exe";
const PYTHON = "python";

const PROJECT_ROOT = path.resolve(import.meta.dir, "..");
const INPUT_ROOT = "D:\\WORK\\Claude\\downloads\\tienganh\\files";
const WORK_ROOT = path.join(PROJECT_ROOT, "tmp", "batch-import");
const IMAGES_ROOT = path.join(PROJECT_ROOT, "public", "data", "images", "extracted", "grade10");
const TESTS_JSON = path.join(PROJECT_ROOT, "public", "data", "grade10_tests.json");
const EXTRACT_SCRIPT = path.join(PROJECT_ROOT, ".claude", "skills", "content-processor", "scripts", "extract_docx.py");
const VALIDATE_SCRIPT = path.join(PROJECT_ROOT, ".claude", "skills", "content-processor", "scripts", "validate.ts");
const LOG_FILE = path.join(WORK_ROOT, "batch.log");
const FAIL_FILE = path.join(WORK_ROOT, "failed.json");

// ─── Args ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function arg(name: string, fallback?: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
}
const LIMIT = parseInt(arg("--limit", "0")!) || 0;
const FROM = arg("--from", "002")!;
const CONCURRENCY = parseInt(arg("--concurrency", "3")!) || 3;
const DRY_RUN = args.includes("--dry-run");
const RETRY = parseInt(arg("--retry", "1")!) || 1;

// ─── Logging ────────────────────────────────────────────────────────────────
async function log(line: string) {
  const stamped = `[${new Date().toISOString()}] ${line}`;
  console.log(stamped);
  await writeFile(LOG_FILE, stamped + "\n", { flag: "a" }).catch(() => {});
}

// ─── Folder → testKey mapping ───────────────────────────────────────────────
function folderToTestKey(folderName: string): string | null {
  const m = folderName.match(/^(\d{3})_/);
  return m ? `test${m[1]}` : null;
}

// ─── Exec helper ────────────────────────────────────────────────────────────
async function run(cmd: string[], opts?: { cwd?: string; timeout?: number; stdin?: string; stdoutFile?: string; stderrFile?: string }): Promise<{ code: number; stdout: string; stderr: string }> {
  // Use file-based stdio to avoid pipe backpressure hangs with verbose children (e.g. Claude CLI).
  const useFiles = !!(opts?.stdoutFile || opts?.stderrFile) || cmd[0].toLowerCase().includes("claude.exe");
  const tmpStdout = opts?.stdoutFile ?? path.join(WORK_ROOT, `.stdout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.log`);
  const tmpStderr = opts?.stderrFile ?? path.join(WORK_ROOT, `.stderr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.log`);

  const proc = spawn({
    cmd,
    cwd: opts?.cwd,
    stdin: opts?.stdin !== undefined ? new Response(opts.stdin) : "ignore",
    stdout: useFiles ? Bun.file(tmpStdout) : "pipe",
    stderr: useFiles ? Bun.file(tmpStderr) : "pipe",
  });
  const timeout = opts?.timeout ?? 600_000;
  const timer = setTimeout(() => proc.kill(), timeout);
  let stdout = "", stderr = "";
  if (useFiles) {
    await proc.exited;
    clearTimeout(timer);
    try { stdout = await Bun.file(tmpStdout).text(); } catch {}
    try { stderr = await Bun.file(tmpStderr).text(); } catch {}
    if (!opts?.stdoutFile) { try { await rm(tmpStdout); } catch {} }
    if (!opts?.stderrFile) { try { await rm(tmpStderr); } catch {} }
  } else {
    [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
    await proc.exited;
    clearTimeout(timer);
  }
  return { code: proc.exitCode ?? -1, stdout, stderr };
}

// ─── Per-folder pipeline ────────────────────────────────────────────────────
async function processFolder(folderName: string, existingKeys: Set<string>): Promise<{ ok: boolean; testKey: string; reason?: string }> {
  const testKey = folderToTestKey(folderName);
  if (!testKey) return { ok: false, testKey: folderName, reason: "bad folder name" };

  if (existingKeys.has(testKey)) {
    await log(`SKIP ${testKey} (already in grade10_tests.json)`);
    return { ok: true, testKey, reason: "already exists" };
  }

  await log(`START ${testKey} ← ${folderName}`);
  const workDir = path.join(WORK_ROOT, testKey);
  const unpackedDir = path.join(workDir, "unpacked");
  const extractedDir = path.join(workDir, "extracted");
  const outputJson = path.join(workDir, "output.json");

  await mkdir(unpackedDir, { recursive: true });
  await mkdir(extractedDir, { recursive: true });

  // Step 1: extract archives (rar/zip) or copy raw docx
  const folderPath = path.join(INPUT_ROOT, folderName);
  const entries = await readdir(folderPath);
  const rarFiles = entries.filter(f => f.toLowerCase().endsWith(".rar"));
  const zipFiles = entries.filter(f => f.toLowerCase().endsWith(".zip"));
  const docxDirectly = entries.filter(f => f.toLowerCase().endsWith(".docx") && !f.startsWith("~$"));
  const pdfDirectly = entries.filter(f => f.toLowerCase().endsWith(".pdf"));

  if (rarFiles.length === 0 && zipFiles.length === 0 && docxDirectly.length === 0 && pdfDirectly.length === 0) {
    return { ok: false, testKey, reason: "no .rar/.zip/.docx/.pdf in folder" };
  }

  for (const rar of rarFiles) {
    const { code, stderr } = await run([UNRAR_EXE, "x", "-y", "-o+", path.join(folderPath, rar), unpackedDir + path.sep], { timeout: 120_000 });
    if (code !== 0) return { ok: false, testKey, reason: `unrar failed: ${stderr.slice(0, 200)}` };
  }
  for (const zip of zipFiles) {
    const { code, stderr } = await run(["unzip", "-o", "-q", path.join(folderPath, zip), "-d", unpackedDir], { timeout: 120_000 });
    if (code !== 0) return { ok: false, testKey, reason: `unzip failed: ${stderr.slice(0, 200)}` };
  }
  for (const dx of docxDirectly) {
    await copyFile(path.join(folderPath, dx), path.join(unpackedDir, dx));
  }
  for (const pdf of pdfDirectly) {
    await copyFile(path.join(folderPath, pdf), path.join(unpackedDir, pdf));
  }

  // Step 2: find DOCX and PDF files recursively
  async function findByExt(dir: string, exts: string[]): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const results: string[] = [];
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) results.push(...(await findByExt(p, exts)));
      else if (exts.some(x => e.name.toLowerCase().endsWith(x)) && !e.name.startsWith("~$")) results.push(p);
    }
    return results;
  }
  const docxFiles = await findByExt(unpackedDir, [".docx"]);
  const pdfFiles = await findByExt(unpackedDir, [".pdf"]);
  if (docxFiles.length === 0 && pdfFiles.length === 0) {
    return { ok: false, testKey, reason: "no .docx or .pdf files after extract" };
  }

  // Step 3: extract each DOCX (Python → markdown+images). PDFs go directly to Claude Read tool.
  const extractedSources: { kind: "docx" | "pdf"; path: string; md?: string; imagesDir?: string }[] = [];
  for (let i = 0; i < docxFiles.length; i++) {
    const subOut = path.join(extractedDir, `doc-${i + 1}`);
    const { code, stderr } = await run([PYTHON, EXTRACT_SCRIPT, docxFiles[i], "--out", subOut], { timeout: 60_000 });
    if (code !== 0) {
      await log(`  WARN extract failed for ${path.basename(docxFiles[i])}: ${stderr.slice(0, 200)}`);
      continue;
    }
    extractedSources.push({ kind: "docx", path: docxFiles[i], md: path.join(subOut, "source.md"), imagesDir: path.join(subOut, "images") });
  }
  for (const pdf of pdfFiles) {
    extractedSources.push({ kind: "pdf", path: pdf });
  }
  if (extractedSources.length === 0) return { ok: false, testKey, reason: "all DOCX extractions failed and no PDFs" };

  // Step 4: Claude LLM call
  const sourceRefs = extractedSources.map((s, i) => {
    if (s.kind === "docx") return `  - File ${i + 1} [DOCX→md]: ${s.md} (images at ${s.imagesDir})`;
    return `  - File ${i + 1} [PDF — use Read tool]: ${s.path}`;
  }).join("\n");
  const skipMarker = path.join(workDir, "SKIP_NO_EXAM.txt");
  const prompt = `Use the content-processor skill to extract a grade-10 Vietnamese English entrance exam from the provided source files.

Available extracted source files (${extractedSources.length} total):
${sourceRefs}

Folder name: "${folderName}"
Target testKey: "${testKey}"

Instructions:
1. Read each source file (use Read tool for PDF paths directly; for DOCX→md paths, open the .md file) and classify it: EXAM (has Part A/B/C structure, multiple-choice + reading + writing), ANSWER_KEY (short, labeled "ĐÁP ÁN", just letters like "1D 2B 3B..."), VOCAB_UNIT (chuyên đề từ vựng, word lists), GRAMMAR_TOPIC (chuyên đề ngữ pháp), SPEC_MATRIX (ma trận đề, bảng đặc tả), or OTHER.
2. If AT LEAST ONE source is an EXAM:
   a. Parse it into ExamSchema with: title (Vietnamese, mention school from folder name), grade: 10, partA, partB, partC (as available).
   b. Every MCQ must have Vietnamese 'explain' field citing the grammar/vocab rule (short, 1-2 sentences).
   c. Answer indices: A=0, B=1, C=2, D=3.
   d. If an ANSWER_KEY source exists, use it to set the correct 'ans' field for each question.
   e. For images: if a question references an image (sign question, visual aid), set 'image' to "data/images/extracted/grade10/${testKey}/<filename>" preserving the original filename.
   f. Write result as { "${testKey}": { ...ExamSchema } } to: ${outputJson}
   g. State "DONE" when done.
3. If NO source is an EXAM (e.g. only vocab units or grammar topics), create an empty marker file at ${skipMarker} with a single line describing what was actually in the folder. Do NOT write output.json. State "SKIP: <reason>".

Be concise. Do not narrate — just do the work.`;

  if (DRY_RUN) {
    await log(`DRY-RUN ${testKey}: would call claude with ${extractedSources.length} source files`);
    return { ok: true, testKey, reason: "dry-run" };
  }

  let lastError = "";
  for (let attempt = 1; attempt <= RETRY + 1; attempt++) {
    const { code, stdout, stderr } = await run(
      [
        CLAUDE_EXE,
        "--add-dir", workDir,
        "-p",
        "--model", "sonnet",
        "--dangerously-skip-permissions",
        "--no-session-persistence",
        "--output-format", "text",
        "--", prompt,
      ],
      { cwd: PROJECT_ROOT, timeout: 600_000 }
    );
    if (code !== 0) {
      lastError = `claude exit ${code}: ${stderr.slice(0, 300)}`;
      await log(`  attempt ${attempt}/${RETRY + 1} failed: ${lastError}`);
      continue;
    }
    if (existsSync(skipMarker)) {
      const skipReason = (await readFile(skipMarker, "utf-8").catch(() => "no exam content")).trim();
      await log(`SKIP ${testKey}: ${skipReason}`);
      return { ok: true, testKey, reason: `no-exam: ${skipReason}` };
    }
    if (!existsSync(outputJson)) {
      lastError = `claude did not write ${outputJson}. stdout tail: ${stdout.slice(-200)}`;
      await log(`  attempt ${attempt}/${RETRY + 1} no output: ${lastError}`);
      continue;
    }
    // Step 5: validate
    const val = await run([process.execPath, VALIDATE_SCRIPT, outputJson, "--kind", "exam"], { cwd: PROJECT_ROOT, timeout: 30_000 });
    if (val.code !== 0) {
      lastError = `validation failed: ${val.stdout}${val.stderr}`;
      await log(`  attempt ${attempt}/${RETRY + 1} validation failed`);
      continue;
    }
    // Success
    // Step 6: copy images
    const testImageDir = path.join(IMAGES_ROOT, testKey);
    const outputRaw = JSON.parse(await readFile(outputJson, "utf-8"));
    const exam = outputRaw[testKey];
    const imagePaths = new Set<string>();
    JSON.stringify(exam, (k, v) => {
      if (k === "image" && typeof v === "string") imagePaths.add(v);
      return v;
    });
    if (imagePaths.size > 0) {
      await mkdir(testImageDir, { recursive: true });
      for (const imgRel of imagePaths) {
        const filename = path.basename(imgRel);
        // Find filename in any extracted images dir
        let found = false;
        for (const src of extractedSources) {
          if (src.kind !== "docx" || !src.imagesDir) continue;
          const candidate = path.join(src.imagesDir, filename);
          if (existsSync(candidate)) {
            await copyFile(candidate, path.join(testImageDir, filename));
            found = true;
            break;
          }
        }
        if (!found) await log(`  WARN image not found: ${filename}`);
      }
    }

    // Step 7: merge into grade10_tests.json (re-read to pick up concurrent writes)
    const existing = JSON.parse(await readFile(TESTS_JSON, "utf-8"));
    if (existing[testKey]) {
      await log(`  SKIP merge — ${testKey} race-condition already exists`);
    } else {
      existing[testKey] = exam;
      await writeFile(TESTS_JSON, JSON.stringify(existing, null, 2), "utf-8");
    }
    await log(`DONE ${testKey} (attempt ${attempt})`);
    return { ok: true, testKey };
  }

  return { ok: false, testKey, reason: lastError };
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  await mkdir(WORK_ROOT, { recursive: true });

  // Read existing test keys for idempotency
  const tests = JSON.parse(await readFile(TESTS_JSON, "utf-8"));
  const existingKeys = new Set(Object.keys(tests));
  await log(`Existing test keys in grade10_tests.json: ${existingKeys.size}`);

  // Scan input folders
  const folders = (await readdir(INPUT_ROOT))
    .filter(f => /^\d{3}_/.test(f))
    .filter(f => f.localeCompare(FROM + "_") >= 0)
    .sort();

  const todo = folders.slice(0, LIMIT || folders.length);
  await log(`Scheduled ${todo.length} folders (from ${FROM}, limit ${LIMIT || "none"}, concurrency ${CONCURRENCY})`);

  const failures: { folder: string; reason: string }[] = [];
  let done = 0;

  // Worker pool
  const queue = [...todo];
  async function worker() {
    while (queue.length > 0) {
      const folder = queue.shift();
      if (!folder) break;
      try {
        const res = await processFolder(folder, existingKeys);
        done++;
        if (!res.ok) failures.push({ folder, reason: res.reason || "unknown" });
        else existingKeys.add(res.testKey);
        await log(`PROGRESS ${done}/${todo.length} | ${res.ok ? "✓" : "✗"} ${res.testKey}${res.ok ? "" : " — " + (res.reason || "unknown")}`);
      } catch (e: any) {
        done++;
        failures.push({ folder, reason: `exception: ${e.message}` });
        await log(`PROGRESS ${done}/${todo.length} | ✗ EXCEPTION ${folder}: ${e.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  await writeFile(FAIL_FILE, JSON.stringify(failures, null, 2), "utf-8");
  await log(`\n=== Batch complete: ${done - failures.length} ok, ${failures.length} failed ===`);
  if (failures.length > 0) await log(`Failures logged to ${FAIL_FILE}`);
}

main().catch(async e => {
  await log(`FATAL: ${e.stack || e.message}`);
  process.exit(1);
});
