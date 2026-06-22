import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Zap, Award, Flame, Star, LogOut, Pencil, Camera, X, Check } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { gradeConfig } from "@/data/types";
import { updateUserProfile, calcXP } from "@/lib/progress";
import type { UserProgress } from "@/lib/progress";
import { toast } from "sonner";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

interface Props {
  progress: UserProgress | null;
}

const LearningOverview = ({ progress }: Props) => {
  const { user, profile, logout, refreshProfile } = useAuth();
  const grade = profile?.grade || 6;
  const cfg = gradeConfig[grade];
  const streak = progress?.dailyStreak || 0;
  const xp = progress ? calcXP(progress) : 0;

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const wordsLearned = progress?.wordsLearned?.length || 0;
  const quizzesDone = progress?.quizzesDone || 0;

  const getTitle = () => {
    if (xp >= 2000) return "Chiến binh ngữ pháp";
    if (xp >= 1000) return "Nhà thám hiểm";
    if (xp >= 500) return "Học giả nhí";
    return "Tân binh";
  };

  const openEdit = () => {
    setEditName(user?.displayName || "");
    setEditPhoto(user?.photoURL || "");
    setPreviewUrl(null);
    setEditing(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);
      setEditPhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: editName.trim() || user.displayName,
        photoURL: editPhoto || user.photoURL,
      });
      // Update Firestore profile
      await updateUserProfile(user.uid, {
        displayName: editName.trim() || user.displayName || "",
        photoURL: editPhoto || user.photoURL || "",
      });
      await refreshProfile();
      // Force re-render by reloading user
      toast.success("Đã cập nhật hồ sơ!");
      setEditing(false);
    } catch {
      toast.error("Lỗi khi cập nhật hồ sơ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...smooth, delay: 0.25 }}
      className="flex flex-col gap-4"
    >
      <div className="bg-card border border-border shadow-1 rounded-2xl p-5">
        {/* Top row: actions */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-extrabold text-sm text-foreground">Tổng quan</h2>
          <div className="flex items-center gap-1">
            {user && !user.isAnonymous && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={logout}
                className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Avatar + name */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative shrink-0 group">
            <div className="w-14 h-14 rounded-xl bg-primary/10 p-[2px]">
              <img
                src={user?.photoURL || ""}
                alt="Avatar"
                className="w-full h-full rounded-xl object-cover border-2 border-card"
                referrerPolicy="no-referrer"
              />
            </div>
            <button
              onClick={openEdit}
              className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            >
              <Camera className="h-4 w-4 text-white" />
            </button>
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-streak text-streak-foreground flex items-center justify-center shadow-1">
              <span className="text-[10px]">🔥</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-display font-extrabold text-base text-foreground truncate">
                {user?.displayName?.split(" ").slice(-2).join(" ") || "Học sinh"}
              </h3>
              <button onClick={openEdit} className="p-1 rounded-full hover:bg-muted/60 transition-colors shrink-0">
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-bold text-primary">{getTitle()}</span>
            </div>
          </div>
        </div>

        {/* Edit Profile Dialog */}
        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-muted/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Chỉnh sửa hồ sơ</span>
                  <button onClick={() => setEditing(false)} className="p-1 rounded-full hover:bg-muted/60">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>

                {/* Avatar change */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent2 p-[2px] shadow-1 shrink-0">
                    <img
                      src={previewUrl || editPhoto || ""}
                      alt="Preview"
                      className="w-full h-full rounded-xl object-cover border-2 border-card"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Đổi ảnh đại diện
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Tên hiển thị
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-primary/50 transition-colors"
                    placeholder="Nhập tên của em..."
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-primary text-primary-foreground rounded-2xl py-2.5 text-xs font-display font-extrabold shadow-1 flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : <><Check className="h-3.5 w-3.5" /> Lưu thay đổi</>}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
          <div className="bg-muted/40 rounded-xl px-2 py-3 text-center">
            <span className="text-lg block mb-0.5">{cfg.emoji}</span>
            <span className="text-[10px] font-bold text-muted-foreground block">{cfg.label}</span>
          </div>
          <div className="bg-muted/40 rounded-xl px-2 py-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Flame className="h-4 w-4 text-streak" />
              <span className="font-display font-extrabold text-base text-foreground">{streak}</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground block">Streak</span>
          </div>
          <div className="bg-muted/40 rounded-xl px-2 py-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Star className="h-4 w-4 text-xp" />
              <span className="font-display font-extrabold text-base text-foreground">{xp}</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground block">XP</span>
          </div>
        </div>

        <div className="h-px bg-border mb-4" />

        {/* Thành tích thật — chỉ số có nguồn, không bịa */}
        <h3 className="font-display font-extrabold text-xs text-muted-foreground uppercase tracking-wider mb-3">
          Thành tích
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/40 rounded-xl px-3 py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="font-display font-extrabold text-lg text-foreground">{wordsLearned}</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground block">Từ đã học</span>
          </div>
          <div className="bg-muted/40 rounded-xl px-3 py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <Zap className="h-4 w-4 text-accent" />
              <span className="font-display font-extrabold text-lg text-foreground">{quizzesDone}</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground block">Bài đã làm</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LearningOverview;
