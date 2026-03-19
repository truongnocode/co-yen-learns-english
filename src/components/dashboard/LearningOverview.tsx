import { motion } from "framer-motion";
import { BookOpen, Zap, Mic, Award, Flame, Star, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { gradeConfig } from "@/data/types";
import type { UserProgress } from "@/lib/progress";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

interface Props {
  progress: UserProgress | null;
}

const LearningOverview = ({ progress }: Props) => {
  const { user, profile, logout } = useAuth();
  const grade = profile?.grade || 6;
  const cfg = gradeConfig[grade];
  const streak = Math.min(progress?.quizzesDone || 0, 7);
  const xp = (progress?.wordsLearned?.length || 0) * 10 + (progress?.quizzesDone || 0) * 30;

  const vocabPct = Math.min((progress?.wordsLearned?.length || 0) * 5, 100);
  const grammarPct = Math.min((progress?.quizzesDone || 0) * 10, 100);
  const speakingPct = Math.min(Math.round(vocabPct * 0.5), 100);

  const getTitle = () => {
    if (xp >= 2000) return "Chiến binh ngữ pháp";
    if (xp >= 1000) return "Nhà thám hiểm";
    if (xp >= 500) return "Học giả nhí";
    return "Tân binh";
  };

  const skills = [
    { label: "Từ vựng", icon: BookOpen, pct: vocabPct, color: "bg-primary", trackColor: "bg-primary/20" },
    { label: "Ngữ pháp", icon: Zap, pct: grammarPct, color: "bg-accent", trackColor: "bg-accent/20" },
    { label: "Luyện nói", icon: Mic, pct: speakingPct, color: "bg-success", trackColor: "bg-success/20" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...smooth, delay: 0.25 }}
      className="flex flex-col gap-4"
    >
      {/* Profile card with integrated stats */}
      <div className="bg-card/80 backdrop-blur-sm border border-white/60 rounded-3xl p-5">
        {/* Top row: actions */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-extrabold text-sm text-foreground">Tổng quan</h2>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-full hover:bg-muted/60 transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
            </button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={logout}
              className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Avatar + name */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full gradient-purple-card p-[2px] shadow-lg">
              <img
                src={user?.photoURL || ""}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover border-2 border-card"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full gradient-warm flex items-center justify-center shadow-sm">
              <span className="text-[10px]">🔥</span>
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-extrabold text-base text-foreground truncate">
              {user?.displayName?.split(" ").slice(-2).join(" ") || "Học sinh"}
            </h3>
            <div className="flex items-center gap-1">
              <Award className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-bold text-primary">{getTitle()}</span>
            </div>
          </div>
        </div>

        {/* Stats row: Grade, Streak, XP */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/40 rounded-xl px-2 py-2.5 text-center">
            <span className="text-lg block mb-0.5">{cfg.emoji}</span>
            <span className="text-[10px] font-bold text-muted-foreground block">{cfg.label}</span>
          </div>
          <div className="bg-muted/40 rounded-xl px-2 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Flame className="h-4 w-4 text-pink" />
              <span className="font-display font-extrabold text-base text-foreground">{streak}</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground block">Streak</span>
          </div>
          <div className="bg-muted/40 rounded-xl px-2 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Star className="h-4 w-4 text-energy" />
              <span className="font-display font-extrabold text-base text-foreground">{xp}</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground block">XP</span>
          </div>
        </div>
      </div>

      {/* Skill progress */}
      <div className="bg-card/80 backdrop-blur-sm border border-white/60 rounded-3xl p-5">
        <h3 className="font-display font-extrabold text-sm text-foreground mb-4 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-cool flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          Tiến độ kỹ năng
        </h3>

        <div className="space-y-4">
          {skills.map((skill, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md ${skill.color} flex items-center justify-center`}>
                    <skill.icon className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-bold text-foreground">{skill.label}</span>
                </div>
                <span className={`text-xs font-extrabold ${
                  skill.pct >= 70 ? "text-success" : skill.pct >= 40 ? "text-accent" : "text-pink"
                }`}>
                  {skill.pct}%
                </span>
              </div>
              <div className={`w-full h-2.5 ${skill.trackColor} rounded-full overflow-hidden`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.pct}%` }}
                  transition={{ duration: 1.2, delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className={`h-full ${skill.color} rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default LearningOverview;
