import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle } from "lucide-react";
import ExplanationBox from "./ExplanationBox";
import SignVisual from "./SignVisual";

interface ReviewQuestion {
  q: string;
  opts: string[];
  ans: number;
  explain?: string;
  selected: number | null; // user's answer, null = unanswered
  sign?: string;
}

interface ReviewAllAnswersProps {
  questions: ReviewQuestion[];
}

const ReviewAllAnswers = ({ questions }: ReviewAllAnswersProps) => {
  const [expanded, setExpanded] = useState(false);

  if (questions.length === 0) return null;

  const correctCount = questions.filter((q) => q.selected === q.ans).length;

  return (
    <div className="mt-4">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-card/80 backdrop-blur-xl border border-border/30 rounded-2xl px-5 py-3.5 font-display font-bold text-sm text-foreground flex items-center justify-between shadow-sm"
      >
        <span>Xem lại đáp án ({correctCount}/{questions.length} đúng)</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 mt-3">
              {questions.map((q, i) => {
                const isCorrect = q.selected === q.ans;
                const isUnanswered = q.selected === null;

                return (
                  <div
                    key={i}
                    className={`bg-card/80 backdrop-blur-xl rounded-2xl p-4 border shadow-sm ${
                      isUnanswered
                        ? "border-amber-200 dark:border-amber-800/40"
                        : isCorrect
                        ? "border-emerald-200 dark:border-emerald-800/40"
                        : "border-red-200 dark:border-red-800/40"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                        Câu {i + 1}
                      </span>
                      {isUnanswered ? (
                        <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                          Chưa trả lời
                        </span>
                      ) : isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      )}
                    </div>

                    {/* Sign visual */}
                    {q.sign && <SignVisual sign={q.sign} className="mb-2" />}

                    {/* Question */}
                    <p className="text-sm font-medium text-foreground mb-2 leading-relaxed">{q.q}</p>

                    {/* Options */}
                    <div className="flex flex-col gap-1 mb-2">
                      {q.opts.map((opt, j) => {
                        let cls = "text-xs px-3 py-1.5 rounded-lg ";
                        if (j === q.ans) {
                          cls += "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold";
                        } else if (j === q.selected && j !== q.ans) {
                          cls += "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 line-through";
                        } else {
                          cls += "text-muted-foreground";
                        }
                        return (
                          <div key={j} className={cls}>
                            <span className="font-bold mr-1">{String.fromCharCode(65 + j)}.</span>
                            {opt}
                            {j === q.ans && " ✓"}
                            {j === q.selected && j !== q.ans && " ✗"}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explain && (
                      <ExplanationBox
                        explain={q.explain}
                        isCorrect={isCorrect}
                        correctAnswer={q.opts[q.ans]}
                        correctIndex={q.ans}
                        opts={q.opts}
                        selectedIndex={q.selected}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewAllAnswers;
