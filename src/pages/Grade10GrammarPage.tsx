import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, CheckCircle2, XCircle, Send, Home, Trophy } from "lucide-react";
import ExplanationBox from "@/components/ExplanationBox";
import { loadGrade10Grammar } from "@/data/loader";
import { type Grade10GrammarData, type MCQuestion } from "@/data/types";
import { Progress } from "@/components/ui/progress";
import PageShell from "@/components/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuizSettingsBar, { type ReviewMode } from "@/components/QuizSettingsBar";
import CountdownTimer from "@/components/CountdownTimer";
import ReviewAllAnswers from "@/components/ReviewAllAnswers";
import { matchAnswer } from "@/lib/answerMatch";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

// Shared result component
const ResultCard = ({ score, total, onRetry, children }: { score: number; total: number; onRetry: () => void; children?: React.ReactNode }) => {
  const pct = Math.round((score / total) * 100);
  const xp = score * 10;
  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-border/30 text-center">
      <div className="text-5xl mb-3">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
      <div className="grid grid-cols-2 gap-3 mb-4 max-w-xs mx-auto">
        <div className="bg-success/10 border border-success/20 rounded-2xl p-3 text-center">
          <span className="font-display font-extrabold text-2xl text-success">{score}</span>
          <span className="text-xs font-bold text-success block">Đúng</span>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3 text-center">
          <span className="font-display font-extrabold text-2xl text-destructive">{total - score}</span>
          <span className="text-xs font-bold text-destructive block">Sai</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 bg-energy/10 border border-energy/20 rounded-2xl p-3 mb-6 max-w-xs mx-auto">
        <Trophy className="h-5 w-5 text-energy" />
        <span className="font-display font-extrabold text-lg text-energy">+{xp} XP</span>
      </div>
      {children}
      <motion.button whileTap={{ scale: 0.95 }} onClick={onRetry}
        className="gradient-primary text-white px-6 py-3 rounded-2xl font-display font-bold text-sm mt-4">Làm lại</motion.button>
    </motion.div>
  );
};

const Grade10GrammarPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Grade10GrammarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("instant");
  const [timeLimit, setTimeLimit] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => {
    loadGrade10Grammar().then(setData).finally(() => setLoading(false));
  }, []);

  // Reset timer when topic changes
  useEffect(() => {
    setTimerStarted(false);
    setTimerKey(k => k + 1);
  }, [selectedTopic]);

  const handleTimeUp = useCallback(() => {
    // Dispatch custom event so child sections can handle it
    window.dispatchEvent(new CustomEvent("quiz-time-up"));
  }, []);

  const handleStartTimer = useCallback(() => {
    if (!timerStarted) setTimerStarted(true);
  }, [timerStarted]);

  if (loading) return <PageShell><div className="flex items-center justify-center pt-40 text-muted-foreground">Đang tải...</div></PageShell>;
  if (!data) return <PageShell><div className="flex items-center justify-center pt-40 text-muted-foreground">Không có dữ liệu.</div></PageShell>;

  const topics = Object.entries(data);

  if (!selectedTopic) {
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto px-5 pt-28 pb-20">
          <div className="flex items-center gap-3 mb-6">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/grade/10")}
              className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div className="flex-1">
              <p className="font-display font-extrabold text-sm text-foreground">Ôn thi vào lớp 10</p>
              <p className="text-xs text-muted-foreground">Ngữ pháp</p>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/dashboard")}
              className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
              <Home className="h-5 w-5" />
            </motion.button>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={smooth}
            className="gradient-cool text-white rounded-3xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
            <Zap className="h-8 w-8 mb-2 opacity-80 relative z-10" />
            <h1 className="font-display font-extrabold text-2xl relative z-10">Ngữ pháp Lớp 10</h1>
            <p className="text-white/70 text-sm relative z-10">{topics.length} chủ đề</p>
          </motion.div>

          <div className="flex flex-col gap-3">
            {topics.map(([key, topic], i) => {
              const types = Object.keys(topic.exercises);
              return (
                <motion.button key={key}
                  initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ ...smooth, delay: i * 0.04 }}
                  whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTopic(key)}
                  className="bg-card/80 backdrop-blur-xl rounded-2xl p-5 text-left border border-border/30 shadow-lg hover:shadow-xl transition-all"
                >
                  <h3 className="font-display font-bold text-foreground">{topic.name}</h3>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {types.includes("mcq") && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Trắc nghiệm</span>}
                    {types.includes("rearrange") && <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold">Sắp xếp</span>}
                    {types.includes("completion") && <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-bold">Điền từ</span>}
                    {types.includes("rewrite") && <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-bold">Viết lại</span>}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </PageShell>
    );
  }

  const topic = data[selectedTopic];

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <div className="flex items-center gap-3 mb-5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSelectedTopic(null)}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <p className="font-display font-extrabold text-sm text-foreground flex-1">{topic.name}</p>
          {timeLimit > 0 && (
            <CountdownTimer key={timerKey} minutes={timeLimit} onTimeUp={handleTimeUp} started={timerStarted} />
          )}
        </div>

        <QuizSettingsBar
          reviewMode={reviewMode}
          onReviewModeChange={setReviewMode}
          timeLimit={timeLimit}
          onTimeLimitChange={setTimeLimit}
        />

        <Tabs defaultValue={Object.keys(topic.exercises)[0]} className="w-full">
          <TabsList className="w-full flex bg-card/60 backdrop-blur-xl rounded-2xl p-1 mb-4 flex-wrap h-auto gap-1 border border-border/30">
            {topic.exercises.mcq && <TabsTrigger value="mcq" className="flex-1 rounded-xl text-xs font-bold py-2 data-[state=active]:gradient-primary data-[state=active]:text-white">Trắc nghiệm</TabsTrigger>}
            {topic.exercises.rearrange && <TabsTrigger value="rearrange" className="flex-1 rounded-xl text-xs font-bold py-2 data-[state=active]:gradient-accent data-[state=active]:text-white">Sắp xếp từ</TabsTrigger>}
            {topic.exercises.completion && <TabsTrigger value="completion" className="flex-1 rounded-xl text-xs font-bold py-2 data-[state=active]:gradient-success data-[state=active]:text-white">Điền từ</TabsTrigger>}
            {topic.exercises.rewrite && <TabsTrigger value="rewrite" className="flex-1 rounded-xl text-xs font-bold py-2 data-[state=active]:gradient-cool data-[state=active]:text-white">Viết lại câu</TabsTrigger>}
          </TabsList>
          {topic.exercises.mcq && <TabsContent value="mcq"><MCQSection questions={topic.exercises.mcq.questions} instruction={topic.exercises.mcq.instruction} reviewMode={reviewMode} onStartTimer={handleStartTimer} /></TabsContent>}
          {topic.exercises.rearrange && <TabsContent value="rearrange"><TextInputSection questions={topic.exercises.rearrange.questions} instruction={topic.exercises.rearrange.instruction} reviewMode={reviewMode} onStartTimer={handleStartTimer} /></TabsContent>}
          {topic.exercises.completion && <TabsContent value="completion"><TextInputSection questions={topic.exercises.completion.questions} instruction={topic.exercises.completion.instruction} reviewMode={reviewMode} onStartTimer={handleStartTimer} /></TabsContent>}
          {topic.exercises.rewrite && <TabsContent value="rewrite"><TextInputSection questions={topic.exercises.rewrite.questions} instruction={topic.exercises.rewrite.instruction} reviewMode={reviewMode} onStartTimer={handleStartTimer} /></TabsContent>}
        </Tabs>
      </div>
    </PageShell>
  );
};

const MCQSection = ({ questions, instruction, reviewMode, onStartTimer }: { questions: MCQuestion[]; instruction: string; reviewMode: ReviewMode; onStartTimer: () => void }) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const q = current < questions.length ? questions[current] : questions[questions.length - 1];

  // Listen for time-up event
  useEffect(() => {
    const handler = () => {
      if (finished) return;
      let s = 0;
      userAnswers.forEach((ans, i) => {
        if (ans !== null && ans === questions[i].ans) s++;
      });
      setScore(s);
      setFinished(true);
    };
    window.addEventListener("quiz-time-up", handler);
    return () => window.removeEventListener("quiz-time-up", handler);
  }, [finished, userAnswers, questions]);

  // Cleanup auto-advance
  useEffect(() => {
    return () => { if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current); };
  }, []);

  const handleAfterModeSelect = (idx: number) => {
    if (finished || selected !== null) return;
    setSelected(idx);
    const newAnswers = [...userAnswers];
    newAnswers[current] = idx;
    setUserAnswers(newAnswers);
    onStartTimer();

    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    autoAdvanceRef.current = setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
        setSelected(null);
      } else {
        let s = 0;
        newAnswers.forEach((a, i) => {
          if (a !== null && a === questions[i].ans) s++;
        });
        setScore(s);
        setFinished(true);
      }
    }, 500);
  };

  if (finished) return (
    <ResultCard score={score} total={questions.length} onRetry={() => {
      setCurrent(0); setSelected(null); setSubmitted(false); setScore(0); setFinished(false);
      setUserAnswers(new Array(questions.length).fill(null));
    }}>
      {reviewMode === "after" && (
        <ReviewAllAnswers
          questions={questions.map((qq, i) => ({
            q: qq.q,
            opts: qq.opts,
            ans: qq.ans,
            explain: qq.explain,
            selected: userAnswers[i],
          }))}
        />
      )}
    </ResultCard>
  );

  return (
    <div>
      <p className="text-xs text-muted-foreground italic mb-3">{instruction}</p>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-muted-foreground">Câu {current + 1} / {questions.length}</span>
      </div>
      <Progress value={((current + 1) / questions.length) * 100} className="h-2 rounded-full mb-5" />
      <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-border/30">
        <p className="font-display font-bold text-foreground text-lg mb-5 leading-relaxed">{q.q}</p>
        <div className="flex flex-col gap-2.5">
          {q.opts.map((opt, idx) => {
            let cls = "bg-secondary/50 border-2 border-transparent text-foreground hover:border-primary/30";
            if (reviewMode === "after") {
              if (selected === idx) cls = "bg-primary/10 border-2 border-primary text-primary shadow-md";
            } else {
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

        {reviewMode === "instant" && (
          <div className="mt-6">
            {!submitted ? (
              <button onClick={() => {
                if (selected === null) return;
                setSubmitted(true);
                onStartTimer();
                setUserAnswers(prev => { const n = [...prev]; n[current] = selected; return n; });
                if (selected === q.ans) setScore(s => s + 1);
              }} disabled={selected === null}
                className={`w-full py-3.5 rounded-2xl font-display font-bold text-sm transition-all ${selected === null ? "bg-muted text-muted-foreground" : "gradient-primary text-white"}`}>Kiểm tra</button>
            ) : (
              <button onClick={() => { if (current < questions.length - 1) { setCurrent(c => c + 1); setSelected(null); setSubmitted(false); } else setFinished(true); }}
                className="w-full py-3.5 rounded-2xl font-display font-bold text-sm gradient-accent text-white">
                {current < questions.length - 1 ? "Câu tiếp →" : "Xem kết quả"}
              </button>
            )}
          </div>
        )}

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
  );
};

const TextInputSection = ({ questions, instruction, reviewMode, onStartTimer }: { questions: { q: string; answer: string[] }[]; instruction: string; reviewMode: ReviewMode; onStartTimer: () => void }) => {
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ input: string; correct: boolean }[]>([]);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const q = questions[current];
  const isCorrect = q.answer.some(a => matchAnswer(input, [a]));

  // Listen for time-up event
  useEffect(() => {
    const handler = () => {
      if (finished) return;
      let s = 0;
      userAnswers.forEach(a => { if (a.correct) s++; });
      setScore(s);
      setFinished(true);
    };
    window.addEventListener("quiz-time-up", handler);
    return () => window.removeEventListener("quiz-time-up", handler);
  }, [finished, userAnswers]);

  // Cleanup
  useEffect(() => {
    return () => { if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current); };
  }, []);

  const handleAfterSubmit = useCallback(() => {
    if (!input.trim()) return;
    const correct = q.answer.some(a => matchAnswer(input, [a]));
    setUserAnswers(prev => [...prev, { input: input.trim(), correct }]);
    if (correct) setScore(s => s + 1);
    setSubmitted(true);
    onStartTimer();

    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    autoAdvanceRef.current = setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
        setInput("");
        setSubmitted(false);
      } else {
        setFinished(true);
      }
    }, 500);
  }, [input, q, current, questions.length, onStartTimer]);

  if (finished) {
    return (
      <ResultCard score={score} total={questions.length} onRetry={() => {
        setCurrent(0); setInput(""); setSubmitted(false); setScore(0); setFinished(false);
        setUserAnswers([]);
      }}>
        {reviewMode === "after" && userAnswers.length > 0 && (
          <div className="mt-4 mb-2">
            <p className="text-sm font-bold text-muted-foreground mb-3">Xem lại đáp án:</p>
            <div className="flex flex-col gap-2 text-left">
              {questions.map((qq, i) => {
                const ua = userAnswers[i];
                return (
                  <div key={i} className={`bg-card/80 rounded-xl p-3 border text-sm ${
                    !ua ? "border-amber-200 dark:border-amber-800/40"
                      : ua.correct ? "border-emerald-200 dark:border-emerald-800/40"
                      : "border-red-200 dark:border-red-800/40"
                  }`}>
                    <p className="font-medium text-foreground mb-1">Câu {i + 1}: {qq.q}</p>
                    {ua ? (
                      <div className="flex items-center gap-2">
                        {ua.correct
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          : <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                        <span className={ua.correct ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400 line-through"}>
                          {ua.input}
                        </span>
                        {!ua.correct && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">→ {qq.answer[0]}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 dark:text-amber-400">Chưa trả lời — Đáp án: {qq.answer[0]}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ResultCard>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground italic mb-3">{instruction}</p>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-muted-foreground">Câu {current + 1} / {questions.length}</span>
      </div>
      <Progress value={((current + 1) / questions.length) * 100} className="h-2 rounded-full mb-5" />
      <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-border/30">
        <p className="font-display font-bold text-foreground text-lg mb-5 leading-relaxed whitespace-pre-line">{q.q}</p>
        <div className="flex gap-2">
          <input value={input} onChange={e => !submitted && setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !submitted && input.trim()) {
                if (reviewMode === "after") {
                  handleAfterSubmit();
                } else {
                  setSubmitted(true);
                  onStartTimer();
                  const correct = q.answer.some(a => matchAnswer(input, [a]));
                  setUserAnswers(prev => [...prev, { input: input.trim(), correct }]);
                  if (correct) setScore(s => s + 1);
                }
              }
            }}
            placeholder="Nhập câu trả lời..." disabled={submitted}
            className="flex-1 bg-card/80 border-2 border-border/30 rounded-2xl px-4 py-3 text-foreground font-medium focus:outline-none focus:border-primary transition-colors" />
          {!submitted && (
            <button onClick={() => {
              if (!input.trim()) return;
              if (reviewMode === "after") {
                handleAfterSubmit();
              } else {
                setSubmitted(true);
                onStartTimer();
                const correct = q.answer.some(a => matchAnswer(input, [a]));
                setUserAnswers(prev => [...prev, { input: input.trim(), correct }]);
                if (correct) setScore(s => s + 1);
              }
            }}
              className="gradient-primary text-white px-4 py-3 rounded-2xl"><Send className="h-5 w-5" /></button>
          )}
        </div>
        {!submitted && input.trim() && instruction.toLowerCase().includes("no more than") && (
          <p className={`text-[11px] font-bold mt-1.5 ml-1 ${input.trim().split(/\s+/).length > 5 ? "text-destructive" : "text-muted-foreground"}`}>
            {input.trim().split(/\s+/).length}/5 từ
          </p>
        )}

        {/* Instant mode: show feedback */}
        {reviewMode === "instant" && submitted && (
          <div className="mt-4">
            <div className={`flex items-center gap-2 text-sm font-medium ${isCorrect ? "text-success" : "text-destructive"}`}>
              {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {isCorrect ? "Chính xác!" : "Chưa đúng"}
            </div>
            {!isCorrect && <p className="text-sm text-muted-foreground mt-1">Đáp án: <span className="font-bold text-foreground">{q.answer[0]}</span></p>}
            <button onClick={() => { if (current < questions.length - 1) { setCurrent(c => c + 1); setInput(""); setSubmitted(false); } else setFinished(true); }}
              className="mt-4 w-full py-3.5 rounded-2xl font-display font-bold text-sm gradient-accent text-white">
              {current < questions.length - 1 ? "Câu tiếp →" : "Xem kết quả"}
            </button>
          </div>
        )}

        {/* After mode: show nothing, auto-advance handles it */}
      </motion.div>
    </div>
  );
};

export default Grade10GrammarPage;
