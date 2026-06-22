import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Film, Home, PlayCircle } from "lucide-react";
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
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Group by series (lesson.topic) and order by episode number from the title, so
  // each playlist shows its episodes 1, 2, 3 ... in order instead of newest-first.
  const groups = useMemo(() => {
    const episodeOf = (title: string) => {
      const m = String(title).match(/\b(\d+)\b/);
      return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
    };
    const bySeries = new Map<string, VideoLesson[]>();
    for (const lesson of visibleLessons) {
      const key = (lesson.topic || "").trim() || "Khác";
      if (!bySeries.has(key)) bySeries.set(key, []);
      bySeries.get(key)!.push(lesson);
    }
    return [...bySeries.entries()]
      .map(([series, items]) => ({
        series,
        items: [...items].sort((a, b) => episodeOf(a.title) - episodeOf(b.title) || a.title.localeCompare(b.title)),
      }))
      .sort((a, b) => a.series.localeCompare(b.series, "vi"));
  }, [visibleLessons]);

  // Two-level view: pick a topic first, then see its lessons. Driven by ?topic=
  // so the browser back button and shared links work.
  const selectedTopic = searchParams.get("topic");
  const selectedGroup = useMemo(
    () => (selectedTopic ? groups.find((group) => group.series === selectedTopic) ?? null : null),
    [groups, selectedTopic],
  );

  const lessonStats = (lesson: VideoLesson) => {
    const total = lesson.lines?.length ?? 0;
    const done = progressMap[lesson.id]?.completedLineIds?.length ?? 0;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  };

  const openTopic = (series: string) => setSearchParams({ topic: series });
  const clearTopic = () => setSearchParams({});

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-5 pb-20 pt-28">
        <div className="mb-6 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/dashboard")}
            className="rounded-xl border border-border/30 bg-card/80 p-2.5 text-foreground shadow-lg backdrop-blur-xl"
            aria-label="Trang chủ"
          >
            <Home className="h-5 w-5" />
          </motion.button>
          {selectedGroup ? (
            <button
              onClick={clearTopic}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Tất cả chủ đề
            </button>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Quay lại
            </button>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={smooth} className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-primary shadow-sm">
            <Film className="h-4 w-4" />
            Học thuộc lời thoại
          </div>
          {selectedGroup ? (
            <>
              <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
                {selectedGroup.series}
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-muted-foreground">
                {selectedGroup.items.length} bài · Chọn một tập để nghe từng câu và đọc thuộc.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
                Học tiếng Anh bằng video
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-muted-foreground">
                Chọn một chủ đề để xem danh sách các tập. Nghe từng câu, nhại theo video, che chữ dần rồi đọc thuộc.
              </p>
            </>
          )}
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
        ) : selectedGroup ? (
          // ─── Topic detail: the lessons inside the chosen topic ───
          <div className="grid gap-4 sm:grid-cols-2">
            {selectedGroup.items.map((lesson, index) => {
              const { total, done, pct } = lessonStats(lesson);
              return (
                <motion.button
                  key={lesson.id}
                  initial={{ opacity: 0, y: 18, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ ...smooth, delay: Math.min(index * 0.04, 0.3) }}
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
        ) : (
          // ─── Topic overview: one card per topic ───
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((group, index) => {
              const cover = group.items[0];
              const totals = group.items.reduce(
                (acc, lesson) => {
                  const { total, done } = lessonStats(lesson);
                  return { total: acc.total + total, done: acc.done + done };
                },
                { total: 0, done: 0 },
              );
              const pct = totals.total ? Math.round((totals.done / totals.total) * 100) : 0;
              return (
                <motion.button
                  key={group.series}
                  initial={{ opacity: 0, y: 18, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ ...smooth, delay: Math.min(index * 0.05, 0.3) }}
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => openTopic(group.series)}
                  className="rounded-3xl border border-border/30 bg-card/85 p-5 text-left shadow-lg backdrop-blur-xl transition-shadow hover:shadow-xl"
                >
                  <div className="relative mb-4 aspect-video overflow-hidden rounded-2xl bg-black">
                    {cover && (
                      <img
                        src={`https://img.youtube.com/vi/${cover.videoId}/hqdefault.jpg`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                    <span className="absolute right-2 top-2 rounded-full bg-black/65 px-2.5 py-1 text-xs font-extrabold text-white backdrop-blur-sm">
                      {group.items.length} bài
                    </span>
                  </div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="line-clamp-1 font-display text-xl font-extrabold text-foreground">
                        {group.series}
                      </h2>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">
                        {group.items.length} bài học · nhấn để mở
                      </p>
                    </div>
                    <ChevronRight className="h-6 w-6 shrink-0 text-primary" />
                  </div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant={pct === 100 ? "default" : "secondary"}>{pct}%</Badge>
                    <span className="text-xs font-bold text-muted-foreground">cả chủ đề</span>
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
