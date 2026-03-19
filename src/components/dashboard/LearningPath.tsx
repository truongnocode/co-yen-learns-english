import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Star, Play, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { gradeConfig } from "@/data/types";
import type { UserProgress } from "@/lib/progress";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

interface Props {
  progress: UserProgress | null;
}

const pathItems = [
  { type: "TỪ VỰNG", title: "Đồ dùng học tập", unit: "1", gradient: "gradient-purple-card" },
  { type: "NGỮ PHÁP", title: "Thì Hiện tại đơn", unit: "1", gradient: "gradient-cool" },
  { type: "NGỮ PHÁP", title: "Danh từ số nhiều", unit: "1", gradient: "gradient-cool" },
  { type: "TỪ VỰNG", title: "Gia đình & bạn bè", unit: "2", gradient: "gradient-purple-card" },
  { type: "BÀI TẬP", title: "Unit 1 - Tổng ôn", unit: "1", gradient: "gradient-accent" },
];

const LearningPath = ({ progress }: Props) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const grade = profile?.grade || 6;
  const cfg = gradeConfig[grade];
  const completedUnits = (progress?.quizHistory || []).map((q) => q.unit);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...smooth, delay: 0.1 }}
      className="flex-1"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-extrabold text-lg text-foreground">
          Lộ trình của em ({cfg.label})
        </h2>
        <button
          onClick={() => navigate(`/grade/${grade}`)}
          className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
        >
          Xem tất cả
        </button>
      </div>

      <div className="space-y-3">
        {pathItems.map((item, i) => {
          const isDone = completedUnits.includes(item.unit);
          const isLocked = i > 2 && !isDone;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...smooth, delay: 0.15 + i * 0.05 }}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-md ${
                isLocked
                  ? "bg-muted/30 border-border/50 opacity-60"
                  : "bg-card/80 border-white/60 hover:border-primary/30"
              }`}
              onClick={() => !isLocked && navigate(`/grade/${grade}`)}
            >
              {/* Status icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDone ? "gradient-success" : isLocked ? "bg-muted" : "gradient-purple-card"
              }`}>
                {isDone ? (
                  <Star className="h-5 w-5 text-white fill-white" />
                ) : isLocked ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Star className="h-5 w-5 text-white" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  item.type === "TỪ VỰNG" ? "text-primary" : item.type === "NGỮ PHÁP" ? "text-accent" : "text-success"
                }`}>
                  {item.type}
                </span>
                <h3 className="font-display font-bold text-sm text-foreground truncate">
                  Unit {item.unit}: {item.title}
                </h3>
              </div>

              {/* Play button */}
              {!isLocked && (
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
                >
                  <Play className="h-4 w-4 text-primary fill-primary" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default LearningPath;
