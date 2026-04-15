import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Play, Volume2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { loadSGKData } from "@/data/loader";
import type { MCQuestion, SGKData } from "@/data/types";
import { generateMixedTest, generateTest } from "@/lib/testGenerator";
import { analyzeDiagnostics, guessCategory, type QuestionResult } from "@/lib/diagnostics";
import { saveQuizResult, getProgress } from "@/lib/progress";
import { completeDailyTask } from "@/lib/daily";
import { speakUS } from "@/lib/tts";
import ExplanationBox from "@/components/ExplanationBox";
import ExamReport from "@/components/ExamReport";
import PageShell from "@/components/PageShell";
import { Progress } from "@/components/ui/progress";
import QuizSettingsBar, { type ReviewMode } from "@/components/QuizSettingsBar";
import CountdownTimer from "@/components/CountdownTimer";
import ReviewAllAnswers from "@/components/ReviewAllAnswers";

const smooth = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

const DynamicTestPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const grade = profile?.grade || 6;

  const [data, setData] = useState<SGKData | null>(null);
  const [questions, setQuestions] = useState<MCQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  // Settings
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("instant");
  const [timeLimit, setTimeLimit] = useState(0);

  useEffect(() => {
    loadSGKData(grade).then(setData).finally(() => setLoading(false));
  }, [grade]);

  const unitKeys = data ? Object.keys(data.units) : [];

  const startTest = () => {
    if (!data) return;
    const qs = selectedUnits.length > 0
      ? generateTest(data, selectedUnits, questionCount)
      : generateMixedTest(data, questionCount);
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setCurrent(0);
    setSelected(null);
    setStarted(true);
  };

  useEffect(() => {
    if (started && !finished && questions[current]) speakUS(questions[current].q);
  }, [current, started, finished, questions]);

  const finishTest = useCallback((currentAnswers: (number | null)[]) => {
    setFinished(true);
    if (user) {
      const finalScore = currentAnswers.filter((a, i) => a === questions[i]?.ans).length;
      saveQuizResult(user.uid, grade, "dynamic", finalScore, questions.length);
      getProgress(user.uid).then(p => completeDailyTask(user.uid, "quizDone", p)).catch(() => {});
    }
  }, [user, questions, grade]);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const newAnswers = [...answers];
    newAnswers[current] = idx;
    setAnswers(newAnswers);

    if (reviewMode === "after") {
      setTimeout(() => {
        if (current < questions.length - 1) {
          setCurrent((c) => c + 1);
          setSelected(null);
        } else {
          finishTest(newAnswers);
        }
      }, 500);
    }
  };

  const handleNext = () => {
    if (current < questions.length - 1) { setCurrent((c) => c + 1); setSelected(null); }
    else {
      finishTest(answers);
    }
  };

  const handleTimeUp = useCallback(() => {
    setFinished(true);
    if (user) {
      const finalScore = answers.filter((a, i) => a === questions[i]?.ans).length;
      saveQuizResult(user.uid, grade, "dynamic", finalScore, questions.length);
      getProgress(user.uid).then(p => completeDailyTask(user.uid, "quizDone", p)).catch(() => {});
    }
  }, [user, answers, questions, grade]);

  // Build diagnostic report
  const getReport = () => {
    const results: QuestionResult[] = questions.map((q, i) => ({
      question: q.q,
      correct: answers[i] === q.ans,
      category: guessCategory(q.q),
    }));
    return analyzeDiagnostics(results);
  };

  if (loading) return (
    <PageShell><div className="flex items-center justify-center pt-40">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
    </div></PageShell>
  );

  return (
    <PageShell>
      <div className="max-w-lg mx-auto px-5 pt-28 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/dashboard")}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
            <Home className="h-5 w-5" />
          </motion.button>
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
        </div>

        {!started ? (
          /* Setup screen */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={smooth}>
            <h1 className="font-display font-extrabold text-2xl text-foreground mb-1">Kiểm tra ngẫu nhiên</h1>
            <p className="text-muted-foreground text-sm mb-6">Tạo đề thi từ ngân hàng câu hỏi SGK Lớp {grade}</p>

            {/* Question count */}
            <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-5 mb-4 shadow-lg border border-border/30">
              <label className="text-xs font-bold text-foreground block mb-3">Số câu hỏi</label>
              <div className="flex gap-2">
                {[10, 20, 30].map((n) => (
                  <motion.button key={n} whileTap={{ scale: 0.95 }}
                    onClick={() => setQuestionCount(n)}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all ${
                      questionCount === n ? "gradient-primary text-white border-transparent" : "bg-card border-border/30 text-foreground"
                    }`}>
                    {n} câu
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Unit selection */}
            <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-5 mb-6 shadow-lg border border-border/30">
              <label className="text-xs font-bold text-foreground block mb-3">
                Chọn Unit <span className="text-muted-foreground font-normal">(bỏ trống = tất cả)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {unitKeys.map((key) => {
                  const isSelected = selectedUnits.includes(key);
                  return (
                    <motion.button key={key} whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedUnits(isSelected ? selectedUnits.filter((k) => k !== key) : [...selectedUnits, key])}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        isSelected ? "gradient-accent text-white border-transparent" : "bg-card border-border/30 text-foreground"
                      }`}>
                      Unit {key}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <QuizSettingsBar
              reviewMode={reviewMode}
              onReviewModeChange={setReviewMode}
              timeLimit={timeLimit}
              onTimeLimitChange={setTimeLimit}
            />

            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={startTest}
              className="w-full gradient-primary text-white rounded-2xl py-4 font-display font-extrabold text-lg shadow-lg inline-flex items-center justify-center gap-2">
              <Play className="h-5 w-5" /> Bắt đầu kiểm tra
            </motion.button>
          </motion.div>

        ) : finished ? (
          /* Results with diagnostics */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={smooth}>
            <h1 className="font-display font-extrabold text-2xl text-foreground mb-4">Kết quả kiểm tra</h1>
            <ExamReport report={getReport()} />
            {reviewMode === "after" && (
              <ReviewAllAnswers
                questions={questions.map((q, i) => ({
                  q: q.q,
                  opts: q.opts,
                  ans: q.ans,
                  explain: q.explain,
                  selected: answers[i],
                }))}
              />
            )}
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setStarted(false); setFinished(false); setQuestions([]); }}
              className="w-full gradient-primary text-white rounded-2xl py-3.5 font-display font-extrabold shadow-lg mt-6">
              Làm bài mới
            </motion.button>
          </motion.div>

        ) : questions[current] ? (
          /* Quiz mode */
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-muted-foreground">Câu {current + 1}/{questions.length}</span>
              {timeLimit > 0 && (
                <CountdownTimer minutes={timeLimit} onTimeUp={handleTimeUp} started={started && !finished} />
              )}
            </div>
            <Progress value={((current + 1) / questions.length) * 100} className="h-2 mb-6 rounded-full" />

            <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-5 mb-4 shadow-lg border border-border/30">
              <div className="flex items-start gap-3">
                <p className="font-bold text-foreground flex-1">{questions[current].q}</p>
                <button onClick={() => speakUS(questions[current].q)}
                  className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors shrink-0">
                  <Volume2 className="h-4 w-4 text-primary" />
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {questions[current].opts.map((opt, i) => {
                const isCorrect = i === questions[current].ans;
                const isSelected = selected === i;
                let optStyle: string;
                if (selected !== null) {
                  if (reviewMode === "after") {
                    optStyle = isSelected
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card/60 border-border/30 text-muted-foreground";
                  } else {
                    optStyle = isCorrect ? "bg-emerald-100 border-emerald-400 text-emerald-700" :
                      isSelected ? "bg-red-100 border-red-400 text-red-700" :
                      "bg-card/60 border-border/30 text-muted-foreground";
                  }
                } else {
                  optStyle = "bg-card/80 border-border/30 text-foreground hover:border-primary/40";
                }
                return (
                  <motion.button key={i} whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelect(i)}
                    className={`w-full text-left rounded-2xl px-5 py-3.5 font-bold text-sm border transition-all ${optStyle}`}>
                    <span className="text-primary/60 mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                  </motion.button>
                );
              })}
            </div>

            {selected !== null && reviewMode === "instant" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-4">
                <div className={`flex items-center gap-2 text-sm font-medium ${selected === questions[current].ans ? "text-emerald-600" : "text-red-600"}`}>
                  {selected === questions[current].ans ? "Chính xác!" : `Đáp án: ${String.fromCharCode(65 + questions[current].ans)}. ${questions[current].opts[questions[current].ans]}`}
                </div>
                <ExplanationBox
                  explain={questions[current].explain}
                  isCorrect={selected === questions[current].ans}
                  correctAnswer={questions[current].opts[questions[current].ans]}
                  correctIndex={questions[current].ans}
                  opts={questions[current].opts}
                  selectedIndex={selected}
                />
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleNext}
                  className="w-full mt-4 gradient-primary text-white py-3 rounded-2xl font-display font-bold text-sm">
                  {current < questions.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
                </motion.button>
              </motion.div>
            )}
          </div>
        ) : null}
      </div>
    </PageShell>
  );
};

export default DynamicTestPage;
