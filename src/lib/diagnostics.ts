/**
 * Exam diagnostic analytics — analyzes test results to identify strengths and weaknesses.
 */

export interface QuestionResult {
  question: string;
  correct: boolean;
  category: string; // "vocabulary" | "grammar" | "reading" | "phonetics" | "writing"
}

export interface CompetencyScore {
  category: string;
  label: string;
  total: number;
  correct: number;
  pct: number;
}

export interface DiagnosticReport {
  totalScore: number;
  totalQuestions: number;
  pct: number;
  competencies: CompetencyScore[];
  weakAreas: CompetencyScore[];
  strongAreas: CompetencyScore[];
  recommendations: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  vocabulary: "Từ vựng",
  grammar: "Ngữ pháp",
  reading: "Đọc hiểu",
  phonetics: "Ngữ âm",
  writing: "Viết",
};

/** Guess category from question text */
export const guessCategory = (question: string): string => {
  const q = question.toLowerCase();
  if (q.includes("stress") || q.includes("pronoun") || q.includes("/s/") || q.includes("/z/") || q.includes("underline")) return "phonetics";
  if (q.includes("read") || q.includes("passage") || q.includes("paragraph") || q.includes("text")) return "reading";
  if (q.includes("write") || q.includes("rewrite") || q.includes("rearrange") || q.includes("word form")) return "writing";
  if (q.includes("mean") || q.includes("synonym") || q.includes("opposite") || q.includes("closest")) return "vocabulary";
  return "grammar";
};

/** Generate diagnostic report from test results */
export const analyzeDiagnostics = (results: QuestionResult[]): DiagnosticReport => {
  const totalCorrect = results.filter((r) => r.correct).length;
  const totalQuestions = results.length;

  // Group by category
  const groups = new Map<string, { total: number; correct: number }>();
  results.forEach((r) => {
    const g = groups.get(r.category) || { total: 0, correct: 0 };
    g.total++;
    if (r.correct) g.correct++;
    groups.set(r.category, g);
  });

  const competencies: CompetencyScore[] = [];
  groups.forEach((val, key) => {
    competencies.push({
      category: key,
      label: CATEGORY_LABELS[key] || key,
      total: val.total,
      correct: val.correct,
      pct: Math.round((val.correct / val.total) * 100),
    });
  });

  competencies.sort((a, b) => a.pct - b.pct);

  const weakAreas = competencies.filter((c) => c.pct < 60);
  const strongAreas = competencies.filter((c) => c.pct >= 80);

  const recommendations: string[] = [];
  weakAreas.forEach((w) => {
    if (w.category === "grammar") recommendations.push("Ôn lại các cấu trúc ngữ pháp: mệnh đề quan hệ, câu điều kiện, bị động");
    else if (w.category === "vocabulary") recommendations.push("Luyện Flashcard từ vựng mỗi ngày, dùng SRS để ôn từ yếu");
    else if (w.category === "reading") recommendations.push("Đọc thêm đoạn văn ngắn, luyện kỹ năng đọc lướt và tìm chi tiết");
    else if (w.category === "phonetics") recommendations.push("Luyện phát âm đuôi -s/-es, -ed và trọng âm qua bài tập Phonetics");
    else if (w.category === "writing") recommendations.push("Luyện viết lại câu, xếp câu và biến đổi từ loại");
  });

  return {
    totalScore: totalCorrect,
    totalQuestions,
    pct: Math.round((totalCorrect / totalQuestions) * 100),
    competencies,
    weakAreas,
    strongAreas,
    recommendations,
  };
};
