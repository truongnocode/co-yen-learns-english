import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Trophy, BookOpen, Target } from "lucide-react";

const stats = [
  { icon: BookOpen, label: "Từ đã học", value: "0", gradient: "gradient-primary" },
  { icon: Target, label: "Quiz xong", value: "0", gradient: "gradient-success" },
  { icon: Trophy, label: "Điểm cao", value: "—", gradient: "gradient-accent" },
];

const ProgressPage = () => {
  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-bold text-3xl text-foreground mb-2">📊 Tiến trình của em</h1>
          <p className="text-muted-foreground mb-8">Theo dõi quá trình học tập</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-card rounded-3xl p-5 shadow-lg flex flex-col items-center text-center gap-3 border border-white/50">
              <div className={`${s.gradient} text-white p-3 rounded-2xl shadow-md`}><s.icon className="h-5 w-5" /></div>
              <span className="font-display font-bold text-2xl text-foreground">{s.value}</span>
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card rounded-3xl p-8 shadow-lg text-center border border-white/50">
          <span className="text-5xl mb-3 block">🚀</span>
          <h3 className="font-display font-bold text-xl text-foreground mb-2">Sắp ra mắt!</h3>
          <p className="text-sm text-muted-foreground">Đăng nhập bằng Gmail để lưu tiến trình và xem thống kê chi tiết nhé!</p>
        </motion.div>
      </div>
    </div>
  );
};

export default ProgressPage;
