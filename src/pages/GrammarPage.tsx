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
    // Split by newline sections for detailed grammar notes
    const lines = notes.split("\n").filter(l => l.trim());
    const sections: { heading: string | null; body: string }[] = [];
    let currentBody: string[] = [];
    let currentHeading: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      // Detect section headings (numbered sections like "1.", "2.", or ALL CAPS, or lines ending with ":")
      const isHeading = /^(\d+\.\s+[A-Z])/.test(trimmed) ||
        (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 80) ||
        (/^[a-z]\)/.test(trimmed) && trimmed.length < 60);

      if (isHeading && currentBody.length > 0) {
        sections.push({ heading: currentHeading, body: currentBody.join("\n") });
        currentBody = [];
        currentHeading = trimmed;
      } else if (isHeading) {
        currentHeading = trimmed;
      } else {
        currentBody.push(trimmed);
      }
    }
    if (currentBody.length > 0 || currentHeading) {
      sections.push({ heading: currentHeading, body: currentBody.join("\n") });
    }

    // Fallback for old-style single-line notes
    if (sections.length === 0) {
      const parts = notes.split(". ").filter(Boolean);
      return parts.map(p => {
        const colonIdx = p.indexOf(":");
        if (colonIdx > 0 && colonIdx < 40 && p.substring(0, colonIdx).split(" ").length <= 8) {
          return { heading: p.substring(0, colonIdx), body: p.substring(colonIdx + 1).trim() };
        }
        return { heading: null, body: p };
      });
    }
    return sections;
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
          <div className="space-y-4">
            {notes.map((n, i) => (
              <div key={i}>
                {n.heading && <p className="font-bold text-primary text-sm mb-1">{n.heading}</p>}
                <div className="text-muted-foreground text-sm leading-relaxed space-y-1">
                  {n.body.split("\n").map((line, j) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;
                    // Highlight examples (lines starting with - or Ví dụ or Ex:)
                    const isExample = /^[-–•]/.test(trimmed) || /^(Ví dụ|Ex|E\.g)/i.test(trimmed);
                    // Highlight formulas (lines with + or →)
                    const isFormula = /^(S\s*\+|If\s*\+|\(\+\)|\(-\)|\(\?\))/.test(trimmed);
                    return (
                      <p key={j} className={
                        isFormula ? "font-mono text-xs bg-primary/5 px-2 py-1 rounded-lg text-primary/80" :
                        isExample ? "pl-3 border-l-2 border-primary/20 text-foreground/80" : ""
                      }>
                        {trimmed}
                      </p>
                    );
                  })}
                </div>
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
