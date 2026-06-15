import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/admin";

type AdminState = "checking" | "granted" | "denied";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading, authError, signInWithGoogle } = useAuth();
  const [state, setState] = useState<AdminState>("checking");

  useEffect(() => {
    if (loading) {
      setState("checking");
      return;
    }
    if (!user) {
      setState("denied");
      return;
    }

    let active = true;
    setState("checking");
    (async () => {
      try {
        const tokenResult = await user.getIdTokenResult(true);
        const email = typeof tokenResult.claims.email === "string" ? tokenResult.claims.email : user.email;
        if (active) setState(isAdminEmail(email) ? "granted" : "denied");
      } catch (err) {
        console.error("admin token check failed:", err);
        if (active) setState("denied");
      }
    })();

    return () => {
      active = false;
    };
  }, [user, loading]);

  if (loading || state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Đang kiểm tra quyền quản trị...
      </div>
    );
  }

  if (state === "denied") {
    const needsGoogle = !user || user.isAnonymous;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">
          {needsGoogle ? "Cần đăng nhập giáo viên" : "Không có quyền quản trị"}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {needsGoogle
            ? "Trang quản trị chỉ dành cho tài khoản Google của giáo viên có quyền admin."
            : `Tài khoản ${user.email ?? "hiện tại"} không nằm trong danh sách admin được phép.`}
        </p>
        {authError && (
          <p className="max-w-md rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {authError}
          </p>
        )}
        <button
          onClick={() => signInWithGoogle().catch((err) => console.error("admin sign-in failed:", err))}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:brightness-110"
        >
          Đăng nhập Google giáo viên
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
