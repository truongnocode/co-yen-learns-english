import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SUPPORTED_GRADES, gradeConfig } from "@/data/types";
import Navbar from "@/components/Navbar";

const GradesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="max-w-5xl mx-auto px-5 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Trang chủ
          </button>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-foreground">🎒 Chọn lớp của em</h1>
          <p className="text-muted-foreground mt-2">Chọn lớp để bắt đầu ôn luyện từ vựng và ngữ pháp</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {SUPPORTED_GRADES.map((grade, i) => {
            const cfg = gradeConfig[grade];
            return (
              <motion.button
                key={grade}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
                whileHover={{ scale: 1.06, y: -6 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(`/grade/${grade}`)}
                className={`bg-gradient-to-br ${cfg.gradient} text-white rounded-3xl p-6 flex flex-col items-center gap-2 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shimmer rounded-3xl" />
                <span className="text-4xl relative z-10 drop-shadow">{cfg.emoji}</span>
                <span className="font-display font-bold text-lg relative z-10">{cfg.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GradesPage;
