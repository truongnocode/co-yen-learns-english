/**
 * Teacher analytics aggregations.
 *
 * Reads `users/*` and `progress/*` once (the teacher's cohort is small — a
 * single classroom of students) and computes summaries in memory. Everything
 * is derived from `progress.quizHistory` (already produced by `saveQuizResult`
 * in `lib/progress.ts`), so no schema changes required.
 */

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile, UserProgress } from "@/lib/progress";

export interface AttemptRow {
  uid: string;
  displayName: string;
  grade: number | null;
  date: string;
  entryGrade: number;
  unit: string;
  score: number;
  total: number;
  percent: number;
}

export interface StudentSummary {
  uid: string;
  displayName: string;
  grade: number | null;
  attempts: number;
  avgPercent: number;
  lastActive: string | null;
  totalXp: number;
}

export interface UnitSummary {
  key: string;
  grade: number;
  unit: string;
  attempts: number;
  avgPercent: number;
  worst: { date: string; percent: number; uid: string } | null;
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  attempts: number;
  avgPercent: number;
}

export interface AnalyticsBundle {
  attempts: AttemptRow[];
  students: StudentSummary[];
  units: UnitSummary[];
  daily: DailyPoint[];
  totalStudents: number;
  activeWeek: number;
  activeMonth: number;
  classAvgPercent: number;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function loadAnalytics(): Promise<AnalyticsBundle> {
  const [usersSnap, progressSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "progress")),
  ]);

  const profiles = new Map<string, UserProfile>();
  usersSnap.forEach((d) => profiles.set(d.id, d.data() as UserProfile));

  const attempts: AttemptRow[] = [];
  const studentMap = new Map<string, StudentSummary>();
  const unitMap = new Map<string, UnitSummary>();
  const dailyMap = new Map<string, { attempts: number; sumPercent: number }>();

  progressSnap.forEach((d) => {
    const uid = d.id;
    const p = d.data() as UserProgress;
    const profile = profiles.get(uid);
    const displayName = profile?.displayName || "(Unknown)";
    const grade = profile?.grade ?? null;

    const quizHistory = Array.isArray(p.quizHistory) ? p.quizHistory : [];
    let lastActive: string | null = null;
    let sumPercent = 0;
    let attemptCount = 0;

    for (const entry of quizHistory) {
      if (!entry || typeof entry !== "object") continue;
      const { date, unit, score, total } = entry;
      if (!date || typeof score !== "number" || typeof total !== "number" || total <= 0) continue;

      const percent = Math.round((score / total) * 100);
      attempts.push({
        uid,
        displayName,
        grade,
        date,
        entryGrade: entry.grade ?? 0,
        unit: unit ?? "(unknown)",
        score,
        total,
        percent,
      });
      sumPercent += percent;
      attemptCount++;

      if (!lastActive || date > lastActive) lastActive = date;

      // Per-unit aggregate
      const ukey = `${entry.grade ?? 0}:${unit ?? "?"}`;
      const u =
        unitMap.get(ukey) ??
        ({
          key: ukey,
          grade: entry.grade ?? 0,
          unit: unit ?? "?",
          attempts: 0,
          avgPercent: 0,
          worst: null,
        } as UnitSummary);
      u.attempts += 1;
      u.avgPercent = (u.avgPercent * (u.attempts - 1) + percent) / u.attempts;
      if (!u.worst || percent < u.worst.percent) {
        u.worst = { date, percent, uid };
      }
      unitMap.set(ukey, u);

      // Daily timeline
      const day = date.slice(0, 10);
      const dAgg = dailyMap.get(day) ?? { attempts: 0, sumPercent: 0 };
      dAgg.attempts += 1;
      dAgg.sumPercent += percent;
      dailyMap.set(day, dAgg);
    }

    if (attemptCount > 0 || lastActive) {
      studentMap.set(uid, {
        uid,
        displayName,
        grade,
        attempts: attemptCount,
        avgPercent: attemptCount ? Math.round(sumPercent / attemptCount) : 0,
        lastActive,
        totalXp: (p.wordsLearned?.length ?? 0) * 10 + (p.quizzesDone ?? 0) * 30,
      });
    }
  });

  // Also include profile-only students (haven't taken any quiz yet).
  profiles.forEach((profile, uid) => {
    if (!studentMap.has(uid)) {
      studentMap.set(uid, {
        uid,
        displayName: profile.displayName || "(Unknown)",
        grade: profile.grade ?? null,
        attempts: 0,
        avgPercent: 0,
        lastActive: null,
        totalXp: 0,
      });
    }
  });

  const students = [...studentMap.values()].sort(
    (a, b) => b.attempts - a.attempts || b.avgPercent - a.avgPercent,
  );
  const units = [...unitMap.values()]
    .map((u) => ({ ...u, avgPercent: Math.round(u.avgPercent) }))
    .sort((a, b) => a.avgPercent - b.avgPercent);

  // Daily series — fill in the last 30 days for a continuous chart.
  const daily: DailyPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = formatDate(daysAgo(i));
    const agg = dailyMap.get(day);
    daily.push({
      date: day,
      attempts: agg?.attempts ?? 0,
      avgPercent: agg && agg.attempts ? Math.round(agg.sumPercent / agg.attempts) : 0,
    });
  }

  const weekCutoff = daysAgo(7).toISOString();
  const monthCutoff = daysAgo(30).toISOString();
  const activeWeek = students.filter(
    (s) => s.lastActive && s.lastActive >= weekCutoff,
  ).length;
  const activeMonth = students.filter(
    (s) => s.lastActive && s.lastActive >= monthCutoff,
  ).length;

  const classAvgPercent =
    attempts.length === 0
      ? 0
      : Math.round(
          attempts.reduce((sum, a) => sum + a.percent, 0) / attempts.length,
        );

  return {
    attempts,
    students,
    units,
    daily,
    totalStudents: profiles.size,
    activeWeek,
    activeMonth,
    classAvgPercent,
  };
}
