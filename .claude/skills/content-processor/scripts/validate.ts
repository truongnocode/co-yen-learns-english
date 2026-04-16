#!/usr/bin/env bun
/**
 * validate.ts — Zod schema validator for content-processor skill output.
 *
 * Validates an extracted JSON file against the canonical Zod schemas in
 * `src/lib/content-schema.ts`. Prints either:
 *   - { ok: true, kind, summary: {...} }  on success
 *   - { ok: false, errors: [...] }        on failure (exit code 1)
 *
 * Usage:
 *   bun .claude/skills/content-processor/scripts/validate.ts <file.json> --kind <kind>
 *
 * Where <kind> is one of:
 *   exam | sgk_unit | grade10_vocab | grade10_grammar | reading | writing | vocab_list
 *
 * For map-shaped files (sgk units, vocab topics, grammar topics, tests) the script
 * iterates each entry and reports per-key validation results.
 *
 * Run with bun (project's runtime). Resolves content-schema.ts directly via TS import.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import {
  ExamSchema,
  SgkUnitSchema,
  Grade10VocabTopicSchema,
  Grade10GrammarTopicSchema,
  ReadingPassageSchema,
  WritingPromptSchema,
  VocabItemSchema,
} from "../../../../src/lib/content-schema";

type Kind =
  | "exam"
  | "sgk_unit"
  | "grade10_vocab"
  | "grade10_grammar"
  | "reading"
  | "writing"
  | "vocab_list";

const SCHEMA_BY_KIND: Record<Kind, z.ZodTypeAny> = {
  exam: ExamSchema,
  sgk_unit: SgkUnitSchema,
  grade10_vocab: Grade10VocabTopicSchema,
  grade10_grammar: Grade10GrammarTopicSchema,
  reading: ReadingPassageSchema,
  writing: WritingPromptSchema,
  vocab_list: z.array(VocabItemSchema),
};

// Map-shaped files: top-level is { key: ItemSchema, ... }
const IS_MAP: Record<Kind, boolean> = {
  exam: true,           // grade10_tests.json is { test1: {...}, test2: {...} }
  sgk_unit: true,       // sgk_eng{N}_data.json is { units: { 0: {...}, 1: {...} } }
  grade10_vocab: true,  // grade10_vocab.json is { "1.1.1": {...} }
  grade10_grammar: true,// grade10_grammar.json is { "2.1": {...} }
  reading: false,       // grade10_reading.json is array
  writing: false,       // grade10_writing.json is array
  vocab_list: false,
};

function parseArgs() {
  const argv = process.argv.slice(2);
  if (argv.length < 3 || !argv.includes("--kind")) {
    console.error("Usage: bun validate.ts <file.json> --kind <kind>");
    console.error("Kinds: " + Object.keys(SCHEMA_BY_KIND).join(", "));
    process.exit(2);
  }
  const file = argv[0];
  const kindIdx = argv.indexOf("--kind");
  const kind = argv[kindIdx + 1] as Kind;
  if (!(kind in SCHEMA_BY_KIND)) {
    console.error(`Unknown --kind: ${kind}. Allowed: ${Object.keys(SCHEMA_BY_KIND).join(", ")}`);
    process.exit(2);
  }
  return { file: resolve(file), kind };
}

function formatIssues(issues: z.ZodIssue[]): string[] {
  return issues.slice(0, 50).map((i) => `  - ${i.path.join(".")}: ${i.message}`);
}

function validateOne(schema: z.ZodTypeAny, data: unknown, label: string) {
  const r = schema.safeParse(data);
  if (r.success) return { label, ok: true as const };
  return { label, ok: false as const, errors: formatIssues(r.error.issues) };
}

function main() {
  const { file, kind } = parseArgs();
  const raw = readFileSync(file, "utf8");
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(JSON.stringify({ ok: false, errors: [`JSON parse error: ${(e as Error).message}`] }));
    process.exit(1);
  }

  const schema = SCHEMA_BY_KIND[kind];
  const isMap = IS_MAP[kind];

  let allOk = true;
  const results: Array<{ label: string; ok: boolean; errors?: string[] }> = [];

  if (!isMap) {
    results.push(validateOne(schema, data, kind));
  } else if (kind === "sgk_unit") {
    // sgk_eng{N}_data.json wraps units: { units: { 0: {...}, 1: {...} } }
    const units = (data as { units?: Record<string, unknown> })?.units ?? data;
    if (typeof units !== "object" || units === null) {
      results.push({ label: "root", ok: false, errors: ["Expected `units` map at top level."] });
    } else {
      for (const [key, value] of Object.entries(units)) {
        results.push(validateOne(schema, value, `units[${key}]`));
      }
    }
  } else {
    // exam, vocab, grammar — top level is plain { key: item }
    if (typeof data !== "object" || data === null) {
      results.push({ label: "root", ok: false, errors: ["Expected object map at top level."] });
    } else {
      for (const [key, value] of Object.entries(data)) {
        results.push(validateOne(schema, value, `[${key}]`));
      }
    }
  }

  for (const r of results) if (!r.ok) allOk = false;

  const summary = {
    file,
    kind,
    entries: results.length,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
  };

  if (allOk) {
    console.log(JSON.stringify({ ok: true, ...summary }, null, 2));
    process.exit(0);
  } else {
    console.log(
      JSON.stringify(
        {
          ok: false,
          ...summary,
          failures: results.filter((r) => !r.ok),
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }
}

main();
