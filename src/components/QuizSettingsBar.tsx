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
    <div className="bg-card border border-border shadow-1 rounded-2xl p-4 mb-4">
      {/* Review mode */}
      <div className="mb-3">
        <p className="text-xs font-bold text-muted-foreground mb-2">Chế độ xem đáp án</p>
        <div className="flex gap-2">
          <button
            onClick={() => onReviewModeChange("instant")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              reviewMode === "instant"
                ? "bg-primary text-primary-foreground shadow-1"
                : "border-2 border-border bg-card text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Xem ngay từng câu
          </button>
          <button
            onClick={() => onReviewModeChange("after")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              reviewMode === "after"
                ? "bg-accent text-accent-foreground shadow-1"
                : "border-2 border-border bg-card text-muted-foreground hover:bg-muted/50"
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
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
          <button
            onClick={() => onTimeLimitChange(0)}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              timeLimit === 0
                ? "bg-foreground text-background"
                : "border border-border bg-card text-muted-foreground hover:bg-muted/50"
            }`}
          >
            Không
          </button>
          {QUICK_TIMES.map((t) => (
            <button
              key={t}
              onClick={() => onTimeLimitChange(t)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                timeLimit === t
                  ? "bg-foreground text-background"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted/50"
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
