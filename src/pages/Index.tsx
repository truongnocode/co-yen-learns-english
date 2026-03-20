import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Trophy, Zap, Volume2, Sparkles, Star, Flame, Rocket, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import GradeSelectDialog from "@/components/GradeSelectDialog";
import { useAuth } from "@/contexts/AuthContext";
import foxMascot from "@/assets/fox-mascot.png";

const smooth = { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const };
const smoothSlow = { duration: 1, ease: [0.22, 1, 0.36, 1] as const };
const smoothCard = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, signInWithGoogle, selectGrade } = useAuth();
  const [showGradeSelect, setShowGradeSelect] = useState(false);
  const grade = profile?.grade;

  const handleCTA = useCallback(async () => {
    if (!user) {
      try { await signInWithGoogle(); } catch { return; }
      return;
    }
    if (!grade) {
      setShowGradeSelect(true);
    } else {
      navigate("/dashboard");
    }
  }, [user, grade, signInWithGoogle, navigate]);

  // Smart navigation: logged in with grade → go to grade page, otherwise login/grade select
  const smartNavigate = useCallback(async (path: string) => {
    if (!user) {
      try { await signInWithGoogle(); } catch { return; }
      return;
    }
    if (!grade) {
      setShowGradeSelect(true);
      return;
    }
    navigate(path);
  }, [user, grade, signInWithGoogle, navigate]);

  const handleGradeSelected = async (g: number) => {
    await selectGrade(g);
    setShowGradeSelect(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen overflow-hidden relative">
      <Navbar />

      {/* Soft Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-25%] left-[-15%] w-[70vw] h-[70vw] rounded-full bg-[hsl(215,55%,92%)] blur-[180px] opacity-60" />
        <motion.div animate={{ x: [0, -25, 0], y: [0, 30, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[5%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-[hsl(14,55%,92%)] blur-[180px] opacity-50" />
        <motion.div animate={{ x: [0, 20, 0], y: [0, 25, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-15%] left-[10%] w-[65vw] h-[65vw] rounded-full bg-[hsl(45,60%,92%)] blur-[160px] opacity-45" />
        <motion.div animate={{ x: [0, -15, 0], y: [0, -20, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-[hsl(170,50%,92%)] blur-[150px] opacity-35" />
      </div>

      {/* Announcement Pill */}
      <div className="pt-32 pb-6 flex justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 16, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ ...smooth, delay: 0.2 }}
          className="bg-card/70 backdrop-blur-xl rounded-full px-5 py-2.5 flex items-center gap-3 border border-white/60 shadow-md">
          <span className="gradient-warm text-white text-[10px] sm:text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">🔥 Hot</span>
          <span className="text-sm text-foreground font-semibold hidden sm:inline">Chào mừng các em đến với không gian học tập của cô Yến</span>
          <span className="text-sm text-foreground font-semibold sm:hidden">Chào mừng các em đến lớp!</span>
          <Sparkles className="h-4 w-4 text-accent" />
        </motion.div>
      </div>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 pt-8 pb-24 text-center">
        <motion.h1 initial={{ opacity: 0, y: 40, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ ...smoothSlow, delay: 0.3 }}
          className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-foreground leading-[1.1] mb-3">
          Ôn Luyện Bài Tập.
        </motion.h1>
        <motion.h1 initial={{ opacity: 0, y: 40, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ ...smoothSlow, delay: 0.5 }}
          className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1] mb-10 gradient-text italic">
          Vui Chơi Đua Top.
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ ...smooth, delay: 0.65 }}
          className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto mb-14 leading-relaxed font-medium">
          Hệ thống bài tập, flashcard và trò chơi tương tác độc quyền dành riêng
          cho học sinh của cô Yến. Các em hãy đăng nhập để xem nhiệm vụ hôm nay nhé!
        </motion.p>
        <motion.button
          initial={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ ...smooth, delay: 0.8 }}
          whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
          onClick={handleCTA}
          className="gradient-purple-card text-primary-foreground rounded-full px-10 py-4 sm:px-14 sm:py-5 text-base sm:text-xl font-display font-extrabold inline-flex items-center gap-3 shadow-[0_12px_40px_hsl(220,85%,55%,0.35)] hover:shadow-[0_16px_60px_hsl(200,80%,58%,0.4)] transition-shadow duration-500 pulse-glow"
        >
          <Rocket className="h-5 w-5" />
          {user ? (grade ? "Vào lớp ngay" : "Chọn lớp để bắt đầu") : "Đăng nhập & vào lớp"}
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </section>

      {/* Grade 10 Exam Prep — Hero Bento */}
      <section className="max-w-5xl mx-auto px-5 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          whileHover={{ scale: 1.01, y: -3 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={smoothCard}
          onClick={() => smartNavigate("/grade/10")}
          className="relative rounded-3xl overflow-hidden cursor-pointer group shadow-2xl"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,85%,50%)] via-[hsl(210,82%,55%)] to-[hsl(200,80%,58%)]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-60" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

          <div className="relative z-10 p-8 sm:p-10 md:p-12 flex flex-col md:flex-row items-center gap-8">
            {/* Left content */}
            <div className="flex-1 text-white">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
                <GraduationCap className="h-4 w-4" />
                <span className="text-xs font-extrabold uppercase tracking-wider">Ôn thi vào lớp 10</span>
              </div>
              <h3 className="font-display font-extrabold text-3xl sm:text-4xl mb-3 drop-shadow-md leading-tight">
                Chinh phục kỳ thi <br className="hidden sm:block" />vào THPT 🏆
              </h3>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-6 max-w-md font-medium">
                Hệ thống ôn luyện toàn diện với 11 chủ đề từ vựng, 9 chủ đề ngữ pháp, bài đọc hiểu, viết và 15 đề thi thử có chấm điểm.
              </p>
              <span className="bg-white text-[hsl(220,85%,50%)] font-display font-extrabold rounded-full px-8 py-3.5 text-sm shadow-xl inline-flex items-center gap-2 group-hover:gap-3 transition-all duration-500">
                <Rocket className="h-4 w-4" />
                Bắt đầu ôn thi ngay
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>

            {/* Right stats grid */}
            <div className="grid grid-cols-2 gap-3 w-full md:w-auto md:min-w-[260px]">
              {[
                { num: "11", label: "Chủ đề từ vựng", icon: "📚" },
                { num: "9", label: "Chủ đề ngữ pháp", icon: "⚡" },
                { num: "7", label: "Dạng bài luyện", icon: "✍️" },
                { num: "15", label: "Đề thi thử", icon: "📝" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 200 }}
                  className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10"
                >
                  <span className="text-xl mb-1 block">{item.icon}</span>
                  <span className="font-display font-extrabold text-2xl text-white block">{item.num}</span>
                  <span className="text-[10px] text-white/70 font-bold">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Bento Grid */}
      <section className="max-w-5xl mx-auto px-5 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Flashcard - large */}
          <motion.div
            initial={{ opacity: 0, y: 50, filter: "blur(8px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            whileHover={{ scale: 1.02, y: -4 }} viewport={{ once: true, margin: "-50px" }} transition={smoothCard}
            onClick={() => smartNavigate(grade ? `/grade/${grade}` : "/grades")}
            className="md:col-span-2 gradient-purple-card rounded-3xl p-8 sm:p-10 text-primary-foreground relative overflow-hidden cursor-pointer group min-h-[280px] flex flex-col justify-between will-change-transform shadow-xl transition-shadow duration-500 hover:shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
            <div className="absolute top-6 left-7 w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <BookOpen className="h-5 w-5" />
            </div>
            <img src={foxMascot} alt="Fox mascot"
              className="absolute right-2 bottom-2 w-36 sm:w-44 opacity-95 group-hover:scale-105 group-hover:rotate-2 transition-all duration-700 ease-out drop-shadow-2xl" />
            <div className="mt-18 relative z-10 max-w-[60%]">
              <h3 className="font-display font-extrabold text-2xl sm:text-3xl mb-3 drop-shadow-sm">Ôn tập từ vựng mỗi ngày</h3>
              <p className="text-white/75 text-sm leading-relaxed mb-5 font-medium">Lật thẻ Flashcard thông minh để nhớ lại các từ vựng cô đã dạy trên lớp, kèm âm thanh bản xứ.</p>
              <span className="text-white/90 text-sm font-bold inline-flex items-center gap-1.5 group-hover:gap-3 transition-all duration-500 bg-white/15 px-4 py-2 rounded-full">
                Bắt đầu học <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 50, filter: "blur(8px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            whileHover={{ scale: 1.03, y: -4 }} viewport={{ once: true, margin: "-50px" }} transition={{ ...smoothCard, delay: 0.1 }}
            onClick={() => smartNavigate("/progress")}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-7 border border-white/60 shadow-lg cursor-pointer will-change-transform hover:border-accent/30 transition-all duration-500 hover:shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl gradient-accent flex items-center justify-center mb-5 shadow-lg">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-display font-extrabold text-xl text-foreground mb-2">Thi đua bảng điểm 🏅</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5 font-medium">Hoàn thành bài tập đúng hạn để nhận xu và đua top với các bạn.</p>
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {["🐶", "🐱", "🐼"].map((e, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-sm shadow-sm">{e}</div>
                ))}
              </div>
              <span className="text-xs text-accent font-bold ml-2.5 bg-accent/10 px-2 py-1 rounded-full">+30 bạn</span>
            </div>
          </motion.div>

          {/* Grammar */}
          <motion.div
            initial={{ opacity: 0, y: 50, filter: "blur(8px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            whileHover={{ scale: 1.03, y: -4 }} viewport={{ once: true, margin: "-50px" }} transition={{ ...smoothCard, delay: 0.15 }}
            onClick={() => smartNavigate(grade ? `/grade/${grade}` : "/grades")}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-7 border border-white/60 shadow-lg cursor-pointer will-change-transform hover:border-primary/30 transition-all duration-500 hover:shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl gradient-cool flex items-center justify-center mb-5 shadow-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-display font-extrabold text-xl text-foreground mb-2">Củng cố ngữ pháp ⚡</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5 font-medium">Làm các mini-game trắc nghiệm, điền từ để nắm chắc cấu trúc câu.</p>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} whileInView={{ width: "60%" }} viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 1.5, ease: [0.22, 1, 0.36, 1] }} className="h-full gradient-cool rounded-full" />
            </div>
          </motion.div>

          {/* Pronunciation - large */}
          <motion.div
            initial={{ opacity: 0, y: 50, filter: "blur(8px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            whileHover={{ scale: 1.02, y: -4 }} viewport={{ once: true, margin: "-50px" }} transition={{ ...smoothCard, delay: 0.2 }}
            onClick={() => smartNavigate(grade ? `/grade/${grade}` : "/grades")}
            className="md:col-span-2 gradient-orange-card rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden cursor-pointer group min-h-[260px] flex flex-col justify-between will-change-transform shadow-xl transition-shadow duration-500 hover:shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 -translate-x-1/4 blur-3xl" />
            <div className="absolute right-6 bottom-6 flex items-end gap-1.5 opacity-25">
              {[40, 70, 45, 90, 60, 30, 80, 50, 20, 65, 35].map((h, i) => (
                <div key={i} className="w-2.5 bg-white/70 rounded-full sound-wave" style={{ height: `${h}px`, animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Volume2 className="h-5 w-5" />
            </div>
            <div className="mt-4 relative z-10 max-w-[65%]">
              <h3 className="font-display font-extrabold text-2xl sm:text-3xl mb-3 drop-shadow-sm">Luyện phát âm chuẩn 🎤</h3>
              <p className="text-white/75 text-sm leading-relaxed mb-6 font-medium">Đọc các đoạn hội thoại cô giao. AI sẽ nhận diện giọng nói và giúp các em sửa lỗi phát âm ngay lập tức.</p>
              <span className="bg-white text-accent font-extrabold rounded-full px-7 py-3 text-sm shadow-lg inline-block font-display">
                🎯 Vào làm bài phát âm
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-5 pb-32 text-center">
        <motion.div initial={{ opacity: 0, y: 40, filter: "blur(8px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }} transition={smoothSlow} className="flex flex-col items-center">
          <motion.div animate={{ rotate: [0, 3, -3, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl gradient-energy flex items-center justify-center mb-6 shadow-xl">
            <Star className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-foreground mb-5">
            Các em đã sẵn sàng <br /><span className="gradient-text">làm bài chưa?</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto mb-12 leading-relaxed font-medium">
            Cô Yến đã cập nhật đầy đủ bài tập và từ vựng mới cho các lớp. Các em nhớ hoàn thành nhiệm vụ trước hạn chót để nhận thưởng nhé! 🎁
          </p>
          <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} onClick={handleCTA}
            className="bg-foreground text-background rounded-full px-10 py-5 text-lg font-display font-extrabold inline-flex items-center gap-3 shadow-[0_12px_40px_hsl(220,30%,18%,0.2)] hover:shadow-[0_18px_50px_hsl(220,30%,18%,0.3)] transition-all duration-500">
            <Flame className="h-5 w-5" />
            {user ? (grade ? "Vào trang cá nhân" : "Chọn lớp để bắt đầu") : "Đăng nhập để bắt đầu"}
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/20 py-12 text-center">
        <p className="text-sm text-muted-foreground/60 font-medium">© 2026 Học tiếng Anh với cô Yến · Thiết kế dành riêng cho học sinh lớp 6–10 ❤️</p>
      </footer>

      <GradeSelectDialog open={showGradeSelect} onSelect={handleGradeSelected} />
    </div>
  );
};

export default Index;
