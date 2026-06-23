import { motion } from "framer-motion";
import { PET_SPECIES } from "@/data/pets";

/** Lưới chọn linh vật (dùng chung cho onboarding + trang Thú ảo). */
const PetPicker = ({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) => (
  <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
    {PET_SPECIES.map((s, i) => (
      <motion.button
        key={s.id}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: Math.min(i * 0.02, 0.4) }}
        whileTap={{ scale: 0.92 }}
        onClick={() => onSelect(s.id)}
        className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2 transition-colors ${
          selected === s.id ? "border-primary bg-primary/10 shadow-1" : "border-border bg-card hover:bg-muted"
        }`}
      >
        <img src={s.img} alt={s.name} className="h-11 w-11 sm:h-12 sm:w-12" />
        <span className={`text-[11px] font-bold leading-tight ${selected === s.id ? "text-primary" : "text-muted-foreground"}`}>
          {s.name}
        </span>
      </motion.button>
    ))}
  </div>
);

export default PetPicker;
