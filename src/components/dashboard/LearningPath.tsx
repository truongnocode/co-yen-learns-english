import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, Brain, MessageCircle, Gift, Pencil, Lock, Star, Play } from "lucide-react";
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
      </div>
    </motion.div>
  );
};

export default LearningPath;
