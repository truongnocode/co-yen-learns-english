#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, "..");
const extractorPath = path.join(projectDir, "services", "transcript-extractor", "server.mjs");

const args = parseArgs(process.argv.slice(2));
const videoUrl = args.videoUrl ?? args.url ?? args._[0];
if (!videoUrl) {
  console.error("Usage: node scripts/evaluate-rhythm-engines.mjs --video-url URL [--engines whisperx,ffmpeg] [--out DIR]");
  process.exit(1);
}

const videoId = extractYouTubeVideoId(videoUrl) ?? "video";
const defaultEngines = ["whisperx", "ffmpeg"];
const engines = String(args.engines ?? defaultEngines.join(","))
  .split(",")
  .map((engine) => engine.trim())
  .filter(Boolean)
  .map(normalizeEngine);
const outDir = path.resolve(args.out ?? path.join(projectDir, "tmp", "rhythm-evals", `${videoId}-${timestampSlug()}`));

await mkdir(outDir, { recursive: true });

const results = [];
for (const engine of engines) {
  results.push(await runEngine(engine));
}

const summary = {
  videoUrl,
  videoId,
  createdAt: new Date().toISOString(),
  engines: results,
};

await writeFile(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2), "utf8");
await writeFile(path.join(outDir, "summary.md"), renderMarkdown(summary), "utf8");
await writeFile(path.join(outDir, "teacher-review-template.csv"), renderTeacherReviewTemplate(summary), "utf8");

console.log(JSON.stringify({ ok: true, outDir, engines: results.map(({ engine, ok }) => ({ engine, ok })) }, null, 2));

async function runEngine(engine) {
  const started = Date.now();
  const env = { ...process.env, RHYTHM_ENGINE: engine };
  const vramSampler = engine === "whisperx" ? startVramSampler() : null;

  try {
    const { stdout, stderr } = await runProcess(process.execPath, [extractorPath, "--extract", videoUrl], {
      cwd: projectDir,
      env,
      timeoutMs: Number(args.timeoutMs ?? 1_200_000),
    });
    const transcript = JSON.parse(stdout);
    const fileBase = `${engine}.transcript.json`;
    await writeFile(path.join(outDir, fileBase), JSON.stringify(transcript, null, 2), "utf8");
    return {
      engine,
      ok: true,
      runtimeMs: Date.now() - started,
      transcriptFile: fileBase,
      metrics: summarizeTranscript(transcript),
      vramPeakMb: vramSampler ? await vramSampler.stop() : null,
      stderrTail: stderr.slice(-1200),
    };
  } catch (error) {
    return {
      engine,
      ok: false,
      runtimeMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
      vramPeakMb: vramSampler ? await vramSampler.stop() : null,
    };
  }
}

function summarizeTranscript(transcript) {
  const lines = Array.isArray(transcript.lines) ? transcript.lines : [];
  const chunks = lines.flatMap((line) => (Array.isArray(line.rhythmChunks) ? line.rhythmChunks : []));
  const boundaries = chunks.map((chunk) => chunk.boundaryAfter).filter(Boolean);
  return {
    title: transcript.title ?? "",
    rhythmSource: transcript.rhythmSource ?? "none",
    lineCount: lines.length,
    wordCount: lines.reduce((sum, line) => sum + String(line.text ?? "").split(/\s+/).filter(Boolean).length, 0),
    rhythmLineCount: lines.filter((line) => Array.isArray(line.rhythmChunks) && line.rhythmChunks.length > 1).length,
    chunkCount: chunks.length,
    boundaryCount: boundaries.length,
    majorBoundaryCount: boundaries.filter((boundary) => boundary.type === "major").length,
    minorBoundaryCount: boundaries.filter((boundary) => boundary.type === "minor").length,
    lowConfidenceBoundaryCount: boundaries.filter((boundary) => Number(boundary.confidence) < 0.5).length,
  };
}

function renderMarkdown(summary) {
  const rows = summary.engines
    .map((result) => {
      if (!result.ok) {
        return `| ${result.engine} | fail | - | - | - | - | - | ${formatMs(result.runtimeMs)} | ${result.error?.replace(/\|/g, "/") ?? ""} |`;
      }
      const m = result.metrics;
      return `| ${result.engine} | ok | ${m.rhythmSource} | ${m.lineCount} | ${m.rhythmLineCount} | ${m.boundaryCount} | ${m.lowConfidenceBoundaryCount} | ${formatMs(result.runtimeMs)} | ${result.vramPeakMb ?? ""} |`;
    })
    .join("\n");

  return `# Rhythm engine evaluation

Video: ${summary.videoUrl}

Created: ${summary.createdAt}

| Engine | Status | Source | Lines | Rhythm lines | Boundaries | Low confidence | Runtime | VRAM peak MB / Error |
|---|---:|---|---:|---:|---:|---:|---:|---|
${rows}

## Teacher scoring

Use \`teacher-review-template.csv\` to record manual edits:

- add: missing boundary the teacher added.
- remove: machine boundary the teacher removed.
- change: machine boundary where \`/\` and \`//\` were swapped.

Decision metric: total edits per 100 words, plus teacher review time.
`;
}

function renderTeacherReviewTemplate(summary) {
  const header = "engine,lineId,lineText,machineBoundaries,teacherBoundaries,addCount,removeCount,changeCount,notes\n";
  const rows = [];
  for (const result of summary.engines) {
    if (!result.ok) continue;
    rows.push(`${csv(result.engine)},,,,,,,`);
  }
  return header + rows.join("\n") + "\n";
}

function runProcess(command, processArgs, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, processArgs, {
      cwd: options.cwd,
      env: options.env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${path.basename(command)} timed out after ${options.timeoutMs}ms`));
    }, options.timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.length > 30_000_000) {
        child.kill("SIGTERM");
        reject(new Error("Process stdout exceeded 30MB."));
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      if (stderr.length > 5_000_000) stderr = stderr.slice(-2_000_000);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${path.basename(command)} exited ${code}: ${stderr.slice(-2000)}`));
    });
  });
}

function startVramSampler() {
  let peak = null;
  let stopped = false;
  const sample = async () => {
    if (stopped) return;
    try {
      const { stdout } = await runProcess("nvidia-smi", ["--query-gpu=memory.used", "--format=csv,noheader,nounits"], {
        cwd: projectDir,
        env: process.env,
        timeoutMs: 5000,
      });
      for (const value of stdout.split(/\r?\n/).map((line) => Number(line.trim())).filter(Number.isFinite)) {
        peak = peak == null ? value : Math.max(peak, value);
      }
    } catch {
      stopped = true;
    }
  };
  const timer = setInterval(sample, 2500);
  sample();
  return {
    async stop() {
      stopped = true;
      clearInterval(timer);
      return peak;
    },
  };
}

function formatMs(ms) {
  if (!Number.isFinite(ms)) return "";
  return `${(ms / 1000).toFixed(1)}s`;
}

function csv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      parsed._.push(arg);
      continue;
    }
    const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      parsed[key] = true;
      continue;
    }
    parsed[key] = value;
    i++;
  }
  return parsed;
}

function normalizeEngine(value) {
  const engine = String(value ?? "").trim().toLowerCase();
  if (engine === "whisperx" || engine === "ffmpeg") return engine;
  throw new Error(`Unsupported rhythm engine "${value}". Use whisperx or ffmpeg.`);
}

function extractYouTubeVideoId(input) {
  const trimmed = String(input ?? "").trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (url.hostname.includes("youtube.com")) {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery && /^[a-zA-Z0-9_-]{11}$/.test(fromQuery)) return fromQuery;
    }
  } catch {
    return null;
  }

  return null;
}
