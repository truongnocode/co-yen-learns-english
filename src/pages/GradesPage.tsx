import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SUPPORTED_GRADES, gradeConfig } from "@/data/types";
import { useAuth } from "@/contexts/AuthContext";
import PageShell from "@/components/PageShell";

const PRIMARY_GRADES = SUPPORTED_GRADES.filter(g => g >= 3 && g <= 5);
const SECONDARY_GRADES = SUPPORTED_GRADES.filter(g => g >= 6 && g <= 9);

const GradesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const level = searchParams.get("level"); // "primary" | "secondary" | null

  useEffect(() => {
    if (user && profile?.grade) {
      navigate(`/grade/${profile.grade}`, { replace: true });
    }
  }, [user, profile, navigate]);

  const renderGradeGrid = (grades: readonly number[], delay = 0) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {grades.map((grade, i) => {
        const cfg = gradeConfig[grade];
        return (
          <motion.button
            key={grade}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + i * 0.05, type: "spring", stiffness: 300 }}
            whileHover={{ scale: 1.06, y: -6 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate(`/grade/${grade}`)}
            className="bg-card border border-border text-foreground rounded-2xl p-6 flex flex-col items-center gap-2 shadow-1 hover:shadow-2 transition-shadow"
          >
            <span className="text-4xl">{cfg.emoji}</span>
            <span className="font-display font-bold text-lg">{cfg.label}</span>
          </motion.button>
        );
      })}
    </div>
  );

  const showPrimary = !level || level === "primary";
  const showSecondary = !level || level === "secondary";

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-5 pt-28 pb-20">
        <div className="mb-8">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Trang chủ
          </button>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-foreground">🎒 Chọn lớp của em</h1>
          <p className="text-muted-foreground mt-2">Chọn lớp để bắt đầu ôn luyện từ vựng và ngữ pháp</p>
        </div>

        {/* Level filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => navigate("/grades")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${!level ? "bg-primary text-primary-foreground shadow-1" : "bg-card text-muted-foreground hover:text-foreground border border-border"}`}
          >
            Tất cả
          </button>
          <button
            onClick={() => navigate("/grades?level=primary")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${level === "primary" ? "bg-accent text-accent-foreground shadow-1" : "bg-card text-muted-foreground hover:text-foreground border border-border"}`}
          >
            Cấp 1 (Lớp 3-5)
          </button>
          <button
            onClick={() => navigate("/grades?level=secondary")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${level === "secondary" ? "bg-accent2 text-accent2-foreground shadow-1" : "bg-card text-muted-foreground hover:text-foreground border border-border"}`}
          >
            Cấp 2 (Lớp 6-9)
          </button>
        </div>

        {/* Primary school */}
        {showPrimary && (
          <div className="mb-8">
            <h2 className="font-display font-bold text-lg text-foreground mb-3 flex items-center gap-2">
              🌈 Cấp 1 — Tiểu học
              <span className="text-xs font-normal text-muted-foreground">(iLearn Smart Start)</span>
            </h2>
            {renderGradeGrid(PRIMARY_GRADES)}
          </div>
        )}

        {/* Secondary school */}
        {showSecondary && (
          <div className="mb-8">
            <h2 className="font-display font-bold text-lg text-foreground mb-3 flex items-center gap-2">
              🎓 Cấp 2 — THCS
              <span className="text-xs font-normal text-muted-foreground">(SGK Global Success)</span>
            </h2>
            {renderGradeGrid(SECONDARY_GRADES, 0.15)}
          </div>
        )}

        {/* Grade 10 */}
        {!level && (
          <div>
            <h2 className="font-display font-bold text-lg text-foreground mb-3 flex items-center gap-2">
              👑 Ôn thi vào lớp 10
            </h2>
            {renderGradeGrid([10], 0.3)}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default GradesPage;
