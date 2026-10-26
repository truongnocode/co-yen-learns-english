# Kết quả học sinh

- Giáo viên mở `/admin/results`, đăng nhập bằng tài khoản Google giáo viên đã có quyền trong `src/lib/admin.ts` và Firestore rules.
- Đề lớp 6–9: nhập họ tên, lớp/nhóm ở bước xác nhận nộp bài. Ứng dụng gửi tự động sau khi xác nhận; chỉ thông báo **Đã gửi kết quả cho cô** sau khi máy chủ xác nhận.
- Đề vào 10: hoàn thành trắc nghiệm và Part C (nếu có), nhập tên/lớp ở phần kết quả rồi gửi. Những lần sau thông tin đã được nhớ và kết quả được gửi tự động. Không gửi sớm khi mới xong Part A/B mà chưa làm Part C.
- Cô xem điểm tự động, chế độ làm bài, thời gian, từng đáp án, câu bỏ trống và phần viết. Có thể lọc theo khối/chế độ, tìm tên/lớp/đề, tải thêm bài cũ.
- Nhận xét và điểm cô chấm (0–10) được lưu riêng. Không cộng điểm cô chấm vào điểm tự động vì các đề gốc có cách phân bổ điểm khác nhau. Điểm tự động là điểm luyện tập, các câu cùng trọng số; tên/lớp do học sinh khai và chế độ luyện tập đã cho xem đáp án.
- Bài cũ chỉ lưu trên máy chưa tự xuất hiện trong trang giáo viên: học sinh cần mở lại đề và gửi. Không thể thu hồi những lượt làm trước đây đã mất khỏi thiết bị.

## Lưu và phân quyền

`exam_submissions/{attemptId}` là bản chụp bài làm bất biến, gồm thông tin nhận diện, câu hỏi/đoạn đọc, đáp án đã nhập và kết quả tự động. Phần HTML nguồn được chuyển thành văn bản; nội dung học sinh luôn hiển thị dưới dạng văn bản, không thực thi HTML. Hình vẫn có trong đề học sinh; bản chụp giáo viên ghi đường dẫn hình.

Chỉ chủ bài và hai tài khoản giáo viên hiện có được đọc bài; học sinh không thể sửa/xóa bài đã nộp hay tự ghi nhận xét. Giáo viên ghi nhận xét tại `exam_submissions/{attemptId}/reviews/teacher`. Không bổ sung quyền đọc công khai hay cấp quyền giáo viên mới.

Mỗi lượt làm có mã riêng; giao dịch đọc rồi tạo giúp gửi lại cùng mã không tạo bài trùng hay ghi đè bài đã nhận. Bài gửi lỗi được giữ trong localStorage khi trình duyệt cho phép; ứng dụng thử gửi lại khi mở web/khôi phục mạng bằng đúng phiên đăng nhập đã nộp. Không xóa dữ liệu trình duyệt khi còn bài chờ gửi. Với lớp 6–9, toàn bộ lượt làm vẫn được lưu trên thiết bị như trước; lượt làm mới tạo mã mới.

## Kiểm tra và triển khai

- `npm run test`: có kiểm tra giao diện gửi thành công/thất bại/gửi lại, chống gửi trùng, giữ bài chờ mạng, luồng Part C, bộ lọc và nhận xét giáo viên.
- `node scripts/smoke-exam-submissions.mjs --write-test-record`: kiểm tra quyền trên Firebase thật bằng hai danh tính học sinh riêng; tạo một bản ghi có tên **KIỂM THỬ QUYỀN CODEX**. Không xóa dữ liệu thật. Kiểm tra giáo viên đọc/chấm bằng giao diện và tài khoản Google bình thường.
- Rules triển khai riêng: `npx firebase-tools deploy --only firestore:rules --project english-class-28f06 --non-interactive`. GitHub Pages CI chỉ triển khai ứng dụng web.
