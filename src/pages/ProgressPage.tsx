import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Trophy, BookOpen, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { getProgress, type UserProgress } from "@/lib/progress";

const ProgressPage = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    if (user) {
      getProgress(user.uid).then(setProgress);
    } else {
      setProgress(null);
    }
  }, [user]);

  const stats = [
    { icon: BookOpen, label: "Từ đã học", value: progress ? String(progress.wordsLearned.length) : "0", gradient: "gradient-primary" },
    { icon: Target, label: "Quiz xong", value: progress ? String(progress.quizzesDone) : "0", gradient: "gradient-success" },
    { icon: Trophy, label: "Điểm cao", value: progress ? `${progress.highScore}%` : "—", gradient: "gradient-accent" },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-bold text-3xl text-foreground mb-2">📊 Tiến trình của em</h1>
          <p className="text-muted-foreground mb-8">Theo dõi quá trình học tập</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-card rounded-3xl p-5 shadow-lg flex flex-col items-center text-center gap-3 border border-white/50">
              <div className={`${s.gradient} text-white p-3 rounded-2xl shadow-md`}><s.icon className="h-5 w-5" /></div>
              <span className="font-display font-bold text-2xl text-foreground">{s.value}</span>
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Quiz history */}
        {progress && progress.quizHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-card rounded-3xl p-6 shadow-lg border border-white/50 mb-8">
            <h3 className="font-display font-bold text-lg text-foreground mb-4">📝 Lịch sử làm bài</h3>
            <div className="space-y-3">
              {progress.quizHistory.slice(-10).reverse().map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-foreground">Lớp {h.grade} — Unit {h.unit}</p>
                    <p className="text-xs text-muted-foreground">{new Date(h.date).toLocaleDateString("vi-VN")}</p>
                  </div>
                  <span className={`font-display font-bold text-lg ${h.score >= h.total * 0.7 ? "text-emerald-600" : "text-orange-500"}`}>
                    {h.score}/{h.total}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {!user && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-card rounded-3xl p-8 shadow-lg text-center border border-white/50">
            <span className="text-5xl mb-3 block">🚀</span>
            <h3 className="font-display font-bold text-xl text-foreground mb-2">Đăng nhập để lưu tiến trình!</h3>
            <p className="text-sm text-muted-foreground">Đăng nhập bằng Gmail để lưu tiến trình và xem thống kê chi tiết nhé!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProgressPage;
