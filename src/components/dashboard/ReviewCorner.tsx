import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Puzzle, Mic, BookOpen, PenLine } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

const ReviewCorner = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const grade = profile?.grade || 6;

  const activities = [
    { label: "Nối từ\nghép cặp", icon: Puzzle, gradient: "gradient-warm", path: `/practice/word-match/${grade}` },
    { label: "Luyện\nphát âm", icon: Mic, gradient: "gradient-accent", path: `/practice/shadowing/${grade}` },
    { label: "Flashcard\ntừ vựng", icon: BookOpen, gradient: "gradient-cool", path: `/practice/srs-review` },
    { label: "Xếp\ncâu", icon: PenLine, gradient: "gradient-success", path: `/practice/sentence-puzzle/${grade}` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...smooth, delay: 0.2 }}
      className="w-full"
    >
      <h2 className="font-display font-extrabold text-lg text-foreground mb-5">
        Góc ôn tập vui nhộn
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {activities.map((act, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(act.path)}
            className="bg-card/80 backdrop-blur-sm border border-white/60 rounded-2xl p-4 flex flex-col items-center gap-3 hover:shadow-lg transition-all duration-300 hover:border-primary/30"
          >
            <div className={`w-12 h-12 rounded-xl ${act.gradient} flex items-center justify-center shadow-md`}>
              <act.icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-bold text-foreground text-center whitespace-pre-line leading-tight">
              {act.label}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default ReviewCorner;
