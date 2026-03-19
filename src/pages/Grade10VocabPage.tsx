import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, CheckCircle2, XCircle, Home, Trophy } from "lucide-react";
import { loadGrade10Vocab } from "@/data/loader";
import { type Grade10VocabData, type MCQuestion } from "@/data/types";
import { Progress } from "@/components/ui/progress";
import PageShell from "@/components/PageShell";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

const Grade10VocabPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Grade10VocabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    loadGrade10Vocab().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageShell><div className="flex items-center justify-center pt-40 text-muted-foreground">Đang tải...</div></PageShell>;
  if (!data) return <PageShell><div className="flex items-center justify-center pt-40 text-muted-foreground">Không có dữ liệu.</div></PageShell>;

  const topics = Object.entries(data);

  const resetQuiz = () => {
    setCurrent(0); setSelected(null); setSubmitted(false); setScore(0); setAnswers([]); setFinished(false);
  };

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
              <p className="text-xs text-muted-foreground">Từ vựng</p>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/dashboard")}
              className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
              <Home className="h-5 w-5" />
            </motion.button>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={smooth}
            className="gradient-primary text-primary-foreground rounded-3xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
            <BookOpen className="h-8 w-8 mb-2 opacity-80 relative z-10" />
            <h1 className="font-display font-extrabold text-2xl relative z-10">Từ vựng Lớp 10</h1>
            <p className="text-primary-foreground/70 text-sm relative z-10">{topics.length} chủ đề</p>
          </motion.div>

          <div className="flex flex-col gap-3">
            {topics.map(([key, topic], i) => (
              <motion.button key={key}
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ ...smooth, delay: i * 0.04 }}
                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setSelectedTopic(key); resetQuiz(); setAnswers(new Array(topic.questions.length).fill(null)); }}
                className="bg-card/80 backdrop-blur-xl rounded-2xl p-5 text-left border border-border/30 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-foreground">{topic.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{topic.questions.length} câu hỏi</p>
                  </div>
                  <span className="text-xs gradient-accent text-white px-3 py-1.5 rounded-full font-bold">Bắt đầu</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  const topic = data[selectedTopic];
  const questions = topic.questions;
  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  if (finished) {
    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    const xp = score * 10;
    return (
      <PageShell>
        <div className="max-w-lg mx-auto px-5 pt-28 pb-20 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0, filter: "blur(8px)" }} animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-border/30">
            <div className="text-5xl mb-3">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
            <h2 className="font-display font-extrabold text-2xl text-foreground mb-1">Kết quả</h2>
            <p className="text-muted-foreground text-sm mb-4">{topic.name}</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-success/10 border border-success/20 rounded-2xl p-3 text-center">
                <span className="font-display font-extrabold text-2xl text-success">{score}</span>
                <span className="text-xs font-bold text-success block">Đúng</span>
              </div>
              <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3 text-center">
                <span className="font-display font-extrabold text-2xl text-destructive">{total - score}</span>
                <span className="text-xs font-bold text-destructive block">Sai</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 bg-energy/10 border border-energy/20 rounded-2xl p-3 mb-6">
              <Trophy className="h-5 w-5 text-energy" />
              <span className="font-display font-extrabold text-lg text-energy">+{xp} XP</span>
              <span className="text-xs text-energy/70">({pct}%)</span>
            </div>
            <div className="flex gap-3 justify-center">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { resetQuiz(); setAnswers(new Array(total).fill(null)); }}
                className="gradient-primary text-white px-6 py-3 rounded-2xl font-display font-bold text-sm">Làm lại</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setSelectedTopic(null)}
                className="bg-secondary text-secondary-foreground px-6 py-3 rounded-2xl font-display font-bold text-sm">Chọn chủ đề khác</motion.button>
            </div>
          </motion.div>
        </div>
      </PageShell>
    );
  }

  const handleSelect = (idx: number) => { if (submitted) return; setSelected(idx); };
  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    const newAnswers = [...answers]; newAnswers[current] = selected; setAnswers(newAnswers);
    if (selected === q.ans) setScore(s => s + 1);
  };
  const handleNext = () => {
    if (current < questions.length - 1) { setCurrent(c => c + 1); setSelected(null); setSubmitted(false); }
    else { setFinished(true); }
  };

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-5 pt-28 pb-20">
        <div className="flex items-center gap-3 mb-5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSelectedTopic(null)}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div className="flex-1">
            <p className="font-display font-extrabold text-sm text-foreground">{topic.name}</p>
            <p className="text-xs text-muted-foreground">Câu {current + 1} / {questions.length}</p>
          </div>
        </div>

        <Progress value={progress} className="h-2 rounded-full mb-5" />

        <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-border/30">
          <p className="font-display font-bold text-foreground text-lg mb-6 leading-relaxed">{q.q}</p>
          <div className="flex flex-col gap-2.5">
            {q.opts.map((opt, idx) => {
              let cls = "bg-secondary/50 border-2 border-transparent text-foreground hover:border-primary/30";
              if (submitted) {
                if (idx === q.ans) cls = "bg-success/10 border-2 border-success text-success";
                else if (idx === selected && idx !== q.ans) cls = "bg-destructive/10 border-2 border-destructive text-destructive";
                else cls = "bg-secondary/30 border-2 border-transparent text-muted-foreground opacity-50";
              } else if (selected === idx) {
                cls = "bg-primary/10 border-2 border-primary text-primary shadow-md";
              }
              return (
                <button key={idx} onClick={() => handleSelect(idx)} className={`p-4 rounded-2xl text-left font-medium transition-all ${cls}`}>
                  <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>{opt}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 mt-6">
            {!submitted ? (
              <button onClick={handleSubmit} disabled={selected === null}
                className={`flex-1 py-3.5 rounded-2xl font-display font-bold text-sm transition-all ${selected === null ? "bg-muted text-muted-foreground" : "gradient-primary text-white"}`}>
                Kiểm tra
              </button>
            ) : (
              <button onClick={handleNext} className="flex-1 py-3.5 rounded-2xl font-display font-bold text-sm gradient-accent text-white">
                {current < questions.length - 1 ? "Câu tiếp theo →" : "Xem kết quả"}
              </button>
            )}
          </div>
          {submitted && (
            <div className={`mt-4 flex items-center gap-2 text-sm font-medium ${selected === q.ans ? "text-success" : "text-destructive"}`}>
              {selected === q.ans ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {selected === q.ans ? "Chính xác!" : `Đáp án đúng: ${String.fromCharCode(65 + q.ans)}. ${q.opts[q.ans]}`}
            </div>
          )}
        </motion.div>
      </div>
    </PageShell>
  );
};

export default Grade10VocabPage;
