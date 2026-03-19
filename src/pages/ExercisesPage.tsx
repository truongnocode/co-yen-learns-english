import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { loadSGKData } from "@/data/loader";
import { type SGKUnit, type MCQuestion } from "@/data/types";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { saveQuizResult } from "@/lib/progress";

const ExercisesPage = () => {
  const { gradeId, unitKey } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const grade = Number(gradeId);
  const [unit, setUnit] = useState<SGKUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    loadSGKData(grade).then(data => {
      const u = data.units[unitKey!];
      if (u) {
        setUnit(u);
        setAnswers(new Array(u.exercises.length).fill(null));
      }
    }).finally(() => setLoading(false));
  }, [grade, unitKey]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Đang tải...</div>;
  if (!unit) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Không tìm thấy bài học.</div>;

  const exercises = unit.exercises;
  const q = exercises[current];
  const progress = ((current + 1) / exercises.length) * 100;
  const score = answers.filter((a, i) => a === exercises[i].ans).length;

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const newAnswers = [...answers];
    newAnswers[current] = idx;
    setAnswers(newAnswers);

    setTimeout(() => {
      if (current < exercises.length - 1) {
        setCurrent(c => c + 1);
        setSelected(null);
      } else {
        setFinished(true);
        if (user) {
          const finalAnswers = [...newAnswers];
          const finalScore = finalAnswers.filter((a, i) => a === exercises[i].ans).length;
          saveQuizResult(user.uid, grade, unitKey!, finalScore, exercises.length);
        }
      }
    }, 1200);
  };

  if (finished) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center px-5">
        <div className="text-center">
          <span className="text-6xl mb-4 block">{score >= exercises.length * 0.7 ? "🎉" : "💪"}</span>
          <h3 className="font-display font-bold text-2xl text-foreground mb-2">Kết quả</h3>
          <p className="text-muted-foreground mb-2">Unit {unitKey}: {unit.title}</p>
          <p className="font-display font-bold text-4xl text-primary mb-6">{score}/{exercises.length}</p>
          <div className="flex gap-3 justify-center">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setCurrent(0); setSelected(null); setAnswers(new Array(exercises.length).fill(null)); setFinished(false); }}
              className="bg-card border border-white/40 text-foreground px-6 py-3 rounded-full font-bold shadow-md">
              Làm lại
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(-1)}
              className="gradient-primary text-white px-6 py-3 rounded-full font-bold shadow-md">
              Quay lại
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <div className="max-w-lg mx-auto w-full px-5 pt-12 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="p-2.5 rounded-xl bg-card shadow-lg text-foreground border border-white/50">
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div className="flex-1">
            <p className="font-display font-bold text-sm text-foreground">Unit {unitKey} — Bài tập</p>
            <p className="text-xs text-muted-foreground">{unit.title}</p>
          </div>
          <span className="text-xs gradient-primary text-white px-3 py-1.5 rounded-full font-bold">{current + 1}/{exercises.length}</span>
        </div>

        <Progress value={progress} className="h-2.5 rounded-full mb-8" />

        <div className="bg-card rounded-3xl p-6 border border-white/40 shadow-lg mb-6">
          <p className="font-display font-bold text-lg text-foreground leading-relaxed">{q.q}</p>
        </div>

        <div className="flex flex-col gap-3">
          {q.opts.map((opt, idx) => {
            let style = "bg-card border-white/40 text-foreground hover:bg-muted/50";
            if (selected !== null) {
              if (idx === q.ans) style = "bg-emerald-100 border-emerald-400 text-emerald-800";
              else if (idx === selected) style = "bg-red-100 border-red-400 text-red-800";
              else style = "bg-card border-white/40 text-muted-foreground opacity-50";
            }
            return (
              <motion.button key={idx} whileTap={{ scale: 0.97 }} onClick={() => handleSelect(idx)}
                className={`p-4 rounded-2xl border text-left font-bold text-base transition-all ${style}`}>
                <span className="text-muted-foreground/50 mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExercisesPage;
