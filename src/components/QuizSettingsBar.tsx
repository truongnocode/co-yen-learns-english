import { motion } from "framer-motion";
import { Eye, EyeOff, Timer } from "lucide-react";

export type ReviewMode = "instant" | "after";

interface QuizSettingsBarProps {
  reviewMode: ReviewMode;
  onReviewModeChange: (mode: ReviewMode) => void;
  timeLimit: number; // minutes, 0 = no limit
  onTimeLimitChange: (minutes: number) => void;
}

const QUICK_TIMES = [10, 15, 30, 45, 60];

const QuizSettingsBar = ({ reviewMode, onReviewModeChange, timeLimit, onTimeLimitChange }: QuizSettingsBarProps) => {
  return (
    <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-4 mb-4 border border-border/30 shadow-sm">
      {/* Review mode */}
      <div className="mb-3">
        <p className="text-xs font-bold text-muted-foreground mb-2">Chế độ xem đáp án</p>
        <div className="flex gap-2">
          <button
            onClick={() => onReviewModeChange("instant")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              reviewMode === "instant"
                ? "gradient-primary text-white shadow-md"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Xem ngay từng câu
          </button>
          <button
            onClick={() => onReviewModeChange("after")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              reviewMode === "after"
                ? "gradient-accent text-white shadow-md"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            <EyeOff className="h-3.5 w-3.5" />
            Xem sau khi nộp bài
          </button>
        </div>
      </div>

      {/* Timer */}
      <div>
        <p className="text-xs font-bold text-muted-foreground mb-2">
          <Timer className="h-3.5 w-3.5 inline mr-1" />
          Hẹn giờ <span className="font-normal">(bỏ trống = không giới hạn)</span>
        </p>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => onTimeLimitChange(0)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeLimit === 0
                ? "bg-foreground text-background"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            Không
          </button>
          {QUICK_TIMES.map((t) => (
            <button
              key={t}
              onClick={() => onTimeLimitChange(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeLimit === t
                  ? "bg-foreground text-background"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {t}p
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizSettingsBar;
