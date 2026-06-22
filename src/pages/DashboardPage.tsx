import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getProgress, type UserProgress } from "@/lib/progress";
import { checkAndUpdateStreak } from "@/lib/daily";
import GradeSelectDialog from "@/components/GradeSelectDialog";
import AppNav from "@/components/AppNav";
import DailyMission from "@/components/dashboard/DailyMission";
import LearningPath from "@/components/dashboard/LearningPath";
import ReviewCorner from "@/components/dashboard/ReviewCorner";
import LearningOverview from "@/components/dashboard/LearningOverview";
import Leaderboard from "@/components/dashboard/Leaderboard";
import PetWidget from "@/components/dashboard/PetWidget";
import bearUrl from "@/assets/emoji/bear.png";

const smooth = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, profile, selectGrade, loading: authLoading } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGradeSelect, setShowGradeSelect] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/"); return; }
    getProgress(user.uid).then(async (p) => {
      const { streak } = await checkAndUpdateStreak(user.uid, p);
      setProgress({ ...p, dailyStreak: streak, lastActiveDate: new Date().toISOString().slice(0, 10) });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && profile && !profile.grade) setShowGradeSelect(true);
  }, [user, profile]);

  const handleGradeSelected = async (g: number) => {
    await selectGrade(g);
    setShowGradeSelect(false);
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 rounded-full border-[3px] border-primary border-t-transparent"
        />
      </div>
    );
  }

  const firstName = user.displayName?.split(" ")[0]?.trim() || "bạn nhỏ";

  return (
    <div className="relative min-h-svh bg-background pb-[76px] md:pb-0">
      <AppNav />

      <main className="mx-auto max-w-6xl px-4 pb-10 pt-24 sm:px-6 sm:pt-28">
        {/* Greeting with mascot */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={smooth}
          className="mb-6 flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-1 sm:p-6"
        >
          <img src={bearUrl} alt="" className="h-16 w-16 shrink-0 drop-shadow-sm sm:h-20 sm:w-20" />
          <div className="min-w-0">
            <h1 className="font-display text-fluid-h1 font-extrabold text-foreground">Chào {firstName}!</h1>
            <p className="mt-1 font-medium text-muted-foreground">Hôm nay mình học gì nào?</p>
          </div>
        </motion.div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <DailyMission progress={progress} />
            <LearningPath progress={progress} />
          </div>
          <div className="space-y-5">
            <LearningOverview progress={progress} />
            <ReviewCorner />
            <Leaderboard progress={progress} />
            <PetWidget />
          </div>
        </div>
      </main>

      <GradeSelectDialog open={showGradeSelect} onSelect={handleGradeSelected} />
    </div>
  );
};

export default DashboardPage;
