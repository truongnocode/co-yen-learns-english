import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Star, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getPetData, createPet, changePetSpecies, PET_STAGES, getStageLabel, getNextStage } from "@/lib/pet";
import type { PetData } from "@/lib/pet";
import { getSpecies } from "@/data/pets";
import PetPicker from "@/components/PetPicker";
import PageShell from "@/components/PageShell";
import { Progress } from "@/components/ui/progress";

const FUN_FACTS = [
  "Bạn nhỏ lớn lên mỗi khi em học bài đúng!",
  "Học càng chăm, bạn nhỏ càng vui và khỏe mạnh.",
  "Mỗi từ mới em học là một bữa ăn ngon cho bạn nhỏ!",
  "Bạn nhỏ luôn cổ vũ em ôn bài mỗi ngày.",
  "Cùng nhau, em và bạn nhỏ sẽ chinh phục tiếng Anh!",
];

const VirtualPetPage = () => {
  const { user } = useAuth();
  const [pet, setPet] = useState<PetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [petName, setPetName] = useState("");
  const [busy, setBusy] = useState(false);
  const [changing, setChanging] = useState(false);
  const [funFact, setFunFact] = useState("");

  useEffect(() => {
    if (!user) return;
    getPetData(user.uid)
      .then((data) => setPet(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!pet) return;
    setFunFact(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);
    const interval = setInterval(() => {
      setFunFact(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);
    }, 8000);
    return () => clearInterval(interval);
  }, [pet]);

  const pickInAdopt = (id: string) => {
    setSelected(id);
    if (!petName.trim()) setPetName(getSpecies(id).name);
  };

  const handleAdopt = async () => {
    if (!user || !selected || !petName.trim()) return;
    setBusy(true);
    try {
      setPet(await createPet(user.uid, selected, petName.trim()));
    } catch {
      /* silently fail */
    } finally {
      setBusy(false);
    }
  };

  const handleChange = async () => {
    if (!user || !selected) return;
    setBusy(true);
    try {
      const updated = await changePetSpecies(user.uid, selected);
      if (updated) setPet(updated);
      setChanging(false);
    } catch {
      /* silently fail */
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) {
    return (
      <PageShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full" />
        </div>
      </PageShell>
    );
  }

  // --- Chọn linh vật (chưa có pet, HOẶC đang đổi) ---
  if (!pet || changing) {
    const isChange = !!pet;
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-5 pt-28 pb-20">
          <div className="mb-6 text-center">
            <h1 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">
              {isChange ? "Đổi bạn đồng hành" : "Chọn bạn đồng hành"}
            </h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {isChange ? "Đổi loài bất kỳ lúc nào — tiến trình của em vẫn giữ nguyên." : "Bạn nhỏ sẽ lớn lên cùng em mỗi ngày học tiếng Anh!"}
            </p>
          </div>

          <PetPicker selected={isChange ? selected ?? pet.type : selected} onSelect={isChange ? setSelected : pickInAdopt} />

          {isChange ? (
            <div className="mt-6 flex gap-3">
              <button onClick={() => { setChanging(false); setSelected(null); }}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card px-5 py-3.5 font-display font-bold text-foreground shadow-1">
                <X className="h-5 w-5" /> Hủy
              </button>
              <button onClick={handleChange} disabled={busy || !selected || selected === pet.type}
                className="btn-press flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-display font-extrabold text-primary-foreground disabled:opacity-50">
                {busy ? "Đang đổi..." : "Chọn bạn này"}
              </button>
            </div>
          ) : (
            <AnimatePresence>
              {selected && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 text-center shadow-1">
                    <label className="block font-display text-base font-bold text-foreground">Đặt tên cho bạn nhỏ</label>
                    <input
                      type="text" value={petName} onChange={(e) => setPetName(e.target.value)}
                      placeholder="Ví dụ: Miu, Lửa, Bông..." maxLength={20}
                      className="mx-auto block w-full max-w-xs rounded-xl border border-border bg-card px-4 py-2.5 text-center text-base font-semibold text-foreground outline-none focus:border-primary"
                    />
                    <button onClick={handleAdopt} disabled={!petName.trim() || busy}
                      className="btn-press inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-3 font-display text-base font-extrabold text-primary-foreground disabled:opacity-50">
                      <Sparkles className="h-5 w-5" /> {busy ? "Đang nhận nuôi..." : "Nhận nuôi"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </PageShell>
    );
  }

  // --- Có pet ---
  const species = getSpecies(pet.type);
  const nextStage = getNextStage(pet.stage);
  const currentStageIdx = PET_STAGES.findIndex((s) => s.stage === pet.stage);
  const energyPercent = nextStage
    ? ((pet.energy - PET_STAGES[currentStageIdx].threshold) / (nextStage.threshold - PET_STAGES[currentStageIdx].threshold)) * 100
    : 100;

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-5 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 text-center">
          <motion.img
            src={species.img} alt={species.name}
            animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mb-4 h-32 w-32 drop-shadow-lg md:h-40 md:w-40"
          />
          <h1 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">{pet.name}</h1>
          <span className="mt-1 inline-block rounded-full bg-primary/10 px-3 py-1 font-display text-xs font-bold text-primary">
            {species.name} · {getStageLabel(pet.stage)}
          </span>
        </motion.div>

        {/* Năng lượng */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-sm font-bold text-foreground">Năng lượng</span>
            <span className="text-xs font-bold text-muted-foreground">
              {nextStage ? `${pet.energy}/${nextStage.threshold} → ${getStageLabel(nextStage.stage)}` : `${pet.energy} ⭐ Tối đa!`}
            </span>
          </div>
          <Progress value={Math.min(energyPercent, 100)} className="h-3" />
          <p className="mt-2 text-[11px] font-medium text-muted-foreground">⚡ Mỗi bài tập đúng = +10 năng lượng cho bạn nhỏ!</p>
        </motion.div>

        {/* Hành trình lớn lên */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-1">
          <h3 className="mb-4 font-display text-base font-bold text-foreground">Hành trình lớn lên</h3>
          <div className="flex items-center justify-between">
            {PET_STAGES.map((s, i) => {
              const isCurrent = i === currentStageIdx;
              const isPast = i < currentStageIdx;
              return (
                <div key={s.stage} className="flex flex-1 items-center">
                  <div className="flex flex-1 flex-col items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                      isCurrent ? "bg-primary text-primary-foreground ring-2 ring-primary/30" : isPast ? "bg-success/15 text-success" : "bg-muted text-muted-foreground/50"
                    }`}>
                      <Star className={`h-5 w-5 ${isPast || isCurrent ? "fill-current" : ""}`} />
                    </div>
                    <span className={`mt-1.5 text-center text-[10px] font-bold leading-tight ${isCurrent ? "text-primary" : isPast ? "text-success" : "text-muted-foreground"}`}>
                      {s.label}
                    </span>
                    <span className="text-[9px] font-medium text-muted-foreground/70">{s.threshold}</span>
                  </div>
                  {i < PET_STAGES.length - 1 && (
                    <div className={`mx-0.5 h-0.5 min-w-2 flex-1 rounded-full ${isPast ? "bg-success" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Bạn có biết + đổi loài */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl border border-border bg-card p-5 shadow-1">
          <h3 className="mb-2 font-display text-base font-bold text-foreground">💡 Bạn có biết?</h3>
          <AnimatePresence mode="wait">
            <motion.p key={funFact} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.4 }}
              className="text-base font-medium leading-relaxed text-muted-foreground">
              {funFact}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        <button onClick={() => { setSelected(pet.type); setChanging(true); }}
          className="mt-6 mx-auto flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-3 font-display font-bold text-foreground shadow-1 hover:shadow-2 transition-shadow">
          <RefreshCw className="h-4 w-4" /> Đổi bạn đồng hành
        </button>
      </div>
    </PageShell>
  );
};

export default VirtualPetPage;
