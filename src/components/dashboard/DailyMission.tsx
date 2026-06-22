import { motion } from "framer-motion";
import { BookOpen, Brain, Headphones, Check, Flame } from "lucide-react";
import type { UserProgress } from "@/lib/progress";
import { getDailyTasks, countCompletedTasks, getStreakMultiplier } from "@/lib/daily";

interface Props {
  progress: UserProgress | null;
}

const tasks = [
  { key: "reviewWords" as const, label: "Ôn từ vựng", icon: BookOpen },
  { key: "quizDone" as const, label: "Làm 1 bài quiz", icon: Brain },
  { key: "listenDone" as const, label: "Luyện nghe/đọc", icon: Headphones },
];

const DailyMission = ({ progress }: Props) => {
  const daily = progress ? getDailyTasks(progress) : null;
  const completed = daily ? countCompletedTasks(daily) : 0;
  const total = 3;
  const isDone = completed >= total;
  const streak = progress?.dailyStreak || 0;
  const multiplier = getStreakMultiplier(streak);

  return (
    <div className="space-y-3">
      {/* Streak badge */}
      {streak > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border shadow-1 rounded-xl">
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <Flame className="h-4 w-4 text-streak" />
          </motion.div>
          <span className="text-xs font-bold text-foreground">{streak} ngày</span>
          {multiplier > 1 && (
            <span className="text-[10px] font-bold text-primary ml-auto">x{multiplier}</span>
          )}
        </div>
      )}

      {/* Daily mission card */}
      <div className={`rounded-2xl p-4 relative overflow-hidden bg-card border shadow-1 ${isDone ? "border-success/50" : "border-border"}`}>
        <h4 className="font-display font-bold text-sm text-foreground mb-2.5">
          {isDone ? "Hoàn thành! ✓" : "Nhiệm vụ hôm nay"}
        </h4>

        <div className="space-y-1.5 mb-3">
          {tasks.map((task) => {
            const done = daily?.[task.key] || false;
            return (
              <div
                key={task.key}
                className={`flex items-center gap-2 text-xs font-semibold rounded-lg px-2.5 py-1.5 transition-all ${
                  done ? "bg-success/10 text-success line-through opacity-70" : "bg-muted text-foreground"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <task.icon className="h-3.5 w-3.5 text-muted-foreground" />}
                <span>{task.label}</span>
              </div>
            );
          })}
        </div>

        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completed / total) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${isDone ? "bg-success" : "bg-primary"}`}
          />
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground">{completed}/{total}</span>
      </div>
    </div>
  );
};

export default DailyMission;
