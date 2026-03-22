import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { calcXP, getLeaderboard, type LeaderboardEntry, type UserProgress } from "@/lib/progress";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

const MEDAL = ["🥇", "🥈", "🥉"];
const COLORS = ["bg-amber-500", "bg-slate-400", "bg-orange-400"];

interface Props {
  progress: UserProgress | null;
}

const Leaderboard = ({ progress }: Props) => {
  const { user, profile } = useAuth();
  const grade = profile?.grade || 6;
  const myXP = progress ? calcXP(progress) : 0;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(grade)
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [grade]);

  // Find current user rank
  const myRank = entries.findIndex((e) => e.uid === user?.uid);
  const top3 = entries.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...smooth, delay: 0.35 }}
      className="glass rounded-2xl p-5"
    >
      <h3 className="font-display font-extrabold text-sm text-foreground mb-4 flex items-center gap-2">
        🏆 Xếp hạng Khối {grade}
      </h3>

      {loading ? (
        <div className="text-center py-4 text-muted-foreground text-xs">Đang tải...</div>
      ) : top3.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-xs">
          Chưa có ai trên bảng xếp hạng. Hãy là người đầu tiên!
        </div>
      ) : (
        <div className="space-y-2.5">
          {top3.map((entry, i) => (
            <div
              key={entry.uid}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${
                entry.uid === user?.uid ? "bg-primary/10 border border-primary/20" : "bg-muted/30"
              }`}
            >
              <span className="text-sm">{MEDAL[i]}</span>
              <div
                className={`w-7 h-7 rounded-full ${COLORS[i]} flex items-center justify-center text-white text-[10px] font-bold shadow-sm shrink-0 overflow-hidden`}
              >
                {entry.photoURL ? (
                  <img src={entry.photoURL} alt="" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  entry.displayName?.[0] || "?"
                )}
              </div>
              <span className="text-xs font-bold text-foreground truncate flex-1">
                {entry.uid === user?.uid ? "Bạn" : entry.displayName}
              </span>
              <span className="text-[11px] font-extrabold text-accent">{entry.xp} XP</span>
            </div>
          ))}

          {/* Show current user if not in top 3 */}
          {user && myRank < 0 && (
            <div className="flex items-center gap-2.5 bg-primary/10 rounded-xl px-3 py-2 border border-primary/20">
              <span className="text-xs font-bold text-muted-foreground w-4 text-center">—</span>
              <div className="w-7 h-7 rounded-full gradient-purple-card flex items-center justify-center text-white text-[10px] font-bold shadow-sm shrink-0 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  (user.displayName?.[0] || "?")
                )}
              </div>
              <span className="text-xs font-bold text-primary truncate flex-1">Bạn</span>
              <span className="text-[11px] font-extrabold text-primary">{myXP} XP</span>
            </div>
          )}
          {user && myRank >= 3 && (
            <div className="flex items-center gap-2.5 bg-primary/10 rounded-xl px-3 py-2 border border-primary/20">
              <span className="text-xs font-bold text-muted-foreground w-4 text-center">#{myRank + 1}</span>
              <div className="w-7 h-7 rounded-full gradient-purple-card flex items-center justify-center text-white text-[10px] font-bold shadow-sm shrink-0 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  (user.displayName?.[0] || "?")
                )}
              </div>
              <span className="text-xs font-bold text-primary truncate flex-1">Bạn</span>
              <span className="text-[11px] font-extrabold text-primary">{myXP} XP</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default Leaderboard;
