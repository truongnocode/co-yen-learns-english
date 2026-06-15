import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Gauge,
  Home,
  Play,
  Repeat,
  Square,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import YouTubeSegmentPlayer, { type YouTubeSegmentPlayerHandle } from "@/components/YouTubeSegmentPlayer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getVideoLesson,
  getVideoLessonProgress,
  saveVideoLessonProgress,
  type VideoLesson,
  type VideoLessonProgress,
} from "@/lib/videoLessons";

const hideLabels = ["Hiện đủ chữ", "Che vài từ", "Gợi ý chữ đầu", "Ẩn hết"];
const smooth = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

const VideoLessonPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const playerRef = useRef<YouTubeSegmentPlayerHandle | null>(null);

  const [lesson, setLesson] = useState<VideoLesson | null>(null);
  const [progress, setProgress] = useState<VideoLessonProgress | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [looping, setLooping] = useState(false);

  useEffect(() => {
    if (!lessonId) {
      setLoading(false);
      return;
    }
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    (async () => {
      const row = await getVideoLesson(lessonId);
      if (!row) {
        setLoading(false);
        return;
      }
      const saved = await getVideoLessonProgress(user.uid, lessonId);
      const safeIndex = Math.min(saved.currentLineIndex ?? 0, Math.max(row.lines.length - 1, 0));
      setLesson(row);
      setProgress(saved);
      setCurrentIndex(safeIndex);
      setLoading(false);
    })().catch((e) => {
      toast({
        variant: "destructive",
        title: "Không tải được bài học",
        description: (e as Error).message,
      });
      setLoading(false);
    });
  }, [authLoading, user, lessonId, toast]);

  const lines = lesson?.lines ?? [];
  const currentLine = lines[currentIndex];
  const completed = useMemo(() => new Set(progress?.completedLineIds ?? []), [progress?.completedLineIds]);
  const completedCount = completed.size;
  const percent = lines.length ? Math.round((completedCount / lines.length) * 100) : 0;
  const hideLevel = currentLine ? progress?.hideLevelByLine?.[currentLine.id] ?? 0 : 0;

  const blockStart = Math.floor(currentIndex / 5) * 5;
  const blockLines = lines.slice(blockStart, blockStart + 5);

  const commitProgress = useCallback(
    async (next: VideoLessonProgress) => {
      if (!user || !lessonId) return;
      setProgress(next);
      try {
        await saveVideoLessonProgress(user.uid, lessonId, next);
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Chưa lưu được tiến độ",
          description: (e as Error).message,
        });
      }
    },
    [lessonId, toast, user],
  );

  const updateCurrentIndex = async (index: number) => {
    if (!progress || lines.length === 0) return;
    const safe = Math.max(0, Math.min(index, lines.length - 1));
    setLooping(false);
    playerRef.current?.stop();
    setCurrentIndex(safe);
    await commitProgress({ ...progress, currentLineIndex: safe });
  };

  const playLine = (rate = 1, loop = false) => {
    if (!currentLine) return;
    setLooping(loop);
    playerRef.current?.playSegment(currentLine, rate, loop);
  };

  const playBlock = () => {
    if (blockLines.length === 0) return;
    setLooping(false);
    playerRef.current?.playSegment(
      {
        start: blockLines[0].start,
        end: blockLines[blockLines.length - 1].end,
      },
      1,
      false,
    );
  };

  const increaseHideLevel = async () => {
    if (!progress || !currentLine) return;
    const nextLevel = Math.min(3, hideLevel + 1);
    await commitProgress({
      ...progress,
      hideLevelByLine: { ...progress.hideLevelByLine, [currentLine.id]: nextLevel },
    });
  };

  const resetHideLevel = async () => {
    if (!progress || !currentLine) return;
    await commitProgress({
      ...progress,
      hideLevelByLine: { ...progress.hideLevelByLine, [currentLine.id]: 0 },
    });
  };

  const markLearned = async () => {
    if (!progress || !currentLine) return;
    const nextCompleted = Array.from(new Set([...progress.completedLineIds, currentLine.id]));
    const nextIndex = Math.min(currentIndex + 1, Math.max(lines.length - 1, 0));
    await commitProgress({
      ...progress,
      completedLineIds: nextCompleted,
      currentLineIndex: nextIndex,
      hideLevelByLine: { ...progress.hideLevelByLine, [currentLine.id]: 3 },
    });
    setLooping(false);
    playerRef.current?.stop();
    setCurrentIndex(nextIndex);
  };

  if (loading || (!user && authLoading)) {
    return (
      <PageShell>
        <div className="flex items-center justify-center pt-40 text-sm font-bold text-muted-foreground">
          Đang tải bài học…
        </div>
      </PageShell>
    );
  }

  if (!lesson || !currentLine) {
    return (
      <PageShell>
        <div className="mx-auto max-w-lg px-5 pt-32 text-center">
          <div className="rounded-3xl border border-border/30 bg-card/80 p-8 shadow-lg backdrop-blur-xl">
            <p className="font-display text-2xl font-bold text-foreground">Không tìm thấy bài video</p>
            <Button onClick={() => navigate("/video-lessons")} className="mt-5">
              Quay lại danh sách
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 pb-24 pt-24 sm:px-5 sm:pt-28">
        <div className="mb-4 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/dashboard")}
            className="rounded-xl border border-border/30 bg-card/80 p-2.5 text-foreground shadow-lg backdrop-blur-xl"
          >
            <Home className="h-5 w-5" />
          </motion.button>
          <button
            onClick={() => navigate("/video-lessons")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Danh sách video
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_360px]">
          <div className="space-y-4">
            <YouTubeSegmentPlayer ref={playerRef} videoId={lesson.videoId} />

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={smooth}
              className="rounded-3xl border border-border/30 bg-card/85 p-5 shadow-lg backdrop-blur-xl"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="line-clamp-2 font-display text-2xl font-extrabold text-foreground">
                    {lesson.title}
                  </h1>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">
                    Câu {currentIndex + 1}/{lines.length} · {hideLabels[hideLevel]}
                  </p>
                </div>
                <div className="rounded-2xl bg-primary/10 px-3 py-2 text-center">
                  <p className="font-display text-xl font-extrabold text-primary">{percent}%</p>
                  <p className="text-[10px] font-bold uppercase text-primary/70">đã thuộc</p>
                </div>
              </div>

              <Progress value={percent} className="mb-5 h-2 rounded-full" />

              <div className="mb-5 rounded-2xl bg-secondary/60 p-5">
                <p className="text-center font-display text-2xl font-extrabold leading-relaxed text-foreground sm:text-3xl">
                  {maskText(currentLine.text, hideLevel)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Button size="lg" onClick={() => playLine(1, false)}>
                  <Play className="h-4 w-4" />
                  Nghe lại
                </Button>
                <Button size="lg" variant="secondary" onClick={() => playLine(0.75, false)}>
                  <Gauge className="h-4 w-4" />
                  Chậm
                </Button>
                <Button
                  size="lg"
                  variant={looping ? "destructive" : "outline"}
                  onClick={() => {
                    if (looping) {
                      setLooping(false);
                      playerRef.current?.stop();
                    } else {
                      playLine(1, true);
                    }
                  }}
                >
                  {looping ? <Square className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
                  {looping ? "Dừng" : "Lặp câu"}
                </Button>
                <Button size="lg" variant="outline" onClick={hideLevel >= 3 ? resetHideLevel : increaseHideLevel}>
                  <EyeOff className="h-4 w-4" />
                  {hideLevel >= 3 ? "Hiện lại" : "Che chữ"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => updateCurrentIndex(currentIndex - 1)}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Câu trước
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => updateCurrentIndex(currentIndex + 1)}
                  disabled={currentIndex >= lines.length - 1}
                >
                  Câu sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button onClick={markLearned} className="mt-3 h-14 w-full text-base font-extrabold">
                <Check className="h-5 w-5" />
                Em đã thuộc câu này
              </Button>
            </motion.div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-border/30 bg-card/85 p-5 shadow-lg backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-extrabold text-foreground">Luyện cả đoạn</h2>
                  <p className="text-xs font-semibold text-muted-foreground">Mỗi đoạn gồm tối đa 5 câu.</p>
                </div>
                <Button size="sm" onClick={playBlock}>
                  <Play className="h-4 w-4" />
                  Phát đoạn
                </Button>
              </div>
              <div className="space-y-2">
                {blockLines.map((line, i) => {
                  const index = blockStart + i;
                  const active = index === currentIndex;
                  const done = completed.has(line.id);
                  return (
                    <button
                      key={line.id}
                      onClick={() => updateCurrentIndex(index)}
                      className={`w-full rounded-2xl border p-3 text-left text-sm transition-all ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : done
                            ? "border-success/30 bg-success/10 text-success"
                            : "border-border/30 bg-secondary/40 text-foreground hover:border-primary/30"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="font-display font-extrabold">Câu {index + 1}</span>
                        {done && <Check className="h-4 w-4" />}
                      </div>
                      <p className="line-clamp-2">{line.text}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-border/30 bg-card/85 p-5 shadow-lg backdrop-blur-xl">
              <h2 className="font-display text-xl font-extrabold text-foreground">Cách học</h2>
              <ol className="mt-3 space-y-2 text-sm font-semibold text-muted-foreground">
                <li>1. Bấm nghe lại câu trong video.</li>
                <li>2. Nhìn chữ và đọc theo.</li>
                <li>3. Bấm che chữ vài lần.</li>
                <li>4. Không nhìn chữ, đọc thuộc rồi bấm hoàn thành.</li>
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
};

function maskText(text: string, level: number): string {
  if (level <= 0) return text;
  let wordIndex = 0;
  return text
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token)) return token;
      const masked = maskWord(token, level, wordIndex);
      wordIndex++;
      return masked;
    })
    .join("");
}

function maskWord(token: string, level: number, index: number): string {
  const match = token.match(/^([^A-Za-z0-9]*)([A-Za-z0-9']+)([^A-Za-z0-9]*)$/);
  if (!match) return level >= 3 ? "____" : token;
  const [, lead, core, tail] = match;

  if (level === 1) {
    if (index % 3 !== 1 || core.length <= 2) return token;
    return `${lead}${"_".repeat(Math.min(core.length, 8))}${tail}`;
  }

  if (level === 2) {
    if (core.length <= 1) return `${lead}${core}${tail}`;
    return `${lead}${core[0]}${"_".repeat(Math.min(core.length - 1, 8))}${tail}`;
  }

  return `${lead}${"_".repeat(Math.min(Math.max(core.length, 3), 8))}${tail}`;
}

export default VideoLessonPage;
