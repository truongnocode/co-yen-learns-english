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
import YouTubeSegmentPlayer, { type YouTubeSegmentPlayerHandle } from "@/components/YouTubeSegmentPlayer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isAdminEmail } from "@/lib/admin";
import {
  getVideoLesson,
  getVideoLessonProgress,
  isLatestVideoLessonRhythmSource,
  refreshVideoLessonRhythm,
  saveVideoLessonProgress,
  type VideoLesson,
  type VideoLessonLine,
  type VideoLessonRhythmChunk,
  type VideoLessonProgress,
} from "@/lib/videoLessons";

const hideLabels = ["Hiện đủ chữ", "Che vài từ", "Gợi ý chữ đầu", "Ẩn hết"];
const smooth = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };
const playbackRates = [1, 0.75, 0.5] as const;

type DisplayRhythmChunk = VideoLessonRhythmChunk & {
  reliable: boolean;
};

function defaultVideoProgress(lessonId: string): VideoLessonProgress {
  return {
    lessonId,
    completedLineIds: [],
    difficultLineIds: [],
    currentLineIndex: 0,
    hideLevelByLine: {},
  };
}

const VideoLessonPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const playerRef = useRef<YouTubeSegmentPlayerHandle | null>(null);
  const lineButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const blockTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const chunkHighlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lineStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRefreshLessonRef = useRef<string | null>(null);

  const [lesson, setLesson] = useState<VideoLesson | null>(null);
  const [progress, setProgress] = useState<VideoLessonProgress | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshingRhythm, setRefreshingRhythm] = useState(false);
  const [looping, setLooping] = useState(false);
  const [linePlaying, setLinePlaying] = useState(false);
  const [playbackRateIndex, setPlaybackRateIndex] = useState(0);
  const [showRhythmMarks, setShowRhythmMarks] = useState(true);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [activeChunkIndex, setActiveChunkIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!lessonId) {
      setLoading(false);
      return;
    }
    if (authLoading) return;
    (async () => {
      const row = await getVideoLesson(lessonId);
      if (!row) {
        setLoading(false);
        return;
      }
      const saved = user ? await getVideoLessonProgress(user.uid, lessonId) : defaultVideoProgress(lessonId);
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

  useEffect(() => {
    if (!lesson || !user || refreshingRhythm) return;
    if (!isAdminEmail(user.email)) return;
    if (isLatestVideoLessonRhythmSource(lesson.rhythmSource)) return;
    if (autoRefreshLessonRef.current === lesson.id) return;

    autoRefreshLessonRef.current = lesson.id;
    setRefreshingRhythm(true);
    toast({
      title: "Đang tự cập nhật nhịp đọc",
      description: "Bài này đang được tạo lại bằng WhisperX và cú pháp mới.",
    });

    refreshVideoLessonRhythm(lesson)
      .then((updatedLesson) => {
        setLesson(updatedLesson);
        setCurrentChunkIndex(0);
        setActiveChunkIndex(null);
        toast({
          title: "Đã cập nhật nhịp đọc mới",
          description: "Dữ liệu bài học đã được ghi lại vào Firestore.",
        });
      })
      .catch((e) => {
        console.error("auto rhythm refresh failed:", e);
        toast({
          variant: "destructive",
          title: "Chưa tự cập nhật được nhịp",
          description: (e as Error).message,
        });
      })
      .finally(() => setRefreshingRhythm(false));
  }, [lesson, refreshingRhythm, toast, user]);

  const lines = useMemo(() => lesson?.lines ?? [], [lesson?.lines]);
  const currentLine = lines[currentIndex];
  const completed = useMemo(() => new Set(progress?.completedLineIds ?? []), [progress?.completedLineIds]);
  const completedCount = completed.size;
  const percent = lines.length ? Math.round((completedCount / lines.length) * 100) : 0;
  const hideLevel = currentLine ? progress?.hideLevelByLine?.[currentLine.id] ?? 0 : 0;
  const playbackRate = playbackRates[playbackRateIndex];
  const playbackRateLabel = `${playbackRate}x`;
  const hasTrustedRhythm = isTrustedRhythmSource(lesson?.rhythmSource);
  const hasStoredRhythm = useMemo(() => lines.some(hasUsableStoredRhythm), [lines]);
  const canUseStoredRhythm = hasTrustedRhythm || hasStoredRhythm;
  const currentRhythmChunks = useMemo(() => getRhythmChunks(currentLine, canUseStoredRhythm), [currentLine, canUseStoredRhythm]);
  const hasCurrentRhythm = currentRhythmChunks.length > 1 && currentRhythmChunks.some((chunk) => chunk.reliable);
  const canPlayChunk = hasCurrentRhythm;
  const dialogueTextClass = getDialogueTextClass(currentLine?.text ?? "");

  const blockStart = Math.floor(currentIndex / 5) * 5;
  const blockLines = lines.slice(blockStart, blockStart + 5);

  const clearBlockTimers = useCallback(() => {
    blockTimerRefs.current.forEach((timer) => clearTimeout(timer));
    blockTimerRefs.current = [];
  }, []);

  const clearChunkHighlight = useCallback(() => {
    if (chunkHighlightTimerRef.current) clearTimeout(chunkHighlightTimerRef.current);
    chunkHighlightTimerRef.current = null;
    setActiveChunkIndex(null);
  }, []);

  const clearLineStopTimer = useCallback(() => {
    if (lineStopTimerRef.current) clearTimeout(lineStopTimerRef.current);
    lineStopTimerRef.current = null;
  }, []);

  const stopPlayback = useCallback(() => {
    clearBlockTimers();
    clearChunkHighlight();
    clearLineStopTimer();
    setLinePlaying(false);
    setLooping(false);
    playerRef.current?.stop();
  }, [clearBlockTimers, clearChunkHighlight, clearLineStopTimer]);

  const scrollLineIntoView = useCallback(
    (index: number) => {
      const line = lines[index];
      if (!line) return;
      window.requestAnimationFrame(() => {
        lineButtonRefs.current.get(line.id)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    },
    [lines],
  );

  useEffect(() => {
    scrollLineIntoView(currentIndex);
    setCurrentChunkIndex(0);
    clearChunkHighlight();
  }, [clearChunkHighlight, currentIndex, scrollLineIntoView]);

  useEffect(
    () => () => {
      clearBlockTimers();
      clearChunkHighlight();
      clearLineStopTimer();
    },
    [clearBlockTimers, clearChunkHighlight, clearLineStopTimer],
  );

  const commitProgress = useCallback(
    async (next: VideoLessonProgress) => {
      setProgress(next);
      if (!user || !lessonId) return;
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
    clearBlockTimers();
    clearChunkHighlight();
    clearLineStopTimer();
    setLinePlaying(false);
    setLooping(false);
    playerRef.current?.stop();
    setCurrentIndex(safe);
    scrollLineIntoView(safe);
    await commitProgress({ ...progress, currentLineIndex: safe });
  };

  const playLine = (rate = 1, loop = false) => {
    if (!currentLine) return;
    clearBlockTimers();
    clearChunkHighlight();
    clearLineStopTimer();
    setLinePlaying(!loop);
    setLooping(loop);
    scrollLineIntoView(currentIndex);
    playerRef.current?.playSegment(currentLine, rate, loop);
    if (!loop) {
      const durationMs = ((currentLine.end - currentLine.start) / Math.max(rate, 0.25)) * 1000 + 650;
      lineStopTimerRef.current = window.setTimeout(() => setLinePlaying(false), durationMs);
    }
  };

  const playBlock = () => {
    if (blockLines.length === 0) return;
    clearBlockTimers();
    clearChunkHighlight();
    clearLineStopTimer();
    setLinePlaying(false);
    setLooping(false);
    setCurrentIndex(blockStart);
    scrollLineIntoView(blockStart);
    playerRef.current?.playSegment(
      {
        start: blockLines[0].start,
        end: blockLines[blockLines.length - 1].end,
      },
      playbackRate,
      false,
    );
    blockLines.forEach((line, i) => {
      const index = blockStart + i;
      const delay = Math.max(0, ((line.start - blockLines[0].start) / playbackRate) * 1000);
      const timer = window.setTimeout(() => {
        setCurrentIndex(index);
        scrollLineIntoView(index);
      }, delay);
      blockTimerRefs.current.push(timer);
    });
  };

  const cyclePlaybackRate = () => {
    const nextIndex = (playbackRateIndex + 1) % playbackRates.length;
    const nextRate = playbackRates[nextIndex];
    setPlaybackRateIndex(nextIndex);
    if (looping && currentLine) {
      clearBlockTimers();
      clearChunkHighlight();
      scrollLineIntoView(currentIndex);
      playerRef.current?.playSegment(currentLine, nextRate, true);
    }
  };

  const playCurrentChunk = () => {
    if (!currentLine || currentRhythmChunks.length === 0) return;
    clearBlockTimers();
    clearChunkHighlight();
    clearLineStopTimer();
    setLinePlaying(false);
    setLooping(false);
    scrollLineIntoView(currentIndex);

    const chunkIndex = Math.min(currentChunkIndex, currentRhythmChunks.length - 1);
    const chunk = currentRhythmChunks[chunkIndex];
    const segment = chunk.reliable ? chunk : currentLine;
    const highlightDurationMs = ((segment.end - segment.start) / playbackRate) * 1000 + 350;

    setActiveChunkIndex(chunkIndex);
    playerRef.current?.playSegment(segment, playbackRate, false);
    chunkHighlightTimerRef.current = window.setTimeout(() => setActiveChunkIndex(null), highlightDurationMs);
    setCurrentChunkIndex((chunkIndex + 1) % currentRhythmChunks.length);
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
    clearBlockTimers();
    clearChunkHighlight();
    clearLineStopTimer();
    setLinePlaying(false);
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
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-8 pt-24 sm:px-5 sm:pt-28 lg:box-border lg:h-screen lg:min-h-0 lg:overflow-hidden lg:pb-4 lg:pt-20 xl:max-w-7xl">
        <div className="mb-3 flex shrink-0 items-center gap-3 lg:hidden">
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

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_350px]">
          <div className="space-y-3 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden">
            <YouTubeSegmentPlayer
              ref={playerRef}
              videoId={lesson.videoId}
              className="lg:shrink-0 lg:max-h-[calc(100vh-22rem)]"
            />

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={smooth}
              className="rounded-2xl border border-border/30 bg-card/85 p-3 shadow-lg backdrop-blur-xl lg:h-[230px] lg:shrink-0"
            >
              <h1 className="sr-only">{lesson.title}</h1>

              <div className="mb-2 flex h-[92px] items-center justify-center overflow-hidden rounded-2xl bg-secondary/60 px-3 sm:h-[98px] lg:h-[88px]">
                <p className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center font-display font-extrabold text-foreground ${dialogueTextClass}`}>
                  {currentRhythmChunks.map((chunk, index) => (
                    <span key={`${chunk.start}-${chunk.text}-${index}`} className="inline-flex items-center gap-2">
                      <span
                        className={`rounded-xl px-1.5 py-0.5 transition-colors ${
                          activeChunkIndex === index ? "bg-primary/15 text-primary" : ""
                        }`}
                      >
                        {maskText(chunk.text, hideLevel)}
                      </span>
                      {showRhythmMarks && index < currentRhythmChunks.length - 1 && (
                        <span className="font-display text-3xl font-black leading-none text-primary sm:text-4xl">
                          {boundaryMark(chunk)}
                        </span>
                      )}
                    </span>
                  ))}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_1fr]">
                <Button
                  className="h-12 border-primary/20 bg-primary/10 font-extrabold text-primary hover:bg-primary/15"
                  variant="outline"
                  onClick={() => updateCurrentIndex(currentIndex - 1)}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Câu trước
                </Button>
                <Button
                  className="h-12 text-base font-extrabold shadow-lg"
                  onClick={linePlaying ? stopPlayback : () => playLine(playbackRate, false)}
                  variant={linePlaying ? "destructive" : "default"}
                >
                  {linePlaying ? <Square className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {linePlaying ? "Dừng" : "Nghe"}
                </Button>
                <Button
                  className="h-12 border-primary/20 bg-primary/10 font-extrabold text-primary hover:bg-primary/15"
                  variant="outline"
                  onClick={() => updateCurrentIndex(currentIndex + 1)}
                  disabled={currentIndex >= lines.length - 1}
                >
                  Câu sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <Button className="h-10" variant="secondary" onClick={playCurrentChunk} disabled={!canPlayChunk}>
                  <Play className="h-4 w-4" />
                  Nghe cụm
                </Button>
                <Button className="h-10" variant="secondary" onClick={cyclePlaybackRate}>
                  <Gauge className="h-4 w-4" />
                  Tốc độ {playbackRateLabel}
                </Button>
                <Button
                  className="h-10"
                  variant={looping ? "destructive" : "outline"}
                  onClick={() => {
                    if (looping) {
                      setLooping(false);
                      playerRef.current?.stop();
                    } else {
                      playLine(playbackRate, true);
                    }
                  }}
                >
                  {looping ? <Square className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
                  {looping ? "Dừng" : "Lặp câu"}
                </Button>
                <Button className="h-10" variant="outline" onClick={hideLevel >= 3 ? resetHideLevel : increaseHideLevel}>
                  <EyeOff className="h-4 w-4" />
                  {hideLevel >= 3 ? "Hiện lại" : "Che chữ"}
                </Button>
                <Button
                  className="h-10"
                  variant={showRhythmMarks ? "outline" : "secondary"}
                  onClick={() => setShowRhythmMarks((value) => !value)}
                  disabled={!hasCurrentRhythm}
                >
                  {hasCurrentRhythm ? (
                    <span className="font-display text-base font-extrabold">/</span>
                  ) : null}
                  {hasCurrentRhythm ? (showRhythmMarks ? "Ẩn nhịp" : "Hiện nhịp") : "Không có nhịp"}
                </Button>
                <Button className="h-10 bg-success font-extrabold text-success-foreground hover:bg-success/90" onClick={markLearned}>
                  <Check className="h-4 w-4" />
                  Đã thuộc
                </Button>
              </div>
            </motion.div>
          </div>

          <aside className="space-y-3 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden">
            <div className="rounded-2xl border border-border/30 bg-card/85 p-4 shadow-lg backdrop-blur-xl lg:shrink-0">
              <h2 className="font-display text-xl font-extrabold text-foreground">Cách học</h2>
              {canUseStoredRhythm ? (
                <ol className="mt-2 space-y-1.5 text-sm font-semibold text-muted-foreground">
                  <li>
                    1. Dấu <span className="font-display text-2xl font-black leading-none text-primary">/</span> là ngắt ngắn,{" "}
                    <span className="font-display text-2xl font-black leading-none text-primary">//</span> là ngắt dài.
                  </li>
                  <li>2. Bấm Nghe cụm để nhại một nhịp ngắn.</li>
                  <li>3. Bấm Nghe, đọc cả câu đúng nhịp và nhấn nhá.</li>
                  <li>4. Che chữ dần, vẫn giữ dấu / đến khi đọc thuộc.</li>
                </ol>
              ) : (
                <ol className="mt-2 space-y-1.5 text-sm font-semibold text-muted-foreground">
                  <li>1. Bấm Nghe để nghe trọn câu trong video.</li>
                  <li>2. Nhìn chữ và đọc theo đúng âm thanh.</li>
                  <li>3. Che chữ dần, nghe lại rồi đọc thuộc.</li>
                  <li>4. Khi đã đọc trôi chảy, bấm Đã thuộc.</li>
                </ol>
              )}
            </div>

            <div className="rounded-2xl border border-border/30 bg-card/85 p-4 shadow-lg backdrop-blur-xl lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
              <div className="mb-3 shrink-0">
                <div className="mb-3 grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl bg-secondary/45 px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-extrabold text-foreground">
                      Câu {currentIndex + 1}/{lines.length} · {hideLabels[hideLevel]}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] font-bold text-muted-foreground">
                      {canUseStoredRhythm ? "Luyện nhịp bằng dấu / · nghe cụm · đọc thuộc" : "Luyện nghe · che chữ · đọc thuộc"}
                    </p>
                  </div>
                  <div className="rounded-full bg-success/10 px-3 py-1 text-center">
                    <span className="font-display text-base font-extrabold text-success">{percent}%</span>
                    <span className="ml-1 text-[10px] font-bold uppercase text-success/75">thuộc</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-foreground">Luyện cả đoạn</h2>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {lines.length} câu trong bài · tự kéo về câu đang nghe.
                    </p>
                  </div>
                  <Button size="sm" onClick={playBlock}>
                    <Play className="h-4 w-4" />
                    Phát đoạn
                  </Button>
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {lines.map((line, index) => {
                  const active = index === currentIndex;
                  const done = completed.has(line.id);
                  return (
                    <button
                      key={line.id}
                      ref={(element) => {
                        if (element) lineButtonRefs.current.set(line.id, element);
                        else lineButtonRefs.current.delete(line.id);
                      }}
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
          </aside>
        </div>
      </div>
    </PageShell>
  );
};

function getRhythmChunks(line?: VideoLessonLine, trustStoredRhythm = false): DisplayRhythmChunk[] {
  if (!line) return [];

  const stored = normalizeStoredRhythmChunks(line, trustStoredRhythm);
  if (stored.length > 0) return stored;

  return splitConservativeRhythmChunks(line);
}

function isTrustedRhythmSource(source: string | undefined): boolean {
  return (
    source === "ffmpeg-hybrid-v1" ||
    source === "ffmpeg-syntax-v2" ||
    source === "ffmpeg-syntax-v3" ||
    source === "ffmpeg-syntax-v4" ||
    source === "whisperx-hybrid-v1" ||
    source === "whisperx-syntax-v3" ||
    source === "whisperx-syntax-v4" ||
    source === "whisperx-syntax-v2" ||
    source === "caption-audio-v1"
  );
}

function hasUsableStoredRhythm(line: VideoLessonLine): boolean {
  return Array.isArray(line.rhythmChunks) && line.rhythmChunks.length > 1;
}

function normalizeStoredRhythmChunks(line: VideoLessonLine, trustStoredRhythm: boolean): DisplayRhythmChunk[] {
  if (!trustStoredRhythm) return [];

  const chunks = Array.isArray(line.rhythmChunks) ? line.rhythmChunks : [];
  const normalized = chunks
    .map((chunk) => {
      const text = normalizeLessonText(chunk.text);
      const start = roundLessonTime(chunk.start);
      const end = roundLessonTime(chunk.end);
      if (!text || !Number.isFinite(start) || !Number.isFinite(end)) return null;
      const safeStart = Math.max(line.start, start);
      const safeEnd = Math.min(line.end, end > safeStart ? end : safeStart + 0.35);
      if (safeEnd <= safeStart) return null;
      return {
        text,
        start: safeStart,
        end: safeEnd,
        boundaryAfter: normalizeBoundaryAfter(chunk.boundaryAfter),
        reliable: true,
      };
    })
    .filter((chunk): chunk is DisplayRhythmChunk => Boolean(chunk));

  const repaired = repairProtectedStoredRhythmChunks(normalized);
  return repaired.length > 1 ? repaired : [];
}

function repairProtectedStoredRhythmChunks(chunks: DisplayRhythmChunk[]): DisplayRhythmChunk[] {
  const repaired = chunks.map((chunk) => ({
    ...chunk,
    boundaryAfter: chunk.boundaryAfter
      ? {
          ...chunk.boundaryAfter,
          sources: [...chunk.boundaryAfter.sources],
        }
      : undefined,
  }));

  for (let index = 0; index < repaired.length - 1; index++) {
    const current = repaired[index];
    const next = repaired[index + 1];
    if (!shouldMoveLeadingToLeft(current.text, next.text)) continue;

    const nextWords = splitLessonWords(next.text);
    const movedWord = nextWords[0];
    const remainingWords = nextWords.slice(1);
    current.text = normalizeLessonText(`${current.text} ${movedWord}`);

    const nextDuration = Math.max(0, next.end - next.start);
    const movedDuration = roundLessonTime(Math.min(0.38, Math.max(0.12, nextDuration / nextWords.length)));
    const movedEnd = roundLessonTime(Math.min(next.end, next.start + movedDuration));
    current.end = Math.max(current.end, movedEnd);

    next.text = normalizeLessonText(remainingWords.join(" "));
    next.start = Math.min(next.end, current.end);

    if (!next.text || next.end <= next.start) {
      current.end = Math.max(current.end, next.end);
      current.boundaryAfter = next.boundaryAfter;
      repaired.splice(index + 1, 1);
      index--;
    }
  }

  return repaired.filter((chunk) => chunk.text);
}

function shouldMoveLeadingToLeft(leftText: string, rightText: string): boolean {
  const leftWords = splitLessonWords(leftText).map(coreLessonWord);
  const rightWords = splitLessonWords(rightText).map(coreLessonWord);
  if (rightWords[0] !== "to" || !isLikelyLessonInfinitivePhrase(rightWords)) return false;

  const previousCore = leftWords[leftWords.length - 1] ?? "";
  const previousPreviousCore = leftWords[leftWords.length - 2] ?? "";
  return (
    RHYTHM_TO_LEFT_TRIGGERS.has(previousCore) ||
    RHYTHM_TO_LEFT_TRIGGERS.has(previousPreviousCore)
  );
}

function splitLessonWords(text: string): string[] {
  return normalizeLessonText(text).split(" ").filter(Boolean);
}

function coreLessonWord(text: string): string {
  return normalizeLessonText(text)
    .toLowerCase()
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
}

function isLikelyLessonInfinitiveVerb(core: string | undefined): boolean {
  if (!core || !/^[a-z][a-z']*$/.test(core)) return false;
  if (core === "be" || core === "do" || core === "have") return true;
  return !RHYTHM_TO_OBJECT_STARTERS.has(core);
}

function isLikelyLessonInfinitivePhrase(words: string[]): boolean {
  const headCore = RHYTHM_TO_SKIP_WORDS.has(words[1] ?? "") ? words[2] : words[1];
  return isLikelyLessonInfinitiveVerb(headCore);
}

function normalizeBoundaryAfter(boundary: VideoLessonRhythmChunk["boundaryAfter"]): VideoLessonRhythmChunk["boundaryAfter"] | undefined {
  if (!boundary || (boundary.type !== "minor" && boundary.type !== "major")) return undefined;
  return {
    type: boundary.type,
    pauseMs: Math.max(0, Math.round(Number(boundary.pauseMs ?? 0))),
    confidence: Math.max(0, Math.min(1, Math.round(Number(boundary.confidence ?? 0.4) * 100) / 100)),
    sources: Array.isArray(boundary.sources) ? boundary.sources : [],
  };
}

function boundaryMark(chunk: DisplayRhythmChunk): "/" | "//" {
  return chunk.boundaryAfter?.type === "major" ? "//" : "/";
}

function splitConservativeRhythmChunks(line: VideoLessonLine): DisplayRhythmChunk[] {
  const text = normalizeLessonText(line.text);
  if (!text) return [];

  return [{ text, start: line.start, end: line.end, reliable: false }];
}

function getDialogueTextClass(text: string): string {
  const length = normalizeLessonText(text).length;
  if (length > 220) return "text-[0.92rem] leading-tight sm:text-base";
  if (length > 160) return "text-base leading-tight sm:text-lg";
  if (length > 110) return "text-lg leading-tight sm:text-xl";
  if (length > 72) return "text-xl leading-snug sm:text-2xl";
  return "text-2xl leading-snug sm:text-3xl";
}

function normalizeLessonText(text: string): string {
  return String(text).replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();
}

function roundLessonTime(value: number): number {
  return Math.max(0, Math.round(Number(value) * 100) / 100);
}

const RHYTHM_DETERMINER_WORDS = new Set([
  "a",
  "an",
  "the",
  "this",
  "that",
  "these",
  "those",
  "my",
  "your",
  "our",
  "their",
  "his",
  "her",
  "its",
]);

const RHYTHM_PREPOSITION_WORDS = new Set([
  "of",
  "in",
  "on",
  "at",
  "for",
  "with",
  "from",
  "by",
  "about",
  "into",
  "over",
  "under",
  "through",
  "between",
  "among",
]);

const RHYTHM_TO_LEFT_TRIGGERS = new Set([
  "able",
  "about",
  "afford",
  "affords",
  "afforded",
  "aim",
  "aims",
  "aimed",
  "allow",
  "allows",
  "allowed",
  "attempt",
  "attempts",
  "attempted",
  "attempting",
  "begin",
  "begins",
  "began",
  "begun",
  "choose",
  "chooses",
  "chose",
  "decide",
  "decides",
  "decided",
  "enough",
  "expect",
  "expects",
  "expected",
  "fail",
  "fails",
  "failed",
  "going",
  "had",
  "has",
  "have",
  "help",
  "helps",
  "helped",
  "hope",
  "hopes",
  "hoped",
  "how",
  "learn",
  "learns",
  "learned",
  "learning",
  "like",
  "likes",
  "liked",
  "love",
  "loves",
  "loved",
  "need",
  "needs",
  "needed",
  "order",
  "plan",
  "plans",
  "planned",
  "promise",
  "promises",
  "promised",
  "ready",
  "refuse",
  "refuses",
  "refused",
  "seem",
  "seems",
  "seemed",
  "start",
  "starts",
  "started",
  "supposed",
  "tend",
  "tends",
  "tended",
  "time",
  "try",
  "tries",
  "tried",
  "trying",
  "used",
  "want",
  "wants",
  "wanted",
  "way",
  "wish",
  "wishes",
  "wished",
]);

const RHYTHM_TO_OBJECT_STARTERS = new Set([
  ...RHYTHM_DETERMINER_WORDS,
  ...RHYTHM_PREPOSITION_WORDS,
  "and",
  "but",
  "because",
  "before",
  "after",
  "when",
  "while",
  "where",
  "which",
  "who",
  "that",
  "if",
  "so",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "not",
  "n't",
  "too",
  "very",
  "more",
  "most",
]);

const RHYTHM_TO_SKIP_WORDS = new Set(["not", "never", "just", "really", "quickly", "slowly"]);

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
