import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, Brain, MessageCircle, Gift, Pencil, Lock, Star, Play, GraduationCap, ArrowRight, Camera, Gamepad2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { gradeConfig } from "@/data/types";
import { loadSGKData } from "@/data/loader";
import type { SGKUnit } from "@/data/types";
import type { UserProgress } from "@/lib/progress";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

interface Props {
  progress: UserProgress | null;
}

/* Each unit has these lesson stops */
const stopsTemplate = [
  { key: "vocab", label: "TỪ VỰNG", icon: BookOpen, color: "bg-energy text-energy-foreground", ring: "ring-energy" },
  { key: "grammar", label: "NGỮ PHÁP", icon: Brain, color: "bg-primary text-primary-foreground", ring: "ring-primary" },
  { key: "practice", label: "LUYỆN TẬP", icon: MessageCircle, color: "bg-success text-success-foreground", ring: "ring-success" },
  { key: "reward", label: "PHẦN THƯỞNG", icon: Gift, color: "bg-muted text-muted-foreground", ring: "ring-muted" },
  { key: "spelling", label: "CHÍNH TẢ", icon: Pencil, color: "bg-accent text-accent-foreground", ring: "ring-accent" },
];

const LearningPath = ({ progress }: Props) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const grade = profile?.grade || 6;
  const cfg = gradeConfig[grade];

  const [units, setUnits] = useState<{ id: string; data: SGKUnit }[]>([]);

  useEffect(() => {
    if (grade <= 9) {
      loadSGKData(grade).then((d) => {
        const arr = Object.entries(d.units).map(([id, data]) => ({ id, data }));
        setUnits(arr);
      });
    }
  }, [grade]);

  const completedUnits = new Set((progress?.quizHistory || []).map((q) => q.unit));
  const activeUnitRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  // Find the first incomplete unit index
  const activeUnitIdx = units.findIndex((u) => !completedUnits.has(u.id));

  // Auto-scroll to the active unit on first load
  useEffect(() => {
    if (units.length > 0 && activeUnitRef.current && !hasScrolled.current && activeUnitIdx > 0) {
      hasScrolled.current = true;
      setTimeout(() => {
        activeUnitRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 600);
    }
  }, [units, activeUnitIdx]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...smooth, delay: 0.1 }}
      className="flex-1"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-extrabold text-lg text-foreground">
          Lộ trình của em ({cfg.label})
        </h2>
        <button
          onClick={() => navigate(`/grade/${grade}`)}
          className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
        >
          Xem tất cả
        </button>
      </div>

      {/* Games Banner — colorful mini-cards for quick access */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...smooth, delay: 0.02 }}
          className="mb-6 relative rounded-2xl overflow-hidden shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 -translate-x-1/4 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/3 translate-x-1/4 blur-3xl" />
          <div className="relative z-10 px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Gamepad2 className="h-5 w-5 text-white" />
              <h3 className="font-display font-extrabold text-base text-white">Tr&ograve; chơi</h3>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: "Lật Thẻ", emoji: "\uD83C\uDCCF", path: `/practice/flashcard-match/${grade}` },
                { label: "Nghe Tranh", emoji: "\uD83D\uDDBC\uFE0F", path: `/practice/listen-picture/${grade}` },
                { label: "Thú Ảo", emoji: "\uD83D\uDC3E", path: "/pet" },
              ].map((item) => (
                <motion.button
                  key={item.label}
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(item.path)}
                  className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-3 flex flex-col items-center gap-1.5 hover:bg-white/30 transition-colors"
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-white font-display font-bold text-xs">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Camera Interactive Banner — top of path, easy to find */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...smooth, delay: 0.05 }}
        onClick={() => navigate(`/grade/${grade}/camera`)}
        className="mb-6 relative rounded-2xl overflow-hidden cursor-pointer group shadow-xl hover:shadow-2xl transition-shadow duration-500"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 px-5 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shrink-0">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 text-white min-w-0">
            <h3 className="font-display font-extrabold text-base sm:text-lg">Camera tương tác</h3>
            <p className="text-white/75 text-xs mt-0.5">Trả lời bằng cử chỉ cơ thể — giơ tay hoặc nghiêng đầu!</p>
          </div>
          <span className="bg-white text-purple-600 font-display font-extrabold text-xs px-4 py-2 rounded-full shadow-lg inline-flex items-center gap-1.5 shrink-0 group-hover:gap-2.5 transition-all duration-500">
            Vào <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </motion.div>

      <div className="space-y-0">
        {units.map((unit, unitIdx) => {
          const isUnitDone = completedUnits.has(unit.id);
          const prevUnitDone = unitIdx === 0 || completedUnits.has(units[unitIdx - 1].id);
          const isActiveUnit = unitIdx === activeUnitIdx;

          return (
            <div key={unit.id} ref={isActiveUnit ? activeUnitRef : undefined}>
              {/* Unit Banner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...smooth, delay: 0.05 * unitIdx }}
                className="gradient-success rounded-2xl px-6 py-4 mb-6 flex items-center justify-between shadow-lg"
              >
                <div>
                  <h3 className="font-display font-extrabold text-lg text-success-foreground">
                    Unit {unit.id}: {unit.data.title}
                  </h3>
                  <p className="text-success-foreground/80 text-xs font-medium mt-0.5">
                    {unit.data.vocabulary?.length || 0} từ vựng &bull; {unit.data.grammar?.length || 0} chủ điểm ngữ pháp
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/grade/${grade}/vocab/${unit.id}`)}
                  className="bg-success-foreground/20 backdrop-blur-sm text-success-foreground text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-success-foreground/30 transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  LÝ THUYẾT
                </button>
              </motion.div>

              {/* Zigzag stops */}
              <div className="relative pb-8">
                {/* Vertical connector line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 z-0" />

                {stopsTemplate.map((stop, stopIdx) => {
                  const isFirst = stopIdx === 0;
                  const stopDone = isUnitDone;
                  const stopUnlocked = prevUnitDone && (isFirst || stopDone || stopIdx <= 1);
                  const isActive = prevUnitDone && !stopDone && stopIdx === 0;

                  // Seeded pseudo-random zigzag offsets in pixels per unit+stop
                  const seed = (unitIdx * 7 + stopIdx * 13 + 3) % 11;
                  const offsets = [-120, 80, -60, 110, -90, 40, -100, 95, -45, 130, -75];
                  const xPx = offsets[seed];
                  const isLeft = xPx < 0;

                  return (
                    <motion.div
                      key={stop.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...smooth, delay: 0.05 * unitIdx + 0.06 * stopIdx }}
                      className="relative flex items-center justify-center py-5 z-10"
                    >
                      {/* Label - positioned to the side */}
                      <div
                        className={`absolute ${isLeft ? "right-[15%] lg:right-[20%]" : "left-[15%] lg:left-[20%]"} text-xs font-extrabold tracking-wider ${
                          stopUnlocked ? "text-muted-foreground" : "text-muted-foreground/40"
                        }`}
                      >
                        {stop.label}
                      </div>

                      {/* Node */}
                      <motion.div
                        animate={{ x: xPx }}
                        whileHover={stopUnlocked ? { scale: 1.12 } : {}}
                        whileTap={stopUnlocked ? { scale: 0.95 } : {}}
                        onClick={() => {
                          if (!stopUnlocked) return;
                          const u = unit.id;
                          if (stop.key === "vocab") navigate(`/grade/${grade}/vocab/${u}`);
                          else if (stop.key === "grammar") navigate(`/grade/${grade}/grammar/${u}`);
                          else if (stop.key === "practice") navigate(`/grade/${grade}/exercises/${u}`);
                          else if (stop.key === "spelling") navigate(`/grade/${grade}/vocab/${u}`);
                        }}
                        className={`relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-lg ${
                          stopDone
                            ? `${stop.color} ring-4 ${stop.ring}/30`
                            : isActive
                            ? `${stop.color} ring-4 ring-energy/50 animate-pulse`
                            : stopUnlocked
                            ? `${stop.color} ring-2 ${stop.ring}/20`
                            : "bg-muted/60 text-muted-foreground/40 cursor-not-allowed"
                        }`}
                      >
                        {/* Progress ring for active */}
                        {isActive && (
                          <div className="absolute inset-[-6px] rounded-full border-[3px] border-energy/40 border-t-energy animate-spin" style={{ animationDuration: "3s" }} />
                        )}

                        {stopDone ? (
                          <Star className="h-7 w-7 fill-current" />
                        ) : !stopUnlocked ? (
                          <Lock className="h-5 w-5" />
                        ) : (
                          <stop.icon className="h-7 w-7" />
                        )}
                      </motion.div>

                      {/* "BẮT ĐẦU" tooltip for active node */}
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`absolute ${isLeft ? "left-[calc(50%+60px)]" : "right-[calc(50%+60px)]"} bg-card text-foreground font-display font-bold text-sm px-4 py-2 rounded-xl shadow-lg border border-border`}
                        >
                          BẮT ĐẦU
                          {/* Arrow */}
                          <div className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? "-left-2" : "-right-2"} w-0 h-0 border-y-[6px] border-y-transparent ${isLeft ? "border-r-[8px] border-r-card" : "border-l-[8px] border-l-card"}`} />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {units.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-display font-bold">Đang tải lộ trình...</p>
          </div>
        )}

        {/* Grade 10 Exam Prep Banner — shown for grade 9 */}
        {grade === 9 && units.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={smooth}
            onClick={() => navigate("/grade/10")}
            className="mt-8 relative rounded-2xl overflow-hidden cursor-pointer group shadow-xl hover:shadow-2xl transition-shadow duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,85%,50%)] via-[hsl(210,82%,55%)] to-[hsl(200,80%,58%)]" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
            <div className="relative z-10 px-6 py-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shrink-0">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1 text-white min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-white/20 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full">🔥 Quan trọng</span>
                </div>
                <h3 className="font-display font-extrabold text-lg sm:text-xl">Ôn thi vào lớp 10</h3>
                <p className="text-white/75 text-xs sm:text-sm mt-0.5">15 đề thi thử · Từ vựng · Ngữ pháp · Đọc hiểu · Viết</p>
              </div>
              <span className="bg-white text-[hsl(220,85%,50%)] font-display font-extrabold text-xs px-5 py-2.5 rounded-full shadow-lg inline-flex items-center gap-1.5 shrink-0 group-hover:gap-2.5 transition-all duration-500">
                Vào ôn thi <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default LearningPath;
