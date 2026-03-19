import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import type { UserProgress } from "@/lib/progress";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

interface Props {
  progress: UserProgress | null;
}

const Leaderboard = ({ progress }: Props) => {
  const { user, profile } = useAuth();
  const grade = profile?.grade || 6;
  const xp = (progress?.wordsLearned?.length || 0) * 10 + (progress?.quizzesDone || 0) * 30;

  const students = [
    { rank: 1, name: "Minh Tuấn", xp: 1250, color: "gradient-energy", medal: "🥇" },
    { rank: 2, name: "Thu Hà", xp: 1100, color: "gradient-cool", medal: "🥈" },
    { rank: 3, name: "Đức Anh", xp: 980, color: "gradient-accent", medal: "🥉" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...smooth, delay: 0.35 }}
      className="bg-card/80 backdrop-blur-sm border border-white/60 rounded-3xl p-5"
    >
      <h3 className="font-display font-extrabold text-sm text-foreground mb-4 flex items-center gap-2">
        🏆 Xếp hạng Khối {grade}
      </h3>
      <div className="space-y-2.5">
        {students.map((student) => (
          <div key={student.rank} className="flex items-center gap-2.5 bg-muted/30 rounded-xl px-3 py-2">
            <span className="text-sm">{student.medal}</span>
            <div className={`w-7 h-7 rounded-full ${student.color} flex items-center justify-center text-white text-[10px] font-bold shadow-sm shrink-0`}>
              {student.name[0]}
            </div>
            <span className="text-xs font-bold text-foreground truncate flex-1">{student.name}</span>
            <span className="text-[11px] font-extrabold text-accent">{student.xp} XP</span>
          </div>
        ))}
        {/* Current user */}
        <div className="flex items-center gap-2.5 bg-primary/10 rounded-xl px-3 py-2 border border-primary/20">
          <span className="text-xs font-bold text-muted-foreground w-4 text-center">—</span>
          <div className="w-7 h-7 rounded-full gradient-purple-card flex items-center justify-center text-white text-[10px] font-bold shadow-sm shrink-0 overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
            ) : (
              (user?.displayName?.[0] || "?")
            )}
          </div>
          <span className="text-xs font-bold text-primary truncate flex-1">Bạn</span>
          <span className="text-[11px] font-extrabold text-primary">{xp} XP</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Leaderboard;
