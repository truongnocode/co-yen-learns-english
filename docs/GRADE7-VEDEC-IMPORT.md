# Lớp 7 · Giữa học kỳ I · VEDEC 2026

Trang công khai: `/grade/7/tests`. 18 đề, 669 câu/bài. Đề 18 không có phần nghe.
Luyện tập chấm ngay; kiểm tra chỉ hiện đáp án sau khi xác nhận nộp. Viết đoạn văn
và nói cần tự đối chiếu/nhờ cô chấm. Lưu bài riêng theo lớp, đề và chế độ.

## Nguồn và nhập lại

Nguồn: thư mục `V3. ĐỀ THAM KHẢO ANH 7 (GS) - GK1 - 2026 - VEDEC` trên Desktop.
Mỗi đề dùng DOCX `2.*` (đề), `3.*` (đáp án), và các bản ghi đính kèm.
Không sửa tệp nguồn. Chạy:

```powershell
python scripts/import-grade6-vedec.py "THU_MUC_NGUON_LOP_7" --grade 7 --audio
```

Đầu ra: `public/data/grade7-midterm/`. Đối chiếu ở `tmp/grade7-import/review.txt`.
Các sửa đổi đã rà soát được lưu trong `scripts/grade7-vedec-overrides.json`.
Không chạy lại helper thử nghiệm trong `tmp`; JSON overrides là bản có thẩm quyền.
Tham số mặc định vẫn là lớp 6, giữ nguyên ID và bài làm lớp 6.

## Đối chiếu nội dung

- Tách đủ các dòng lựa chọn không đánh số, Task 1/2, tiêu đề SECTION và các câu
  Question nằm chung đoạn. Giữ gạch chân, hình và đoạn văn từ DOCX.
- Đề 8 thiếu hàng lựa chọn chỗ trống 22: khôi phục từ file đáp án đi kèm.
- Đề 12 đánh nhầm chỗ trống cuối là 5 trong bài chỉ có 4 câu: thống nhất thành 4.
- Câu điền nhiều chỗ trống cần nhập đủ các phần, không chấp nhận một nửa đáp án.
  Các câu viết lại nhận phần còn thiếu hoặc câu đầy đủ. Điểm là điểm luyện tập
  quy đổi với trọng số bằng nhau, không phải điểm toàn bộ đề gốc.
- Sửa các đáp án không phù hợp câu/biển báo/lời thoại, gồm would like (đề 2),
  cooked for (đề 7), the elderly (đề 10), hai câu T/F về Pete (đề 11), trọng âm
  belong (đề 16), water and juice (đề 17), watches (đề 18).
- Giữ đủ 8 hình biển báo, kể cả hai hình trong ô bảng trống chữ ở đề 6 và 18.
  Đề 18 câu phát âm 1 ghi thiếu gạch chân: giữ để đối chiếu, không chấm tự động.
- Không tạo bài nói giả cho tiêu đề trống chỉ có “The end” ở đề 11.

## File nghe

21 MP3 riêng biệt được sử dụng, chuyển toàn bộ bản ghi sang MP3 96 kbps,
không cắt nội dung. Một bản ghi chung có thể xuất hiện tại nhiều phần; người học
có thể tua nghe lại toàn bộ. `audioStart` đặt đúng vị trí bắt đầu của từng bài.

Rà soát âm thanh bằng nhận dạng giọng nói chạy cục bộ và đối chiếu câu hỏi, đáp án:

| Đề | Vấn đề nguồn | Ghép bản nghe phù hợp |
| --- | --- | --- |
| 4, phần I | Tệp Task 1 trùng bản lớp 6 về Linda/Tom và bạn học, không phải Julia | Dùng TASK 2 của đề 1, đoạn Julia từ 3:03 |
| 16 | Tệp duy nhất nói về robot Elias; thiếu bản phù hợp cả hai phần | Dùng TASK 1 của đề 1: healthy habits rồi phỏng vấn Jack, phần II từ 2:20 |
| 17 | Hai tệp nói về robot Elias và mua sắm online | Dùng bản chung đề 7: cộng đồng và healthy lifestyle; phần I từ 2:53, phần II từ đầu |

Các bản khác đã đối chiếu chủ đề/phần nghe. Đề 9 và 14 dùng cùng một bản gốc.
Tệp được thay thế chỉ bị loại khỏi đầu ra sinh tự động; tệp nguồn vẫn nguyên vẹn.
`sourceName`, `sourceHash`, thời lượng và ánh xạ `sectionIds` lưu trong dữ liệu.

## Xác nhận

- Kiểm tra đủ 18 đề, 669 câu/bài; đáp án trong tập lựa chọn; ID riêng; tài nguyên
  tồn tại; mỗi phần nghe có bản ghi phù hợp; audioStart nhỏ hơn thời lượng.
- Giải mã đầy đủ 21 MP3 bằng FFmpeg, không lỗi.
- Kiểm thử hai chế độ, lưu/khôi phục và tách bài làm giữa hai lớp; thử tua tự động
  tới bài tương ứng. Kiểm tra giao diện desktop và điện thoại 375 px.
- Lint, Vitest và production build là các kiểm tra bắt buộc trước triển khai.
  TypeScript riêng có các chẩn đoán cũ đã ghi ở tài liệu nhập lớp 6.
