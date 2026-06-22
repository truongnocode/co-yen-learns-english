import { motion } from "framer-motion";
import { BookOpen, Brain, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Unit } from "@/data/vocabulary";

interface UnitCardProps {
  unit: Unit;
  grade: number;
  index: number;
}

const modes = [
  { key: "flashcard", label: "Flashcard", icon: BookOpen, fill: "bg-accent text-accent-foreground" },
  { key: "quiz", label: "Trắc nghiệm", icon: Brain, fill: "bg-primary text-primary-foreground" },
  { key: "spelling", label: "Chính tả", icon: Pencil, fill: "bg-success text-success-foreground" },
];

const UnitCard = ({ unit, index }: UnitCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 260 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-1 transition-all hover:-translate-y-0.5 hover:shadow-2"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-lg text-foreground">{unit.name}</h3>
          <p className="text-sm text-muted-foreground">{unit.topic}</p>
        </div>
        <span className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-bold">
          {unit.words.length} từ
        </span>
      </div>
      <div className="flex gap-2.5">
        {modes.map((mode) => (
          <motion.button
            key={mode.key}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`/learn/${unit.id}/${mode.key}`)}
            className={`${mode.fill} flex-1 min-w-0 rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5 text-xs font-bold font-display shadow-1 hover:shadow-2 transition-shadow`}
          >
            <mode.icon className="h-5 w-5" />
            <span className="text-[10px] sm:text-xs">{mode.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default UnitCard;
