import { motion } from "framer-motion";
import GradeSelector from "@/components/GradeSelector";
import BottomNav from "@/components/BottomNav";
import { Flame, Star } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-5 pt-12 pb-8 rounded-b-[2rem]">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div>
            <h1 className="font-display font-bold text-xl">Học tiếng Anh</h1>
            <p className="text-primary-foreground/80 text-sm">với cô Yến 🌸</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-primary-foreground/20 rounded-full px-3 py-1.5">
              <Flame className="h-4 w-4 text-accent" />
              <span className="text-sm font-bold">3</span>
            </div>
            <div className="flex items-center gap-1 bg-primary-foreground/20 rounded-full px-3 py-1.5">
              <Star className="h-4 w-4 text-accent" />
              <span className="text-sm font-bold">120</span>
            </div>
          </div>
        </motion.div>

        {/* Daily streak card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-primary-foreground/15 backdrop-blur-sm rounded-2xl p-4"
        >
          <p className="text-sm font-display font-semibold mb-1">🔥 Chuỗi học liên tục: 3 ngày</p>
          <p className="text-xs text-primary-foreground/70">Tiếp tục cố gắng nhé! Hôm nay em ôn bài chưa?</p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="px-5 mt-6">
        <h2 className="font-display font-bold text-lg text-foreground mb-4">Chọn lớp của em</h2>
        <GradeSelector />
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
