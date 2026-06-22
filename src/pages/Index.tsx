import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Menu, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GradeSelectDialog from "@/components/GradeSelectDialog";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import bearUrl from "@/assets/emoji/bear.png";
import rabbitUrl from "@/assets/emoji/rabbit.png";
import carrotUrl from "@/assets/emoji/carrot-char.svg";
import bookUrl from "@/assets/emoji/open-book.png";
import pencilUrl from "@/assets/emoji/pencil.png";
import rocketUrl from "@/assets/emoji/rocket.png";
import starUrl from "@/assets/emoji/star.png";
import joystickUrl from "@/assets/emoji/joystick.png";
import movieUrl from "@/assets/emoji/movie.png";
import trophyUrl from "@/assets/emoji/trophy.png";
import micUrl from "@/assets/emoji/mic.png";
import gradcapUrl from "@/assets/emoji/gradcap.png";

const smooth = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };
const float = (d: number, delay = 0) => ({
  animate: { y: [0, -10, 0] },
  transition: { duration: d, repeat: Infinity, ease: "easeInOut" as const, delay },
});

const Index = () => {
  const navigate = useNavigate();
  const { profile, selectGrade } = useAuth();
  const [showGradeSelect, setShowGradeSelect] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const grade = profile?.grade;

  const handleCTA = useCallback(async () => {
    if (!grade) setShowGradeSelect(true);
    else navigate("/dashboard");
  }, [grade, navigate]);

  const go = useCallback((path: string) => navigate(path), [navigate]);

  const handleGradeSelected = async (g: number) => {
    await selectGrade(g);
    setShowGradeSelect(false);
    navigate("/dashboard");
  };

  const navLinks = [
    { label: "Bài học", to: "/grades" },
    { label: "Video", to: "/video-lessons" },
    { label: "Luyện tập", to: "/practice" },
    { label: "Tiến trình", to: "/progress" },
  ];

  const hubs = [
    { label: "Bài học", desc: "Từ vựng · ngữ pháp · đọc hiểu", img: bookUrl, to: "/grades", bg: "#2F6FED", edge: "#1B4FB5" },
    { label: "Luyện tập", desc: "Trò chơi & flashcard vui nhộn", img: joystickUrl, to: "/practice", bg: "#FF6B5E", edge: "#D8432F" },
    { label: "Video", desc: "Nghe & nhại theo bản xứ", img: movieUrl, to: "/video-lessons", bg: "#8B5CF6", edge: "#6A3FD1" },
    { label: "Tiến trình", desc: "Điểm · chuỗi ngày · xếp hạng", img: trophyUrl, to: "/progress", bg: "#1FAE5E", edge: "#157A41" },
  ];

  const highlights = [
    { img: micUrl, tint: "bg-primary/10", title: "Phòng thu Shadowing AI", desc: "Nghe người bản xứ rồi nhại lại, AI chấm phát âm tới 98% và gửi về cho cô giáo.", to: "/practice" },
    { img: movieUrl, tint: "bg-accent2/10", title: "Học bằng video", desc: "Xem hoạt hình theo chủ đề, đọc thuộc từng câu đúng nhịp người bản xứ.", to: "/video-lessons" },
    { img: gradcapUrl, tint: "bg-accent/10", title: "Ôn thi vào lớp 10", desc: "Đề thi thử có chấm điểm, phân tích lỗ hổng ngữ pháp và gợi ý bài bổ trợ.", to: "/grade/10" },
  ];

  return (
    <div className="min-h-svh overflow-x-hidden bg-background">
      {/* ─── Top nav ─── */}
      <nav className="fixed top-3 left-0 right-0 z-50 px-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-2xl border border-border bg-card/95 px-4 py-2.5 shadow-1 backdrop-blur-sm sm:px-5">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-foreground active:scale-95 transition-transform md:hidden"
                aria-label="Mở menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[82vw] max-w-xs p-0" aria-describedby={undefined}>
              <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2.5 border-b border-border px-5 pb-5 pt-6">
                  <img src={bearUrl} alt="" className="h-9 w-9" />
                  <span className="font-display text-base font-extrabold text-foreground">Cô Yến</span>
                </div>
                <nav className="flex flex-col gap-1 p-3" aria-label="Chính">
                  {navLinks.map((link) => (
                    <button
                      key={link.to}
                      onClick={() => { setMenuOpen(false); navigate(link.to); }}
                      className="flex min-h-12 items-center rounded-xl px-4 text-base font-semibold text-foreground transition-colors hover:bg-muted active:scale-[0.98]"
                    >
                      {link.label}
                    </button>
                  ))}
                </nav>
                <div className="mt-auto border-t border-border p-3">
                  <button
                    onClick={() => { setMenuOpen(false); handleCTA(); }}
                    className="btn-press flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary px-4 font-display text-base font-extrabold text-primary-foreground"
                  >
                    {grade ? "Vào lớp học" : "Chọn lớp"}
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <button onClick={() => navigate("/")} className="mr-auto flex items-center gap-2 md:mr-0">
            <img src={bearUrl} alt="" className="h-10 w-10" />
            <span className="hidden font-display text-lg font-extrabold tracking-tight text-foreground sm:block">Cô Yến</span>
          </button>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <button
                key={link.to}
                onClick={() => go(link.to)}
                className="rounded-xl px-3.5 py-2 text-[15px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCTA}
            className="btn-press shrink-0 rounded-xl bg-primary px-5 py-2.5 font-display text-[15px] font-extrabold text-primary-foreground"
          >
            Vào học
          </button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <header className="relative overflow-hidden px-4 pb-12 pt-28 sm:pt-32 lg:pb-20 lg:pt-40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
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
              Cùng <span className="font-bold text-foreground">Gấu, Thỏ và Cà Rốt</span> học theo SGK iLearn & Global Success — luyện phát âm với phòng thu AI và chinh phục kỳ thi vào lớp 10.
            </p>

            {/* mobile mascot row — natural cluster */}
            <div className="relative mt-7 flex items-end justify-center md:hidden">
              <div className="absolute inset-x-8 bottom-2 -z-0 h-20 rounded-[50%] bg-primary/10 blur-sm" aria-hidden />
              <img src={rabbitUrl} alt="Thỏ" className="relative h-24 w-auto -rotate-[6deg] drop-shadow-md" />
              <img src={bearUrl} alt="Gấu" className="relative z-10 -mx-3 h-28 w-auto drop-shadow-md" />
              <img src={carrotUrl} alt="Cà Rốt" className="relative h-28 w-auto rotate-[6deg] drop-shadow-md" />
            </div>

            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <button
                onClick={handleCTA}
                className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-lg font-extrabold text-primary-foreground sm:w-auto"
              >
                {grade ? "Vào lớp học" : "Bắt đầu học"} <ArrowRight className="h-5 w-5" aria-hidden />
              </button>
              <button
                onClick={() => go("/grades")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary/30 bg-card px-8 py-4 font-display text-lg font-extrabold text-primary shadow-1 transition-colors hover:bg-primary/5 sm:w-auto"
              >
                Xem lộ trình
              </button>
            </div>
            <div className="mt-7 flex items-center justify-center gap-3 lg:justify-start">
              <div className="flex -space-x-3">
                {["A", "B", "C"].map((s) => (
                  <img key={s} className="h-10 w-10 rounded-full border-2 border-card" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`} alt="" />
                ))}
              </div>
              <p className="text-sm font-semibold text-muted-foreground">
                Hơn <span className="font-extrabold text-foreground">500+</span> học sinh học mỗi ngày
              </p>
            </div>
          </motion.div>

          {/* Right — mascot stage (desktop) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...smooth, delay: 0.25 }}
            className="relative mx-auto hidden h-[420px] w-full max-w-lg md:block"
          >
            {/* soft organic backdrop — no hard box */}
            <div className="absolute right-4 top-8 -z-0 h-60 w-60 rounded-full bg-primary/10" aria-hidden />
            <div className="absolute left-6 bottom-20 -z-0 h-40 w-40 rounded-full bg-accent/10" aria-hidden />
            <div className="absolute left-1/2 bottom-7 h-9 w-72 -translate-x-1/2 rounded-[50%] bg-foreground/5 blur-md" aria-hidden />

            {/* floating objects — playful, asymmetric, varied angles */}
            <motion.img src={bookUrl} alt="" {...float(5)} className="absolute left-0 top-14 z-10 h-16 w-16 -rotate-[14deg] drop-shadow-md" aria-hidden />
            <motion.img src={rocketUrl} alt="" {...float(6, 0.4)} className="absolute right-1 top-1 z-10 h-24 w-24 rotate-[12deg] drop-shadow-md" aria-hidden />
            <motion.img src={pencilUrl} alt="" {...float(5.4, 0.9)} className="absolute right-12 top-40 z-30 h-12 w-12 rotate-[20deg] drop-shadow-sm" aria-hidden />
            <motion.img src={starUrl} alt="" {...float(4.4, 0.2)} className="absolute left-8 top-40 z-10 h-9 w-9 -rotate-12" aria-hidden />
            <img src={starUrl} alt="" className="absolute right-1/3 top-4 z-10 h-6 w-6" aria-hidden />
            <img src={starUrl} alt="" className="absolute left-1/4 bottom-28 z-0 h-5 w-5 opacity-80" aria-hidden />

            {/* the trio — natural cluster: varied size, slight tilt, gentle overlap */}
            <div className="absolute inset-x-0 bottom-6 z-20 flex items-end justify-center">
              <motion.img src={rabbitUrl} alt="Thỏ" {...float(4.6, 0.3)} className="relative z-10 h-36 w-auto -rotate-[6deg] drop-shadow-xl" />
              <motion.img src={bearUrl} alt="Gấu" {...float(5, 0)} className="relative z-20 -mx-4 h-52 w-auto drop-shadow-xl" />
              <motion.img src={carrotUrl} alt="Cà Rốt" {...float(4.8, 0.5)} className="relative z-10 h-52 w-auto rotate-[6deg] drop-shadow-xl" />
            </div>
          </motion.div>
        </div>
      </header>

      {/* ─── 4 hubs ─── */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="font-display text-fluid-h1 font-extrabold text-foreground">Em muốn học gì hôm nay?</h2>
          <p className="mt-2 font-medium text-muted-foreground">Mọi thứ em cần, gọn trong 4 khu vực.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {hubs.map((hub, i) => (
            <motion.button
              key={hub.to}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...smooth, delay: i * 0.06 }}
              onClick={() => go(hub.to)}
              style={{ backgroundColor: hub.bg, boxShadow: `0 5px 0 0 ${hub.edge}` }}
              className="group relative flex flex-col items-start overflow-hidden rounded-2xl p-5 text-left text-white transition-transform hover:-translate-y-1 active:translate-y-1"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                <img src={hub.img} alt="" className="h-10 w-10 drop-shadow-sm" />
              </div>
              <h3 className="font-display text-xl font-extrabold">{hub.label}</h3>
              <p className="mt-1 text-sm font-semibold text-white/90">{hub.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold">
                Khám phá <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ─── Highlights ─── */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="font-display text-fluid-h1 font-extrabold text-foreground">Vì sao học cùng cô Yến?</h2>
          <p className="mt-2 font-medium text-muted-foreground">Công cụ hiện đại, học mà như chơi.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {highlights.map((h, i) => (
            <motion.button
              key={h.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...smooth, delay: i * 0.08 }}
              onClick={() => go(h.to)}
              className="group flex flex-col items-start rounded-2xl border border-border bg-card p-6 text-left shadow-1 transition-all hover:-translate-y-1 hover:shadow-2"
            >
              <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${h.tint}`}>
                <img src={h.img} alt="" className="h-10 w-10" />
              </div>
              <h3 className="font-display text-2xl font-extrabold text-foreground">{h.title}</h3>
              <p className="mt-2 font-medium leading-relaxed text-muted-foreground">{h.desc}</p>
            </motion.button>
          ))}
        </div>

        {/* vibrant CTA band with mascots */}
        <div className="relative mt-12 flex flex-col items-center gap-4 overflow-hidden rounded-3xl bg-primary p-8 text-center text-primary-foreground shadow-2 sm:p-12">
          <img src={bearUrl} alt="" className="pointer-events-none absolute -left-3 bottom-0 hidden h-36 w-auto md:block" aria-hidden />
          <img src={carrotUrl} alt="" className="pointer-events-none absolute -right-2 bottom-0 hidden h-32 w-auto md:block" aria-hidden />
          <h2 className="relative font-display text-fluid-h1 font-extrabold">Sẵn sàng bắt đầu chưa?</h2>
          <p className="relative max-w-md font-medium text-white/90">Chọn lớp của em và vào lớp học ngay hôm nay — hoàn toàn miễn phí.</p>
          <button
            onClick={handleCTA}
            style={{ boxShadow: "0 5px 0 0 #A66A00" }}
            className="relative mt-2 flex items-center justify-center gap-2 rounded-2xl bg-xp px-8 py-4 font-display text-lg font-extrabold text-xp-foreground transition-transform active:translate-y-1"
          >
            {grade ? "Vào lớp học" : "Chọn lớp & bắt đầu"} <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-8 text-center">
        <p className="text-sm font-semibold text-muted-foreground">© 2026 Học tiếng Anh cùng cô Yến ❤️</p>
      </footer>

      <GradeSelectDialog open={showGradeSelect} onSelect={handleGradeSelected} />
    </div>
  );
};

export default Index;
