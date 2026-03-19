import { Home, BarChart3, ClipboardList } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", icon: Home, label: "Trang chủ" },
  { to: "/progress", icon: BarChart3, label: "Tiến trình" },
  { to: "/practice", icon: ClipboardList, label: "Luyện đề" },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-2xl border-t border-white/30 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-5 py-2 rounded-2xl transition-all duration-300 ${
                isActive
                  ? "gradient-primary text-white shadow-glow scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-bold font-display">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
