# Lớp 8 · Giữa học kỳ I · VEDEC 2026

Trang công khai: `/grade/8/tests`. Bộ nguồn có 17 đề, 659 câu/bài; đề 16 không có
phần nghe. Có 18 bài viết đoạn văn/nói để tự đối chiếu hoặc nhờ cô chấm, 6 câu
chưa rõ trong đề gốc được ghi chú và loại khỏi điểm tự động. Còn 635 câu chấm tự
động, quy đổi cùng trọng số như lớp 6/7.

## Nguồn và tái nhập

Nguồn nằm trên Desktop trong thư mục:
`V3. ĐỀ THAM KHẢO ANH 8 (GS) - GK1 - 2026 - VEDEC/V3. ĐỀ THAM KHẢO ANH 8 (GS) – GK1 - 2026 - VEDEC`.
Chỉ nhập 17 thư mục đánh số trực tiếp; thư mục lồng bên trong chứa cùng bộ số
01–17 không tạo thêm đề. Không sửa tài liệu nguồn.

```powershell
python scripts/import-grade6-vedec.py "THU_MUC_NGUON_LOP_8" --grade 8 --audio
```

Đầu ra: `public/data/grade8-midterm/`. Dữ liệu ghi đè đã đối chiếu:
`scripts/grade8-vedec-overrides.json`. Báo cáo nhập ở `tmp/grade8-import/review.txt`.
Helper trong tmp chỉ dùng rà soát, không phải bản có thẩm quyền để tái tạo overrides.

- Đề 1 không dùng tiền tố 2/3 cho tên đề/đáp án; đề 2 đảo tên 2=đáp án, 3=đề.
  Lớp 8 được nhận diện DOCX theo tên nội dung, không dựa thứ tự số.
- Đáp án đề 3 ghi nhầm “Anh 9” ở đầu, nhưng nội dung khớp bài lớp 8 đi kèm.
- Giữ gạch chân và đủ 9 hình biển báo. Khôi phục ký tự đánh số Word (Câu,
  chữ hoa/chữ thường), bỏ mục đánh số trống gây lệch A–D. Giữ thứ tự bản gốc.
- Tách câu `Question n10`, tiêu đề nằm chung đoạn, bảng điền khuyết 4–5 ô và
  5 câu đúng/sai ngắn trong bảng đề 14. Không làm mất bài khi thiếu số dòng.
- Chấm câu điền nhiều chỗ trống chỉ khi đủ các phần theo thứ tự. Câu viết lại
  nhận phần còn thiếu hoặc câu hoàn chỉnh; bỏ các đáp án trích sai như “ing”,
  “s”, “The end”, “I do” đứng riêng, hay từ bị dính.

## Rà soát đáp án gốc

Đã sửa các lựa chọn bị mất đánh dấu/ghép nhầm theo câu và hình: hospitable,
KEEP OFF THE GRASS (đề 2); hai biển thư viện/điện thoại (đề 3); however,
friendly, help (đề 7); fancy + V-ing, wild animals (đề 11); enjoy participating
(đề 13); most farmland, peace and relaxation và thứ tự hội thoại (đề 15);
hai biển giới hạn khối lượng/quà găng tay (đề 16); bảng đáp án bài đọc và động
từ đầy đủ (đề 17). Đề 3 có cả C và D được tô trong đáp án câu so sánh badly,
nên chấp nhận cả hai và ghi chú.

Các câu không đủ rõ để chấm tự động:

| Đề | Câu dữ liệu | Lý do |
| --- | --- | --- |
| 1 | s5-q1 | Đáp án phát âm không thống nhất với phần gạch chân |
| 13 | s3-q3 | Bài nghe nêu transportation là big problem, nhưng lựa chọn không có từ này |
| 15 | s1-q5 | Cộng/gộp hai nhóm 71% và 8% chưa rõ |
| 15 | s4-q1 | Từ addict có trọng âm tùy từ loại, đề không cho ngữ cảnh |
| 15 | s8-q1 | Cả bốn đặc điểm đều có trong đoạn văn, câu NOT không có đáp án riêng |
| 15 | s8-q4 | Commute không xác định phương tiện như bốn lựa chọn |

## Âm thanh

Có 27 tệp MP3 đầu ra từ 25 nguồn khác nhau (một số đề dùng lại bản ghi).
Chuyển toàn bộ âm thanh sang MP3 96 kbps, giữ nguyên nội dung và thời lượng;
WAV cũng được chuyển đầy đủ. Đề 14 sắp xếp lại `part I.mp3` trước `part 2.wav`
để đúng thứ tự Mark rồi bài nói về thành phố.

Đã nhận dạng giọng nói cục bộ và đối chiếu chủ đề của cả 27 tệp với câu hỏi.
Không phải thay bản nghe của đề nào. Các tệp ghép nhiều bài vẫn nguyên vẹn;
máy nghe đặt tại từng phần và `audioStart` chuyển tới đầu phần II ở đề 3,
7, 9, 11, 12. Người học vẫn có thể tua lại để nghe toàn bộ tệp.

## Kiểm tra và triển khai

- Kiểm tra số đề/câu, ID, đáp án thuộc bộ lựa chọn, nguồn ảnh và bản nghe; giải
  mã toàn bộ 27 MP3 bằng FFmpeg không lỗi.
- Kiểm thử dữ liệu 17 đề, tách lưu bài theo lớp/đề/chế độ, giới hạn đề 17,
  các câu nhiều chỗ trống, giữ nhãn A–D và a–e, câu không tính điểm.
- Kiểm thử giao diện cả hai chế độ, thanh tiến độ, bảng đúng/sai, máy nghe,
  bố cục desktop và điện thoại. Lint, Vitest, production build bắt buộc đạt.
- TypeScript riêng vẫn có 5 chẩn đoán cũ trong phần video và analytics test,
  giống trạng thái trước công việc này; không phát sinh chẩn đoán mới ở lớp 8.
- Theo luồng hiện có: commit/push main → GitHub Actions → GitHub Pages. Sau đó
  đối chiếu JSON trên tên miền thật, kích thước ảnh/MP3, mẫu SHA-256 âm thanh
  và kiểm tra bằng trình duyệt trước khi báo hoàn thành.
