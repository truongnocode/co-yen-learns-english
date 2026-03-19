import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Home } from "lucide-react";
import { loadSGKData } from "@/data/loader";
import { type SGKUnit } from "@/data/types";
import PageShell from "@/components/PageShell";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

const GrammarPage = () => {
  const { gradeId, unitKey } = useParams();
  const navigate = useNavigate();
  const grade = Number(gradeId);
  const [unit, setUnit] = useState<SGKUnit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSGKData(grade).then(data => setUnit(data.units[unitKey!] || null)).finally(() => setLoading(false));
  }, [grade, unitKey]);

  if (loading) return (
    <PageShell withNavbar={false}>
      <div className="flex items-center justify-center pt-40">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    </PageShell>
  );

  if (!unit) return (
    <PageShell withNavbar={false}>
      <div className="flex items-center justify-center pt-40 text-muted-foreground">Không tìm thấy bài học.</div>
    </PageShell>
  );

  const parseNotes = (notes: string) => {
    const parts = notes.split(". ").filter(Boolean);
    return parts.map(p => {
      const colonIdx = p.indexOf(":");
      if (colonIdx > 0 && colonIdx < 40 && p.substring(0, colonIdx).split(" ").length <= 8) {
        return { heading: p.substring(0, colonIdx), body: p.substring(colonIdx + 1).trim() };
      }
      return { heading: null, body: p };
    });
  };

  const notes = parseNotes(unit.grammar_notes);

  return (
    <PageShell withNavbar={false}>
      <div className="max-w-lg mx-auto w-full px-5 pt-12 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-white/50">
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div className="flex-1">
            <p className="font-display font-extrabold text-sm text-foreground">Unit {unitKey} — {unit.title}</p>
            <p className="text-xs text-muted-foreground">Ngữ pháp</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/dashboard")}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-white/50">
            <Home className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Grammar topics */}
        <motion.div initial={{ opacity: 0, y: 15, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={smooth}
          className="flex flex-wrap gap-2 mb-6">
          {unit.grammar.map((g, i) => (
            <span key={i} className="gradient-primary text-white text-xs font-bold px-3 py-1.5 rounded-full">{g}</span>
          ))}
        </motion.div>

        {/* Grammar notes */}
        <motion.div initial={{ opacity: 0, y: 20, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ ...smooth, delay: 0.1 }}
          className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-lg mb-8">
          <h3 className="font-display font-extrabold text-lg text-foreground mb-4">📖 Ghi nhớ ngữ pháp</h3>
          <div className="space-y-3">
            {notes.map((n, i) => (
              <div key={i}>
                {n.heading && <p className="font-bold text-primary text-sm">{n.heading}:</p>}
                <p className="text-muted-foreground text-sm leading-relaxed">{n.body}.</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ ...smooth, delay: 0.2 }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/grade/${gradeId}/exercises/${unitKey}`)}
          className="w-full gradient-primary text-white rounded-2xl py-4 font-display font-extrabold text-center shadow-lg"
        >
          Làm bài tập trắc nghiệm ({unit.exercises.length} câu)
        </motion.button>
      </div>
    </PageShell>
  );
};

export default GrammarPage;
