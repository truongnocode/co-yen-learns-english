import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isOnboarded } from "@/lib/progress";

// Paths that never require onboarding: the splash, the wizard itself, the
// teacher's admin area. Everything else (học tập) is gated.
const ALLOW = new Set(["/", "/onboarding"]);

/**
 * Bắt buộc tạo tài khoản (Tên + Lớp + SĐT) trước khi vào bất kỳ nội dung học nào.
 * Rendered once inside the router; redirects an incomplete profile to /onboarding.
 */
const OnboardingGate = () => {
  const { user, profile, loading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (pathname.startsWith("/admin")) return;
    if (ALLOW.has(pathname)) return;
    if (user && profile && !isOnboarded(profile)) {
      navigate("/onboarding", { replace: true });
    }
  }, [loading, user, profile, pathname, navigate]);

  return null;
};

export default OnboardingGate;
