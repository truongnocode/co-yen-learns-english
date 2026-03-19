import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";

const PracticePage = () => {
  return (
    <div className="min-h-screen pb-20">
      <div className="bg-primary text-primary-foreground px-5 pt-12 pb-8 rounded-b-[2rem]">
        <h1 className="font-display font-bold text-xl">Luyện đề</h1>
        <p className="text-primary-foreground/70 text-sm">Bài tập tổng hợp & đề luyện tập</p>
      </div>

      <div className="px-5 mt-6">
        <div className="bg-card rounded-2xl p-6 shadow-card text-center">
          <span className="text-4xl mb-3 block">📝</span>
          <h3 className="font-display font-bold text-foreground mb-1">Sắp ra mắt!</h3>
          <p className="text-sm text-muted-foreground">Các đề luyện tập tổng hợp sẽ được cập nhật sớm. Em hãy ôn từ vựng trước nhé!</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default PracticePage;
