import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const SUBJECT_LABEL: Record<string, string> = {
  vocab: "Từ vựng",
  grammar: "Ngữ pháp",
  exercises: "Bài tập",
  reading: "Đọc hiểu",
  writing: "Viết",
  phonetics: "Phát âm",
};

/** Location-derived breadcrumb for the learn drill-down (Học › Lớp X › Subject).
 *  Renders nothing on paths it doesn't recognise. See docs/IA-PLAN.md §3.4. */
const Breadcrumb = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const seg = pathname.split("/").filter(Boolean); // e.g. ["grade","7","vocab","3"]
  if (seg[0] !== "grade" || seg.length < 3) return null;
  const gradeId = seg[1];
  const subject = SUBJECT_LABEL[seg[2]];
  if (!subject) return null;

  const crumbs: Array<{ label: string; to?: string }> = [
    { label: "Học", to: "/grades" },
    { label: `Lớp ${gradeId}`, to: `/grade/${gradeId}` },
    { label: subject },
  ];

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm font-semibold text-muted-foreground">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-4 w-4 opacity-50" aria-hidden />}
          {c.to ? (
            <button onClick={() => navigate(c.to!)} className="rounded px-1 transition-colors hover:text-foreground hover:underline">
              {c.label}
            </button>
          ) : (
            <span className="px-1 text-foreground" aria-current="page">
              {c.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumb;
