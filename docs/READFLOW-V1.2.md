# ReadFlow v1.2 - Ke hoach nang cap he thong hien co

## 0. Ket luan dieu hanh

ReadFlow v1.2 khong phai la mot du an viet lai tu dau. Du an hien tai da co cac lop quan trong:

- `video_lessons` trong Firestore.
- `lines` va `rhythmChunks` cho tung cau.
- Man hoc sinh nghe tung cau, nghe tung cum, lam cham, lap cau, che chu.
- Admin tao bai tu URL YouTube thong qua transcript extractor.

Huong dung la nang cap day chuyen tao bai va them buoc giao vien duyet dau ngat. Muc tieu cua v1.2 la lam cho dau `/` va `//` chinh xac hon, co metadata de biet may chac den dau, va co quy trinh do luong truoc khi dua WhisperX vao mac dinh.

## 1. Nguyen tac san pham

1. Xu ly AI chi dien ra luc tao bai, khong dien ra theo tung hoc sinh.
2. Hoc sinh chi doc du lieu tinh da xuat ban.
3. Khong cham diem tu dong trong MVP.
4. Giao vien la nguoi duyet cuoi doi voi dau ngat.
5. Moi nang cap phai tuong thich nguoc voi du lieu `rhythmChunks` hien co.

## 2. Kien truc dich

Day chuyen tao bai:

1. Lay audio/video bang `yt-dlp`.
2. Tao transcript va word timestamps bang mot trong cac nguon:
   - ffmpeg audio-energy alignment.
   - WhisperX local tren RTX 3080. Day la engine mac dinh.
3. Tinh ung vien ngat giua tung cap tu.
4. Cham diem boundary bang silence + punctuation + syntax + do dai cum.
5. Gan `/` hoac `//` va `confidence`.
6. Giao vien duyet dau ngat.
7. Xuat ban thanh bai hoc tinh.

## 3. Logic ngat nghi

Nguyen tac moi: khoang lang de xuat, ngu phap dinh doat.

Khoang lang la tin hieu manh nhat nhung khong phai duy nhat. Thuat toan can ket hop:

- Silence: khoang cach thoi gian giua `previous.end` va `next.start`.
- Punctuation: `.?!` uu tien `//`; `,;:` uu tien `/`.
- Syntax:
  - Cam hoac giam manh viec tach cum chat: mao tu + danh tu, gioi tu + tan ngu, tro dong tu + dong tu, `to` + dong tu nguyen mau, tinh tu so huu + danh tu.
  - Uu tien tach o ranh gioi menh de/cum hoan chinh: `and`, `but`, `because`, `when`, `which`, `who`, `that`, `if`, `so`.
- Length: cum qua dai tang kha nang ngat; cum mot tu bi han che.

Phan biet dau:

- `//`: het cau bang `.?!`, hoac pause dai kem ranh gioi syntax sach.
- `/`: ngat cum trong cau khi pause vua/dau phay/ranh gioi cum hop ly.

Khong nen dung nguong cung nhu `>0.6s` mot minh de gan `//`, vi video cham co the co pause dai giua mot cum van chua het y.

## 4. Data contract tuong thich nguoc

Du lieu cu van hop le:

```json
{
  "text": "Hey friends,",
  "start": 6.85,
  "end": 7.62
}
```

Du lieu moi bo sung metadata sau chunk:

```json
{
  "text": "Hey friends,",
  "start": 6.85,
  "end": 7.62,
  "boundaryAfter": {
    "type": "major",
    "pauseMs": 360,
    "confidence": 0.86,
    "sources": ["silence", "punctuation", "syntax"]
  }
}
```

`boundaryAfter` thuoc ve dau nam sau chunk hien tai. Chunk cuoi cau thuong khong can `boundaryAfter` vi khong co dau ngat ben trong dong.

Y nghia:

- `type`: `minor` ung voi `/`, `major` ung voi `//`.
- `pauseMs`: khoang lang do duoc giua hai cum.
- `confidence`: 0-1, cang cao cang it can giao vien sua.
- `sources`: cac tin hieu dong gop: `silence`, `punctuation`, `syntax`, `length`, `audio`.

## 5. Source va engine

Source duoc he thong tao moi:

- `whisperx-hybrid-v1`
- `ffmpeg-hybrid-v1`

Quy uoc:

- `*-hybrid-v1` co `boundaryAfter`.
- Cac source cu khong con la engine tao moi.

## 6. WhisperX

WhisperX la engine mac dinh de tao word timestamps tu audio that. ffmpeg chi giu lai lam fallback local va de doi chieu.

Can tra loi hai cau hoi rieng:

1. Cung thuat toan ngat, doi timestamp source sang WhisperX co giam so cho giao vien phai sua khong?
2. ffmpeg fallback co du tot cho video ngan/khong can GPU khong?

De test local tren RTX 3080:

- Model dau tien: `large-v3`.
- Backend: faster-whisper.
- `compute_type=float16`.
- `batch_size=8`, neu thieu VRAM thi giam ve 4.
- Tat diarization.
- Neu van cham/thieu VRAM: thu `large-v3-turbo`, roi `int8`.

WhisperX duoc dua vao mac dinh. Neu may chua cai WhisperX hoac runtime/VRAM khong dat, dung `RHYTHM_ENGINE=ffmpeg` tam thoi.

## 7. Quy trinh thi nghiem

Tap mau:

- 5-10 video that.
- Co video nhanh/cham, co/khong nhac nen, giong tre em/nguoi lon, caption chuan/auto-caption.

Moi video chay cac bien the:

1. WhisperX word timestamps + hybrid silence+syntax.
2. ffmpeg audio energy + hybrid silence+syntax.

Giao vien tao ban chuan, sau do dem:

- So dau can them.
- So dau can xoa.
- So dau can doi `/` thanh `//` hoac nguoc lai.
- Tong loi tren 100 tu.
- Thoi gian giao vien sua.
- Runtime moi engine.
- VRAM dinh voi WhisperX.

Quy tac quyet dinh:

- Giu WhisperX lam mac dinh neu runtime/VRAM chap nhan duoc.
- Dung ffmpeg fallback khi WhisperX chua cai dat hoac video khong can chat luong cao.

## 8. Admin review

Man admin nen co cac kha nang:

- Xem tung cau voi dau `/` va `//`.
- Click vao boundary de doi `minor`/`major`/xoa.
- Keo boundary sang ranh gioi gan nhat.
- To mau boundary theo confidence:
  - >= 0.75: on dinh.
  - 0.5-0.75: can xem.
  - < 0.5: uu tien sua.
- Luu ban nhap va xuat ban.

MVP co the lam toi thieu: hien danh sach boundary confidence thap va cho giao vien sua text chunk/boundary type.

## 9. Dich tieng Viet (tam hoan)

Tam thoi chua can ban dich tieng Viet trong MVP rhythm. Pipeline hien tai chi tao va duyet dau ngat doc.

Khi can quay lai phan dich, nguyen tac dung la khong phu thuoc API theo tung hoc sinh. Dich la cong viec mot lan luc tao bai.

Lua chon thuc te:

- Tao ban nhap dich tu API re hoac model local.
- Giao vien sua ban dich ngay trong admin.
- Luu `vi` tren tung line.

Phan nay khong nam trong scope hien tai.

Khong nen khoa chat san pham vao mot API dich duy nhat.

## 10. Lo trinh trien khai

Giai doan A - nen tang:

- Mo rong data contract `rhythmChunks.boundaryAfter`.
- Cap nhat extractor de sinh `confidence`, `sources`, `minor/major`.
- Cap nhat Worker de khong lam mat metadata.
- Cap nhat UI hoc sinh de hien `/` hoac `//`.

Giai doan B - do luong:

- Them script chay nhieu engine va xuat bao cao JSON/Markdown.
- Chay 5-10 video mau.
- Tao bang loi/100 tu sau khi giao vien sua.

Giai doan C - admin review:

- Danh dau boundary confidence thap.
- Sua/xoa/doi dau boundary.
- Xuat ban.

Giai doan D - WhisperX:

- Cai dat va benchmark tren 3080.
- `RHYTHM_ENGINE=whisperx` la mac dinh. `RHYTHM_ENGINE=ffmpeg` la fallback duy nhat.

## 11. Trang thai trien khai trong repo

Muc tieu cua lan trien khai nay:

- Them report nay.
- Them metadata boundary vao extractor.
- Chi giu `RHYTHM_ENGINE=whisperx` va `RHYTHM_ENGINE=ffmpeg`; WhisperX la mac dinh.
- Giu metadata khi Worker nhan ket qua extractor.
- Cap nhat type va UI hoc sinh de hien `/`/`//`.
- Them script thuc nghiem de chay so sanh engine va xuat ket qua.
- Them man admin review toi thieu: doi `/`/`//`, xoa boundary, luu lai Firestore.

Nhung viec chua nen lam ngay trong cung buoc:

- Giao dien admin review keo-tha day du va workflow publish/ban nhap rieng.
- Dich tu dong hang loat va workflow giao vien sua dich tam hoan.
- Cac engine khac da bi loai khoi pipeline tao moi.
