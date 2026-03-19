import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

const PracticePage = () => {
  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-bold text-3xl text-foreground mb-2">📝 Nhiệm vụ</h1>
          <p className="text-muted-foreground mb-8">Bài tập tổng hợp & đề luyện tập</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-3xl p-8 shadow-lg text-center border border-white/50">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }} className="text-6xl mb-4 block">📋</motion.span>
          <h3 className="font-display font-bold text-xl text-foreground mb-2">Sắp ra mắt!</h3>
          <p className="text-sm text-muted-foreground">Các đề luyện tập tổng hợp sẽ được cập nhật sớm. Em hãy ôn từ vựng trước nhé! 💪</p>
        </motion.div>
      </div>
    </div>
  );
};

export default PracticePage;
