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
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-display font-extrabold text-sm shadow-sm">
          Y
        </div>
        <div className="leading-tight">
          <span className="font-display font-bold text-foreground text-sm block">Học tiếng anh</span>
          <span className="font-display font-semibold text-primary text-xs">với cô Yến</span>
        </div>
      </button>

      {/* Menu */}
      <nav className="flex flex-col gap-1 flex-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${
                isActive
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-foreground"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" />
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
