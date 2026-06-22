# Kế hoạch tinh gọn & thiết kế lại "Học cùng cô Yến"

> Tài liệu duyệt TRƯỚC khi code. Mục tiêu: cắt phình, sửa nút hỏng, làm app đơn giản — đến mức cô Yến tự dùng được mà không lạc.
> Giữ nguyên ngôn ngữ thị giác "Sân trường" (flat + linh vật Gấu·Thỏ·Cà Rốt). Đây là kế hoạch về KIẾN TRÚC THÔNG TIN, PHẠM VI TÍNH NĂNG, LUỒNG — không phải đổi giao diện.

---

## 1. Chẩn đoán — vì sao app rối & phình

- **Hai hệ điều hướng song song không khớp nhau.** Trang chủ `Index.tsx` tự dựng `<nav>` riêng (Bài học/Video/Luyện tập/Tiến trình), còn cả phần app dùng `AppNav.tsx` (Học/Luyện tập/Video/Tiến trình) — khác nhãn, khác thứ tự, khác hành vi logo, khác trạng thái đăng nhập. Mọi lỗi điều hướng bên dưới đều bắt nguồn từ đây.
- **Cùng một đích bị lặp 2–3 lần trên trang chủ.** "Bài học/Video/Luyện tập" mỗi cái xuất hiện 3 lần (nav + thẻ hub + highlight), nút CTA chính lặp 4 lần. 6 section nhưng chỉ trỏ về đúng 4 trang — đó là gốc của cảm giác "quá nhiều mục, không biết bắt đầu từ đâu".
- **`/grade/:id` thực chất chỉ render lớp 10; lớp 3–9 bị đá về `/dashboard`.** Nên "Xem lộ trình"/"Bài học" hoặc rơi vào nội dung lớp 10 (đúng do may rủi), hoặc đổ học sinh ra dashboard. Cả nhánh render lớp 3–9 trong `GradePage` (~60 dòng) + nút phonetics là **code chết** (redirect bắn trước, `data` luôn `null`).
- **Vòng redirect tự bắn của `/grades`** khiến "Chọn lớp khác" thành no-op: học sinh đã có lớp bị đá ngay về `/grade/{lớp}` — đúng trang vừa đứng.
- **Trang chủ mù trạng thái đăng nhập** (không avatar/tên/streak/lớp) và **dashboard không có lối về trang chủ** (logo trỏ về chính dashboard). Người dùng quay lại thấy y như khách mới; vào trong rồi không ra được.
- **Gamification & tính năng phụ chất đống** (pet, leaderboard, camera pose, phonetics heuristic sai, flashcard-match, skill-bar bịa số). Với một cô giáo dạy lẻ vài lớp, đây là gánh nặng bảo trì mà giá trị học tập thấp; nhiều thanh % còn sai lệch (vd "speaking% = vocab%×0.5").

---

## 2. IA tinh gọn

### 2.1. Sơ đồ site sau khi gọn

```
/                       Splash gọn: nhận diện đăng nhập + 1 nút vào học (KHÔNG marketing)
/onboarding             Wizard 2 bước BẮT BUỘC (Tên+Lớp → SĐT phụ huynh) — gate trước mọi nội dung
/home                   Nhà thật của học sinh (đổi tên từ /dashboard): Lộ trình + tiến trình gọn
  ├─ /grade/:id              Hub lớp (lớp 3–9 dùng chung 1 layout; lớp 10 thêm khối Ôn thi)
  │   ├─ /vocab/:unit        Từ vựng (Từ điển + 1 chế độ luyện)
  │   ├─ /grammar/:unit      Ngữ pháp
  │   └─ /exercises/:unit    Bài tập (QuizRunner chung)
  ├─ /grade/10/{vocab,grammar,reading,writing,tests}   (QuizRunner chung, data-driven)
  ├─ /practice               Hub trò chơi & ôn tập (đã trim)
  │   ├─ word-match · listen · sentence-puzzle · srs-review · test/custom
  ├─ /video-lessons          Video shadowing (giữ nguyên — trụ cột)
  │   └─ /:lessonId
  └─ (Tiến trình GỘP vào /home — bỏ /progress riêng)
/admin/*                Khu cô giáo: import · exams · analytics · video-lessons (giữ)
```

4 hub điều hướng GIỮ NGUYÊN nhưng **đồng nhất 1 hệ** (`AppNav` cho cả trang chủ): **Học · Luyện tập · Video · Tiến trình** (Tiến trình mở tab/section trong /home).

### 2.2. Trang chủ `/` — spec tối thiểu

Trang chủ thành **splash mỏng, nhận diện đăng nhập**, KHÔNG còn là mini-site marketing. Section tối thiểu:

| Section | Mục đích |
|---|---|
| **Header dùng `AppNav`** | Một hệ menu duy nhất; nếu đã đăng nhập hiện avatar + tên + lớp + streak; logo về `/`. |
| **Hero 1 dòng + 1 CTA** | Khách: "Bắt đầu học" → `/onboarding`. Đã đăng nhập: "Vào học lớp {N}" → `/home`. Đúng một nút, không lặp. |
| **Linh vật chào** | Gấu·Thỏ·Cà Rốt — giữ nhận diện "Sân trường", thuần trang trí. |

**Cắt khỏi trang chủ:** lưới 4 thẻ hub (trùng nav), lưới 3 highlight (trùng nav), CTA band thứ 2, social proof bịa ("500+ học sinh" + avatar dicebear), `<nav>` tự chế + mảng `navLinks`, 3/4 bản sao của `handleCTA`. Từ 6 section → 3.

### 2.3. Luồng điều hướng (landing → onboarding → lớp → bài)

1. Khách vào `/` → thấy splash → bấm CTA → **`/onboarding`**.
2. Wizard 2 bước (mục 4): nhập Tên + Lớp → SĐT phụ huynh → ghi profile → vào học ngay (OTP hoãn lại).
3. Đổ thẳng về **`/home`** (lộ trình lớp đã chọn). Học sinh quay lại sau: `/` tự nhận đăng nhập, CTA thành "Vào học lớp {N}".
4. Từ `/home` → bấm 1 đơn vị trên Lộ trình → `/grade/{N}/vocab|grammar|exercises/{unit}` (hoặc với lớp 10 là khối Ôn thi). Trò chơi/ôn tập đi qua hub `/practice`.
5. Mọi trang trong app đều có `AppNav` với logo về `/` (khách) hoặc `/home` (đã đăng nhập) — luôn có lối ra.

---

## 3. Giữ / Gộp / Cắt

### GIỮ (lõi, đáng tiền)
| Tính năng | Lý do |
|---|---|
| Grade picker `/grades` | Cổng vào cần thiết; auto-redirect khi đã có lớp. |
| Hub lớp `/grade/:id` (sau khi sửa) | Trục chính dẫn vào bài; lớp 3–9 dùng chung layout, lớp 10 thêm khối Ôn thi. |
| Vocab (Từ điển) / Grammar / Exercises | Nội dung chương trình thật, lõi của app K-12. |
| Lớp 10: vocab/grammar/reading/tests | Ôn thi vào 10 là use-case đầu bảng (kể cả 25 Đề Ninh Bình). |
| Practice hub `/practice` | Một nhà cho game & ôn tập — IA tốt. |
| Word-match · Listen · Sentence-puzzle | Drill nhỏ, gọn, kỹ năng riêng biệt. |
| SRS review | Tính năng duy nhất thật sự giữ ghi nhớ dài hạn. |
| Dynamic/custom test `/test/custom` | Tự kiểm tra + cho cô giáo tín hiệu chẩn đoán. |
| Video lessons + player | Trụ cột đang được đầu tư (rhythm engine). |
| Admin: import · exams · video-lessons · review | Cách cô giáo nạp nội dung & QC — không thể thiếu. |
| 404 | Catch-all chuẩn. |

### GỘP
| Tính năng | Gộp vào | Lý do |
|---|---|---|
| 5 trang quiz lớp 10 (vocab/grammar/reading/writing/tests) | **1 `QuizRunner` data-driven** | Mỗi trang lặp lại setup→quiz→review→result; gộp cắt hàng trăm dòng, không mất gì với học sinh. |
| Listen & Choose Picture | Listen & Choose (1 toggle ảnh) | Gần như trùng, chỉ khác option emoji. |
| Progress page `/progress` | `/home` (1 thẻ tiến trình) | Trùng LearningOverview; thừa 1 hub top-level. |
| Grade 10 Writing | (giữ như nhánh trong reading/runner) | Nội dung đã trùng trong trang Reading; không cần trang đứng riêng undiscoverable. |
| Camera `/grade/:id/camera` + `/practice/camera/:id` | (xem Cắt) | 2 đường trùng 1 component. |

### CẮT
| Tính năng | Lý do |
|---|---|
| **Camera (pose MediaPipe)** | 752 dòng, mong manh nhất: tải wasm/model qua CDN, cần webcam, gimmick trên MCQ thường. Cắt ưu tiên số 1. |
| **Virtual pet `/pet` + PetWidget + tile pet** | 338 dòng gamification thuần, 0 nội dung tiếng Anh. |
| **Phonetics drill `/phonetics`** | Câu hỏi sinh từ heuristic chính tả ngây thơ → đáp án có thể SAI ngôn ngữ học. Rủi ro dạy sai. Cắt tới khi có dữ liệu IPA thật. |
| **Flashcard-match game** | Game trí nhớ vị trí thẻ, không kiểm tra tiếng Anh; trùng word-match + SRS. |
| **Leaderboard widget** | Xếp hạng XP tạo áp lực xã hội trong lớp nhỏ, giá trị học tập thấp. |
| **Review Corner widget** | Điều hướng trùng 100% — mọi đích đã có trong Practice hub. |
| **DashboardHeader** | Code chết: định nghĩa + export nhưng không import ở đâu. |
| **Skill-progress bars + Bell icon (LearningOverview)** | % bịa (speaking%=vocab%×0.5) gây hiểu lầm; Bell không có onClick. |
| **Nhánh render lớp 3–9 trong GradePage + nút phonetics** | Code chết (redirect bắn trước, `data` luôn null). |
| **LearningPath: node "PHẦN THƯỞNG" & "CHÍNH TẢ"** | reward = no-op; spelling trỏ về vocab (SpellingPage đã xóa). |
| Shadowing AI scoring (server) | **Gate/đơn giản hóa**: giữ vòng nghe/ghi/tự so offline; tắt chấm AI server (phụ thuộc Worker + Gemini trả phí, single point of failure) tới khi rõ đáng tiền. |
| Daily mission: multiplier + XP-title | **Đơn giản hóa**: giữ 1 streak + 1 mục tiêu ngày; bỏ lớp multiplier/title. |
| Admin analytics: recharts + papaparse | **Đơn giản hóa**: giữ weakest-units + lịch sử/HS; thay chart bằng bar đơn + CSV để giảm bundle. |

---

## 4. Onboarding bắt buộc

### 4.1. Luồng signup mới (gate trước mọi nội dung)
Wizard **2 bước** (3 trường — không over-engineer thành 3 bước), linh vật ở header mỗi bước, flat:

- **Bước 1 — Làm quen (ma sát thấp):** Tên học sinh (`type=text` `autocomplete=given-name` `autocapitalize=words`) + Lớp (chip/segmented Lớp 3→10, khớp `SUPPORTED_GRADES`). Nút full-width "Tiếp tục".
- **Bước 2 — Kết nối phụ huynh (ma sát cao, đặt sau):** **"Số điện thoại của phụ huynh"** (`type=tel` `inputmode=numeric` `autocomplete=tel`) + helper "Dùng để ba mẹ theo dõi việc học và xác nhận tài khoản. Cô không gửi quảng cáo." + checkbox đồng thuận phụ huynh (đáp ứng Luật BVDLCN VN, hiệu lực 01/01/2026, trẻ ≥7 tuổi cần đồng thuận cha mẹ). Nút "Bắt đầu học".

Quan trọng — **SĐT là của PHỤ HUYNH, không phải học sinh** (hợp pháp + chuẩn VN như vnEdu; trẻ 8–10 chưa có số riêng).

**Cơ chế gate:** thêm `RequireOnboarded` (mô phỏng `RequireAdmin`) bọc mọi route học tập trong `App.tsx`; thiếu `studentName`/`grade`/`phone` → đẩy về `/onboarding`. Mở rộng schema `UserProfile` (`progress.ts`) thêm `studentName: string` + `phone: string`; thêm `completeOnboarding(uid, {studentName, grade, phone})` ghi đè lên `uid` ẩn danh hiện có (giữ nguyên tiến trình).

### 4.2. Xác thực SĐT — khuyến nghị & đánh đổi
**Khuyến nghị v1: OTP HOÃN LẠI (deferred) + chỉ validate định dạng lúc signup.**
- Lúc signup chỉ validate **định dạng VN** (10 số, đầu 0, allowlist đầu số nhà mạng — code `normalizeVnMobile` đã có trong brief). Cho vào học ngay → tối đa conversion học sinh nhỏ (OTP cứng là điểm rớt lớn nhất: bé phải đi mượn điện thoại bố mẹ).
- Chỉ bật OTP thật khi cần hành động "có giá trị": lưu tiến trình dài hạn / đăng nhập thiết bị mới.
- Khi cần OTP: dùng **Firebase Phone Auth + invisible `RecaptchaVerifier`**, `linkWithCredential` lên user ẩn danh để **giữ nguyên tiến trình** (xử lý `auth/credential-already-in-use`). `autocomplete="one-time-code"` để tự điền.

**Đánh đổi:** validate-định-dạng KHÔNG chứng minh quyền sở hữu số → chấp nhận một ít số sai, đổi lấy conversion cao + $0 + không cần thẻ. Nếu cô cần số phụ huynh CHẮC CHẮN đúng, bật OTP ngay từ Bước 2 (giảm conversion).

### 4.3. Cô giáo cần bật / trả gì
- **Nếu chọn v1 (validate định dạng, không OTP): KHÔNG cần bật/trả gì.** Thuần client, $0, không thẻ, không backend mới.
- **Nếu bật OTP (Firebase Phone Auth):**
  1. **Nâng Firebase lên Blaze** (gắn thẻ Google Cloud billing) — bước trả phí bắt buộc duy nhất; quota free **10.000 verify/tháng** ⇒ thực tế **$0 SMS** ở quy mô này.
  2. Authentication → Sign-in method → bật **Phone** (giữ Google + Anonymous).
  3. Authentication → Settings → Authorized domains → thêm **`tienganhcoyen.online`** (+ `www.`). (Lưu ý: localhost KHÔNG test được SMS.)
  4. Khuyến nghị: đặt **budget alert $5** (chống toll-fraud), giới hạn vùng SMS = Việt Nam, giữ invisible reCAPTCHA. (App Check / reCAPTCHA Enterprise — bỏ qua v1.)
  - Không cần mua key; SDK tự quản reCAPTCHA. (VN-native rẻ nhất nếu cần sau này: SpeedSMS OTP — không cần brandname, key để ở Cloudflare Worker secret.)

---

## 5. Sửa lỗi điều hướng (kèm file phải sửa)

| Lỗi | Cách sửa | File |
|---|---|---|
| **"Chọn lớp khác" no-op** | Bỏ redirect tự bắn, hoặc cho bypass `?pick=1`: chỉ redirect khi KHÔNG có cờ "đang chủ động đổi lớp". | `src\pages\GradesPage.tsx:18-22` (redirect); nút gọi ở `src\pages\GradePage.tsx:52` |
| **"Xem lộ trình" → lớp 10** | Trỏ "Xem lộ trình" về `/home` (LearningPath thật) thay vì `/grades`; nếu chưa đăng nhập → `/onboarding`. | `src\pages\Index.tsx:172-177` (+ highlight hardcode `/grade/10` tại `:64`) |
| **"Bài học" → lớp 10** | Sửa `GradePage` để render layout chung cho lớp 3–9 (bỏ redirect về dashboard + xóa nhánh chết), nạp `data` thật qua loader; lớp 10 thêm khối Ôn thi. | `src\pages\GradePage.tsx:13-24` (redirect), `:15` (`data` null), nhánh chết `:169-226` |
| **Không có lối về trang chủ từ dashboard** | Đồng nhất trang chủ dùng `AppNav`; logo về `/` khi khách, `/home` khi đăng nhập — thêm mục/đường về `/` rõ ràng trong chrome. | `src\components\AppNav.tsx:42-49` (logo), `src\pages\DashboardPage.tsx:60` |
| **Trang chủ không hiện trạng thái đăng nhập** | Cho `Index` dùng `AppNav` (xoá `<nav>` tự chế) → tự có avatar/tên/lớp/streak; CTA đổi theo grade. | `src\pages\Index.tsx:70-135` (nav tự chế), `:47-52` (`navLinks`) |

Phụ: bỏ default `grade || 6` (đẩy về `/onboarding` nếu chưa có lớp) — `LearningPath.tsx:29`, `ReviewCorner.tsx:11`, `LearningOverview.tsx:20`, `Leaderboard.tsx:17`. Gỡ 1 trong 2 đường camera trùng (`App.tsx:68-69`) — sẽ thành moot sau khi cắt Camera.

---

## 6. Lộ trình triển khai (mỗi phase deploy & verify độc lập)

> Verify chủ yếu cấu trúc/DOM (QA thị giác hạn chế) ⇒ ưu tiên thay đổi kiểm bằng route/DOM.

- **Phase 0 — Hợp nhất điều hướng (rủi ro thấp, thắng lớn).** Trang chủ dùng `AppNav`; xoá `<nav>` tự chế + `navLinks`; thống nhất logo. *Verify:* DOM trang chủ có cùng `AppNav` như `/home`; logo href đổi theo auth.
- **Phase 1 — Sửa 5 lỗi điều hướng (mục 5).** Bỏ redirect bẫy của `/grades`; sửa `GradePage` render lớp 3–9; trỏ lại "Xem lộ trình". *Verify:* điều hướng tới `/grades` không bị đá; `/grade/6` render nội dung (không redirect về dashboard); "Chọn lớp khác" đổi URL thật.
- **Phase 2 — Cắt bloat (mục 3, nhóm Cắt).** Xoá Camera, Pet, Phonetics, Flashcard-match, Leaderboard, ReviewCorner, DashboardHeader, skill-bars/Bell, node chết LearningPath, nhánh chết GradePage. Gỡ route + link tương ứng trong `App.tsx`/`nav.ts`; grep tên đã xoá toàn repo; cập nhật docs. *Verify:* route đã cắt → 404; build sạch không import chết; `/practice` & `/home` còn đúng thẻ.
- **Phase 3 — Onboarding gate + schema.** Thêm `studentName`/`phone` vào `UserProfile`, `completeOnboarding`, `/onboarding` wizard 2 bước, `RequireOnboarded`. v1 = validate định dạng (không OTP) ⇒ deploy được ngay, không cần Blaze. *Verify:* truy cập route học tập khi thiếu field → bị đẩy về `/onboarding`; sau khi điền → vào `/home`.
- **Phase 4 — Gộp & đơn giản hóa.** `QuizRunner` chung cho 5 trang lớp 10; gộp Listen-Picture; gộp `/progress` vào `/home`; trim Daily mission; thay recharts trong analytics. *Verify:* 5 route lớp 10 vẫn chạy qua runner; `/progress` redirect/gộp; bundle giảm.
- **Phase 5 (tùy chọn, cần cô bật Blaze) — OTP thật.** Firebase Phone Auth + link anonymous khi cần hành động có giá trị. Chỉ làm sau khi cô duyệt chi phí. *Verify:* gửi/nhập OTP trên domain authorized; tiến trình giữ nguyên sau link.

---

**Tóm tắt 1 dòng:** Một hệ menu duy nhất + sửa 5 nút hỏng (Phase 0–1), cắt 9 mảng bloat (Phase 2), onboarding bắt buộc Tên+Lớp+SĐT-phụ-huynh với OTP hoãn lại (Phase 3), rồi gộp code trùng (Phase 4) — mỗi phase tự deploy & verify được, không cần chi tiền tới khi cô chủ động bật OTP.
