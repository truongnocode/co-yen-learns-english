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
      <div className="flex min-h-screen items-center justify-center bg-background text-base text-muted-foreground">
        Đang kiểm tra quyền quản trị...
      </div>
    );
  }

  if (state === "denied") {
    const needsGoogle = !user || user.isAnonymous;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center shadow-1">
          <h1 className="font-display text-xl font-bold text-foreground">
            {needsGoogle ? "Cần đăng nhập giáo viên" : "Không có quyền quản trị"}
          </h1>
          <p className="text-base text-muted-foreground">
            {needsGoogle
              ? "Trang quản trị chỉ dành cho tài khoản Google của giáo viên có quyền admin."
              : `Tài khoản ${user.email ?? "hiện tại"} không nằm trong danh sách admin được phép.`}
          </p>
          {authError && (
            <p className="w-full rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-base text-destructive">
              {authError}
            </p>
          )}
          <button
            onClick={() => signInWithGoogle().catch((err) => console.error("admin sign-in failed:", err))}
            className="min-h-11 rounded-xl bg-primary px-5 py-2.5 text-base font-bold text-primary-foreground transition-all hover:brightness-110"
          >
            Đăng nhập Google giáo viên
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
