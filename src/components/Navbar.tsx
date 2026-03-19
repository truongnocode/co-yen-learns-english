import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { UserCircle2 } from "lucide-react";

const navLinks = [
  { label: "Góc ôn tập", to: "/grades" },
  { label: "Thi đua", to: "/progress" },
  { label: "Nhiệm vụ", to: "/practice" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl"
    >
      <div className="bg-card/80 backdrop-blur-2xl rounded-full px-6 py-3 flex items-center justify-between border border-white/60 shadow-lg">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-lg shadow-md">
            Y
          </div>
          <span className="font-display font-bold text-foreground text-sm sm:text-base">
            Học tiếng anh{" "}
            <span className="text-accent">với cô Yến</span>
          </span>
        </button>

        {/* Nav Links - hidden on mobile */}
        <nav className="hidden md:flex items-center gap-6">
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

        {/* Login button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="bg-foreground text-background rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-medium flex items-center gap-2 shadow-md"
        >
          <UserCircle2 className="h-4 w-4" />
          <span className="hidden sm:inline">Đăng nhập học sinh</span>
          <span className="sm:hidden">Đăng nhập</span>
        </motion.button>
      </div>
    </motion.header>
  );
};

export default Navbar;
