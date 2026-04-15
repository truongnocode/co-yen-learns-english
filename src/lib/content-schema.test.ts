import { describe, it, expect } from "vitest";
import {
  ContentKind,
  ExamSchema,
  ImportResultSchema,
  McqSchema,
  SgkUnitSchema,
} from "./content-schema";

describe("McqSchema", () => {
  const valid = {
    q: "What is the opposite of 'hot'?",
    opts: ["warm", "cold", "cool", "freezing"],
    ans: 1,
    explain: "Đối lập của hot là cold.",
  };

  it("accepts a valid MCQ", () => {
    const p = McqSchema.safeParse(valid);
    expect(p.success).toBe(true);
  });

  it("rejects MCQ with fewer than 4 options", () => {
    const p = McqSchema.safeParse({ ...valid, opts: ["a", "b", "c"] });
    expect(p.success).toBe(false);
  });

  it("rejects MCQ with ans out of range", () => {
    const p = McqSchema.safeParse({ ...valid, ans: 4 });
    expect(p.success).toBe(false);
  });

  it("allows missing explain", () => {
    const { explain: _, ...rest } = valid;
    expect(McqSchema.safeParse(rest).success).toBe(true);
  });
});

describe("ExamSchema", () => {
  const mcq = (q: string, ans = 0) => ({
    q,
    opts: ["a", "b", "c", "d"],
    ans,
  });

  it("requires partA with at least one question", () => {
    const p = ExamSchema.safeParse({
      title: "Test",
      grade: 10,
      partA: { instruction: "Pick A/B/C/D", questions: [] },
      partB: {},
    });
    expect(p.success).toBe(false);
  });

  it("accepts a minimal exam with only partA", () => {
    const p = ExamSchema.safeParse({
      title: "Mock 1",
      grade: 10,
      partA: { instruction: "Pick", questions: [mcq("Q?")] },
      partB: {},
    });
    expect(p.success).toBe(true);
  });

  it("rejects grade below 3 or above 12", () => {
    const base = {
      title: "T",
      partA: { instruction: "x", questions: [mcq("?")] },
      partB: {},
    };
    expect(ExamSchema.safeParse({ ...base, grade: 2 }).success).toBe(false);
    expect(ExamSchema.safeParse({ ...base, grade: 13 }).success).toBe(false);
    expect(ExamSchema.safeParse({ ...base, grade: 10 }).success).toBe(true);
  });
});

describe("SgkUnitSchema", () => {
  it("requires vocabulary + exercises", () => {
    const p = SgkUnitSchema.safeParse({ title: "Unit 1" });
    expect(p.success).toBe(false);
  });

  it("accepts a well-formed unit", () => {
    const p = SgkUnitSchema.safeParse({
      title: "Unit 1: My Family",
      vocabulary: [{ en: "mother", ipa: "/ˈmʌðə/", type: "n", vi: "mẹ" }],
      exercises: [
        { q: "Who is __?", opts: ["a", "b", "c", "d"], ans: 0 },
      ],
    });
    expect(p.success).toBe(true);
  });

  it("rejects unknown word class", () => {
    const p = SgkUnitSchema.safeParse({
      title: "x",
      vocabulary: [{ en: "x", type: "nounish", vi: "y" }],
      exercises: [{ q: "?", opts: ["a", "b", "c", "d"], ans: 0 }],
    });
    expect(p.success).toBe(false);
  });
});

describe("ImportResultSchema", () => {
  it("dispatches on `kind`", () => {
    const vocab = {
      kind: ContentKind.Grade10Vocab,
      topicId: "family",
      topic: {
        name: "Family",
        questions: [{ q: "?", opts: ["a", "b", "c", "d"], ans: 0 }],
      },
    };
    expect(ImportResultSchema.safeParse(vocab).success).toBe(true);

    // Missing required `topic` for Grade10Vocab
    const bad = {
      kind: ContentKind.Grade10Vocab,
      topicId: "family",
    };
    expect(ImportResultSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects unknown kinds", () => {
    const p = ImportResultSchema.safeParse({
      kind: "not_a_kind",
      topicId: "x",
    });
    expect(p.success).toBe(false);
  });
});
