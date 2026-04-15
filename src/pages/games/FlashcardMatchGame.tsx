import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Timer, RotateCcw, MousePointerClick } from "lucide-react";
import { loadSGKData } from "@/data/loader";
import type { VocabItem } from "@/data/types";
import { filterWithEmoji } from "@/data/emojiMap";
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

interface Card {
  id: number;
  pairId: number;
  type: "emoji" | "word";
  display: string;
  word: string;
}

const FlashcardMatchGame = () => {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const grade = Number(gradeId || 6);

  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<number[]>([]);
  const [flips, setFlips] = useState(0);
  const [timer, setTimer] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  // Load data & build cards
  useEffect(() => {
    const effectiveGrade = grade === 10 ? 9 : grade;
    loadSGKData(effectiveGrade)
      .then((data) => {
        const allWords: VocabItem[] = [];
        Object.values(data.units).forEach((u) => allWords.push(...u.vocabulary));
        const withEmoji = filterWithEmoji(allWords);
        const picked = shuffle(withEmoji).slice(0, 6);

        const cardList: Card[] = [];
        picked.forEach((item, i) => {
          cardList.push({ id: i * 2, pairId: i, type: "emoji", display: item.emoji, word: item.en });
          cardList.push({ id: i * 2 + 1, pairId: i, type: "word", display: item.en, word: item.en });
        });
        setCards(shuffle(cardList));
      })
      .finally(() => setLoading(false));
  }, [grade]);

  // Timer
  useEffect(() => {
    if (loading || finished) return;
    const t = setInterval(() => setTimer((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading, finished]);

  const handleFlip = useCallback(
    (cardId: number) => {
      if (locked || flipped.has(cardId) || matched.has(cardId)) return;

      const newFlipped = new Set(flipped);
      newFlipped.add(cardId);
      setFlipped(newFlipped);
      setFlips((f) => f + 1);

      const newSelected = [...selected, cardId];
      setSelected(newSelected);

      if (newSelected.length === 2) {
        setLocked(true);
        const [first, second] = newSelected;
        const cardA = cards.find((c) => c.id === first)!;
        const cardB = cards.find((c) => c.id === second)!;

        if (cardA.pairId === cardB.pairId) {
          // Match found
          const newMatched = new Set(matched);
          newMatched.add(first);
          newMatched.add(second);
          setMatched(newMatched);
          setSelected([]);
          setLocked(false);
          if (newMatched.size >= cards.length) {
            setFinished(true);
          }
        } else {
          // No match - flip back
          setTimeout(() => {
            const resetFlipped = new Set(newFlipped);
            resetFlipped.delete(first);
            resetFlipped.delete(second);
            setFlipped(resetFlipped);
            setSelected([]);
            setLocked(false);
          }, 800);
        }
      }
    },
    [locked, flipped, matched, selected, cards]
  );

  const restart = () => {
    setFlipped(new Set());
    setMatched(new Set());
    setSelected([]);
    setFlips(0);
    setTimer(0);
    setFinished(false);
    setLocked(false);
    setCards((prev) => shuffle([...prev]));
  };

  if (loading)
    return (
      <PageShell>
        <div className="flex items-center justify-center pt-40">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full"
          />
        </div>
      </PageShell>
    );

  const getFeedbackEmoji = () => {
    if (flips <= 14) return "🌟";
    if (flips <= 20) return "🎉";
    return "👏";
  };

  const getFeedbackText = () => {
    if (flips <= 14) return "Trí nhớ siêu đẳng!";
    if (flips <= 20) return "Tuyệt vời!";
    return "Hoàn thành tốt!";
  };

  return (
    <PageShell>
      <div className="max-w-lg mx-auto px-5 pt-28 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/dashboard")}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30"
          >
            <Home className="h-5 w-5" />
          </motion.button>
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur rounded-full px-3 py-1.5 border border-border/30">
              <MousePointerClick className="h-4 w-4 text-accent" />
              <span className="font-display font-extrabold text-sm text-foreground">{flips}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur rounded-full px-3 py-1.5 border border-border/30">
              <Timer className="h-4 w-4 text-primary" />
              <span className="font-display font-extrabold text-sm text-foreground">{timer}s</span>
            </div>
          </div>
        </div>

        <h1 className="font-display font-extrabold text-2xl text-foreground mb-1">Lật thẻ nhớ</h1>
        <p className="text-muted-foreground text-sm mb-6">Tìm cặp emoji và từ tiếng Anh tương ứng</p>

        {finished ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 text-center shadow-xl border border-border/30"
          >
            <span className="text-6xl block mb-4">{getFeedbackEmoji()}</span>
            <h2 className="font-display font-extrabold text-2xl text-foreground mb-2">{getFeedbackText()}</h2>
            <p className="text-muted-foreground mb-1">
              Thời gian: <strong className="text-primary">{timer} giây</strong>
            </p>
            <p className="text-muted-foreground text-sm mb-6">
              Số lần lật: <strong className="text-accent">{flips} lần</strong>
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={restart}
              className="gradient-primary text-white rounded-2xl px-8 py-3 font-display font-bold inline-flex items-center gap-2 shadow-lg"
            >
              <RotateCcw className="h-4 w-4" /> Chơi lại
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {cards.map((card) => {
              const isFlipped = flipped.has(card.id) || matched.has(card.id);
              const isMatched = matched.has(card.id);

              return (
                <motion.div
                  key={card.id}
                  whileTap={!isFlipped ? { scale: 0.95 } : undefined}
                  onClick={() => handleFlip(card.id)}
                  className="aspect-square cursor-pointer"
                  style={{ perspective: 600 }}
                >
                  <div
                    className="relative w-full h-full transition-transform duration-500"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* Back face (face down) */}
                    <div
                      className={`absolute inset-0 rounded-2xl flex items-center justify-center border ${
                        isMatched
                          ? "bg-emerald-100 border-emerald-300"
                          : "bg-gradient-to-br from-primary/80 to-accent/80 border-primary/30 shadow-lg"
                      }`}
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <span className="text-3xl text-white font-bold select-none">?</span>
                    </div>

                    {/* Front face */}
                    <div
                      className={`absolute inset-0 rounded-2xl flex items-center justify-center border bg-card/80 backdrop-blur ${
                        isMatched
                          ? "border-emerald-400 opacity-70"
                          : "border-border/30 shadow-lg"
                      }`}
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      {card.type === "emoji" ? (
                        <span className="text-5xl select-none">{card.display}</span>
                      ) : (
                        <span className="font-bold text-lg text-foreground text-center px-1 leading-tight select-none">
                          {card.display}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default FlashcardMatchGame;
