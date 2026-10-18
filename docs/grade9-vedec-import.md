# Lớp 9 · Giữa học kỳ I · VEDEC 2026

Trang công khai: `/grade/9/tests`. Có 16 đề, 608 câu/bài, 15 hình minh họa,
8 MP3 đầu ra từ 7 bản ghi nguồn. Phần tự động chấm 589 câu; 14 bài viết/nói
để tự đối chiếu hoặc nhờ cô chấm, 5 câu lỗi/không rõ trong bản gốc không tính
điểm tự động. Giữ cách quy đổi cùng trọng số của các lớp 6–8.

## Nguồn và tái nhập

Nguồn trên Desktop nằm trong ba tầng thư mục cùng tên
`V3. ĐỀ THAM KHẢO ANH 9 (GS) - GK1 - 2026 - VEDEC`.
Nhập 16 thư mục đánh số 01–16 ở tầng trong cùng; không sửa DOCX hoặc audio gốc.

```powershell
python scripts/import-grade6-vedec.py "THU_MUC_NGUON_LOP_9" --grade 9 --audio
```

Đầu ra: `public/data/grade9-midterm/`. Các điều chỉnh đã rà soát nằm trong
`scripts/grade9-vedec-overrides.json`; báo cáo nhập ở `tmp/grade9-import/review.txt`.
Đề 7 dùng file đáp án thông thường, bỏ bản phụ có hậu tố BOR vì đó là bảng
hướng dẫn chấm với cấu trúc khác. Đọc cả chữ màu đỏ và tô sáng để lấy đáp án.

- Tách tiêu đề tiếng Anh/tiếng Việt, các câu ghép cùng đoạn, ký tự đánh số Word,
  bảng nghe và lựa chọn A–D không có dấu chấm ở câu tìm lỗi sai.
- Đề 9 có 50 câu; các gạch đầu dòng trong bài đọc là ngữ liệu, không tạo câu giả.
- Đề 12 giữ bài viết về thành phố và gộp phần nói thành một bài gồm đủ ba phần.
- Đề 13/14 giữ ví dụ số 0 với lời giải làm ngữ liệu, không chấm ví dụ. Bỏ hai
  ảnh chụp trang tìm kiếm checkmark không liên quan đến câu hỏi.
- Giữ 15 ảnh của bài đọc/biển báo; loại bản hiển thị lặp của khung chữ Word ở
  thông báo Science Club và City Photo Hunt. Bảng nghe đề 12 có đủ hàng/cột,
  cuộn ngang trên điện thoại.
- Bài viết lại nhận phần còn thiếu hoặc câu hoàn chỉnh. Mở rộng cách viết
  `get on (well) with` và `among (with)` thành đáp án riêng, bỏ hướng dẫn và
  “The end” bị trích nhầm vào đáp án.

## Đáp án cần điều chỉnh

- Đề 1 câu 24: whether, không phải what. Biển cấm hút thuốc chọn B.
- Đề 7/11 câu 18: sharing và posting đều đúng sau by; nhận A/D. Câu 33 bỏ
  `have` thừa trong đáp án viết lại của đề 7.
- Đề 8 câu 33–36: phục hồi đáp án do key lặp số giữa câu hỏi và câu đã điền.
  Câu 34 nhận fewer health worries và cách less của đáp án gốc, có giải thích.
- Đề 9 câu 42 giữ traditional skills theo đề, thay new skills ghi nhầm ở key.
- Đề 12 câu ngôn ngữ 4: come down with flu, chọn B thay A.
- Đề 13 phần nghe câu 2: Phong tắt điện thoại và thoát mạng xã hội, chọn T
  theo bản ghi thay F trong key.
- Đề 14 biển NO VIDEO RECORDING: sửa nhãn A,A,B,C thành A,B,C,D, giữ nội dung;
  đáp án D. Phục hồi câu viết The safer the neighbourhood is… theo key.
- Đề 15 câu 19–22 dùng nút lựa chọn C,D,A,B với bộ phương án chung trong đoạn.
- Đề 16 câu 27 chọn A theo bài đọc; email câu 30 nhận hai thứ tự A/D hợp lý.

Các câu không tính điểm tự động:

| Đề | Câu dữ liệu | Lý do |
| --- | --- | --- |
| 1 | s9-q4 (28) | Không có lựa chọn nêu thiếu không gian ngoài trời như bài đọc |
| 1 | s9-q5 (29) | Nhiều lựa chọn đều không được nhắc về chính quyền thành phố |
| 5 | s2-q2 (2) | Thiếu lựa chọn firefighter cho người chữa cháy |
| 9 | s10-q5 (45) | Câu gốc dùng or nhưng key đổi thành điều kiện không tương đương |
| 10 | s2-q1 (1) | Phần gạch chân chia thành hai nhóm phát âm, không có một từ lẻ |

## Âm thanh và kiểm tra

Chỉ các đề 6, 7, 8, 11, 12, 13 có phần nghe và tệp nghe đi kèm. Các đề còn lại
không có phần nghe trong nguồn. Chuyển MP3/WAV sang MP3 96 kbps đầy đủ; không
cắt nội dung. Đã nhận dạng giọng nói cục bộ và đối chiếu đủ 8 tệp với câu hỏi;
không phải thay bản ghi nào. Đề 7/11 dùng chung nội dung Binh/Mira rồi Demi.
Máy nghe nằm ở đúng phần, `audioStart` của phần II: đề 7/11 = 170 giây,
đề 12 = 161 giây, đề 13 = 160 giây. Vẫn có thể tua về đầu bản ghi.

FFmpeg giải mã đủ 8 MP3 không lỗi. Kiểm thử dữ liệu kiểm tra số đề/câu, đáp án,
ảnh, audio, giới hạn đề 16, ví dụ không chấm và các lỗi key đã sửa. Kiểm thử
giao diện kiểm tra chế độ chấm sau, tải JSON có revalidation, lưu riêng lớp 9
và các lớp trước. Kiểm tra trình duyệt cả hai chế độ, nộp bài, khôi phục bài,
vị trí audio, offset và bố cục desktop/điện thoại.

Luồng đăng hiện có: lint + Vitest + production build → commit/push main →
GitHub Actions → GitHub Pages. Chỉ báo đã đăng sau khi CI thành công, JSON trên
tên miền thật khớp bản local, ảnh/audio truy cập được và kiểm tra trình duyệt.
