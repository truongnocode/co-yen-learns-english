import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, CheckCircle2, XCircle, BookOpen, Eye, PenTool, Send } from "lucide-react";
import { loadGrade10Reading, loadGrade10Writing } from "@/data/loader";
import { type MCQuestion } from "@/data/types";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Reusable MCQ quiz component
const MCQQuiz = ({ questions, title }: { questions: MCQuestion[]; title?: string }) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="gradient-card rounded-3xl p-8 shadow-card border border-white/60 text-center">
        <div className="text-5xl mb-4">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
        {title && <p className="text-sm text-muted-foreground mb-2">{title}</p>}
        <p className="text-4xl font-display font-bold text-primary my-4">{score}/{questions.length}</p>
        <button onClick={() => { setCurrent(0); setSelected(null); setSubmitted(false); setScore(0); setFinished(false); }} className="gradient-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold text-sm">Làm lại</button>
      </div>
    );
  }

  return (
    <div>
      <Progress value={progress} className="h-2 rounded-full mb-2" />
      <p className="text-xs text-muted-foreground text-right mb-4">Câu {current + 1}/{questions.length}</p>
      <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="gradient-card rounded-3xl p-6 shadow-card border border-white/60">
        {(q as any).sign && <p className="text-sm bg-muted rounded-xl p-3 mb-3 font-medium">🪧 {(q as any).sign}</p>}
        <p className="font-display font-bold text-foreground text-lg mb-5 leading-relaxed">{q.q}</p>
        <div className="flex flex-col gap-3">
          {q.opts.map((opt, idx) => {
            let cls = "bg-secondary/50 border-2 border-transparent text-foreground hover:border-primary/30";
            if (submitted) {
              if (idx === q.ans) cls = "bg-success/10 border-2 border-success text-success";
              else if (idx === selected && idx !== q.ans) cls = "bg-destructive/10 border-2 border-destructive text-destructive";
              else cls = "bg-secondary/30 border-2 border-transparent text-muted-foreground opacity-50";
            } else if (selected === idx) cls = "bg-primary/10 border-2 border-primary text-primary shadow-md";
            return (
              <button key={idx} onClick={() => !submitted && setSelected(idx)} className={`p-4 rounded-2xl text-left font-medium transition-all ${cls}`}>
                <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>{opt}
              </button>
            );
          })}
        </div>
        <div className="mt-6">
          {!submitted ? (
            <button onClick={() => { if (selected === null) return; setSubmitted(true); if (selected === q.ans) setScore(s => s + 1); }} disabled={selected === null} className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${selected === null ? "bg-muted text-muted-foreground" : "gradient-primary text-primary-foreground"}`}>Kiểm tra</button>
          ) : (
            <button onClick={() => { if (current < questions.length - 1) { setCurrent(c => c + 1); setSelected(null); setSubmitted(false); } else setFinished(true); }} className="w-full py-3.5 rounded-2xl font-bold text-sm gradient-accent text-accent-foreground">
              {current < questions.length - 1 ? "Câu tiếp →" : "Xem kết quả"}
            </button>
          )}
        </div>
        {submitted && (
          <div className={`mt-4 flex items-center gap-2 text-sm font-medium ${selected === q.ans ? "text-success" : "text-destructive"}`}>
            {selected === q.ans ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {selected === q.ans ? "Chính xác!" : `Đáp án: ${String.fromCharCode(65 + q.ans)}. ${q.opts[q.ans]}`}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Text input for writing exercises
const TextInputExercise = ({ questions, instruction }: { questions: { q: string; answer: string[] }[]; instruction: string }) => {
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const q = questions[current];
  const isCorrect = q.answer.some(a => a.toLowerCase().trim() === input.toLowerCase().trim());

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="gradient-card rounded-3xl p-8 shadow-card border border-white/60 text-center">
        <div className="text-5xl mb-4">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
        <p className="text-4xl font-display font-bold text-primary my-4">{score}/{questions.length}</p>
        <button onClick={() => { setCurrent(0); setInput(""); setSubmitted(false); setScore(0); setFinished(false); }} className="gradient-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold text-sm">Làm lại</button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground italic mb-4">{instruction}</p>
      <Progress value={((current + 1) / questions.length) * 100} className="h-2 rounded-full mb-2" />
      <p className="text-xs text-muted-foreground text-right mb-4">Câu {current + 1}/{questions.length}</p>
      <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="gradient-card rounded-3xl p-6 shadow-card border border-white/60">
        <p className="font-display font-bold text-foreground text-lg mb-5 leading-relaxed whitespace-pre-line">{q.q}</p>
        <div className="flex gap-2">
          <input value={input} onChange={e => !submitted && setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !submitted && input.trim()) { setSubmitted(true); if (q.answer.some(a => a.toLowerCase().trim() === input.toLowerCase().trim())) setScore(s => s + 1); } }}
            placeholder="Nhập câu trả lời..." disabled={submitted}
            className="flex-1 bg-secondary/50 border-2 border-border rounded-2xl px-4 py-3 text-foreground font-medium focus:outline-none focus:border-primary transition-colors" />
          {!submitted && <button onClick={() => { if (!input.trim()) return; setSubmitted(true); if (q.answer.some(a => a.toLowerCase().trim() === input.toLowerCase().trim())) setScore(s => s + 1); }} className="gradient-primary text-primary-foreground px-4 py-3 rounded-2xl"><Send className="h-5 w-5" /></button>}
        </div>
        {submitted && (
          <div className="mt-4">
            <div className={`flex items-center gap-2 text-sm font-medium ${isCorrect ? "text-success" : "text-destructive"}`}>
              {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {isCorrect ? "Chính xác!" : "Chưa đúng"}
            </div>
            {!isCorrect && <p className="text-sm text-muted-foreground mt-1">Đáp án: <span className="font-bold text-foreground">{q.answer[0]}</span></p>}
            <button onClick={() => { if (current < questions.length - 1) { setCurrent(c => c + 1); setInput(""); setSubmitted(false); } else setFinished(true); }} className="mt-4 w-full py-3.5 rounded-2xl font-bold text-sm gradient-accent text-accent-foreground">
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

  useEffect(() => {
    Promise.all([loadGrade10Reading(), loadGrade10Writing()])
      .then(([r, w]) => { setReadingData(r); setWritingData(w); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Đang tải...</div>;

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
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <div className="max-w-3xl mx-auto px-5 pt-28 pb-20">
          <button onClick={() => navigate("/grade/10")} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Lớp 10
          </button>
          <div className="gradient-accent text-accent-foreground rounded-3xl p-6 mb-6">
            <FileText className="h-8 w-8 mb-2 opacity-80" />
            <h1 className="font-display font-bold text-2xl">Đọc hiểu & Viết</h1>
            <p className="text-accent-foreground/70 text-sm">Luyện các kỹ năng đọc và viết</p>
          </div>
          <div className="flex flex-col gap-3">
            {sections.map((sec, i) => (
              <motion.button key={sec.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setActiveSection(sec.key); setActiveSubIdx(0); }}
                className="gradient-card rounded-2xl p-5 text-left border border-white/60 shadow-card hover:shadow-card-hover transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${sec.color} text-white p-2.5 rounded-xl`}><sec.icon className="h-5 w-5" /></div>
                    <div>
                      <h3 className="font-display font-bold text-foreground">{sec.label}</h3>
                      <p className="text-xs text-muted-foreground">{sec.desc}</p>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render active section content
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
                <button key={k} onClick={() => setActiveSubIdx(i)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${i === activeSubIdx ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>Phần {i + 1}</button>
              ))}
            </div>
          )}
          <MCQQuiz key={activeSubIdx} questions={exData.questions} title={exData.instruction} />
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
                <button key={i} onClick={() => setActiveSubIdx(i)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${i === activeSubIdx ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{it.title?.substring(0, 20) || `Bài ${i + 1}`}</button>
              ))}
            </div>
          )}
          {item.title && <h3 className="font-display font-bold text-foreground mb-2">{item.title}</h3>}
          <MCQQuiz key={activeSubIdx} questions={item.questions} />
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
                <button key={i} onClick={() => setActiveSubIdx(i)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${i === activeSubIdx ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{it.title?.substring(0, 25) || `Bài ${i + 1}`}</button>
              ))}
            </div>
          )}
          {item.title && <h3 className="font-display font-bold text-foreground mb-2">{item.title}</h3>}
          {item.passage && <div className="bg-secondary/30 rounded-2xl p-4 mb-4 text-sm text-foreground leading-relaxed max-h-60 overflow-y-auto">{item.passage}</div>}
          <MCQQuiz key={activeSubIdx} questions={item.questions} />
        </div>
      );
    }

    // Writing sections
    if (activeSection === "letterArranging" || activeSection === "paragraphArranging") {
      const sec = writingData[activeSection];
      return <MCQQuiz questions={sec.questions} title={sec.instruction} />;
    }

    if (activeSection === "sentenceArranging" || activeSection === "sentenceRewriting") {
      const sec = writingData[activeSection];
      return <TextInputExercise questions={sec.questions} instruction={sec.instruction} />;
    }

    return null;
  };

  const currentLabel = sections.find(s => s.key === activeSection)?.label || "";

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <button onClick={() => setActiveSection(null)} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Đọc hiểu & Viết
        </button>
        <h1 className="font-display font-bold text-2xl text-foreground mb-4">{currentLabel}</h1>
        {renderContent()}
      </div>
    </div>
  );
};

export default Grade10ReadingPage;
