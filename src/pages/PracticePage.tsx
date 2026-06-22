import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Shuffle, Headphones, PuzzleIcon, Mic, LayoutGrid, ImageIcon, Film } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PageShell from "@/components/PageShell";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

const games = [
  { key: "word-match", label: "Nối từ", desc: "Ghép cặp Anh-Việt nhanh nhất", icon: Shuffle, tone: "bg-accent text-accent-foreground" },
  { key: "listen", label: "Nghe & Chọn", desc: "Nghe phát âm, chọn nghĩa đúng", icon: Headphones, tone: "bg-accent2 text-accent2-foreground" },
  { key: "sentence-puzzle", label: "Xếp câu", desc: "Sắp xếp từ thành câu hoàn chỉnh", icon: PuzzleIcon, tone: "bg-primary text-primary-foreground" },
  { key: "shadowing", label: "Luyện Shadowing", desc: "Nghe, nhại âm và ghi âm giọng nói", icon: Mic, tone: "bg-accent2 text-accent2-foreground" },
  { key: "flashcard-match", label: "Lật Thẻ Ghép Cặp", desc: "Lật thẻ tìm cặp hình ảnh và từ tiếng Anh", icon: LayoutGrid, tone: "bg-accent text-accent-foreground" },
  { key: "listen-picture", label: "Nghe và Chọn Tranh", desc: "Nghe từ tiếng Anh và chọn tranh đúng", icon: ImageIcon, tone: "bg-accent2 text-accent2-foreground" },
  { key: "video-lessons", label: "Học thuộc video", desc: "Nghe video, nhại theo, che chữ rồi đọc thuộc", icon: Film, tone: "bg-success text-success-foreground" },
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
            className="p-2.5 rounded-xl bg-card shadow-1 text-foreground border border-border">
            <Home className="h-5 w-5" />
          </motion.button>
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={smooth} className="mb-8">
          <h1 className="font-display font-extrabold text-3xl text-foreground mb-2">Trò chơi luyện tập</h1>
          <p className="text-muted-foreground text-base">Chọn một trò chơi để ôn luyện từ vựng và ngữ pháp.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game, i) => (
            <motion.button
              key={game.key}
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ ...smooth, delay: 0.1 + i * 0.08 }}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(game.key === "video-lessons" ? "/video-lessons" : `/practice/${game.key}/${grade}`)}
              className={`${game.tone} rounded-2xl p-6 text-left relative overflow-hidden shadow-1 transition-all hover:-translate-y-0.5 hover:shadow-2`}
            >
              <game.icon className="h-8 w-8 mb-3 opacity-90 relative z-10" />
              <h3 className="font-display font-extrabold text-lg sm:text-xl mb-1 relative z-10">{game.label}</h3>
              <p className="opacity-80 text-sm relative z-10">{game.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </PageShell>
  );
};

export default PracticePage;
