import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  getVideoLesson,
  saveVideoLessonReview,
  type VideoLesson,
  type VideoLessonLine,
  type VideoLessonRhythmBoundary,
  type VideoLessonRhythmChunk,
} from "@/lib/videoLessons";

export default function VideoLessonReviewPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lesson, setLesson] = useState<VideoLesson | null>(null);
  const [lines, setLines] = useState<VideoLessonLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!lessonId) return;
    setLoading(true);
    getVideoLesson(lessonId)
      .then((row) => {
        setLesson(row);
        setLines(row?.lines.map(cloneLine) ?? []);
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Khong tai duoc bai video",
          description: (error as Error).message,
        });
      })
      .finally(() => setLoading(false));
  }, [lessonId, toast]);

  const stats = useMemo(() => {
    const boundaries = lines.flatMap((line) =>
      (line.rhythmChunks ?? []).map((chunk) => chunk.boundaryAfter).filter(Boolean) as VideoLessonRhythmBoundary[],
    );
    return {
      lines: lines.length,
      chunks: lines.reduce((sum, line) => sum + (line.rhythmChunks?.length ?? 0), 0),
      boundaries: boundaries.length,
      lowConfidence: boundaries.filter((boundary) => boundary.confidence < 0.5).length,
      major: boundaries.filter((boundary) => boundary.type === "major").length,
    };
  }, [lines]);

  const updateLine = (lineIndex: number, updater: (line: VideoLessonLine) => VideoLessonLine) => {
    setLines((current) => current.map((line, index) => (index === lineIndex ? updater(cloneLine(line)) : line)));
    setDirty(true);
  };

  const toggleBoundary = (lineIndex: number, chunkIndex: number) => {
    updateLine(lineIndex, (line) => {
      const chunks = line.rhythmChunks?.map(cloneChunk) ?? [];
      const current = chunks[chunkIndex];
      const next = chunks[chunkIndex + 1];
      if (!current || !next) return line;

      const boundary = current.boundaryAfter ?? createBoundary(current, next);
      current.boundaryAfter = {
        ...boundary,
        type: boundary.type === "major" ? "minor" : "major",
        confidence: Math.max(boundary.confidence ?? 0, 0.95),
      };
      return { ...line, rhythmChunks: chunks };
    });
  };

  const removeBoundary = (lineIndex: number, chunkIndex: number) => {
    updateLine(lineIndex, (line) => {
      const chunks = line.rhythmChunks?.map(cloneChunk) ?? [];
      const current = chunks[chunkIndex];
      const next = chunks[chunkIndex + 1];
      if (!current || !next) return line;

      const merged: VideoLessonRhythmChunk = {
        text: normalizeText(`${current.text} ${next.text}`),
        start: current.start,
        end: next.end,
        boundaryAfter: next.boundaryAfter,
      };
      chunks.splice(chunkIndex, 2, merged);
      return { ...line, rhythmChunks: chunks.length > 1 ? chunks : undefined };
    });
  };

  const save = async () => {
    if (!lessonId || !lesson) return;
    setSaving(true);
    try {
      await saveVideoLessonReview({
        lessonId,
        lines,
        rhythmSource: lesson.rhythmSource,
      });
      setDirty(false);
      toast({
        title: "Da luu review",
        description: `${lines.length} cau da duoc cap nhat.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Chua luu duoc",
        description: (error as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-base text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Dang tai bai video...
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-1">
        <p className="font-display font-bold text-foreground">Khong tim thay bai video.</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/admin/video-lessons")}>
          Quay lai
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" className="mb-2 px-0" onClick={() => navigate("/admin/video-lessons")}>
            <ArrowLeft className="h-4 w-4" />
            Danh sach video
          </Button>
          <h2 className="truncate font-display text-2xl font-bold text-foreground">{lesson.title}</h2>
          <p className="text-base text-muted-foreground">
            {lesson.videoId} · {lesson.rhythmSource ?? "none"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={stats.lowConfidence > 0 ? "destructive" : "secondary"}>
            {stats.lowConfidence} can xem
          </Badge>
          <Badge variant="outline">{stats.boundaries} dau ngat</Badge>
          <Badge variant="outline">{stats.major} ngat dai</Badge>
          <Button onClick={save} disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Luu review
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {lines.map((line, lineIndex) => (
          <section key={line.id} className="rounded-2xl border border-border bg-card p-4 shadow-1">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-foreground">Cau {lineIndex + 1}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatTime(line.start)} - {formatTime(line.end)}
                </p>
              </div>
              <Badge variant={line.rhythmChunks?.some((chunk) => (chunk.boundaryAfter?.confidence ?? 1) < 0.5) ? "destructive" : "secondary"}>
                {line.rhythmChunks?.length ?? 1} cum
              </Badge>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-secondary p-3">
              {(line.rhythmChunks && line.rhythmChunks.length > 1 ? line.rhythmChunks : [{ text: line.text, start: line.start, end: line.end }]).map(
                (chunk, chunkIndex, chunks) => (
                  <span key={`${line.id}-${chunkIndex}`} className="inline-flex items-center gap-2">
                    <span className="rounded-lg border border-border bg-card px-2 py-1 text-base text-foreground">{chunk.text}</span>
                    {chunkIndex < chunks.length - 1 && (
                      <span className="inline-flex items-center gap-1">
                        <Button
                          type="button"
                          variant={boundaryVariant(chunk.boundaryAfter)}
                          size="sm"
                          className="h-8 min-w-10 px-2 font-mono text-base font-bold"
                          onClick={() => toggleBoundary(lineIndex, chunkIndex)}
                          title={boundaryTitle(chunk.boundaryAfter)}
                        >
                          {chunk.boundaryAfter?.type === "major" ? "//" : "/"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground"
                          onClick={() => removeBoundary(lineIndex, chunkIndex)}
                          title="Xoa dau ngat nay"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </span>
                    )}
                  </span>
                ),
              )}
            </div>

            <div className="rounded-xl border border-border bg-background p-3 text-base leading-relaxed text-foreground">{line.text}</div>
          </section>
        ))}
      </div>

      {dirty && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={save} disabled={saving} className="shadow-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Luu thay doi
          </Button>
        </div>
      )}
    </div>
  );
}

function cloneLine(line: VideoLessonLine): VideoLessonLine {
  return {
    ...line,
    rhythmChunks: line.rhythmChunks?.map(cloneChunk),
  };
}

function cloneChunk(chunk: VideoLessonRhythmChunk): VideoLessonRhythmChunk {
  return {
    ...chunk,
    boundaryAfter: chunk.boundaryAfter
      ? {
          ...chunk.boundaryAfter,
          sources: [...chunk.boundaryAfter.sources],
        }
      : undefined,
  };
}

function createBoundary(current: VideoLessonRhythmChunk, next: VideoLessonRhythmChunk): VideoLessonRhythmBoundary {
  return {
    type: "minor",
    pauseMs: Math.max(0, Math.round((next.start - current.end) * 1000)),
    confidence: 0.95,
    sources: ["syntax"],
  };
}

function boundaryVariant(boundary?: VideoLessonRhythmBoundary): "default" | "secondary" | "destructive" | "outline" {
  if (!boundary) return "outline";
  if (boundary.confidence < 0.5) return "destructive";
  if (boundary.type === "major") return "default";
  return "secondary";
}

function boundaryTitle(boundary?: VideoLessonRhythmBoundary): string {
  if (!boundary) return "Khong co metadata";
  const sources = boundary.sources.length ? boundary.sources.join(", ") : "unknown";
  return `${boundary.type} · pause ${boundary.pauseMs}ms · confidence ${Math.round(boundary.confidence * 100)}% · ${sources}`;
}

function formatTime(value: number): string {
  const safe = Math.max(0, Number(value) || 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`;
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();
}
