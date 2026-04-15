import { motion } from "framer-motion";
import { Play, PartyPopper, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserProgress } from "@/lib/progress";
import { getDailyTasks, countCompletedTasks } from "@/lib/daily";

const smooth = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

interface Props {
  progress?: UserProgress | null;
}

const HeroBanner = ({ progress }: Props) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const grade = profile?.grade || 6;
  const name = user?.displayName?.split(" ").pop() || "Học sinh";

  const daily = progress ? getDailyTasks(progress) : null;
  const completed = daily ? countCompletedTasks(daily) : 0;
  const remaining = 3 - completed;
  const allDone = completed >= 3;
  const streak = progress?.dailyStreak || 0;

  const getMessage = () => {
    if (allDone) return "Xuất sắc! Em đã hoàn thành nhiệm vụ hôm nay rồi!";
    if (completed > 0) return `Còn ${remaining} nhiệm vụ nữa thôi! Cố lên nào!`;
    return "Hôm nay em có 3 nhiệm vụ nhỏ đang chờ. Bắt đầu thôi!";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={smooth}
      className="glass rounded-2xl px-6 py-5 sm:px-8 relative overflow-hidden mb-6"
    >
      {/* Subtle accent glow */}
      <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20 ${allDone ? "bg-emerald-400" : "bg-primary"}`} />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="font-display font-extrabold text-xl sm:text-2xl text-foreground">
            Chào {name}! {allDone ? "🎉" : "👋"}
          </h1>
          {streak >= 3 && (
            <div className="flex items-center gap-1 bg-orange-500/10 rounded-lg px-2 py-0.5">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">{streak}</span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-md mb-3">
          {getMessage()}
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(`/grade/${grade}`)}
          className="bg-primary text-primary-foreground text-xs font-bold rounded-xl px-5 py-2 inline-flex items-center gap-2 shadow-sm hover:brightness-110 transition-all active:scale-[0.97]"
        >
          {allDone ? <PartyPopper className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-white" />}
          {allDone ? "Học thêm" : completed > 0 ? "Tiếp tục" : "Bắt đầu"}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default HeroBanner;
