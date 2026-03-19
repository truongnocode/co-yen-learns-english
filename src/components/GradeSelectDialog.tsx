import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gradeConfig, SUPPORTED_GRADES } from "@/data/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface GradeSelectDialogProps {
  open: boolean;
  onSelect: (grade: number) => void;
}

const GradeSelectDialog = ({ open, onSelect }: GradeSelectDialogProps) => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md border-none bg-card/95 backdrop-blur-2xl shadow-2xl rounded-3xl p-0 overflow-hidden">
        <div className="gradient-purple-card p-6 pb-8 text-white text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="text-5xl mb-3"
          >
            🎒
          </motion.div>
          <DialogHeader>
            <DialogTitle className="text-white font-display font-extrabold text-2xl">
              Chào mừng em!
            </DialogTitle>
            <DialogDescription className="text-white/80 font-medium mt-1">
              Em đang học lớp mấy? Chọn lớp để cô tạo lộ trình học phù hợp nhé!
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-5 gap-3 mb-6">
            {SUPPORTED_GRADES.map((grade, i) => {
              const cfg = gradeConfig[grade];
              const isSelected = selected === grade;
              return (
                <motion.button
                  key={grade}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setSelected(grade)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 border-2 ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-transparent bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <span className="text-2xl">{cfg.emoji}</span>
                  <span className={`text-xs font-bold font-display ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                    {cfg.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {selected && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelect(selected)}
                className="w-full gradient-purple-card text-white rounded-2xl py-4 font-display font-extrabold text-lg shadow-lg"
              >
                ✨ Bắt đầu học {gradeConfig[selected].label}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GradeSelectDialog;
