import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

/**
 * Header điều hướng THỐNG NHẤT cho mọi trang con.
 * Quy ước duy nhất toàn app: 🏠 = về Trang chủ (dashboard) · ← = Quay lại (trang trước).
 * Đừng tự chế nút home/back riêng ở từng trang nữa — luôn dùng component này.
 */
const PageBack = ({ className = "" }: { className?: string }) => {
  const navigate = useNavigate();
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={() => navigate("/dashboard")}
        aria-label="Trang chủ"
        className="rounded-xl border border-border bg-card p-2.5 text-foreground shadow-1 transition-transform active:scale-90"
      >
        <Home className="h-5 w-5" />
      </button>
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </button>
    </div>
  );
};

export default PageBack;
