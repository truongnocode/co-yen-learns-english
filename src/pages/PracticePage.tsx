import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PageShell from "@/components/PageShell";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

const PracticePage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={smooth}>
          <h1 className="font-display font-extrabold text-3xl text-foreground mb-2">📝 Nhiệm vụ</h1>
          <p className="text-muted-foreground mb-8">Bài tập tổng hợp & đề luyện tập</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ ...smooth, delay: 0.1 }}
          className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg text-center border border-white/60">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} className="text-6xl mb-4 block">📋</motion.span>
          <h3 className="font-display font-extrabold text-xl text-foreground mb-2">Sắp ra mắt!</h3>
          <p className="text-sm text-muted-foreground mb-6">Các đề luyện tập tổng hợp sẽ được cập nhật sớm. Em hãy ôn từ vựng trước nhé! 💪</p>
          {user && profile?.grade && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/grade/${profile.grade}`)}
              className="gradient-purple-card text-white rounded-full px-8 py-3 font-display font-extrabold shadow-lg inline-flex items-center gap-2">
              Vào ôn tập <ArrowRight className="h-4 w-4" />
            </motion.button>
          )}
        </motion.div>
      </div>
    </PageShell>
  );
};

export default PracticePage;
