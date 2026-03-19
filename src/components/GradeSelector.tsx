import { motion } from "framer-motion";
import { gradesData, getGradeStyle } from "@/data/vocabulary";
import { useNavigate } from "react-router-dom";

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

const GradeSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {gradesData.map((g, i) => {
        const style = getGradeStyle(g.grade);
        const gradient = gradeGradients[g.grade] || "from-primary to-primary-glow";
        return (
          <motion.button
            key={g.grade}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 400, damping: 15 }}
            whileHover={{ scale: 1.08, y: -4 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`/grade/${g.grade}`)}
            className={`bg-gradient-to-br ${gradient} text-white rounded-2xl p-4 flex flex-col items-center gap-1.5 shadow-card hover:shadow-card-hover transition-shadow relative overflow-hidden group`}
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shimmer rounded-2xl" />
            <span className="text-3xl relative z-10 drop-shadow-sm">{style.emoji}</span>
            <span className="font-display font-bold text-sm relative z-10 drop-shadow-sm">{g.label}</span>
            <span className="text-[10px] opacity-80 relative z-10">{g.units.length} unit</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default GradeSelector;
