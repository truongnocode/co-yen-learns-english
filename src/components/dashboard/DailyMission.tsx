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
        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/50">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Flame className="h-5 w-5 text-orange-500" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-extrabold text-orange-700">{streak} ngày liên tiếp!</span>
            {multiplier > 1 && (
              <span className="text-[10px] font-bold text-orange-500 ml-1.5">XP x{multiplier}</span>
            )}
          </div>
        </div>
      )}

      {/* Daily mission card */}
      <div className={`${isDone ? "bg-gradient-to-br from-emerald-400 to-emerald-500" : "gradient-warm"} rounded-2xl p-4 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />

        <h4 className="font-display font-extrabold text-sm mb-2">
          {isDone ? "Hoàn thành! 🎉" : "Nhiệm vụ hôm nay"}
        </h4>

        {/* Tasks checklist */}
        <div className="space-y-1.5 mb-3">
          {tasks.map((task) => {
            const done = daily?.[task.key] || false;
            return (
              <div
                key={task.key}
                className={`flex items-center gap-2 text-xs font-bold rounded-lg px-2.5 py-1.5 transition-all ${
                  done ? "bg-white/25 line-through opacity-70" : "bg-white/10"
                }`}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5 text-white" />
                ) : (
                  <task.icon className="h-3.5 w-3.5 text-white/70" />
                )}
                <span>{task.label}</span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-1.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completed / total) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-white/90 rounded-full"
          />
        </div>
        <span className="text-[10px] font-bold text-white/80">{completed}/{total} nhiệm vụ</span>
      </div>
    </div>
  );
};

export default DailyMission;
