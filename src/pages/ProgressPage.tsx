import { motion } from "framer-motion";
import { Trophy, BookOpen, Target, TrendingUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { getProgress, type UserProgress } from "@/lib/progress";
import PageShell from "@/components/PageShell";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

const ProgressPage = () => {
  const { user, profile, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    if (user) getProgress(user.uid).then(setProgress);
    else setProgress(null);
  }, [user]);

  const stats = [
    { icon: BookOpen, label: "Từ đã học", value: progress ? String(progress.wordsLearned.length) : "0", gradient: "gradient-purple-card" },
    { icon: Target, label: "Quiz xong", value: progress ? String(progress.quizzesDone) : "0", gradient: "gradient-success" },
    { icon: Trophy, label: "Điểm cao", value: progress ? `${progress.highScore}%` : "—", gradient: "gradient-accent" },
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
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg text-center border border-white/60">
            <span className="text-5xl mb-3 block">🚀</span>
            <h3 className="font-display font-extrabold text-xl text-foreground mb-2">Đăng nhập để lưu tiến trình!</h3>
            <p className="text-sm text-muted-foreground mb-6">Đăng nhập bằng Gmail để lưu tiến trình và xem thống kê chi tiết nhé!</p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={signInWithGoogle}
              className="gradient-purple-card text-white rounded-full px-8 py-3 font-display font-extrabold shadow-lg">
              Đăng nhập ngay
            </motion.button>
          </motion.div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ ...smooth, delay: 0.1 }}
              className="grid grid-cols-3 gap-4 mb-8">
              {stats.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...smooth, delay: 0.15 + i * 0.05 }}
                  className="bg-card/80 backdrop-blur-xl rounded-3xl p-5 shadow-lg flex flex-col items-center text-center gap-3 border border-white/60">
                  <div className={`${s.gradient} text-white p-3 rounded-2xl shadow-md`}><s.icon className="h-5 w-5" /></div>
                  <span className="font-display font-extrabold text-2xl text-foreground">{s.value}</span>
                  <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {progress && progress.quizHistory.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ ...smooth, delay: 0.2 }}
                className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/60 mb-8">
                <h3 className="font-display font-extrabold text-lg text-foreground mb-4">📝 Lịch sử làm bài</h3>
                <div className="space-y-3">
                  {progress.quizHistory.slice(-10).reverse().map((h, i) => {
                    const pct = Math.round((h.score / h.total) * 100);
                    const isGood = pct >= 70;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white ${isGood ? "gradient-success" : "gradient-warm"}`}>
                            {pct}%
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">Lớp {h.grade} — Unit {h.unit}</p>
                            <p className="text-xs text-muted-foreground">{new Date(h.date).toLocaleDateString("vi-VN")}</p>
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
                className="w-full gradient-purple-card text-white rounded-2xl py-4 font-display font-extrabold text-center shadow-lg inline-flex items-center justify-center gap-2"
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
