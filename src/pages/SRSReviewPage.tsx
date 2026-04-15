import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Home, RotateCcw, ThumbsDown, Minus, ThumbsUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getProgress } from "@/lib/progress";
import { loadSGKData } from "@/data/loader";
import { getDueWords, updateSRS, initSRSItems, type SRSItem } from "@/lib/srs";
import type { VocabItem } from "@/data/types";
import { speakUS } from "@/lib/tts";
import PageShell from "@/components/PageShell";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const smooth = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

const SRSReviewPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const grade = profile?.grade || 6;

  const [dueItems, setDueItems] = useState<SRSItem[]>([]);
  const [vocabMap, setVocabMap] = useState<Map<string, VocabItem>>(new Map());
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getProgress(user.uid), loadSGKData(grade)]).then(async ([progress, data]) => {
      // Build vocab lookup
      const vMap = new Map<string, VocabItem>();
      Object.values(data.units).forEach((u) => u.vocabulary.forEach((v) => vMap.set(v.en, v)));
      setVocabMap(vMap);

      // Init SRS if empty
      let srsData = progress.srsData || {};
      if (Object.keys(srsData).length === 0) {
        const allWords = Array.from(vMap.keys());
        srsData = initSRSItems(allWords);
        await updateDoc(doc(db, "progress", user.uid), { srsData });
      }

      const due = getDueWords(srsData);
      setDueItems(due.slice(0, 20)); // Max 20 per session
    }).finally(() => setLoading(false));
  }, [user, grade]);

  const handleRate = async (quality: number) => {
    if (!user) return;
    const item = dueItems[current];
    const updated = updateSRS(item, quality);

    // Update Firestore
    await updateDoc(doc(db, "progress", user.uid), {
      [`srsData.${item.word}`]: updated,
    }).catch(() => {});

    setReviewed((r) => r + 1);
    setFlipped(false);

    if (current < dueItems.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setCurrent(-1); // finished
    }
  };

  if (loading) return (
    <PageShell><div className="flex items-center justify-center pt-40">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
    </div></PageShell>
  );

  const item = current >= 0 ? dueItems[current] : null;
  const vocab = item ? vocabMap.get(item.word) : null;
  const isFinished = current < 0 || dueItems.length === 0;

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
          {!isFinished && (
            <span className="ml-auto text-xs gradient-primary text-white px-3 py-1.5 rounded-full font-bold">
              {current + 1}/{dueItems.length}
            </span>
          )}
        </div>

        <h1 className="font-display font-extrabold text-2xl text-foreground mb-1">Ôn tập thông minh</h1>
        <p className="text-muted-foreground text-sm mb-6">
          {dueItems.length > 0 ? `${dueItems.length} từ cần ôn hôm nay` : "Không có từ nào cần ôn!"}
        </p>

        {isFinished ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 text-center shadow-xl border border-border/30">
            <span className="text-6xl block mb-4">{dueItems.length === 0 ? "🎯" : "🎉"}</span>
            <h2 className="font-display font-extrabold text-2xl text-foreground mb-2">
              {dueItems.length === 0 ? "Tuyệt vời!" : "Hoàn thành!"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {dueItems.length === 0 ? "Không có từ nào cần ôn. Hẹn em mai nhé!" : `Đã ôn ${reviewed} từ`}
            </p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/dashboard")}
              className="gradient-primary text-white rounded-2xl px-8 py-3 font-display font-bold shadow-lg">
              Về trang chủ
            </motion.button>
          </motion.div>
        ) : vocab ? (
          <div>
            {/* Flashcard */}
            <motion.div
              onClick={() => { setFlipped(!flipped); if (!flipped) speakUS(vocab.en); }}
              className={`w-full aspect-[4/3] rounded-3xl shadow-xl flex flex-col items-center justify-center cursor-pointer p-8 border border-white/40 relative overflow-hidden mb-6 ${
                flipped ? "gradient-purple-card text-white" : "bg-card/80 backdrop-blur-xl"
              }`}
            >
              <AnimatePresence mode="wait">
                <motion.div key={flipped ? "back" : "front"}
                  initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -90, opacity: 0 }}
                  className="text-center"
                >
                  {!flipped ? (
                    <>
                      <span className="text-4xl font-display font-bold mb-3 block">{vocab.en}</span>
                      <span className="text-sm opacity-60 block">Nhấn để xem nghĩa</span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-display font-bold mb-2 block">{vocab.vi}</span>
                      <span className="text-lg opacity-80 block">{vocab.en}</span>
                      <span className="text-xs mt-1 opacity-60 block">({vocab.type})</span>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Rating buttons */}
            {flipped && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
                  onClick={() => handleRate(1)}
                  className="flex-1 bg-red-100 text-red-700 rounded-2xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 border border-red-200">
                  <ThumbsDown className="h-4 w-4" /> Khó
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
                  onClick={() => handleRate(3)}
                  className="flex-1 bg-amber-100 text-amber-700 rounded-2xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 border border-amber-200">
                  <Minus className="h-4 w-4" /> OK
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
                  onClick={() => handleRate(5)}
                  className="flex-1 bg-emerald-100 text-emerald-700 rounded-2xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 border border-emerald-200">
                  <ThumbsUp className="h-4 w-4" /> Dễ
                </motion.button>
              </motion.div>
            )}
          </div>
        ) : null}
      </div>
    </PageShell>
  );
};

export default SRSReviewPage;
