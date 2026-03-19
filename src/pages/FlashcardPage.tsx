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

  const goNext = () => {
    if (currentIndex < unit.words.length - 1) {
      setFlipped(false);
      setCurrentIndex((i) => i + 1);
    }
  };
  const goPrev = () => {
    if (currentIndex > 0) {
      setFlipped(false);
      setCurrentIndex((i) => i - 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-muted text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <p className="font-display font-bold text-sm text-foreground">{unit.name} — {unit.topic}</p>
          <p className="text-xs text-muted-foreground">Flashcard</p>
        </div>
        <span className="text-xs text-muted-foreground font-medium">{currentIndex + 1}/{unit.words.length}</span>
      </div>
      <Progress value={progress} className="mx-5 h-2 rounded-full" />

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center px-5 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentIndex}-${flipped}`}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={() => setFlipped(!flipped)}
            className="w-full max-w-sm aspect-[3/4] bg-card rounded-3xl shadow-card-hover flex flex-col items-center justify-center cursor-pointer select-none p-8"
          >
            {!flipped ? (
              <>
                <span className="text-4xl font-display font-bold text-foreground mb-3">{word.english}</span>
                <span className="text-lg text-muted-foreground">{word.phonetic}</span>
                <span className="text-xs text-muted-foreground mt-6">Nhấn để lật thẻ</span>
              </>
            ) : (
              <>
                <span className="text-3xl font-display font-bold text-primary mb-2">{word.vietnamese}</span>
                <span className="text-lg text-muted-foreground">{word.english}</span>
                <span className="text-sm text-muted-foreground mt-1">{word.phonetic}</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 pb-12">
        <motion.button whileTap={{ scale: 0.85 }} onClick={goPrev} disabled={currentIndex === 0}
          className="p-3 rounded-full bg-muted text-foreground disabled:opacity-30">
          <ChevronLeft className="h-6 w-6" />
        </motion.button>
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => setFlipped(!flipped)}
          className="p-3 rounded-full bg-accent text-accent-foreground">
          <RotateCcw className="h-6 w-6" />
        </motion.button>
        <motion.button whileTap={{ scale: 0.85 }} onClick={goNext} disabled={currentIndex === unit.words.length - 1}
          className="p-3 rounded-full bg-primary text-primary-foreground disabled:opacity-30">
          <ChevronRight className="h-6 w-6" />
        </motion.button>
      </div>
    </div>
  );
};

export default FlashcardPage;
