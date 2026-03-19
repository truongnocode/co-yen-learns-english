import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { gradesData, getGradeStyle } from "@/data/vocabulary";
import Navbar from "@/components/Navbar";

const gradeGradients: Record<number, string> = {
  1: "from-pink-400 to-rose-500",
  2: "from-rose-400 to-red-500",
  3: "from-orange-400 to-amber-500",
  4: "from-amber-400 to-yellow-500",
  5: "from-yellow-400 to-lime-500",
  6: "from-cyan-400 to-blue-500",
  7: "from-blue-400 to-indigo-500",
  8: "from-indigo-400 to-violet-500",
  9: "from-violet-400 to-purple-500",
};

const GradesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />

      <div className="max-w-5xl mx-auto px-5 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Trang chủ
          </button>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-foreground">
            🎒 Chọn lớp của em
          </h1>
          <p className="text-muted-foreground mt-2">Chọn lớp để bắt đầu ôn luyện từ vựng và ngữ pháp</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {gradesData.map((g, i) => {
            const style = getGradeStyle(g.grade);
            const gradient = gradeGradients[g.grade] || "from-primary to-primary-glow";
            return (
              <motion.button
                key={g.grade}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
                whileHover={{ scale: 1.06, y: -6 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(`/grade/${g.grade}`)}
                className={`bg-gradient-to-br ${gradient} text-white rounded-3xl p-6 flex flex-col items-center gap-2 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shimmer rounded-3xl" />
                <span className="text-4xl relative z-10 drop-shadow">{style.emoji}</span>
                <span className="font-display font-bold text-lg relative z-10">{g.label}</span>
                <span className="text-xs opacity-80 relative z-10">{g.units.length} bài học</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GradesPage;
