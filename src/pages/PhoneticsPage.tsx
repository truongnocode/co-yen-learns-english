import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Volume2, RotateCcw } from "lucide-react";
import { loadSGKData } from "@/data/loader";
import type { VocabItem } from "@/data/types";
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

interface PhoneticQ {
  words: string[];
  differentIdx: number;
  type: "stress" | "sound";
}

/** Generate phonetics questions from vocabulary */
function generatePhoneticsQuestions(allWords: VocabItem[]): PhoneticQ[] {
  const questions: PhoneticQ[] = [];

  // Group by syllable count for stress questions
  const multiSyllable = allWords.filter((w) => w.en.length > 5);
  const twoSyllable = multiSyllable.filter((w) => {
    const vowels = (w.en.match(/[aeiouy]/gi) || []).length;
    return vowels >= 2 && vowels <= 3;
  });

  // Generate stress-pattern questions
  for (let i = 0; i < Math.min(5, Math.floor(twoSyllable.length / 4)); i++) {
    const group = shuffle(twoSyllable).slice(0, 4);
    const diffIdx = Math.floor(Math.random() * 4);
    questions.push({
      words: group.map((w) => w.en),
      differentIdx: diffIdx,
      type: "stress",
    });
  }

  // Generate sound-pattern questions (first letter grouping)
  const byFirstLetter = new Map<string, VocabItem[]>();
  allWords.forEach((w) => {
    const first = w.en[0]?.toLowerCase();
    if (first) {
      const arr = byFirstLetter.get(first) || [];
      arr.push(w);
      byFirstLetter.set(first, arr);
    }
  });

  const letters = Array.from(byFirstLetter.entries()).filter(([, v]) => v.length >= 3);
  for (let i = 0; i < Math.min(5, letters.length); i++) {
    const [, sameGroup] = shuffle(letters)[0];
    const same = shuffle(sameGroup).slice(0, 3);
    const diff = shuffle(allWords.filter((w) => !same.includes(w)))[0];
    if (!diff) continue;
    const diffIdx = Math.floor(Math.random() * 4);
    const words = [...same.map((w) => w.en)];
    words.splice(diffIdx, 0, diff.en);
    questions.push({ words: words.slice(0, 4), differentIdx: diffIdx, type: "sound" });
  }

  return shuffle(questions).slice(0, 10);
}

const PhoneticsPage = () => {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const grade = Number(gradeId || 9);

  const [questions, setQuestions] = useState<PhoneticQ[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSGKData(grade).then((data) => {
      const allWords: VocabItem[] = [];
      Object.values(data.units).forEach((u) => allWords.push(...u.vocabulary));
      setQuestions(generatePhoneticsQuestions(allWords));
    }).finally(() => setLoading(false));
  }, [grade]);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === questions[current].differentIdx) setScore((s) => s + 1);
    setTimeout(() => {
      if (current < questions.length - 1) { setCurrent((c) => c + 1); setSelected(null); }
      else setFinished(true);
    }, 1200);
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
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
            <Home className="h-5 w-5" />
          </motion.button>
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
          {!finished && (
            <span className="ml-auto text-xs gradient-primary text-white px-3 py-1.5 rounded-full font-bold">
              {current + 1}/{questions.length}
            </span>
          )}
        </div>

        <h1 className="font-display font-extrabold text-2xl text-foreground mb-1">Luyện Ngữ âm</h1>
        <p className="text-muted-foreground text-sm mb-6">Chọn từ có cách phát âm/trọng âm khác</p>

        {!finished && <Progress value={((current + 1) / questions.length) * 100} className="h-2 mb-6 rounded-full" />}

        {finished ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 text-center shadow-xl border border-border/30">
            <span className="text-6xl block mb-4">{score >= questions.length * 0.7 ? "🔊🎉" : "🔊📝"}</span>
            <h2 className="font-display font-extrabold text-2xl text-foreground mb-2">{score}/{questions.length} đúng</h2>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setCurrent(0); setSelected(null); setScore(0); setFinished(false); }}
              className="gradient-primary text-white rounded-2xl px-8 py-3 font-display font-bold inline-flex items-center gap-2 shadow-lg mt-4">
              <RotateCcw className="h-4 w-4" /> Luyện lại
            </motion.button>
          </motion.div>
        ) : q ? (
          <div>
            <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-4 mb-4 shadow-lg border border-border/30">
              <span className="text-xs text-primary font-bold uppercase tracking-wider">
                {q.type === "stress" ? "Chọn từ có trọng âm khác" : "Chọn từ có âm đọc khác"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {q.words.map((word, i) => {
                const isCorrect = i === q.differentIdx;
                const isSelected = selected === i;
                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelect(i)}
                    className={`rounded-2xl p-4 font-bold text-center border transition-all ${
                      selected !== null
                        ? isCorrect ? "bg-emerald-100 border-emerald-400 text-emerald-700" :
                          isSelected ? "bg-red-100 border-red-400 text-red-700" :
                          "bg-card/60 border-border/30 text-muted-foreground"
                        : "bg-card/80 border-border/30 text-foreground hover:border-primary/40 hover:shadow-md"
                    }`}
                  >
                    <span className="text-xs text-muted-foreground block mb-1">{String.fromCharCode(65 + i)}.</span>
                    <span className="text-lg block mb-2">{word}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); speakUS(word); }}
                      className="mx-auto w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                    >
                      <Volume2 className="h-3.5 w-3.5 text-primary" />
                    </button>
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

export default PhoneticsPage;
