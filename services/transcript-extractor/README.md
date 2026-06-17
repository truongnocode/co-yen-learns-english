# co-yen-transcript-extractor

Small Node service that uses `yt-dlp` to extract YouTube English subtitles for
video memorization lessons.

## Requirements

- Node.js 20+
- `yt-dlp` available in `PATH`
- WhisperX for GPU word timestamps (`RHYTHM_ENGINE=whisperx`, default).
- `ffmpeg` available in `PATH` for the fallback local audio-energy engine (`RHYTHM_ENGINE=ffmpeg`).

## Local run

```powershell
cd services/transcript-extractor
$env:PORT = "8788"
$env:TRANSCRIPT_EXTRACTOR_TOKEN = "local-dev-token"
$env:RHYTHM_ENGINE = "whisperx"
npm start
```

The service supports only two rhythm engines:

- `whisperx`: default. Uses local WhisperX word timestamps from the real audio.
- `ffmpeg`: uses local audio-energy dips plus caption word timings.

Both sources include `boundaryAfter` metadata for `/` vs `//`, confidence,
pause length, and signal sources. Any other `RHYTHM_ENGINE` value is rejected.

```powershell
$env:RHYTHM_ENGINE = "whisperx"
$env:RHYTHM_ENGINE = "ffmpeg"
```

WhisperX knobs:

```powershell
$env:WHISPERX_MODEL = "large-v3"
$env:WHISPERX_DEVICE = "cuda"
$env:WHISPERX_COMPUTE_TYPE = "float16"
$env:WHISPERX_BATCH_SIZE = "8"
```

Smoke test:

```powershell
npm run extract -- "https://www.youtube.com/watch?v=YS7vsBgWszI"
```

Compare engines for one video:

```powershell
cd ../..
npm run rhythm:evaluate -- --video-url "https://www.youtube.com/watch?v=YS7vsBgWszI" --engines whisperx,ffmpeg
```

Worker local config:

```powershell
cd workers/content-importer
$env:TRANSCRIPT_EXTRACTOR_URL = "http://127.0.0.1:8788"
$env:TRANSCRIPT_EXTRACTOR_TOKEN = "local-dev-token"
npx wrangler dev --port 8787 --ip 127.0.0.1
```

For production, deploy this service to a Node host/VPS/container platform and
set the same `TRANSCRIPT_EXTRACTOR_URL` and `TRANSCRIPT_EXTRACTOR_TOKEN` on the
Cloudflare Worker.

## Docker

```powershell
cd services/transcript-extractor
docker build -t co-yen-transcript-extractor .
docker run --rm -p 8788:8788 -e TRANSCRIPT_EXTRACTOR_TOKEN=change-me co-yen-transcript-extractor
```

For a GPU host, run the container with NVIDIA runtime support so WhisperX can
use `WHISPERX_DEVICE=cuda`. On a CPU-only host, set `RHYTHM_ENGINE=ffmpeg`.
