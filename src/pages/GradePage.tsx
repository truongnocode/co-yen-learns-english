import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Zap, FileText, ClipboardList, Home, GraduationCap } from "lucide-react";
import { gradeConfig, type SGKData } from "@/data/types";
import { loadSGKData } from "@/data/loader";
import PageShell from "@/components/PageShell";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

const GradePage = () => {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const grade = Number(gradeId);
  const cfg = gradeConfig[grade];
  const [data, setData] = useState<SGKData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (grade >= 6 && grade <= 9) {
      navigate("/dashboard", { replace: true });
      return;
    }
    setLoading(false);
  }, [grade, navigate]);

  if (!cfg) {
    return (
      <PageShell>
        <div className="flex items-center justify-center pt-40 text-muted-foreground">Không tìm thấy lớp này.</div>
      </PageShell>
    );
  }

  const isGrade10 = grade === 10;

  const grade10Sections = [
    { key: "vocab", label: "Từ vựng", desc: "11 chủ đề từ vựng trọng tâm", icon: BookOpen, gradient: "gradient-primary" },
    { key: "grammar", label: "Ngữ pháp", desc: "9 chủ đề ngữ pháp cốt lõi", icon: Zap, gradient: "gradient-cool" },
    { key: "exercises", label: "Đọc hiểu & Viết", desc: "7 dạng bài luyện kỹ năng", icon: FileText, gradient: "gradient-accent" },
    { key: "tests", label: "Đề thi thử", desc: "15 đề thi vào 10 có chấm điểm", icon: ClipboardList, gradient: "gradient-orange-card" },
  ];

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-5 pt-28 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/dashboard")}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
            <Home className="h-5 w-5" />
          </motion.button>
          <button onClick={() => navigate("/grades")} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Chọn lớp khác
          </button>
        </div>

        {/* Hero banner for Grade 10 */}
        {isGrade10 && (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={smooth}
            className="relative rounded-3xl overflow-hidden shadow-xl mb-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(215,70%,25%)] via-[hsl(205,65%,35%)] to-[hsl(195,65%,45%)]" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
            <div className="relative z-10 p-8">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-3">
                <GraduationCap className="h-4 w-4 text-white" />
                <span className="text-xs font-extrabold text-white uppercase tracking-wider">Ôn thi vào THPT</span>
              </div>
              <h1 className="font-display font-extrabold text-3xl text-white mb-2">Chinh phục kỳ thi vào lớp 10 🏆</h1>
              <p className="text-white/75 text-sm max-w-lg">Hệ thống ôn luyện toàn diện: từ vựng, ngữ pháp, đọc hiểu, viết và đề thi thử có chấm điểm.</p>
            </div>
          </motion.div>
        )}

        {!isGrade10 && (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={smooth}
            className={`bg-gradient-to-r ${cfg.gradient} text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl mb-8`}
          >
            <div className="absolute top-4 right-6 w-20 h-20 rounded-full bg-white/10 float-animation" />
            <span className="text-4xl">{cfg.emoji}</span>
            <h1 className="font-display font-extrabold text-3xl mt-2">{cfg.label}</h1>
            <p className="text-white/80 text-sm">
              {data ? `${Object.keys(data.units).length} bài học · SGK Global Success` : "..."}
            </p>
          </motion.div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-5 pb-20">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        ) : isGrade10 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {grade10Sections.map((sec, i) => (
              <motion.button
                key={sec.key}
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ ...smooth, delay: 0.1 + i * 0.08 }}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/grade/10/${sec.key}`)}
                className={`${sec.gradient} text-white rounded-3xl p-6 text-left relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-500`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
                <sec.icon className="h-8 w-8 mb-3 opacity-80 relative z-10" />
                <h3 className="font-display font-extrabold text-xl mb-1 relative z-10">{sec.label}</h3>
                <p className="text-white/70 text-sm relative z-10">{sec.desc}</p>
              </motion.button>
            ))}
          </div>
        ) : data ? (
          <div className="flex flex-col gap-4">
            {Object.entries(data.units).map(([unitKey, unit], i) => (
              <motion.div key={unitKey}
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ ...smooth, delay: 0.1 + i * 0.05 }}
                className="bg-card/80 backdrop-blur-xl rounded-3xl p-5 shadow-lg border border-border/30 hover:shadow-xl transition-shadow duration-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-foreground">Unit {unitKey}</h3>
                    <p className="text-sm text-muted-foreground">{unit.title}</p>
                  </div>
                  <span className="text-xs gradient-primary text-white px-3 py-1.5 rounded-full font-bold shadow-sm">
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
    </PageShell>
  );
};

export default GradePage;
