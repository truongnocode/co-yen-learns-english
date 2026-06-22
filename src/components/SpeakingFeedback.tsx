/**
 * Visual feedback card shown after AI scores a shadowing attempt.
 *
 * Color rule (matches the rest of the app):
 *   correct → green, close → amber, wrong → red, missing → muted (strike-through)
 */

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { SpeakingVerdict } from "@/lib/api-client";

const VERDICT_STYLE: Record<
  SpeakingVerdict["words"][number]["verdict"],
  string
> = {
  correct: "text-success border-success/40 bg-success/10",
  close: "text-warning border-warning/40 bg-warning/10",
  wrong: "text-destructive border-destructive/40 bg-destructive/10",
  missing: "text-muted-foreground border-muted line-through",
};

export function SpeakingFeedback({ verdict }: { verdict: SpeakingVerdict }) {
  const scoreColor =
    verdict.overall_score >= 80
      ? "text-success"
      : verdict.overall_score >= 60
        ? "text-warning"
        : "text-destructive";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border shadow-2 rounded-2xl p-5 space-y-4"
    >
      {/* Score row */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Điểm tổng</p>
          <p className={`text-3xl font-bold ${scoreColor}`}>
            {verdict.overall_score}
            <span className="text-base text-muted-foreground">/100</span>
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground space-y-0.5">
          <div>Chính xác: <span className="font-semibold text-foreground">{verdict.accuracy_score}</span></div>
          <div>Trôi chảy: <span className="font-semibold text-foreground">{verdict.fluency_score}</span></div>
        </div>
      </div>

      {/* Color-coded transcript */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Từ em nói:</p>
        <div className="flex flex-wrap gap-2 sm:gap-1.5">
          {verdict.words.map((w, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 sm:px-2 sm:py-1 text-sm ${VERDICT_STYLE[w.verdict]}`}
              title={w.tip ? `${w.heard || "(không nghe thấy)"}  ·  ${w.tip}` : w.heard || "(không nghe thấy)"}
            >
              {w.verdict === "correct" && <CheckCircle2 className="h-3 w-3" />}
              {w.verdict === "wrong" && <XCircle className="h-3 w-3" />}
              {w.verdict === "close" && <AlertCircle className="h-3 w-3" />}
              <span>{w.target}</span>
            </span>
          ))}
        </div>
        {verdict.extra_words.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Em nói thừa: <span className="italic">{verdict.extra_words.join(", ")}</span>
          </p>
        )}
      </div>

      {/* Vietnamese feedback */}
      <div className="rounded-xl bg-muted/40 p-3">
        <p className="text-xs font-semibold text-foreground mb-1">💡 Cô nhận xét</p>
        <p className="text-sm text-muted-foreground">{verdict.vn_feedback}</p>
      </div>

      {/* Transcript (for debugging / transparency) */}
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">
          Transcript máy nghe được
        </summary>
        <p className="mt-1 italic">"{verdict.transcript || "(im lặng)"}"</p>
      </details>
    </motion.div>
  );
}
