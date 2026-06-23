import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Check, X } from "lucide-react";
import { loadSGKData } from "@/data/loader";
import type { MCQuestion } from "@/data/types";
import PageShell from "@/components/PageShell";
import PageBack from "@/components/PageBack";
import { Progress } from "@/components/ui/progress";


function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface PuzzleQ {
  sentence: string;
  words: string[];
  original: string;
}

const SentencePuzzle = () => {
  const { gradeId } = useParams();
  const grade = Number(gradeId || 6);

  const [puzzles, setPuzzles] = useState<PuzzleQ[]>([]);
  const [current, setCurrent] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<string[]>([]);
  const [status, setStatus] = useState<"playing" | "correct" | "wrong">("playing");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSGKData(grade).then((data) => {
      // Use exercise questions as sentences to rearrange
      const allQ: MCQuestion[] = [];
      Object.values(data.units).forEach((u) => allQ.push(...u.exercises));

      // Pick questions that have reasonable answer options as sentences
      const picked = shuffle(allQ).slice(0, 8).map((q) => {
        const answer = q.opts[q.ans];
        const words = answer.split(/\s+/).filter(Boolean);
        return { sentence: q.q, words: shuffle(words), original: answer };
      });
      setPuzzles(picked);
    }).finally(() => setLoading(false));
  }, [grade]);

  useEffect(() => {
    if (puzzles[current]) {
      setPlaced([]);
      setRemaining([...puzzles[current].words]);
      setStatus("playing");
    }
  }, [current, puzzles]);

  const addWord = (word: string, idx: number) => {
    if (status !== "playing") return;
    setPlaced([...placed, word]);
    setRemaining(remaining.filter((_, i) => i !== idx));
  };

  const removeWord = (idx: number) => {
    if (status !== "playing") return;
    const word = placed[idx];
    setRemaining([...remaining, word]);
    setPlaced(placed.filter((_, i) => i !== idx));
  };

  const checkAnswer = () => {
    const answer = placed.join(" ");
    const correct = puzzles[current].original;
    if (answer.toLowerCase() === correct.toLowerCase()) {
      setStatus("correct");
      setScore((s) => s + 1);
    } else {
      setStatus("wrong");
    }
    setTimeout(() => {
      if (current < puzzles.length - 1) setCurrent((c) => c + 1);
      else setFinished(true);
    }, 1500);
  };

  if (loading) return (
    <PageShell><div className="flex items-center justify-center pt-40">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
    </div></PageShell>
  );

  const p = puzzles[current];

  return (
    <PageShell>
      <div className="max-w-lg mx-auto px-5 pt-28 pb-32 sm:pb-20">
        <div className="flex items-center gap-3 mb-6">
          <PageBack />
          <span className="ml-auto text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-bold">
            {current + 1}/{puzzles.length}
          </span>
        </div>

        {!finished && <Progress value={((current + 1) / puzzles.length) * 100} className="h-2 mb-6 rounded-full" />}

        {finished ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl p-8 text-center shadow-2 border border-border">
            <span className="text-6xl block mb-4">{score >= puzzles.length * 0.7 ? "🧩🎉" : "🧩📝"}</span>
            <h2 className="font-display font-extrabold text-2xl text-foreground mb-2">{score}/{puzzles.length} đúng</h2>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setCurrent(0); setScore(0); setFinished(false); }}
              className="bg-primary text-primary-foreground rounded-2xl px-8 py-3 font-display font-extrabold inline-flex items-center gap-2 shadow-1 mt-4">
              <RotateCcw className="h-4 w-4" /> Chơi lại
            </motion.button>
          </motion.div>
        ) : p ? (
          <div>
            {/* Question */}
            <div className="bg-card rounded-2xl p-5 mb-4 shadow-1 border border-border">
              <span className="text-xs text-primary font-bold uppercase tracking-wider">Câu hỏi</span>
              <p className="font-bold text-foreground mt-1 text-base">{p.sentence}</p>
            </div>

            {/* Answer area */}
            <div className={`min-h-[56px] rounded-2xl p-3 mb-4 flex flex-wrap gap-2 border-2 border-dashed transition-colors ${
              status === "correct" ? "border-success bg-success/10" :
              status === "wrong" ? "border-destructive bg-destructive/10" :
              "border-border bg-card"
            }`}>
              <AnimatePresence>
                {placed.map((word, i) => (
                  <motion.button
                    key={`placed-${i}-${word}`}
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeWord(i)}
                    className="bg-primary text-primary-foreground rounded-xl px-3 py-1.5 text-sm font-bold shadow-1"
                  >
                    {word}
                  </motion.button>
                ))}
              </AnimatePresence>
              {placed.length === 0 && (
                <span className="text-muted-foreground text-xs py-1.5">Nhấn vào từ bên dưới để xếp câu...</span>
              )}
            </div>

            {/* Status */}
            {status !== "playing" && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 mb-4 text-sm font-bold ${
                  status === "correct" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                }`}>
                {status === "correct" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                {status === "correct" ? "Chính xác!" : `Đáp án: ${p.original}`}
              </motion.div>
            )}

            {/* Word bank */}
            <div className="flex flex-wrap gap-2.5 sm:gap-2 mb-6">
              {remaining.map((word, i) => (
                <motion.button
                  key={`rem-${i}-${word}`}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
                  onClick={() => addWord(word, i)}
                  className="bg-card border border-border rounded-xl px-4 py-2 sm:px-3 sm:py-1.5 text-sm font-bold text-foreground transition-all hover:-translate-y-0.5 hover:shadow-2"
                >
                  {word}
                </motion.button>
              ))}
            </div>

            {/* Check button */}
            {remaining.length === 0 && status === "playing" && (
              <motion.button
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={checkAnswer}
                className="w-full bg-primary text-primary-foreground rounded-2xl py-3.5 font-display font-extrabold shadow-1 btn-press"
              >
                Kiểm tra
              </motion.button>
            )}
          </div>
        ) : null}
      </div>
    </PageShell>
  );
};

export default SentencePuzzle;
