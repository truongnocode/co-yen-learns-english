import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, CheckCircle2, XCircle, Send } from "lucide-react";
import { loadGrade10Grammar } from "@/data/loader";
import { type Grade10GrammarData, type MCQuestion } from "@/data/types";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ExerciseType = "mcq" | "rearrange" | "completion" | "rewrite";

const Grade10GrammarPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Grade10GrammarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    loadGrade10Grammar().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Đang tải...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Không có dữ liệu.</div>;

  const topics = Object.entries(data);

  if (!selectedTopic) {
    return (
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <div className="max-w-3xl mx-auto px-5 pt-28 pb-20">
          <button onClick={() => navigate("/grade/10")} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Lớp 10
          </button>
          <div className="bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] text-primary-foreground rounded-3xl p-6 mb-6">
            <Zap className="h-8 w-8 mb-2 opacity-80" />
            <h1 className="font-display font-bold text-2xl">Ngữ pháp Lớp 10</h1>
            <p className="text-primary-foreground/70 text-sm">{topics.length} chủ đề</p>
          </div>
          <div className="flex flex-col gap-3">
            {topics.map(([key, topic], i) => {
              const types = Object.keys(topic.exercises);
              return (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTopic(key)}
                  className="gradient-card rounded-2xl p-5 text-left border border-white/60 shadow-card hover:shadow-card-hover transition-all"
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
      </div>
    );
  }

  const topic = data[selectedTopic];

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <button onClick={() => setSelectedTopic(null)} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Chọn chủ đề
        </button>
        <h1 className="font-display font-bold text-2xl text-foreground mb-4">{topic.name}</h1>
        <Tabs defaultValue={Object.keys(topic.exercises)[0]} className="w-full">
          <TabsList className="w-full flex bg-secondary/50 rounded-2xl p-1 mb-4 flex-wrap h-auto gap-1">
            {topic.exercises.mcq && <TabsTrigger value="mcq" className="flex-1 rounded-xl text-xs font-bold py-2">Trắc nghiệm</TabsTrigger>}
            {topic.exercises.rearrange && <TabsTrigger value="rearrange" className="flex-1 rounded-xl text-xs font-bold py-2">Sắp xếp từ</TabsTrigger>}
            {topic.exercises.completion && <TabsTrigger value="completion" className="flex-1 rounded-xl text-xs font-bold py-2">Điền từ</TabsTrigger>}
            {topic.exercises.rewrite && <TabsTrigger value="rewrite" className="flex-1 rounded-xl text-xs font-bold py-2">Viết lại câu</TabsTrigger>}
          </TabsList>
          {topic.exercises.mcq && <TabsContent value="mcq"><MCQSection questions={topic.exercises.mcq.questions} instruction={topic.exercises.mcq.instruction} /></TabsContent>}
          {topic.exercises.rearrange && <TabsContent value="rearrange"><TextInputSection questions={topic.exercises.rearrange.questions} instruction={topic.exercises.rearrange.instruction} /></TabsContent>}
          {topic.exercises.completion && <TabsContent value="completion"><TextInputSection questions={topic.exercises.completion.questions} instruction={topic.exercises.completion.instruction} /></TabsContent>}
          {topic.exercises.rewrite && <TabsContent value="rewrite"><TextInputSection questions={topic.exercises.rewrite.questions} instruction={topic.exercises.rewrite.instruction} /></TabsContent>}
        </Tabs>
      </div>
    </div>
  );
};

// MCQ Section
const MCQSection = ({ questions, instruction }: { questions: MCQuestion[]; instruction: string }) => {
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
        <p className="text-4xl font-display font-bold text-primary my-4">{score}/{questions.length}</p>
        <p className="text-sm text-muted-foreground mb-6">({pct}% đúng)</p>
        <button onClick={() => { setCurrent(0); setSelected(null); setSubmitted(false); setScore(0); setFinished(false); }} className="gradient-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold text-sm">Làm lại</button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground italic mb-4">{instruction}</p>
      <Progress value={progress} className="h-2 rounded-full mb-2" />
      <p className="text-xs text-muted-foreground text-right mb-4">Câu {current + 1}/{questions.length}</p>
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
        <div className="flex gap-3 mt-6">
          {!submitted ? (
            <button onClick={() => { if (selected === null) return; setSubmitted(true); if (selected === q.ans) setScore(s => s + 1); }} disabled={selected === null} className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all ${selected === null ? "bg-muted text-muted-foreground" : "gradient-primary text-primary-foreground"}`}>Kiểm tra</button>
          ) : (
            <button onClick={() => { if (current < questions.length - 1) { setCurrent(c => c + 1); setSelected(null); setSubmitted(false); } else setFinished(true); }} className="flex-1 py-3.5 rounded-2xl font-bold text-sm gradient-accent text-accent-foreground">
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

// Text input section for rearrange/completion/rewrite
const TextInputSection = ({ questions, instruction }: { questions: { q: string; answer: string[] }[]; instruction: string }) => {
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[current];
  const isCorrect = q.answer.some(a => a.toLowerCase().trim() === input.toLowerCase().trim());
  const progress = ((current + 1) / questions.length) * 100;

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="gradient-card rounded-3xl p-8 shadow-card border border-white/60 text-center">
        <div className="text-5xl mb-4">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
        <p className="text-4xl font-display font-bold text-primary my-4">{score}/{questions.length}</p>
        <p className="text-sm text-muted-foreground mb-6">({pct}% đúng)</p>
        <button onClick={() => { setCurrent(0); setInput(""); setSubmitted(false); setScore(0); setFinished(false); }} className="gradient-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold text-sm">Làm lại</button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground italic mb-4">{instruction}</p>
      <Progress value={progress} className="h-2 rounded-full mb-2" />
      <p className="text-xs text-muted-foreground text-right mb-4">Câu {current + 1}/{questions.length}</p>
      <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="gradient-card rounded-3xl p-6 shadow-card border border-white/60">
        <p className="font-display font-bold text-foreground text-lg mb-5 leading-relaxed whitespace-pre-line">{q.q}</p>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => !submitted && setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !submitted && input.trim()) { setSubmitted(true); if (q.answer.some(a => a.toLowerCase().trim() === input.toLowerCase().trim())) setScore(s => s + 1); } }}
            placeholder="Nhập câu trả lời..."
            className="flex-1 bg-secondary/50 border-2 border-border rounded-2xl px-4 py-3 text-foreground font-medium focus:outline-none focus:border-primary transition-colors"
            disabled={submitted}
          />
          {!submitted && (
            <button onClick={() => { if (!input.trim()) return; setSubmitted(true); if (q.answer.some(a => a.toLowerCase().trim() === input.toLowerCase().trim())) setScore(s => s + 1); }} className="gradient-primary text-primary-foreground px-4 py-3 rounded-2xl">
              <Send className="h-5 w-5" />
            </button>
          )}
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

export default Grade10GrammarPage;
