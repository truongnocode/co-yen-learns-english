import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, LayoutList, Film, Gamepad2, Trophy } from "lucide-react";

const items = [
  { label: "Trang chủ", icon: Home, path: "/dashboard" },
  { label: "Bài học", icon: LayoutList, path: "/grades" },
  { label: "Video", icon: Film, path: "/video-lessons" },
  { label: "Luyện tập", icon: Gamepad2, path: "/practice" },
  { label: "Tiến trình", icon: Trophy, path: "/progress" },
];

/** Horizontal pill nav shown on phones/tablets where the desktop sidebar is hidden. */
const DashboardMobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="lg:hidden -mx-4 mb-5 px-4 sm:-mx-5 sm:px-5">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => navigate("/")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary font-display text-base font-extrabold text-primary-foreground shadow-sm active:scale-95 transition-transform"
          aria-label="Trang chủ"
        >
          Y
        </button>
        <nav className="flex items-center gap-1.5" aria-label="Điều hướng">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(item.path)}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[13px] font-bold transition-colors ${
                  active
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "bg-card/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </motion.button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default DashboardMobileNav;
