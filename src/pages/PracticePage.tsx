import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Home,
  Shuffle,
  Headphones,
  PuzzleIcon,
  Mic,
  LayoutGrid,
  Camera,
  RotateCcw,
  FilePlus2,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PageShell from "@/components/PageShell";

const smooth = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

const PracticePage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const grade = profile?.grade || 6;

  const games = [
    { label: "Nối từ", desc: "Ghép cặp Anh – Việt thật nhanh", icon: Shuffle, to: `/practice/word-match/${grade}`, tone: "bg-accent text-accent-foreground" },
    { label: "Nghe & Chọn", desc: "Nghe phát âm, chọn nghĩa hoặc tranh đúng", icon: Headphones, to: `/practice/listen/${grade}`, tone: "bg-accent2 text-accent2-foreground" },
    { label: "Xếp câu", desc: "Sắp xếp từ thành câu hoàn chỉnh", icon: PuzzleIcon, to: `/practice/sentence-puzzle/${grade}`, tone: "bg-primary text-primary-foreground" },
    { label: "Lật thẻ ghép cặp", desc: "Lật thẻ tìm cặp hình ảnh và từ", icon: LayoutGrid, to: `/practice/flashcard-match/${grade}`, tone: "bg-accent text-accent-foreground" },
    { label: "Luyện nói (Shadowing)", desc: "Nghe, nhại âm và tự ghi âm giọng nói", icon: Mic, to: `/practice/shadowing/${grade}`, tone: "bg-primary text-primary-foreground" },
    { label: "Camera tương tác", desc: "Trả lời bằng cử chỉ trước camera", icon: Camera, to: `/practice/camera/${grade}`, tone: "bg-accent2 text-accent2-foreground" },
  ];

  const review = [
    { label: "Ôn từ vựng thông minh", desc: "Học lại đúng lúc sắp quên (SRS)", icon: RotateCcw, to: "/practice/srs-review", tone: "bg-success text-success-foreground" },
    { label: "Tạo đề kiểm tra", desc: `Tự chọn nội dung lớp ${grade}, làm bài chấm điểm`, icon: FilePlus2, to: "/test/custom", tone: "bg-primary text-primary-foreground" },
    // "Đề thi vào lớp 10" chỉ hợp với học sinh lớp 10 — học sinh lớp khác không thấy.
    ...(grade === 10
      ? [{ label: "Đề thi vào lớp 10", desc: "Đề thi thử có chấm điểm & chữa chi tiết", icon: GraduationCap, to: "/grade/10/tests", tone: "bg-accent text-accent-foreground" }]
      : []),
  ];

  const Card = ({ item, delay }: { item: (typeof games)[number]; delay: number }) => (
    <motion.button
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ ...smooth, delay }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(item.to)}
      className={`${item.tone} rounded-2xl p-5 text-left shadow-1 transition-all hover:-translate-y-0.5 hover:shadow-2`}
    >
      <item.icon className="mb-3 h-8 w-8 opacity-90" />
      <h3 className="mb-1 font-display text-lg font-extrabold sm:text-xl">{item.label}</h3>
      <p className="text-sm opacity-90">{item.desc}</p>
    </motion.button>
  );

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-5 pb-20 pt-28">
        <div className="mb-6 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/dashboard")}
            className="rounded-xl border border-border bg-card p-2.5 text-foreground shadow-1"
            aria-label="Trang chủ"
          >
            <Home className="h-5 w-5" />
          </motion.button>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={smooth} className="mb-8">
          <h1 className="mb-2 font-display text-3xl font-extrabold text-foreground">Luyện tập</h1>
          <p className="text-base text-muted-foreground">Chơi để nhớ từ, ôn lại điều sắp quên, và thử sức với đề kiểm tra.</p>
        </motion.div>

        <section className="mb-10">
          <h2 className="mb-3 font-display text-xl font-extrabold text-foreground">Trò chơi</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((item, i) => (
              <Card key={item.label} item={item} delay={i * 0.05} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl font-extrabold text-foreground">Ôn tập & Kiểm tra</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {review.map((item, i) => (
              <Card key={item.label} item={item} delay={i * 0.05} />
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
};

export default PracticePage;
