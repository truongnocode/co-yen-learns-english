import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Play, Mic, Square, SkipForward, Eye, EyeOff, Volume2, Sparkles } from "lucide-react";
import { loadSGKData } from "@/data/loader";
import type { VocabItem } from "@/data/types";
import { speakUS } from "@/lib/tts";
import { startRecording, stopRecording, isRecordingSupported, getAudioUrl } from "@/lib/recorder";
import PageShell from "@/components/PageShell";
import { SpeakingFeedback } from "@/components/SpeakingFeedback";
import { gradeSpeaking, type SpeakingVerdict } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";


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
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [verdict, setVerdict] = useState<SpeakingVerdict | null>(null);
  const [scoring, setScoring] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

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
      setRecordingBlob(blob);
      setRecordingUrl(getAudioUrl(blob));
    } else {
      setRecordingUrl(null);
      setRecordingBlob(null);
      setVerdict(null);
      await startRecording();
      setRecording(true);
      // Auto-play the sentence while recording
      speak();
    }
  };

  const handleGradeWithAI = async () => {
    if (!recordingBlob) return;
    if (!user) {
      toast({
        variant: "destructive",
        title: "Chưa sẵn sàng",
        description: "Hệ thống đang tạo phiên học tự động. Em thử lại sau vài giây.",
      });
      return;
    }
    const target = sentences[current]?.en;
    if (!target) return;
    setScoring(true);
    setVerdict(null);
    try {
      const v = await gradeSpeaking(recordingBlob, target);
      setVerdict(v);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Chấm điểm thất bại",
        description: (e as Error).message,
      });
    } finally {
      setScoring(false);
    }
  };

  const nextSentence = () => {
    if (current < sentences.length - 1) {
      setCurrent((c) => c + 1);
      setPhase("listen");
      setRecordingUrl(null);
      setRecordingBlob(null);
      setVerdict(null);
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
            className="p-2.5 rounded-xl bg-card border border-border shadow-1 text-foreground">
            <Home className="h-5 w-5" />
          </motion.button>
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
          <span className="ml-auto text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-bold">
            {current + 1}/{sentences.length}
          </span>
        </div>

        <h1 className="font-display font-extrabold text-2xl text-foreground mb-1">Luyện Shadowing</h1>
        <p className="text-muted-foreground text-base mb-6">Nghe và nhại lại theo giọng bản xứ</p>

        {phase === "done" ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl p-8 text-center shadow-2 border border-border">
            <span className="text-6xl block mb-4">🎤🎉</span>
            <h2 className="font-display font-extrabold text-2xl text-foreground mb-2">Hoàn thành!</h2>
            <p className="text-muted-foreground text-base mb-6">Em đã luyện {sentences.length} cụm từ</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setCurrent(0); setPhase("listen"); setRecordingUrl(null); setRecordingBlob(null); setVerdict(null); }}
              className="bg-primary text-primary-foreground rounded-2xl px-8 py-3 font-display font-extrabold shadow-1 btn-press">
              Luyện lại
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Phase indicators */}
            <div className="flex gap-1 mb-6">
              {PHASES.map((p) => (
                <div key={p.key} className={`flex-1 h-1.5 rounded-full transition-colors ${
                  p.key === phase ? "bg-primary" :
                  PHASES.findIndex((x) => x.key === p.key) < PHASES.findIndex((x) => x.key === phase) ? "bg-success" :
                  "bg-muted"
                }`} />
              ))}
            </div>

            {/* Current phase info */}
            <div className="bg-card rounded-2xl p-5 mb-4 shadow-1 border border-border">
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
            <div className="bg-card rounded-2xl p-6 mb-4 shadow-1 border border-border text-center">
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
                className="w-14 h-14 rounded-full bg-accent2 text-accent2-foreground flex items-center justify-center shadow-1">
                <Volume2 className="h-6 w-6" />
              </motion.button>

              {phase === "record" ? (
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={handleRecord}
                  className={`w-16 h-16 rounded-full flex items-center justify-center shadow-1 ${
                    recording ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-accent text-accent-foreground"
                  }`}>
                  {recording ? <Square className="h-6 w-6" /> : <Mic className="h-7 w-7" />}
                </motion.button>
              ) : (
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={nextPhase}
                  className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-1">
                  <SkipForward className="h-7 w-7" />
                </motion.button>
              )}
            </div>

            {/* Recording playback */}
            {recordingUrl && (
              <div className="bg-card rounded-2xl p-4 mb-4 shadow-1 border border-border">
                <p className="text-xs font-bold text-foreground mb-2">Bản ghi âm của em:</p>
                <audio ref={audioRef} src={recordingUrl} controls className="w-full h-10" />
              </div>
            )}

            {/* AI feedback */}
            {phase === "record" && !recording && recordingBlob && !verdict && (
              <motion.button
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleGradeWithAI}
                disabled={scoring}
                className="w-full mb-3 bg-accent2 text-accent2-foreground rounded-2xl py-3 font-display font-extrabold shadow-1 inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {scoring ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Đang chấm…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Cô AI chấm giúp em
                  </>
                )}
              </motion.button>
            )}

            {verdict && (
              <div className="mb-4">
                <SpeakingFeedback verdict={verdict} />
              </div>
            )}

            {/* Next sentence */}
            {(phase === "record" && !recording) && (
              <motion.button
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={nextSentence}
                className="w-full bg-accent text-accent-foreground rounded-2xl py-3.5 font-display font-extrabold shadow-1 btn-press"
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
