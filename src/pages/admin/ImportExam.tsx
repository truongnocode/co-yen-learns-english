/**
 * Admin: upload a PDF/DOCX → Worker extracts structured JSON → teacher previews
 * and saves to Firestore.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  importExam,
  importSgkUnit,
  saveImportResult,
} from "@/lib/api-client";
import type { Exam, ImportResult, SgkUnit } from "@/lib/content-schema";

type Mode = "exam" | "sgk_unit";

interface Preview {
  result: ImportResult;
  attempts: number;
}

export default function ImportExamPage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("exam");
  const [file, setFile] = useState<File | null>(null);
  const [grade, setGrade] = useState<number>(10);
  const [unitKey, setUnitKey] = useState<string>("0");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [overwrite, setOverwrite] = useState(false);

  const canSubmit = !!file && !busy && (mode === "exam" || (!!unitKey && grade >= 3));

  async function onExtract() {
    if (!file) return;
    setBusy(true);
    setPreview(null);
    try {
      if (mode === "exam") {
        const res = await importExam(file, grade);
        setPreview({
          result: { kind: "exam", exam: res.exam },
          attempts: res.attempts,
        });
      } else {
        const res = await importSgkUnit(file, grade, unitKey);
        setPreview({
          result: {
            kind: "sgk_unit",
            grade: res.grade as 3 | 4 | 5 | 6 | 7 | 8 | 9,
            unitKey: res.unitKey,
            unit: res.unit,
          },
          attempts: res.attempts,
        });
      }
      toast({ title: "Trích xuất thành công", description: `Claude attempts: ${preview?.attempts ?? "?"}` });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Trích xuất lỗi",
        description: (e as Error).message,
      });
    } finally {
      setBusy(false);
    }
  }

  async function onSave() {
    if (!preview) return;
    setSaving(true);
    try {
      const res = await saveImportResult(preview.result, overwrite);
      toast({
        title: "Đã lưu",
        description: `Firestore: ${res.docPath}`,
      });
      setPreview(null);
      setFile(null);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 409) {
        toast({
          variant: "destructive",
          title: "Đã tồn tại",
          description: "Bật 'Ghi đè' nếu muốn thay thế bản cũ.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Lưu lỗi",
          description: err.message,
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Import nội dung</h2>
        <p className="text-sm text-muted-foreground">
          Tải lên file PDF hoặc Word (.docx). Claude sẽ phân tích nội dung và
          tạo JSON theo đúng schema. Duyệt preview rồi lưu vào Firestore.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Loại nội dung</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exam">Đề thi (MCQ/cloze/reading/writing)</SelectItem>
              <SelectItem value="sgk_unit">Unit SGK (vocab/grammar/exercises)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Lớp</Label>
          <Select
            value={String(grade)}
            onValueChange={(v) => setGrade(parseInt(v, 10))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                <SelectItem key={g} value={String(g)}>
                  Lớp {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {mode === "sgk_unit" && (
          <div className="space-y-2">
            <Label>Unit key</Label>
            <Input
              value={unitKey}
              onChange={(e) => setUnitKey(e.target.value)}
              placeholder="e.g. 0, 1, 2"
            />
          </div>
        )}

        <div className="space-y-2 md:col-span-2">
          <Label>File (PDF/DOCX, tối đa 20MB)</Label>
          <Input
            type="file"
            accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file && (
            <p className="text-xs text-muted-foreground">
              {file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={onExtract} disabled={!canSubmit}>
          {busy ? "Đang xử lý…" : "Trích xuất"}
        </Button>
        {busy && (
          <p className="text-xs text-muted-foreground">
            Claude đang đọc file, có thể mất 30-90 giây…
          </p>
        )}
      </div>

      {preview && (
        <PreviewPanel
          preview={preview}
          overwrite={overwrite}
          setOverwrite={setOverwrite}
          onSave={onSave}
          saving={saving}
          onChange={(result) => setPreview({ ...preview, result })}
        />
      )}
    </div>
  );
}

interface PreviewPanelProps {
  preview: Preview;
  overwrite: boolean;
  setOverwrite: (v: boolean) => void;
  onSave: () => void;
  saving: boolean;
  onChange: (result: ImportResult) => void;
}

function PreviewPanel({
  preview,
  overwrite,
  setOverwrite,
  onSave,
  saving,
  onChange,
}: PreviewPanelProps) {
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(preview.result, null, 2),
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  function onJsonEdit(v: string) {
    setJsonText(v);
    try {
      const parsed = JSON.parse(v) as ImportResult;
      setJsonError(null);
      onChange(parsed);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  }

  const summary = summarize(preview.result);

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">Preview</h3>
          <p className="text-sm text-muted-foreground">
            {summary} · {preview.attempts} attempt(s)
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
            />
            Ghi đè nếu đã tồn tại
          </label>
          <Button onClick={onSave} disabled={saving || !!jsonError}>
            {saving ? "Đang lưu…" : "Lưu vào Firestore"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>JSON (có thể chỉnh sửa trước khi lưu)</Label>
        <Textarea
          value={jsonText}
          onChange={(e) => onJsonEdit(e.target.value)}
          className="font-mono text-xs h-96"
        />
        {jsonError && (
          <p className="text-xs text-destructive">JSON không hợp lệ: {jsonError}</p>
        )}
      </div>
    </div>
  );
}

function summarize(r: ImportResult): string {
  switch (r.kind) {
    case "exam": {
      const e: Exam = r.exam;
      const aCount = e.partA.questions.length;
      const bCloze = e.partB.cloze?.questions.length ?? 0;
      const bSigns = e.partB.signs?.length ?? 0;
      const bRead =
        (e.partB.reading1?.questions.length ?? 0) +
        (e.partB.reading2?.questions.length ?? 0);
      return `Exam grade ${e.grade} — "${e.title}" · Part A: ${aCount} MCQ · Part B: ${bCloze} cloze / ${bSigns} signs / ${bRead} reading Q`;
    }
    case "sgk_unit": {
      const u: SgkUnit = r.unit;
      return `SGK grade ${r.grade} unit ${r.unitKey} — "${u.title}" · ${u.vocabulary.length} vocab · ${u.exercises.length} MCQ`;
    }
    case "grade10_vocab":
      return `Grade 10 vocab — ${r.topic.name} · ${r.topic.questions.length} Q`;
    case "grade10_grammar":
      return `Grade 10 grammar — ${r.topic.name}`;
  }
}
