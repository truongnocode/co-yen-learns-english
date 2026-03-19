import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";

const PracticePage = () => {
  return (
    <div className="min-h-screen pb-20 overflow-hidden">
      <div className="gradient-cool text-white px-5 pt-12 pb-8 rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute top-6 right-10 w-20 h-20 rounded-full bg-white/10 float-animation" />
        <div className="absolute bottom-4 left-6 w-14 h-14 rounded-full bg-white/10 float-animation-slow" />
        <h1 className="font-display font-bold text-2xl relative z-10">📝 Luyện đề</h1>
        <p className="text-white/70 text-sm relative z-10">Bài tập tổng hợp & đề luyện tập</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 mt-6"
      >
        <div className="gradient-card rounded-3xl p-8 shadow-card text-center border border-white/50 relative overflow-hidden">
          <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-accent/10 float-animation" />
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }}
            className="text-6xl mb-4 block"
          >
            📋
          </motion.span>
          <h3 className="font-display font-bold text-xl text-foreground mb-2">Sắp ra mắt!</h3>
          <p className="text-sm text-muted-foreground">Các đề luyện tập tổng hợp sẽ được cập nhật sớm. Em hãy ôn từ vựng trước nhé! 💪</p>
        </div>
      </motion.div>

      <BottomNav />
    </div>
  );
};

export default PracticePage;
