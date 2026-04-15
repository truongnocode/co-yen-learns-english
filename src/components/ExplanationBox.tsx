import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface ExplanationBoxProps {
  explain?: string;
  isCorrect: boolean;
  correctAnswer: string;
  correctIndex: number;
  opts: string[];
  selectedIndex: number | null;
}

const ExplanationBox = ({ explain, isCorrect, correctAnswer, correctIndex, opts, selectedIndex }: ExplanationBoxProps) => {
  if (!explain) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mt-3 overflow-hidden"
      >
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4">
          <div className="flex items-start gap-2.5">
            <div className="bg-amber-100 dark:bg-amber-900/50 p-1.5 rounded-lg shrink-0 mt-0.5">
              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">Giải thích</p>
              <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed whitespace-pre-line">{explain}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExplanationBox;
