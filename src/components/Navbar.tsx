import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { UserCircle2, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Góc ôn tập", to: "/grades" },
  { label: "Thi đua", to: "/progress" },
  { label: "Nhiệm vụ", to: "/practice" },
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
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4"
    >
      <div
        className={`rounded-full px-5 py-2.5 flex items-center gap-6 transition-all duration-500 ${
          scrolled
            ? "bg-card/70 backdrop-blur-2xl shadow-lg border border-white/50"
            : "bg-card/40 backdrop-blur-md shadow-sm border border-white/30"
        }`}
      >
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0"
        >
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-sm shadow-md">
            Y
          </div>
          <span className="font-display font-bold text-foreground text-sm hidden sm:inline">
            Học tiếng anh{" "}
            <span className="text-accent">với cô Yến</span>
          </span>
        </button>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-5">
          {navLinks.map((link) => (
            <button
              key={link.to}
              onClick={() => navigate(link.to)}
              className={`text-sm font-medium transition-colors hover:text-primary ${
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
          <div className="flex items-center gap-3 shrink-0">
            <img
              src={user.photoURL || ""}
              alt={user.displayName || "Avatar"}
              className="w-8 h-8 rounded-full border-2 border-primary/30 object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="hidden sm:inline text-xs font-medium text-foreground max-w-[100px] truncate">
              {user.displayName?.split(" ")[0]}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={signInWithGoogle}
            className="bg-foreground text-background rounded-full px-4 py-2 text-xs sm:text-sm font-medium flex items-center gap-2 shadow-md shrink-0"
          >
            <UserCircle2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Đăng nhập học sinh</span>
            <span className="sm:hidden">Đăng nhập</span>
          </motion.button>
        )}
      </div>
    </motion.header>
  );
};

export default Navbar;
