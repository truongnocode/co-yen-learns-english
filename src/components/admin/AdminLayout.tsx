import { NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-6">
            <h1 className="font-semibold">Co Yến — Admin</h1>
            <nav className="flex items-center gap-4 text-sm">
              <NavLink
                to="/admin/import"
                className={({ isActive }) =>
                  isActive ? "font-medium" : "text-muted-foreground hover:text-foreground"
                }
              >
                Import
              </NavLink>
              <NavLink
                to="/admin/exams"
                className={({ isActive }) =>
                  isActive ? "font-medium" : "text-muted-foreground hover:text-foreground"
                }
              >
                Đề thi
              </NavLink>
              <NavLink
                to="/admin/analytics"
                className={({ isActive }) =>
                  isActive ? "font-medium" : "text-muted-foreground hover:text-foreground"
                }
              >
                Analytics
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
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
