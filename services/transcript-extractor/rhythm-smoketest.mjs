// Offline smoke test for rhythm chunking (no audio / WhisperX / GPU needed).
// Runs the spaCy+benepar parser on a fixed set of sentences, then prints how the
// syntax-first prosody engine segments each one with `/` (minor) and `//` (major).
//
//   python available on PATH with spacy + benepar installed.
//   node services/transcript-extractor/rhythm-smoketest.mjs [grade]
//
// Use this to sanity-check chunking after changing server.mjs or
// syntax-boundaries.py. It is NOT a replacement for a teacher gold set (see
// docs/READFLOW-IMPROVEMENT-PROPOSAL-2026-06-17.md §5).

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { segmentLineForTest } from "./server.mjs";

const SERVICE_DIR = path.dirname(fileURLToPath(import.meta.url));
const PYTHON_BIN = process.env.PYTHON_BIN ?? process.env.PYTHON ?? "python";
const grades = process.argv[2] ? [Number(process.argv[2])] : [4, 6, 9];

const SENTENCES = [
  "You know that a bacterium is a very tiny organism, right?",
  "This is how it is able to infect the tiny bacterium and the cells in our bodies",
  "Well, a virus is so small that it's invisible to even a bacterium.",
  "A virus is a tiny germ that can make you sick.",
  "When a virus enters your body, it attacks your healthy cells and makes copies of itself.",
  "Viruses are everywhere.",
  "The sun gives us light and heat every single day.",
];

function runParser(lines) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [path.join(SERVICE_DIR, "syntax-boundaries.py")], {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(JSON.parse(stdout));
      else reject(new Error(stderr.slice(-500) || `parser exited ${code}`));
    });
    child.stdin.end(JSON.stringify({ lines }));
  });
}

const payload = SENTENCES.map((text, index) => ({ id: `s${index + 1}`, text }));
const parsed = await runParser(payload);
const byId = new Map(parsed.lines.map((line) => [line.id, line]));

for (const { id, text } of payload) {
  const syntaxLine = byId.get(id);
  console.log(`\n${text}`);
  for (const grade of grades) {
    const result = segmentLineForTest({ text, syntaxLine, grade });
    console.log(`  G${grade}: ${result.marked || text}${result.usedSyntax ? "" : "  [NO-SYNTAX]"}`);
  }
}
