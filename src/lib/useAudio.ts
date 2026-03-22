import { useRef, useCallback } from "react";

type SoundType = "correct" | "wrong" | "timeout" | "tick" | "urgentTick" | "finish";

export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const tone = useCallback(
    (type: OscillatorType, freq: number, startT: number, dur: number, vol: number) => {
      try {
        const ctx = getCtx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = type;
        o.frequency.setValueAtTime(freq, startT);
        g.gain.setValueAtTime(vol, startT);
        g.gain.exponentialRampToValueAtTime(0.01, startT + dur);
        o.start(startT);
        o.stop(startT + dur);
      } catch {
        /* ignore */
      }
    },
    [getCtx],
  );

  const playSound = useCallback(
    (type: SoundType) => {
      try {
        const ctx = getCtx();
        const t = ctx.currentTime;
        if (type === "correct") {
          tone("sine", 1319, t, 0.08, 0.3);
          tone("sine", 1568, t + 0.07, 0.08, 0.3);
          tone("sine", 2093, t + 0.14, 0.1, 0.35);
          tone("sine", 1568, t + 0.22, 0.08, 0.25);
          tone("sine", 2093, t + 0.28, 0.1, 0.3);
          tone("sine", 2637, t + 0.35, 0.15, 0.25);
          tone("triangle", 3136, t + 0.3, 0.12, 0.12);
          tone("sine", 262, t, 0.15, 0.2);
        } else if (type === "wrong") {
          tone("sawtooth", 150, t, 0.18, 0.3);
          tone("square", 160, t, 0.18, 0.2);
          tone("sawtooth", 140, t + 0.22, 0.22, 0.3);
          tone("square", 150, t + 0.22, 0.22, 0.2);
          tone("sine", 55, t, 0.5, 0.25);
        } else if (type === "timeout") {
          tone("sine", 440, t, 0.25, 0.3);
          tone("sine", 330, t + 0.3, 0.25, 0.3);
          tone("sine", 220, t + 0.6, 0.4, 0.25);
          tone("triangle", 110, t + 0.8, 0.3, 0.15);
        } else if (type === "tick") {
          tone("sine", 880, t, 0.05, 0.08);
        } else if (type === "urgentTick") {
          tone("square", 1200, t, 0.06, 0.18);
          tone("sine", 600, t, 0.04, 0.08);
        } else if (type === "finish") {
          tone("sine", 523, t, 0.2, 0.25);
          tone("sine", 659, t + 0.12, 0.2, 0.25);
          tone("sine", 784, t + 0.24, 0.2, 0.25);
          tone("sine", 1047, t + 0.36, 0.3, 0.3);
          tone("sine", 1319, t + 0.5, 0.4, 0.3);
          tone("sine", 1568, t + 0.6, 0.3, 0.25);
          tone("triangle", 2093, t + 0.7, 0.4, 0.15);
          tone("sine", 262, t + 0.5, 0.4, 0.2);
        }
      } catch {
        /* ignore */
      }
    },
    [getCtx, tone],
  );

  return { playSound };
}
