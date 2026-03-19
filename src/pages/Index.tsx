import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Trophy, Zap, Volume2, Sparkles, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import foxMascot from "@/assets/fox-mascot.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero overflow-hidden">
      <Navbar />

      {/* Announcement Banner */}
      <div className="pt-28 pb-4 flex justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/60 backdrop-blur-sm rounded-full px-5 py-2.5 flex items-center gap-3 border border-white/50 shadow-sm"
        >
          <span className="bg-accent text-accent-foreground text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Thông báo
          </span>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Chào mừng các em học sinh đến với không gian của cô Yến
          </span>
          <span className="text-sm text-muted-foreground sm:hidden">
            Chào mừng các em đến lớp cô Yến
          </span>
          <Sparkles className="h-4 w-4 text-accent" />
        </motion.div>
      </div>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-5 pt-8 pb-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
          className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-foreground leading-tight mb-2"
        >
          Ôn Luyện Bài Tập.
        </motion.h1>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
          className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight mb-6 gradient-text italic"
        >
          Vui Chơi Đua Top.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Hệ thống bài tập, flashcard và trò chơi tương tác độc quyền dành riêng
          cho học sinh của cô Yến. Các em hãy đăng nhập để xem nhiệm vụ hôm nay nhé!
        </motion.p>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/grades")}
          className="gradient-primary text-primary-foreground rounded-full px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg font-display font-bold inline-flex items-center gap-3 shadow-xl hover:shadow-2xl transition-shadow"
        >
          Vào lớp ngay
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </section>

      {/* Feature Bento Grid */}
      <section className="max-w-5xl mx-auto px-5 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Large card - Flashcard */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate("/grades")}
            className="md:col-span-2 gradient-purple-card rounded-3xl p-7 sm:p-8 text-primary-foreground relative overflow-hidden cursor-pointer group min-h-[220px] flex flex-col justify-between"
          >
            <div className="absolute top-5 left-6 w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <img
              src={foxMascot}
              alt="Fox mascot"
              className="absolute right-4 bottom-4 w-32 sm:w-40 opacity-90 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg"
            />
            <div className="mt-14 relative z-10 max-w-[60%]">
              <h3 className="font-display font-bold text-2xl sm:text-3xl mb-2">
                Ôn tập từ vựng mỗi ngày
              </h3>
              <p className="text-white/80 text-sm leading-relaxed mb-4">
                Lật thẻ Flashcard thông minh để nhớ lại các từ vựng cô đã dạy trên lớp, kèm phiên âm chuẩn.
              </p>
              <span className="text-white/90 text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Vào ôn tập ngay <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </motion.div>

          {/* Leaderboard card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-3xl p-7 border border-white/60 shadow-lg cursor-pointer group hover:shadow-xl transition-shadow"
          >
            <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
              <Trophy className="h-5 w-5 text-accent" />
            </div>
            <h3 className="font-display font-bold text-xl text-foreground mb-2">
              Thi đua bảng điểm
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Hoàn thành bài tập đúng hạn để nhận xu và đua top với các bạn.
            </p>
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {["🧒", "👧", "👦"].map((e, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-sm">{e}</div>
                ))}
              </div>
              <span className="text-xs text-muted-foreground ml-2 font-medium">+30</span>
            </div>
          </motion.div>

          {/* Grammar card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-3xl p-7 border border-white/60 shadow-lg cursor-pointer group hover:shadow-xl transition-shadow"
          >
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-display font-bold text-xl text-foreground mb-2">
              Củng cố ngữ pháp
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5">
              Làm các mini-game trắc nghiệm, điền từ để nắm chắc cấu trúc câu.
            </p>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-3/5 gradient-primary rounded-full" />
            </div>
          </motion.div>

          {/* Pronunciation card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="md:col-span-2 gradient-orange-card rounded-3xl p-7 sm:p-8 text-white relative overflow-hidden cursor-pointer group min-h-[200px] flex flex-col justify-between"
          >
            <div className="absolute right-6 bottom-6 flex items-end gap-1 opacity-40">
              {[20, 35, 50, 30, 45, 25, 40, 55, 35, 20, 45, 30].map((h, i) => (
                <div key={i} className="w-2 bg-white/60 rounded-full" style={{ height: `${h}px` }} />
              ))}
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Volume2 className="h-5 w-5" />
            </div>
            <div className="mt-4 relative z-10 max-w-[65%]">
              <h3 className="font-display font-bold text-2xl sm:text-3xl mb-2">Luyện phát âm chuẩn</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-4">
                Nghe phiên âm chuẩn và luyện tập chính tả để nhớ lâu và đọc đúng.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/grades")}
                className="bg-card text-accent rounded-full px-5 py-2.5 text-sm font-bold shadow-md"
              >
                Vào làm bài chính tả
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-3xl mx-auto px-5 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-foreground mb-4">
            Các em đã sẵn sàng làm bài chưa?
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto mb-8 leading-relaxed">
            Cô Yến đã cập nhật đầy đủ bài tập và từ vựng mới cho các lớp. Các em nhớ
            hoàn thành nhiệm vụ trước hạn chót để nhận thưởng nhé!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-foreground text-background rounded-full px-8 py-4 text-base font-display font-bold inline-flex items-center gap-3 shadow-xl"
          >
            <UserCircle2 className="h-5 w-5" />
            Đăng nhập để bắt đầu
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/40 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          © 2026 Học tiếng Anh với cô Yến. Thiết kế dành riêng cho học sinh lớp 1–9.
        </p>
      </footer>
    </div>
  );
};

export default Index;
