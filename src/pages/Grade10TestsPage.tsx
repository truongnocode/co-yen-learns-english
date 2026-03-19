import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardList, CheckCircle2, XCircle, Send, ChevronRight } from "lucide-react";
import { loadGrade10Tests } from "@/data/loader";
import { type MCQuestion } from "@/data/types";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";

interface TestData {
  title: string;
  partA: { instruction: string; questions: MCQuestion[] };
  partB: {
    cloze: { passage: string; questions: MCQuestion[] };
    signs: { sign: string; q: string; opts: string[]; ans: number }[];
    reading1: { title: string; passage: string; questions: MCQuestion[] };
    reading2: { title: string; passage: string; questions: MCQuestion[] };
  };
  partC: {
    arrange_paragraph: any[];
    arrange_words: any[];
    fill_in: any[];
    writing: any;
  };
}

const Grade10TestsPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, TestData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  useEffect(() => {
    loadGrade10Tests().then(d => setData(d as Record<string, TestData>)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Đang tải...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Không có dữ liệu.</div>;

  const tests = Object.entries(data);

  if (!selectedTest) {
    return (
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <div className="max-w-3xl mx-auto px-5 pt-28 pb-20">
          <button onClick={() => navigate("/grade/10")} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Lớp 10
          </button>
          <div className="gradient-orange-card text-white rounded-3xl p-6 mb-6">
            <ClipboardList className="h-8 w-8 mb-2 opacity-80" />
            <h1 className="font-display font-bold text-2xl">Đề thi thử vào 10</h1>
            <p className="text-white/70 text-sm">{tests.length} đề thi</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tests.map(([key, test], i) => (
              <motion.button key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTest(key)}
                className="gradient-card rounded-2xl p-5 text-left border border-white/60 shadow-card hover:shadow-card-hover transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-foreground">{test.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">3 phần · Part A, B, C</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <TestExam test={data[selectedTest]} onBack={() => setSelectedTest(null)} />;
};

// Full test exam component
const TestExam = ({ test, onBack }: { test: TestData; onBack: () => void }) => {
  // Collect ALL MCQ questions into a flat list for sequential answering
  const allQuestions: { q: string; opts: string[]; ans: number; context?: string; passage?: string }[] = [];

  // Part A
  test.partA.questions.forEach(q => allQuestions.push({ ...q, context: "Part A: Ngữ pháp & Từ vựng" }));

  // Part B - Cloze
  if (test.partB.cloze) {
    test.partB.cloze.questions.forEach(q => allQuestions.push({ ...q, context: "Part B: Điền từ vào đoạn văn", passage: test.partB.cloze.passage }));
  }

  // Part B - Signs
  if (test.partB.signs) {
    test.partB.signs.forEach(s => allQuestions.push({ q: s.q, opts: s.opts, ans: s.ans, context: `Part B: Đọc biển báo · ${s.sign}` }));
  }

  // Part B - Reading 1 & 2
  [test.partB.reading1, test.partB.reading2].forEach(r => {
    if (r) r.questions.forEach(q => allQuestions.push({ ...q, context: `Part B: Đọc hiểu · ${r.title}`, passage: r.passage }));
  });

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // Part C - text questions
  const [partCAnswers, setPartCAnswers] = useState<string[]>([]);
  const [partCSubmitted, setPartCSubmitted] = useState(false);
  const [showPartC, setShowPartC] = useState(false);
  const [partCScore, setPartCScore] = useState(0);

  const totalMCQ = allQuestions.length;
  const q = allQuestions[current];
  const progress = ((current + 1) / totalMCQ) * 100;

  // Collect Part C fill_in questions
  const partCQuestions = test.partC?.fill_in || [];

  if (finished && !showPartC && partCQuestions.length > 0) {
    return (
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <div className="max-w-2xl mx-auto px-5 pt-28 pb-20 text-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="gradient-card rounded-3xl p-8 shadow-card border border-white/60">
            <h2 className="font-display font-bold text-2xl text-foreground mb-2">Part A & B hoàn thành!</h2>
            <p className="text-4xl font-display font-bold text-primary my-4">{score}/{totalMCQ}</p>
            <p className="text-muted-foreground text-sm mb-6">Tiếp tục với Part C (Viết)</p>
            <button onClick={() => { setShowPartC(true); setPartCAnswers(new Array(partCQuestions.length).fill("")); }} className="gradient-accent text-accent-foreground px-8 py-3 rounded-2xl font-bold">Làm Part C →</button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (showPartC) {
    return (
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <div className="max-w-2xl mx-auto px-5 pt-28 pb-20">
          <h2 className="font-display font-bold text-xl text-foreground mb-4">Part C: Viết</h2>
          {partCSubmitted ? (
            <div className="gradient-card rounded-3xl p-8 shadow-card border border-white/60 text-center">
              <h3 className="font-display font-bold text-2xl text-foreground mb-4">Kết quả tổng hợp</h3>
              <p className="text-muted-foreground text-sm">Trắc nghiệm: <span className="font-bold text-foreground">{score}/{totalMCQ}</span></p>
              <p className="text-muted-foreground text-sm">Tự luận: <span className="font-bold text-foreground">{partCScore}/{partCQuestions.length}</span></p>
              <p className="text-4xl font-display font-bold text-primary my-4">{score + partCScore}/{totalMCQ + partCQuestions.length}</p>
              <p className="text-sm text-muted-foreground mb-6">Điểm quy đổi: <span className="font-bold text-foreground">{(((score + partCScore) / (totalMCQ + partCQuestions.length)) * 10).toFixed(1)}/10</span></p>
              <button onClick={onBack} className="gradient-primary text-primary-foreground px-8 py-3 rounded-2xl font-bold">Chọn đề khác</button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {partCQuestions.map((pq: any, i: number) => (
                <div key={i} className="gradient-card rounded-2xl p-5 shadow-card border border-white/60">
                  <p className="font-medium text-foreground text-sm mb-3 whitespace-pre-line">{pq.q}</p>
                  <input value={partCAnswers[i] || ""} onChange={e => { const a = [...partCAnswers]; a[i] = e.target.value; setPartCAnswers(a); }}
                    placeholder="Nhập đáp án..." className="w-full bg-secondary/50 border-2 border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>
              ))}
              <button onClick={() => {
                let s = 0;
                partCQuestions.forEach((pq: any, i: number) => {
                  if (pq.answer?.some((a: string) => a.toLowerCase().trim() === (partCAnswers[i] || "").toLowerCase().trim())) s++;
                });
                setPartCScore(s);
                setPartCSubmitted(true);
              }} className="gradient-primary text-primary-foreground py-3.5 rounded-2xl font-bold text-sm">Nộp bài</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (finished) {
    // No part C
    const pct = Math.round((score / totalMCQ) * 100);
    return (
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <div className="max-w-lg mx-auto px-5 pt-28 pb-20 text-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="gradient-card rounded-3xl p-8 shadow-card border border-white/60">
            <div className="text-5xl mb-4">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
            <h2 className="font-display font-bold text-2xl text-foreground mb-2">{test.title}</h2>
            <p className="text-4xl font-display font-bold text-primary my-4">{score}/{totalMCQ}</p>
            <p className="text-sm text-muted-foreground mb-2">Điểm: {((score / totalMCQ) * 10).toFixed(1)}/10</p>
            <button onClick={onBack} className="gradient-primary text-primary-foreground px-8 py-3 rounded-2xl font-bold mt-4">Chọn đề khác</button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="max-w-2xl mx-auto px-5 pt-28 pb-20">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> {test.title}
        </button>
        <Progress value={progress} className="h-2.5 rounded-full mb-1" />
        <div className="flex justify-between text-xs text-muted-foreground mb-4">
          <span>{q.context}</span>
          <span>Câu {current + 1}/{totalMCQ}</span>
        </div>

        {q.passage && current > 0 && allQuestions[current - 1]?.passage !== q.passage && (
          <div className="bg-secondary/30 rounded-2xl p-4 mb-4 text-sm text-foreground leading-relaxed max-h-48 overflow-y-auto">{q.passage}</div>
        )}
        {q.passage && current === 0 && (
          <div className="bg-secondary/30 rounded-2xl p-4 mb-4 text-sm text-foreground leading-relaxed max-h-48 overflow-y-auto">{q.passage}</div>
        )}

        <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="gradient-card rounded-3xl p-6 shadow-card border border-white/60">
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
              <button onClick={() => { if (selected === null) return; setSubmitted(true); if (selected === q.ans) setScore(s => s + 1); }} disabled={selected === null}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${selected === null ? "bg-muted text-muted-foreground" : "gradient-primary text-primary-foreground"}`}>Kiểm tra</button>
            ) : (
              <button onClick={() => { if (current < totalMCQ - 1) { setCurrent(c => c + 1); setSelected(null); setSubmitted(false); } else setFinished(true); }}
                className="w-full py-3.5 rounded-2xl font-bold text-sm gradient-accent text-accent-foreground">
                {current < totalMCQ - 1 ? "Câu tiếp →" : "Hoàn thành"}
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
    </div>
  );
};

export default Grade10TestsPage;
