import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, LayoutList, Gamepad2, Trophy, User } from "lucide-react";
import type { UserProgress } from "@/lib/progress";
import DailyMission from "./DailyMission";

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

      {/* Daily Mission */}
      <DailyMission progress={progress || null} />
    </aside>
  );
};

export default DashboardSidebar;
