import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gradesData } from "@/data/vocabulary";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, Volume2, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { speakUS } from "@/lib/tts";
import QuizSettingsBar, { type ReviewMode } from "@/components/QuizSettingsBar";
import CountdownTimer from "@/components/CountdownTimer";
import ReviewAllAnswers from "@/components/ReviewAllAnswers";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const QuizPage = () => {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("instant");
  const [timeLimit, setTimeLimit] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<(number | null)[]>([]);

  const unit = gradesData.flatMap((g) => g.units).find((u) => u.id === unitId);

  const questions = useMemo(() => {
    if (!unit) return [];
    return unit.words.map((word) => {
      const wrong = shuffle(unit.words.filter((w) => w.english !== word.english)).slice(0, 3);
      return { word, options: shuffle([word, ...wrong]) };
    });
  }, [unit]);

  // Auto-read the English word when question changes
  useEffect(() => {
    if (questions.length > 0 && !finished && started) {
      const q = questions[currentIndex];
      if (q) speakUS(q.word.english);
    }
  }, [currentIndex, questions, finished, started]);

  const handleTimeUp = useCallback(() => {
    setFinished(true);
  }, []);

  if (!unit) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Không tìm thấy.</div>;

  if (finished) {
    const pct = score / unit.words.length;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 gradient-hero">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}
          className="bg-card rounded-3xl p-8 shadow-xl text-center max-w-sm w-full border border-white/50">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="text-7xl mb-4 block">
            {pct === 1 ? "🏆" : pct >= 0.7 ? "🎉" : "📖"}
          </motion.span>
          <h2 className="font-display font-bold text-2xl text-foreground mb-2">Hoàn thành!</h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-4xl font-display font-bold text-primary">{score}</span>
            <span className="text-muted-foreground text-lg">/ {unit.words.length}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {pct === 1 ? "Xuất sắc! 🌟" : pct >= 0.7 ? "Tốt lắm! 💪" : "Ôn lại rồi thử lại nhé! 📚"}
          </p>
          {reviewMode === "after" && (
            <div className="text-left mb-4">
              <ReviewAllAnswers
                questions={questions.map((q, i) => ({
                  q: q.word.english,
                  opts: q.options.map((o) => o.vietnamese),
                  ans: q.options.findIndex((o) => o.vietnamese === q.word.vietnamese),
                  selected: selectedIndices[i],
                }))}
              />
            </div>
          )}
          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setCurrentIndex(0); setScore(0); setSelected(null); setFinished(false); setStarted(false); setSelectedIndices([]); }}
              className="flex-1 gradient-primary text-white py-3.5 rounded-2xl font-display font-bold shadow-md">Làm lại 🔄</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(-1)}
              className="flex-1 bg-muted text-foreground py-3.5 rounded-2xl font-display font-bold">Quay lại</motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;


  const handleSelect = (v: string) => {
    if (selected) return;
    setSelected(v);
    const optIdx = q.options.findIndex((o) => o.vietnamese === v);
    const newIndices = [...selectedIndices];
    newIndices[currentIndex] = optIdx;
    setSelectedIndices(newIndices);
    if (v === q.word.vietnamese) setScore((s) => s + 1);

    if (reviewMode === "after") {
      setTimeout(() => {
        if (currentIndex < questions.length - 1) { setCurrentIndex((i) => i + 1); setSelected(null); }
        else setFinished(true);
      }, 500);
    } else {
      setTimeout(() => {
        if (currentIndex < questions.length - 1) { setCurrentIndex((i) => i + 1); setSelected(null); }
        else setFinished(true);
      }, 900);
    }
  };

  if (!started) {
    return (
      <div className="min-h-screen flex flex-col gradient-hero">
        <div className="max-w-lg mx-auto w-full flex-1 flex flex-col px-5 pt-12">
          <div className="flex items-center gap-3 mb-6">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="p-2.5 rounded-xl bg-card shadow-lg text-foreground border border-white/50">
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div className="flex-1">
              <p className="font-display font-bold text-sm">{unit.name} — Trắc nghiệm 🧠</p>
            </div>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-foreground mb-1">Trắc nghiệm từ vựng</h1>
          <p className="text-muted-foreground text-sm mb-6">{unit.words.length} từ vựng</p>
          <QuizSettingsBar
            reviewMode={reviewMode}
            onReviewModeChange={setReviewMode}
            timeLimit={timeLimit}
            onTimeLimitChange={setTimeLimit}
          />
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => { setStarted(true); setSelectedIndices(new Array(questions.length).fill(null)); }}
            className="w-full gradient-primary text-white rounded-2xl py-4 font-display font-extrabold text-lg shadow-lg inline-flex items-center justify-center gap-2">
            <Play className="h-5 w-5" /> Bắt đầu
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col gradient-hero">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center gap-3 px-5 pt-12 pb-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="p-2.5 rounded-xl bg-card shadow-lg text-foreground border border-white/50">
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div className="flex-1">
            <p className="font-display font-bold text-sm">{unit.name} — Trắc nghiệm 🧠</p>
          </div>
          <span className="text-xs gradient-primary text-white px-3 py-1.5 rounded-full font-bold">{currentIndex + 1}/{questions.length}</span>
          {timeLimit > 0 && (
            <CountdownTimer minutes={timeLimit} onTimeUp={handleTimeUp} started={started && !finished} />
          )}
        </div>
        <Progress value={progress} className="mx-5 h-2.5 rounded-full" />

        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
          <motion.div key={currentIndex} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 300 }}
            className="w-full max-w-sm">
            <div className="bg-card rounded-3xl p-8 shadow-xl text-center mb-6 border border-white/50 relative overflow-hidden">
              <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-accent/10 float-animation" />
              <p className="text-sm text-muted-foreground mb-3">Từ này nghĩa là gì? 🤔</p>
              <h2 className="font-display font-bold text-4xl text-foreground relative z-10">{q.word.english}</h2>
              <p className="text-muted-foreground mt-2">{q.word.phonetic}</p>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => speakUS(q.word.english)}
                className="mt-3 p-2.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors relative z-10"
                title="Nghe phát âm"
              >
                <Volume2 className="h-5 w-5 text-primary" />
              </motion.button>
            </div>

            <div className="flex flex-col gap-3">
              {q.options.map((opt, i) => {
                let cls = "bg-card border-2 border-white/50 text-foreground shadow-md";
                if (selected) {
                  if (reviewMode === "after") {
                    cls = opt.vietnamese === selected
                      ? "bg-primary/15 border-2 border-primary text-primary shadow-md"
                      : "bg-card border-2 border-white/50 text-muted-foreground shadow-md opacity-50";
                  } else {
                    if (opt.vietnamese === q.word.vietnamese) cls = "bg-success/15 border-2 border-success text-success shadow-md";
                    else if (opt.vietnamese === selected) cls = "bg-destructive/15 border-2 border-destructive text-destructive shadow-md";
                  }
                }
                return (
                  <motion.button key={opt.english} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    whileTap={!selected ? { scale: 0.96 } : {}} whileHover={!selected ? { scale: 1.02 } : {}}
                    onClick={() => handleSelect(opt.vietnamese)}
                    className={`${cls} rounded-2xl py-4 px-5 text-left font-semibold transition-all flex items-center justify-between`}>
                    <span>{opt.vietnamese}</span>
                    {selected && reviewMode === "instant" && opt.vietnamese === q.word.vietnamese && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 className="h-5 w-5 text-success" /></motion.div>}
                    {selected && reviewMode === "instant" && opt.vietnamese === selected && opt.vietnamese !== q.word.vietnamese && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><XCircle className="h-5 w-5 text-destructive" /></motion.div>}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
