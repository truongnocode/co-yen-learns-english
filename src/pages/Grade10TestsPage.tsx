import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardList, CheckCircle2, XCircle, Send, ChevronRight, Home, Trophy } from "lucide-react";
import { loadGrade10Tests } from "@/data/loader";
import { type MCQuestion } from "@/data/types";
import { Progress } from "@/components/ui/progress";
import PageShell from "@/components/PageShell";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

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

  if (loading) return <PageShell><div className="flex items-center justify-center pt-40 text-muted-foreground">Đang tải...</div></PageShell>;
  if (!data) return <PageShell><div className="flex items-center justify-center pt-40 text-muted-foreground">Không có dữ liệu.</div></PageShell>;

  const tests = Object.entries(data);

  if (!selectedTest) {
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
            <p className="text-white/70 text-sm relative z-10">{tests.length} đề thi</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tests.map(([key, test], i) => (
              <motion.button key={key}
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ ...smooth, delay: i * 0.04 }}
                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTest(key)}
                className="bg-card/80 backdrop-blur-xl rounded-2xl p-5 text-left border border-border/30 shadow-lg hover:shadow-xl transition-all"
              >
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
      </PageShell>
    );
  }

  return <TestExam test={data[selectedTest]} onBack={() => setSelectedTest(null)} />;
};

const TestExam = ({ test, onBack }: { test: TestData; onBack: () => void }) => {
  const allQuestions: { q: string; opts: string[]; ans: number; context?: string; passage?: string }[] = [];
  test.partA.questions.forEach(q => allQuestions.push({ ...q, context: "Part A: Ngữ pháp & Từ vựng" }));
  if (test.partB.cloze) test.partB.cloze.questions.forEach(q => allQuestions.push({ ...q, context: "Part B: Điền từ vào đoạn văn", passage: test.partB.cloze.passage }));
  if (test.partB.signs) test.partB.signs.forEach(s => allQuestions.push({ q: s.q, opts: s.opts, ans: s.ans, context: `Part B: Đọc biển báo · ${s.sign}` }));
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

  const totalMCQ = allQuestions.length;
  const q = allQuestions[current];
  const progress = ((current + 1) / totalMCQ) * 100;
  const partCQuestions = test.partC?.fill_in || [];

  if (finished && !showPartC && partCQuestions.length > 0) {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto px-5 pt-28 pb-20 text-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-border/30">
            <h2 className="font-display font-extrabold text-2xl text-foreground mb-2">Part A & B hoàn thành!</h2>
            <p className="text-4xl font-display font-bold text-primary my-4">{score}/{totalMCQ}</p>
            <p className="text-muted-foreground text-sm mb-6">Tiếp tục với Part C (Viết)</p>
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
              {partCQuestions.map((pq: any, i: number) => (
                <div key={i} className="bg-card/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-border/30">
                  <p className="font-medium text-foreground text-sm mb-3 whitespace-pre-line">{pq.q}</p>
                  <input value={partCAnswers[i] || ""} onChange={e => { const a = [...partCAnswers]; a[i] = e.target.value; setPartCAnswers(a); }}
                    placeholder="Nhập đáp án..."
                    className="w-full bg-card/80 border-2 border-border/30 rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>
              ))}
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                let s = 0;
                partCQuestions.forEach((pq: any, i: number) => {
                  if (pq.answer?.some((a: string) => a.toLowerCase().trim() === (partCAnswers[i] || "").toLowerCase().trim())) s++;
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
            <motion.button whileTap={{ scale: 0.95 }} onClick={onBack}
              className="gradient-primary text-white px-8 py-3 rounded-2xl font-display font-bold">Chọn đề khác</motion.button>
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
        </div>

        <Progress value={progress} className="h-2 rounded-full mb-1" />
        <p className="text-xs text-muted-foreground text-right mb-4">Câu {current + 1}/{totalMCQ}</p>

        {q.passage && (current === 0 || allQuestions[current - 1]?.passage !== q.passage) && (
          <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-4 mb-4 text-sm text-foreground leading-relaxed max-h-48 overflow-y-auto border border-border/20">{q.passage}</div>
        )}

        <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-border/30">
          <p className="font-display font-bold text-foreground text-lg mb-5 leading-relaxed">{q.q}</p>
          <div className="flex flex-col gap-2.5">
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
                className={`w-full py-3.5 rounded-2xl font-display font-bold text-sm transition-all ${selected === null ? "bg-muted text-muted-foreground" : "gradient-primary text-white"}`}>Kiểm tra</button>
            ) : (
              <button onClick={() => { if (current < totalMCQ - 1) { setCurrent(c => c + 1); setSelected(null); setSubmitted(false); } else setFinished(true); }}
                className="w-full py-3.5 rounded-2xl font-display font-bold text-sm gradient-accent text-white">
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
    </PageShell>
  );
};

export default Grade10TestsPage;
