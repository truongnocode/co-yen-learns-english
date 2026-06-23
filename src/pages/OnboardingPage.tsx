import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { SUPPORTED_GRADES, gradeConfig } from "@/data/types";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeVnMobile } from "@/lib/phone";
import { createPet } from "@/lib/pet";
import { getSpecies } from "@/data/pets";
import PetPicker from "@/components/PetPicker";
import PageShell from "@/components/PageShell";
import bearUrl from "@/assets/emoji/bear.png";

/**
 * Onboarding bắt buộc (3 bước): Tên + Lớp → SĐT phụ huynh → Chọn bạn đồng hành.
 * SĐT chỉ validate ĐỊNH DẠNG VN (chưa OTP). Linh vật là tuỳ chọn (đổi được sau).
 */
const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, profile, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(profile?.studentName || "");
  const [grade, setGrade] = useState<number | null>(profile?.grade ?? null);
  const [phone, setPhone] = useState(profile?.phone || "");
  const [consent, setConsent] = useState(false);
  const [petSpecies, setPetSpecies] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const canNext = name.trim().length >= 1 && grade != null;

  const goToPet = () => {
    if (!normalizeVnMobile(phone)) {
      setError("Số điện thoại chưa đúng định dạng Việt Nam (ví dụ: 0987 654 321).");
      return;
    }
    if (!consent) {
      setError("Vui lòng tích xác nhận đồng ý của phụ huynh.");
      return;
    }
    setError("");
    setStep(3);
  };

  const handleFinish = async () => {
    const normalized = normalizeVnMobile(phone);
    if (!normalized || !grade) {
      setError("Thiếu thông tin, vui lòng kiểm tra lại.");
      setStep(2);
      return;
    }
    setSaving(true);
    try {
      await completeOnboarding({ studentName: name.trim(), grade, phone: normalized });
      if (user && petSpecies) {
        await createPet(user.uid, petSpecies, getSpecies(petSpecies).name).catch(() => {});
      }
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Không lưu được thông tin, vui lòng thử lại.");
      setSaving(false);
    }
  };

  return (
    <PageShell withNavbar={false}>
      <div className="mx-auto flex min-h-svh max-w-md flex-col px-5 pb-10 pt-14">
        <div className="mb-7 flex flex-col items-center text-center">
          <img src={bearUrl} alt="" className="h-20 w-20 drop-shadow-md" />
          <h1 className="mt-2 font-display text-2xl font-extrabold text-foreground">Chào mừng em!</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tạo tài khoản để cô lưu lộ trình học cho em nhé.</p>
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((n) => (
              <span key={n} className={`h-1.5 w-9 rounded-full ${step >= n ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-5">
              <div>
                <label className="mb-1.5 block font-display text-sm font-bold text-foreground">Tên học sinh</label>
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  type="text" autoComplete="given-name" autoCapitalize="words" placeholder="Ví dụ: Nguyễn Gia Bảo"
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground shadow-1 outline-none transition-colors focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-display text-sm font-bold text-foreground">Em học lớp mấy?</label>
                <div className="grid grid-cols-4 gap-2">
                  {SUPPORTED_GRADES.map((g) => (
                    <button key={g} onClick={() => setGrade(g)}
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 transition-all ${grade === g ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"}`}>
                      <span className="text-xl">{gradeConfig[g].emoji}</span>
                      <span className={`text-xs font-bold ${grade === g ? "text-primary" : "text-muted-foreground"}`}>{gradeConfig[g].label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button disabled={!canNext} onClick={() => { setError(""); setStep(2); }}
                className="btn-press mt-2 flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-display text-base font-extrabold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">
                Tiếp tục <ArrowRight className="h-5 w-5" />
              </button>
            </motion.div>
          ) : step === 2 ? (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-5">
              <div>
                <label className="mb-1.5 block font-display text-sm font-bold text-foreground">Số điện thoại của phụ huynh</label>
                <input
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                  type="tel" inputMode="numeric" autoComplete="tel" placeholder="0987 654 321"
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground shadow-1 outline-none transition-colors focus:border-primary"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">Dùng để ba mẹ theo dõi việc học và xác nhận tài khoản. Cô không gửi quảng cáo.</p>
              </div>
              <label className="flex items-start gap-2.5 text-sm text-foreground">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 rounded accent-primary" />
                <span>Tôi là phụ huynh và đồng ý cho con sử dụng ứng dụng học tập này.</span>
              </label>
              {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
              <div className="mt-1 flex gap-3">
                <button onClick={() => { setError(""); setStep(1); }}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card px-5 py-3.5 font-display text-base font-bold text-foreground shadow-1">
                  <ArrowLeft className="h-5 w-5" /> Quay lại
                </button>
                <button onClick={goToPet}
                  className="btn-press flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-display text-base font-extrabold text-primary-foreground">
                  Tiếp tục <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
              <div className="text-center">
                <h2 className="font-display text-lg font-extrabold text-foreground">Chọn bạn đồng hành</h2>
                <p className="text-sm text-muted-foreground">Bạn nhỏ sẽ lớn lên khi em học. Có thể đổi sau nhé!</p>
              </div>
              <PetPicker selected={petSpecies} onSelect={setPetSpecies} />
              {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
              <div className="mt-1 flex gap-3">
                <button onClick={() => { setError(""); setStep(2); }}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card px-5 py-3.5 font-display text-base font-bold text-foreground shadow-1">
                  <ArrowLeft className="h-5 w-5" /> Quay lại
                </button>
                <button onClick={handleFinish} disabled={saving}
                  className="btn-press flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-display text-base font-extrabold text-primary-foreground disabled:opacity-50">
                  {saving ? "Đang lưu..." : (<>Bắt đầu học <Check className="h-5 w-5" /></>)}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
};

export default OnboardingPage;
