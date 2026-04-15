/**
 * Gate admin routes behind: (1) signed in, (2) Firebase custom claim `admin: true`.
 *
 * Custom claims live in the ID token. We read them from `user.getIdTokenResult()`
 * and cache the result for the lifetime of the component. If a teacher gets a
 * fresh admin grant while logged in, they'll need to sign out and back in (or
 * we can call `getIdToken(true)` to force refresh — see `refresh()` below).
 */

import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type AdminState = "checking" | "granted" | "denied";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [state, setState] = useState<AdminState>("checking");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setState("denied");
      return;
    }
    (async () => {
      const tokenResult = await user.getIdTokenResult();
      setState(tokenResult.claims.admin === true ? "granted" : "denied");
    })();
  }, [user, loading]);

  if (loading || state === "checking") {
    return (
      <div className="flex items-center justify-center min-h-screen text-sm text-muted-foreground">
        Đang kiểm tra quyền quản trị…
      </div>
    );
  }

  if (state === "denied") {
    if (!user) return <Navigate to="/" replace />;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-2 p-6 text-center">
        <h1 className="text-xl font-semibold">Không có quyền</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Tài khoản {user.email} không có quyền truy cập trang quản trị. Nếu bạn
          là giáo viên, liên hệ admin để được cấp quyền.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
