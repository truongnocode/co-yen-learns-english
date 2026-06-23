import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpenText,
  Camera,
  Headphones,
  Mic,
  Shuffle,
  LayoutGrid,
  PuzzleIcon,
  RotateCcw,
  FilePlus2,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PageShell from "@/components/PageShell";
import PageBack from "@/components/PageBack";

const smooth = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

const PracticePage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const grade = profile?.grade || 6;

  // Nổi bật ở trước: Luyện đọc (video) + Camera tương tác.
  const featured = [
    { label: "Luyện đọc theo video", desc: "Xem video, đọc thuộc lời thoại đúng nhịp người bản xứ.", icon: BookOpenText, to: "/video-lessons", tone: "bg-accent2 text-accent2-foreground" },
    { label: "Camera tương tác", desc: "Trả lời bằng cử chỉ cơ thể trước camera — vừa học vừa vận động!", icon: Camera, to: `/practice/camera/${grade}`, tone: "bg-primary text-primary-foreground" },
  ];

  // Các hoạt động cùng loại gom thành nhóm.
  const groups = [
    {
      title: "Nghe & Nói",
      items: [
        { label: "Nghe & Chọn", desc: "Nghe phát âm, chọn nghĩa hoặc tranh đúng", icon: Headphones, to: `/practice/listen/${grade}`, tone: "bg-accent2 text-accent2-foreground" },
        { label: "Luyện nói (Shadowing)", desc: "Nghe, nhại âm và tự ghi âm giọng nói", icon: Mic, to: `/practice/shadowing/${grade}`, tone: "bg-primary text-primary-foreground" },
      ],
    },
    {
      title: "Từ vựng",
      items: [
        { label: "Nối từ", desc: "Ghép cặp Anh – Việt thật nhanh", icon: Shuffle, to: `/practice/word-match/${grade}`, tone: "bg-accent text-accent-foreground" },
        { label: "Lật thẻ ghép cặp", desc: "Lật thẻ tìm cặp hình ảnh và từ", icon: LayoutGrid, to: `/practice/flashcard-match/${grade}`, tone: "bg-accent text-accent-foreground" },
        { label: "Ôn từ vựng thông minh", desc: "Học lại đúng lúc sắp quên (SRS)", icon: RotateCcw, to: "/practice/srs-review", tone: "bg-success text-success-foreground" },
      ],
    },
    {
      title: "Câu & Kiểm tra",
      items: [
        { label: "Xếp câu", desc: "Sắp xếp từ thành câu hoàn chỉnh", icon: PuzzleIcon, to: `/practice/sentence-puzzle/${grade}`, tone: "bg-primary text-primary-foreground" },
        { label: "Tạo đề kiểm tra", desc: `Tự chọn nội dung lớp ${grade}, làm bài chấm điểm`, icon: FilePlus2, to: "/test/custom", tone: "bg-primary text-primary-foreground" },
        ...(grade === 10
          ? [{ label: "Đề thi vào lớp 10", desc: "Đề thi thử có chấm điểm & chữa chi tiết", icon: GraduationCap, to: "/grade/10/tests", tone: "bg-accent text-accent-foreground" }]
          : []),
      ],
    },
  ];

  type Item = (typeof groups)[number]["items"][number];

  const Tile = ({ item, delay }: { item: Item; delay: number }) => (
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
      <h3 className="mb-1 font-display text-lg font-extrabold">{item.label}</h3>
      <p className="text-sm opacity-90">{item.desc}</p>
    </motion.button>
  );

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-5 pb-20 pt-28">
        <PageBack className="mb-6" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={smooth} className="mb-8">
          <h1 className="mb-2 font-display text-3xl font-extrabold text-foreground">Luyện tập</h1>
          <p className="text-base text-muted-foreground">Luyện đọc – nghe – nói, chơi để nhớ từ, ôn lại và thử sức với đề kiểm tra.</p>
        </motion.div>

        {/* Nổi bật */}
        <section className="mb-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {featured.map((item, i) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...smooth, delay: i * 0.06 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.to)}
                className={`${item.tone} flex items-center gap-4 rounded-2xl p-6 text-left shadow-1 transition-all hover:-translate-y-0.5 hover:shadow-2`}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <item.icon className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-extrabold sm:text-xl">{item.label}</h3>
                  <p className="mt-0.5 text-sm opacity-90">{item.desc}</p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 opacity-80" />
              </motion.button>
            ))}
          </div>
        </section>

        {groups.map((g) => (
          <section key={g.title} className="mb-9">
            <h2 className="mb-3 font-display text-xl font-extrabold text-foreground">{g.title}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((item, i) => (
                <Tile key={item.label} item={item} delay={i * 0.05} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
};

export default PracticePage;
