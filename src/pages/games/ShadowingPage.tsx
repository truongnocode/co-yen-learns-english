import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Play, Pause, Mic, Square, SkipForward, Eye, EyeOff, Volume2 } from "lucide-react";
import { loadSGKData } from "@/data/loader";
import type { VocabItem } from "@/data/types";
import { speakUS } from "@/lib/tts";
import { startRecording, stopRecording, isRecordingSupported, getAudioUrl, isRecording } from "@/lib/recorder";
import PageShell from "@/components/PageShell";

const smooth = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = "listen" | "mumble" | "shadow" | "blind" | "record" | "done";
const PHASES: { key: Phase; label: string; icon: typeof Play; desc: string }[] = [
  { key: "listen", label: "1. Nghe thấm", icon: Volume2, desc: "Nghe kỹ câu mẫu, không lặp lại" },
  { key: "mumble", label: "2. Đọc nhẩm", icon: Eye, desc: "Nghe + đọc text, mấp máy môi theo" },
  { key: "shadow", label: "3. Shadow có text", icon: Play, desc: "Đọc to theo cùng lúc, nhìn text" },
  { key: "blind", label: "4. Shadow không text", icon: EyeOff, desc: "Đọc theo chỉ bằng tai" },
  { key: "record", label: "5. Ghi âm", icon: Mic, desc: "Thu âm giọng nói của em" },
];

const ShadowingPage = () => {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const grade = Number(gradeId || 6);

  const [sentences, setSentences] = useState<{ en: string; vi: string }[]>([]);
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<Phase>("listen");
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Build sentences from vocabulary
  useEffect(() => {
    loadSGKData(grade).then((data) => {
      const items: { en: string; vi: string }[] = [];
      Object.values(data.units).forEach((u) => {
        u.vocabulary.forEach((v: VocabItem) => items.push({ en: v.en, vi: v.vi }));
      });
      // Group into phrases of 3-5 words
      const phrases: { en: string; vi: string }[] = [];
      const shuffled = shuffle(items);
      for (let i = 0; i < Math.min(shuffled.length, 40); i += 3) {
        const group = shuffled.slice(i, i + 3);
        phrases.push({
          en: group.map((g) => g.en).join(", "),
          vi: group.map((g) => g.vi).join(", "),
        });
      }
      setSentences(phrases.slice(0, 8));
    }).finally(() => setLoading(false));
  }, [grade]);

  const speak = () => {
    if (sentences[current]) speakUS(sentences[current].en, 0.8);
  };

  const handleRecord = async () => {
    if (!isRecordingSupported()) {
      alert("Trình duyệt không hỗ trợ ghi âm. Hãy dùng Chrome hoặc Safari.");
      return;
    }
    if (recording) {
      const blob = await stopRecording();
      setRecording(false);
      setRecordingUrl(getAudioUrl(blob));
    } else {
      setRecordingUrl(null);
      await startRecording();
      setRecording(true);
      // Auto-play the sentence while recording
      speak();
    }
  };

  const nextSentence = () => {
    if (current < sentences.length - 1) {
      setCurrent((c) => c + 1);
      setPhase("listen");
      setRecordingUrl(null);
    } else {
      setPhase("done");
    }
  };

  const nextPhase = () => {
    const idx = PHASES.findIndex((p) => p.key === phase);
    if (idx < PHASES.length - 1) {
      setPhase(PHASES[idx + 1].key);
      if (PHASES[idx + 1].key !== "record") speak();
    }
  };

  const showText = phase === "mumble" || phase === "shadow";

  if (loading) return (
    <PageShell><div className="flex items-center justify-center pt-40">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
    </div></PageShell>
  );

  return (
    <PageShell>
      <div className="max-w-lg mx-auto px-5 pt-28 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/dashboard")}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
            <Home className="h-5 w-5" />
          </motion.button>
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
          <span className="ml-auto text-xs gradient-primary text-white px-3 py-1.5 rounded-full font-bold">
            {current + 1}/{sentences.length}
          </span>
        </div>

        <h1 className="font-display font-extrabold text-2xl text-foreground mb-1">Luyện Shadowing</h1>
        <p className="text-muted-foreground text-sm mb-6">Nghe và nhại lại theo giọng bản xứ</p>

        {phase === "done" ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 text-center shadow-xl border border-border/30">
            <span className="text-6xl block mb-4">🎤🎉</span>
            <h2 className="font-display font-extrabold text-2xl text-foreground mb-2">Hoàn thành!</h2>
            <p className="text-muted-foreground text-sm mb-6">Em đã luyện {sentences.length} cụm từ</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setCurrent(0); setPhase("listen"); setRecordingUrl(null); }}
              className="gradient-primary text-white rounded-2xl px-8 py-3 font-display font-bold shadow-lg">
              Luyện lại
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Phase indicators */}
            <div className="flex gap-1 mb-6">
              {PHASES.map((p) => (
                <div key={p.key} className={`flex-1 h-1.5 rounded-full transition-colors ${
                  p.key === phase ? "gradient-primary" :
                  PHASES.findIndex((x) => x.key === p.key) < PHASES.findIndex((x) => x.key === phase) ? "bg-emerald-400" :
                  "bg-muted"
                }`} />
              ))}
            </div>

            {/* Current phase info */}
            <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-5 mb-4 shadow-lg border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                {(() => { const P = PHASES.find((p) => p.key === phase); return P ? <P.icon className="h-5 w-5 text-primary" /> : null; })()}
                <span className="font-display font-extrabold text-sm text-primary">
                  {PHASES.find((p) => p.key === phase)?.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {PHASES.find((p) => p.key === phase)?.desc}
              </p>
            </div>

            {/* Sentence display */}
            <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-6 mb-4 shadow-lg border border-border/30 text-center">
              {showText || phase === "listen" ? (
                <>
                  <p className="font-display font-extrabold text-xl text-foreground mb-2">{sentences[current]?.en}</p>
                  {showText && <p className="text-sm text-muted-foreground">{sentences[current]?.vi}</p>}
                </>
              ) : phase === "blind" ? (
                <p className="text-muted-foreground text-sm italic">Chỉ nghe, không nhìn text</p>
              ) : phase === "record" ? (
                <p className="text-muted-foreground text-sm">{recording ? "Đang ghi âm..." : "Nhấn nút micro để bắt đầu"}</p>
              ) : null}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={speak}
                className="w-14 h-14 rounded-full gradient-cool flex items-center justify-center text-white shadow-lg">
                <Volume2 className="h-6 w-6" />
              </motion.button>

              {phase === "record" ? (
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={handleRecord}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg ${
                    recording ? "bg-red-500 animate-pulse" : "gradient-warm"
                  }`}>
                  {recording ? <Square className="h-6 w-6" /> : <Mic className="h-7 w-7" />}
                </motion.button>
              ) : (
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={nextPhase}
                  className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white shadow-lg">
                  <SkipForward className="h-7 w-7" />
                </motion.button>
              )}
            </div>

            {/* Recording playback */}
            {recordingUrl && (
              <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-4 mb-4 shadow-lg border border-border/30">
                <p className="text-xs font-bold text-foreground mb-2">Bản ghi âm của em:</p>
                <audio ref={audioRef} src={recordingUrl} controls className="w-full h-10" />
              </div>
            )}

            {/* Next sentence */}
            {(phase === "record" && !recording) && (
              <motion.button
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={nextSentence}
                className="w-full gradient-accent text-white rounded-2xl py-3.5 font-display font-extrabold shadow-lg"
              >
                {current < sentences.length - 1 ? "Câu tiếp theo" : "Hoàn thành"}
              </motion.button>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
};

export default ShadowingPage;
