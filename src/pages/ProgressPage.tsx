import { motion } from "framer-motion";
import { Trophy, BookOpen, Target, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { getProgress, type UserProgress } from "@/lib/progress";
import PageShell from "@/components/PageShell";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

const ProgressPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    if (user) getProgress(user.uid).then(setProgress);
    else setProgress(null);
  }, [user]);

  const stats = [
    { icon: BookOpen, label: "Từ đã học", value: progress ? String(progress.wordsLearned.length) : "0", fill: "bg-accent2 text-accent2-foreground" },
    { icon: Target, label: "Quiz xong", value: progress ? String(progress.quizzesDone) : "0", fill: "bg-success text-success-foreground" },
    { icon: Trophy, label: "Điểm cao", value: progress ? `${progress.highScore}%` : "—", fill: "bg-accent text-accent-foreground" },
  ];

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={smooth}>
          <h1 className="font-display font-extrabold text-3xl text-foreground mb-2">📊 Tiến trình của em</h1>
          <p className="text-muted-foreground mb-8">Theo dõi quá trình học tập</p>
        </motion.div>

        {!user ? (
          <motion.div initial={{ opacity: 0, y: 20, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ ...smooth, delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-8 shadow-1 text-center">
            <span className="text-5xl mb-3 block">🚀</span>
            <h3 className="font-display font-extrabold text-xl text-foreground mb-2">Đang chuẩn bị tiến trình</h3>
            <p className="text-sm text-muted-foreground">Hệ thống sẽ tự lưu tiến trình trên thiết bị này.</p>
          </motion.div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ ...smooth, delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
              {stats.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...smooth, delay: 0.15 + i * 0.05 }}
                  className="bg-card border border-border rounded-2xl p-5 shadow-1 flex flex-col items-center text-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-2">
                  <div className={`${s.fill} p-3 rounded-2xl shadow-1`}><s.icon className="h-5 w-5" /></div>
                  <span className="font-display font-extrabold text-2xl text-foreground">{s.value}</span>
                  <span className="text-sm text-muted-foreground font-medium">{s.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {progress && progress.quizHistory.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ ...smooth, delay: 0.2 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-1 mb-8">
                <h3 className="font-display font-extrabold text-lg text-foreground mb-4">📝 Lịch sử làm bài</h3>
                <div className="space-y-3">
                  {progress.quizHistory.slice(-10).reverse().map((h, i) => {
                    const pct = Math.round((h.score / h.total) * 100);
                    const isGood = pct >= 70;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="flex items-center justify-between p-3 bg-muted/40 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${isGood ? "bg-success text-success-foreground" : "bg-accent text-accent-foreground"}`}>
                            {pct}%
                          </div>
                          <div>
                            <p className="text-base font-bold text-foreground">Lớp {h.grade} — Unit {h.unit}</p>
                            <p className="text-sm text-muted-foreground">{new Date(h.date).toLocaleDateString("vi-VN")}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-muted-foreground">{h.score}/{h.total}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {profile?.grade && (
              <motion.button
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ ...smooth, delay: 0.3 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/grade/${profile.grade}`)}
                className="w-full bg-accent2 text-accent2-foreground rounded-2xl py-4 font-display font-extrabold text-center shadow-1 btn-press inline-flex items-center justify-center gap-2"
              >
                Tiếp tục học <ArrowRight className="h-5 w-5" />
              </motion.button>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
};

export default ProgressPage;
