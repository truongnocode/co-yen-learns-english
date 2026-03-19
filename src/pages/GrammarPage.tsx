import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { loadSGKData } from "@/data/loader";
import { type SGKUnit, type MCQuestion } from "@/data/types";
import { Progress } from "@/components/ui/progress";

const GrammarPage = () => {
  const { gradeId, unitKey } = useParams();
  const navigate = useNavigate();
  const grade = Number(gradeId);
  const [unit, setUnit] = useState<SGKUnit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSGKData(grade).then(data => setUnit(data.units[unitKey!] || null)).finally(() => setLoading(false));
  }, [grade, unitKey]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Đang tải...</div>;
  if (!unit) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Không tìm thấy bài học.</div>;

  // Parse grammar notes into sections
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
    <div className="min-h-screen gradient-hero">
      <div className="max-w-lg mx-auto w-full px-5 pt-12 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="p-2.5 rounded-xl bg-card shadow-lg text-foreground border border-white/50">
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div>
            <p className="font-display font-bold text-sm text-foreground">Unit {unitKey} — {unit.title}</p>
            <p className="text-xs text-muted-foreground">Ngữ pháp</p>
          </div>
        </div>

        {/* Grammar topics */}
        <div className="flex flex-wrap gap-2 mb-6">
          {unit.grammar.map((g, i) => (
            <span key={i} className="gradient-primary text-white text-xs font-bold px-3 py-1.5 rounded-full">{g}</span>
          ))}
        </div>

        {/* Grammar notes */}
        <div className="bg-card rounded-3xl p-6 border border-white/40 shadow-lg mb-8">
          <h3 className="font-display font-bold text-lg text-foreground mb-4">📖 Ghi nhớ ngữ pháp</h3>
          <div className="space-y-3">
            {notes.map((n, i) => (
              <div key={i}>
                {n.heading && <p className="font-bold text-primary text-sm">{n.heading}:</p>}
                <p className="text-muted-foreground text-sm leading-relaxed">{n.body}.</p>
              </div>
            ))}
          </div>
        </div>

        {/* Exercises preview link */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/grade/${gradeId}/exercises/${unitKey}`)}
          className="w-full gradient-primary text-white rounded-2xl py-4 font-display font-bold text-center shadow-md"
        >
          Làm bài tập trắc nghiệm ({unit.exercises.length} câu)
        </motion.button>
      </div>
    </div>
  );
};

export default GrammarPage;
