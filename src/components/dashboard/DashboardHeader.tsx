import { motion } from "framer-motion";
import { Search, Flame, Star, Bell, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { gradeConfig } from "@/data/types";
import type { UserProgress } from "@/lib/progress";

const smooth = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

interface Props {
  progress: UserProgress | null;
}

const DashboardHeader = ({ progress }: Props) => {
  const { user, profile, logout } = useAuth();
  const grade = profile?.grade || 6;
  const cfg = gradeConfig[grade];
  const streak = Math.min(progress?.quizzesDone || 0, 7);
  const xp = (progress?.wordsLearned?.length || 0) * 10 + (progress?.quizzesDone || 0) * 30;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={smooth}
      className="flex items-center justify-between gap-2 flex-wrap"
    >
      {/* Stats */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-card/80 border border-border rounded-full px-3 py-1.5">
          <Flame className="h-4 w-4 text-pink" />
          <span className="text-sm font-extrabold text-foreground">{streak}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-card/80 border border-border rounded-full px-3 py-1.5">
          <Star className="h-4 w-4 text-energy" />
          <span className="text-sm font-extrabold text-foreground">{xp}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button className="p-2 rounded-full hover:bg-muted/60 transition-colors relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={logout}
          className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Đăng xuất"
        >
          <LogOut className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default DashboardHeader;
