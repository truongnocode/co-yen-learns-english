import { useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/contexts/AuthContext";
import { isOnboarded } from "@/lib/progress";
import bearUrl from "@/assets/emoji/bear.png";
import rabbitUrl from "@/assets/emoji/rabbit.png";
import carrotUrl from "@/assets/emoji/carrot-char.svg";
import bookUrl from "@/assets/emoji/open-book.png";
import pencilUrl from "@/assets/emoji/pencil.png";
import rocketUrl from "@/assets/emoji/rocket.png";
import starUrl from "@/assets/emoji/star.png";

const smooth = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };
const float = (d: number, delay = 0) => ({
  animate: { y: [0, -10, 0] },
  transition: { duration: d, repeat: Infinity, ease: "easeInOut" as const, delay },
});

/**
 * Trang chủ tinh gọn: một "splash" có đúng một nút vào học + linh vật.
 * Điều hướng dùng chung AppNav (qua PageShell) — không còn menu tự chế / section trùng.
 * CTA: chưa tạo tài khoản → /onboarding; đã xong → /dashboard.
 */
const Index = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const onboarded = isOnboarded(profile);

  const handleCTA = useCallback(() => {
    navigate(onboarded ? "/dashboard" : "/onboarding");
  }, [onboarded, navigate]);

  return (
    <PageShell>
      <header className="relative overflow-hidden px-4 pb-16 pt-28 sm:pt-32 lg:pb-24 lg:pt-40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          {/* ── Text + single CTA ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...smooth, delay: 0.1 }}
            className="text-center lg:text-left"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-xp px-4 py-1.5 text-sm font-extrabold text-xp-foreground shadow-1">
              <Sparkles className="h-4 w-4" aria-hidden /> Cho học sinh lớp 3 – lớp 10
            </div>
            <h1 className="font-display text-fluid-display font-extrabold leading-[1.08] text-foreground">
              Học tiếng Anh<br />
              <span className="bg-gradient-to-r from-accent to-streak bg-clip-text text-transparent">vui như chơi game!</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-relaxed text-muted-foreground sm:text-body-lg lg:mx-0">
              Cùng <span className="font-bold text-foreground">Gấu, Thỏ và Cà Rốt</span> học theo sách giáo khoa, luyện nghe – nói và ôn thi vào lớp 10.
            </p>

            {/* mobile mascot row */}
            <div className="relative mt-7 flex items-end justify-center md:hidden">
              <div className="absolute inset-x-8 bottom-2 -z-0 h-20 rounded-[50%] bg-primary/10 blur-sm" aria-hidden />
              <img src={rabbitUrl} alt="Thỏ" className="relative h-24 w-auto -rotate-[6deg] drop-shadow-md" />
              <img src={bearUrl} alt="Gấu" className="relative z-10 -mx-3 h-28 w-auto drop-shadow-md" />
              <img src={carrotUrl} alt="Cà Rốt" className="relative h-28 w-auto rotate-[6deg] drop-shadow-md" />
            </div>

            <div className="mt-8 flex justify-center lg:justify-start">
              <button
                onClick={handleCTA}
                className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-lg font-extrabold text-primary-foreground sm:w-auto"
              >
                {onboarded ? "Vào lớp học" : "Bắt đầu học"} <ArrowRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </motion.div>

          {/* ── Mascot stage (desktop) ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...smooth, delay: 0.25 }}
            className="relative mx-auto hidden h-[420px] w-full max-w-lg md:block"
          >
            <div className="absolute right-4 top-8 -z-0 h-60 w-60 rounded-full bg-primary/10" aria-hidden />
            <div className="absolute left-6 bottom-20 -z-0 h-40 w-40 rounded-full bg-accent/10" aria-hidden />
            <div className="absolute left-1/2 bottom-7 h-9 w-72 -translate-x-1/2 rounded-[50%] bg-foreground/5 blur-md" aria-hidden />

            <motion.img src={bookUrl} alt="" {...float(5)} className="absolute left-0 top-14 z-10 h-16 w-16 -rotate-[14deg] drop-shadow-md" aria-hidden />
            <motion.img src={rocketUrl} alt="" {...float(6, 0.4)} className="absolute right-1 top-1 z-10 h-24 w-24 rotate-[12deg] drop-shadow-md" aria-hidden />
            <motion.img src={pencilUrl} alt="" {...float(5.4, 0.9)} className="absolute right-12 top-40 z-30 h-12 w-12 rotate-[20deg] drop-shadow-sm" aria-hidden />
            <motion.img src={starUrl} alt="" {...float(4.4, 0.2)} className="absolute left-8 top-40 z-10 h-9 w-9 -rotate-12" aria-hidden />
            <img src={starUrl} alt="" className="absolute right-1/3 top-4 z-10 h-6 w-6" aria-hidden />
            <img src={starUrl} alt="" className="absolute left-1/4 bottom-28 z-0 h-5 w-5 opacity-80" aria-hidden />

            <div className="absolute inset-x-0 bottom-6 z-20 flex items-end justify-center">
              <motion.img src={rabbitUrl} alt="Thỏ" {...float(4.6, 0.3)} className="relative z-10 h-36 w-auto -rotate-[6deg] drop-shadow-xl" />
              <motion.img src={bearUrl} alt="Gấu" {...float(5, 0)} className="relative z-20 -mx-4 h-52 w-auto drop-shadow-xl" />
              <motion.img src={carrotUrl} alt="Cà Rốt" {...float(4.8, 0.5)} className="relative z-10 h-52 w-auto rotate-[6deg] drop-shadow-xl" />
            </div>
          </motion.div>
        </div>
      </header>

      <footer className="border-t border-border py-8 text-center">
        <p className="text-sm font-semibold text-muted-foreground">© 2026 Học tiếng Anh cùng cô Yến ❤️</p>
      </footer>
    </PageShell>
  );
};

export default Index;
