import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Volume2, RotateCcw } from "lucide-react";
import { loadSGKData } from "@/data/loader";
import type { VocabItem } from "@/data/types";
import { speakUS } from "@/lib/tts";
import PageShell from "@/components/PageShell";
import { Progress } from "@/components/ui/progress";


function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Question {
  word: VocabItem;
  options: string[];
  correctIdx: number;
}

const ListenChooseGame = () => {
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
    loadSGKData(grade).then((data) => {
      const allWords: VocabItem[] = [];
      Object.values(data.units).forEach((u) => allWords.push(...u.vocabulary));
      const picked = shuffle(allWords).slice(0, 10);

      const qs: Question[] = picked.map((word) => {
        const others = shuffle(allWords.filter((w) => w.en !== word.en)).slice(0, 3);
        const options = shuffle([word.vi, ...others.map((o) => o.vi)]);
        return { word, options, correctIdx: options.indexOf(word.vi) };
      });
      setQuestions(qs);
    }).finally(() => setLoading(false));
  }, [grade]);

  // Auto-speak
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
      if (current < questions.length - 1) { setCurrent((c) => c + 1); setSelected(null); }
      else setFinished(true);
    }, 1000);
  };

  if (loading) return (
    <PageShell><div className="flex items-center justify-center pt-40">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
    </div></PageShell>
  );

  const q = questions[current];

  return (
    <PageShell>
      <div className="max-w-lg mx-auto px-5 pt-28 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/dashboard")}
            className="p-2.5 rounded-xl bg-card shadow-1 text-foreground border border-border">
            <Home className="h-5 w-5" />
          </motion.button>
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
          <span className="ml-auto text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-xl font-bold">
            {current + 1}/{questions.length}
          </span>
        </div>

        {/* Mode toggle: meaning ↔ picture */}
        <div className="mb-5 flex rounded-xl border border-border bg-card p-1 text-sm font-bold shadow-1">
          <span className="flex-1 rounded-lg bg-primary py-1.5 text-center text-primary-foreground">Chọn nghĩa</span>
          <button onClick={() => navigate(`/practice/listen-picture/${grade}`)} className="flex-1 rounded-lg py-1.5 text-center text-muted-foreground transition-colors hover:text-foreground">
            Chọn tranh
          </button>
        </div>

        {!finished && <Progress value={((current + 1) / questions.length) * 100} className="h-2 mb-6 rounded-full" />}

        {finished ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl p-8 text-center shadow-2 border border-border">
            <span className="text-6xl block mb-4">{score >= questions.length * 0.7 ? "🎉" : "📝"}</span>
            <h2 className="font-display font-extrabold text-2xl text-foreground mb-2">{score}/{questions.length} đúng</h2>
            <p className="text-muted-foreground text-base mb-6">{score >= questions.length * 0.7 ? "Tuyệt vời!" : "Cần luyện thêm!"}</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setCurrent(0); setSelected(null); setScore(0); setFinished(false); }}
              className="bg-primary text-primary-foreground rounded-2xl px-8 py-3 font-display font-extrabold inline-flex items-center gap-2 btn-press">
              <RotateCcw className="h-4 w-4" /> Chơi lại
            </motion.button>
          </motion.div>
        ) : q ? (
          <div>
            {/* Speaker button */}
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => speakUS(q.word.en)}
              className="w-full bg-card rounded-2xl p-8 mb-6 shadow-1 border border-border flex flex-col items-center gap-3"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary flex items-center justify-center shadow-1">
                <Volume2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
              </div>
              <span className="text-sm text-muted-foreground font-bold">Nhấn để nghe lại</span>
            </motion.button>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.correctIdx;
                const isSelected = selected === i;
                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelect(i)}
                    className={`w-full text-left rounded-2xl px-5 py-4 font-bold text-base border transition-all ${
                      selected !== null
                        ? isCorrect ? "bg-success/10 border-success text-success" :
                          isSelected ? "bg-destructive/10 border-destructive text-destructive" :
                          "bg-card border-border text-muted-foreground"
                        : "bg-card border-border text-foreground hover:border-primary/40 hover:shadow-2"
                    }`}
                  >
                    <span className="text-primary/60 mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
};

export default ListenChooseGame;
