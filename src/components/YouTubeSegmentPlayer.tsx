import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Segment {
  start: number;
  end: number;
}

export interface YouTubeSegmentPlayerHandle {
  playSegment: (segment: Segment, rate?: number, loop?: boolean) => void;
  stop: () => void;
}

interface YouTubeSegmentPlayerProps {
  videoId: string;
  className?: string;
}

interface YTPlayer {
  cueVideoById: (args: { videoId: string; startSeconds?: number }) => void;
  loadVideoById: (args: { videoId: string; startSeconds?: number; endSeconds?: number }) => void;
  pauseVideo: () => void;
  setPlaybackRate: (rate: number) => void;
  loadModule?: (module: string) => void;
  setOption?: (module: string, option: string, value: unknown) => void;
  destroy: () => void;
}

interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, unknown>;
      events?: { onReady?: () => void };
    },
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
    __coYenYouTubeReadyCallbacks?: Array<() => void>;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    window.__coYenYouTubeReadyCallbacks = window.__coYenYouTubeReadyCallbacks ?? [];
    window.__coYenYouTubeReadyCallbacks.push(resolve);

    window.onYouTubeIframeAPIReady = () => {
      const callbacks = window.__coYenYouTubeReadyCallbacks ?? [];
      window.__coYenYouTubeReadyCallbacks = [];
      callbacks.forEach((cb) => cb());
    };

    if (!document.querySelector("script[src='https://www.youtube.com/iframe_api']")) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      document.head.appendChild(tag);
    }
  });

  return youtubeApiPromise;
}

function enableEnglishCaptions(player: YTPlayer | null) {
  try {
    player?.loadModule?.("captions");
    player?.setOption?.("captions", "track", { languageCode: "en" });
  } catch {
    // Caption module support varies by video/browser; playerVars still request English CC.
  }
}

const YouTubeSegmentPlayer = forwardRef<YouTubeSegmentPlayerHandle, YouTubeSegmentPlayerProps>(
  ({ videoId, className }, ref) => {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<YTPlayer | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [ready, setReady] = useState(false);

    const clearTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    useEffect(() => {
      let cancelled = false;
      setReady(false);

      loadYouTubeApi().then(() => {
        if (cancelled || !hostRef.current || !window.YT?.Player) return;
        playerRef.current?.destroy();
        playerRef.current = new window.YT.Player(hostRef.current, {
          videoId,
          playerVars: {
            playsinline: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            cc_load_policy: 1,
            cc_lang_pref: "en",
            hl: "en",
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (cancelled) return;
              setReady(true);
              playerRef.current?.cueVideoById({ videoId, startSeconds: 0 });
              enableEnglishCaptions(playerRef.current);
              window.setTimeout(() => enableEnglishCaptions(playerRef.current), 300);
            },
          },
        });
      });

      return () => {
        cancelled = true;
        clearTimer();
        playerRef.current?.destroy();
        playerRef.current = null;
      };
    }, [videoId]);

    useImperativeHandle(ref, () => ({
      playSegment: (segment, rate = 1, loop = false) => {
        const player = playerRef.current;
        if (!player) return;

        clearTimer();
        const start = Math.max(0, segment.start);
        const end = Math.max(start + 0.8, segment.end);
        const durationMs = ((end - start) / Math.max(rate, 0.25)) * 1000 + 450;

        const playOnce = () => {
          player.loadVideoById({ videoId, startSeconds: start, endSeconds: end });
          enableEnglishCaptions(player);
          window.setTimeout(() => {
            try {
              player.setPlaybackRate(rate);
            } catch {
              // YouTube may reject an unavailable rate for some videos; default playback still works.
            }
            enableEnglishCaptions(player);
          }, 250);

          timerRef.current = window.setTimeout(() => {
            if (loop) playOnce();
            else player.pauseVideo();
          }, durationMs);
        };

        playOnce();
      },
      stop: () => {
        clearTimer();
        playerRef.current?.pauseVideo();
      },
    }));

    return (
      <div className={cn("relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg", className)}>
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white/70">
            Đang tải video…
          </div>
        )}
        <div className="h-full w-full pointer-events-none">
          <div ref={hostRef} className="h-full w-full" />
        </div>
      </div>
    );
  },
);

YouTubeSegmentPlayer.displayName = "YouTubeSegmentPlayer";

export default YouTubeSegmentPlayer;
