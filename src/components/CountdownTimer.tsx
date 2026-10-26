import { useState, useEffect, useRef } from "react";
import { Timer } from "lucide-react";

interface CountdownTimerProps {
  minutes: number;
  onTimeUp: () => void;
  started: boolean; // only count when started
  deadline?: number; // Restored exam attempts keep their original deadline.
}

const CountdownTimer = ({ minutes, onTimeUp, started, deadline }: CountdownTimerProps) => {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const calledRef = useRef(false);

  useEffect(() => {
    setSecondsLeft(minutes * 60);
    calledRef.current = false;
  }, [minutes]);

  useEffect(() => {
    if (!started || minutes <= 0) return;
    if (deadline !== undefined) {
      const tick = () => {
        const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        setSecondsLeft(remaining);
        if (!remaining && !calledRef.current) { calledRef.current = true; onTimeUp(); }
      };
      tick(); const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!calledRef.current) {
            calledRef.current = true;
            setTimeout(onTimeUp, 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started, minutes, onTimeUp, deadline]);

  if (minutes <= 0) return null;

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const isUrgent = secondsLeft <= 60;

  return (
    <div
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
        isUrgent
          ? "bg-destructive/10 text-destructive border border-destructive/30 animate-pulse"
          : "bg-card text-foreground border border-border shadow-1"
      }`}
    >
      <Timer className="h-3.5 w-3.5" />
      {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
    </div>
  );
};

export default CountdownTimer;
