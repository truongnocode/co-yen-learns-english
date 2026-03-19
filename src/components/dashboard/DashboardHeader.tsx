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
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={smooth}
      className="flex items-center justify-between gap-4 mb-8"
    >
      {/* Grade selector */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm border border-border rounded-full px-4 py-2 text-sm font-bold text-foreground hover:border-primary/40 transition-colors">
          {cfg.emoji} {cfg.label}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {/* Search */}
        <div className="hidden sm:flex items-center gap-2 bg-card/60 backdrop-blur-sm border border-border rounded-full px-4 py-2 w-64">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm bài học, từ vựng..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none w-full"
          />
        </div>
      </div>

      {/* Stats + Profile */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-card/80 border border-border rounded-full px-3 py-1.5">
          <Flame className="h-4 w-4 text-pink" />
          <span className="text-sm font-extrabold text-foreground">{streak}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-card/80 border border-border rounded-full px-3 py-1.5">
          <Star className="h-4 w-4 text-energy" />
          <span className="text-sm font-extrabold text-foreground">{xp}</span>
        </div>
        <button className="p-2 rounded-full hover:bg-muted/60 transition-colors relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <img
            src={user?.photoURL || ""}
            alt="Avatar"
            className="w-9 h-9 rounded-full border-2 border-primary/30 object-cover shadow-sm"
            referrerPolicy="no-referrer"
          />
          <span className="hidden md:inline text-sm font-bold text-foreground">
            {user?.displayName?.split(" ").pop() || "Học sinh"}
          </span>
        </div>
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
    </motion.header>
  );
};

export default DashboardHeader;
