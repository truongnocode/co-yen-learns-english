import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertCircle, BookOpen } from "lucide-react";
import type { DiagnosticReport } from "@/lib/diagnostics";

interface Props {
  report: DiagnosticReport;
}

const ExamReport = ({ report }: Props) => {
  const { pct, competencies, weakAreas, recommendations } = report;

  return (
    <div className="space-y-4">
      {/* Score overview */}
      <div className="text-center mb-2">
        <div className="text-5xl font-display font-black text-primary">{report.totalScore}/{report.totalQuestions}</div>
        <div className="text-sm text-muted-foreground mt-1">{pct}% — {pct >= 80 ? "Xuất sắc!" : pct >= 60 ? "Khá tốt!" : "Cần cố gắng thêm"}</div>
      </div>

      {/* Competency bars */}
      <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-5 border border-border/30">
        <h3 className="font-display font-extrabold text-sm text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Phân tích năng lực
        </h3>
        <div className="space-y-3">
          {competencies.map((c) => (
            <div key={c.category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-foreground">{c.label}</span>
                <span className={`text-xs font-extrabold ${c.pct >= 70 ? "text-emerald-600" : c.pct >= 50 ? "text-amber-600" : "text-red-500"}`}>
                  {c.correct}/{c.total} ({c.pct}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${c.pct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${c.pct >= 70 ? "bg-emerald-500" : c.pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak areas */}
      {weakAreas.length > 0 && (
        <div className="bg-red-50 rounded-2xl p-4 border border-red-200/50">
          <h3 className="font-display font-extrabold text-sm text-red-700 mb-2 flex items-center gap-2">
            <TrendingDown className="h-4 w-4" /> Điểm yếu cần cải thiện
          </h3>
          <div className="space-y-1.5">
            {weakAreas.map((w) => (
              <div key={w.category} className="flex items-center gap-2 text-xs text-red-600 font-bold">
                <AlertCircle className="h-3.5 w-3.5" />
                {w.label}: chỉ đúng {w.pct}%
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20">
          <h3 className="font-display font-extrabold text-sm text-primary mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Gợi ý ôn tập
          </h3>
          <ul className="space-y-1.5">
            {recommendations.map((r, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span> {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExamReport;
