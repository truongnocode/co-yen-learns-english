import { useParams, useNavigate } from "react-router-dom";
import { gradesData, getGradeStyle } from "@/data/vocabulary";
import UnitCard from "@/components/UnitCard";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

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

const GradePage = () => {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const grade = Number(gradeId);
  const data = gradesData.find((g) => g.grade === grade);
  const style = getGradeStyle(grade);
  const gradient = gradeGradients[grade] || "from-primary to-primary-glow";

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Không tìm thấy dữ liệu lớp này.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 overflow-hidden">
      <div className={`bg-gradient-to-br ${gradient} text-white px-5 pt-12 pb-8 rounded-b-[2.5rem] relative overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute top-4 right-6 w-20 h-20 rounded-full bg-white/10 float-animation" />
        <div className="absolute bottom-2 right-20 w-10 h-10 rounded-full bg-white/15 float-animation-delay" />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 relative z-10">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/")}
            className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div>
            <h1 className="font-display font-bold text-2xl">
              {style.emoji} {data.label}
            </h1>
            <p className="text-sm opacity-80">{data.units.length} bài học</p>
          </div>
        </motion.div>
      </div>

      <div className="px-5 mt-6 flex flex-col gap-4">
        {data.units.map((unit, i) => (
          <UnitCard key={unit.id} unit={unit} grade={grade} index={i} />
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default GradePage;
