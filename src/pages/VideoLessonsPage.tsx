import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Film, Home, PlayCircle } from "lucide-react";
import PageShell from "@/components/PageShell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import {
  getVideoLessonProgress,
  listVideoLessons,
  type VideoLesson,
  type VideoLessonProgress,
} from "@/lib/videoLessons";

const smooth = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

const VideoLessonsPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, profile } = useAuth();
  const [lessons, setLessons] = useState<VideoLesson[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, VideoLessonProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const rows = await listVideoLessons();
      if (cancelled) return;
      setLessons(rows);
      if (user) {
        const pairs = await Promise.all(
          rows.map(async (lesson) => [lesson.id, await getVideoLessonProgress(user.uid, lesson.id)] as const),
        );
        if (!cancelled) setProgressMap(Object.fromEntries(pairs));
      } else {
        setProgressMap({});
      }
      setLoading(false);
    })().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const visibleLessons = useMemo(() => {
    if (!profile?.grade) return lessons;
    const exact = lessons.filter((lesson) => !lesson.grade || lesson.grade === profile.grade);
    return exact.length > 0 ? exact : lessons;
  }, [lessons, profile?.grade]);

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-5 pb-20 pt-28">
        <div className="mb-6 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/dashboard")}
            className="rounded-xl border border-border/30 bg-card/80 p-2.5 text-foreground shadow-lg backdrop-blur-xl"
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
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-primary shadow-sm">
            <Film className="h-4 w-4" />
            Học thuộc lời thoại
          </div>
          <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            Học tiếng Anh bằng video
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-muted-foreground">
            Nghe từng câu, nhại theo video, che chữ dần rồi đọc thuộc. Mỗi bài là một video ngắn cô đã chuẩn bị.
          </p>
        </motion.div>

        {loading ? (
          <div className="rounded-3xl border border-border/30 bg-card/80 p-8 text-center text-sm text-muted-foreground shadow-lg backdrop-blur-xl">
            Đang tải bài học…
          </div>
        ) : visibleLessons.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/50 bg-card/70 p-8 text-center shadow-lg backdrop-blur-xl">
            <p className="font-display text-xl font-bold text-foreground">Chưa có bài video</p>
            <p className="mt-1 text-sm text-muted-foreground">Cô giáo sẽ thêm bài học bằng URL YouTube trong trang admin.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleLessons.map((lesson, index) => {
              const progress = progressMap[lesson.id];
              const total = lesson.lines?.length ?? 0;
              const done = progress?.completedLineIds?.length ?? 0;
              const pct = total ? Math.round((done / total) * 100) : 0;
              return (
                <motion.button
                  key={lesson.id}
                  initial={{ opacity: 0, y: 18, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ ...smooth, delay: index * 0.06 }}
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/video-lessons/${lesson.id}`)}
                  className="rounded-3xl border border-border/30 bg-card/85 p-5 text-left shadow-lg backdrop-blur-xl transition-shadow hover:shadow-xl"
                >
                  <div className="mb-4 aspect-video overflow-hidden rounded-2xl bg-black">
                    <img
                      src={`https://img.youtube.com/vi/${lesson.videoId}/hqdefault.jpg`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 font-display text-xl font-extrabold text-foreground">
                        {lesson.title}
                      </h2>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">
                        {total} câu luyện thuộc{lesson.grade ? ` · Lớp ${lesson.grade}` : ""}
                      </p>
                    </div>
                    <PlayCircle className="mt-1 h-6 w-6 shrink-0 text-primary" />
                  </div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant={pct === 100 ? "default" : "secondary"}>{pct}%</Badge>
                    <span className="text-xs font-bold text-muted-foreground">
                      {done}/{total} câu đã thuộc
                    </span>
                  </div>
                  <Progress value={pct} className="h-2 rounded-full" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default VideoLessonsPage;
