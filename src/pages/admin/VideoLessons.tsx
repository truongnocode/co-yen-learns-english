import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { importVideoLesson, listVideoLessons, type VideoLesson } from "@/lib/videoLessons";

function sourceLabel(source: VideoLesson["source"]) {
  if (source === "caption") return "Sub chuẩn";
  if (source === "auto_caption") return "Auto-caption";
  return "AI transcript";
}

export default function VideoLessonsAdminPage() {
  const { toast } = useToast();
  const [lessons, setLessons] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

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

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    setLastCreatedId(null);
    try {
      const lesson = JSON.parse(await file.text());
      const id = await importVideoLesson(lesson);
      setLastCreatedId(id);
      await refresh();
      toast({
        title: "Đã nhập bài học",
        description: `${lesson.title ?? id} · ${lesson.lines?.length ?? 0} câu (nhịp từ skill).`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Chưa nhập được JSON",
        description: (e as Error).message,
      });
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Bài học video</h2>
        <p className="text-sm text-muted-foreground">
          Nhịp đọc (/ //) được tạo sẵn bằng skill <span className="font-mono">youtube-rhythm</span> (bám giọng đọc thật
          của video), rồi nhập file JSON vào đây để xuất bản cho học sinh.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => handleImportFile(e.target.files?.[0])}
          />
          <Button disabled={importing} onClick={() => importInputRef.current?.click()} className="min-w-40">
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Nhập JSON nhịp
          </Button>
          <span className="text-sm text-muted-foreground">
            Chọn file JSON do skill tạo (audio-faithful, <span className="font-mono">caption-audio-v1</span>). Upsert
            theo <span className="font-mono">videoId</span>.
          </span>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Cách tạo file: chạy <span className="font-mono">node scripts/rhythm-from-captions.mjs &lt;url&gt; --grade N --out bai.json</span>
            {" "}(cần yt-dlp). Không cần GPU/WhisperX/Worker — nhịp tính một lần từ caption + thời điểm từng từ.
          </p>
        </div>
      </div>

      {lastCreatedId && (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" />
          Bài đã sẵn sàng: <span className="font-mono">{lastCreatedId}</span>
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
          Chưa có bài video nào. Nhập JSON nhịp từ skill ở trên để tạo bài đầu tiên.
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
                  <Button asChild variant="secondary" size="sm">
                    <a href={`/admin/video-lessons/${lesson.id}`}>Xem nhịp</a>
                  </Button>
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
