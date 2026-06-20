---
name: youtube-rhythm
description: >
  Turn a YouTube video into a ReadFlow video lesson with AUDIO-FAITHFUL rhythm marks
  (`/` short pause, `//` long pause) for the co-yen-learns-english app
  (tienganhcoyen.online). The marks match HOW THE SPEAKER ACTUALLY TALKS so Vietnamese
  beginners can shadow real spoken US English. Fetches captions + word timing with
  yt-dlp, detects the speaker's real pauses, writes a lesson to Firestore
  (collection video_lessons, doc id = videoId). No GPU / WhisperX / benepar needed.
  Trigger on: "xử lý video", "tạo nhịp cho video", "thêm bài video", "cập nhật nhịp đọc",
  "làm bài ReadFlow", "process this YouTube video", or when the user gives a YouTube URL
  to turn into a reading-rhythm lesson.
---

# YouTube → ReadFlow rhythm lesson

Goal: given a YouTube URL, produce a video lesson whose `/` and `//` marks reproduce
the speaker's **real spoken phrasing** (for shadowing practice), and publish it so the
student can open it on the web.

The engine is `scripts/rhythm-from-captions.mjs`. It is audio-faithful: it measures the
silence after each word from caption word-timing (which is aligned to the real audio),
subtracts the word's own spoken duration, and grades the silence into `/` (short pause)
or `//` (long pause). Default density is `moderate` — tuned for Vietnamese beginners
(keeps real phrasing pauses, drops the speaker's word-by-word micro-emphasis).

## Steps

Run everything from the repo root `D:\co-yen-learns-english`.

1. **Generate (dry run).** Pick the grade (default 6) and a short topic:
   ```powershell
   node scripts/rhythm-from-captions.mjs "<YOUTUBE_URL>" --grade <3-10> --topic "<topic>" --out "tmp-lesson.json"
   ```
   Options: `--density moderate|faithful|sparse` (default `moderate`). `faithful` = more
   marks, very close to the speaker; `sparse` = only the longest pauses.

2. **Preview & sanity-check.** Read `tmp-lesson.json` and render each line's chunks with
   its `/` // marks. Confirm: chunk `start`/`end` are monotonic and within the line; no
   tight unit is split oddly; pause density looks right for the grade. Show the user a few
   marked sentences. If density is off, re-run step 1 with a different `--density`.

2b. **Add Vietnamese translation (`vi`).** The student UI shows a Vietnamese line under the
   English in the control box (and it is searchable in Review). Claude translates each
   line into natural, kid-friendly Vietnamese and writes it to `line.vi` for every line in
   the lesson JSON (the script does not generate `vi`). Translate the *meaning* per sentence,
   not word-for-word. Lines with no `vi` simply show no translation.

3. **Publish.** Two ways — prefer whichever has credentials available:

   **(a) No service account (recommended, uses admin browser login):** keep the `--out`
   JSON from step 1 and tell the user to open `/admin/video-lessons`, click
   **"Nhập JSON nhịp (từ skill)"**, and select the file. This writes via the admin's own
   Firebase auth (`importVideoLesson` in `src/lib/videoLessons.ts`) — no service account
   needed.

   **(b) Fully automated (`--write`):** needs `firebase-admin` (`npm i firebase-admin`,
   already installed) and Firebase Admin credentials via `GOOGLE_APPLICATION_CREDENTIALS=`
   `<path-to-serviceAccount.json>` or `FIREBASE_SERVICE_ACCOUNT_JSON=<json>` (project
   `english-class-28f06`):
   ```powershell
   node scripts/rhythm-from-captions.mjs "<YOUTUBE_URL>" --grade <N> --topic "<topic>" --write
   ```
   Both upsert `video_lessons/<videoId>`.

4. **Done.** The student can open the lesson at `/video-lessons/<videoId>`. `rhythmSource`
   is `caption-audio-v1`, which the frontend treats as trusted + latest, so it renders and
   is NOT auto-overwritten.

## Flags

`--grade N` `--topic "..."` `--title "..."` (yt-dlp's title is flaky for some videos — pass it)
`--density moderate|faithful|sparse` `--out file.json` `--write` `--source <label>`
`--captions-dir DIR` (use pre-fetched json3 caption files instead of calling yt-dlp)
`--transcript-file FILE` (supply a punctuated transcript for auto-only videos — see below)

The skill auto-picks the **most-punctuated** caption track for the TEXT and the
**word-timed** (auto) track for TIMING, then aligns text→timing. So it tolerates a manual
track whose own sentence timing is broken (some are squeezed into a few seconds).

## Auto-only videos (no manual captions)

Some videos (e.g. many Little Fox episodes) have ONLY auto-captions: lowercase, no
punctuation, `[Music]` markers. Those make poor reading lessons. Fix:
1. Dump the auto words (the script's word track), then **Claude restores punctuation +
   capitalization + sentence breaks**, KEEPING the same words in order (fix only obvious
   ASR slips). Write it to a `.transcript.txt` file.
2. Run with `--transcript-file <that file>` (+ `--captions-dir` if pre-fetched). The
   transcript becomes the text; timing still comes from the auto word track.

## Whole playlists (batch)

1. Enumerate: `yt-dlp --flat-playlist --print "%(id)s ::: %(title)s" "<playlist-url>"`.
   Compilations usually duplicate the individual episodes — ask the user which to take.
2. Fetch ALL captions once into a dir, **throttled** to avoid HTTP 429
   (`--sleep-requests 5 --sleep-subtitles 3 --retries 12 --retry-sleep "http:25"
   --write-auto-subs --write-subs --sub-langs "en.*" --sub-format json3 --write-info-json`).
3. Run a Workflow with one agent per video — each restores punctuation (auto videos),
   runs the skill with `--captions-dir`, and translates to `vi`. Then merge `vi` into each
   lesson JSON and publish them all via the admin "Nhập JSON nhịp" (or `importVideoLesson`).

## Important notes

- This caption-audio skill is the **only** rhythm engine. The old server-side extractor
  (WhisperX/benepar) + worker transcript path + the admin "Tạo bài from URL" / "Tạo lại nhịp"
  buttons were removed (cleanup 2026-06-18). To change a lesson's rhythm, re-run this skill
  and re-publish; the admin Review screen still allows manual `/`//` tweaks.
- The frontend already trusts `caption-audio-v1` and is deployed — published lessons render
  with no further deploy.
- **yt-dlp** must be on PATH. The script uses player clients `tv,mweb,web` and ignores
  DRM/format errors so captions download even when the media is DRM-protected.
- Lessons are static data — each video is processed **once**. To change density or fix a
  line, re-run and `--write` again (it upserts by videoId).
- Data model: see `src/lib/videoLessons.ts` (`VideoLesson` / `VideoLessonRhythmChunk`).
