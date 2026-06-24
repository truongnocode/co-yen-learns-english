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
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  setPlaybackRate: (rate: number) => void;
  loadModule?: (module: string) => void;
  getOption?: (module: string, option: string) => unknown;
  setOption?: (module: string, option: string, value: unknown) => void;
  destroy: () => void;
}

interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, unknown>;
      events?: { onReady?: () => void; onApiChange?: () => void };
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

// Yêu cầu trình phát YouTube hiển thị phụ đề GỐC, tự DỊCH sang tiếng Việt.
// Lấy track thật từ tracklist (sau khi module captions nạp) rồi gắn translationLanguage.
function applyVietnameseTranslation(player: YTPlayer | null) {
  try {
    player?.loadModule?.("captions");
    const list = player?.getOption?.("captions", "tracklist");
    const base = Array.isArray(list) && list.length ? (list[0] as Record<string, unknown>) : { languageCode: "en" };
    player?.setOption?.("captions", "track", {
      ...base,
      translationLanguage: { languageCode: "vi", languageName: "Vietnamese" },
    });
  } catch {
    // cc_lang_pref:"vi" trong playerVars vẫn ưu tiên tiếng Việt nếu API không nhận track.
  }
}

const YouTubeSegmentPlayer = forwardRef<YouTubeSegmentPlayerHandle, YouTubeSegmentPlayerProps>(
  ({ videoId, className }, ref) => {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<YTPlayer | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [ready, setReady] = useState(false);

    const clearTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);
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
            cc_load_policy: 1, // bật phụ đề gốc YouTube
            cc_lang_pref: "vi", // ưu tiên tiếng Việt (YouTube tự dịch)
            hl: "vi",
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (cancelled) return;
              setReady(true);
              playerRef.current?.cueVideoById({ videoId, startSeconds: 0 });
            },
            // Fires khi module (incl. captions) nạp xong — lúc này tracklist mới có.
            onApiChange: () => {
              if (cancelled) return;
              applyVietnameseTranslation(playerRef.current);
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

        player.loadVideoById({ videoId, startSeconds: start, endSeconds: end });
        window.setTimeout(() => {
          try {
            player.setPlaybackRate(rate);
          } catch {
            // YouTube may reject an unavailable rate for some videos; default playback still works.
          }
          applyVietnameseTranslation(player);
        }, 300);
        // Caption module nạp sau khi phát ~1s — áp lại vài lần cho chắc.
        window.setTimeout(() => applyVietnameseTranslation(player), 1200);
        window.setTimeout(() => applyVietnameseTranslation(player), 2400);

        // Stop (or, when looping, restart) based on the ACTUAL playback position,
        // not a fixed call-time timer. On mobile the video needs ~1–2s to load/seek
        // before sound starts, so a call-time timer would pause after just 1–2 words.
        // We ignore currentTime for a short arming window so the post-load seek can
        // reset it, then watch it climb to `end`.
        let armAt = Date.now() + 450;
        timerRef.current = window.setInterval(() => {
          if (Date.now() < armAt) return;
          let t = 0;
          try {
            t = player.getCurrentTime?.() ?? 0;
          } catch {
            return;
          }
          if (t < end - 0.05) return;
          if (loop) {
            armAt = Date.now() + 450;
            try {
              player.seekTo(start, true);
              player.playVideo();
            } catch {
              // ignore transient player errors; next tick retries
            }
          } else {
            clearTimer();
            try {
              player.pauseVideo();
            } catch {
              // ignore
            }
          }
        }, 100);
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
