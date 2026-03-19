import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { Trophy, BookOpen, Target } from "lucide-react";

const stats = [
  { icon: BookOpen, label: "Từ đã học", value: "0", color: "bg-primary/10 text-primary" },
  { icon: Target, label: "Quiz hoàn thành", value: "0", color: "bg-success/10 text-success" },
  { icon: Trophy, label: "Điểm cao nhất", value: "—", color: "bg-accent/10 text-accent" },
];

const ProgressPage = () => {
  return (
    <div className="min-h-screen pb-20">
      <div className="bg-primary text-primary-foreground px-5 pt-12 pb-8 rounded-b-[2rem]">
        <h1 className="font-display font-bold text-xl">Tiến trình của em</h1>
        <p className="text-primary-foreground/70 text-sm">Theo dõi quá trình học tập</p>
      </div>

      <div className="px-5 mt-6 grid grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-2xl p-4 shadow-card flex flex-col items-center text-center gap-2"
          >
            <div className={`${s.color} p-2.5 rounded-xl`}>
              <s.icon className="h-5 w-5" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">{s.value}</span>
            <span className="text-[11px] text-muted-foreground">{s.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="px-5 mt-8">
        <div className="bg-card rounded-2xl p-6 shadow-card text-center">
          <span className="text-4xl mb-3 block">📊</span>
          <h3 className="font-display font-bold text-foreground mb-1">Sắp ra mắt!</h3>
          <p className="text-sm text-muted-foreground">Đăng nhập bằng Gmail để lưu tiến trình học tập và xem thống kê chi tiết.</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProgressPage;
