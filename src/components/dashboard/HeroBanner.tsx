import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import foxMascot from "@/assets/fox-mascot.png";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

const HeroBanner = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const grade = profile?.grade || 6;
  const name = user?.displayName?.split(" ").pop() || "Học sinh";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={smooth}
      className="gradient-purple-card rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden min-h-[200px] flex items-center mb-8"
    >
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-60 h-60 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

      <div className="relative z-10 flex-1">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-3 drop-shadow-sm">
          Chào {name}! 👋
        </h1>
        <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-md mb-5 font-medium">
          Hôm nay chúng ta sẽ tiếp tục luyện tập bài <strong className="text-white">Unit 1: My New School</strong> nhé. Em đã sẵn sàng chưa?
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/grade/${grade}`)}
          className="bg-white text-primary font-display font-extrabold text-sm rounded-full px-6 py-3 inline-flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Play className="h-4 w-4 fill-primary" />
          Học tiếp ngay
        </motion.button>
      </div>

      {/* Mascot */}
      <img
        src={foxMascot}
        alt="Mascot"
        className="absolute right-4 bottom-0 w-32 sm:w-44 opacity-95 drop-shadow-2xl hidden sm:block"
      />
    </motion.div>
  );
};

export default HeroBanner;
