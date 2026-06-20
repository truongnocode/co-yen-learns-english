import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { UserCircle2, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const grade = profile?.grade;
  const isGuest = user?.isAnonymous ?? true;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = user && grade
    ? [
        { label: "Bài học", to: `/grade/${grade}` },
        { label: "Video", to: "/video-lessons" },
        { label: "Tiến trình", to: "/progress" },
        { label: "Dashboard", to: "/dashboard" },
      ]
    : [
        { label: "Cấp 1", to: "/grades?level=primary" },
        { label: "Cấp 2", to: "/grades?level=secondary" },
        { label: "Thi vào 10", to: "/grade/10" },
      ];

  const isLinkActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to.split("?")[0] + "/");

  // Navigate then close the mobile drawer.
  const goMobile = (to: string) => {
    setMenuOpen(false);
    navigate(to);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0, x: "-50%" }}
      animate={{ y: 0, opacity: 1, x: "-50%" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-4 left-1/2 z-50 w-full px-4"
    >
      <div
        className={`max-w-4xl mx-auto rounded-2xl w-full px-3 sm:px-5 py-2 sm:py-2.5 relative flex items-center justify-between gap-2 transition-all duration-400 ${
          scrolled
            ? "glass shadow-lg"
            : "glass-subtle"
        }`}
        style={{ borderBottom: scrolled ? "0.5px solid rgba(0,0,0,0.08)" : undefined }}
      >
        {/* Mobile: hamburger that opens the nav drawer */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="md:hidden flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-foreground active:scale-95 transition-transform"
              aria-label="Mở menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[82vw] max-w-xs p-0" aria-describedby={undefined}>
            <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-2.5 px-5 pt-6 pb-5 border-b border-border/40">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-display font-extrabold text-sm shadow-sm">
                  Y
                </div>
                <span className="font-display font-bold text-foreground text-base">Cô Yến</span>
              </div>

              <nav className="flex flex-col gap-1 p-3" aria-label="Chính">
                {navLinks.map((link) => {
                  const active = isLinkActive(link.to);
                  return (
                    <button
                      key={link.to}
                      onClick={() => goMobile(link.to)}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-12 items-center rounded-xl px-4 text-base font-bold transition-colors active:scale-[0.98] ${
                        active
                          ? "bg-primary/10 text-primary dark:bg-primary/20"
                          : "text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      {link.label}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-auto border-t border-border/40 p-3">
                {user && !isGuest ? (
                  <div className="flex items-center justify-between gap-2 px-2">
                    <button
                      onClick={() => goMobile("/dashboard")}
                      className="flex min-h-12 items-center gap-2.5 rounded-xl pr-3 text-left"
                    >
                      <img
                        src={user.photoURL || ""}
                        alt={user.displayName || "Avatar"}
                        className="w-9 h-9 rounded-lg border border-border/50 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-sm font-bold text-foreground max-w-[120px] truncate">
                        {user.displayName?.split(" ")[0] ?? "Học sinh"}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Đăng xuất
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => goMobile("/dashboard")}
                    className="flex min-h-12 w-full items-center gap-2 rounded-xl px-4 text-base font-bold text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <UserCircle2 className="h-5 w-5" /> Trang cá nhân
                  </button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

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

        {/* Center nav (desktop) */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = isLinkActive(link.to);
            return (
              <button
                key={link.to}
                onClick={() => navigate(link.to)}
                aria-current={isActive ? "page" : undefined}
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

        {/* Auth: anonymous guest gets a quiet icon; signed-in Google user gets avatar + logout */}
        {user && !isGuest ? (
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
              className="hidden md:flex p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate("/dashboard")}
            className="relative z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors shrink-0"
            title="Trang cá nhân"
          >
            <UserCircle2 className="h-5 w-5" />
            <span className="hidden sm:inline text-xs font-bold">Học sinh</span>
          </button>
        )}
      </div>
    </motion.header>
  );
};

export default Navbar;
