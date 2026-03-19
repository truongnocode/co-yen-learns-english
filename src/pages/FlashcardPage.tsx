import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gradesData } from "@/data/vocabulary";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const FlashcardPage = () => {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const unit = gradesData.flatMap((g) => g.units).find((u) => u.id === unitId);
  if (!unit) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Không tìm thấy bài học.</div>;

  const word = unit.words[currentIndex];
  const progress = ((currentIndex + 1) / unit.words.length) * 100;

  const goNext = () => { if (currentIndex < unit.words.length - 1) { setFlipped(false); setCurrentIndex((i) => i + 1); } };
  const goPrev = () => { if (currentIndex > 0) { setFlipped(false); setCurrentIndex((i) => i - 1); } };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="p-2.5 rounded-xl bg-card shadow-card text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </motion.button>
        <div className="flex-1">
          <p className="font-display font-bold text-sm text-foreground">{unit.name} — {unit.topic}</p>
          <p className="text-xs text-muted-foreground">Flashcard 🃏</p>
        </div>
        <span className="text-xs gradient-primary text-white px-3 py-1.5 rounded-full font-bold">{currentIndex + 1}/{unit.words.length}</span>
      </div>
      <Progress value={progress} className="mx-5 h-2.5 rounded-full" />

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-5 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentIndex}-${flipped}`}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={() => setFlipped(!flipped)}
            className={`w-full max-w-sm aspect-[3/4] rounded-3xl shadow-card-hover flex flex-col items-center justify-center cursor-pointer select-none p-8 border border-white/50 relative overflow-hidden ${
              flipped ? "gradient-primary text-white" : "gradient-card"
            }`}
          >
            {/* Decorative circles */}
            <div className={`absolute top-6 right-6 w-16 h-16 rounded-full ${flipped ? "bg-white/10" : "bg-primary/5"} float-animation`} />
            <div className={`absolute bottom-8 left-8 w-10 h-10 rounded-full ${flipped ? "bg-white/10" : "bg-accent/10"} float-animation-delay`} />

            {!flipped ? (
              <>
                <span className="text-5xl font-display font-bold text-foreground mb-4 relative z-10">{word.english}</span>
                <span className="text-lg text-muted-foreground relative z-10">{word.phonetic}</span>
                <span className="text-xs text-muted-foreground mt-8 bg-muted/50 px-4 py-1.5 rounded-full relative z-10">👆 Nhấn để lật thẻ</span>
              </>
            ) : (
              <>
                <span className="text-4xl font-display font-bold mb-3 relative z-10">{word.vietnamese}</span>
                <span className="text-xl opacity-90 relative z-10">{word.english}</span>
                <span className="text-sm opacity-70 mt-1 relative z-10">{word.phonetic}</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-5 pb-12">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.85 }} onClick={goPrev} disabled={currentIndex === 0}
          className="p-4 rounded-full bg-card shadow-card text-foreground disabled:opacity-30 border border-white/40">
          <ChevronLeft className="h-6 w-6" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1, rotate: 180 }} whileTap={{ scale: 0.85 }} onClick={() => setFlipped(!flipped)}
          className="p-4 rounded-full gradient-accent text-white shadow-lg">
          <RotateCcw className="h-6 w-6" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.85 }} onClick={goNext} disabled={currentIndex === unit.words.length - 1}
          className="p-4 rounded-full gradient-primary text-white shadow-lg disabled:opacity-30">
          <ChevronRight className="h-6 w-6" />
        </motion.button>
      </div>
    </div>
  );
};

export default FlashcardPage;
