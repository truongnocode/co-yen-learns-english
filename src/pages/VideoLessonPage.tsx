import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Gauge,
  Play,
  Repeat,
  Square,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import PageBack from "@/components/PageBack";
import { Button } from "@/components/ui/button";
import YouTubeSegmentPlayer, { type YouTubeSegmentPlayerHandle } from "@/components/YouTubeSegmentPlayer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getVideoLesson,
  getVideoLessonProgress,
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
  const lineStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [lesson, setLesson] = useState<VideoLesson | null>(null);
  const [progress, setProgress] = useState<VideoLessonProgress | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [looping, setLooping] = useState(false);
  const [linePlaying, setLinePlaying] = useState(false);
  const [playbackRateIndex, setPlaybackRateIndex] = useState(0);

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
  const lineRhythmChunks = useMemo(
    () => lines.map((line) => getRhythmChunks(line, canUseStoredRhythm)),
    [lines, canUseStoredRhythm],
  );
  const dialogueTextClass = getDialogueTextClass(currentLine?.text ?? "");

  const blockStart = Math.floor(currentIndex / 5) * 5;
  const blockLines = lines.slice(blockStart, blockStart + 5);

  const clearBlockTimers = useCallback(() => {
    blockTimerRefs.current.forEach((timer) => clearTimeout(timer));
    blockTimerRefs.current = [];
  }, []);

  const clearLineStopTimer = useCallback(() => {
    if (lineStopTimerRef.current) clearTimeout(lineStopTimerRef.current);
    lineStopTimerRef.current = null;
  }, []);

  const stopPlayback = useCallback(() => {
    clearBlockTimers();
    clearLineStopTimer();
    setLinePlaying(false);
    setLooping(false);
    playerRef.current?.stop();
  }, [clearBlockTimers, clearLineStopTimer]);

  const scrollLineIntoView = useCallback(
    (index: number) => {
      const line = lines[index];
      if (!line) return;
      // On mobile the line list sits in normal page flow, so scrollIntoView would
      // yank the whole page down (away from the video + controls). Only auto-follow
      // inside the desktop sidebar, which has its own internal scroll container.
      if (typeof window !== "undefined" && !window.matchMedia("(min-width: 1024px)").matches) return;
      window.requestAnimationFrame(() => {
        lineButtonRefs.current.get(line.id)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    },
    [lines],
  );

  useEffect(() => {
    scrollLineIntoView(currentIndex);
  }, [currentIndex, scrollLineIntoView]);

  useEffect(
    () => () => {
      clearBlockTimers();
      clearLineStopTimer();
    },
    [clearBlockTimers, clearLineStopTimer],
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
      scrollLineIntoView(currentIndex);
      playerRef.current?.playSegment(currentLine, nextRate, true);
    }
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
          <div className="rounded-2xl border border-border bg-card p-8 shadow-1">
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
      <div className="mx-auto flex min-h-svh max-w-6xl flex-col overflow-x-hidden px-4 pb-8 pt-24 sm:px-5 sm:pt-28 lg:box-border lg:h-screen lg:min-h-0 lg:overflow-hidden lg:pb-4 lg:pt-20 xl:max-w-7xl">
        <div className="shrink-0 lg:hidden">
          <PageBack className="mb-3" />
        </div>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_350px]">
          <div className="space-y-3 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden">
            <YouTubeSegmentPlayer
              ref={playerRef}
              videoId={lesson.videoId}
              className="lg:shrink-0 lg:max-h-[calc(100vh-22rem)]"
              caption={{ vi: currentLine?.vi }}
            />

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={smooth}
              className="rounded-2xl border border-border bg-card p-3 shadow-1 lg:min-h-[230px] lg:shrink-0"
            >
              <h1 className="sr-only">{lesson.title}</h1>

              <div className="mb-2 flex min-h-[92px] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl bg-secondary/60 px-2.5 py-2 sm:min-h-[104px] sm:px-3 lg:min-h-[112px]">
                <p className={`flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center font-display font-extrabold text-foreground sm:gap-x-2 ${dialogueTextClass}`}>
                  {currentRhythmChunks.map((chunk, index) => (
                    <span key={`${chunk.start}-${chunk.text}-${index}`} className="inline-flex items-center gap-1.5 sm:gap-2">
                      <span className="rounded-xl px-1.5 py-0.5">
                        {maskText(chunk.text, hideLevel)}
                      </span>
                      {index < currentRhythmChunks.length - 1 && (
                        <span className="font-display text-2xl font-black leading-none text-primary sm:text-4xl">
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
                  className="h-12 text-base font-extrabold shadow-1"
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

              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button className="h-10 gap-1 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm" variant="outline" onClick={cyclePlaybackRate}>
                  <Gauge className="h-4 w-4" />
                  Tốc độ {playbackRateLabel}
                </Button>
                <Button
                  className="h-10 gap-1 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm"
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
                <Button className="h-10 gap-1 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm" variant="outline" onClick={hideLevel >= 3 ? resetHideLevel : increaseHideLevel}>
                  <EyeOff className="h-4 w-4" />
                  {hideLevel >= 3 ? "Hiện lại" : "Che chữ"}
                </Button>
                <Button className="h-10 gap-1 px-2 text-xs font-extrabold sm:gap-2 sm:px-3 sm:text-sm bg-success text-success-foreground hover:bg-success/90" onClick={markLearned}>
                  <Check className="h-4 w-4" />
                  Đã thuộc
                </Button>
              </div>
            </motion.div>
          </div>

          <aside className="space-y-3 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-1 lg:shrink-0">
              <h2 className="font-display text-xl font-extrabold text-foreground">Cách học</h2>
              {canUseStoredRhythm && (
                <p className="mt-2 text-sm font-semibold text-muted-foreground">
                  Dấu <span className="font-display text-xl font-black leading-none text-primary">/</span> ngắt ngắn,{" "}
                  <span className="font-display text-xl font-black leading-none text-primary">//</span> ngắt dài — đọc theo đúng nhịp.
                </p>
              )}
              <ul className="mt-3 space-y-2 text-sm font-semibold text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Play className="h-4 w-4 shrink-0 text-primary" />
                  <span><b className="font-extrabold text-foreground">Nghe</b> — nghe cả câu</span>
                </li>
                <li className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 shrink-0 text-primary" />
                  <span><b className="font-extrabold text-foreground">Tốc độ</b> — đọc nhanh hay chậm (1x · 0.75x · 0.5x)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 shrink-0 text-primary" />
                  <span><b className="font-extrabold text-foreground">Lặp câu</b> — nghe lại nhiều lần</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex shrink-0 items-center text-primary">
                    <ChevronLeft className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4" />
                  </span>
                  <span><b className="font-extrabold text-foreground">Câu trước / Câu sau</b> — chuyển câu</span>
                </li>
                <li className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4 shrink-0 text-primary" />
                  <span><b className="font-extrabold text-foreground">Che chữ</b> — ẩn bớt chữ để tập đọc thuộc</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  <span><b className="font-extrabold text-foreground">Đã thuộc</b> — đánh dấu đã học xong</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-1 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
              <div className="mb-3 shrink-0">
                <div className="mb-3 grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl bg-secondary/45 px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-extrabold text-foreground">
                      Câu {currentIndex + 1}/{lines.length} · {hideLabels[hideLevel]}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] font-bold text-muted-foreground">
                      {canUseStoredRhythm ? "Luyện nhịp bằng dấu / · nghe câu · đọc thuộc" : "Luyện nghe · che chữ · đọc thuộc"}
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
                  const chunks = lineRhythmChunks[index];
                  const showMarks = chunks.length > 1 && chunks.some((chunk) => chunk.reliable);
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
                            ? "border-success bg-success/10 text-success"
                            : "border-border bg-secondary/40 text-foreground hover:border-primary/40"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="font-display font-extrabold">Câu {index + 1}</span>
                        {done && <Check className="h-4 w-4" />}
                      </div>
                      <p className="line-clamp-2">
                        {showMarks
                          ? chunks.map((chunk, chunkIndex) => (
                              <span key={`${chunk.start}-${chunkIndex}`}>
                                {chunk.text}
                                {chunkIndex < chunks.length - 1 && (
                                  <span className="px-1 font-display font-black text-primary">{boundaryMark(chunk)}</span>
                                )}
                                {chunkIndex < chunks.length - 1 ? " " : ""}
                              </span>
                            ))
                          : line.text}
                      </p>
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
  // Only the audio-faithful skill (caption-audio-v1) produces trusted rhythm.
  return source === "caption-audio-v1";
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

  return normalized.length > 1 ? normalized : [];
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
