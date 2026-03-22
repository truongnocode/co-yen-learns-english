import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { UserCircle2, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signInWithGoogle, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const grade = profile?.grade;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = user && grade
    ? [
        { label: "Bài học", to: `/grade/${grade}` },
        { label: "Tiến trình", to: "/progress" },
        { label: "Dashboard", to: "/dashboard" },
      ]
    : [
        { label: "Góc ôn tập", to: "/grades" },
        { label: "Thi đua", to: "/progress" },
        { label: "Nhiệm vụ", to: "/practice" },
      ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0, x: "-50%" }}
      animate={{ y: 0, opacity: 1, x: "-50%" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-4 left-1/2 z-50 w-full px-4"
    >
      <div
        className={`max-w-4xl mx-auto rounded-2xl w-full px-5 py-2.5 relative flex items-center justify-between gap-3 transition-all duration-400 ${
          scrolled
            ? "glass shadow-lg"
            : "glass-subtle"
        }`}
        style={{ borderBottom: scrolled ? "0.5px solid rgba(0,0,0,0.08)" : undefined }}
      >
        {/* Brand */}
        <button
          onClick={() => navigate("/")}
          className="relative z-10 flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-display font-extrabold text-xs shadow-sm">
            Y
          </div>
          <span className="font-display font-bold text-foreground text-sm hidden sm:inline">
            Cô Yến
          </span>
        </button>

        {/* Center nav */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to || location.pathname.startsWith(link.to + "/");
            return (
              <button
                key={link.to}
                onClick={() => navigate(link.to)}
                className={`text-[13px] font-bold px-3.5 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Auth */}
        {user ? (
          <div className="relative z-10 flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img
                src={user.photoURL || ""}
                alt={user.displayName || "Avatar"}
                className="w-8 h-8 rounded-lg border border-border/50 object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="hidden sm:inline text-xs font-bold text-foreground max-w-[80px] truncate">
                {user.displayName?.split(" ")[0]}
              </span>
            </button>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={signInWithGoogle}
            className="relative z-10 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0 hover:brightness-110 transition-all active:scale-[0.97]"
          >
            <UserCircle2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Đăng nhập</span>
            <span className="sm:hidden">Login</span>
          </motion.button>
        )}
      </div>
    </motion.header>
  );
};

export default Navbar;
