import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getPetData, getStageLabel, getNextStage, PET_STAGES } from "@/lib/pet";
import type { PetData } from "@/lib/pet";
import { getSpecies } from "@/data/pets";
import { Progress } from "@/components/ui/progress";

const PetWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pet, setPet] = useState<PetData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getPetData(user.uid)
      .then((data) => setPet(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="bg-card border border-border shadow-1 rounded-2xl p-4 animate-pulse">
        <div className="h-12 bg-muted rounded-xl" />
      </div>
    );
  }

  // No pet yet - show CTA
  if (!pet) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/pet")}
        className="w-full bg-card border border-border shadow-1 rounded-2xl p-4 text-center hover:border-primary/30 hover:shadow-2 transition-all group"
      >
        <motion.span
          className="text-3xl inline-block mb-1"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🥚
        </motion.span>
        <p className="font-display font-bold text-xs text-primary group-hover:underline">
          Nhận thú cưng!
        </p>
      </motion.button>
    );
  }

  // Has pet - show compact card
  const currentStageIdx = PET_STAGES.findIndex((s) => s.stage === pet.stage);
  const nextStage = getNextStage(pet.stage);
  const species = getSpecies(pet.type);
  const energyPercent = nextStage
    ? ((pet.energy - PET_STAGES[currentStageIdx].threshold) / (nextStage.threshold - PET_STAGES[currentStageIdx].threshold)) * 100
    : 100;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate("/pet")}
      className="w-full bg-card border border-border shadow-1 rounded-2xl p-4 text-left hover:border-primary/30 hover:shadow-2 transition-all group"
    >
      <div className="flex items-center gap-3 mb-2.5">
        <motion.img
          src={species.img}
          alt={species.name}
          className="h-10 w-10 shrink-0"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-sm text-foreground truncate">{pet.name}</p>
          <p className="text-[10px] font-bold text-primary">{species.name} · {getStageLabel(pet.stage)}</p>
        </div>
      </div>
      <Progress value={Math.min(energyPercent, 100)} className="h-1.5" />
      <p className="text-[10px] text-muted-foreground font-medium mt-1">
        {nextStage ? `${pet.energy}/${nextStage.threshold}` : `${pet.energy} ⭐`}
      </p>
    </motion.button>
  );
};

export default PetWidget;
