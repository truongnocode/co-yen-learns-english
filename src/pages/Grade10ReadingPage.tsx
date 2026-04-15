import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, CheckCircle2, XCircle, BookOpen, Eye, PenTool, Send, Home, Trophy } from "lucide-react";
import ExplanationBox from "@/components/ExplanationBox";
import { loadGrade10Reading, loadGrade10Writing } from "@/data/loader";
import { type MCQuestion } from "@/data/types";
import { Progress } from "@/components/ui/progress";
import PageShell from "@/components/PageShell";
import QuizSettingsBar, { type ReviewMode } from "@/components/QuizSettingsBar";
import CountdownTimer from "@/components/CountdownTimer";
import ReviewAllAnswers from "@/components/ReviewAllAnswers";
import { matchAnswer } from "@/lib/answerMatch";
import SignVisual from "@/components/SignVisual";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

// Shared result
const ResultCard = ({ score, total, onRetry }: { score: number; total: number; onRetry: () => void }) => {
  const pct = Math.round((score / total) * 100);
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
        <span className="font-display font-extrabold text-lg text-energy">+{score * 10} XP</span>
      </div>
      <motion.button whileTap={{ scale: 0.95 }} onClick={onRetry}
        className="gradient-primary text-white px-6 py-3 rounded-2xl font-display font-bold text-sm">Làm lại</motion.button>
    </motion.div>
  );
};

const MCQQuiz = ({ questions, title, reviewMode = "instant", timeLimit = 0, onTimeUp }: {
  questions: MCQuestion[];
  title?: string;
  reviewMode?: ReviewMode;
  timeLimit?: number;
  onTimeUp?: () => void;
}) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [quizStarted, setQuizStarted] = useState(false);
  const q = questions[current];

  const computeScoreFromAnswers = (ans: (number | null)[]) => {
    return ans.reduce((s, a, i) => s + (a === questions[i]?.ans ? 1 : 0), 0);
  };

  const handleTimeUp = () => {
    const finalScore = computeScoreFromAnswers(answers);
    setScore(finalScore);
    setFinished(true);
    onTimeUp?.();
  };

  const handleRetry = () => {
    setCurrent(0); setSelected(null); setSubmitted(false); setScore(0); setFinished(false);
    setAnswers(new Array(questions.length).fill(null)); setQuizStarted(false);
  };

  if (finished) {
    const reviewQuestions = reviewMode === "after" ? questions.map((question, i) => ({
      q: question.q,
      opts: question.opts,
      ans: question.ans,
      explain: question.explain,
      selected: answers[i] ?? null,
      sign: (question as any).sign,
    })) : [];

    return (
      <div>
        <ResultCard score={score} total={questions.length} onRetry={handleRetry} />
        {reviewMode === "after" && <ReviewAllAnswers questions={reviewQuestions} />}
      </div>
    );
  }

  const handleSelect = (idx: number) => {
    if (!quizStarted) setQuizStarted(true);
    if (reviewMode === "instant") {
      if (submitted) return;
      setSelected(idx);
    } else {
      // "after" mode: select, highlight, auto-advance
      if (selected !== null) return;
      setSelected(idx);
      const newAnswers = [...answers]; newAnswers[current] = idx; setAnswers(newAnswers);
      setTimeout(() => {
        if (current < questions.length - 1) {
          setCurrent(c => c + 1);
          setSelected(null);
        } else {
          const finalScore = newAnswers.reduce((s, a, i) => s + (a === questions[i]?.ans ? 1 : 0), 0);
          setScore(finalScore);
          setFinished(true);
        }
      }, 500);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-muted-foreground">Câu {current + 1} / {questions.length}</span>
        {timeLimit > 0 && quizStarted && (
          <CountdownTimer minutes={timeLimit} onTimeUp={handleTimeUp} started={quizStarted} />
        )}
      </div>
      <Progress value={((current + 1) / questions.length) * 100} className="h-2 rounded-full mb-5" />
      <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-border/30">
        {(q as any).sign && <SignVisual sign={(q as any).sign} />}
        <p className="font-display font-bold text-foreground text-lg mb-5 leading-relaxed">{q.q}</p>
        <div className="flex flex-col gap-2.5">
          {q.opts.map((opt, idx) => {
            let cls = "bg-secondary/50 border-2 border-transparent text-foreground hover:border-primary/30";
            if (reviewMode === "instant") {
              if (submitted) {
                if (idx === q.ans) cls = "bg-success/10 border-2 border-success text-success";
                else if (idx === selected && idx !== q.ans) cls = "bg-destructive/10 border-2 border-destructive text-destructive";
                else cls = "bg-secondary/30 border-2 border-transparent text-muted-foreground opacity-50";
              } else if (selected === idx) cls = "bg-primary/10 border-2 border-primary text-primary shadow-md";
            } else {
              if (selected === idx) cls = "bg-primary/10 border-2 border-primary text-primary shadow-md";
            }
            return (
              <button key={idx} onClick={() => handleSelect(idx)} className={`p-4 rounded-2xl text-left font-medium transition-all ${cls}`}>
                <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>{opt}
              </button>
            );
          })}
        </div>
        {reviewMode === "instant" && (
          <div className="mt-6">
            {!submitted ? (
              <button onClick={() => { if (selected === null) return; if (!quizStarted) setQuizStarted(true); setSubmitted(true); const newAnswers = [...answers]; newAnswers[current] = selected; setAnswers(newAnswers); if (selected === q.ans) setScore(s => s + 1); }} disabled={selected === null}
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

const TextInputExercise = ({ questions, instruction, reviewMode = "instant" }: {
  questions: { q: string; answer: string[] }[];
  instruction: string;
  reviewMode?: ReviewMode;
}) => {
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>(new Array(questions.length).fill(""));
  const q = questions[current];
  const isCorrect = q.answer.some(a => matchAnswer(input, [a]));

  const handleSubmitAnswer = () => {
    if (!input.trim()) return;
    const correct = q.answer.some(a => matchAnswer(input, [a]));
    const newUserAnswers = [...userAnswers]; newUserAnswers[current] = input; setUserAnswers(newUserAnswers);

    if (reviewMode === "after") {
      if (correct) setScore(s => s + 1);
      // Auto-advance without feedback
      setTimeout(() => {
        if (current < questions.length - 1) {
          setCurrent(c => c + 1);
          setInput("");
        } else {
          setFinished(true);
        }
      }, 500);
    } else {
      setSubmitted(true);
      if (correct) setScore(s => s + 1);
    }
  };

  const handleRetry = () => {
    setCurrent(0); setInput(""); setSubmitted(false); setScore(0); setFinished(false);
    setUserAnswers(new Array(questions.length).fill(""));
  };

  if (finished) {
    return (
      <div>
        <ResultCard score={score} total={questions.length} onRetry={handleRetry} />
        {reviewMode === "after" && (
          <div className="mt-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card/80 backdrop-blur-xl border border-border/30 rounded-2xl overflow-hidden"
            >
              <div className="px-5 py-3.5 font-display font-bold text-sm text-foreground border-b border-border/20">
                Xem lại đáp án
              </div>
              <div className="flex flex-col gap-2 p-4">
                {questions.map((question, i) => {
                  const userAns = userAnswers[i] || "";
                  const correct = question.answer.some(a => matchAnswer(userAns, [a]));
                  return (
                    <div key={i} className={`rounded-xl p-3 border ${correct ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-900/10" : "border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/10"}`}>
                      <div className="flex items-start gap-2 mb-1">
                        <span className="text-xs font-bold text-muted-foreground">Câu {i + 1}</span>
                        {correct ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                      </div>
                      <p className="text-xs text-foreground mb-1">{question.q}</p>
                      {!correct && <p className="text-xs text-muted-foreground">Bạn trả lời: <span className="line-through text-red-500">{userAns || "(bỏ trống)"}</span></p>}
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Đáp án: {question.answer[0]}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </div>
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
            onKeyDown={e => { if (e.key === "Enter" && !submitted && input.trim()) handleSubmitAnswer(); }}
            placeholder="Nhập câu trả lời..." disabled={submitted}
            className="flex-1 bg-card/80 border-2 border-border/30 rounded-2xl px-4 py-3 text-foreground font-medium focus:outline-none focus:border-primary transition-colors" />
          {!submitted && <button onClick={handleSubmitAnswer}
            className="gradient-primary text-white px-4 py-3 rounded-2xl"><Send className="h-5 w-5" /></button>}
        </div>
        {!submitted && input.trim() && instruction.toLowerCase().includes("no more than") && (
          <p className={`text-[11px] font-bold mt-1.5 ml-1 ${input.trim().split(/\s+/).length > 5 ? "text-destructive" : "text-muted-foreground"}`}>
            {input.trim().split(/\s+/).length}/5 từ
          </p>
        )}
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
      </motion.div>
    </div>
  );
};

const Grade10ReadingPage = () => {
  const navigate = useNavigate();
  const [readingData, setReadingData] = useState<any>(null);
  const [writingData, setWritingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeSubIdx, setActiveSubIdx] = useState(0);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("instant");
  const [timeLimit, setTimeLimit] = useState(0);

  useEffect(() => {
    Promise.all([loadGrade10Reading(), loadGrade10Writing()])
      .then(([r, w]) => { setReadingData(r); setWritingData(w); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageShell><div className="flex items-center justify-center pt-40 text-muted-foreground">Đang tải...</div></PageShell>;

  const sections = [
    { key: "signs", label: "Đọc biển báo", icon: Eye, desc: `${readingData?.signs ? Object.values(readingData.signs).reduce((sum: number, ex: any) => sum + (ex.questions?.length || 0), 0) : 0} câu`, color: "gradient-primary" },
    { key: "cloze", label: "Điền từ vào đoạn văn", icon: BookOpen, desc: `${readingData?.cloze?.length || 0} đoạn`, color: "gradient-accent" },
    { key: "comprehension", label: "Đọc hiểu", icon: FileText, desc: `${readingData?.comprehension?.length || 0} bài`, color: "gradient-purple-card" },
    { key: "letterArranging", label: "Sắp xếp thư/email", icon: PenTool, desc: `${writingData?.letterArranging?.questions?.length || 0} câu`, color: "gradient-success" },
    { key: "paragraphArranging", label: "Sắp xếp đoạn văn", icon: PenTool, desc: `${writingData?.paragraphArranging?.questions?.length || 0} câu`, color: "gradient-orange-card" },
    { key: "sentenceArranging", label: "Sắp xếp câu", icon: PenTool, desc: `${writingData?.sentenceArranging?.questions?.length || 0} câu`, color: "gradient-primary" },
    { key: "sentenceRewriting", label: "Viết lại câu", icon: PenTool, desc: `${writingData?.sentenceRewriting?.questions?.length || 0} câu`, color: "gradient-accent" },
  ];

  if (!activeSection) {
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
              <p className="text-xs text-muted-foreground">Đọc hiểu & Viết</p>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/dashboard")}
              className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
              <Home className="h-5 w-5" />
            </motion.button>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={smooth}
            className="gradient-accent text-white rounded-3xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
            <FileText className="h-8 w-8 mb-2 opacity-80 relative z-10" />
            <h1 className="font-display font-extrabold text-2xl relative z-10">Đọc hiểu & Viết</h1>
            <p className="text-white/70 text-sm relative z-10">Luyện các kỹ năng đọc và viết</p>
          </motion.div>

          <div className="flex flex-col gap-3">
            {sections.map((sec, i) => (
              <motion.button key={sec.key}
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ ...smooth, delay: i * 0.04 }}
                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setActiveSection(sec.key); setActiveSubIdx(0); }}
                className="bg-card/80 backdrop-blur-xl rounded-2xl p-5 text-left border border-border/30 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`${sec.color} text-white p-2.5 rounded-xl`}><sec.icon className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-display font-bold text-foreground">{sec.label}</h3>
                    <p className="text-xs text-muted-foreground">{sec.desc}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  const renderContent = () => {
    if (activeSection === "signs") {
      const exercises = readingData.signs;
      const exKeys = Object.keys(exercises);
      const exData = exercises[exKeys[activeSubIdx]];
      return (
        <div>
          {exKeys.length > 1 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {exKeys.map((k, i) => (
                <button key={k} onClick={() => setActiveSubIdx(i)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${i === activeSubIdx ? "gradient-primary text-white" : "bg-card/80 border border-border/30 text-muted-foreground"}`}>Phần {i + 1}</button>
              ))}
            </div>
          )}
          <MCQQuiz key={`${activeSubIdx}-${reviewMode}`} questions={exData.questions} title={exData.instruction} reviewMode={reviewMode} timeLimit={timeLimit} />
        </div>
      );
    }
    if (activeSection === "cloze") {
      const items = readingData.cloze;
      const item = items[activeSubIdx];
      return (
        <div>
          {items.length > 1 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {items.map((it: any, i: number) => (
                <button key={i} onClick={() => setActiveSubIdx(i)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${i === activeSubIdx ? "gradient-primary text-white" : "bg-card/80 border border-border/30 text-muted-foreground"}`}>{it.title?.substring(0, 20) || `Bài ${i + 1}`}</button>
              ))}
            </div>
          )}
          {item.title && <h3 className="font-display font-bold text-foreground mb-2">{item.title}</h3>}
          {item.instruction && <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-4 mb-4 text-sm text-foreground leading-relaxed border border-border/20 italic">{item.instruction}</div>}
          {item.passage && <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-4 mb-4 text-sm text-foreground leading-relaxed max-h-64 overflow-y-auto border border-border/20 whitespace-pre-line">{item.passage}</div>}
          <MCQQuiz key={`${activeSubIdx}-${reviewMode}`} questions={item.questions} reviewMode={reviewMode} timeLimit={timeLimit} />
        </div>
      );
    }
    if (activeSection === "comprehension") {
      const items = readingData.comprehension;
      const item = items[activeSubIdx];
      return (
        <div>
          {items.length > 1 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {items.map((it: any, i: number) => (
                <button key={i} onClick={() => setActiveSubIdx(i)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${i === activeSubIdx ? "gradient-primary text-white" : "bg-card/80 border border-border/30 text-muted-foreground"}`}>{it.title?.substring(0, 25) || `Bài ${i + 1}`}</button>
              ))}
            </div>
          )}
          {item.title && <h3 className="font-display font-bold text-foreground mb-2">{item.title}</h3>}
          {item.passage && <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-4 mb-4 text-sm text-foreground leading-relaxed max-h-60 overflow-y-auto border border-border/20">{item.passage}</div>}
          <MCQQuiz key={`${activeSubIdx}-${reviewMode}`} questions={item.questions} reviewMode={reviewMode} timeLimit={timeLimit} />
        </div>
      );
    }
    if (activeSection === "letterArranging" || activeSection === "paragraphArranging") {
      const sec = writingData[activeSection];
      return <MCQQuiz key={reviewMode} questions={sec.questions} title={sec.instruction} reviewMode={reviewMode} timeLimit={timeLimit} />;
    }
    if (activeSection === "sentenceArranging" || activeSection === "sentenceRewriting") {
      const sec = writingData[activeSection];
      return <TextInputExercise key={reviewMode} questions={sec.questions} instruction={sec.instruction} reviewMode={reviewMode} />;
    }
    return null;
  };

  const currentLabel = sections.find(s => s.key === activeSection)?.label || "";

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <div className="flex items-center gap-3 mb-5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setActiveSection(null)}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <p className="font-display font-extrabold text-sm text-foreground flex-1">{currentLabel}</p>
        </div>
        <QuizSettingsBar
          reviewMode={reviewMode}
          onReviewModeChange={setReviewMode}
          timeLimit={timeLimit}
          onTimeLimitChange={setTimeLimit}
        />
        {renderContent()}
      </div>
    </PageShell>
  );
};

export default Grade10ReadingPage;
