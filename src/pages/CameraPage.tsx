import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Home, Camera, BookOpen, Zap, ClipboardList, Video, Hand } from "lucide-react";
import PageShell from "@/components/PageShell";
import { useAudio } from "@/lib/useAudio";
import { speakUS } from "@/lib/tts";
import { loadSGKData, loadGrade10Vocab, loadGrade10Grammar, loadGrade10Tests } from "@/data/loader";
import { collectCameraQuestions, type CameraQuestion } from "@/lib/cameraQuestions";
import type { SGKData } from "@/data/types";

const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

// Skeleton connections for drawing
const SKELETON_CONNECTIONS: [number, number][] = [
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 12],           // shoulders
  [11, 23], [12, 24], // torso
];
const KEY_POINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24];

// ---- MediaPipe types ----
interface Landmark { x: number; y: number; z: number; visibility?: number }
interface PoseLandmarkerResult { landmarks: Landmark[][] }
interface PoseLandmarker { detectForVideo(video: HTMLVideoElement, time: number): PoseLandmarkerResult }

// ---- Camera Overlay (React Portal) ----
function CameraOverlay({
  questions, onClose,
}: {
  questions: CameraQuestion[];
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const [phase, setPhase] = useState<"countdown" | "playing" | "result" | "finished">("countdown");
  const [countdown, setCountdown] = useState(3);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [detectedGesture, setDetectedGesture] = useState<"A" | "B" | null>(null);
  const [gestureHoldTime, setGestureHoldTime] = useState(0);
  const [resultPopup, setResultPopup] = useState<{ type: "correct" | "wrong" | "timeout"; correctAnswer: string } | null>(null);
  const [finalScore, setFinalScore] = useState<{ score: number; total: number } | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const currentGestureRef = useRef<string | null>(null);
  const gestureStartRef = useRef<number | null>(null);
  const confirmedRef = useRef(false);
  const currentQRef = useRef(0);
  const scoreRef = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const { playSound } = useAudio();

  const stopSpeech = useCallback(() => {
    try { speechSynthesis.cancel(); } catch { /* */ }
  }, []);

  // Detect gesture from landmarks
  const detectGesture = useCallback((landmarks: Landmark[]): "A" | "B" | null => {
    if (!landmarks || landmarks.length < 17) return null;
    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

    const leftHandRaised = leftWrist.y < leftShoulder.y - 0.08 && leftWrist.y < leftElbow.y;
    const rightHandRaised = rightWrist.y < rightShoulder.y - 0.08 && rightWrist.y < rightElbow.y;
    const headTiltLeft = (nose.x - shoulderMidX) > shoulderWidth * 0.25;
    const headTiltRight = (shoulderMidX - nose.x) > shoulderWidth * 0.25;

    if (leftHandRaised || headTiltLeft) return "A";
    if (rightHandRaised || headTiltRight) return "B";
    return null;
  }, []);

  // Draw skeleton on canvas
  const drawSkeleton = useCallback((landmarks: Landmark[], canvas: HTMLCanvasElement | null) => {
    if (!canvas || !landmarks) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 3;
    SKELETON_CONNECTIONS.forEach(([a, b]) => {
      if (landmarks[a] && landmarks[b]) {
        ctx.beginPath();
        ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
        ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
        ctx.stroke();
      }
    });

    ctx.fillStyle = "#00ff88";
    KEY_POINTS.forEach((idx) => {
      if (landmarks[idx]) {
        ctx.beginPath();
        ctx.arc(landmarks[idx].x * w, landmarks[idx].y * h, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, []);

  // Start camera and MediaPipe
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (e) {
        console.error("Camera error:", e);
        return;
      }

      try {
        const vision = await import(
          /* @vite-ignore */
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs"
        );
        if (cancelled) return;

        const wasmUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
        const filesetResolver = await vision.FilesetResolver.forVisionTasks(wasmUrl);
        const poseLandmarker = await vision.PoseLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        if (cancelled) return;
        poseLandmarkerRef.current = poseLandmarker;
      } catch (e) {
        console.error("MediaPipe load error:", e);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, []);

  // Countdown phase
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) { setPhase("playing"); return; }
    const t = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Handle answer
  const handleAnswer = useCallback((gesture: "A" | "B") => {
    stopSpeech();
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);

    const q = questions[currentQRef.current];
    const isCorrect = gesture === q.correct;

    if (isCorrect) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      playSound("correct");
    } else {
      playSound("wrong");
    }

    setResultPopup({ type: isCorrect ? "correct" : "wrong", correctAnswer: q.correct });
    setPhase("result");

    setTimeout(() => {
      setResultPopup(null);
      const nextQ = currentQRef.current + 1;
      if (nextQ >= questions.length) {
        setPhase("finished");
        setFinalScore({ score: scoreRef.current, total: questions.length });
        playSound("finish");
      } else {
        currentQRef.current = nextQ;
        setCurrentQ(nextQ);
        setPhase("playing");
      }
    }, 2000);
  }, [questions, playSound, stopSpeech]);

  // Handle timeout
  const handleTimeout = useCallback(() => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    stopSpeech();
    playSound("timeout");

    const q = questions[currentQRef.current];
    setResultPopup({ type: "timeout", correctAnswer: q.correct });
    setPhase("result");

    setTimeout(() => {
      setResultPopup(null);
      const nextQ = currentQRef.current + 1;
      if (nextQ >= questions.length) {
        setPhase("finished");
        setFinalScore({ score: scoreRef.current, total: questions.length });
        playSound("finish");
      } else {
        currentQRef.current = nextQ;
        setCurrentQ(nextQ);
        setPhase("playing");
      }
    }, 2000);
  }, [questions, playSound, stopSpeech]);

  // Detection loop when playing
  useEffect(() => {
    if (phase !== "playing") return;

    if (questions[currentQRef.current]) {
      speakUS(questions[currentQRef.current].text, 1.0);
    }

    setTimeLeft(15);
    confirmedRef.current = false;
    currentGestureRef.current = null;
    gestureStartRef.current = null;

    let remaining = 15;
    tickIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 5 && remaining > 0) playSound("urgentTick");
      else if (remaining > 5) playSound("tick");
      if (remaining <= 0) {
        clearInterval(tickIntervalRef.current);
        handleTimeout();
      }
    }, 1000);

    const detect = () => {
      if (phaseRef.current !== "playing" || confirmedRef.current) return;
      const video = videoRef.current;
      const poseLandmarker = poseLandmarkerRef.current;

      if (video && poseLandmarker && video.readyState >= 2) {
        try {
          const result = poseLandmarker.detectForVideo(video, performance.now());
          if (result.landmarks && result.landmarks.length > 0) {
            const lm = result.landmarks[0];
            drawSkeleton(lm, canvasRef.current);

            const gesture = detectGesture(lm);
            setDetectedGesture(gesture);

            if (gesture) {
              if (gesture === currentGestureRef.current) {
                const elapsed = (Date.now() - (gestureStartRef.current || Date.now())) / 1000;
                setGestureHoldTime(elapsed);
                if (elapsed >= 1.5 && !confirmedRef.current) {
                  confirmedRef.current = true;
                  handleAnswer(gesture);
                  return;
                }
              } else {
                currentGestureRef.current = gesture;
                gestureStartRef.current = Date.now();
                setGestureHoldTime(0);
              }
            } else {
              currentGestureRef.current = null;
              gestureStartRef.current = null;
              setGestureHoldTime(0);
            }
          }
        } catch { /* skip frame */ }
      }

      animFrameRef.current = requestAnimationFrame(detect);
    };

    animFrameRef.current = requestAnimationFrame(detect);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [phase, currentQ, questions, playSound, handleTimeout, handleAnswer, detectGesture, drawSkeleton]);

  const handleClose = () => {
    stopSpeech();
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    onClose();
  };

  const q = questions[currentQ] || { text: "", optA: "", optB: "", correct: "A" as const };
  const timerPercent = (timeLeft / 15) * 100;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 text-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-white/60 backdrop-blur-xl border-b border-black/5 shrink-0">
        <div className="font-bold text-sm">
          <span className="text-muted-foreground">Score:</span> {score}/{questions.length}
        </div>
        <div className={`text-xl font-extrabold tabular-nums min-w-[70px] text-center ${timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-primary"}`}>
          {timeLeft}s
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-muted-foreground">{currentQ + 1}/{questions.length}</span>
          <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/5 border border-black/8 hover:bg-red-500/15 hover:text-red-500 transition-colors text-lg">
            ✕
          </button>
        </div>
      </div>

      {/* Countdown */}
      <AnimatePresence>
        {phase === "countdown" && (
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 2, opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center"
          >
            <span className="text-8xl font-black text-primary drop-shadow-lg">{countdown || "GO!"}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question */}
      {phase !== "countdown" && phase !== "finished" && (
        <div className="text-center px-5 py-3 bg-white/45 backdrop-blur-lg border-b border-black/4 shrink-0">
          <div className="text-xs text-primary font-bold uppercase tracking-widest mb-1">Câu {currentQ + 1}</div>
          <div className="text-xl sm:text-2xl font-extrabold leading-relaxed max-w-3xl mx-auto px-5 py-3 bg-white/50 rounded-2xl border border-white/60 shadow-sm">
            {q.text}
          </div>
        </div>
      )}

      {/* Body: A | Camera | B */}
      <div className="flex-1 flex items-stretch gap-4 px-5 py-4 min-h-0 portrait:flex-col">
        {/* Option A */}
        <div className={`flex-1 flex flex-col items-center justify-center text-center p-5 rounded-3xl font-bold text-xl backdrop-blur-lg transition-all duration-300
          ${detectedGesture === "A" ? "bg-primary text-white shadow-xl shadow-primary/30 scale-[1.03]" : "bg-primary/10 border-2 border-primary/20 text-slate-900"}`}>
          <span className="text-3xl sm:text-4xl flex-1 flex items-center justify-center py-4">{q.optA}</span>
          <div className="text-xs opacity-40 border-t border-black/6 pt-2 w-full flex items-center justify-center gap-1.5">
            <Hand className="h-4 w-4 opacity-60" /> Tay trái / Nghiêng trái
          </div>
          {detectedGesture === "A" && (
            <div className="w-full h-1.5 bg-white/30 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-100" style={{ width: `${Math.min(gestureHoldTime / 1.5, 1) * 100}%` }} />
            </div>
          )}
        </div>

        {/* Camera feed */}
        <div className="w-[260px] min-w-[180px] shrink-0 relative rounded-2xl overflow-hidden border-2 border-white/50 self-center bg-slate-300 shadow-lg portrait:w-[100px] portrait:min-w-[80px] portrait:h-[75px] portrait:order-first">
          <video ref={videoRef} className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} playsInline muted />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" width={640} height={480} style={{ transform: "scaleX(-1)" }} />
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {/* Option B */}
        <div className={`flex-1 flex flex-col items-center justify-center text-center p-5 rounded-3xl font-bold text-xl backdrop-blur-lg transition-all duration-300
          ${detectedGesture === "B" ? "bg-primary text-white shadow-xl shadow-primary/30 scale-[1.03]" : "bg-primary/10 border-2 border-primary/20 text-slate-900"}`}>
          <span className="text-3xl sm:text-4xl flex-1 flex items-center justify-center py-4">{q.optB}</span>
          <div className="text-xs opacity-40 border-t border-black/6 pt-2 w-full flex items-center justify-center gap-1.5">
            <Hand className="h-4 w-4 opacity-60 -scale-x-100" /> Tay phải / Nghiêng phải
          </div>
          {detectedGesture === "B" && (
            <div className="w-full h-1.5 bg-white/30 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-100" style={{ width: `${Math.min(gestureHoldTime / 1.5, 1) * 100}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 bg-black/5 shrink-0">
        <div className={`h-full rounded-r-sm transition-[width] duration-100 ${timeLeft <= 5 ? "bg-red-500" : "bg-primary"}`} style={{ width: `${timerPercent}%` }} />
      </div>

      {/* Result popup */}
      <AnimatePresence>
        {resultPopup && (
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] w-[380px] max-w-[85vw] rounded-3xl overflow-hidden backdrop-blur-2xl shadow-2xl border border-white/50 text-center pointer-events-none
              ${resultPopup.type === "correct" ? "bg-emerald-500/90 text-white" : resultPopup.type === "wrong" ? "bg-red-500/90 text-white" : "bg-amber-500/90 text-white"}`}
          >
            <div className="text-4xl pt-6 pb-1">
              {resultPopup.type === "correct" ? "✓" : resultPopup.type === "wrong" ? "✗" : "⏰"}
            </div>
            <div className="text-2xl font-extrabold px-6 pb-3">
              {resultPopup.type === "correct" ? "Chính xác!" : resultPopup.type === "wrong" ? "Sai rồi!" : "Hết giờ!"}
            </div>
            {resultPopup.type !== "correct" && (
              <div className="text-base font-semibold px-5 pb-5 border-t border-white/20 pt-3 mx-5">
                Đáp án: {resultPopup.correctAnswer}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final score */}
      <AnimatePresence>
        {phase === "finished" && finalScore && (
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10001] bg-white/70 backdrop-blur-2xl rounded-3xl p-10 text-center shadow-2xl border border-white/60"
          >
            <h2 className="text-2xl font-extrabold mb-1">Kết quả</h2>
            <div className="text-6xl font-black text-primary leading-tight">{finalScore.score}/{finalScore.total}</div>
            <div className="mt-2 text-muted-foreground">{Math.round((finalScore.score / finalScore.total) * 100)}%</div>
            <div className="w-48 h-1.5 bg-black/5 rounded-full mx-auto mt-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${(finalScore.score / finalScore.total) * 100}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-primary rounded-full"
              />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleClose}
              className="mt-6 px-10 py-3 gradient-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/25">
              Đóng
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

// ---- Main Camera Page ----
const CameraPage = () => {
  const { gradeId } = useParams();
  const grade = Number(gradeId || 10);
  const navigate = useNavigate();

  const [gradeData, setGradeData] = useState<SGKData | Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [questions, setQuestions] = useState<CameraQuestion[]>([]);

  const isGrade10 = grade === 10;

  useEffect(() => {
    async function load() {
      try {
        if (grade >= 6 && grade <= 9) {
          const data = await loadSGKData(grade);
          setGradeData(data);
        } else if (grade === 10) {
          const [vocab, grammar, tests] = await Promise.all([
            loadGrade10Vocab(), loadGrade10Grammar(), loadGrade10Tests(),
          ]);
          setGradeData({ vocabTopics: vocab, grammarTopics: grammar, tests });
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [grade]);

  const startGame = (mode: "vocab" | "grammar" | "test" | "g6unit", testNum: string | number | null) => {
    if (!gradeData) return;

    let dataForMode: SGKData | Record<string, unknown> = gradeData;
    if (grade === 10) {
      const d = gradeData as Record<string, unknown>;
      if (mode === "vocab") dataForMode = d.vocabTopics as Record<string, unknown>;
      else if (mode === "grammar") dataForMode = d.grammarTopics as Record<string, unknown>;
      else if (mode === "test") dataForMode = d.tests as Record<string, unknown>;
    }

    const qs = collectCameraQuestions(mode, testNum, dataForMode, grade);
    if (qs.length === 0) {
      alert("Không tìm thấy câu hỏi cho chế độ này.");
      return;
    }
    setQuestions(qs);
    setShowOverlay(true);
  };

  // Build test/unit selection
  const selectionItems: { key: string | number; label: string }[] = [];
  if (isGrade10) {
    for (let i = 1; i <= 15; i++) selectionItems.push({ key: i, label: `Đề ${i}` });
  } else if (gradeData && "units" in gradeData) {
    Object.keys((gradeData as SGKData).units).forEach((key) => {
      selectionItems.push({ key, label: key.replace("unit", "Unit ") });
    });
  }

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center pt-40">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="text-center pt-40 text-destructive">Lỗi: {error}</div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        {/* Navigation */}
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/dashboard")}
            className="p-2.5 rounded-xl bg-card/80 backdrop-blur-xl shadow-lg text-foreground border border-border/30">
            <Home className="h-5 w-5" />
          </motion.button>
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={smooth}
          className="relative rounded-3xl overflow-hidden shadow-xl mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
          <div className="relative z-10 p-8">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-3">
              <Camera className="h-4 w-4 text-white" />
              <span className="text-xs font-extrabold text-white uppercase tracking-wider">Camera tương tác</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl text-white mb-2">Học bằng cử chỉ cơ thể</h1>
            <p className="text-white/75 text-sm max-w-lg">Trả lời câu hỏi bằng cách giơ tay hoặc nghiêng đầu. Vừa học vừa vận động!</p>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...smooth, delay: 0.1 }}
          className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-border/30 mb-6"
        >
          <h3 className="font-display font-extrabold text-lg mb-3 flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" /> Hướng dẫn
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2.5 bg-primary/5 rounded-2xl p-3">
              <span className="text-lg">🤚</span>
              <div><strong className="text-foreground">Chọn A:</strong> Giơ tay trái hoặc nghiêng đầu sang trái</div>
            </div>
            <div className="flex items-start gap-2.5 bg-primary/5 rounded-2xl p-3">
              <span className="text-lg">✋</span>
              <div><strong className="text-foreground">Chọn B:</strong> Giơ tay phải hoặc nghiêng đầu sang phải</div>
            </div>
            <div className="flex items-start gap-2.5 bg-primary/5 rounded-2xl p-3">
              <span className="text-lg">⏱️</span>
              <div><strong className="text-foreground">Giữ 1.5 giây</strong> để xác nhận câu trả lời</div>
            </div>
            <div className="flex items-start gap-2.5 bg-primary/5 rounded-2xl p-3">
              <span className="text-lg">⏰</span>
              <div><strong className="text-foreground">15 giây</strong> mỗi câu · Tối đa 20 câu</div>
            </div>
          </div>
        </motion.div>

        {/* Mode selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...smooth, delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="font-display font-extrabold text-lg mb-3">Chọn chế độ</h3>
          <div className="grid grid-cols-2 gap-3">
            <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => startGame("vocab", null)}
              className="gradient-accent text-white rounded-2xl p-5 text-left shadow-lg hover:shadow-xl transition-shadow">
              <BookOpen className="h-7 w-7 mb-2 opacity-80" />
              <div className="font-display font-extrabold text-lg">Từ vựng</div>
              <div className="text-white/70 text-xs mt-1">Trắc nghiệm A/B</div>
            </motion.button>
            <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => startGame("grammar", null)}
              className="gradient-cool text-white rounded-2xl p-5 text-left shadow-lg hover:shadow-xl transition-shadow">
              <Zap className="h-7 w-7 mb-2 opacity-80" />
              <div className="font-display font-extrabold text-lg">Ngữ pháp</div>
              <div className="text-white/70 text-xs mt-1">Trắc nghiệm A/B</div>
            </motion.button>
          </div>
        </motion.div>

        {/* Test/Unit selection */}
        {selectionItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...smooth, delay: 0.3 }}
          >
            <h3 className="font-display font-extrabold text-lg mb-3 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {isGrade10 ? "Chọn đề thi" : "Chọn Unit"}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {selectionItems.map((item, i) => (
                <motion.button
                  key={item.key}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...smooth, delay: 0.3 + i * 0.03 }}
                  whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                  onClick={() => startGame(isGrade10 ? "test" : "g6unit", item.key)}
                  className="gradient-primary text-white rounded-2xl py-3.5 px-2 font-display font-bold text-sm shadow-md hover:shadow-lg transition-shadow"
                >
                  {item.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Camera overlay portal */}
      {showOverlay && questions.length > 0 && (
        <CameraOverlay
          questions={questions}
          onClose={() => { setShowOverlay(false); setQuestions([]); }}
        />
      )}
    </PageShell>
  );
};

export default CameraPage;
