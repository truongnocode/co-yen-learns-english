// ===== Grade 6-9 Data Types (SGK Global Success) =====

export interface VocabItem {
  en: string;
  ipa?: string; // IPA pronunciation e.g. "/ˈɑːtɪzæn/"
  type: string; // "n", "v", "adj", "adv", "prep", "idiom", "n/v", "v phr", "phr"
  vi: string;
}

export interface MCQuestion {
  q: string;
  opts: string[];
  ans: number;
}

export interface SGKUnit {
  title: string;
  vocabulary: VocabItem[];
  grammar: string[];
  grammar_notes: string;
  exercises: MCQuestion[];
}

export interface SGKData {
  units: Record<string, SGKUnit>;
}

// ===== Grade 10 Data Types =====

export interface Grade10VocabTopic {
  name: string;
  questions: MCQuestion[];
}

export type Grade10VocabData = Record<string, Grade10VocabTopic>;

export interface Grade10GrammarExercises {
  mcq?: { instruction: string; questions: MCQuestion[] };
  rearrange?: { instruction: string; questions: { q: string; answer: string[] }[] };
  completion?: { instruction: string; questions: { q: string; answer: string[] }[] };
  rewrite?: { instruction: string; questions: { q: string; answer: string[] }[] };
}

export interface Grade10GrammarTopic {
  name: string;
  exercises: Grade10GrammarExercises;
}

export type Grade10GrammarData = Record<string, Grade10GrammarTopic>;

// ===== Grade metadata =====

export const SUPPORTED_GRADES = [6, 7, 8, 9, 10] as const;
export type SupportedGrade = (typeof SUPPORTED_GRADES)[number];

export const gradeConfig: Record<number, { label: string; emoji: string; gradient: string }> = {
  6: { label: "Lớp 6", emoji: "🌊", gradient: "from-cyan-400 to-blue-500" },
  7: { label: "Lớp 7", emoji: "🦋", gradient: "from-blue-400 to-indigo-500" },
  8: { label: "Lớp 8", emoji: "🚀", gradient: "from-indigo-400 to-violet-500" },
  9: { label: "Lớp 9", emoji: "🎓", gradient: "from-violet-400 to-purple-500" },
  10: { label: "Lớp 10", emoji: "👑", gradient: "from-amber-400 to-orange-500" },
};

export const wordTypeLabels: Record<string, string> = {
  n: "Danh từ",
  v: "Động từ",
  adj: "Tính từ",
  adv: "Trạng từ",
  prep: "Giới từ",
  idiom: "Thành ngữ",
  "n/v": "Danh/Động từ",
  "v phr": "Cụm động từ",
  phr: "Cụm từ",
  "v/n": "Động/Danh từ",
};
