import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Volume2, BookOpen, Brain, Pencil, Home } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { loadSGKData } from "@/data/loader";
import { type SGKUnit, type VocabItem, wordTypeLabels } from "@/data/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageShell from "@/components/PageShell";

const speak = (text: string) => {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.85;
  speechSynthesis.speak(u);
};

// ===== FLASHCARD TAB =====
const FlashcardTab = ({ words }: { words: VocabItem[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const word = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  const goNext = () => { if (currentIndex < words.length - 1) { setFlipped(false); setCurrentIndex(i => i + 1); } };
  const goPrev = () => { if (currentIndex > 0) { setFlipped(false); setCurrentIndex(i => i - 1); } };

  return (
    <div className="flex flex-col items-center">
      <Progress value={progress} className="w-full max-w-sm h-2.5 rounded-full mb-2" />
      <span className="text-xs text-muted-foreground mb-6">{currentIndex + 1} / {words.length}</span>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentIndex}-${flipped}`}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -90, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => setFlipped(!flipped)}
          className={`w-full max-w-sm aspect-[3/4] rounded-3xl shadow-xl flex flex-col items-center justify-center cursor-pointer select-none p-8 border border-white/40 relative overflow-hidden ${flipped ? "gradient-purple-card text-white" : "bg-card/90 backdrop-blur-xl"}`}
        >
          <div className={`absolute top-6 right-6 w-16 h-16 rounded-full ${flipped ? "bg-white/10" : "bg-primary/5"} float-animation`} />
          {!flipped ? (
            <>
              <span className="text-5xl font-display font-bold text-foreground mb-2 relative z-10">{word.en}</span>
              <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full mb-2 relative z-10">{wordTypeLabels[word.type] || word.type}</span>
              <button onClick={(e) => { e.stopPropagation(); speak(word.en); }} className="mt-3 p-2.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors relative z-10">
                <Volume2 className="h-5 w-5 text-primary" />
              </button>
              <span className="text-xs text-muted-foreground mt-6 bg-muted/50 px-4 py-1.5 rounded-full relative z-10">👆 Nhấn để lật thẻ</span>
            </>
          ) : (
            <>
              <span className="text-4xl font-display font-bold mb-3 relative z-10">{word.vi}</span>
              <span className="text-xl opacity-90 relative z-10">{word.en}</span>
              <span className="text-sm opacity-70 mt-1 relative z-10">{wordTypeLabels[word.type] || word.type}</span>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-center gap-5 mt-8">
        <motion.button whileTap={{ scale: 0.85 }} onClick={goPrev} disabled={currentIndex === 0}
          className="p-4 rounded-full bg-card/80 backdrop-blur-xl shadow-lg text-foreground disabled:opacity-30 border border-white/40">
          <ChevronLeft className="h-6 w-6" />
        </motion.button>
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => setFlipped(!flipped)}
          className="p-4 rounded-full gradient-accent text-white shadow-lg">
          <RotateCcw className="h-6 w-6" />
        </motion.button>
        <motion.button whileTap={{ scale: 0.85 }} onClick={goNext} disabled={currentIndex === words.length - 1}
          className="p-4 rounded-full gradient-primary text-white shadow-lg disabled:opacity-30">
          <ChevronRight className="h-6 w-6" />
        </motion.button>
      </div>
    </div>
  );
};

// ===== QUIZ TAB =====
const QuizTab = ({ words }: { words: VocabItem[] }) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const word = words[current];
  const [options] = useState(() => {
    return words.map((w, idx) => {
      const wrong = words.filter((_, i) => i !== idx).sort(() => Math.random() - 0.5).slice(0, 3).map(x => x.en);
      const all = [...wrong, w.en].sort(() => Math.random() - 0.5);
      return { correctIndex: all.indexOf(w.en), options: all };
    });
  });
  const currentOpts = options[current];

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === currentOpts.correctIndex) setScore(s => s + 1);
    setTimeout(() => {
      if (current < words.length - 1) { setCurrent(c => c + 1); setSelected(null); } else { setFinished(true); }
    }, 1200);
  };

  if (finished) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl mb-4 block">🎉</span>
        <h3 className="font-display font-extrabold text-2xl text-foreground mb-2">Hoàn thành!</h3>
        <p className="text-muted-foreground mb-6">Đúng {score}/{words.length} câu</p>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setCurrent(0); setSelected(null); setScore(0); setFinished(false); }}
          className="gradient-primary text-white px-6 py-3 rounded-full font-bold">Làm lại</motion.button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      <Progress value={((current + 1) / words.length) * 100} className="h-2.5 rounded-full mb-6" />
      <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-lg mb-6 text-center">
        <p className="text-sm text-muted-foreground mb-1">Chọn từ tiếng Anh đúng:</p>
        <p className="font-display font-extrabold text-2xl text-foreground">{word.vi}</p>
        <p className="text-xs text-muted-foreground mt-1">{wordTypeLabels[word.type] || word.type}</p>
      </div>
      <div className="flex flex-col gap-3">
        {currentOpts.options.map((opt, idx) => {
          let style = "bg-card/80 backdrop-blur-xl border-white/60 text-foreground hover:bg-muted/50";
          if (selected !== null) {
            if (idx === currentOpts.correctIndex) style = "bg-emerald-100 border-emerald-400 text-emerald-800";
            else if (idx === selected) style = "bg-red-100 border-red-400 text-red-800";
            else style = "bg-card/50 border-white/40 text-muted-foreground opacity-50";
          }
          return (
            <motion.button key={idx} whileTap={{ scale: 0.97 }} onClick={() => handleSelect(idx)}
              className={`p-4 rounded-2xl border text-left font-bold text-lg transition-all ${style}`}>
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// ===== SPELLING TAB =====
const SpellingTab = ({ words }: { words: VocabItem[] }) => {
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const word = words[current];
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

  const handleCheck = () => {
    if (!input.trim()) return;
    const isCorrect = normalize(input) === normalize(word.en);
    setResult(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore(s => s + 1);
    setTimeout(() => {
      if (current < words.length - 1) { setCurrent(c => c + 1); setInput(""); setResult(null); } else { setFinished(true); }
    }, 1500);
  };

  if (finished) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl mb-4 block">✍️</span>
        <h3 className="font-display font-extrabold text-2xl text-foreground mb-2">Hoàn thành!</h3>
        <p className="text-muted-foreground mb-6">Đúng {score}/{words.length} câu</p>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setCurrent(0); setInput(""); setResult(null); setScore(0); setFinished(false); }}
          className="gradient-primary text-white px-6 py-3 rounded-full font-bold">Làm lại</motion.button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      <Progress value={((current + 1) / words.length) * 100} className="h-2.5 rounded-full mb-6" />
      <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-lg mb-6 text-center">
        <p className="text-sm text-muted-foreground mb-1">Viết từ tiếng Anh:</p>
        <p className="font-display font-extrabold text-2xl text-foreground mb-2">{word.vi}</p>
        <p className="text-xs text-muted-foreground">{wordTypeLabels[word.type] || word.type} · {word.en.length} ký tự</p>
        <p className="text-lg tracking-[0.4em] text-muted-foreground/50 mt-2 font-mono">
          {word.en.split("").map((c) => c === " " ? " " : "_").join("")}
        </p>
      </div>
      <div className="flex gap-3">
        <input
          type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCheck()}
          placeholder="Nhập từ tiếng Anh..."
          className={`flex-1 px-5 py-4 rounded-2xl border text-lg font-bold outline-none transition-colors bg-card/80 backdrop-blur-xl ${
            result === "correct" ? "border-emerald-400 bg-emerald-50 text-emerald-700" :
            result === "wrong" ? "border-red-400 bg-red-50 text-red-700" :
            "border-white/60 text-foreground focus:border-primary"
          }`}
        />
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleCheck}
          className="gradient-primary text-white px-6 rounded-2xl font-bold shadow-md">Kiểm tra</motion.button>
      </div>
      {result === "wrong" && (
        <p className="text-red-500 text-sm mt-3 text-center">Đáp án đúng: <strong>{word.en}</strong></p>
      )}
    </div>
  );
};

// ===== VOCAB LIST TAB =====
const VocabListTab = ({ words }: { words: VocabItem[] }) => {
  const grouped = words.reduce((acc, w) => {
    const key = wordTypeLabels[w.type] || w.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(w);
    return acc;
  }, {} as Record<string, VocabItem[]>);

  return (
    <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg overflow-hidden max-h-[65vh]">
      <div className="overflow-y-auto max-h-[65vh] divide-y divide-border/40">
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type}>
            <div className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm px-4 py-2 border-b border-border/30">
              <span className="font-display font-bold text-xs text-primary uppercase tracking-wider">{type} ({items.length})</span>
            </div>
            {items.map((w, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-sm text-foreground shrink-0">{w.en}</span>
                  <span className="text-muted-foreground text-sm truncate">— {w.vi}</span>
                </div>
                <button onClick={() => speak(w.en)} className="p-1.5 rounded-full hover:bg-primary/10 transition-colors shrink-0">
                  <Volume2 className="h-3.5 w-3.5 text-primary" />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== MAIN PAGE =====
const VocabPage = () => {
  const { gradeId, unitKey } = useParams();
  const navigate = useNavigate();
  const grade = Number(gradeId);
  const [unit, setUnit] = useState<SGKUnit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSGKData(grade).then(data => {
      setUnit(data.units[unitKey!] || null);
    }).finally(() => setLoading(false));
  }, [grade, unitKey]);

  if (loading) return (
    <PageShell>
      <div className="flex items-center justify-center pt-40">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    </PageShell>
  );

  if (!unit) return (
    <PageShell>
      <div className="flex items-center justify-center pt-40 text-muted-foreground">Không tìm thấy bài học.</div>
    </PageShell>
  );

  return (
    <PageShell withNavbar={false}>
      <div className="max-w-lg mx-auto w-full px-5 pt-12 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-white/50">
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div className="flex-1">
            <p className="font-display font-extrabold text-sm text-foreground">Unit {unitKey} — {unit.title}</p>
            <p className="text-xs text-muted-foreground">{unit.vocabulary.length} từ vựng</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/dashboard")}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-white/50">
            <Home className="h-5 w-5" />
          </motion.button>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6 bg-card/60 backdrop-blur-xl rounded-2xl p-1 border border-white/60">
            <TabsTrigger value="list" className="rounded-xl text-xs font-bold data-[state=active]:gradient-primary data-[state=active]:text-white">
              <BookOpen className="h-3.5 w-3.5 mr-1" /> Danh sách
            </TabsTrigger>
            <TabsTrigger value="flashcard" className="rounded-xl text-xs font-bold data-[state=active]:gradient-accent data-[state=active]:text-white">
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Flashcard
            </TabsTrigger>
            <TabsTrigger value="quiz" className="rounded-xl text-xs font-bold data-[state=active]:gradient-primary data-[state=active]:text-white">
              <Brain className="h-3.5 w-3.5 mr-1" /> Trắc nghiệm
            </TabsTrigger>
            <TabsTrigger value="spelling" className="rounded-xl text-xs font-bold data-[state=active]:gradient-success data-[state=active]:text-white">
              <Pencil className="h-3.5 w-3.5 mr-1" /> Chính tả
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list"><VocabListTab words={unit.vocabulary} /></TabsContent>
          <TabsContent value="flashcard"><FlashcardTab words={unit.vocabulary} /></TabsContent>
          <TabsContent value="quiz"><QuizTab words={unit.vocabulary} /></TabsContent>
          <TabsContent value="spelling"><SpellingTab words={unit.vocabulary} /></TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
};

export default VocabPage;
