import { motion } from "framer-motion";
import GradeSelector from "@/components/GradeSelector";
import BottomNav from "@/components/BottomNav";
import { Flame, Star, Sparkles } from "lucide-react";

const floatingEmojis = ["📚", "✏️", "🌟", "🎯", "💡"];

const Index = () => {
  return (
    <div className="min-h-screen pb-20 overflow-hidden">
      {/* Hero Header */}
      <div className="gradient-hero text-primary-foreground px-5 pt-12 pb-10 rounded-b-[2.5rem] relative overflow-hidden">
        {/* Floating decorative circles */}
        <div className="absolute top-6 right-8 w-24 h-24 rounded-full bg-white/10 float-animation" />
        <div className="absolute top-20 right-24 w-12 h-12 rounded-full bg-white/10 float-animation-delay" />
        <div className="absolute bottom-4 left-8 w-16 h-16 rounded-full bg-white/10 float-animation-slow" />
        <div className="absolute top-8 left-20 w-8 h-8 rounded-full bg-white/15 float-animation-delay" />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="flex items-center justify-between mb-5 relative z-10"
        >
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl">Học tiếng Anh ✨</h1>
            <p className="text-white/80 text-sm font-display">với cô Yến 🌸</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3.5 py-2 border border-white/20">
              <Flame className="h-4 w-4 text-accent" />
              <span className="text-sm font-bold">3</span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3.5 py-2 border border-white/20">
              <Star className="h-4 w-4 text-accent" />
              <span className="text-sm font-bold">120</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Daily streak card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring" }}
          className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 relative z-10"
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl animate-wiggle">🔥</div>
            <div className="flex-1">
              <p className="text-sm font-display font-bold">Chuỗi học liên tục: 3 ngày</p>
              <p className="text-xs text-white/70">Tiếp tục cố gắng nhé! Hôm nay em ôn bài chưa?</p>
            </div>
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
        </motion.div>
      </div>

      {/* Floating emoji decorations */}
      <div className="relative">
        {floatingEmojis.map((emoji, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="absolute text-3xl select-none pointer-events-none float-animation"
            style={{
              top: `${20 + i * 60}px`,
              right: `${10 + (i % 3) * 30}px`,
              animationDelay: `${i * 0.8}s`,
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      {/* Content */}
      <div className="px-5 mt-8 relative z-10">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display font-bold text-xl text-foreground mb-5 flex items-center gap-2"
        >
          <span>🎒</span> Chọn lớp của em
        </motion.h2>
        <GradeSelector />
      </div>

      {/* Quick tip card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mx-5 mt-8 gradient-card rounded-3xl p-5 shadow-card border border-white/60"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-display font-bold text-sm text-foreground">Mẹo học tập</h3>
            <p className="text-xs text-muted-foreground mt-1">Mỗi ngày ôn 5-10 từ vựng mới. Dùng Flashcard trước, rồi làm Trắc nghiệm để kiểm tra, cuối cùng viết Chính tả để nhớ lâu!</p>
          </div>
        </div>
      </motion.div>

      <BottomNav />
    </div>
  );
};

export default Index;
