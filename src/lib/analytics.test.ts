import { describe, it, expect } from "vitest";
import { aggregateAnalytics } from "./analytics";
import type { UserProfile, UserProgress } from "./progress";

const NOW = new Date("2026-04-15T10:00:00.000Z");

function profile(partial: Partial<UserProfile> = {}): UserProfile {
  return {
    displayName: "Student",
    photoURL: "",
    grade: 10,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

function emptyProgress(): UserProgress {
  return {
    quizzesDone: 0,
    highScore: 0,
    wordsLearned: [],
    quizHistory: [],
    dailyStreak: 0,
    lastActiveDate: "",
    dailyTasks: { date: "", reviewWords: false, quizDone: false, listenDone: false },
    srsData: {},
  };
}

describe("aggregateAnalytics", () => {
  it("handles an empty cohort", () => {
    const b = aggregateAnalytics(new Map(), [], NOW);
    expect(b.totalStudents).toBe(0);
    expect(b.attempts).toHaveLength(0);
    expect(b.classAvgPercent).toBe(0);
    expect(b.daily).toHaveLength(30);
    expect(b.daily.every((d) => d.attempts === 0)).toBe(true);
  });

  it("includes profile-only students with zero attempts", () => {
    const profiles = new Map<string, UserProfile>([
      ["u1", profile({ displayName: "Anna" })],
    ]);
    const b = aggregateAnalytics(profiles, [], NOW);
    expect(b.totalStudents).toBe(1);
    expect(b.students).toHaveLength(1);
    expect(b.students[0].attempts).toBe(0);
    expect(b.students[0].lastActive).toBeNull();
  });

  it("computes percent, class average, per-student summary", () => {
    const profiles = new Map<string, UserProfile>([
      ["u1", profile({ displayName: "Anna", grade: 6 })],
      ["u2", profile({ displayName: "Ben", grade: 10 })],
    ]);
    const rows = [
      {
        uid: "u1",
        progress: {
          ...emptyProgress(),
          quizzesDone: 2,
          wordsLearned: ["cat", "dog"],
          quizHistory: [
            { date: "2026-04-10T09:00:00.000Z", grade: 6, unit: "1", score: 8, total: 10 },
            { date: "2026-04-12T09:00:00.000Z", grade: 6, unit: "2", score: 5, total: 10 },
          ],
        },
      },
      {
        uid: "u2",
        progress: {
          ...emptyProgress(),
          quizzesDone: 1,
          quizHistory: [
            { date: "2026-04-14T09:00:00.000Z", grade: 10, unit: "1", score: 10, total: 10 },
          ],
        },
      },
    ];

    const b = aggregateAnalytics(profiles, rows, NOW);

    expect(b.attempts).toHaveLength(3);
    // (80 + 50 + 100) / 3 = 76.67 → 77
    expect(b.classAvgPercent).toBe(77);

    const anna = b.students.find((s) => s.uid === "u1")!;
    expect(anna.attempts).toBe(2);
    expect(anna.avgPercent).toBe(65); // (80+50)/2
    expect(anna.totalXp).toBe(2 * 10 + 2 * 30); // 2 words * 10 + 2 quizzes * 30

    const ben = b.students.find((s) => s.uid === "u2")!;
    expect(ben.avgPercent).toBe(100);
    expect(ben.lastActive).toBe("2026-04-14T09:00:00.000Z");
  });

  it("sorts units ascending by avg percent (worst first)", () => {
    const profiles = new Map<string, UserProfile>([
      ["u1", profile()],
    ]);
    const rows = [
      {
        uid: "u1",
        progress: {
          ...emptyProgress(),
          quizHistory: [
            { date: "2026-04-10T09:00:00.000Z", grade: 10, unit: "A", score: 2, total: 10 }, // 20%
            { date: "2026-04-11T09:00:00.000Z", grade: 10, unit: "B", score: 8, total: 10 }, // 80%
            { date: "2026-04-12T09:00:00.000Z", grade: 10, unit: "C", score: 5, total: 10 }, // 50%
          ],
        },
      },
    ];

    const b = aggregateAnalytics(profiles, rows, NOW);
    expect(b.units.map((u) => u.unit)).toEqual(["A", "C", "B"]);
    expect(b.units[0].avgPercent).toBe(20);
    expect(b.units[0].worst?.percent).toBe(20);
  });

  it("counts weekly / monthly activity vs. injected now", () => {
    const profiles = new Map<string, UserProfile>([
      ["recent", profile({ displayName: "Recent" })],
      ["old", profile({ displayName: "Old" })],
      ["ancient", profile({ displayName: "Ancient" })],
    ]);
    const rows = [
      {
        uid: "recent",
        progress: {
          ...emptyProgress(),
          quizHistory: [{ date: "2026-04-12T09:00:00.000Z", grade: 10, unit: "1", score: 5, total: 10 }],
        },
      },
      {
        uid: "old",
        progress: {
          ...emptyProgress(),
          quizHistory: [{ date: "2026-04-01T09:00:00.000Z", grade: 10, unit: "1", score: 5, total: 10 }],
        },
      },
      {
        uid: "ancient",
        progress: {
          ...emptyProgress(),
          quizHistory: [{ date: "2026-01-01T09:00:00.000Z", grade: 10, unit: "1", score: 5, total: 10 }],
        },
      },
    ];

    const b = aggregateAnalytics(profiles, rows, NOW);
    expect(b.activeWeek).toBe(1); // only "recent" (2026-04-12 is within 7d of 2026-04-15)
    expect(b.activeMonth).toBe(2); // "recent" + "old" within 30d
  });

  it("fills a continuous 30-day timeline", () => {
    const profiles = new Map<string, UserProfile>([["u1", profile()]]);
    const rows = [
      {
        uid: "u1",
        progress: {
          ...emptyProgress(),
          quizHistory: [
            { date: "2026-04-10T09:00:00.000Z", grade: 10, unit: "1", score: 5, total: 10 },
          ],
        },
      },
    ];

    const b = aggregateAnalytics(profiles, rows, NOW);
    expect(b.daily).toHaveLength(30);

    // Last point should be today (2026-04-15), first point ~30 days earlier.
    expect(b.daily[b.daily.length - 1].date).toBe("2026-04-15");

    const apr10 = b.daily.find((d) => d.date === "2026-04-10");
    expect(apr10).toBeDefined();
    expect(apr10!.attempts).toBe(1);
    expect(apr10!.avgPercent).toBe(50);
  });

  it("drops malformed quiz entries silently", () => {
    const profiles = new Map<string, UserProfile>([["u1", profile()]]);
    const rows = [
      {
        uid: "u1",
        progress: {
          ...emptyProgress(),
          // @ts-expect-error test bad data tolerance at runtime
          quizHistory: [
            null,
            { date: "2026-04-10T09:00:00.000Z", grade: 10, unit: "1", score: 5, total: 0 }, // total=0
            { date: "", grade: 10, unit: "1", score: 5, total: 10 }, // empty date
            { date: "2026-04-11T09:00:00.000Z", grade: 10, unit: "1", score: 8, total: 10 }, // good
          ],
        },
      },
    ];

    const b = aggregateAnalytics(profiles, rows, NOW);
    expect(b.attempts).toHaveLength(1);
    expect(b.attempts[0].percent).toBe(80);
  });
});
