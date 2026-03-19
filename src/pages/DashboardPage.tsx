import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, BookOpen, Trophy, Zap, Target, Calendar,
  TrendingUp, CheckCircle2, Clock, Flame, Star,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getProgress, type UserProgress } from "@/lib/progress";
import { gradeConfig } from "@/data/types";
import PageShell from "@/components/PageShell";
import GradeSelectDialog from "@/components/GradeSelectDialog";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, profile, selectGrade } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGradeSelect, setShowGradeSelect] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    getProgress(user.uid).then(setProgress).finally(() => setLoading(false));
  }, [user, navigate]);

  useEffect(() => {
    if (user && profile && !profile.grade) {
      setShowGradeSelect(true);
    }
  }, [user, profile]);

  const handleGradeSelected = async (g: number) => {
    await selectGrade(g);
    setShowGradeSelect(false);
  };

  if (loading || !user) {
    return (
      <PageShell>
        <div className="flex items-center justify-center pt-40">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full" />
        </div>
      </PageShell>
    );
  }

  const grade = profile?.grade || 6;
  const cfg = gradeConfig[grade];
  const recentQuizzes = (progress?.quizHistory || []).slice(-5).reverse();
  const streak = Math.min(progress?.quizzesDone || 0, 7);

  const quickActions = [
    { label: "Từ vựng", icon: BookOpen, gradient: "gradient-purple-card", path: `/grade/${grade}` },
    { label: "Ngữ pháp", icon: Zap, gradient: "gradient-cool", path: `/grade/${grade}` },
    { label: "Bài tập", icon: Target, gradient: "gradient-accent", path: `/grade/${grade}` },
    { label: "Tiến trình", icon: Trophy, gradient: "gradient-energy", path: "/progress" },
  ];

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-5 pt-28 pb-20">
        {/* Welcome Header */}
        <motion.div initial={{ opacity: 0, y: 30, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={smooth} className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <img src={user.photoURL || ""} alt="Avatar"
              className="w-14 h-14 rounded-2xl border-3 border-primary/30 object-cover shadow-lg" referrerPolicy="no-referrer" />
            <div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">
                Xin chào, {user.displayName?.split(" ").pop()}! 👋
              </h1>
              <p className="text-muted-foreground font-medium text-sm">
                {cfg.emoji} {cfg.label} · Hôm nay em học gì nhỉ?
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div initial={{ opacity: 0, y: 30, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ ...smooth, delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Từ đã học", value: progress?.wordsLearned.length || 0, icon: BookOpen, color: "text-primary" },
            { label: "Bài đã làm", value: progress?.quizzesDone || 0, icon: CheckCircle2, color: "text-success" },
            { label: "Điểm cao nhất", value: `${progress?.highScore || 0}%`, icon: TrendingUp, color: "text-accent" },
            { label: "Chuỗi ngày", value: `${streak} 🔥`, icon: Flame, color: "text-pink" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ ...smooth, delay: 0.15 + i * 0.05 }}
              className="bg-card/80 backdrop-blur-xl rounded-2xl p-4 border border-white/60 shadow-md">
              <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
              <div className="font-display font-extrabold text-2xl text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 30, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ ...smooth, delay: 0.2 }} className="mb-8">
          <h2 className="font-display font-extrabold text-lg text-foreground mb-4">⚡ Học nhanh</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <motion.button key={action.label} whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate(action.path)}
                className={`${action.gradient} text-white rounded-2xl p-5 flex flex-col items-center gap-2 shadow-lg transition-shadow duration-500 hover:shadow-xl`}>
                <action.icon className="h-6 w-6" />
                <span className="font-display font-bold text-sm">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Tasks */}
          <motion.div initial={{ opacity: 0, y: 30, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ ...smooth, delay: 0.3 }} className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-lg">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h2 className="font-display font-extrabold text-lg text-foreground">📋 Nhiệm vụ hôm nay</h2>
            </div>
            <div className="space-y-3">
              {[
                { task: "Ôn 10 từ vựng mới", done: false, xp: 20 },
                { task: "Làm 1 bài trắc nghiệm ngữ pháp", done: false, xp: 30 },
                { task: "Luyện phát âm 5 từ", done: false, xp: 15 },
              ].map((item, i) => (
                <motion.div key={i} whileHover={{ x: 4 }}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors ${item.done ? "bg-success/10" : "bg-muted/50 hover:bg-muted/80"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.done ? "bg-success border-success" : "border-muted-foreground/30"}`}>
                      {item.done && <CheckCircle2 className="h-4 w-4 text-white" />}
                    </div>
                    <span className={`text-sm font-medium ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.task}</span>
                  </div>
                  <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-full">+{item.xp} XP</span>
                </motion.div>
              ))}
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/grade/${grade}`)}
              className="mt-5 w-full gradient-warm text-white rounded-xl py-3 font-display font-bold text-sm shadow-md">
              🚀 Bắt đầu làm nhiệm vụ
            </motion.button>
          </motion.div>

          {/* Recent Activity */}
          <motion.div initial={{ opacity: 0, y: 30, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ ...smooth, delay: 0.35 }} className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-lg">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-10 h-10 rounded-xl gradient-cool flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <h2 className="font-display font-extrabold text-lg text-foreground">📊 Lịch sử bài tập</h2>
            </div>
            {recentQuizzes.length === 0 ? (
              <div className="text-center py-8">
                <Star className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm font-medium">Em chưa làm bài nào. Bắt đầu học ngay nhé!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentQuizzes.map((q, i) => {
                  const pct = Math.round((q.score / q.total) * 100);
                  const isGood = pct >= 70;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${isGood ? "gradient-success" : "gradient-warm"}`}>{pct}%</div>
                        <div>
                          <span className="text-sm font-bold text-foreground">Lớp {q.grade} · Unit {q.unit}</span>
                          <p className="text-xs text-muted-foreground">{q.score}/{q.total} câu đúng</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(q.date).toLocaleDateString("vi-VN")}</span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Learning Path */}
        <motion.div initial={{ opacity: 0, y: 30, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ ...smooth, delay: 0.4 }} className="mt-8 bg-card/80 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-purple-card flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h2 className="font-display font-extrabold text-lg text-foreground">🗺️ Lộ trình học tập</h2>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(`/grade/${grade}`)}
              className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((unit) => {
              const isDone = (progress?.quizHistory || []).some((q) => q.unit === String(unit) && q.grade === grade);
              return (
                <motion.button key={unit} whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/grade/${grade}`)}
                  className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all duration-300 ${
                    isDone ? "gradient-success text-white border-transparent shadow-md"
                      : "bg-muted/50 text-muted-foreground border-transparent hover:border-primary/30 hover:bg-primary/5"
                  }`}>
                  {isDone ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-lg">📖</span>}
                  <span className="text-xs font-bold">Unit {unit}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      <GradeSelectDialog open={showGradeSelect} onSelect={handleGradeSelected} />
    </PageShell>
  );
};

export default DashboardPage;
