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
  { key: "flashcard", label: "Flashcard", icon: BookOpen, color: "bg-accent text-accent-foreground" },
  { key: "quiz", label: "Trắc nghiệm", icon: Brain, color: "bg-primary text-primary-foreground" },
  { key: "spelling", label: "Chính tả", icon: Pencil, color: "bg-success text-success-foreground" },
];

const UnitCard = ({ unit, grade, index }: UnitCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 260 }}
      className="bg-card rounded-2xl p-5 shadow-card"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display font-bold text-foreground">{unit.name}</h3>
          <p className="text-sm text-muted-foreground">{unit.topic}</p>
        </div>
        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
          {unit.words.length} từ
        </span>
      </div>
      <div className="flex gap-2">
        {modes.map((mode) => (
          <motion.button
            key={mode.key}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`/learn/${unit.id}/${mode.key}`)}
            className={`${mode.color} flex-1 rounded-xl py-2.5 px-2 flex flex-col items-center gap-1 text-xs font-medium font-display transition-transform`}
          >
            <mode.icon className="h-4 w-4" />
            {mode.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default UnitCard;
