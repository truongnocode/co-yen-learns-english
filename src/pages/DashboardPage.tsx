import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getProgress, type UserProgress } from "@/lib/progress";
import { checkAndUpdateStreak } from "@/lib/daily";
import GradeSelectDialog from "@/components/GradeSelectDialog";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardMobileNav from "@/components/dashboard/DashboardMobileNav";
import DailyMission from "@/components/dashboard/DailyMission";
import HeroBanner from "@/components/dashboard/HeroBanner";
import LearningPath from "@/components/dashboard/LearningPath";
import ReviewCorner from "@/components/dashboard/ReviewCorner";
import LearningOverview from "@/components/dashboard/LearningOverview";
import Leaderboard from "@/components/dashboard/Leaderboard";
import PetWidget from "@/components/dashboard/PetWidget";

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
      // Check and update daily streak
      const { streak } = await checkAndUpdateStreak(user.uid, p);
      setProgress({ ...p, dailyStreak: streak, lastActiveDate: new Date().toISOString().slice(0, 10) });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

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
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Animated background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 25, 0], y: [0, -15, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-[hsl(215,50%,92%)] blur-[180px] opacity-50"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[hsl(14,50%,92%)] blur-[160px] opacity-40"
        />
      </div>

      <div className="flex min-h-svh">
        <DashboardSidebar progress={progress} />

        {/* Middle column: Hero + Learning Path. The fixed-height, internally-scrolling
            app-shell only kicks in at lg+; on phones it's a normal flowing page. */}
        <main className="flex-1 min-w-0 px-4 py-6 sm:px-5 lg:px-6 lg:py-8 lg:flex lg:flex-col lg:max-h-screen">
          <DashboardMobileNav />

          <div className="shrink-0">
            <HeroBanner progress={progress} />
          </div>
          <div className="mt-6 lg:flex-1 lg:overflow-y-auto lg:min-h-0 lg:pr-1">
            <LearningPath progress={progress} />

            {/* Phones/tablets: surface the sidebar + right-column widgets inline
                (they're hidden until the real sidebars appear at lg / xl). */}
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:hidden">
              <div className="lg:hidden sm:col-span-2">
                <DailyMission progress={progress} />
              </div>
              <LearningOverview progress={progress} />
              <ReviewCorner />
              <Leaderboard progress={progress} />
              <PetWidget />
            </div>

            <div className="h-10" />
          </div>
        </main>

        {/* Right column: Header stats + Overview + Review */}
        <aside className="hidden xl:flex flex-col w-80 shrink-0 py-6 pr-5 gap-6 overflow-y-auto max-h-screen sticky top-0">
          <LearningOverview progress={progress} />
          <ReviewCorner />
          <Leaderboard progress={progress} />
          <PetWidget />
        </aside>
      </div>

      <GradeSelectDialog open={showGradeSelect} onSelect={handleGradeSelected} />
    </div>
  );
};

export default DashboardPage;
