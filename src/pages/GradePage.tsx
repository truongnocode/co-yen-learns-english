import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Zap, FileText, ClipboardList } from "lucide-react";
import { gradeConfig, type SGKData } from "@/data/types";
import { loadSGKData } from "@/data/loader";
import Navbar from "@/components/Navbar";

const GradePage = () => {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const grade = Number(gradeId);
  const cfg = gradeConfig[grade];
  const [data, setData] = useState<SGKData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (grade >= 6 && grade <= 9) {
      loadSGKData(grade).then(setData).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [grade]);

  if (!cfg) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Không tìm thấy lớp này.</div>;
  }

  const isGrade10 = grade === 10;

  const grade10Sections = [
    { key: "vocab", label: "Từ vựng", desc: "11 chủ đề từ vựng", icon: BookOpen, gradient: "gradient-purple-card" },
    { key: "grammar", label: "Ngữ pháp", desc: "9 chủ đề ngữ pháp", icon: Zap, gradient: "gradient-primary" },
    { key: "exercises", label: "Đọc hiểu & Viết", desc: "Luyện đọc và viết", icon: FileText, gradient: "gradient-accent" },
    { key: "tests", label: "Đề thi thử", desc: "15 đề thi vào 10", icon: ClipboardList, gradient: "gradient-orange-card" },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 pt-28 pb-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button onClick={() => navigate("/grades")} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Chọn lớp
          </button>
          <div className={`bg-gradient-to-r ${cfg.gradient} text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden`}>
            <div className="absolute top-4 right-6 w-20 h-20 rounded-full bg-white/10 float-animation" />
            <span className="text-4xl">{cfg.emoji}</span>
            <h1 className="font-display font-bold text-3xl mt-2">{cfg.label}</h1>
            <p className="text-white/80 text-sm">
              {isGrade10 ? "Ôn thi vào THPT" : `${data ? Object.keys(data.units).length : "..."} bài học · SGK Global Success`}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="max-w-3xl mx-auto px-5 pb-20">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải dữ liệu...</div>
        ) : isGrade10 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {grade10Sections.map((sec, i) => (
              <motion.button
                key={sec.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/grade/10/${sec.key}`)}
                className={`${sec.gradient} text-white rounded-3xl p-6 text-left relative overflow-hidden`}
              >
                <sec.icon className="h-8 w-8 mb-3 opacity-80" />
                <h3 className="font-display font-bold text-xl mb-1">{sec.label}</h3>
                <p className="text-white/70 text-sm">{sec.desc}</p>
              </motion.button>
            ))}
          </div>
        ) : data ? (
          <div className="flex flex-col gap-4">
            {Object.entries(data.units).map(([unitKey, unit], i) => (
              <motion.div
                key={unitKey}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 260 }}
                className="gradient-card rounded-3xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 border border-white/60"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-foreground">Unit {unitKey}</h3>
                    <p className="text-sm text-muted-foreground">{unit.title}</p>
                  </div>
                  <span className="text-xs gradient-primary text-primary-foreground px-3 py-1.5 rounded-full font-bold shadow-sm">
                    {unit.vocabulary.length} từ
                  </span>
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(`/grade/${grade}/vocab/${unitKey}`)}
                    className="gradient-accent text-white flex-1 min-w-[80px] rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5 text-xs font-bold font-display shadow-md">
                    <BookOpen className="h-5 w-5" /> Từ vựng
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(`/grade/${grade}/grammar/${unitKey}`)}
                    className="gradient-primary text-white flex-1 min-w-[80px] rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5 text-xs font-bold font-display shadow-md">
                    <Zap className="h-5 w-5" /> Ngữ pháp
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(`/grade/${grade}/exercises/${unitKey}`)}
                    className="gradient-success text-white flex-1 min-w-[80px] rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5 text-xs font-bold font-display shadow-md">
                    <FileText className="h-5 w-5" /> Bài tập
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default GradePage;
