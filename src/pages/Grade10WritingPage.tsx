/**
 * Grade 10 Writing — four practice sections driven by grade10_writing.json:
 *
 *   1. Letter arranging        (MCQ — pick correct sentence order)
 *   2. Paragraph arranging     (MCQ — pick correct sentence order)
 *   3. Sentence arranging      (free answer — type the full sentence)
 *   4. Sentence rewriting      (free answer — complete with given structure)
 *
 * Free-writing with AI grading is planned but not shipped yet — it will wire
 * into a `/api/grade/writing` Worker endpoint when that exists.
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  Sparkles,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadGrade10Writing } from "@/data/loader";
import type {
  Grade10WritingArrangeSection,
  Grade10WritingData,
  Grade10WritingFreeAnswerSection,
  MCQuestion,
} from "@/data/types";
import { matchAnswer } from "@/lib/answerMatch";

type SectionKey =
  | "letterArranging"
  | "paragraphArranging"
  | "sentenceArranging"
  | "sentenceRewriting";

const SECTION_META: Record<
  SectionKey,
  { label: string; short: string; emoji: string; kind: "mcq" | "free" }
> = {
  letterArranging: { label: "Sắp xếp thư/email", short: "Thư", emoji: "✉️", kind: "mcq" },
  paragraphArranging: { label: "Sắp xếp đoạn văn", short: "Đoạn văn", emoji: "📄", kind: "mcq" },
  sentenceArranging: { label: "Sắp xếp câu", short: "Câu", emoji: "🧩", kind: "free" },
  sentenceRewriting: { label: "Viết lại câu", short: "Viết lại", emoji: "✍️", kind: "free" },
};

export default function Grade10WritingPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Grade10WritingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGrade10Writing()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const availableSections = useMemo<SectionKey[]>(() => {
    if (!data) return [];
    return (Object.keys(SECTION_META) as SectionKey[]).filter((k) => !!data[k]);
  }, [data]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          Đang tải bài tập…
        </div>
      </PageShell>
    );
  }

  if (!data || availableSections.length === 0) {
    return (
      <PageShell>
        <p className="py-12 text-center text-sm text-muted-foreground">
          Chưa có dữ liệu writing. Vào trang admin để import.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
          <h1 className="font-display text-xl font-black">
            <Sparkles className="mr-1 inline h-5 w-5 text-primary" />
            Writing — Lớp 10
          </h1>
          <span />
        </div>

        <Tabs defaultValue={availableSections[0]} className="space-y-6">
          <TabsList className="flex w-full flex-wrap">
            {availableSections.map((k) => (
              <TabsTrigger key={k} value={k} className="flex-1">
                <span className="mr-1">{SECTION_META[k].emoji}</span>
                <span className="hidden md:inline">{SECTION_META[k].label}</span>
                <span className="md:hidden">{SECTION_META[k].short}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {availableSections.map((k) =>
            SECTION_META[k].kind === "mcq" ? (
              <TabsContent key={k} value={k}>
                <ArrangeMcqSection section={data[k] as Grade10WritingArrangeSection} />
              </TabsContent>
            ) : (
              <TabsContent key={k} value={k}>
                <FreeAnswerSection
                  section={data[k] as Grade10WritingFreeAnswerSection}
                />
              </TabsContent>
            ),
          )}
        </Tabs>
      </div>
    </PageShell>
  );
}

// ─── Arrange (MCQ) ──────────────────────────────────────────────────────────

function ArrangeMcqSection({
  section,
}: {
  section: Grade10WritingArrangeSection;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(
    () =>
      section.questions.reduce((acc, q, i) => acc + (answers[i] === q.ans ? 1 : 0), 0),
    [answers, section.questions],
  );

  function reset() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <div className="space-y-4">
      <p className="rounded-lg border bg-muted/30 p-3 text-sm">
        <span className="font-medium">Hướng dẫn: </span>
        {section.instruction}
      </p>

      {section.questions.map((q, i) => (
        <MCQCard
          key={i}
          idx={i}
          q={q}
          selected={answers[i]}
          onPick={(optIdx) =>
            !submitted &&
            setAnswers((prev) => ({ ...prev, [i]: optIdx }))
          }
          showResult={submitted}
        />
      ))}

      <div className="sticky bottom-4 flex items-center justify-between rounded-2xl border bg-background/90 p-3 backdrop-blur">
        {submitted ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">
                {score} / {section.questions.length}
              </span>
              <span className="text-muted-foreground">
                ({Math.round((score / section.questions.length) * 100)}%)
              </span>
            </div>
            <Button onClick={reset}>Làm lại</Button>
          </>
        ) : (
          <>
            <span className="text-xs text-muted-foreground">
              Đã chọn {Object.keys(answers).length} / {section.questions.length}
            </span>
            <Button
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(answers).length === 0}
            >
              Nộp bài
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function MCQCard({
  idx,
  q,
  selected,
  onPick,
  showResult,
}: {
  idx: number;
  q: MCQuestion;
  selected: number | undefined;
  onPick: (optIdx: number) => void;
  showResult: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card p-4"
    >
      <p className="mb-3 text-sm">
        <span className="mr-2 font-semibold">Câu {idx + 1}.</span>
        {q.q}
      </p>
      <div className="grid gap-2">
        {q.opts.map((opt, i) => {
          const picked = selected === i;
          const isCorrect = i === q.ans;
          const cls = showResult
            ? isCorrect
              ? "border-green-500 bg-green-50 dark:bg-green-950/30"
              : picked
                ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                : "border-border"
            : picked
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50";
          return (
            <button
              key={i}
              onClick={() => onPick(i)}
              className={`flex items-start gap-2 rounded-xl border-2 p-3 text-left text-sm transition ${cls}`}
            >
              <span className="font-semibold">
                {String.fromCharCode(65 + i)}.
              </span>
              <span className="flex-1">{opt}</span>
              {showResult && isCorrect && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              )}
              {showResult && picked && !isCorrect && (
                <XCircle className="h-5 w-5 shrink-0 text-red-600" />
              )}
            </button>
          );
        })}
      </div>
      {showResult && q.explain && (
        <p className="mt-3 rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">
          💡 {q.explain}
        </p>
      )}
    </motion.div>
  );
}

// ─── Free answer (type to match) ────────────────────────────────────────────

function FreeAnswerSection({
  section,
}: {
  section: Grade10WritingFreeAnswerSection;
}) {
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const verdicts = useMemo(
    () =>
      section.questions.map((q, i) =>
        submitted ? matchAnswer(inputs[i] ?? "", q.answer) : null,
      ),
    [inputs, section.questions, submitted],
  );

  const score = verdicts.filter((v) => v === true).length;

  function reset() {
    setInputs({});
    setSubmitted(false);
  }

  return (
    <div className="space-y-4">
      <p className="rounded-lg border bg-muted/30 p-3 text-sm">
        <span className="font-medium">Hướng dẫn: </span>
        {section.instruction}
      </p>

      {section.questions.map((q, i) => {
        const v = verdicts[i];
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border bg-card p-4"
          >
            <p className="mb-3 text-sm">
              <span className="mr-2 font-semibold">Câu {i + 1}.</span>
              {q.q}
            </p>
            <Input
              value={inputs[i] ?? ""}
              onChange={(e) =>
                !submitted &&
                setInputs((prev) => ({ ...prev, [i]: e.target.value }))
              }
              placeholder="Nhập câu trả lời của em…"
              className={
                v === true
                  ? "border-green-500"
                  : v === false
                    ? "border-red-500"
                    : ""
              }
              disabled={submitted}
            />
            {submitted && (
              <div className="mt-2 text-xs">
                {v ? (
                  <p className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" /> Đúng rồi!
                  </p>
                ) : (
                  <p className="space-y-1 text-red-600">
                    <span className="flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> Chưa đúng. Đáp án gợi ý:
                    </span>
                    <ul className="ml-5 mt-1 list-disc text-muted-foreground">
                      {q.answer.map((a, j) => (
                        <li key={j}>{a}</li>
                      ))}
                    </ul>
                  </p>
                )}
              </div>
            )}
          </motion.div>
        );
      })}

      <div className="sticky bottom-4 flex items-center justify-between rounded-2xl border bg-background/90 p-3 backdrop-blur">
        {submitted ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">
                {score} / {section.questions.length}
              </span>
              <span className="text-muted-foreground">
                ({Math.round((score / section.questions.length) * 100)}%)
              </span>
            </div>
            <Button onClick={reset}>Làm lại</Button>
          </>
        ) : (
          <>
            <span className="text-xs text-muted-foreground">
              Đã điền {Object.values(inputs).filter((v) => v.trim()).length} /{" "}
              {section.questions.length}
            </span>
            <Button
              onClick={() => setSubmitted(true)}
              disabled={Object.values(inputs).filter((v) => v.trim()).length === 0}
            >
              Nộp bài
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
