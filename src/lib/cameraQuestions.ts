import type { SGKData, MCQuestion } from "@/data/types";

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

export function collectCameraQuestions(
  mode: "vocab" | "grammar" | "test" | "g6unit",
  testNum: string | number | null,
  gradeData: SGKData | Record<string, unknown>,
  grade: number,
): CameraQuestion[] {
  const raw: RawQ[] = [];

  if (mode === "vocab") {
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
