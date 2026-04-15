import { useState, useEffect, useRef } from "react";
import { Timer } from "lucide-react";

interface CountdownTimerProps {
  minutes: number;
  onTimeUp: () => void;
  started: boolean; // only count when started
}

const CountdownTimer = ({ minutes, onTimeUp, started }: CountdownTimerProps) => {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const calledRef = useRef(false);

  useEffect(() => {
    setSecondsLeft(minutes * 60);
    calledRef.current = false;
  }, [minutes]);

  useEffect(() => {
    if (!started || minutes <= 0) return;
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
  }, [started, minutes, onTimeUp]);

  if (minutes <= 0) return null;

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const isUrgent = secondsLeft <= 60;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
        isUrgent
          ? "bg-destructive/10 text-destructive border border-destructive/30 animate-pulse"
          : "bg-card/80 text-foreground border border-border/30"
      }`}
    >
      <Timer className="h-3.5 w-3.5" />
      {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
    </div>
  );
};

export default CountdownTimer;
