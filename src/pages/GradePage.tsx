import { useParams, useNavigate } from "react-router-dom";
import { gradesData, getGradeStyle } from "@/data/vocabulary";
import UnitCard from "@/components/UnitCard";
import Navbar from "@/components/Navbar";
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
    <div className="min-h-screen gradient-hero">
      <Navbar />

      {/* Grade header */}
      <div className="max-w-3xl mx-auto px-5 pt-28 pb-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button
            onClick={() => navigate("/grades")}
            className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Chọn lớp
          </button>
          <div className={`bg-gradient-to-r ${gradient} text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden`}>
            <div className="absolute top-4 right-6 w-20 h-20 rounded-full bg-white/10 float-animation" />
            <span className="text-4xl">{style.emoji}</span>
            <h1 className="font-display font-bold text-3xl mt-2">{data.label}</h1>
            <p className="text-white/80 text-sm">{data.units.length} bài học · Từ vựng theo SGK</p>
          </div>
        </motion.div>
      </div>

      <div className="max-w-3xl mx-auto px-5 pb-20 flex flex-col gap-4">
        {data.units.map((unit, i) => (
          <UnitCard key={unit.id} unit={unit} grade={grade} index={i} />
        ))}
      </div>
    </div>
  );
};

export default GradePage;
