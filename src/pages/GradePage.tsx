import { useParams, useNavigate } from "react-router-dom";
import { gradesData, getGradeStyle } from "@/data/vocabulary";
import UnitCard from "@/components/UnitCard";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const GradePage = () => {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const grade = Number(gradeId);
  const data = gradesData.find((g) => g.grade === grade);
  const style = getGradeStyle(grade);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Không tìm thấy dữ liệu lớp này.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className={`${style.bg} px-5 pt-12 pb-6 rounded-b-[2rem]`}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate("/")} className={`${style.text} p-2 rounded-xl bg-white/50`}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className={`font-display font-bold text-xl ${style.text}`}>
              {style.emoji} {data.label}
            </h1>
            <p className={`text-sm ${style.text} opacity-70`}>{data.units.length} bài học</p>
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
