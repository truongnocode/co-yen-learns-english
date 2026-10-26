# Kết quả học sinh

- Giáo viên mở `/admin/results`, đăng nhập bằng tài khoản Google giáo viên đã có quyền trong `src/lib/admin.ts` và Firestore rules.
- Mọi đề lớp 6–10 yêu cầu xác nhận họ tên và lớp/nhóm trước khi hiện câu hỏi, kể cả đường dẫn trực tiếp có sẵn chế độ. Thông tin lần trước chỉ được điền sẵn; học sinh vẫn phải bấm bắt đầu/tiếp tục.
- Bài trên máy được tách theo họ tên + lớp, đề và chế độ (lớp 6–9). Dùng **Đổi học sinh** để đổi người trên máy dùng chung. Nhập lại cùng tên/lớp để tiếp tục bài đã lưu. Bài lớp 10 giữ cả bước trắc nghiệm/Part C, câu đang xem, đáp án, chế độ và hạn giờ gốc.
- Bài cũ có tên được chuyển vào vùng lưu riêng của đúng học sinh. Với bài cũ chưa có tên, học sinh phải chủ động đánh dấu **Tiếp tục bài cũ chưa ghi tên**; ứng dụng không tự gán bài đó cho người mới.
- Sau khi bắt đầu, tiến trình được lưu trên máy và gửi sau khoảng 1,2 giây ngừng nhập; hàng chờ được thử lại mỗi 15 giây/khi có mạng/mở ứng dụng. Giáo viên dùng bộ lọc **Đang làm dở** và nút **Làm mới** ở danh sách. Trang chi tiết đang mở nhận cập nhật trực tiếp từ Firestore, hiển thị số câu đã trả lời, thời điểm cập nhật và điểm tạm. Không khẳng định học sinh đang online; trạng thái này cũng gồm bài đã dừng lâu.
- Khi xác nhận nộp, chính bản ghi tiến trình chuyển sang **Đã nộp**, không tạo thêm một hàng. Chỉ thông báo **Đã gửi kết quả cho cô** sau khi máy chủ xác nhận. Đề vào 10 chỉ nộp cuối sau Part C (nếu có); trước đó cô vẫn xem được tiến trình.
- Cô xem điểm tự động, chế độ làm bài, thời gian, từng đáp án, câu bỏ trống và phần viết. Có thể lọc theo khối/chế độ, tìm tên/lớp/đề, tải thêm bài cũ.
- Nhận xét và điểm cô chấm (0–10) được lưu riêng. Không cộng điểm cô chấm vào điểm tự động vì các đề gốc có cách phân bổ điểm khác nhau. Điểm tự động là điểm luyện tập, các câu cùng trọng số; tên/lớp do học sinh khai và chế độ luyện tập đã cho xem đáp án.
- Bài cũ chỉ lưu trên máy chưa tự xuất hiện trong trang giáo viên: học sinh cần mở lại đề và gửi. Không thể thu hồi những lượt làm trước đây đã mất khỏi thiết bị.

## Lưu và phân quyền

`exam_submissions/{attemptId}` là bản chụp bài làm, được cập nhật khi đang làm và trở thành bất biến sau khi nộp, gồm thông tin nhận diện, câu hỏi/đoạn đọc, đáp án đã nhập và kết quả tự động. Phần HTML nguồn được chuyển thành văn bản; nội dung học sinh luôn hiển thị dưới dạng văn bản, không thực thi HTML. Hình vẫn có trong đề học sinh; bản chụp giáo viên ghi đường dẫn hình.

Chỉ chủ bài và hai tài khoản giáo viên hiện có được đọc nội dung bài; học sinh chỉ cập nhật bài dở của chính mình bằng phiên bản mới hơn, không được đổi chủ/tên/lớp của lượt làm. Không thể sửa/xóa bài đã nộp hay tự ghi nhận xét. Bản lưu đến chậm không được ghi đè tiến trình mới hoặc đưa bài đã nộp về đang làm. Giáo viên chấm sau khi bài đã nộp, ghi nhận xét tại `exam_submissions/{attemptId}/reviews/teacher`. Không công khai câu trả lời hay nhận xét, không cấp quyền giáo viên mới.

Mỗi lượt làm có mã riêng và số phiên bản tăng; giao dịch đọc rồi tạo giúp gửi lại cùng mã không tạo bài trùng hay ghi đè bài đã nhận. Bài gửi lỗi được giữ trong localStorage khi trình duyệt cho phép; ứng dụng thử gửi lại khi mở web/khôi phục mạng bằng đúng phiên đăng nhập đã nộp. Không xóa dữ liệu trình duyệt khi còn bài chờ gửi. Toàn bộ lượt làm lớp 6–10 được lưu riêng theo học sinh trên trình duyệt của thiết bị; lượt làm mới tạo mã mới.

## Bảng xếp hạng công khai

- `/leaderboard?grade=6` (khối 6–10) đọc được khi chưa đăng nhập, không bị chặn bởi bước tạo hồ sơ. Có liên kết từ trang chủ, thanh điều hướng và trang kết quả giáo viên.
- Xếp riêng **Kiểm tra** và **Luyện tập**. Tổng điểm là tổng điểm cao nhất của mỗi đề khác nhau; làm lại không cộng thêm lượt. Tổng bằng nhau xét trung bình chính xác chưa làm tròn, bằng tiếp thì đồng hạng (1, 1, 3). Tìm kiếm giữ nguyên thứ hạng; lọc một đề sẽ xếp riêng trong đề đó.
- Nhận diện học sinh bằng tên + lớp chuẩn hóa khoảng trắng/chữ hoa. Cùng tên và cùng lớp được gộp; đây là tên tự khai, không phải định danh học sinh đã xác minh. Điểm là điểm tự động từ ứng dụng, chưa gồm điểm cô chấm riêng, không phải kết quả kỳ thi có giám sát.
- `exam_leaderboard/{attemptId}` chỉ chứa `version, studentName, className, grade, examId, examTitle, mode, score, finishedAt`. Không chứa uid/email/đáp án/câu hỏi/nhận xét. Bài dở, bài chỉ có câu chấm tay và bản ghi có tên bắt đầu **KIỂM THỬ**/**CODEX** không được ứng dụng đưa vào xếp hạng.
- Lần nộp mới ghi bài riêng tư và bản điểm công khai trong cùng giao dịch. Security Rules dùng `getAfter` đối chiếu từng trường với bài đã nộp; chỉ chính chủ hoặc giáo viên được ghi, không được thêm dữ liệu riêng tư hay sửa điểm công khai khác nguồn. Các quy tắc này không biến điểm phía trình duyệt thành điểm chống gian lận.
- Bảng đọc hết các trang dữ liệu của khối trước khi xếp, có bộ nhớ đệm 30 giây và nút **Làm mới**. Không âm thầm xếp chỉ một phần học sinh do giới hạn truy vấn.
- Bài đã nộp trước khi có tính năng này được chiếu lại bằng `node scripts/backfill-exam-leaderboard.mjs --firebase-cli-auth=<firebase-tools/lib/auth.js>` để xem số lượng, thêm `--publish` để ghi đúng các trường công khai. Sử dụng đăng nhập CLI hiện có, không lấy token từ trình duyệt. Không sửa nội dung bài gốc. Các trình duyệt đang mở bản ứng dụng cũ cần tải lại để các bài nộp tiếp theo tự lên bảng.

## Kiểm tra và triển khai

- `npm run test`: có kiểm tra giao diện gửi thành công/thất bại/gửi lại, chống gửi trùng, giữ bài chờ mạng, luồng Part C, bộ lọc và nhận xét giáo viên; xếp hạng tính đúng điểm cao nhất, đồng hạng, khối/chế độ/đề và tải hết trang dữ liệu.
- `node scripts/smoke-exam-submissions.mjs --write-test-record`: kiểm tra quyền trên Firebase thật bằng hai danh tính học sinh riêng, gồm tiến trình, phiên bản cũ và chuyển sang đã nộp; tạo một bản ghi có tên **KIỂM THỬ QUYỀN CODEX**. Không xóa dữ liệu thật. Kiểm tra giáo viên đọc/chấm bằng giao diện và tài khoản Google bình thường.
- Rules triển khai riêng: `npx firebase-tools deploy --only firestore:rules --project english-class-28f06 --non-interactive`. GitHub Pages CI chỉ triển khai ứng dụng web.
