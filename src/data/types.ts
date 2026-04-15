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
  explain?: string; // Brief explanation: why correct answer is right & why others are wrong
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

// ===== Grade 10 Tests (Practice Exams) =====

export interface Grade10SignQuestion {
  sign: string;
  q: string;
  opts: string[];
  ans: number;
  explain?: string;
}

export interface Grade10ReadingPassage {
  title: string;
  passage: string;
  questions: MCQuestion[];
}

export interface Grade10ArrangeParagraph {
  num?: number;
  sentences: string[];
  /** The correct order expressed as sentence letter keys, e.g. ["b","d","a","c","e"]. */
  answer?: string[];
}

export interface Grade10ArrangeWords {
  num?: number;
  words: string;
  answer: string;
}

export interface Grade10FillIn {
  num?: number;
  q: string;
  /** Array of acceptable answer variants for matching. */
  answer: string[];
}

export interface Grade10WritingPrompt {
  num?: number;
  prompt: string;
  suggestions?: string[];
}

export interface Grade10TestPartA {
  instruction: string;
  questions: MCQuestion[];
}

export interface Grade10TestPartB {
  cloze?: { passage: string; questions: MCQuestion[] };
  signs?: Grade10SignQuestion[];
  reading1?: Grade10ReadingPassage;
  reading2?: Grade10ReadingPassage;
}

export interface Grade10TestPartC {
  arrange_paragraph?: Grade10ArrangeParagraph[];
  arrange_words?: Grade10ArrangeWords[];
  fill_in?: Grade10FillIn[];
  writing?: Grade10WritingPrompt;
}

export interface Grade10Test {
  title: string;
  partA: Grade10TestPartA;
  partB: Grade10TestPartB;
  partC?: Grade10TestPartC;
}

// ===== Grade 10 Writing data (practice sections) =====

/** MCQ-style section: pick the correct arrangement from A/B/C/D. */
export interface Grade10WritingArrangeSection {
  instruction: string;
  questions: MCQuestion[];
}

/** Free-answer section: user types an answer we match against accepted variants. */
export interface Grade10WritingFreeAnswerSection {
  instruction: string;
  questions: { q: string; answer: string[] }[];
}

export interface Grade10WritingData {
  letterArranging?: Grade10WritingArrangeSection;
  paragraphArranging?: Grade10WritingArrangeSection;
  sentenceArranging?: Grade10WritingFreeAnswerSection;
  sentenceRewriting?: Grade10WritingFreeAnswerSection;
}

export type Grade10TestsData = Record<string, Grade10Test>;

// ===== Grade metadata =====

export const SUPPORTED_GRADES = [3, 4, 5, 6, 7, 8, 9, 10] as const;
export type SupportedGrade = (typeof SUPPORTED_GRADES)[number];

export const gradeConfig: Record<number, { label: string; emoji: string; gradient: string }> = {
  3: { label: "Lớp 3", emoji: "🌈", gradient: "from-pink-400 to-rose-500" },
  4: { label: "Lớp 4", emoji: "🌟", gradient: "from-rose-400 to-orange-500" },
  5: { label: "Lớp 5", emoji: "🎯", gradient: "from-orange-400 to-amber-500" },
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
