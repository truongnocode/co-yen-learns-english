import { BookOpen, Dumbbell, Play, TrendingUp, type LucideIcon } from "lucide-react";
import { routes } from "./routes";

// The 4 top-level hubs — the ONLY primary destinations (see docs/IA-PLAN.md §3).
// One config consumed by both the desktop top bar and the mobile bottom bar so
// the menu can never drift between them again.
export interface NavHub {
  key: string;
  label: string;
  icon: LucideIcon;
  to: string; // default destination
  match: string[]; // path prefixes that mark this hub active
}

export const HUBS: NavHub[] = [
  { key: "hoc", label: "Học", icon: BookOpen, to: routes.grades, match: ["/grades", "/grade", "/phonetics"] },
  { key: "luyen", label: "Luyện tập", icon: Dumbbell, to: routes.practice, match: ["/practice", "/tests", "/test"] },
  { key: "video", label: "Video", icon: Play, to: routes.video, match: ["/video-lessons"] },
  { key: "tien", label: "Tiến trình", icon: TrendingUp, to: routes.progress, match: ["/progress", "/pet"] },
];

export function activeHubKey(pathname: string): string | null {
  for (const h of HUBS) {
    if (h.match.some((m) => pathname === m || pathname.startsWith(m + "/"))) return h.key;
  }
  return null;
}
