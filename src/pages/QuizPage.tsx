import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gradesData, VocabWord } from "@/data/vocabulary";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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

  const unit = gradesData.flatMap((g) => g.units).find((u) => u.id === unitId);

  const questions = useMemo(() => {
    if (!unit) return [];
    return unit.words.map((word) => {
      const wrong = shuffle(unit.words.filter((w) => w.english !== word.english)).slice(0, 3);
      const options = shuffle([word, ...wrong]);
      return { word, options };
    });
  }, [unit]);

  if (!unit) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Không tìm thấy bài học.</div>;

  if (finished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-card rounded-3xl p-8 shadow-card text-center max-w-sm w-full">
          <span className="text-6xl mb-4 block">🎉</span>
          <h2 className="font-display font-bold text-2xl text-foreground mb-2">Hoàn thành!</h2>
          <p className="text-muted-foreground mb-1">Điểm: {score}/{unit.words.length}</p>
          <p className="text-sm text-muted-foreground mb-6">
            {score === unit.words.length ? "Xuất sắc! 🌟" : score >= unit.words.length * 0.7 ? "Tốt lắm! 💪" : "Cố gắng thêm nhé! 📖"}
          </p>
          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setCurrentIndex(0); setScore(0); setSelected(null); setFinished(false); }}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-display font-bold">
              Làm lại
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(-1)}
              className="flex-1 bg-muted text-foreground py-3 rounded-xl font-display font-bold">
              Quay lại
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isCorrect = selected === q.word.vietnamese;

  const handleSelect = (v: string) => {
    if (selected) return;
    setSelected(v);
    if (v === q.word.vietnamese) setScore((s) => s + 1);
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
        setSelected(null);
      } else {
        setFinished(true);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-muted text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <p className="font-display font-bold text-sm">{unit.name} — Trắc nghiệm</p>
        </div>
        <span className="text-xs text-muted-foreground font-medium">{currentIndex + 1}/{questions.length}</span>
      </div>
      <Progress value={progress} className="mx-5 h-2 rounded-full" />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <motion.div key={currentIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-sm">
          <div className="bg-card rounded-3xl p-8 shadow-card text-center mb-6">
            <p className="text-sm text-muted-foreground mb-2">Từ này nghĩa là gì?</p>
            <h2 className="font-display font-bold text-3xl text-foreground">{q.word.english}</h2>
            <p className="text-muted-foreground mt-1">{q.word.phonetic}</p>
          </div>

          <div className="flex flex-col gap-3">
            {q.options.map((opt) => {
              let optClass = "bg-card border-2 border-border text-foreground";
              if (selected) {
                if (opt.vietnamese === q.word.vietnamese) {
                  optClass = "bg-success/10 border-2 border-success text-success";
                } else if (opt.vietnamese === selected) {
                  optClass = "bg-destructive/10 border-2 border-destructive text-destructive";
                }
              }
              return (
                <motion.button
                  key={opt.english}
                  whileTap={!selected ? { scale: 0.96 } : {}}
                  onClick={() => handleSelect(opt.vietnamese)}
                  className={`${optClass} rounded-2xl py-4 px-5 text-left font-medium transition-colors flex items-center justify-between`}
                >
                  <span>{opt.vietnamese}</span>
                  {selected && opt.vietnamese === q.word.vietnamese && <CheckCircle2 className="h-5 w-5 text-success" />}
                  {selected && opt.vietnamese === selected && opt.vietnamese !== q.word.vietnamese && <XCircle className="h-5 w-5 text-destructive" />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QuizPage;
