import { describe, it, expect } from "vitest";
import { matchAnswer, normalizeAnswer } from "./answerMatch";

describe("normalizeAnswer", () => {
  it("lowercases and trims", () => {
    expect(normalizeAnswer("  Hello  ")).toBe("hello");
  });

  it("collapses whitespace", () => {
    expect(normalizeAnswer("I   love\tEnglish")).toBe("i love english");
  });

  it("strips trailing punctuation", () => {
    expect(normalizeAnswer("yes.")).toBe("yes");
    expect(normalizeAnswer("Really?!")).toBe("really");
    expect(normalizeAnswer("one,")).toBe("one");
  });

  it("converts smart quotes to straight", () => {
    expect(normalizeAnswer("\u2018it\u2019s\u2019")).toBe("'it's'");
    expect(normalizeAnswer("\u201chi\u201d")).toBe('"hi"');
  });
});

describe("matchAnswer", () => {
  it("accepts exact match", () => {
    expect(matchAnswer("I am fine", ["I am fine"])).toBe(true);
  });

  it("accepts any of multiple correct answers", () => {
    expect(matchAnswer("i am fine", ["I'm fine", "I am fine"])).toBe(true);
    expect(matchAnswer("I'm fine", ["I'm fine", "I am fine"])).toBe(true);
  });

  it("is case- and punctuation-insensitive", () => {
    expect(matchAnswer("YES.", ["yes"])).toBe(true);
    expect(matchAnswer("  hello!  ", ["Hello"])).toBe(true);
  });

  it("rejects incorrect answers", () => {
    expect(matchAnswer("I am tired", ["I am fine"])).toBe(false);
    expect(matchAnswer("", ["I am fine"])).toBe(false);
  });

  it("handles empty acceptable-answers list", () => {
    expect(matchAnswer("anything", [])).toBe(false);
  });
});
