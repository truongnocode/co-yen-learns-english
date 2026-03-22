import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, Gamepad2, Trophy, User, LayoutList } from "lucide-react";
import type { UserProgress } from "@/lib/progress";
import { getWeeklyMission } from "@/lib/progress";

const menuItems = [
  { label: "Trang chủ", icon: Home, path: "/dashboard" },
  { label: "Lộ trình học", icon: LayoutList, path: "/grades" },
  { label: "Trò chơi", icon: Gamepad2, path: "/practice" },
  { label: "Xếp hạng", icon: Trophy, path: "/progress" },
  { label: "Cá nhân", icon: User, path: "/dashboard#profile" },
];

interface Props {
  progress?: UserProgress | null;
}

const DashboardSidebar = ({ progress }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();

  const mission = progress ? getWeeklyMission(progress) : { completed: 0, target: 5 };
  const percent = Math.round((mission.completed / mission.target) * 100);
  const isDone = mission.completed >= mission.target;

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 sticky top-0 h-screen py-8 px-4">
      {/* Logo */}
      <button onClick={() => navigate("/")} className="flex items-center gap-2.5 px-3 mb-10 hover:opacity-80 transition-opacity">
        <div className="w-9 h-9 rounded-full gradient-purple-card flex items-center justify-center text-primary-foreground font-display font-extrabold text-sm shadow-lg">
          Y
        </div>
        <div className="leading-tight">
          <span className="font-display font-extrabold text-foreground text-sm block">Học tiếng anh</span>
          <span className="font-display font-bold text-primary text-xs">với cô Yến</span>
        </div>
      </button>

      {/* Menu */}
      <nav className="flex flex-col gap-1.5 flex-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.button
              key={item.path}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                isActive
                  ? "gradient-purple-card text-white shadow-md"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </motion.button>
          );
        })}
      </nav>

      {/* Weekly mission card */}
      <div className={`${isDone ? "gradient-success" : "gradient-warm"} rounded-2xl p-4 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
        <h4 className="font-display font-extrabold text-sm mb-1">
          {isDone ? "Hoàn thành! 🎉" : "Nhiệm vụ tuần!"}
        </h4>
        <p className="text-white/80 text-xs leading-relaxed mb-3">
          {isDone
            ? "Xuất sắc! Em đã hoàn thành nhiệm vụ tuần này."
            : "Hoàn thành 5 bài tập để nhận rương bí ẩn."}
        </p>
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-1.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-white/90 rounded-full"
          />
        </div>
        <span className="text-[10px] font-bold text-white/80">
          {mission.completed}/{mission.target} bài
        </span>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
