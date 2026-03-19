import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Volume2, BookOpen, Brain, Pencil, Home, Search, BookText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { loadSGKData } from "@/data/loader";
import { type SGKUnit, type VocabItem, wordTypeLabels } from "@/data/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageShell from "@/components/PageShell";
import { getWordIcon } from "@/lib/wordIcons";
import { speakUS } from "@/lib/tts";

const speak = (text: string) => speakUS(text);

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
          {(() => {
            const WordIcon = getWordIcon(word.en, word.type);
            return !flipped ? (
              <>
                <div className="p-3 rounded-2xl bg-primary/10 mb-4 relative z-10">
                  <WordIcon className="h-8 w-8 text-primary" />
                </div>
                <span className="text-5xl font-display font-bold text-foreground mb-2 relative z-10">{word.en}</span>
                <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full mb-2 relative z-10">{wordTypeLabels[word.type] || word.type}</span>
                <button onClick={(e) => { e.stopPropagation(); speak(word.en); }} className="mt-3 p-2.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors relative z-10">
                  <Volume2 className="h-5 w-5 text-primary" />
                </button>
                <span className="text-xs text-muted-foreground mt-6 bg-muted/50 px-4 py-1.5 rounded-full relative z-10">👆 Nhấn để lật thẻ</span>
              </>
            ) : (
              <>
                <div className="p-3 rounded-2xl bg-white/15 mb-4 relative z-10">
                  <WordIcon className="h-8 w-8 text-white" />
                </div>
                <span className="text-4xl font-display font-bold mb-3 relative z-10">{word.vi}</span>
                <span className="text-xl opacity-90 relative z-10">{word.en}</span>
                <span className="text-sm opacity-70 mt-1 relative z-10">{wordTypeLabels[word.type] || word.type}</span>
              </>
            );
          })()}
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
        {(() => { const QIcon = getWordIcon(word.en, word.type); return (
          <div className="inline-flex p-2.5 rounded-xl bg-primary/10 mb-3">
            <QIcon className="h-6 w-6 text-primary" />
          </div>
        ); })()}
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
        {(() => { const SIcon = getWordIcon(word.en, word.type); return (
          <div className="inline-flex p-2.5 rounded-xl bg-primary/10 mb-3">
            <SIcon className="h-6 w-6 text-primary" />
          </div>
        ); })()}
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
const wordTypeColors: Record<string, { bg: string; text: string; icon: string }> = {
  "Danh từ": { bg: "gradient-primary", text: "text-white", icon: "📦" },
  "Động từ": { bg: "gradient-accent", text: "text-white", icon: "⚡" },
  "Tính từ": { bg: "gradient-success", text: "text-white", icon: "🎨" },
  "Trạng từ": { bg: "gradient-warm", text: "text-white", icon: "💫" },
  "Giới từ": { bg: "gradient-cool", text: "text-white", icon: "📍" },
};

const defaultTypeColor = { bg: "gradient-purple-card", text: "text-white", icon: "📝" };

const DictionaryTab = ({ words }: { words: VocabItem[] }) => {
  const [search, setSearch] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);

  const filtered = words.filter(w => {
    const matchSearch = w.en.toLowerCase().includes(search.toLowerCase()) ||
      w.vi.toLowerCase().includes(search.toLowerCase());
    const matchType = !activeType || (wordTypeLabels[w.type] || w.type) === activeType;
    return matchSearch && matchType;
  });

  // Sort alphabetically
  const sorted = [...filtered].sort((a, b) => a.en.localeCompare(b.en));

  // Group by first letter
  const grouped = sorted.reduce((acc, w) => {
    const letter = w.en[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(w);
    return acc;
  }, {} as Record<string, VocabItem[]>);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm từ vựng..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/40 focus:shadow-md transition-all"
        />
      </div>

      {/* Word type filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(wordTypeColors).map(([type, c]) => {
          const count = words.filter(w => (wordTypeLabels[w.type] || w.type) === type).length;
          if (!count) return null;
          const isActive = activeType === type;
          return (
            <button
              key={type}
              onClick={() => setActiveType(isActive ? null : type)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                isActive
                  ? `${c.bg} text-white shadow-md scale-105`
                  : "bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.icon} {type} · {count}
            </button>
          );
        })}
      </div>

      {/* Dictionary entries */}
      <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-1">
        {Object.keys(grouped).length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">Không tìm thấy từ nào</p>
        )}
        {Object.entries(grouped).map(([letter, items]) => (
          <div key={letter}>
            {/* Letter header */}
            <div className="sticky top-0 z-10 flex items-center gap-2 py-1.5">
              <span className="font-display font-extrabold text-lg text-primary">{letter}</span>
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-[10px] text-muted-foreground font-bold">{items.length}</span>
            </div>

            {/* Words */}
            {items.map((w, i) => {
              const globalIdx = words.indexOf(w);
              const isExpanded = expandedIdx === globalIdx;
              const WIcon = getWordIcon(w.en, w.type);
              const typeColor = wordTypeColors[wordTypeLabels[w.type] || w.type] || defaultTypeColor;

              return (
                <motion.div
                  key={`${letter}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.015 }}
                  onClick={() => setExpandedIdx(isExpanded ? null : globalIdx)}
                  className={`rounded-xl px-3.5 py-2.5 mb-1 cursor-pointer transition-all ${
                    isExpanded
                      ? "bg-card/90 backdrop-blur-xl shadow-md border border-primary/20"
                      : "hover:bg-card/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${isExpanded ? "bg-primary/15" : "bg-primary/5"}`}>
                      <WIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display font-bold text-foreground text-sm">{w.en}</span>
                        <span className={`${typeColor.bg} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none`}>
                          {wordTypeLabels[w.type] || w.type}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5 truncate">{w.vi}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); speak(w.en); }}
                      className="p-2 rounded-full hover:bg-primary/10 transition-colors shrink-0"
                    >
                      <Volume2 className="h-3.5 w-3.5 text-primary" />
                    </button>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-4">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Nghĩa tiếng Việt</p>
                            <p className="font-display font-bold text-foreground">{w.vi}</p>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); speak(w.en); }}
                            className="gradient-primary text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                          >
                            <Volume2 className="h-3.5 w-3.5" /> Nghe
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
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
              <BookText className="h-3.5 w-3.5 mr-1" /> Từ điển
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

          <TabsContent value="list"><DictionaryTab words={unit.vocabulary} /></TabsContent>
          <TabsContent value="flashcard"><FlashcardTab words={unit.vocabulary} /></TabsContent>
          <TabsContent value="quiz"><QuizTab words={unit.vocabulary} /></TabsContent>
          <TabsContent value="spelling"><SpellingTab words={unit.vocabulary} /></TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
};

export default VocabPage;
