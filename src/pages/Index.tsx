import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Trophy, Zap, Volume2, Sparkles, UserCircle2, Star, Flame, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import foxMascot from "@/assets/fox-mascot.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-hidden relative">
      <Navbar />

      {/* Vibrant Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-25%] left-[-15%] w-[70vw] h-[70vw] rounded-full bg-[hsl(270,70%,90%)] blur-[140px] opacity-70 animate-pulse" />
        <div className="absolute top-[5%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-[hsl(335,70%,90%)] blur-[140px] opacity-60" />
        <div className="absolute bottom-[-15%] left-[10%] w-[65vw] h-[65vw] rounded-full bg-[hsl(30,80%,90%)] blur-[130px] opacity-50" />
        <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-[hsl(45,90%,90%)] blur-[120px] opacity-40" />
      </div>

      {/* Floating decorative elements */}
      <div className="fixed inset-0 -z-5 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [-10, 10, -10], rotate: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 left-[8%] text-4xl"
        >
          ✨
        </motion.div>
        <motion.div
          animate={{ y: [10, -10, 10], rotate: [0, -15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-48 right-[12%] text-3xl"
        >
          🎯
        </motion.div>
        <motion.div
          animate={{ y: [-8, 12, -8], rotate: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-72 left-[15%] text-2xl"
        >
          📚
        </motion.div>
        <motion.div
          animate={{ y: [5, -15, 5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-60 right-[20%] text-3xl"
        >
          🏆
        </motion.div>
      </div>

      {/* Announcement Pill */}
      <div className="pt-32 pb-6 flex justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="bg-card/70 backdrop-blur-xl rounded-full px-5 py-2.5 flex items-center gap-3 border border-white/60 shadow-md"
        >
          <span className="gradient-warm text-white text-[10px] sm:text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            🔥 Hot
          </span>
          <span className="text-sm text-foreground font-semibold hidden sm:inline">
            Chào mừng các em đến với không gian học tập của cô Yến
          </span>
          <span className="text-sm text-foreground font-semibold sm:hidden">
            Chào mừng các em đến lớp!
          </span>
          <Sparkles className="h-4 w-4 text-accent" />
        </motion.div>
      </div>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 pt-8 pb-24 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 80 }}
          className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-foreground leading-[1.1] mb-3"
        >
          Ôn Luyện Bài Tập.
        </motion.h1>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, type: "spring", stiffness: 80 }}
          className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1] mb-10 gradient-text italic"
        >
          Vui Chơi Đua Top.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto mb-14 leading-relaxed font-medium"
        >
          Hệ thống bài tập, flashcard và trò chơi tương tác độc quyền dành riêng
          cho học sinh của cô Yến. Các em hãy đăng nhập để xem nhiệm vụ hôm nay nhé!
        </motion.p>
        <motion.button
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.65, type: "spring" }}
          whileHover={{ scale: 1.06, y: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/grades")}
          className="gradient-purple-card text-primary-foreground rounded-full px-10 py-4 sm:px-14 sm:py-5 text-base sm:text-xl font-display font-extrabold inline-flex items-center gap-3 shadow-[0_12px_40px_hsl(270,75%,55%,0.4)] hover:shadow-[0_16px_60px_hsl(335,80%,58%,0.45)] transition-all pulse-glow"
        >
          <Rocket className="h-5 w-5" />
          Vào lớp ngay
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </section>

      {/* Bento Grid */}
      <section className="max-w-5xl mx-auto px-5 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Flashcard - large */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03, y: -6 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 18 }}
            onClick={() => navigate("/grades")}
            className="md:col-span-2 gradient-purple-card rounded-3xl p-8 sm:p-10 text-primary-foreground relative overflow-hidden cursor-pointer group min-h-[280px] flex flex-col justify-between will-change-transform shadow-xl"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
            <div className="absolute top-6 left-7 w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <BookOpen className="h-5 w-5" />
            </div>
            <img
              src={foxMascot}
              alt="Fox mascot"
              className="absolute right-2 bottom-2 w-36 sm:w-44 opacity-95 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 drop-shadow-2xl"
            />
            <div className="mt-18 relative z-10 max-w-[60%]">
              <h3 className="font-display font-extrabold text-2xl sm:text-3xl mb-3 drop-shadow-sm">
                Ôn tập từ vựng mỗi ngày
              </h3>
              <p className="text-white/75 text-sm leading-relaxed mb-5 font-medium">
                Lật thẻ Flashcard thông minh để nhớ lại các từ vựng cô đã dạy trên lớp, kèm âm thanh bản xứ.
              </p>
              <span className="text-white/90 text-sm font-bold inline-flex items-center gap-1.5 group-hover:gap-3 transition-all bg-white/15 px-4 py-2 rounded-full">
                Bắt đầu học <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -6 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring", stiffness: 220, damping: 18 }}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-7 border border-white/60 shadow-lg cursor-pointer will-change-transform hover:border-accent/30 transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl gradient-accent flex items-center justify-center mb-5 shadow-lg">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-display font-extrabold text-xl text-foreground mb-2">
              Thi đua bảng điểm 🏅
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5 font-medium">
              Hoàn thành bài tập đúng hạn để nhận xu và đua top với các bạn.
            </p>
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
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -6 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, type: "spring", stiffness: 220, damping: 18 }}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-7 border border-white/60 shadow-lg cursor-pointer will-change-transform hover:border-primary/30 transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl gradient-cool flex items-center justify-center mb-5 shadow-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-display font-extrabold text-xl text-foreground mb-2">
              Củng cố ngữ pháp ⚡
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5 font-medium">
              Làm các mini-game trắc nghiệm, điền từ để nắm chắc cấu trúc câu.
            </p>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "60%" }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
                className="h-full gradient-cool rounded-full"
              />
            </div>
          </motion.div>

          {/* Pronunciation - large */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03, y: -6 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, type: "spring", stiffness: 220, damping: 18 }}
            className="md:col-span-2 gradient-orange-card rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden cursor-pointer group min-h-[260px] flex flex-col justify-between will-change-transform shadow-xl"
          >
            <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 -translate-x-1/4 blur-2xl" />
            {/* Animated sound wave */}
            <div className="absolute right-6 bottom-6 flex items-end gap-1.5 opacity-30">
              {[40, 70, 45, 90, 60, 30, 80, 50, 20, 65, 35].map((h, i) => (
                <div
                  key={i}
                  className="w-2.5 bg-white/70 rounded-full sound-wave"
                  style={{ height: `${h}px`, animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Volume2 className="h-5 w-5" />
            </div>
            <div className="mt-4 relative z-10 max-w-[65%]">
              <h3 className="font-display font-extrabold text-2xl sm:text-3xl mb-3 drop-shadow-sm">
                Luyện phát âm chuẩn 🎤
              </h3>
              <p className="text-white/75 text-sm leading-relaxed mb-6 font-medium">
                Đọc các đoạn hội thoại cô giao. AI sẽ nhận diện giọng nói và giúp các em sửa lỗi phát âm ngay lập tức.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/grades")}
                className="bg-white text-accent font-extrabold rounded-full px-7 py-3 text-sm shadow-lg hover:bg-white/95 transition-colors font-display"
              >
                🎯 Vào làm bài phát âm
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-5 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl gradient-energy flex items-center justify-center mb-6 shadow-xl"
          >
            <Star className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-foreground mb-5">
            Các em đã sẵn sàng <br />
            <span className="gradient-text">làm bài chưa?</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto mb-12 leading-relaxed font-medium">
            Cô Yến đã cập nhật đầy đủ bài tập và từ vựng mới cho các lớp. Các em nhớ
            hoàn thành nhiệm vụ trước hạn chót để nhận thưởng nhé! 🎁
          </p>
          <motion.button
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.95 }}
            className="bg-foreground text-background rounded-full px-10 py-5 text-lg font-display font-extrabold inline-flex items-center gap-3 shadow-[0_12px_40px_hsl(260,30%,15%,0.2)] hover:shadow-[0_18px_50px_hsl(260,30%,15%,0.3)] transition-all"
          >
            <Flame className="h-5 w-5" />
            Đăng nhập để bắt đầu
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/20 py-12 text-center">
        <p className="text-sm text-muted-foreground/60 font-medium">
          © 2026 Học tiếng Anh với cô Yến · Thiết kế dành riêng cho học sinh lớp 6–10 ❤️
        </p>
      </footer>
    </div>
  );
};

export default Index;
