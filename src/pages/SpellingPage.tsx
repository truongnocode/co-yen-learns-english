import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gradesData } from "@/data/vocabulary";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

const SpellingPage = () => {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const unit = gradesData.flatMap((g) => g.units).find((u) => u.id === unitId);
  if (!unit) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Không tìm thấy bài học.</div>;

  const word = unit.words[currentIndex];
  const progress = ((currentIndex + 1) / unit.words.length) * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "idle") return;
    const isCorrect = answer.trim().toLowerCase() === word.english.toLowerCase();
    setStatus(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore((s) => s + 1);
    setTimeout(() => {
      if (currentIndex < unit.words.length - 1) {
        setCurrentIndex((i) => i + 1);
        setAnswer("");
        setStatus("idle");
      } else {
        setFinished(true);
      }
    }, 1200);
  };

  if (finished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-card rounded-3xl p-8 shadow-card text-center max-w-sm w-full">
          <span className="text-6xl mb-4 block">✍️</span>
          <h2 className="font-display font-bold text-2xl text-foreground mb-2">Hoàn thành chính tả!</h2>
          <p className="text-muted-foreground mb-1">Điểm: {score}/{unit.words.length}</p>
          <p className="text-sm text-muted-foreground mb-6">
            {score === unit.words.length ? "Hoàn hảo! 🌟" : score >= unit.words.length * 0.7 ? "Rất giỏi! 💪" : "Luyện thêm nhé! 📝"}
          </p>
          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setCurrentIndex(0); setScore(0); setAnswer(""); setStatus("idle"); setFinished(false); }}
              className="flex-1 bg-success text-success-foreground py-3 rounded-xl font-display font-bold">
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

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-muted text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <p className="font-display font-bold text-sm">{unit.name} — Chính tả</p>
        </div>
        <span className="text-xs text-muted-foreground font-medium">{currentIndex + 1}/{unit.words.length}</span>
      </div>
      <Progress value={progress} className="mx-5 h-2 rounded-full" />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <motion.div key={currentIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center">
          <div className="bg-card rounded-3xl p-8 shadow-card mb-6">
            <p className="text-sm text-muted-foreground mb-3">Viết từ tiếng Anh cho:</p>
            <h2 className="font-display font-bold text-3xl text-foreground mb-2">{word.vietnamese}</h2>
            <p className="text-muted-foreground text-sm">{word.phonetic}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Nhập từ tiếng Anh..."
                autoFocus
                className={`text-center text-lg rounded-2xl h-14 font-medium ${
                  status === "correct" ? "border-success bg-success/10" :
                  status === "wrong" ? "border-destructive bg-destructive/10" : ""
                }`}
                disabled={status !== "idle"}
              />
              {status === "correct" && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </motion.div>
              )}
              {status === "wrong" && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2">
                  <XCircle className="h-6 w-6 text-destructive" />
                </motion.div>
              )}
            </div>
            {status === "wrong" && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive">
                Đáp án đúng: <strong>{word.english}</strong>
              </motion.p>
            )}
            {status === "idle" && (
              <motion.button whileTap={{ scale: 0.95 }} type="submit"
                className="w-full bg-success text-success-foreground py-3.5 rounded-2xl font-display font-bold text-base">
                Kiểm tra
              </motion.button>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default SpellingPage;
