import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Zap, FileText, ClipboardList, Home, GraduationCap, Camera, PenLine, Sparkles } from "lucide-react";
import { gradeConfig, type SGKData } from "@/data/types";
import PageShell from "@/components/PageShell";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

const GradePage = () => {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const grade = Number(gradeId);
  const cfg = gradeConfig[grade];
  const [data] = useState<SGKData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (grade >= 3 && grade <= 9) {
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
    { key: "vocab", label: "Từ vựng", desc: "11 chủ đề từ vựng trọng tâm", icon: BookOpen, fill: "bg-primary text-primary-foreground" },
    { key: "grammar", label: "Ngữ pháp", desc: "9 chủ đề ngữ pháp cốt lõi", icon: Zap, fill: "bg-accent2 text-accent2-foreground" },
    { key: "exercises", label: "Đọc hiểu", desc: "7 dạng bài luyện kỹ năng", icon: FileText, fill: "bg-success text-success-foreground" },
    { key: "writing", label: "Viết", desc: "Sắp xếp câu, viết lại, thư/đoạn văn", icon: PenLine, fill: "bg-accent2 text-accent2-foreground" },
    { key: "tests", label: "Đề thi thử", desc: "15 đề thi vào 10 có chấm điểm", icon: ClipboardList, fill: "bg-accent text-accent-foreground" },
  ];

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-5 pt-28 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/dashboard")}
            className="p-2.5 rounded-xl bg-card shadow-1 text-foreground border border-border">
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
            className="relative rounded-2xl overflow-hidden bg-primary text-primary-foreground shadow-2 mb-8"
          >
            <div className="relative z-10 p-8">
              <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 mb-3">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
                <span className="text-xs font-extrabold text-primary-foreground uppercase tracking-wider">Ôn thi vào THPT</span>
              </div>
              <h1 className="font-display font-extrabold text-3xl text-primary-foreground mb-2">Chinh phục kỳ thi vào lớp 10 🏆</h1>
              <p className="text-primary-foreground/80 text-sm max-w-lg">Hệ thống ôn luyện toàn diện: từ vựng, ngữ pháp, đọc hiểu, viết và đề thi thử có chấm điểm.</p>
            </div>
          </motion.div>
        )}

        {!isGrade10 && (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={smooth}
            className="bg-primary text-primary-foreground rounded-2xl p-4 sm:p-8 relative overflow-hidden shadow-2 mb-8"
          >
            <span className="text-4xl">{cfg.emoji}</span>
            <h1 className="font-display font-extrabold text-3xl mt-2">{cfg.label}</h1>
            <p className="text-primary-foreground/80 text-sm">
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
          <>
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
                className={`${sec.fill} rounded-2xl p-6 text-left relative overflow-hidden shadow-1 hover:shadow-2 transition-shadow duration-500`}
              >
                <sec.icon className="h-8 w-8 mb-3 opacity-80 relative z-10" />
                <h3 className="font-display font-extrabold text-xl mb-1 relative z-10">{sec.label}</h3>
                <p className="text-sm opacity-80 relative z-10">{sec.desc}</p>
              </motion.button>
            ))}
          </div>

          {/* 25 Đề Dự Đoán Ninh Bình — featured collection */}
          <motion.button
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ ...smooth, delay: 0.45 }}
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/grade/10/tests/du-doan-ninh-binh")}
            className="w-full mt-4 relative rounded-2xl overflow-hidden bg-accent text-accent-foreground shadow-1 hover:shadow-2 transition-shadow duration-500 text-left"
          >
            <div className="relative z-10 p-6 flex items-center gap-5">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-extrabold text-xl text-accent-foreground">25 Đề Dự Đoán Vào 10 Ninh Bình</h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-accent-foreground px-2 py-0.5 rounded-full">New</span>
                </div>
                <p className="text-accent-foreground/80 text-sm">Ms Mai Phương · Năm học 2026-2027 · 17 đề đã ra mắt</p>
              </div>
              <ArrowLeft className="h-5 w-5 text-accent-foreground/60 rotate-180 flex-shrink-0" />
            </div>
          </motion.button>

          {/* Camera tương tác — full-width highlight card */}
          <motion.button
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ ...smooth, delay: 0.5 }}
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/grade/${grade}/camera`)}
            className="w-full mt-4 relative rounded-2xl overflow-hidden bg-accent2 text-accent2-foreground shadow-1 hover:shadow-2 transition-shadow duration-500 text-left"
          >
            <div className="relative z-10 p-6 flex items-center gap-5">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                <Camera className="h-7 w-7 text-accent2-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-extrabold text-xl text-accent2-foreground">Camera tương tác</h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-accent2-foreground px-2 py-0.5 rounded-full">New</span>
                </div>
                <p className="text-accent2-foreground/80 text-sm">Trả lời câu hỏi bằng cử chỉ cơ thể qua webcam — vừa học vừa vận động!</p>
              </div>
              <ArrowLeft className="h-5 w-5 text-accent2-foreground/60 rotate-180 flex-shrink-0" />
            </div>
          </motion.button>
          </>
        ) : data ? (
          <div className="flex flex-col gap-4">
            {Object.entries(data.units).map(([unitKey, unit], i) => (
              <motion.div key={unitKey}
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ ...smooth, delay: 0.1 + i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-5 shadow-1 transition-all hover:-translate-y-0.5 hover:shadow-2 duration-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-foreground">Unit {unitKey}</h3>
                    <p className="text-sm text-muted-foreground">{unit.title}</p>
                  </div>
                  <span className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-bold">
                    {unit.vocabulary.length} từ
                  </span>
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(`/grade/${grade}/vocab/${unitKey}`)}
                    className="bg-accent text-accent-foreground flex-1 min-w-0 rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5 text-xs font-bold font-display shadow-1 break-words">
                    <BookOpen className="h-5 w-5" /> Từ vựng
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(`/grade/${grade}/grammar/${unitKey}`)}
                    className="bg-primary text-primary-foreground flex-1 min-w-0 rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5 text-xs font-bold font-display shadow-1 break-words">
                    <Zap className="h-5 w-5" /> Ngữ pháp
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(`/grade/${grade}/exercises/${unitKey}`)}
                    className="bg-success text-success-foreground flex-1 min-w-0 rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5 text-xs font-bold font-display shadow-1 break-words">
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
