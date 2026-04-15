import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getPetData, createPet, PET_TYPES, PET_STAGES, getPetEmoji, getStageLabel, getNextStage } from "@/lib/pet";
import type { PetData, PetType } from "@/lib/pet";
import PageShell from "@/components/PageShell";
import { Progress } from "@/components/ui/progress";

const PET_OPTIONS: { type: PetType; emoji: string; label: string; color: string; bgColor: string }[] = [
  { type: "dragon", emoji: "🐉", label: "Rồng con", color: "text-red-500", bgColor: "from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30" },
  { type: "cat", emoji: "🐱", label: "Mèo con", color: "text-amber-500", bgColor: "from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30" },
  { type: "fox", emoji: "🦊", label: "Cáo nhỏ", color: "text-orange-500", bgColor: "from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30" },
];

const FUN_FACTS: Record<PetType, string[]> = {
  dragon: [
    "Rồng con thích ăn bánh flan lắm đó!",
    "Khi vui, rồng con sẽ phun ra những bong bóng lấp lánh!",
    "Rồng con mỗi ngày đều luyện tập bay một chút.",
    "Bạn nhỏ rồng rất giỏi nhớ từ vựng đấy!",
  ],
  cat: [
    "Mèo con rất thích được vuốt ve sau giờ học!",
    "Khi ngủ, mèo con hay mơ về những bài hát tiếng Anh.",
    "Mèo con có thể nghe được âm thanh rất nhỏ.",
    "Bạn nhỏ mèo luôn cổ vũ bạn học bài chăm chỉ!",
  ],
  fox: [
    "Cáo nhỏ rất thông minh và nhanh nhẹn!",
    "Khi vui, cáo nhỏ sẽ nhảy múa quanh bạn.",
    "Cáo nhỏ thích nghe bạn đọc truyện tiếng Anh.",
    "Bạn nhỏ cáo sẽ nhớ tất cả từ vựng cùng bạn!",
  ],
};

const VirtualPetPage = () => {
  const { user } = useAuth();
  const [pet, setPet] = useState<PetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<PetType | null>(null);
  const [petName, setPetName] = useState("");
  const [creating, setCreating] = useState(false);
  const [funFact, setFunFact] = useState("");

  useEffect(() => {
    if (!user) return;
    getPetData(user.uid)
      .then((data) => setPet(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // Rotate fun facts
  useEffect(() => {
    if (!pet) return;
    const facts = FUN_FACTS[pet.type];
    setFunFact(facts[Math.floor(Math.random() * facts.length)]);
    const interval = setInterval(() => {
      setFunFact(facts[Math.floor(Math.random() * facts.length)]);
    }, 8000);
    return () => clearInterval(interval);
  }, [pet]);

  const handleAdopt = async () => {
    if (!user || !selectedType || !petName.trim()) return;
    setCreating(true);
    try {
      const newPet = await createPet(user.uid, selectedType, petName.trim());
      setPet(newPet);
    } catch {
      // silently fail
    } finally {
      setCreating(false);
    }
  };

  if (loading || !user) {
    return (
      <PageShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full"
          />
        </div>
      </PageShell>
    );
  }

  // --- STATE 1: No pet yet ---
  if (!pet) {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <motion.span
              className="text-6xl inline-block mb-4"
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🥚
            </motion.span>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-foreground mb-2">
              Chọn người bạn đồng hành
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Bạn nhỏ sẽ lớn lên cùng bạn mỗi ngày học tiếng Anh!
            </p>
          </motion.div>

          {/* Pet type cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {PET_OPTIONS.map((opt, i) => (
              <motion.button
                key={opt.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedType(opt.type)}
                className={`relative rounded-2xl p-6 border-2 transition-all duration-200 bg-gradient-to-br ${opt.bgColor} ${
                  selectedType === opt.type
                    ? "border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30"
                    : "border-transparent hover:border-primary/30"
                }`}
              >
                <motion.span
                  className="text-5xl block mb-3"
                  animate={selectedType === opt.type ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {opt.emoji}
                </motion.span>
                <span className="font-display font-bold text-foreground text-base">{opt.label}</span>
                {selectedType === opt.type && (
                  <motion.div
                    layoutId="pet-selected"
                    className="absolute inset-0 rounded-2xl border-2 border-primary"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Name input + adopt button */}
          <AnimatePresence>
            {selectedType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass rounded-2xl p-6 text-center space-y-4">
                  <label className="block font-display font-bold text-sm text-foreground">
                    Đặt tên cho bạn nhỏ
                  </label>
                  <input
                    type="text"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="Ví dụ: Miu, Lửa, Bông..."
                    maxLength={20}
                    className="w-full max-w-xs mx-auto block px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-center text-foreground font-semibold text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAdopt}
                    disabled={!petName.trim() || creating}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? (
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        🥚
                      </motion.span>
                    ) : (
                      "🎉"
                    )}
                    {creating ? "Đang nhận nuôi..." : "Nhận nuôi"}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PageShell>
    );
  }

  // --- STATE 2: Has pet ---
  const nextStage = getNextStage(pet.stage);
  const currentStageIdx = PET_STAGES.findIndex((s) => s.stage === pet.stage);
  const currentEmoji = getPetEmoji(pet.type, pet.stage);
  const energyPercent = nextStage
    ? ((pet.energy - PET_STAGES[currentStageIdx].threshold) / (nextStage.threshold - PET_STAGES[currentStageIdx].threshold)) * 100
    : 100;

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Pet display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          {/* Floating pet emoji */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block mb-4"
          >
            <motion.span
              className="text-8xl md:text-[120px] inline-block drop-shadow-lg"
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
            >
              {currentEmoji}
            </motion.span>
          </motion.div>

          {/* Name + stage */}
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-foreground mb-1">
            {pet.name}
          </h1>
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-display font-bold text-xs">
            {getStageLabel(pet.stage)}
          </span>
        </motion.div>

        {/* Energy bar card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-5 mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-display font-bold text-sm text-foreground">Năng lượng</span>
            <span className="text-xs font-bold text-muted-foreground">
              {nextStage
                ? `${pet.energy}/${nextStage.threshold} → ${getStageLabel(nextStage.stage)}`
                : `${pet.energy} ⭐ Tối đa!`}
            </span>
          </div>
          <Progress value={Math.min(energyPercent, 100)} className="h-3" />
          <p className="text-[11px] text-muted-foreground mt-2 font-medium">
            ⚡ Mỗi bài tập đúng = +10 năng lượng cho bạn nhỏ!
          </p>
        </motion.div>

        {/* Evolution tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-2xl p-5 mb-6"
        >
          <h3 className="font-display font-bold text-sm text-foreground mb-4">Hành trình tiến hoá</h3>
          <div className="flex items-center justify-between gap-1">
            {PET_STAGES.map((s, i) => {
              const isCurrent = s.stage === pet.stage;
              const isPast = i < currentStageIdx;
              const emoji = getPetEmoji(pet.type, s.stage);
              return (
                <div key={s.stage} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <motion.div
                      animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`w-11 h-11 md:w-13 md:h-13 rounded-full flex items-center justify-center text-xl md:text-2xl transition-all ${
                        isCurrent
                          ? "bg-primary/15 ring-2 ring-primary shadow-lg shadow-primary/20"
                          : isPast
                            ? "bg-emerald-100 dark:bg-emerald-900/30"
                            : "bg-black/[0.04] dark:bg-white/[0.06]"
                      }`}
                    >
                      {emoji}
                    </motion.div>
                    <span
                      className={`text-[10px] font-bold mt-1.5 text-center leading-tight ${
                        isCurrent ? "text-primary" : isPast ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground/70 font-medium">{s.threshold}</span>
                  </div>
                  {/* Connector line (not after last) */}
                  {i < PET_STAGES.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 min-w-2 mx-0.5 rounded-full ${
                        isPast ? "bg-emerald-400" : "bg-black/[0.06] dark:bg-white/[0.08]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Fun fact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-5"
        >
          <h3 className="font-display font-bold text-sm text-foreground mb-2">💡 Bạn có biết?</h3>
          <AnimatePresence mode="wait">
            <motion.p
              key={funFact}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
              className="text-sm text-muted-foreground font-medium leading-relaxed"
            >
              {funFact}
            </motion.p>
          </AnimatePresence>
        </motion.div>
      </div>
    </PageShell>
  );
};

export default VirtualPetPage;
