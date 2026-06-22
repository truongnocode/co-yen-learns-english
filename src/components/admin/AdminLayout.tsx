import { NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function AdminLayout() {
  const { user, logout } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "flex min-h-11 items-center rounded-xl px-3 text-base font-bold transition-colors",
      isActive
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    ].join(" ");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
            <h1 className="font-display text-lg font-bold text-foreground">Co Yến — Admin</h1>
            <nav className="-mx-1 flex items-center gap-1 overflow-x-auto px-1">
              <NavLink to="/admin/import" className={navLinkClass}>
                Import
              </NavLink>
              <NavLink to="/admin/exams" className={navLinkClass}>
                Đề thi
              </NavLink>
              <NavLink to="/admin/analytics" className={navLinkClass}>
                Analytics
              </NavLink>
              <NavLink to="/admin/video-lessons" className={navLinkClass}>
                Video
              </NavLink>
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-base">
            <NavLink
              to="/dashboard"
              className="flex min-h-11 items-center rounded-xl border border-border bg-card px-3 font-bold text-foreground transition-colors hover:bg-muted"
            >
              ← Về app
            </NavLink>
            <span className="text-muted-foreground">{user?.email}</span>
            <Button size="sm" variant="outline" onClick={logout}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
}
