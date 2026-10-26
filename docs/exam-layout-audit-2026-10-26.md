# Rà soát bố cục đề thi · 26/10/2026

Đã quét toàn bộ nguồn đề thi đang dùng trong kho: 69 đề giữa kỳ lớp 6–9 và
444 đề ôn vào lớp 10, tổng 513 đề / 16.390 câu. Đây là rà soát nội dung hiển
thị và độ gọn, không phải chấm lại tính đúng sai học thuật của toàn bộ đáp án.

| Bộ đề | Số đề | Số câu | Trường nội dung có dòng trống dài trước sửa | Còn lại sau sửa |
| --- | ---: | ---: | ---: | ---: |
| Lớp 6 | 18 | 671 | 211 | 0 |
| Lớp 7 | 18 | 669 | 149 | 0 |
| Lớp 8 | 17 | 659 | 201 | 0 |
| Lớp 9 | 16 | 608 | 76 | 0 |
| Ôn vào 10 | 444 | 13.783 | 1.034 | 0 |

Số trường gồm câu hỏi, ngữ liệu và đối chiếu đáp án; không đồng nghĩa số câu
bị lỗi. Đối chiếu tự động từng trường trước/sau: không mất từ ngữ học tập hay
ảnh. Giữ nguyên dữ liệu nguồn, đáp án, ID câu, số câu, file nghe và khóa lưu bài.

## Thay đổi hiển thị

- Chuẩn hóa chấm/gạch dài, kể cả khi Word chia thành nhiều đoạn định dạng,
  thành `____`; bỏ các dòng chỉ dùng để viết trên giấy và dấu kết thúc đề.
- Thu khoảng trắng/tab thừa và ngắt dòng trong cùng đoạn, giữ các đoạn văn,
  bảng, hình, gạch chân, số ô trống, giới hạn từ và điểm số.
- Bỏ tiền tố Question/Câu/số bị lặp vì thẻ đã có số câu. Khi ảnh đứng trước
  số câu, vẫn giữ ảnh và thứ tự ảnh đầy đủ.
- Rút phần hướng dẫn dành cho giấy như “on your answer sheet”; giữ yêu cầu
  chuyên môn. Tách hướng dẫn phần sau bị ghép vào đáp án D ở 4 câu lớp 6/8.
- Gắn A–D cạnh các cụm gạch chân khi ánh xạ đủ rõ. Nếu Word gạch chân tách
  giữa từ, giữ bản hiển thị cũ thay vì tự suy đoán nhãn.
- Ô nhập câu ngắn và nút kiểm tra cùng hàng; hướng dẫn nhập dấu `/` chỉ hiện
  ở câu có nhiều ô trống. Giữ nhãn truy cập cho trình đọc màn hình.
- Bài viết khởi đầu với ô 4 dòng; tiêu chí chấm dài có thể mở xem. Nội dung
  bài viết và tiêu chí vẫn được giữ đủ.
- Áp dụng bố cục phương án 1/2/4 hàng cho cả bộ ôn vào 10. Phần đọc hiểu vẫn
  giữ đủ đoạn văn và cơ chế cuộn sẵn có.

## Kiểm tra và tái rà soát

```powershell
node scripts/audit-exam-layout.mjs
npm run test
npm run lint
npm run build
```

Script chỉ đọc nguồn và ghi kết quả trong `tmp/exam-compact-audit/`:
`report.json` chứa thống kê/đối chiếu; `changed-fields.txt` liệt kê trường đã
được làm gọn. Có thể chạy lại khi thêm đề mới. Dữ liệu từ Firestore của bộ
vào 10 cũng đi qua cùng quy tắc hiển thị; thống kê trên dùng nguồn JSON trong kho.

Kiểm thử gồm chấm/lưu câu viết lại trong ảnh minh họa (lớp 6, đề 2, câu 33),
câu nhiều ô trống, hình đứng trước số câu, gạch chân, hướng dẫn sau đáp án D,
tiêu chí chấm thu gọn, luồng trắc nghiệm rồi tự luận vào 10 và hai chế độ chấm.
Kiểm tra trình duyệt desktop/điện thoại trước khi đăng; chỉ xác nhận hoàn tất
sau khi GitHub Actions đạt và kiểm tra lại tên miền thật.
