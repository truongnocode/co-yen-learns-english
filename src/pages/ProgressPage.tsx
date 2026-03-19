import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { Trophy, BookOpen, Target } from "lucide-react";

const stats = [
  { icon: BookOpen, label: "Từ đã học", value: "0", gradient: "gradient-primary" },
  { icon: Target, label: "Quiz xong", value: "0", gradient: "gradient-success" },
  { icon: Trophy, label: "Điểm cao", value: "—", gradient: "gradient-accent" },
];

const ProgressPage = () => {
  return (
    <div className="min-h-screen pb-20 overflow-hidden">
      <div className="gradient-hero text-white px-5 pt-12 pb-8 rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute top-6 right-8 w-20 h-20 rounded-full bg-white/10 float-animation" />
        <div className="absolute bottom-4 left-10 w-12 h-12 rounded-full bg-white/10 float-animation-delay" />
        <h1 className="font-display font-bold text-2xl relative z-10">📊 Tiến trình của em</h1>
        <p className="text-white/70 text-sm relative z-10">Theo dõi quá trình học tập</p>
      </div>

      <div className="px-5 mt-6 grid grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring" }}
            className="gradient-card rounded-3xl p-4 shadow-card hover:shadow-card-hover transition-shadow flex flex-col items-center text-center gap-2 border border-white/50"
          >
            <div className={`${s.gradient} text-white p-3 rounded-2xl shadow-md`}>
              <s.icon className="h-5 w-5" />
            </div>
            <span className="font-display font-bold text-2xl text-foreground">{s.value}</span>
            <span className="text-[11px] text-muted-foreground font-medium">{s.label}</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-5 mt-8"
      >
        <div className="gradient-card rounded-3xl p-6 shadow-card text-center border border-white/50 relative overflow-hidden">
          <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-primary/5 float-animation" />
          <span className="text-5xl mb-3 block">🚀</span>
          <h3 className="font-display font-bold text-lg text-foreground mb-2">Sắp ra mắt!</h3>
          <p className="text-sm text-muted-foreground">Đăng nhập bằng Gmail để lưu tiến trình và xem thống kê chi tiết nhé!</p>
        </div>
      </motion.div>

      <BottomNav />
    </div>
  );
};

export default ProgressPage;
