import { motion } from "framer-motion";
import { Play, PartyPopper, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserProgress } from "@/lib/progress";
import { getDailyTasks, countCompletedTasks } from "@/lib/daily";
import foxMascot from "@/assets/fox-mascot.png";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

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

  const getButtonText = () => {
    if (allDone) return "Học thêm nào";
    if (completed > 0) return "Tiếp tục học";
    return "Bắt đầu ngay";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={smooth}
      className={`${allDone ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "gradient-purple-card"} rounded-2xl px-6 py-4 sm:px-8 sm:py-4 text-white relative overflow-hidden flex items-center mb-6`}
    >
      <div className="absolute top-0 right-0 w-60 h-60 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

      <div className="relative z-10 flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl drop-shadow-sm">
            Chào {name}! {allDone ? "🎉" : "👋"}
          </h1>
          {streak >= 3 && (
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1">
              <Flame className="h-3.5 w-3.5" />
              <span className="text-xs font-extrabold">{streak}</span>
            </div>
          )}
        </div>
        <p className="text-white/80 text-xs sm:text-sm leading-relaxed max-w-md mb-3 font-medium">
          {getMessage()}
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/grade/${grade}`)}
          className="bg-white text-primary font-display font-extrabold text-xs rounded-full px-5 py-2 inline-flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          {allDone ? <PartyPopper className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-primary" />}
          {getButtonText()}
        </motion.button>
      </div>

      <img
        src={foxMascot}
        alt="Mascot"
        className="absolute right-4 bottom-0 w-24 sm:w-32 opacity-95 drop-shadow-2xl hidden sm:block"
      />
    </motion.div>
  );
};

export default HeroBanner;
