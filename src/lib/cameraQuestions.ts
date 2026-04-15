import type { SGKData, MCQuestion, VocabItem } from "@/data/types";

export interface CameraQuestion {
  text: string;
  optA: string;
  optB: string;
  correct: "A" | "B";
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface RawQ {
  text: string;
  optA: string;
  optB: string;
  correct: "A" | "B";
  allOpts: string[];
  correctIdx: number;
}

function mcToRaw(q: MCQuestion): RawQ | null {
  if (!q.opts || q.opts.length < 2) return null;
  return {
    text: q.q,
    optA: q.opts[0],
    optB: q.opts[1],
    correct: q.ans === 0 ? "A" : "B",
    allOpts: q.opts,
    correctIdx: q.ans,
  };
}

/**
 * Generate A/B vocab questions from vocabulary items (en→vi or vi→en).
 * Each question picks one correct translation and one random wrong one.
 */
function vocabToCamera(allVocab: VocabItem[]): CameraQuestion[] {
  if (allVocab.length < 2) return [];
  const questions: CameraQuestion[] = [];

  for (const item of allVocab) {
    if (!item.en || !item.vi) continue;
    // Pick a random wrong answer from other vocab items
    const others = allVocab.filter((v) => v.vi !== item.vi && v.en !== item.en);
    if (others.length === 0) continue;
    const wrong = others[Math.floor(Math.random() * others.length)];

    // Alternate between en→vi and vi→en
    if (Math.random() < 0.5) {
      // English → Vietnamese
      const isACorrect = Math.random() < 0.5;
      questions.push({
        text: `"${item.en}" nghĩa là gì?`,
        optA: isACorrect ? item.vi : wrong.vi,
        optB: isACorrect ? wrong.vi : item.vi,
        correct: isACorrect ? "A" : "B",
      });
    } else {
      // Vietnamese → English
      const isACorrect = Math.random() < 0.5;
      questions.push({
        text: `"${item.vi}" trong tiếng Anh là?`,
        optA: isACorrect ? item.en : wrong.en,
        optB: isACorrect ? wrong.en : item.en,
        correct: isACorrect ? "A" : "B",
      });
    }
  }
  return questions;
}

export function collectCameraQuestions(
  mode: "vocab" | "grammar" | "test" | "g6unit",
  testNum: string | number | null,
  gradeData: SGKData | Record<string, unknown>,
  grade: number,
): CameraQuestion[] {
  const raw: RawQ[] = [];

  if (mode === "vocab") {
    if (grade >= 6 && grade <= 9) {
      // Generate vocab questions from vocabulary items (en↔vi)
      const d = gradeData as SGKData;
      if (d?.units) {
        const allVocab: VocabItem[] = [];
        Object.values(d.units).forEach((unit) => {
          if (unit.vocabulary) allVocab.push(...unit.vocabulary);
        });
        const vocabQs = vocabToCamera(allVocab);
        return shuffleArray(vocabQs).slice(0, 20);
      }
    } else {
      const d = gradeData as Record<string, { questions: MCQuestion[] }>;
      Object.values(d).forEach((topic) => {
        if (topic?.questions) {
          topic.questions.forEach((q: MCQuestion) => {
            const r = mcToRaw(q);
            if (r) raw.push(r);
          });
        }
      });
    }
  } else if (mode === "grammar") {
    if (grade >= 6 && grade <= 9) {
      const d = gradeData as SGKData;
      if (d?.units) {
        Object.values(d.units).forEach((unit) => {
          (unit.exercises || []).forEach((q) => {
            const r = mcToRaw(q);
            if (r) raw.push(r);
          });
        });
      }
    } else {
      const d = gradeData as Record<string, { exercises?: { mcq?: { questions: MCQuestion[] } } }>;
      Object.values(d).forEach((topic) => {
        if (topic?.exercises?.mcq) {
          topic.exercises.mcq.questions.forEach((q: MCQuestion) => {
            const r = mcToRaw(q);
            if (r) raw.push(r);
          });
        }
      });
    }
  } else if (mode === "test") {
    const d = gradeData as Record<string, { partA: { questions: MCQuestion[] } }>;
    const test = d["test" + testNum];
    if (test?.partA) {
      test.partA.questions.forEach((q: MCQuestion) => {
        const r = mcToRaw(q);
        if (r) raw.push(r);
      });
    }
  } else if (mode === "g6unit") {
    const d = gradeData as SGKData;
    const unit = d?.units?.[String(testNum)];
    if (unit) {
      // For per-unit mode: vocab questions + exercise questions mixed
      if (unit.vocabulary && unit.vocabulary.length >= 2) {
        const vocabQs = vocabToCamera(unit.vocabulary);
        const exerciseQs: CameraQuestion[] = [];
        (unit.exercises || []).forEach((q) => {
          const r = mcToRaw(q);
          if (r) exerciseQs.push({ text: r.text, optA: r.optA, optB: r.optB, correct: r.correct });
        });
        const mixed = shuffleArray([...vocabQs, ...exerciseQs]);
        return mixed.slice(0, 20);
      }
      // Fallback to exercises only
      unit.exercises.forEach((q) => {
        const r = mcToRaw(q);
        if (r) raw.push(r);
      });
    }
  }

  // Shuffle and take up to 20
  const shuffled = shuffleArray(raw).slice(0, 20);

  // Convert multi-option questions to A/B format
  return shuffled.map((q): CameraQuestion => {
    if (q.allOpts.length > 2) {
      const correctOpt = q.allOpts[q.correctIdx];
      const others = q.allOpts.filter((_, i) => i !== q.correctIdx);
      const wrongOpt = others[Math.floor(Math.random() * others.length)];
      if (Math.random() < 0.5) {
        return { text: q.text, optA: correctOpt, optB: wrongOpt, correct: "A" };
      } else {
        return { text: q.text, optA: wrongOpt, optB: correctOpt, correct: "B" };
      }
    }
    return { text: q.text, optA: q.optA, optB: q.optB, correct: q.correct };
  });
}
