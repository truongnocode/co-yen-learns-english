import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Link2, Loader2, PlayCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  createTranscriptFromYouTube,
  listVideoLessons,
  saveVideoLesson,
  type VideoLesson,
} from "@/lib/videoLessons";

function sourceLabel(source: VideoLesson["source"]) {
  if (source === "caption") return "Sub chuẩn";
  if (source === "auto_caption") return "Auto-caption";
  return "AI transcript";
}

export default function VideoLessonsAdminPage() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [gradeText, setGradeText] = useState("");
  const [topic, setTopic] = useState("");
  const [lessons, setLessons] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  const grade = useMemo(() => {
    const n = Number(gradeText);
    return Number.isInteger(n) && n >= 3 && n <= 10 ? n : null;
  }, [gradeText]);

  const refresh = async () => {
    setLoading(true);
    try {
      setLessons(await listVideoLessons());
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Không tải được bài video",
        description: (e as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      toast({
        variant: "destructive",
        title: "Thiếu URL",
        description: "Dán link YouTube trước khi tạo bài học.",
      });
      return;
    }

    setCreating(true);
    setLastCreatedId(null);
    try {
      const preview = await createTranscriptFromYouTube(cleanUrl);
      const id = await saveVideoLesson({
        youtubeUrl: cleanUrl,
        grade,
        topic,
        preview,
      });
      setLastCreatedId(id);
      setUrl("");
      setTopic("");
      await refresh();
      toast({
        title: "Đã tạo bài học",
        description: `${preview.title} · ${preview.lines.length} câu luyện thuộc.`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Chưa tạo được bài",
        description: (e as Error).message,
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Bài học video</h2>
        <p className="text-sm text-muted-foreground">
          Dán URL YouTube, hệ thống tự lấy phụ đề tiếng Anh công khai và chia thành từng câu để học sinh luyện thuộc.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_140px_180px_auto] lg:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">URL YouTube</label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="pl-9"
                disabled={creating}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Lớp</label>
            <Input
              value={gradeText}
              onChange={(e) => setGradeText(e.target.value)}
              placeholder="Tùy chọn"
              disabled={creating}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Chủ đề</label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Tùy chọn"
              disabled={creating}
            />
          </div>
          <Button onClick={handleCreate} disabled={creating} className="min-w-32">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            Tạo bài
          </Button>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Ưu tiên video có phụ đề tiếng Anh công khai hoặc auto-caption. Nếu YouTube không trả được phụ đề, hệ thống
            sẽ thử dùng AI để tạo transcript khi Worker đã cấu hình Gemini API key.
          </p>
        </div>
      </div>

      {lastCreatedId && (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" />
          Bài mới đã sẵn sàng: <span className="font-mono">{lastCreatedId}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Danh sách bài</h3>
          <p className="text-sm text-muted-foreground">{lessons.length} bài học video trong Firestore</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Tải lại
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      ) : lessons.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Chưa có bài video nào. Dán URL YouTube ở trên để tạo bài đầu tiên.
        </div>
      ) : (
        <div className="grid gap-3">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h4 className="truncate font-semibold">{lesson.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {lesson.lines?.length ?? 0} câu · {lesson.grade ? `Lớp ${lesson.grade}` : "Chưa gắn lớp"}
                    {lesson.topic ? ` · ${lesson.topic}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={lesson.source === "caption" ? "default" : "secondary"}>
                    {sourceLabel(lesson.source)}
                  </Badge>
                  <Button asChild variant="outline" size="sm">
                    <a href={`/video-lessons/${lesson.id}`} target="_blank" rel="noreferrer">
                      Xem bài
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
