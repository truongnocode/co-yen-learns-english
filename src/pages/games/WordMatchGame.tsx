import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Home, Timer, RotateCcw } from "lucide-react";
import { loadSGKData } from "@/data/loader";
import type { VocabItem } from "@/data/types";
import PageShell from "@/components/PageShell";

const smooth = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const WordMatchGame = () => {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const grade = Number(gradeId || 6);

  const [words, setWords] = useState<VocabItem[]>([]);
  const [enOrder, setEnOrder] = useState<number[]>([]);
  const [viOrder, setViOrder] = useState<number[]>([]);
  const [selectedEn, setSelectedEn] = useState<number | null>(null);
  const [selectedVi, setSelectedVi] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<[number, number] | null>(null);
  const [timer, setTimer] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load random 6 words
  useEffect(() => {
    loadSGKData(grade).then((data) => {
      const allWords: VocabItem[] = [];
      Object.values(data.units).forEach((u) => allWords.push(...u.vocabulary));
      const picked = shuffle(allWords).slice(0, 6);
      setWords(picked);
      setEnOrder(shuffle([0, 1, 2, 3, 4, 5]));
      setViOrder(shuffle([0, 1, 2, 3, 4, 5]));
    }).finally(() => setLoading(false));
  }, [grade]);

  // Timer
  useEffect(() => {
    if (loading || finished) return;
    const t = setInterval(() => setTimer((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading, finished]);

  const checkMatch = useCallback((enIdx: number, viIdx: number) => {
    if (enIdx === viIdx) {
      setMatched((prev) => new Set([...prev, enIdx]));
      setSelectedEn(null);
      setSelectedVi(null);
      if (matched.size + 1 >= words.length) setFinished(true);
    } else {
      setWrong([enIdx, viIdx]);
      setTimeout(() => { setWrong(null); setSelectedEn(null); setSelectedVi(null); }, 600);
    }
  }, [matched, words.length]);

  const handleEnClick = (idx: number) => {
    if (matched.has(idx) || finished) return;
    setSelectedEn(idx);
    if (selectedVi !== null) checkMatch(idx, selectedVi);
  };

  const handleViClick = (idx: number) => {
    if (matched.has(idx) || finished) return;
    setSelectedVi(idx);
    if (selectedEn !== null) checkMatch(selectedEn, idx);
  };

  const restart = () => {
    setMatched(new Set());
    setSelectedEn(null);
    setSelectedVi(null);
    setWrong(null);
    setTimer(0);
    setFinished(false);
    setEnOrder(shuffle([0, 1, 2, 3, 4, 5]));
    setViOrder(shuffle([0, 1, 2, 3, 4, 5]));
  };

  if (loading) return (
    <PageShell>
      <div className="flex items-center justify-center pt-40">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    </PageShell>
  );

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/dashboard")}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
            <Home className="h-5 w-5" />
          </motion.button>
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
          <div className="ml-auto flex items-center gap-1.5 bg-card/80 backdrop-blur rounded-full px-3 py-1.5 border border-border/30">
            <Timer className="h-4 w-4 text-primary" />
            <span className="font-display font-extrabold text-sm text-foreground">{timer}s</span>
          </div>
        </div>

        <h1 className="font-display font-extrabold text-2xl text-foreground mb-1">Nối từ</h1>
        <p className="text-muted-foreground text-sm mb-6">Chọn 1 từ English, 1 từ Tiếng Việt tương ứng</p>

        {finished ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 text-center shadow-xl border border-border/30">
            <span className="text-6xl block mb-4">🎉</span>
            <h2 className="font-display font-extrabold text-2xl text-foreground mb-2">Hoàn thành!</h2>
            <p className="text-muted-foreground mb-1">Thời gian: <strong className="text-primary">{timer} giây</strong></p>
            <p className="text-muted-foreground text-sm mb-6">Ghép {words.length}/{words.length} cặp từ</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={restart}
              className="gradient-primary text-white rounded-2xl px-8 py-3 font-display font-bold inline-flex items-center gap-2 shadow-lg">
              <RotateCcw className="h-4 w-4" /> Chơi lại
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* English column */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">English</div>
              {enOrder.map((idx) => (
                <motion.button
                  key={`en-${idx}`}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEnClick(idx)}
                  disabled={matched.has(idx)}
                  className={`w-full py-3 px-4 rounded-2xl font-bold text-sm transition-all border ${
                    matched.has(idx) ? "bg-emerald-100 border-emerald-300 text-emerald-700 opacity-60" :
                    wrong?.[0] === idx ? "bg-red-100 border-red-300 text-red-700 animate-pulse" :
                    selectedEn === idx ? "gradient-primary text-white border-transparent shadow-lg" :
                    "bg-card/80 border-border/30 text-foreground hover:border-primary/40"
                  }`}
                >
                  {words[idx]?.en}
                </motion.button>
              ))}
            </div>

            {/* Vietnamese column */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tiếng Việt</div>
              {viOrder.map((idx) => (
                <motion.button
                  key={`vi-${idx}`}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleViClick(idx)}
                  disabled={matched.has(idx)}
                  className={`w-full py-3 px-4 rounded-2xl font-bold text-sm transition-all border ${
                    matched.has(idx) ? "bg-emerald-100 border-emerald-300 text-emerald-700 opacity-60" :
                    wrong?.[1] === idx ? "bg-red-100 border-red-300 text-red-700 animate-pulse" :
                    selectedVi === idx ? "gradient-accent text-white border-transparent shadow-lg" :
                    "bg-card/80 border-border/30 text-foreground hover:border-accent/40"
                  }`}
                >
                  {words[idx]?.vi}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default WordMatchGame;
