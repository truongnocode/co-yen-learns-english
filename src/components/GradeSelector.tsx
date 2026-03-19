import { motion } from "framer-motion";
import { gradesData, getGradeStyle } from "@/data/vocabulary";
import { useNavigate } from "react-router-dom";

const GradeSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-3">
      {gradesData.map((g, i) => {
        const style = getGradeStyle(g.grade);
        return (
          <motion.button
            key={g.grade}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => navigate(`/grade/${g.grade}`)}
            className={`${style.bg} ${style.text} rounded-2xl p-4 flex flex-col items-center gap-1 shadow-card hover:shadow-card-hover transition-shadow`}
          >
            <span className="text-2xl">{style.emoji}</span>
            <span className="font-display font-bold text-sm">{g.label}</span>
            <span className="text-[10px] opacity-70">{g.units.length} unit</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default GradeSelector;
