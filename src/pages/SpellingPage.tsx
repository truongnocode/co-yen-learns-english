import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gradesData } from "@/data/vocabulary";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, Volume2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { speakUS } from "@/lib/tts";

const SpellingPage = () => {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const unit = gradesData.flatMap((g) => g.units).find((u) => u.id === unitId);
  const word = unit?.words[currentIndex];

  // Auto-read the word
  useEffect(() => {
    if (word && !finished) speakUS(word.english);
  }, [currentIndex, word, finished]);

  if (!unit) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Không tìm thấy.</div>;

  const progress = ((currentIndex + 1) / unit.words.length) * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "idle") return;
    const isCorrect = answer.trim().toLowerCase() === word.english.toLowerCase();
    setStatus(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore((s) => s + 1);
    setTimeout(() => {
      if (currentIndex < unit.words.length - 1) { setCurrentIndex((i) => i + 1); setAnswer(""); setStatus("idle"); }
      else setFinished(true);
    }, 1200);
  };

  if (finished) {
    const pct = score / unit.words.length;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 gradient-hero">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}
          className="bg-card rounded-3xl p-8 shadow-xl text-center max-w-sm w-full border border-white/50">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="text-7xl mb-4 block">
            {pct === 1 ? "✍️🏆" : pct >= 0.7 ? "✍️🎉" : "✍️📝"}
          </motion.span>
          <h2 className="font-display font-bold text-2xl text-foreground mb-2">Hoàn thành chính tả!</h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-4xl font-display font-bold text-success">{score}</span>
            <span className="text-muted-foreground text-lg">/ {unit.words.length}</span>
          </div>
          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setCurrentIndex(0); setScore(0); setAnswer(""); setStatus("idle"); setFinished(false); }}
              className="flex-1 gradient-success text-white py-3.5 rounded-2xl font-display font-bold shadow-md">Làm lại 🔄</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(-1)}
              className="flex-1 bg-muted text-foreground py-3.5 rounded-2xl font-display font-bold">Quay lại</motion.button>
          </div>
        </motion.div>
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
            <p className="font-display font-bold text-sm">{unit.name} — Chính tả ✍️</p>
          </div>
          <span className="text-xs gradient-success text-white px-3 py-1.5 rounded-full font-bold">{currentIndex + 1}/{unit.words.length}</span>
        </div>
        <Progress value={progress} className="mx-5 h-2.5 rounded-full" />

        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
          <motion.div key={currentIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring" }}
            className="w-full max-w-sm text-center">
            <div className="bg-card rounded-3xl p-8 shadow-xl mb-6 border border-white/50 relative overflow-hidden">
              <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-success/10 float-animation" />
              <p className="text-sm text-muted-foreground mb-3">Viết từ tiếng Anh cho: ✏️</p>
              <h2 className="font-display font-bold text-4xl text-foreground mb-2 relative z-10">{word.vietnamese}</h2>
              <p className="text-muted-foreground text-sm">{word.phonetic}</p>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => speakUS(word.english)}
                className="mt-3 p-2.5 rounded-full bg-success/10 hover:bg-success/20 transition-colors relative z-10"
                title="Nghe phát âm"
              >
                <Volume2 className="h-5 w-5 text-success" />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Nhập từ tiếng Anh..." autoFocus
                  className={`text-center text-lg rounded-2xl h-14 font-medium shadow-md border-2 bg-card ${
                    status === "correct" ? "border-success bg-success/10" : status === "wrong" ? "border-destructive bg-destructive/10" : "border-white/50"
                  }`} disabled={status !== "idle"} />
                {status === "correct" && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2"><CheckCircle2 className="h-6 w-6 text-success" /></motion.div>}
                {status === "wrong" && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2"><XCircle className="h-6 w-6 text-destructive" /></motion.div>}
              </div>
              {status === "wrong" && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive font-medium">Đáp án đúng: <strong>{word.english}</strong></motion.p>}
              {status === "idle" && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} type="submit"
                  className="w-full gradient-success text-white py-4 rounded-2xl font-display font-bold text-base shadow-lg">Kiểm tra ✅</motion.button>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SpellingPage;
