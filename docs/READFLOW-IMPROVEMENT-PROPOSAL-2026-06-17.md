# ReadFlow — Đề xuất cải tiến chất lượng ngắt nhịp

> 📌 **CẬP NHẬT (2026-06-18) — engine đã chốt.** Hướng cuối cùng KHÔNG phải syntax-first trên server. Engine hiện hành = **audio-faithful**, bám pause thật của speaker từ caption word-timing: `scripts/rhythm-from-captions.mjs` (rhythmSource `caption-audio-v1`), publish qua admin "Nhập JSON nhịp". Toàn bộ `services/transcript-extractor/server.mjs` + `syntax-boundaries.py` + worker transcript path đã bị **gỡ bỏ** trong đợt dọn dẹp — nên mọi citation `server.mjs:*` / §8–§9 dưới đây là **tư liệu lịch sử** về pipeline cũ, không còn trong code.

Ngày tạo: 2026-06-17
Tác giả: Claude (review độc lập, đa-góc-nhìn + verify trực tiếp trong code)
Đọc kèm: [READFLOW-CURRENT-SYSTEM-REPORT-2026-06-17.md](./READFLOW-CURRENT-SYSTEM-REPORT-2026-06-17.md) (mô tả hệ thống hiện tại)

> Mục tiêu tài liệu: lý do "ngắt nhịp không chuẩn" + kế hoạch sửa **dạng checklist để theo dõi tiến độ**.
> Mọi citation `file:line` đã đối chiếu trực tiếp trong code (commit hiện tại), không lấy từ mô tả.

---

## 0. TL;DR

- **Nguyên nhân gốc:** chunker để **audio (chỗ người nói trong video dừng) làm dao cắt chính**, còn cây cú pháp benepar gần như chỉ làm *phủ quyết / dự phòng*. Nhịp thở của một YouTuber ≠ sense-group lý tưởng để **dạy đọc**. → `server.mjs:704-712`.
- **Đòn bẩy cao nhất:** đảo kiến trúc → **cú pháp quyết định phân hoạch, audio chỉ xác nhận**; chia theo **âm tiết** (không phải số từ), **scale theo grade**. Một mình thay đổi này sửa lỗi kiểu `able to / infect` và **xóa được** list cứng ~90 từ + lớp repair ở frontend.
- **Bối cảnh deployment đã kiểm chứng:** extractor (WhisperX + parser) **chạy local trên máy GPU**, không deploy đám mây (OPERATIONS.md không nhắc tới; Worker không chạy CUDA). ⇒ **Dockerfile chưa cài parser không phải lỗi đang cắn bạn** (chỉ cắn nếu sau này bạn container hoá extractor). Hạ xuống P3.
- **Việc nên làm trước (1 dòng):** vá cổng `tokenCount` (`server.mjs:629`) + sửa `/`-vs-`//` theo cú pháp + làm DP an toàn → rồi mới đảo kiến trúc (P1) → rồi dựng gold-set để đo "chuẩn hơn bao nhiêu" (P2).

---

## 1. Chẩn đoán gốc

### 1.1 Nguyên nhân gốc — đảo ngược ưu tiên (audio-first)

`groupTimedTokensForProsody` (`server.mjs:699-722`):

```js
if (hasUsableAudioEnergy(energy)) {                  // 704 — gần như LUÔN true (chỉ cần decode được audio)
  const audioGroups = groupWordsByAudioPauses(...)   // 705 — chỗ speaker dừng = dao cắt
  const phraseBalanced = splitLongAudioGroups(...)    // 706 — chia thêm CHỈ theo số từ (>6)
  if (phraseBalanced.length > 1) return phraseBalanced; // 707-709 — return luôn, KHÔNG đụng tới syntax
}
const boundaries = selectProsodyBoundaries(...)       // 712 — cây benepar chỉ là FALLBACK
```

- `analyzeAudioEnergy` luôn chạy (`server.mjs:111`); `hasUsableAudioEnergy` chỉ kiểm tra "có frame + frameSeconds hữu hạn" (`server.mjs:725-727`) → nhánh audio-first **luôn bắn** với mọi video.
- Ranh giới = nơi người nói ngừng ≥ `AUDIO_MIN_PAUSE_SECONDS` 0.18s + có dip dB (`groupWordsByAudioPauses` `server.mjs:1331`, `hasAudioPauseBetween` `:1351`).
- Cây benepar (`syntax-boundaries.py:76-143`) chỉ dùng làm **VETO** (`isProtectedTokenBoundary` `server.mjs:1062,1340`) và **FALLBACK** (`selectProsodyBoundaries` `:712`) — **không bao giờ tự ĐỀ XUẤT** ranh giới trên đường đi phổ biến.

→ Thought group là thuộc tính của **ngữ pháp + nghĩa**, không phải hơi thở một người. Công cụ dạy đọc phải hiển thị cách ngắt **lý tưởng, tái lập được, không phụ thuộc người nói**.

### 1.2 Nguyên nhân phụ (đã verify)

| # | Vấn đề | Bằng chứng | Hệ quả |
|---|--------|-----------|--------|
| A | **Cổng `tokenCount` âm thầm vứt syntax profile** — tokenizer server (normalized) lệch tokenizer Python (raw `\S+`) | `server.mjs:629` vs `tokenizeForChunks :1458` vs `syntax-boundaries.py:13-17` | Nhiều dòng rơi về audio + Set **kể cả khi chạy local**, không có cảnh báo |
| B | **Patch `able to/infect` bằng list cứng ~90 từ** chỉ để *chặn* audio cắt sai | `INFINITIVE_LEFT_TRIGGERS` `server.mjs:1121+`, `isProtectedToInfinitiveBoundary :1081` | Bỏ sót "manage/struggle/threaten to…"; không scale; trùng lặp ở 3 nơi (server + 2 chỗ frontend) |
| C | **2 codepath cắt khác nhau** (audio greedy vs DP length+syntax) | `server.mjs:705` vs `:712` | Style nhịp lật qua lại tùy video → cảm giác "không nhất quán" |
| D | **Đo chunk bằng SỐ TỪ (target 4.2), không phải âm tiết** | `chunkLengthScore :884`, `splitLongAudioGroups :766` (>6 từ), `maxChunkWords :832` | Nhịp tiếng Anh stress-timed → sai đơn vị; chunk 4 từ dài ≠ 4 từ ngắn |
| E | **`/` vs `//` quyết định theo độ dài NGỪNG (ms), không theo độ sâu cú pháp** | `buildBoundaryAfter :998-1001` | Cùng câu, 2 người đọc → ký hiệu khác |
| F | **Trọng số dấu câu ngược:** `,;:`=+7 **lớn hơn** `.?!`=+6 | `scoreProsodyBoundary :905-906` | Phẩy "nặng" hơn chấm — sai cho việc phân biệt minor/major |
| G | **DP có thể trả 0 ranh giới** (câu dài không có phân hoạch khả thi) | `selectProsodyBoundaries :880` `return []`; `maxGroups` cap 5 `:834` | Dòng dài hiển thị **không có vạch nhịp** nào |
| H | **`grade` không bao giờ tới chunker** | Endpoint nhận `{url}` `index.ts:184`; client gửi `{url}` `videoLessons.ts:87`; `applyProsodyRhythm :618` không có tham số grade | Lớp 3 và lớp 10 nhận cùng độ mịn |
| I | **`mergeTinyProsodyGroups` merge xuyên ranh giới mạnh** (chạy trước khi tính `boundaryAfter`) | `:798-815, 817-828`, gọi tại `:633` trước `:968` | Fragment cuối mệnh đề có thể bị dán sang mệnh đề sau qua một `//` |
| J | **Alignment caption↔WhisperX map theo index/tỉ lệ** khi số token lệch | `buildTimedTokens :648-650` | Timing lệch → audio gap "bịa" ranh giới (đã ghi ở report 13.10) |
| K | **(LATENT) Dockerfile không cài spacy/benepar, không copy parser** | `Dockerfile:5,11` | CHỈ cắn nếu container hoá extractor; **hiện không trong đường chạy** (chạy local) |

---

## 2. Thay đổi đòn bẩy cao nhất

**Đảo kiến trúc: cú pháp QUYẾT ĐỊNH phân hoạch, audio chỉ XÁC NHẬN.**
Thay nhánh audio-first (`server.mjs:704-710`) bằng **tree-partition đệ quy top-down** trên cây benepar, chia tới **target âm tiết (~7, scale theo grade)**, không cắt trong cụm "tight". Audio chỉ còn: (a) tăng `confidence` khi ranh giới cú pháp trùng pause thật; (b) nâng `/`→`//` khi có pause dài thật.

> **Không bỏ audio.** Pause dài + dip dB vẫn là tín hiệu đáng tin để **nâng minor→major** và **calibrate confidence**. Vai trò hạ từ "dao cắt chính" → "confirmer + tie-breaker".

### Before / After — ví dụ "able to / infect"

Câu: *"This is how it is able to infect the tiny bacterium and the cells in our bodies"* (16 từ).

```
BEFORE:  This is how / it is able to / infect the tiny bacterium / and the cells / in our bodies
AFTER:   This is // how it is able to infect / the tiny bacterium and the cells / in our bodies
(Lớp 3-5, thô hơn):  This is // how it is able to infect / the tiny bacterium and the cells in our bodies
```

- `//` sau *This is* = ranh giới mệnh đề chính trước wh-clause nhúng.
- `/` sau *infect* = edge giữa VP head và object NP dài; `/` trước *in our bodies* = PP edge.
- `able to infect` **nguyên vẹn** vì đến từ cấu trúc VP — **không cần list**.

→ Sau khi P1 live + backfill, có thể **xóa** `INFINITIVE_LEFT_TRIGGERS` (`server.mjs:1121+`), `isProtectedToInfinitiveBoundary`, `repairProtectedStoredRhythmChunks` + `RHYTHM_TO_LEFT_TRIGGERS` ở frontend (`VideoLessonPage.tsx:606-657, 753+`).

---

## 3. Kế hoạch ưu tiên (checklist)

> Ưu tiên đã **điều chỉnh theo deployment thực tế** (chạy local, parser CÓ chạy). Effort: S/M/L.

### P0 — Quick-win: chặn rò rỉ + sửa lỗi nhỏ rủi ro thấp (làm ngay)

- [ ] **P0.1 — Vá cổng `tokenCount`** (S · `server.mjs:629`, `syntax-boundaries.py:13-17`)
      Cho server + Python tokenize **cùng chuỗi normalized** (gửi `normalizeCaptionText(line.text)` xuống Python, hoặc map theo `core` thay vì so `tokenCount === length` cứng). Tối thiểu: **log mỗi lần drop** để đo tỉ lệ thật.
- [ ] **P0.2 — `/` vs `//` theo độ sâu cú pháp, không theo ms** (S · `server.mjs:998-1001`)
      `//` khi kết câu `[.!?]` HOẶC edge mệnh đề S/SBAR (`syntax-boundaries.py:88` cho breakScore 3.2); `/` cho edge cụm. `pauseMs`/`audioDipScore` chỉ chỉnh `confidence` và được phép **promote** `/`→`//`, không tự quyết `type`.
- [ ] **P0.3 — Sửa trọng số dấu câu ngược** (S · `server.mjs:905-906`)
      Đổi `.?!`=+7 (force major), `,;:`=+5.
- [ ] **P0.4 — Làm `selectProsodyBoundaries` feasibility-safe** (M · `server.mjs:830-882`)
      `maxGroups = ceil(count/minChunkWords)` (bỏ cap 5 `:834`); base case mềm (`:846` phạt nặng thay vì `null`); giảm `splitPenalty` (`:874`); log khi `best===null` (`:880`). Tránh dòng dài không có vạch nhịp.

### P1 — Đảo kiến trúc (đòn bẩy chính)

- [ ] **P1.1 — Gộp 2 codepath → tree-partition theo âm tiết** (L · `server.mjs:699-722, 762-792, 884-890`)
      Xóa nhánh audio-first `:704-710`. Luôn chạy partition do cú pháp dẫn (xem §4.1–4.2). Đổi đơn vị độ dài: **âm tiết** thay vì từ.
- [ ] **P1.2 — Trả forest constituent từ Python** (M · `syntax-boundaries.py:76-143`)
      Xuất span `{start,end,label,depth}` per-sentence (giữ DEPTH) thay vì scalar breakScore per-gap (hiện `apply_constituency` làm mất depth).
- [ ] **P1.3 — Thread `grade` end-to-end + target theo grade** (S→M · `index.ts:184`, `videoLessons.ts:80-91`, `server.mjs:618`)
      Lớp 3-5: ~9-11 âm tiết, chỉ cắt clause/coordinate edge. Lớp 8-10: ~6-7 âm tiết, cho phép PP/NP edge. Một float `granularity(0..1)` là đủ.
- [ ] **P1.4 — Sửa alignment caption↔WhisperX + emit `alignmentConfidence`** (L · `server.mjs:638-661`)
      Thay map index/tỉ lệ bằng `SequenceMatcher`/Needleman-Wunsch trên normalized cores; chỉ tin timing cặp 1:1; gate audio khi conf < 0.6. Tận dụng `word.score` WhisperX (`:185`). Cân nhắc nâng `AUDIO_MIN_PAUSE_SECONDS` 0.18→~0.25-0.30 (`:21`).
      → **Không** đổi WhisperX sang MFA/NeMo — large-v3 đủ; nhiễu đến từ map tự chế.

### P2 — Đo lường + dọn nợ kỹ thuật

- [ ] **P2.1 — Dựng gold set + harness eval** (M · `scripts/evaluate-rhythm-engines.mjs:81-140` + tạo `scripts/score-rhythm-against-gold.mjs`) — chi tiết §5.
- [ ] **P2.2 — Xóa list cứng + frontend repair, hợp nhất scoring** (M · `server.mjs:892-925, 1081-1085, 1121+`, `VideoLessonPage.tsx:606-657, 753+`)
      Sau khi P1 live + backfill: xóa `INFINITIVE_LEFT_TRIGGERS`, `isProtectedToInfinitiveBoundary`, `repairProtectedStoredRhythmChunks`, `RHYTHM_TO_LEFT_TRIGGERS`. Gate các Set heuristic sau `if (!syntaxProfile)`. Gộp `gap` (`:909`) + `audioDipScore` (`:910-912`) thành 1 term silence (hiện cộng 2 lần cùng 1 khoảng lặng).
- [ ] **P2.3 — Sửa `mergeTinyProsodyGroups`** (M · `server.mjs:798-828, 956-970`)
      Truyền boundaryScore vào merge; chỉ merge tiny group qua ranh giới YẾU; đặc cách `and/but/so` đầu mệnh đề là break-before.
- [ ] **P2.4 — Cache + version key** (M · `server.mjs:47-145`, `videoLessons.ts:121-131`)
      Cache word-timings theo `{videoId, whisperxModel}`; cache parse theo `sha256(normalized text) + {spacyModel, beneparModel, scriptHash}`. `rhythmSource` thành object có version; `trustedRhythmSource` gate theo `algorithmVersion>=N` thay vì allowlist 4 chuỗi cứng.

### P3 — Nâng cấp tuỳ chọn (sau khi có gold set)

- [ ] **P3.1 — LLM-phraser sau cờ `LLM_PHRASER_ENABLED`** (M · dùng `GEMINI_API_KEY` đã có `index.ts:196`) — chỉ gọi cho dòng "parse & audio bất đồng", temperature 0 + cache theo câu, validate token, fallback DP. Xem §4.3.
- [ ] **P3.2 — ML-distill** — dùng LLM mint silver set + giáo viên sửa ~300-500 dòng → fit weights `scoreProsodyBoundary`. Chỉ làm nếu eval cho thấy tree-partition còn hổng.
- [ ] **P3.3 — (CHỈ khi container hoá extractor) Sửa Dockerfile** (S · `Dockerfile:5,11`) — cài `spacy benepar`, download model lúc build, `COPY syntax-boundaries.py`, startup assertion fail-loud. **Hiện chưa cần** vì extractor chạy local.

---

## 4. Thiết kế kỹ thuật

### 4.1 Hàm grouping hợp nhất (ưu tiên tín hiệu)

Thay `groupTimedTokensForProsody` (`server.mjs:699`):

```
function groupForProsody(line, tokens, energy, syntaxProfile, grade):
  if syntaxProfile exists:
     groups = treePartition(rootSpan, tokens, grade)   // PRIMARY (§4.2)
  else:
     groups = chinksAndChunksFallback(tokens)          // no-parse fallback (function vs content word)
  for each boundary b between groups:                   // audio CHỈ trang trí
     b.pauseMs    = gap(tokens around b)
     b.confidence = calibratedLogistic(syntaxScore(b), b.pauseMs, alignmentConfidence)
     if b.type==minor and b.pauseMs>=600 and isClauseEdge(b): b.type = major   // promote only
  return groups
```

**Thứ tự ưu tiên tín hiệu (cứng):**
1. Dấu kết câu `[.!?]` → **forced major**.
2. Edge mệnh đề S/SBAR (depth thấp) → **major break**.
3. Edge coordinate-item / PP / relative / subject|predicate (khi subject dài) → **minor break**.
4. Cân bằng âm tiết về target (grade-scaled).
5. Audio silence → **chỉ tie-breaker + promote `/`→`//`**.
6. Set từ vựng hardcode → **chỉ khi không có parse**.

### 4.2 Tree-partition (đệ quy top-down)

```
function partition(span, tokens, grade):
  syl = syllables(tokens[span])
  TARGET = gradeTarget(grade)               // 9-11 (lớp 3-5) … 6-7 (lớp 8-10)
  if syl <= TARGET or span.len < 2*MIN_WORDS: return [span]      // atomic
  cands = directChildrenRightEdges(span)    // chỉ edge của CON TRỰC TIẾP
  best = argmax over b in cands of:
         rank(b)                            // clause(S/SBAR)=3 > VP/PP attach=2 > NP-internal=1
       - imbalancePenalty(|leftSyl-rightSyl|)
       - protectedPenalty(b)                // ∞ nếu b nằm trong TIGHT span len<=6
  if best is None: return [span]
  return partition(left(best)) ++ partition(right(best))
```

- `major` khi split ở S/SBAR depth ≤ 1; `minor` còn lại → major/minor "free" từ độ sâu cây.
- `syllables()`: heuristic đếm cụm nguyên âm/token (JS, rẻ) hoặc `cmudict` ARPABET (Python sidecar). Floor 2 content word để function word không đứng lẻ.
- Vật liệu có sẵn: `CLAUSE_LABELS/PHRASE_LABELS/TIGHT_LABELS` (`syntax-boundaries.py:68-70`).

### 4.3 LLM-phraser (P3 — schema + determinism + fallback)

```
INPUT  = { promptVersion, grade,
           tokens:[{i,text}],                          // tokenize bằng CHÍNH tokenizeForChunks
           benepar:[{afterIndex,breakScore,noBreakScore,label}] }   // HINT, không phải lệnh
OUTPUT = { boundaries:[{afterIndex:int, type:'minor'|'major'}], engineVersion }
```

- **Determinism:** temperature=0, top_p=0; `cacheKey = sha1(normalizedSentence|grade|promptVersion)`; batch toàn bộ dòng của 1 lesson trong 1 request.
- **Guardrail (bắt buộc):** reject nếu re-join token ≠ input multiset, `afterIndex` ngoài range, JSON sai → **fallback `selectProsodyBoundaries`**.
- **Composition:** LLM sở hữu vị trí + minor/major; audio chỉ set `pauseMs` + promote `/`→`//`. Thêm `'llm'` vào enum `sources` (`videoLessons.ts:36`); `rhythmSource='whisperx-llm-v3'` + thêm vào `trustedRhythmSource`.
- **Task framing:** *"Chèn `/` (ranh giới sense-group nhỏ) và `//` (ranh giới mệnh đề/câu) GIỮA các token cho sẵn; KHÔNG thêm/bớt/đổi/sắp xếp lại token nào."*

---

## 5. Đo lường chất lượng

**Gold set:** 5-10 video phủ lớp 3-10 (~300-600 dòng). Sửa `renderTeacherReviewTemplate` (`evaluate-rhythm-engines.mjs:132-140`) xuất **1 dòng/câu** (hiện 1 dòng/engine rỗng) với cột `goldBoundaries` giáo viên điền dạng `2:/,5://`. Lưu gold JSON theo `lineId`.

**Metrics — `scripts/score-rhythm-against-gold.mjs` (mới):**
1. **Boundary F1** với tolerance 0 (chính xác gap) VÀ ±1 token (near-miss) — báo cả hai.
2. **Major-vs-minor accuracy** trên ranh giới cả hai bên cùng công nhận.
3. **Tight-unit violation rate** = % ranh giới máy rơi VÀO trong unit benepar đánh tight (bắt đúng họ lỗi `able to/infect` **không cần list**).
4. **Missed-clause-boundary rate** = % `//` gold bị máy bỏ sót (bắt cảm giác "câu lê thê, không ngắt").
5. **Edits-per-100-words** (add/remove/change) = metric sản phẩm headline.

**Calibrate confidence:** bucket ranh giới theo confidence (`server.mjs:1003-1015` hiện là hằng số tay) → reliability curve → isotonic/Platt để `confidence == P(correct)`. Chọn ngưỡng review (vd auto-publish khi P≥0.9, còn lại vào hàng đợi admin). Biến "không chuẩn" chủ quan → SLA review đo được.

---

## 6. Trả lời câu hỏi mở (report §14 + §16)

### §14 — 10 quyết định

1. **Giữ WhisperX+ffmpeg+benepar làm default?** Giữ bộ tín hiệu nhưng **đảo vai trò**: syntax-first, audio = confirmer (§2).
2. **Bỏ ffmpeg engine?** Giữ `RHYTHM_ENGINE=ffmpeg` cho máy không GPU (fallback hợp lệ), nhưng cả hai engine phải đi qua tree-partition chung.
3. **Tune heuristic hay ML?** Tree-partition (deterministic) trước; LLM cho ca khó (P3.1); ML-distill sau cùng (P3.2).
4. **`boundaryAfter` đủ chưa?** Thêm `alignmentConfidence`, `syntaxLabels`, `machineVersion`/`algorithmVersion`; `reviewStatus` khi tách draft/publish. `wordStart/EndIndex` hữu ích cho debug alignment.
5. **Review bắt buộc trước publish?** Không bắt buộc toàn bộ: **auto-publish khi confidence calibrated ≥ ngưỡng**, dưới ngưỡng vào hàng đợi review (§5).
6. **Tách machine vs teacher output?** Có — cần để đo chất lượng thuật toán lâu dài (lưu `machineRhythmChunks` + `reviewedRhythmChunks`).
7. **Sync hay async job?** Vì chạy **local/offline batch** (`build_youtube_rhythm.mjs`) là chính → sync hiện đủ. Chỉ cần async nếu sau này admin tạo bài realtime trên prod qua extractor public.
8. **MFA/NeMo thay WhisperX?** Không cần. large-v3 đủ; sửa map alignment tự chế (P1.4).
9. **Long video?** Pipeline đã xử lý theo từng line nên độ dài video không phải vấn đề chunking; nếu lo GPU/timeout cho batch lớn → cache (P2.4) + chạy offline.
10. **UI hiện confidence?** Dùng nội bộ (admin review) trước; chỉ lộ cho học sinh nếu có ích sư phạm.

### §16 — 7 câu kỹ thuật

1. **Lỗi logic scoring lớn?** Có: audio-first (§1.1), trọng số dấu câu ngược (F), DP trả 0 ranh giới (G), double-count silence (P2.2), merge xuyên ranh giới (I). Tín hiệu nên thêm: **độ sâu cú pháp** + **âm tiết** + **grade**.
2. **spaCy+benepar phù hợp?** Phù hợp về chất lượng nhưng `benepar_en3_large` nặng/cold-start chậm — cân nhắc `benepar_en3` base, hoặc dependency thuần (`apply_dependency` đã có sẵn nhiều tín hiệu). Aligner: WhisperX đủ.
3. **`boundaryAfter`/`rhythmChunks` scale được?** Đủ cho hiển thị; cần thêm version + alignmentConfidence (câu 4 §14) để A/B + truy vết.
4. **Auto-publish hợp lý?** Hợp lý **có điều kiện** confidence đã calibrate; dưới ngưỡng mới review (§5).
5. **Sync→async?** Chưa cần (chạy local batch). Xem §14.7.
6. **Cách đo lỗi/100 từ đủ chưa?** Chưa — bổ sung tight-unit-violation + missed-clause + boundary F1 có dung sai + major/minor accuracy (§5).
7. **3 việc sửa ngay trước production?** (1) **P1.1** đảo kiến trúc tree-partition; (2) **P0.1** vá cổng tokenCount; (3) **P2.1** gold-set eval để biết "chuẩn hơn bao nhiêu". (Thêm P3.3 Dockerfile **chỉ nếu** container hoá extractor.)

---

## 7. Phụ lục — file cần đụng

| File | Hạng mục |
|------|----------|
| `services/transcript-extractor/server.mjs` | P0.1-0.4, P1.1/1.3/1.4, P2.2/2.3/2.4 |
| `services/transcript-extractor/syntax-boundaries.py` | P0.1, P1.2 |
| `workers/content-importer/src/index.ts` | P1.3, P3.1 |
| `src/lib/videoLessons.ts` | P1.3, P2.4, P3.1 |
| `src/pages/VideoLessonPage.tsx` | P2.2 (xóa repair hack) |
| `scripts/evaluate-rhythm-engines.mjs` + (mới) `scripts/score-rhythm-against-gold.mjs` | P2.1 |
| `services/transcript-extractor/Dockerfile` | P3.3 (chỉ khi container hoá) |

> Theo quy ước docs-sync của repo: khi xoá `INFINITIVE_LEFT_TRIGGERS`/repair hack hay đổi data contract, **cập nhật cùng commit** [READFLOW-CURRENT-SYSTEM-REPORT-2026-06-17.md](./READFLOW-CURRENT-SYSTEM-REPORT-2026-06-17.md) và grep tên symbol vừa xoá toàn repo.

---

## 8. Kết quả nghiên cứu ngoài (deep-research 17/06) — thuật toán chốt

Sau khi user phản hồi vẫn bị **thiếu ngắt** (vd `You know / that a bacterium is a very tiny organism, right?`), đã chạy deep-research đa nguồn (22 nguồn primary, kiểm chứng chéo 3 phiếu). Phát hiện chính: **có paper làm đúng bài toán này, bằng đúng stack ta có.**

### 8.1 Nguồn trực diện nhất

**Dhamne, Raman, Rao — "Predicting Prosodic Boundaries for Children's Texts", EMNLP 2025** ([aclanthology.org/2025.emnlp-main.1623.pdf](https://aclanthology.org/2025.emnlp-main.1623.pdf)). Dự đoán ranh giới nhịp cho **văn bản đọc của trẻ em**, dùng **spaCy (dependency) + Berkeley Neural Parser (= benepar) constituency depth/label** + feature âm tiết → **LightGBM**. Kết quả: **boundary F1 0.89** (P0.92/R0.85), regression R²0.87. Dữ liệu của paper xác nhận đúng lỗi của ta: **~30% chỗ ngắt của người chấm KHÔNG nằm ở dấu câu** → một mệnh đề dài giữa 2 dấu câu **bắt buộc** phải có ngắt nội bộ.

### 8.2 Bốn nguyên liệu để sửa "thiếu ngắt" (đã kiểm chứng)

1. **Feature ngân sách âm tiết / hơi thở (quan trọng nhất).** Trẻ ngắt mỗi **~5-7 âm tiết** (lớp 3 ~5.5, lớp 7 ~7.1; trung bình 7.0, SD 3.5). Thêm feature "âm tiết kể từ ranh giới gần nhất" + "âm tiết còn lại trong breath-group 7 âm tiết" là cú nhảy accuracy lớn nhất (R² 0.80→0.87). ⇒ **Đếm bằng ÂM TIẾT, không phải số từ.** (nguồn: EMNLP 2025)
2. **Verb Balancing Rule (Gee & Grosjean → Bachenko & Fitzpatrick 1990)** ([aclanthology.org/J90-3003](https://aclanthology.org/J90-3003/)). Trong một cụm dài `[X V Y]`: nếu `count(X)+count(V) < count(Y)` thì gộp `(XV)Y` (ngắt TRƯỚC động từ), ngược lại `X(VY)` (ngắt SAU chủ ngữ). Quy tắc **cố tình cắt qua ranh giới VP/S** để cân bằng độ dài quanh động từ → tạo đúng cái ngắt nội bộ đang thiếu. Hoàn toàn tất định, chỉ là số học trên phonological-word count.
3. **Chink-and-chunk / NP nguyên khối** (Wang & Hirschberg 1991, CART ~90% acc) ([aclanthology.org/P91-1037.pdf](https://aclanthology.org/P91-1037.pdf)). "Ranh giới hầu như không rơi sau function word"; "noun phrase là khối dính chặt". ⇒ Khi buộc cắt trong mệnh đề, giữ NP nguyên, cắt ở biên function-word.
4. **`/` vs `//` = mô hình ĐỘ MẠNH liên tục (0-7), không phải cờ nhị phân.** Dấu kết câu `.?!` → `//` (IP, 100% đồng thuận); dấu phẩy → `/` mềm hơn (chỉ 57% đồng thuận); ngắt trong mệnh đề = bậc yếu nhất. Map: strength cao→`//`, trung bình→`/`, thấp→không ngắt. (nguồn: EMNLP 2025)

Hệ quả cho 3 cơ chế lỗi đã nêu ở §1.2: (A) **bỏ lệnh cấm ngắt trước động từ** — Verb Balancing nói ngắt quanh verb là ĐÚNG cho mệnh đề dài; (B) cho phép **đuôi ngắn** (`right?`, tag/vocative) tách nhịp riêng; (C) **bỏ audio-first** — nghiên cứu xác nhận pause là **speaker-dependent**, không phải gold ([arxiv.org/html/2509.00675](https://arxiv.org/html/2509.00675)).

### 8.3 Sửa đúng ví dụ "You know..."

`You know that a bacterium is a very tiny organism, right?`
- Mệnh đề nhúng "that a bacterium is a very tiny organism" ≈ **15 âm tiết ≫ 7** → buộc chia.
- Verb Balancing quanh `is`: `that a bacterium / is a very tiny organism`.
- `right?` (tag sau phẩy) → nhịp riêng. `You know` (matrix) → `//`.
- ⟹ **`You know // that a bacterium / is a very tiny organism, / right?`** ✅ đúng kỳ vọng.

### 8.4 Lộ trình chốt (thay thế lựa chọn ở §3.P3.1)

| Phase | Nội dung | Tất định | Offline | Cần data train | Effort | Accuracy |
|-------|----------|:---:|:---:|:---:|:---:|----------|
| **A (làm ngay)** | Rule-based: tree-partition theo **ngân sách âm tiết** (target ~7, scale grade) + **Verb Balancing Rule** + chink-and-chunk giữ NP + graded strength cho `/`//` | ✅ | ✅ | Không | M | Khá → tốt; sửa ngay under-segmentation |
| **B (chất lượng cao nhất)** | **LightGBM** theo paper EMNLP 2025: feature lexical + spaCy dep + benepar depth/label + positional + **syllable-budget** | ✅ | ✅ | Có (gold set nhỏ) | L | F1 ~0.89 (in-domain) |
| **C (tuỳ chọn)** | **LLM-phraser** (Gemini/Claude) làm **bootstrap nhãn cho Phase B** hoặc fallback cho dòng low-confidence; temperature 0.0, persona "linguistic expert", "mark pauses … without altering the original text", **validator token-integrity bắt buộc** | ✗ (1-2% fail) | ✗ | — | S | ~người (KHÔNG dùng làm gold) |

**Khuyến nghị:** làm **Phase A ngay** (tất định, offline, sửa đúng lỗi user thấy, không cần data) → dùng **Phase C LLM** để mint nhãn + giáo viên sửa thành gold (~300-500 dòng) → train **Phase B LightGBM** để đạt trần chất lượng. Đây là cập nhật cụ thể cho P1.1 (§3): tree-partition giờ có **2 nguyên liệu mới quan trọng** là *Verb Balancing Rule* và *ngân sách âm tiết*, cùng *graded strength* cho `/`-vs-`//`.

### 8.5 Cảnh báo trung thực (từ nghiên cứu)

- **Domain gap:** mọi số liệu (F1 0.89, ngân sách 5-7 âm tiết, tỉ lệ đồng thuận `/`//`) đến từ **MỘT corpus truyện trẻ em, người chấm là người lớn nói tiếng Anh-Ấn bản ngữ** — **chưa** validate trên trẻ Việt học ESL. Ngân sách ~7 âm tiết là điểm khởi đầu hợp lý, **nên A/B test trên học sinh thật** (ESL có thể cần chunk ngắn/dày hơn).
- **Cần bộ đếm âm tiết** (CMUdict / `pyphen` / `syllapy` ở Python sidecar, hoặc heuristic vowel-cluster ở JS) — đây là dependency mới cho Phase A/B.
- **Phonological vs orthographic word count:** Verb Balancing đếm phonological word (function word dính clitic), không phải từ chính tả thô.
- **Đã bị bác (đừng dựa vào):** (1) LLM nhãn "ngang chất lượng người" — KHÔNG, chỉ để bootstrap; (2) rule "phrase < ½ phrase trước" của Wang-Hirschberg — bị refute; (3) BERT "đoán latent break không dấu câu" — bị refute.
- **Dead-end đã loại** (đỡ tốn công thử): `PL-BERT` (phoneme-level, không đoán break), `bert-prosody` (chỉ prominence), SLP3 ch16 bản 1/2026 (đã viết lại thành neural-TTS, không còn phần text-analysis).

---

## 9. Phase A — ĐÃ TRIỂN KHAI (17/06)

> Bối cảnh: khi bắt tay, codex đã làm trước một phần lớn (syntax-first đã thay audio-first ở `groupTimedTokensForProsody`; đã có `estimateSyllables`, `targetSyllablesForGrade`, `chunkShapeScore`, thread `grade`, LCS alignment + `alignmentConfidence`, Python xuất `spans`+`depth`, `rhythmSource=*-syntax-v4`). NHƯNG vẫn under-segment vì 3 lỗi còn lại đã được sửa dưới đây.

### 9.1 Ba thay đổi đã làm (verify offline, không cần GPU)

1. **Verb-balancing over-budget splitter** (`server.mjs`, mới: `splitOverBudgetGroups` / `splitGroupToBudget` / `bestBalancedSplit` / `seamBonusForSplit` / `isHardTightGap`, gọi trong `groupTimedTokensForProsody`). Bất kỳ cụm nào vượt ngân sách âm tiết (`targetSyllablesForGrade + OVER_BUDGET_MARGIN`) bị **buộc chia** tại seam tốt nhất, *đảo* tight-veto cho seam thật (subject|predicate +7, copula-complement +4.5, clause edge +6, coordination +4) nhưng **vẫn bảo vệ cứng** det+noun / prep+object / to+infinitive (`isHardTightGap`, noBreak ≥ `HARD_TIGHT_NOBREAK` 6.8). Chỉ chia khi seam đủ tốt (`MIN_SPLIT_SCORE` 0.5) — nếu không thì để cụm hơi dài còn hơn cắt bậy. → Sửa gốc lỗi "câu dài không nghỉ".
2. **DP break-cost** (`server.mjs:selectProsodyBoundaries`): mỗi vạch cắt phải "tự trả phí" `DP_BREAK_COST` (2.5) mới được đặt; bỏ `splitPenalty` cũ. → DP chỉ cắt ở seam thật (mệnh đề, phẩy, "and"), hết kiểu cắt verb→object yếu ("gives / us light", "make / you sick"). Cụm dài thật để `splitOverBudgetGroups` lo.
3. **`to`+infinitive là tight** (`syntax-boundaries.py:134-136`): đổi rule TO+VB từ `breakScore 3.0` → `noBreakScore 4.0`. → "to infect" không bị tách ("able to infect" giữ nguyên), vạch ngắt nếu cần rơi TRƯỚC "to".

Phụ trợ: thêm guard `isMainModule` ở cuối `server.mjs` (import không khởi động server) + export `segmentLineForTest` để test text-only. Thêm `rhythm-smoketest.mjs` (chạy parser + segmenter trên 7 câu mẫu, `node rhythm-smoketest.mjs [grade]`).

Tham số tinh chỉnh được qua env: `RHYTHM_OVER_BUDGET_MARGIN`, `RHYTHM_HARD_TIGHT_NOBREAK`, `RHYTHM_DP_BREAK_COST`, `RHYTHM_MIN_SPLIT_SCORE`.

### 9.2 Kết quả verify (grade 6, text-only)

| Câu | Trước | Sau |
|-----|-------|-----|
| You know that a bacterium… | `You know / that a bacterium is a very tiny organism, right?` | `You know / that a bacterium / is a very tiny organism, right?` |
| This is how it is able to infect… | `…it is able to / infect…` | `This is how / it is able to infect the tiny bacterium / and the cells in our bodies` |
| When a virus enters your body… | (under-segment) | `When a virus enters your body, // it attacks your healthy cells / and makes copies of itself.` |
| The sun gives us light… | `The sun gives / us light / and heat…` | `The sun gives us light / and heat every single day.` |
| Viruses are everywhere. | — | (không ngắt, đúng) |

### 9.3 Việc còn lại (chưa làm)

- **Re-generate dữ liệu Firestore** để app hiển thị nhịp mới — code mới CHƯA tác động bài đã lưu (xem §9.4).
- **`right?` (tag) chưa tách riêng** khỏi "organism," vì `minChunkWords=2` chặn chunk 1-từ. Chấp nhận được; muốn tách tag/comma-tail thì nới rule cho đuôi ≤1 từ sau dấu phẩy.
- **Dead code**: `splitLongAudioGroups`, `mergeTinyProsodyGroups`, `isTinyProsodyGroup`, `groupWordsByAudioPauses`, `buildRhythmChunksFromWordGroups` giờ không còn được gọi (tàn dư audio-first) — nên xoá (đã tách task riêng).
- **Gold set + metric (§5)**: smoke test chỉ là sanity-check 7 câu, KHÔNG phải gold set. Vẫn cần để đo "chuẩn" định lượng + calibrate confidence.
- **Audio** giờ chỉ còn ảnh hưởng `pauseMs`/confidence (đúng thiết kế) — chưa test với audio thật; ngân sách âm tiết theo grade là điểm khởi đầu, cần A/B trên học sinh thật (ESL ≠ trẻ bản ngữ trong paper).

### 9.4 Cách để thấy thay đổi trong app (QUAN TRỌNG)

Bài học trong Firestore là **dữ liệu tĩnh từ pipeline cũ** — frontend chỉ hiển thị `rhythmChunks` đã lưu. Phải tạo lại nhịp thì mới thấy:
- Admin: mở bài trong `VideoLessonReview`, bấm **"Tạo lại nhịp"** (gọi lại extractor local), rồi **"Lưu review"**.
- Hoặc chạy `build_youtube_rhythm.mjs` với credential Firebase Admin để ghi đè.
- Lưu ý: extractor phải chạy local (có GPU/WhisperX + Python parser); `rhythmSource` mới sẽ là `whisperx-syntax-v4`.
