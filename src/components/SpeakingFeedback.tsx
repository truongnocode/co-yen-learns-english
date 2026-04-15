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
  correct: "text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30",
  close: "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30",
  wrong: "text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30",
  missing: "text-muted-foreground border-muted line-through",
};

export function SpeakingFeedback({ verdict }: { verdict: SpeakingVerdict }) {
  const scoreColor =
    verdict.overall_score >= 80
      ? "text-emerald-600"
      : verdict.overall_score >= 60
        ? "text-amber-600"
        : "text-red-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-border/30 space-y-4"
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
        <div className="flex flex-wrap gap-1.5">
          {verdict.words.map((w, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-sm ${VERDICT_STYLE[w.verdict]}`}
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
