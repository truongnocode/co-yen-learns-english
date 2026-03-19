import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, CheckCircle2, XCircle } from "lucide-react";
import { loadGrade10Vocab } from "@/data/loader";
import { type Grade10VocabData, type MCQuestion } from "@/data/types";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";

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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Đang tải...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Không có dữ liệu.</div>;

  const topics = Object.entries(data);

  const resetQuiz = () => {
    setCurrent(0);
    setSelected(null);
    setSubmitted(false);
    setScore(0);
    setAnswers([]);
    setFinished(false);
  };

  if (!selectedTopic) {
    return (
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <div className="max-w-3xl mx-auto px-5 pt-28 pb-20">
          <button onClick={() => navigate("/grade/10")} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Lớp 10
          </button>
          <div className="gradient-primary text-primary-foreground rounded-3xl p-6 mb-6">
            <BookOpen className="h-8 w-8 mb-2 opacity-80" />
            <h1 className="font-display font-bold text-2xl">Từ vựng Lớp 10</h1>
            <p className="text-primary-foreground/70 text-sm">{topics.length} chủ đề</p>
          </div>
          <div className="flex flex-col gap-3">
            {topics.map(([key, topic], i) => (
              <motion.button
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setSelectedTopic(key); resetQuiz(); setAnswers(new Array(topic.questions.length).fill(null)); }}
                className="gradient-card rounded-2xl p-5 text-left border border-white/60 shadow-card hover:shadow-card-hover transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-foreground">{topic.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{topic.questions.length} câu hỏi</p>
                  </div>
                  <span className="text-xs gradient-accent text-accent-foreground px-3 py-1.5 rounded-full font-bold">Bắt đầu</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const topic = data[selectedTopic];
  const questions = topic.questions;
  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  if (finished) {
    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    return (
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <div className="max-w-lg mx-auto px-5 pt-28 pb-20 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="gradient-card rounded-3xl p-8 shadow-card border border-white/60">
            <div className="text-5xl mb-4">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
            <h2 className="font-display font-bold text-2xl text-foreground mb-2">Kết quả</h2>
            <p className="text-muted-foreground mb-1">{topic.name}</p>
            <p className="text-4xl font-display font-bold text-primary my-4">{score}/{total}</p>
            <p className="text-sm text-muted-foreground mb-6">({pct}% đúng)</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { resetQuiz(); setAnswers(new Array(total).fill(null)); }} className="gradient-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold text-sm">Làm lại</button>
              <button onClick={() => setSelectedTopic(null)} className="bg-secondary text-secondary-foreground px-6 py-3 rounded-2xl font-bold text-sm">Chọn chủ đề khác</button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const handleSelect = (idx: number) => {
    if (submitted) return;
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    const newAnswers = [...answers];
    newAnswers[current] = selected;
    setAnswers(newAnswers);
    if (selected === q.ans) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      setFinished(true);
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="max-w-2xl mx-auto px-5 pt-28 pb-20">
        <button onClick={() => setSelectedTopic(null)} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> {topic.name}
        </button>
        <Progress value={progress} className="h-2.5 rounded-full mb-2" />
        <p className="text-xs text-muted-foreground text-right mb-6">Câu {current + 1} / {questions.length}</p>

        <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="gradient-card rounded-3xl p-6 shadow-card border border-white/60">
          <p className="font-display font-bold text-foreground text-lg mb-6 leading-relaxed">{q.q}</p>
          <div className="flex flex-col gap-3">
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
              <button onClick={handleSubmit} disabled={selected === null} className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all ${selected === null ? "bg-muted text-muted-foreground" : "gradient-primary text-primary-foreground"}`}>
                Kiểm tra
              </button>
            ) : (
              <button onClick={handleNext} className="flex-1 py-3.5 rounded-2xl font-bold text-sm gradient-accent text-accent-foreground">
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
    </div>
  );
};

export default Grade10VocabPage;
