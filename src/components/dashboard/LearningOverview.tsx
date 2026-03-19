import { motion } from "framer-motion";
import { BookOpen, Zap, Mic, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { gradeConfig } from "@/data/types";
import type { UserProgress } from "@/lib/progress";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

interface Props {
  progress: UserProgress | null;
}

const LearningOverview = ({ progress }: Props) => {
  const { user, profile } = useAuth();
  const grade = profile?.grade || 6;
  const cfg = gradeConfig[grade];
  const xp = (progress?.wordsLearned?.length || 0) * 10 + (progress?.quizzesDone || 0) * 30;

  const vocabPct = Math.min((progress?.wordsLearned?.length || 0) * 5, 100);
  const grammarPct = Math.min((progress?.quizzesDone || 0) * 10, 100);
  const speakingPct = Math.min(Math.round(vocabPct * 0.5), 100);

  // Determine title based on XP
  const getTitle = () => {
    if (xp >= 2000) return "Chiến binh ngữ pháp";
    if (xp >= 1000) return "Nhà thám hiểm";
    if (xp >= 500) return "Học giả nhí";
    return "Tân binh";
  };

  const skills = [
    { label: "Từ vựng", icon: BookOpen, pct: vocabPct, color: "bg-primary", trackColor: "bg-primary/20" },
    { label: "Ngữ pháp", icon: Zap, pct: grammarPct, color: "bg-accent", trackColor: "bg-accent/20" },
    { label: "Luyện nói & Giao tiếp", icon: Mic, pct: speakingPct, color: "bg-success", trackColor: "bg-success/20" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...smooth, delay: 0.25 }}
      className="mb-0"
    >
      <h2 className="font-display font-extrabold text-xl text-foreground mb-6">
        Tổng quan học tập
      </h2>

      <div className="flex flex-col gap-6">
        {/* Profile card */}
        <div className="bg-card/80 backdrop-blur-sm border border-white/60 rounded-3xl p-6 flex flex-col items-center w-full md:w-64 shrink-0">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full gradient-purple-card p-[3px] shadow-lg">
              <img
                src={user?.photoURL || ""}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover border-3 border-card"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Streak badge */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full gradient-warm flex items-center justify-center text-white shadow-md">
              <span className="text-xs">🔥</span>
            </div>
          </div>

          <h3 className="font-display font-extrabold text-lg text-foreground mb-0.5">
            {user?.displayName?.split(" ").slice(-2).join(" ") || "Học sinh"}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">{user?.email}</p>

          <div className="flex items-center gap-4 w-full bg-muted/40 rounded-xl px-4 py-3 mb-3">
            <div className="text-center flex-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Khối lớp</span>
              <span className="font-display font-extrabold text-base text-primary">{cfg.label}</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center flex-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Tổng điểm</span>
              <span className="font-display font-extrabold text-base text-accent">{xp.toLocaleString()} XP</span>
            </div>
          </div>

          <div className="w-full bg-primary/10 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary">Danh hiệu: {getTitle()}</span>
          </div>
        </div>

        {/* Skill progress */}
        <div className="bg-card/80 backdrop-blur-sm border border-white/60 rounded-3xl p-6 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl gradient-cool flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-foreground">Tiến độ kỹ năng</h3>
              <p className="text-xs text-muted-foreground">Theo dõi sự tiến bộ của em trong Unit hiện tại</p>
            </div>
          </div>

          <div className="space-y-5 mt-6">
            {skills.map((skill, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${skill.color} flex items-center justify-center`}>
                      <skill.icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-foreground">{skill.label}</span>
                  </div>
                  <span className={`text-sm font-extrabold ${
                    skill.pct >= 70 ? "text-success" : skill.pct >= 40 ? "text-accent" : "text-pink"
                  }`}>
                    {skill.pct}%
                  </span>
                </div>
                <div className={`w-full h-3 ${skill.trackColor} rounded-full overflow-hidden`}>
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
      </div>
    </motion.div>
  );
};

export default LearningOverview;
