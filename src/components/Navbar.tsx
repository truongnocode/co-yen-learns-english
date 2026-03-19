import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { UserCircle2, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "📚 Góc ôn tập", to: "/grades" },
  { label: "🏆 Thi đua", to: "/progress" },
  { label: "🎯 Nhiệm vụ", to: "/practice" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signInWithGoogle, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0, x: "-50%" }}
      animate={{ y: 0, opacity: 1, x: "-50%" }}
      className="fixed top-5 left-1/2 z-50 w-full px-4"
    >
      <div
        className={`max-w-5xl mx-auto rounded-full w-full px-6 py-3 relative flex items-center justify-between gap-3 transition-all duration-500 ${
          scrolled
            ? "bg-card/80 backdrop-blur-2xl shadow-xl border border-white/60"
            : "bg-card/50 backdrop-blur-lg shadow-md border border-white/40"
        }`}
      >
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="relative z-10 flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0"
        >
          <div className="w-9 h-9 rounded-full gradient-purple-card flex items-center justify-center text-primary-foreground font-display font-extrabold text-sm shadow-lg">
            Y
          </div>
          <span className="font-display font-extrabold text-foreground text-sm hidden sm:inline">
            Học tiếng anh{" "}
            <span className="gradient-text">với cô Yến</span>
          </span>
        </button>

        {/* Nav Links */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.to}
              onClick={() => navigate(link.to)}
              className={`text-sm font-bold transition-all hover:text-primary hover:scale-105 ${
                location.pathname === link.to
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Auth button */}
        {user ? (
          <div className="relative z-10 flex items-center gap-3 shrink-0">
            <img
              src={user.photoURL || ""}
              alt={user.displayName || "Avatar"}
              className="w-9 h-9 rounded-full border-2 border-primary/40 object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
            <span className="hidden sm:inline text-xs font-bold text-foreground max-w-[100px] truncate">
              {user.displayName?.split(" ")[0]}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={logout}
              className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={signInWithGoogle}
            className="relative z-10 gradient-purple-card text-white rounded-full px-5 py-2.5 text-xs sm:text-sm font-display font-extrabold flex items-center gap-2 shadow-lg shrink-0"
          >
            <UserCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Đăng nhập học sinh</span>
            <span className="sm:hidden">Đăng nhập</span>
          </motion.button>
        )}
      </div>
    </motion.header>
  );
};

export default Navbar;
