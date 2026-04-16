import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Rocket, Sparkles, Camera, GraduationCap, Mic, Map, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GradeSelectDialog from "@/components/GradeSelectDialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, signInWithGoogle, selectGrade } = useAuth();
  const [showGradeSelect, setShowGradeSelect] = useState(false);
  const grade = profile?.grade;

  const handleCTA = useCallback(async () => {
    if (!user) {
      try {
        await signInWithGoogle();
      } catch (err) {
        console.error("Sign-in failed:", err);
        toast({
          title: "Đăng nhập thất bại",
          description: "Vui lòng cho phép popup hoặc thử lại.",
          variant: "destructive",
        });
        return;
      }
      return;
    }
    if (!grade) { setShowGradeSelect(true); } else { navigate("/dashboard"); }
  }, [user, grade, signInWithGoogle, navigate]);

  // Nav links should always navigate — browsing should NOT require login.
  // Protected pages handle their own auth gating.
  const smartNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleGradeSelected = async (g: number) => {
    await selectGrade(g);
    setShowGradeSelect(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen overflow-x-hidden gradient-hero">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="max-w-7xl mx-auto glass px-6 py-3 flex justify-between items-center !rounded-full">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <span className="text-3xl">🚀</span>
            <span className="text-xl font-black text-indigo-900 tracking-tight hidden sm:block font-display">Học cùng cô Yến</span>
          </div>
          <div className="hidden md:flex gap-6 font-bold text-indigo-800">
            <button onClick={() => smartNavigate("/grades")} className="hover:text-pink-500 transition-colors">Tính năng</button>
            <button onClick={() => smartNavigate("/grades?level=primary")} className="hover:text-pink-500 transition-colors">Cấp 1 (Lớp 3-5)</button>
            <button onClick={() => smartNavigate("/grades?level=secondary")} className="hover:text-pink-500 transition-colors">Cấp 2 (Lớp 6-9)</button>
            <button onClick={() => smartNavigate("/grade/10")} className="hover:text-pink-500 transition-colors">Thi vào 10</button>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleCTA}
            className="bg-white hover:bg-indigo-50 text-indigo-600 font-bold py-2 px-6 rounded-full border-2 border-indigo-100 shadow-sm transition-all flex items-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-4 h-4" />
            {user ? "Vào học" : "Đăng nhập"}
          </motion.button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ ...smooth, delay: 0.2 }}
            className="relative z-10 text-center lg:text-left">
            <div className="inline-block bg-white/70 text-indigo-800 text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-6 shadow-sm border border-white">
              🎯 Dành cho học sinh Tiểu học & THCS (Lớp 3 - Lớp 10)
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-indigo-950 leading-tight mb-6 drop-shadow-sm font-display">
              Học Tiếng Anh <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500">Vui Như Chơi Game!</span>
            </h1>
            <p className="text-xl text-indigo-800 font-semibold mb-10 max-w-2xl mx-auto lg:mx-0">
              Bám sát sách giáo khoa iLearn Smart Start & Global Success. Luyện phát âm chuẩn Anh-Mỹ với phòng thu AI và chinh phục điểm 8.0+ kỳ thi vào lớp 10.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleCTA}
                className="btn-playful py-4 px-8 text-xl font-black flex items-center justify-center gap-3">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-6 h-6 bg-white rounded-full p-1" />
                {user ? (grade ? "Vào lớp học" : "Chọn lớp") : "Bắt đầu miễn phí"}
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => smartNavigate("/grades")}
                className="bg-white/80 text-indigo-600 border-2 border-white rounded-full shadow-[0_4px_0_#d1d5db] active:translate-y-1 active:shadow-[0_0_0_#d1d5db] py-4 px-8 text-xl font-bold flex items-center justify-center gap-2 transition-all">
                ▶️ Xem lộ trình học
              </motion.button>
            </div>
            <div className="mt-10 flex items-center justify-center lg:justify-start gap-4 text-indigo-900 font-bold">
              <div className="flex -space-x-3">
                {["A", "B", "C"].map((s) => (
                  <img key={s} className="w-10 h-10 rounded-full border-2 border-white" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`} alt="user" />
                ))}
              </div>
              <p>Hơn <span className="text-pink-600">500+</span> học sinh đang học mỗi ngày</p>
            </div>
          </motion.div>

          {/* Right — floating cards */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}
            className="relative hidden md:block h-[500px]">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/40 rounded-full blur-3xl" />
            <motion.div animate={{ y: [0, -20, 0], rotate: [6, 8, 6] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 right-10 glass !rounded-2xl p-4 shadow-xl rotate-6 !transform-none" style={{ transform: "rotate(6deg)" }}>
              <div className="text-4xl text-center mb-1">🔥</div>
              <div className="font-black text-orange-500">Chuỗi 30 ngày!</div>
            </motion.div>
            <motion.div animate={{ y: [0, -15, 0], rotate: [-3, -5, -3] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 3 }}
              className="absolute bottom-20 right-0 glass !rounded-2xl p-6 shadow-xl z-20" style={{ transform: "rotate(-3deg)" }}>
              <div className="font-bold text-indigo-900 mb-2">🎤 Luyện nói (98% chính xác)</div>
              <div className="w-48 h-3 bg-white/50 rounded-full overflow-hidden">
                <div className="w-[98%] h-full bg-gradient-to-r from-green-400 to-blue-500" />
              </div>
            </motion.div>
            <motion.div animate={{ y: [0, -18, 0], rotate: [-6, -4, -6] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute top-32 left-0 glass !rounded-2xl p-5 shadow-xl z-10" style={{ transform: "rotate(-6deg)" }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-black">A+</div>
                <div>
                  <div className="font-black text-indigo-900">Bài thi lớp 9</div>
                  <div className="text-sm font-bold text-green-500">Hoàn thành xuất sắc</div>
                </div>
              </div>
            </motion.div>
            <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[180px] drop-shadow-2xl select-none">
              🦊
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* ─── Features Bento ─── */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={smooth}
          className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-black text-indigo-950 mb-4 font-display">Hệ sinh thái học tập toàn diện</h2>
          <p className="text-lg text-indigo-800 font-semibold max-w-2xl mx-auto">Mọi công cụ em cần để giỏi tiếng Anh đều nằm gọn trong các nhiệm vụ hàng ngày.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Microlearning */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...smooth, delay: 0.1 }}
            onClick={() => smartNavigate(grade ? `/grade/${grade}` : "/grades")}
            className="glass p-8 flex flex-col justify-between group cursor-pointer">
            <div>
              <div className="w-14 h-14 bg-white/80 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="text-2xl font-black text-indigo-900 mb-3 font-display">Microlearning 10 phút</h3>
              <p className="text-indigo-800 font-medium">Kiến thức SGK được chia nhỏ thành các video hoạt hình và game tương tác. Học nhanh, nhớ lâu, không hề buồn ngủ.</p>
            </div>
          </motion.div>

          {/* Shadowing — large */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...smooth, delay: 0.2 }}
            onClick={() => smartNavigate(grade ? `/grade/${grade}` : "/grades")}
            className="glass p-8 md:col-span-2 relative overflow-hidden group cursor-pointer">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 group-hover:bg-pink-400 transition-colors duration-700" />
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <div className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-4">Công nghệ lõi</div>
                <h3 className="text-3xl font-black text-indigo-900 mb-3 font-display">Phòng thu Shadowing</h3>
                <p className="text-indigo-800 font-medium mb-6">Nghe người bản xứ nói và nhại lại theo thời gian thực. Âm thanh tự động gửi về Google Drive cho cô giáo chấm!</p>
                <span className="bg-indigo-900 text-white font-bold py-2 px-6 rounded-full inline-flex items-center gap-2">
                  <Mic className="h-4 w-4" /> Thử thu âm ngay
                </span>
              </div>
              <div className="bg-white/60 p-4 rounded-2xl border border-white w-full md:w-64 text-center shadow-sm">
                <p className="font-bold text-lg mb-4">
                  <span className="text-gray-400">"Nice to</span>{" "}
                  <span className="text-blue-600">meet you!"</span>
                </p>
                <div className="flex justify-center items-end gap-1.5 h-12">
                  {[15, 25, 40, 20, 30].map((h, i) => (
                    <div key={i} className="w-1.5 rounded-full bg-gradient-to-t from-blue-400 to-cyan-300 sound-wave" style={{ height: `${h}px`, animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Adventure Map — large */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...smooth, delay: 0.3 }}
            onClick={() => smartNavigate("/progress")}
            className="glass p-8 md:col-span-2 bg-gradient-to-br from-white/40 to-yellow-100/40 relative overflow-hidden group cursor-pointer">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-3xl font-black text-indigo-900 font-display">Bản đồ phiêu lưu & đua top</h3>
                <span className="text-4xl group-hover:rotate-12 transition-transform">🏆</span>
              </div>
              <p className="text-indigo-800 font-medium w-3/4">Tạm biệt danh sách bài tập nhàm chán. Mỗi bài học là một vùng đất cần khám phá. Cày XP, lên hạng giải đấu và sắm đồ cho avatar.</p>
            </div>
            <div className="absolute right-0 bottom-0 opacity-20 text-9xl transform translate-x-1/4 translate-y-1/4 select-none">🗺️</div>
          </motion.div>

          {/* Grade 10 Exam */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...smooth, delay: 0.4 }}
            onClick={() => smartNavigate("/grade/10")}
            className="glass p-8 bg-gradient-to-br from-white/40 to-red-100/40 flex flex-col justify-between group cursor-pointer">
            <div>
              <div className="w-14 h-14 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm group-hover:scale-110 transition-transform">🎯</div>
              <h3 className="text-2xl font-black text-indigo-900 mb-3 font-display">Đấu trường lớp 9</h3>
              <p className="text-indigo-800 font-medium">Giả lập áp lực phòng thi 60 phút. Hệ thống tự phân tích "lỗ hổng" ngữ pháp và đề xuất bài học bổ trợ.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Games Section ─── */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={smooth}
          className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-black text-indigo-950 mb-4 font-display">Trò chơi học tiếng Anh</h2>
          <p className="text-lg text-indigo-800 font-semibold max-w-2xl mx-auto">Vừa chơi vừa học — ghi nhớ từ vựng nhanh gấp 3 lần!</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...smooth, delay: 0.1 }}
            onClick={() => smartNavigate(grade ? `/practice/flashcard-match/${grade}` : "/grades")}
            className="glass p-8 bg-gradient-to-br from-white/40 to-pink-100/40 group cursor-pointer hover:shadow-xl transition-shadow">
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform text-center">🃏</div>
            <h3 className="text-xl font-black text-indigo-900 mb-2 font-display text-center">Lật Thẻ Ghép Cặp</h3>
            <p className="text-indigo-800 font-medium text-center text-sm">Lật thẻ tìm cặp emoji và từ tiếng Anh. Rèn trí nhớ siêu tốc!</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...smooth, delay: 0.2 }}
            onClick={() => smartNavigate(grade ? `/practice/listen-picture/${grade}` : "/grades")}
            className="glass p-8 bg-gradient-to-br from-white/40 to-blue-100/40 group cursor-pointer hover:shadow-xl transition-shadow">
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform text-center">🖼️</div>
            <h3 className="text-xl font-black text-indigo-900 mb-2 font-display text-center">Nghe và Chọn Tranh</h3>
            <p className="text-indigo-800 font-medium text-center text-sm">Nghe từ tiếng Anh chuẩn và chọn tranh đúng. Luyện tai nghe từ nhỏ!</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...smooth, delay: 0.3 }}
            onClick={() => smartNavigate("/pet")}
            className="glass p-8 bg-gradient-to-br from-white/40 to-amber-100/40 group cursor-pointer hover:shadow-xl transition-shadow">
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform text-center">🐾</div>
            <h3 className="text-xl font-black text-indigo-900 mb-2 font-display text-center">Nuôi Thú Ảo</h3>
            <p className="text-indigo-800 font-medium text-center text-sm">Nhận nuôi thú cưng và cho ăn bằng điểm học tập. Xem bạn nhỏ tiến hóa!</p>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="text-center py-8 text-indigo-800 font-bold border-t border-white/30">
        <p>© 2026 Học tiếng Anh cùng cô Yến · Tích hợp Google Workspace ❤️</p>
      </footer>

      <GradeSelectDialog open={showGradeSelect} onSelect={handleGradeSelected} />
    </div>
  );
};

export default Index;
