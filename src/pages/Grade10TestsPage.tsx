import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardList, CheckCircle2, XCircle, Send, ChevronRight, Home, Trophy, Lightbulb, Search, X, ChevronLeft } from "lucide-react";
import ExplanationBox from "@/components/ExplanationBox";
import { loadGrade10Tests } from "@/data/loader";
import {
  type MCQuestion,
  type Grade10Test,
  type Grade10FillIn,
  type Grade10SignQuestion,
} from "@/data/types";
import { Progress } from "@/components/ui/progress";
import PageShell from "@/components/PageShell";
import QuizSettingsBar, { type ReviewMode } from "@/components/QuizSettingsBar";
import CountdownTimer from "@/components/CountdownTimer";
import ReviewAllAnswers from "@/components/ReviewAllAnswers";
import { matchAnswer } from "@/lib/answerMatch";
import SignVisual from "@/components/SignVisual";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

type TestData = Grade10Test;

interface FlatQuestion extends MCQuestion {
  context: string;
  passage?: string;
  sign?: string;
}

// Extract a short display label from a verbose Vietnamese exam title.
// Examples:
//   "Đề thi tuyển sinh lớp 10 THPT - Trường THCS Chính Lý, Xã Lý Nhân, Tỉnh Ninh Bình (2026-2027)"
//     → "THCS Chính Lý, Xã Lý Nhân"
//   "Đề Tuyển Sinh Lớp 10 THPT - Trường THCS Lam Hạ, Phường Hà Nam"
//     → "THCS Lam Hạ, Phường Hà Nam"
const shortTitle = (title: string): string => {
  // Take the part after the first "—", "–", "-" that follows a chunk containing "THPT" / "Tiếng Anh" / "Lớp 10".
  // Otherwise, take from "THCS" onwards. Otherwise, fall back to the original.
  const afterDash = title.split(/[-–—]/).slice(1).join(" ").trim();
  const base = afterDash || title;
  // Drop leading "Trường " and trailing "(Năm học ...)", "(2025-2026)", "(Tỉnh Ninh Bình)" noise.
  return base
    .replace(/^Trường\s+/, "")
    .replace(/\s*\((Năm\s+học|Tỉnh|Sở|20\d{2}).*?\)\s*$/i, "")
    .replace(/\s*,\s*Tỉnh\s+[^,]+$/i, "")
    .replace(/\s*–\s*Năm\s+Học\s+.*$/i, "")
    .trim();
};

const PAGE_SIZE = 24;

const Grade10TestsPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, TestData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadGrade10Tests().then(d => setData(d as Record<string, TestData>)).finally(() => setLoading(false));
  }, []);

  // Normalize a string for accent-insensitive Vietnamese search.
  const normalize = useCallback((s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d"), []);

  const allTests = useMemo(() => {
    if (!data) return [] as [string, TestData][];
    return Object.entries(data).sort(([a], [b]) => {
      // Sort by numeric suffix: test001, test002, ... test1, test2, ... legacy at the end.
      const na = parseInt(a.replace(/^test/, ""), 10);
      const nb = parseInt(b.replace(/^test/, ""), 10);
      if (isNaN(na) && isNaN(nb)) return a.localeCompare(b);
      if (isNaN(na)) return 1;
      if (isNaN(nb)) return -1;
      return na - nb;
    });
  }, [data]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allTests;
    const q = normalize(query.trim());
    return allTests.filter(([key, t]) =>
      normalize(t.title).includes(q) || key.toLowerCase().includes(q.toLowerCase()),
    );
  }, [allTests, query, normalize]);

  // Reset to page 1 whenever the search query changes.
  useEffect(() => { setPage(1); }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const visible = useMemo(
    () => filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
    [filtered, pageSafe],
  );

  if (loading) return <PageShell><div className="flex items-center justify-center pt-40 text-muted-foreground">Đang tải...</div></PageShell>;
  if (!data) return <PageShell><div className="flex items-center justify-center pt-40 text-muted-foreground">Không có dữ liệu.</div></PageShell>;

  if (!selectedTest) {
    return (
      <PageShell>
        <div className="max-w-5xl mx-auto px-5 pt-28 pb-20">
          <div className="flex items-center gap-3 mb-6">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/grade/10")}
              className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div className="flex-1">
              <p className="font-display font-extrabold text-sm text-foreground">Ôn thi vào lớp 10</p>
              <p className="text-xs text-muted-foreground">Đề thi thử</p>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/dashboard")}
              className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
              <Home className="h-5 w-5" />
            </motion.button>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={smooth}
            className="gradient-orange-card text-white rounded-3xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
            <ClipboardList className="h-8 w-8 mb-2 opacity-80 relative z-10" />
            <h1 className="font-display font-extrabold text-2xl relative z-10">Đề thi thử vào 10</h1>
            <p className="text-white/70 text-sm relative z-10">{allTests.length} đề thi từ các trường THCS</p>
          </motion.div>

          {/* Search bar */}
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên trường, xã, phường, hoặc mã đề..."
              className="w-full bg-card/80 backdrop-blur-xl border border-border/30 rounded-2xl pl-11 pr-11 py-3 text-sm text-foreground shadow-lg focus:outline-none focus:border-primary transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Result count / pagination summary */}
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs text-muted-foreground">
              {filtered.length === 0
                ? "Không tìm thấy đề phù hợp"
                : `Hiển thị ${(pageSafe - 1) * PAGE_SIZE + 1}–${Math.min(pageSafe * PAGE_SIZE, filtered.length)} trên ${filtered.length} đề`}
            </p>
            {totalPages > 1 && (
              <p className="text-xs text-muted-foreground">Trang {pageSafe}/{totalPages}</p>
            )}
          </div>

          {/* Compact grid */}
          {visible.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Không có đề phù hợp với từ khóa "{query}".
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visible.map(([key, test]) => {
                // Test number badge: "test002" → "002", "test12" → "12"
                const num = key.replace(/^test/, "");
                return (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTest(key)}
                    className="bg-card/80 backdrop-blur-xl rounded-2xl p-4 text-left border border-border/30 shadow-md hover:shadow-lg hover:border-primary/30 transition-all flex items-start gap-3"
                  >
                    <div className="shrink-0 w-11 h-11 rounded-xl gradient-orange-card text-white flex items-center justify-center font-display font-extrabold text-xs">
                      #{num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-foreground text-sm leading-snug line-clamp-2">
                        {shortTitle(test.title)}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-1">3 phần · Part A, B, C</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-2" />
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageSafe === 1}
                className="p-2 rounded-xl bg-card/80 backdrop-blur-xl shadow-md border border-border/30 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </motion.button>

              {/* Page number buttons: first, current ± 1, last */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - pageSafe) <= 1)
                .map((n, i, arr) => (
                  <div key={n} className="flex items-center gap-2">
                    {i > 0 && arr[i - 1] !== n - 1 && <span className="text-muted-foreground text-xs px-1">…</span>}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPage(n)}
                      className={`min-w-[2.25rem] h-9 px-3 rounded-xl shadow-md border text-sm font-display font-bold transition-colors ${
                        n === pageSafe
                          ? "gradient-primary text-white border-transparent"
                          : "bg-card/80 backdrop-blur-xl border-border/30 text-foreground hover:border-primary/30"
                      }`}
                    >
                      {n}
                    </motion.button>
                  </div>
                ))}

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageSafe === totalPages}
                className="p-2 rounded-xl bg-card/80 backdrop-blur-xl shadow-md border border-border/30 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Trang sau"
              >
                <ChevronRight className="h-4 w-4 text-foreground" />
              </motion.button>
            </div>
          )}
        </div>
      </PageShell>
    );
  }

  return <TestExam test={data[selectedTest]} onBack={() => setSelectedTest(null)} />;
};

const TestExam = ({ test, onBack }: { test: TestData; onBack: () => void }) => {
  const allQuestions: FlatQuestion[] = [];
  test.partA.questions.forEach(q => allQuestions.push({ ...q, context: "Part A: Ngữ pháp & Từ vựng" }));
  if (test.partB.cloze) test.partB.cloze.questions.forEach(q => allQuestions.push({ ...q, context: "Part B: Điền từ vào đoạn văn", passage: test.partB.cloze.passage }));
  if (test.partB.signs) test.partB.signs.forEach((s: Grade10SignQuestion) => allQuestions.push({ q: s.q, opts: s.opts, ans: s.ans, explain: s.explain, context: "Part B: Đọc biển báo", sign: s.sign }));
  [test.partB.reading1, test.partB.reading2].forEach(r => {
    if (r) r.questions.forEach(q => allQuestions.push({ ...q, context: `Part B: Đọc hiểu · ${r.title}`, passage: r.passage }));
  });

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [partCAnswers, setPartCAnswers] = useState<string[]>([]);
  const [partCSubmitted, setPartCSubmitted] = useState(false);
  const [showPartC, setShowPartC] = useState(false);
  const [partCScore, setPartCScore] = useState(0);

  // Review mode & timer state
  const [reviewMode, setReviewMode] = useState<ReviewMode>("instant");
  const [timeLimit, setTimeLimit] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(allQuestions.length).fill(null));
  const [timerStarted, setTimerStarted] = useState(false);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalMCQ = allQuestions.length;
  const q = allQuestions[current];
  const progress = ((current + 1) / totalMCQ) * 100;
  const partCQuestions = test.partC?.fill_in || [];

  const handleTimeUp = useCallback(() => {
    // Calculate score from answered questions
    let s = 0;
    userAnswers.forEach((ans, i) => {
      if (ans !== null && ans === allQuestions[i].ans) s++;
    });
    setScore(s);
    setFinished(true);
  }, [userAnswers, allQuestions]);

  // Handle "after" mode selection: auto-advance after 500ms
  const handleAfterModeSelect = useCallback((idx: number) => {
    if (submitted) return;
    setSelected(idx);
    // Track answer
    setUserAnswers(prev => { const n = [...prev]; n[current] = idx; return n; });
    // Start timer on first interaction
    if (!timerStarted) setTimerStarted(true);

    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    autoAdvanceRef.current = setTimeout(() => {
      if (current < totalMCQ - 1) {
        setCurrent(c => c + 1);
        setSelected(null);
      } else {
        // Calculate score
        const updatedAnswers = [...userAnswers];
        updatedAnswers[current] = idx;
        let s = 0;
        updatedAnswers.forEach((a, i) => {
          if (a !== null && a === allQuestions[i].ans) s++;
        });
        setScore(s);
        setFinished(true);
      }
    }, 500);
  }, [current, totalMCQ, submitted, userAnswers, allQuestions, timerStarted]);

  // Cleanup auto-advance on unmount
  useEffect(() => {
    return () => { if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current); };
  }, []);

  if (finished && !showPartC && partCQuestions.length > 0) {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto px-5 pt-28 pb-20 text-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-border/30">
            <h2 className="font-display font-extrabold text-2xl text-foreground mb-2">Part A & B hoàn thành!</h2>
            <p className="text-4xl font-display font-bold text-primary my-4">{score}/{totalMCQ}</p>
            {reviewMode === "after" && (
              <ReviewAllAnswers
                questions={allQuestions.map((aq, i) => ({
                  q: aq.q,
                  opts: aq.opts,
                  ans: aq.ans,
                  explain: aq.explain,
                  selected: userAnswers[i],
                  sign: aq.sign,
                }))}
              />
            )}
            <p className="text-muted-foreground text-sm mb-6 mt-4">Tiếp tục với Part C (Viết)</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setShowPartC(true); setPartCAnswers(new Array(partCQuestions.length).fill("")); }}
              className="gradient-accent text-white px-8 py-3 rounded-2xl font-display font-bold">Làm Part C →</motion.button>
          </motion.div>
        </div>
      </PageShell>
    );
  }

  if (showPartC) {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto px-5 pt-28 pb-20">
          <div className="flex items-center gap-3 mb-5">
            <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}
              className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <p className="font-display font-extrabold text-sm text-foreground flex-1">Part C: Viết</p>
          </div>
          {partCSubmitted ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-border/30 text-center">
              <div className="text-5xl mb-3">📝</div>
              <h3 className="font-display font-extrabold text-2xl text-foreground mb-4">Kết quả tổng hợp</h3>
              <p className="text-muted-foreground text-sm">Trắc nghiệm: <span className="font-bold text-foreground">{score}/{totalMCQ}</span></p>
              <p className="text-muted-foreground text-sm">Tự luận: <span className="font-bold text-foreground">{partCScore}/{partCQuestions.length}</span></p>
              <p className="text-4xl font-display font-bold text-primary my-4">{score + partCScore}/{totalMCQ + partCQuestions.length}</p>
              <div className="flex items-center justify-center gap-2 bg-energy/10 border border-energy/20 rounded-2xl p-3 mb-4 max-w-xs mx-auto">
                <Trophy className="h-5 w-5 text-energy" />
                <span className="font-display font-extrabold text-lg text-energy">Điểm: {(((score + partCScore) / (totalMCQ + partCQuestions.length)) * 10).toFixed(1)}/10</span>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={onBack}
                className="gradient-primary text-white px-8 py-3 rounded-2xl font-display font-bold">Chọn đề khác</motion.button>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-4">
              {partCQuestions.map((pq: Grade10FillIn, i: number) => (
                <div key={i} className="bg-card/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-border/30">
                  <p className="font-medium text-foreground text-sm mb-3 whitespace-pre-line">{pq.q}</p>
                  <input value={partCAnswers[i] || ""} onChange={e => { const a = [...partCAnswers]; a[i] = e.target.value; setPartCAnswers(a); }}
                    placeholder="Nhập đáp án..."
                    className="w-full bg-card/80 border-2 border-border/30 rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>
              ))}
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                let s = 0;
                partCQuestions.forEach((pq: Grade10FillIn, i: number) => {
                  if (pq.answer?.some((a: string) => matchAnswer(partCAnswers[i] || "", [a]))) s++;
                });
                setPartCScore(s); setPartCSubmitted(true);
              }} className="gradient-primary text-white py-3.5 rounded-2xl font-display font-bold text-sm">Nộp bài</motion.button>
            </div>
          )}
        </div>
      </PageShell>
    );
  }

  if (finished) {
    const pct = Math.round((score / totalMCQ) * 100);
    return (
      <PageShell>
        <div className="max-w-lg mx-auto px-5 pt-28 pb-20 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-border/30">
            <div className="text-5xl mb-3">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
            <h2 className="font-display font-extrabold text-2xl text-foreground mb-2">{test.title}</h2>
            <p className="text-4xl font-display font-bold text-primary my-4">{score}/{totalMCQ}</p>
            <div className="flex items-center justify-center gap-2 bg-energy/10 border border-energy/20 rounded-2xl p-3 mb-6 max-w-xs mx-auto">
              <Trophy className="h-5 w-5 text-energy" />
              <span className="font-display font-extrabold text-lg text-energy">Điểm: {((score / totalMCQ) * 10).toFixed(1)}/10</span>
            </div>
            {reviewMode === "after" && (
              <ReviewAllAnswers
                questions={allQuestions.map((aq, i) => ({
                  q: aq.q,
                  opts: aq.opts,
                  ans: aq.ans,
                  explain: aq.explain,
                  selected: userAnswers[i],
                  sign: aq.sign,
                }))}
              />
            )}
            <motion.button whileTap={{ scale: 0.95 }} onClick={onBack}
              className="gradient-primary text-white px-8 py-3 rounded-2xl font-display font-bold mt-4">Chọn đề khác</motion.button>
          </motion.div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-5 pt-28 pb-20">
        <div className="flex items-center gap-3 mb-5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div className="flex-1">
            <p className="font-display font-extrabold text-sm text-foreground">{test.title}</p>
            <p className="text-xs text-muted-foreground">{q.context}</p>
          </div>
          {timeLimit > 0 && (
            <CountdownTimer minutes={timeLimit} onTimeUp={handleTimeUp} started={timerStarted} />
          )}
        </div>

        {/* Settings bar: show only before first question and not yet submitted */}
        {current === 0 && !submitted && !timerStarted && (
          <QuizSettingsBar
            reviewMode={reviewMode}
            onReviewModeChange={setReviewMode}
            timeLimit={timeLimit}
            onTimeLimitChange={setTimeLimit}
          />
        )}

        <Progress value={progress} className="h-2 rounded-full mb-1" />
        <p className="text-xs text-muted-foreground text-right mb-4">Câu {current + 1}/{totalMCQ}</p>

        {q.passage && (
          <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-4 mb-4 text-sm text-foreground leading-relaxed max-h-64 overflow-y-auto border border-border/20 whitespace-pre-line">
            {(() => {
              // Check if question references a word in the passage (e.g., 'The word "their" refers to...')
              const refMatch = q.q.match(/[Tt]he\s+word\s+"([^"]+)"/);
              if (!refMatch) return q.passage;
              const refWord = refMatch[1];
              // Highlight all occurrences of the referenced word in passage
              const regex = new RegExp(`\\b(${refWord})\\b`, "gi");
              const parts = q.passage.split(regex);
              return parts.map((part, i) =>
                regex.test(part) ? (
                  <span key={i} className="underline decoration-2 decoration-primary font-bold text-primary">{part}</span>
                ) : part
              );
            })()}
          </div>
        )}

        {q.sign && <SignVisual sign={q.sign} />}

        <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-border/30">
          <p className="font-display font-bold text-foreground text-lg mb-5 leading-relaxed">{q.q}</p>
          <div className="flex flex-col gap-2.5">
            {q.opts.map((opt, idx) => {
              let cls = "bg-secondary/50 border-2 border-transparent text-foreground hover:border-primary/30";
              if (reviewMode === "after") {
                // "after" mode: just highlight selected in primary color
                if (selected === idx) cls = "bg-primary/10 border-2 border-primary text-primary shadow-md";
              } else {
                // "instant" mode: show correct/incorrect after submit
                if (submitted) {
                  if (idx === q.ans) cls = "bg-success/10 border-2 border-success text-success";
                  else if (idx === selected && idx !== q.ans) cls = "bg-destructive/10 border-2 border-destructive text-destructive";
                  else cls = "bg-secondary/30 border-2 border-transparent text-muted-foreground opacity-50";
                } else if (selected === idx) cls = "bg-primary/10 border-2 border-primary text-primary shadow-md";
              }
              return (
                <button key={idx} onClick={() => {
                  if (reviewMode === "after") {
                    handleAfterModeSelect(idx);
                  } else {
                    if (!submitted) setSelected(idx);
                  }
                }} className={`p-4 rounded-2xl text-left font-medium transition-all ${cls}`}>
                  <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>{opt}
                </button>
              );
            })}
          </div>

          {/* Instant mode buttons */}
          {reviewMode === "instant" && (
            <div className="mt-6">
              {!submitted ? (
                <button onClick={() => {
                  if (selected === null) return;
                  setSubmitted(true);
                  if (!timerStarted) setTimerStarted(true);
                  setUserAnswers(prev => { const n = [...prev]; n[current] = selected; return n; });
                  if (selected === q.ans) setScore(s => s + 1);
                }} disabled={selected === null}
                  className={`w-full py-3.5 rounded-2xl font-display font-bold text-sm transition-all ${selected === null ? "bg-muted text-muted-foreground" : "gradient-primary text-white"}`}>Kiểm tra</button>
              ) : (
                <button onClick={() => { if (current < totalMCQ - 1) { setCurrent(c => c + 1); setSelected(null); setSubmitted(false); } else setFinished(true); }}
                  className="w-full py-3.5 rounded-2xl font-display font-bold text-sm gradient-accent text-white">
                  {current < totalMCQ - 1 ? "Câu tiếp →" : "Hoàn thành"}
                </button>
              )}
            </div>
          )}

          {/* Instant mode feedback */}
          {reviewMode === "instant" && submitted && (
            <>
              <div className={`mt-4 flex items-center gap-2 text-sm font-medium ${selected === q.ans ? "text-success" : "text-destructive"}`}>
                {selected === q.ans ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {selected === q.ans ? "Chính xác!" : `Đáp án: ${String.fromCharCode(65 + q.ans)}. ${q.opts[q.ans]}`}
              </div>
              <ExplanationBox
                explain={q.explain}
                isCorrect={selected === q.ans}
                correctAnswer={q.opts[q.ans]}
                correctIndex={q.ans}
                opts={q.opts}
                selectedIndex={selected}
              />
            </>
          )}
        </motion.div>
      </div>
    </PageShell>
  );
};

export default Grade10TestsPage;
