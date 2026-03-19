import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getProgress, type UserProgress } from "@/lib/progress";
import GradeSelectDialog from "@/components/GradeSelectDialog";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import HeroBanner from "@/components/dashboard/HeroBanner";
import LearningPath from "@/components/dashboard/LearningPath";
import ReviewCorner from "@/components/dashboard/ReviewCorner";
import LearningOverview from "@/components/dashboard/LearningOverview";

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
          className="absolute top-[-20%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-[hsl(270,70%,93%)] blur-[180px] opacity-50"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[hsl(335,70%,93%)] blur-[160px] opacity-40"
        />
      </div>

      <div className="flex min-h-screen">
        <DashboardSidebar />

        <main className="flex-1 px-5 lg:px-8 py-6 lg:py-8 overflow-y-auto">
          <DashboardHeader progress={progress} />
          <HeroBanner />

          {/* Learning Overview */}
          <LearningOverview progress={progress} />

          {/* Main content: Learning Path + Review Corner */}
          <div className="flex flex-col lg:flex-row gap-8 mt-8">
            <LearningPath progress={progress} />
            <ReviewCorner />
          </div>

          <div className="h-10" />
        </main>
      </div>

      <GradeSelectDialog open={showGradeSelect} onSelect={handleGradeSelected} />
    </div>
  );
};

export default DashboardPage;
