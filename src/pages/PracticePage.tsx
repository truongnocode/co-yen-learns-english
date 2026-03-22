import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Shuffle, Headphones, PuzzleIcon, Mic } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PageShell from "@/components/PageShell";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

const games = [
  { key: "word-match", label: "Nối từ", desc: "Ghép cặp Anh-Việt nhanh nhất", icon: Shuffle, gradient: "gradient-accent" },
  { key: "listen", label: "Nghe & Chọn", desc: "Nghe phát âm, chọn nghĩa đúng", icon: Headphones, gradient: "gradient-cool" },
  { key: "sentence-puzzle", label: "Xếp câu", desc: "Sắp xếp từ thành câu hoàn chỉnh", icon: PuzzleIcon, gradient: "gradient-primary" },
  { key: "shadowing", label: "Luyện Shadowing", desc: "Nghe, nhại âm và ghi âm giọng nói", icon: Mic, gradient: "gradient-purple-card" },
];

const PracticePage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const grade = profile?.grade || 6;

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/dashboard")}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
            <Home className="h-5 w-5" />
          </motion.button>
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={smooth} className="mb-8">
          <h1 className="font-display font-extrabold text-3xl text-foreground mb-2">Trò chơi luyện tập</h1>
          <p className="text-muted-foreground text-sm">Chọn một trò chơi để ôn luyện từ vựng và ngữ pháp.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {games.map((game, i) => (
            <motion.button
              key={game.key}
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ ...smooth, delay: 0.1 + i * 0.08 }}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/practice/${game.key}/${grade}`)}
              className={`${game.gradient} text-white rounded-3xl p-6 text-left relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
              <game.icon className="h-8 w-8 mb-3 opacity-80 relative z-10" />
              <h3 className="font-display font-extrabold text-xl mb-1 relative z-10">{game.label}</h3>
              <p className="text-white/70 text-sm relative z-10">{game.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </PageShell>
  );
};

export default PracticePage;
