import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Volume2, RotateCcw } from "lucide-react";
import { loadSGKData } from "@/data/loader";
import type { VocabItem } from "@/data/types";
import { filterWithEmoji } from "@/data/emojiMap";
import { speakUS } from "@/lib/tts";
import PageShell from "@/components/PageShell";
import { Progress } from "@/components/ui/progress";

const smooth = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface EmojiWord {
  en: string;
  vi: string;
  emoji: string;
}

interface Question {
  word: EmojiWord;
  options: EmojiWord[];
  correctIdx: number;
}

const ListenChoosePicture = () => {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const grade = Number(gradeId || 6);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const effectiveGrade = grade === 10 ? 9 : grade;
    loadSGKData(effectiveGrade)
      .then((data) => {
        const allWords: VocabItem[] = [];
        Object.values(data.units).forEach((u) => allWords.push(...u.vocabulary));
        const withEmoji = filterWithEmoji(allWords);
        const picked = shuffle(withEmoji).slice(0, 10);

        const qs: Question[] = picked.map((word) => {
          const others = shuffle(withEmoji.filter((w) => w.en !== word.en)).slice(0, 3);
          const options = shuffle([word, ...others]);
          return { word, options, correctIdx: options.findIndex((o) => o.en === word.en) };
        });
        setQuestions(qs);
      })
      .finally(() => setLoading(false));
  }, [grade]);

  // Auto-speak on question change
  useEffect(() => {
    if (!loading && !finished && questions[current]) {
      speakUS(questions[current].word.en);
    }
  }, [current, loading, finished, questions]);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === questions[current].correctIdx) setScore((s) => s + 1);
    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent((c) => c + 1);
        setSelected(null);
      } else {
        setFinished(true);
      }
    }, 1000);
  };

  const restart = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  if (loading)
    return (
      <PageShell>
        <div className="flex items-center justify-center pt-40">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full"
          />
        </div>
      </PageShell>
    );

  const q = questions[current];

  return (
    <PageShell>
      <div className="max-w-lg mx-auto px-5 pt-28 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/dashboard")}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30"
          >
            <Home className="h-5 w-5" />
          </motion.button>
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
          <span className="ml-auto text-xs gradient-primary text-white px-3 py-1.5 rounded-full font-bold">
            Câu {current + 1}/{questions.length}
          </span>
        </div>

        {!finished && <Progress value={((current + 1) / questions.length) * 100} className="h-2 mb-6 rounded-full" />}

        {finished ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 text-center shadow-xl border border-border/30"
          >
            <span className="text-6xl block mb-4">{score >= questions.length * 0.7 ? "🎉" : "📝"}</span>
            <h2 className="font-display font-extrabold text-2xl text-foreground mb-2">
              {score}/{questions.length} đúng
            </h2>
            <p className="text-muted-foreground text-sm mb-2">
              {score >= questions.length * 0.7 ? "Tuyệt vời!" : "Cần luyện thêm!"}
            </p>
            <p className="text-muted-foreground text-xs mb-6">+{score * 10} XP</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={restart}
              className="gradient-primary text-white rounded-2xl px-8 py-3 font-display font-bold inline-flex items-center gap-2 shadow-lg"
            >
              <RotateCcw className="h-4 w-4" /> Chơi lại
            </motion.button>
          </motion.div>
        ) : q ? (
          <div>
            {/* Speaker button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => speakUS(q.word.en)}
              className="w-full bg-card/80 backdrop-blur-xl rounded-3xl p-8 mb-6 shadow-lg border border-border/30 flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-lg">
                <Volume2 className="h-8 w-8 text-white" />
              </div>
              <span className="text-sm text-muted-foreground font-bold">Nhấn để nghe lại</span>
            </motion.button>

            {/* 2x2 Emoji Grid */}
            <div className="grid grid-cols-2 gap-3">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.correctIdx;
                const isSelected = selected === i;

                let cardClass =
                  "bg-card/80 border-border/30 text-foreground hover:border-primary/40 hover:shadow-md";
                if (selected !== null) {
                  if (isCorrect) {
                    cardClass = "bg-emerald-100 border-emerald-400 text-emerald-700";
                  } else if (isSelected) {
                    cardClass = "bg-red-100 border-red-400 text-red-700";
                  } else {
                    cardClass = "bg-card/60 border-border/30 text-muted-foreground";
                  }
                }

                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.95 }}
                    animate={
                      selected !== null && isCorrect
                        ? { scale: [1, 1.08, 1], transition: { duration: 0.4 } }
                        : selected !== null && isSelected && !isCorrect
                          ? { x: [0, -6, 6, -6, 6, 0], transition: { duration: 0.4 } }
                          : {}
                    }
                    onClick={() => handleSelect(i)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${cardClass}`}
                  >
                    <span className="text-6xl select-none">{opt.emoji}</span>
                    {selected !== null && (isCorrect || isSelected) && (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs font-bold"
                      >
                        {opt.en}
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Score indicator */}
            <div className="mt-4 text-center">
              <span className="text-sm text-muted-foreground">
                Điểm: <strong className="text-primary">{score}/{current}</strong>
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
};

export default ListenChoosePicture;
