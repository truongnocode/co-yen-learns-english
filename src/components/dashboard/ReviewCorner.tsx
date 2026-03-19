import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, Mic, Puzzle, PenLine } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

const activities = [
  { label: "Nối từ\nghép cặp", icon: Puzzle, gradient: "gradient-warm", color: "bg-pink/10" },
  { label: "Luyện\nphát âm", icon: Mic, gradient: "gradient-accent", color: "bg-accent/10" },
  { label: "Flashcard\ntừ vựng", icon: BookOpen, gradient: "gradient-cool", color: "bg-primary/10" },
  { label: "Viết\ncâu", icon: PenLine, gradient: "gradient-success", color: "bg-success/10" },
];

const ReviewCorner = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const grade = profile?.grade || 6;

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
            onClick={() => navigate(`/grade/${grade}`)}
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

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...smooth, delay: 0.3 }}
        className="bg-card/80 backdrop-blur-sm border border-white/60 rounded-2xl p-5"
      >
        <h3 className="font-display font-extrabold text-sm text-foreground mb-4 flex items-center gap-2">
          🏆 Bảng xếp hạng Lớp
        </h3>
        <div className="space-y-3">
          {[
            { rank: 1, name: "Minh Tuấn", xp: 1250, color: "gradient-energy" },
            { rank: 2, name: "Thu Hà", xp: 1100, color: "gradient-cool" },
            { rank: 3, name: "Đức Anh", xp: 980, color: "gradient-accent" },
          ].map((student) => (
            <div key={student.rank} className="flex items-center gap-3">
              <span className="text-sm font-bold text-muted-foreground w-5">{student.rank}</span>
              <div className={`w-8 h-8 rounded-full ${student.color} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                {student.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-foreground truncate block">{student.name}</span>
              </div>
              <span className="text-xs font-extrabold text-accent">{student.xp} XP</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReviewCorner;
