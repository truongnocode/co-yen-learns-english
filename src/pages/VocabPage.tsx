import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Volume2, BookOpen, Brain, Pencil, Home, Search, BookText, X, Check, Trophy, RefreshCw, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { loadSGKData } from "@/data/loader";
import { type SGKUnit, type VocabItem, wordTypeLabels } from "@/data/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageShell from "@/components/PageShell";
import { getWordIcon } from "@/lib/wordIcons";
import { speakUS } from "@/lib/tts";

const speak = (text: string) => speakUS(text);

// Shared card wrapper for consistent look across tabs
const SectionCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-card/80 backdrop-blur-xl rounded-3xl p-6 border border-border/30 shadow-lg ${className}`}>
    {children}
  </div>
);

// Shared result/summary screen
const ResultScreen = ({ emoji, title, subtitle, score, total, onRetry }: {
  emoji: string; title: string; subtitle: string; score: number; total: number; onRetry: () => void;
}) => {
  const pct = Math.round((score / total) * 100);
  const xp = score * 10;
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, filter: "blur(8px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-sm w-full"
      >
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-5xl block mb-3">{emoji}</motion.span>
        <h3 className="font-display font-extrabold text-2xl text-foreground mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm mb-5">{subtitle}</p>

        <SectionCard className="mb-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-success/10 border border-success/20 rounded-2xl p-3 text-center">
              <span className="font-display font-extrabold text-2xl text-success">{score}</span>
              <span className="text-xs font-bold text-success block">Đúng</span>
            </div>
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3 text-center">
              <span className="font-display font-extrabold text-2xl text-destructive">{total - score}</span>
              <span className="text-xs font-bold text-destructive block">Sai</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 bg-energy/10 border border-energy/20 rounded-2xl p-3">
            <Trophy className="h-5 w-5 text-energy" />
            <span className="font-display font-extrabold text-lg text-energy">+{xp} XP</span>
            <span className="text-xs text-energy/70">({pct}%)</span>
          </div>
        </SectionCard>

        <motion.button whileTap={{ scale: 0.95 }} onClick={onRetry}
          className="w-full gradient-primary text-white py-3.5 rounded-2xl font-display font-bold shadow-md">
          Làm lại
        </motion.button>
      </motion.div>
    </div>
  );
};

// ===== FLASHCARD TAB =====
const FlashcardTab = ({ words }: { words: VocabItem[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState<Set<number>>(new Set());
  const [relearn, setRelearn] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);

  const word = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  const goToNext = () => {
    if (currentIndex < words.length - 1) {
      setFlipped(false);
      setCurrentIndex(i => i + 1);
    } else {
      setFinished(true);
    }
  };

  const handleMastered = () => {
    setMastered(prev => new Set(prev).add(currentIndex));
    setRelearn(prev => { const s = new Set(prev); s.delete(currentIndex); return s; });
    goToNext();
  };

  const handleRelearn = () => {
    setRelearn(prev => new Set(prev).add(currentIndex));
    setMastered(prev => { const s = new Set(prev); s.delete(currentIndex); return s; });
    goToNext();
  };

  const handleRestart = () => {
    setCurrentIndex(0); setFlipped(false); setMastered(new Set()); setRelearn(new Set()); setFinished(false);
  };

  const handleRestartRelearn = () => {
    setCurrentIndex(0); setFlipped(false); setFinished(false);
  };

  const xpEarned = mastered.size * 10;

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, filter: "blur(8px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-sm w-full"
        >
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-5xl block mb-3">🎉</motion.span>
          <h3 className="font-display font-extrabold text-2xl text-foreground mb-1">Chúc mừng!</h3>
          <p className="text-muted-foreground text-sm mb-5">Em đã lướt hết {words.length} thẻ từ vựng</p>

          <SectionCard className="mb-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-success/10 border border-success/20 rounded-2xl p-3 text-center">
                <Check className="h-4 w-4 text-success mx-auto mb-0.5" />
                <span className="font-display font-extrabold text-2xl text-success">{mastered.size}</span>
                <span className="text-xs font-bold text-success block">Đã thuộc</span>
              </div>
              <div className="bg-energy/10 border border-energy/20 rounded-2xl p-3 text-center">
                <RotateCcw className="h-4 w-4 text-energy mx-auto mb-0.5" />
                <span className="font-display font-extrabold text-2xl text-energy">{relearn.size}</span>
                <span className="text-xs font-bold text-energy block">Học lại</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 rounded-2xl p-3">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="font-display font-extrabold text-lg text-primary">+{xpEarned} XP</span>
            </div>
          </SectionCard>

          <div className="flex flex-col gap-3">
            {relearn.size > 0 && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleRestartRelearn}
                className="w-full gradient-accent text-white py-3.5 rounded-2xl font-display font-bold shadow-md">
                Học lại {relearn.size} từ chưa thuộc
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleRestart}
              className="w-full gradient-primary text-white py-3.5 rounded-2xl font-display font-bold shadow-md">
              Học lại tất cả
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center flex-1 min-h-0">
      {/* Progress */}
      <div className="w-full max-w-sm mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-muted-foreground">{currentIndex + 1} / {words.length}</span>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="text-success">✓ {mastered.size}</span>
            <span className="text-energy">↺ {relearn.size}</span>
          </div>
        </div>
        <Progress value={progress} className="h-2 rounded-full" />
      </div>

      {/* Card — taller ratio */}
      <div className="flex-1 flex items-center justify-center w-full max-w-sm min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentIndex}-${flipped}`}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setFlipped(!flipped)}
            className={`w-full aspect-[3/4] rounded-3xl shadow-xl flex flex-col items-center justify-center cursor-pointer select-none p-6 border relative overflow-hidden ${
              flipped ? "gradient-purple-card text-white border-white/20" : "bg-card/90 backdrop-blur-xl border-border/30"
            }`}
          >
            <div className={`absolute top-5 right-5 w-14 h-14 rounded-full ${flipped ? "bg-white/10" : "bg-primary/5"} float-animation`} />
            <div className={`absolute bottom-8 left-6 w-10 h-10 rounded-full ${flipped ? "bg-white/8" : "bg-accent/8"} float-animation-delay`} />
            {(() => {
              const WordIcon = getWordIcon(word.en, word.type);
              return !flipped ? (
                <>
                  <div className="p-3 rounded-2xl bg-primary/10 mb-4 relative z-10">
                    <WordIcon className="h-8 w-8 text-primary" />
                  </div>
                  <span className="text-4xl font-display font-bold text-foreground mb-2 relative z-10">{word.en}</span>
                  <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full mb-3 relative z-10">{wordTypeLabels[word.type] || word.type}</span>
                  <button onClick={(e) => { e.stopPropagation(); speak(word.en); }} className="p-2.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors relative z-10">
                    <Volume2 className="h-5 w-5 text-primary" />
                  </button>
                  <span className="text-[10px] text-muted-foreground mt-4 bg-muted/40 px-3 py-1 rounded-full relative z-10">👆 Nhấn thẻ để xem nghĩa</span>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-2xl bg-white/15 mb-4 relative z-10">
                    <WordIcon className="h-8 w-8 text-white" />
                  </div>
                  <span className="text-3xl font-display font-bold mb-2 relative z-10">{word.vi}</span>
                  <span className="text-lg opacity-90 relative z-10">{word.en}</span>
                  <span className="text-sm opacity-70 mt-1 relative z-10">{wordTypeLabels[word.type] || word.type}</span>
                  <span className="text-[10px] opacity-50 mt-4 bg-white/10 px-3 py-1 rounded-full relative z-10">👆 Nhấn để quay lại</span>
                </>
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-3 mt-3 w-full max-w-sm">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleRelearn}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-energy/10 border border-energy/20 text-energy font-display font-bold text-sm"
        >
          <RotateCcw className="h-4 w-4" />
          Học lại
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setFlipped(!flipped)}
          className="px-4 py-3 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/30 text-muted-foreground font-display font-bold text-sm flex items-center gap-1.5"
        >
          <RefreshCw className="h-4 w-4" />
          Lật thẻ
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleMastered}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-success/10 border border-success/20 text-success font-display font-bold text-sm"
        >
          <Check className="h-4 w-4" />
          Đã thuộc
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

  const handleRetry = () => { setCurrent(0); setSelected(null); setScore(0); setFinished(false); };

  if (finished) {
    return <ResultScreen emoji="🎉" title="Hoàn thành!" subtitle={`Trắc nghiệm ${words.length} câu`} score={score} total={words.length} onRetry={handleRetry} />;
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-muted-foreground">Câu {current + 1} / {words.length}</span>
      </div>
      <Progress value={((current + 1) / words.length) * 100} className="h-2 rounded-full mb-5" />

      <SectionCard className="mb-5 text-center">
        {(() => { const QIcon = getWordIcon(word.en, word.type); return (
          <div className="inline-flex p-2.5 rounded-xl bg-primary/10 mb-3">
            <QIcon className="h-6 w-6 text-primary" />
          </div>
        ); })()}
        <p className="text-xs text-muted-foreground mb-1">Chọn từ tiếng Anh đúng:</p>
        <p className="font-display font-extrabold text-2xl text-foreground">{word.vi}</p>
        <p className="text-xs text-muted-foreground mt-1">{wordTypeLabels[word.type] || word.type}</p>
      </SectionCard>

      <div className="flex flex-col gap-2.5">
        {currentOpts.options.map((opt, idx) => {
          let style = "bg-card/80 backdrop-blur-xl border-border/30 text-foreground hover:border-primary/30";
          if (selected !== null) {
            if (idx === currentOpts.correctIndex) style = "bg-success/10 border-success/40 text-success";
            else if (idx === selected) style = "bg-destructive/10 border-destructive/40 text-destructive";
            else style = "bg-card/40 border-border/20 text-muted-foreground opacity-50";
          }
          return (
            <motion.button key={idx} whileTap={{ scale: 0.97 }} onClick={() => handleSelect(idx)}
              className={`p-4 rounded-2xl border text-left font-bold text-base transition-all ${style}`}>
              <span className="text-muted-foreground mr-2">{String.fromCharCode(65 + idx)}.</span>{opt}
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
  const [letters, setLetters] = useState<string[]>([]);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const word = words[current];

  useEffect(() => {
    setLetters(new Array(word.en.length).fill(""));
  }, [current, word.en]);

  const handleLetterChange = (idx: number, value: string) => {
    if (result) return;
    const char = value.slice(-1);
    const newLetters = [...letters];
    newLetters[idx] = char;
    setLetters(newLetters);
    if (char && idx < word.en.length - 1) {
      document.getElementById(`spell-${idx + 1}`)?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (result) return;
    if (e.key === "Backspace" && !letters[idx] && idx > 0) {
      document.getElementById(`spell-${idx - 1}`)?.focus();
      const newLetters = [...letters];
      newLetters[idx - 1] = "";
      setLetters(newLetters);
    }
    if (e.key === "Enter") handleCheck();
  };

  const handleCheck = () => {
    const typed = letters.join("").toLowerCase().trim();
    if (!typed) return;
    const isCorrect = typed === word.en.toLowerCase();
    setResult(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore(s => s + 1);
    setTimeout(() => {
      if (current < words.length - 1) { setCurrent(c => c + 1); setResult(null); }
      else { setFinished(true); }
    }, 1500);
  };

  const handleRetry = () => { setCurrent(0); setResult(null); setScore(0); setFinished(false); };

  if (finished) {
    return <ResultScreen emoji="✍️" title="Hoàn thành!" subtitle={`Chính tả ${words.length} từ`} score={score} total={words.length} onRetry={handleRetry} />;
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-muted-foreground">Từ {current + 1} / {words.length}</span>
      </div>
      <Progress value={((current + 1) / words.length) * 100} className="h-2 rounded-full mb-5" />

      <SectionCard className="mb-5 text-center">
        {(() => { const SIcon = getWordIcon(word.en, word.type); return (
          <div className="inline-flex p-2.5 rounded-xl bg-primary/10 mb-3">
            <SIcon className="h-6 w-6 text-primary" />
          </div>
        ); })()}
        <p className="text-xs text-muted-foreground mb-1">Viết từ tiếng Anh:</p>
        <p className="font-display font-extrabold text-2xl text-foreground mb-1">{word.vi}</p>
        <p className="text-xs text-muted-foreground mb-4">{wordTypeLabels[word.type] || word.type}</p>

        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {word.en.split("").map((char, idx) => {
            if (char === " ") return <div key={idx} className="w-4" />;
            const isCorrectChar = result === "correct";
            const isWrongChar = result === "wrong";
            return (
              <input
                key={idx}
                id={`spell-${idx}`}
                type="text"
                maxLength={1}
                value={letters[idx] || ""}
                onChange={(e) => handleLetterChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                autoFocus={idx === 0}
                disabled={!!result}
                className={`w-10 h-12 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all ${
                  isCorrectChar
                    ? "border-success bg-success/10 text-success"
                    : isWrongChar
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : letters[idx]
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-foreground focus:border-primary"
                }`}
              />
            );
          })}
        </div>

        {result === "wrong" && (
          <p className="text-destructive text-sm mt-3">Đáp án: <strong>{word.en}</strong></p>
        )}
      </SectionCard>

      <motion.button whileTap={{ scale: 0.95 }} onClick={handleCheck} disabled={!!result}
        className="w-full gradient-primary text-white py-3.5 rounded-2xl font-display font-bold text-sm shadow-md disabled:opacity-50">
        Kiểm tra
      </motion.button>
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
    const matchSearch = w.en.toLowerCase().includes(search.toLowerCase()) || w.vi.toLowerCase().includes(search.toLowerCase());
    const matchType = !activeType || (wordTypeLabels[w.type] || w.type) === activeType;
    return matchSearch && matchType;
  });
  const sorted = [...filtered].sort((a, b) => a.en.localeCompare(b.en));
  const grouped = sorted.reduce((acc, w) => {
    const letter = w.en[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(w);
    return acc;
  }, {} as Record<string, VocabItem[]>);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm từ vựng..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/30 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/40 focus:shadow-md transition-all"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {Object.entries(wordTypeColors).map(([type, c]) => {
          const count = words.filter(w => (wordTypeLabels[w.type] || w.type) === type).length;
          if (!count) return null;
          const isActive = activeType === type;
          return (
            <button key={type} onClick={() => setActiveType(isActive ? null : type)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                isActive ? `${c.bg} text-white shadow-md scale-105` : "bg-card/80 border border-border/30 text-muted-foreground hover:text-foreground"
              }`}>
              {c.icon} {type} · {count}
            </button>
          );
        })}
      </div>

      <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-1">
        {Object.keys(grouped).length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">Không tìm thấy từ nào</p>
        )}
        {Object.entries(grouped).map(([letter, items]) => (
          <div key={letter}>
            <div className="sticky top-0 z-10 flex items-center gap-2 py-1.5">
              <span className="font-display font-extrabold text-lg text-primary">{letter}</span>
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-[10px] text-muted-foreground font-bold">{items.length}</span>
            </div>
            {items.map((w, i) => {
              const globalIdx = words.indexOf(w);
              const isExpanded = expandedIdx === globalIdx;
              const WIcon = getWordIcon(w.en, w.type);
              const typeColor = wordTypeColors[wordTypeLabels[w.type] || w.type] || defaultTypeColor;
              return (
                <motion.div key={`${letter}-${i}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                  onClick={() => setExpandedIdx(isExpanded ? null : globalIdx)}
                  className={`rounded-xl px-3.5 py-2.5 mb-1 cursor-pointer transition-all ${
                    isExpanded ? "bg-card/90 backdrop-blur-xl shadow-md border border-primary/20" : "hover:bg-card/60 border border-transparent"
                  }`}>
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
                    <button onClick={(e) => { e.stopPropagation(); speak(w.en); }}
                      className="p-2 rounded-full hover:bg-primary/10 transition-colors shrink-0">
                      <Volume2 className="h-3.5 w-3.5 text-primary" />
                    </button>
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-4">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Nghĩa tiếng Việt</p>
                            <p className="font-display font-bold text-foreground">{w.vi}</p>
                          </div>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); speak(w.en); }}
                            className="gradient-primary text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
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
      <div className="max-w-lg mx-auto w-full px-5 pt-12 pb-6 flex flex-col min-h-screen">
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div className="flex-1">
            <p className="font-display font-extrabold text-sm text-foreground">Unit {unitKey} — {unit.title}</p>
            <p className="text-xs text-muted-foreground">{unit.vocabulary.length} từ vựng</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/dashboard")}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
            <Home className="h-5 w-5" />
          </motion.button>
        </div>

        <Tabs defaultValue="list" className="w-full flex-1 flex flex-col min-h-0">
          <TabsList className="w-full grid grid-cols-4 mb-4 bg-card/60 backdrop-blur-xl rounded-2xl p-1 border border-border/30 shrink-0">
            <TabsTrigger value="list" className="rounded-xl text-xs font-bold data-[state=active]:gradient-primary data-[state=active]:text-white">
              <BookText className="h-3.5 w-3.5 mr-1" /> Từ điển
            </TabsTrigger>
            <TabsTrigger value="flashcard" className="rounded-xl text-xs font-bold data-[state=active]:gradient-accent data-[state=active]:text-white">
              <BookOpen className="h-3.5 w-3.5 mr-1" /> Flashcard
            </TabsTrigger>
            <TabsTrigger value="quiz" className="rounded-xl text-xs font-bold data-[state=active]:gradient-primary data-[state=active]:text-white">
              <Brain className="h-3.5 w-3.5 mr-1" /> Trắc nghiệm
            </TabsTrigger>
            <TabsTrigger value="spelling" className="rounded-xl text-xs font-bold data-[state=active]:gradient-success data-[state=active]:text-white">
              <Pencil className="h-3.5 w-3.5 mr-1" /> Chính tả
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="flex-1 min-h-0"><DictionaryTab words={unit.vocabulary} /></TabsContent>
          <TabsContent value="flashcard" className="flex-1 flex flex-col min-h-0"><FlashcardTab words={unit.vocabulary} /></TabsContent>
          <TabsContent value="quiz" className="flex-1"><QuizTab words={unit.vocabulary} /></TabsContent>
          <TabsContent value="spelling" className="flex-1"><SpellingTab words={unit.vocabulary} /></TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
};

export default VocabPage;
