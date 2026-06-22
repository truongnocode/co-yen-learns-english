import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Flame, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getProgress, calcXP } from "@/lib/progress";
import { HUBS, activeHubKey, type NavHub } from "@/data/nav";
import { routes } from "@/data/routes";
import bearUrl from "@/assets/emoji/bear.png";

/**
 * The single navigation system for the whole app (replaces the old Navbar,
 * DashboardSidebar and DashboardMobileNav). Desktop = floating top bar with the
 * 4 hubs; mobile = persistent bottom tab bar (no hamburger for primary nav).
 * Driven entirely by src/data/nav.ts. See docs/IA-PLAN.md §3.
 */
const AppNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, logout } = useAuth();
  const isGuest = user?.isAnonymous ?? true;
  const grade = profile?.grade;
  const active = activeHubKey(location.pathname);

  // Streak + XP chips — the single gamification display in the chrome.
  const { data: progress } = useQuery({
    queryKey: ["progress", user?.uid],
    queryFn: () => getProgress(user!.uid),
    enabled: !!user && !isGuest,
    staleTime: 60_000,
  });
  const streak = progress?.dailyStreak ?? 0;
  const xp = progress ? calcXP(progress) : 0;

  // "Học" goes straight to the student's grade once one is chosen.
  const hubTo = (h: NavHub) => (h.key === "hoc" && user && grade ? routes.grade(grade) : h.to);

  return (
    <>
      {/* ── Desktop / tablet: floating top bar ── */}
      <header className="fixed top-3 left-0 right-0 z-50 px-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-2xl border border-border bg-card/95 px-3 py-2 shadow-1 backdrop-blur-sm sm:px-5">
          <button
            onClick={() => navigate(routes.home)}
            className="flex shrink-0 items-center gap-2"
            aria-label="Trang chủ"
          >
            <img src={bearUrl} alt="" className="h-9 w-9" />
            <span className="hidden font-display text-lg font-extrabold tracking-tight text-foreground sm:block">Cô Yến</span>
          </button>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
            {HUBS.map((h) => {
              const on = active === h.key;
              return (
                <button
                  key={h.key}
                  onClick={() => navigate(hubTo(h))}
                  aria-current={on ? "page" : undefined}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[15px] font-bold transition-colors ${
                    on ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <h.icon className="h-[18px] w-[18px]" aria-hidden /> {h.label}
                </button>
              );
            })}
          </nav>

          {user && !isGuest ? (
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="mr-1 hidden items-center gap-1.5 sm:flex">
                <span className="inline-flex items-center gap-1 rounded-full bg-streak/15 px-2.5 py-1 text-sm font-extrabold text-foreground" title="Chuỗi ngày học">
                  <Flame className="h-4 w-4 text-streak" aria-hidden /> {streak}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-xp/20 px-2.5 py-1 text-sm font-extrabold text-foreground" title="Điểm XP">
                  <Star className="h-4 w-4 text-xp" aria-hidden /> {xp}
                </span>
              </div>
              <button onClick={() => navigate(routes.dashboard)} className="flex items-center gap-2" aria-label="Trang cá nhân">
                <img
                  src={user.photoURL || ""}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-9 w-9 rounded-xl border border-border object-cover"
                />
                <span className="hidden max-w-[90px] truncate text-sm font-bold text-foreground sm:inline">
                  {user.displayName?.split(" ")[0]}
                </span>
              </button>
              <button
                onClick={logout}
                title="Đăng xuất"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate(routes.dashboard)}
              className="btn-press shrink-0 rounded-xl bg-primary px-4 py-2 font-display text-sm font-extrabold text-primary-foreground"
            >
              Vào học
            </button>
          )}
        </div>
      </header>

      {/* ── Mobile: persistent bottom tab bar ── */}
      <nav
        className="pb-safe fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm md:hidden"
        aria-label="Điều hướng chính"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-1">
          {HUBS.map((h) => {
            const on = active === h.key;
            return (
              <button
                key={h.key}
                onClick={() => navigate(hubTo(h))}
                aria-current={on ? "page" : undefined}
                className="flex min-h-[54px] flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 active:scale-95 transition-transform"
              >
                <span className={`flex h-7 w-12 items-center justify-center rounded-full ${on ? "bg-primary/15" : ""}`}>
                  <h.icon className={`h-[22px] w-[22px] ${on ? "text-primary" : "text-muted-foreground"}`} aria-hidden />
                </span>
                <span className={`text-[11px] font-bold ${on ? "text-primary" : "text-muted-foreground"}`}>{h.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default AppNav;
