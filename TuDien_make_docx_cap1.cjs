const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, ShadingType, VerticalAlign,
  PageNumber, Header, Footer, PageBreak, PageOrientation,
} = require("docx");

const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "cap1", "dictionary_cap1.json"), "utf8"));
const OUT = path.resolve(__dirname, "..", "..", "TuDien_TiengAnh_TieuHoc_Lop1-5.docx");

// ── layout ──
const COLW = [520, 1500, 950, 1636, 2400, 3700]; // sums to 10706
const TABLE_W = COLW.reduce((a, b) => a + b, 0);
const B = { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" };
const BORDERS = { top: B, bottom: B, left: B, right: B };
const HEAD_FILL = "2E5496", LETTER_FILL = "D9E2F3", STRIPE = "F2F6FC";
const FONT = "Arial";

const R = (text, o = {}) => new TextRun({ text: String(text), bold: o.bold, italics: o.italics, size: o.size || 16, color: o.color, font: FONT });
const P = (runs, o = {}) => new Paragraph({ alignment: o.align, spacing: { before: 0, after: o.after ?? 0 }, children: Array.isArray(runs) ? runs : [runs] });
function C(i, runs, o = {}) {
  return new TableCell({
    width: { size: o.span ? TABLE_W : COLW[i], type: WidthType.DXA },
    columnSpan: o.span, borders: BORDERS,
    margins: { top: 28, bottom: 28, left: 80, right: 80 },
    verticalAlign: VerticalAlign.CENTER,
    shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR } : undefined,
    children: Array.isArray(runs) ? runs : [runs],
  });
}

const HEADERS = ["STT", "Từ vựng", "Từ loại", "Phiên âm", "Nghĩa", "Từ mở rộng (từ phái sinh)"];
const headerRow = new TableRow({
  tableHeader: true,
  children: HEADERS.map((h, i) => C(i, P(R(h, { bold: true, color: "FFFFFF", size: 18 }), { align: AlignmentType.CENTER }), { fill: HEAD_FILL })),
});

function letterRow(letter) {
  return new TableRow({ children: [C(0, P(R(letter, { bold: true, size: 26, color: "1F3864" }), { align: AlignmentType.LEFT }), { span: true, fill: LETTER_FILL })] });
}

function derivParas(ders) {
  if (!ders || !ders.length) return [P(R("—", { color: "AAAAAA", size: 14 }), { align: AlignmentType.CENTER })];
  return ders.map((d) => {
    const runs = [R(d.word, { bold: true, size: 15 }), R(`  (${d.type})`, { italics: true, size: 13, color: "7F7F7F" })];
    if (d.ipa) runs.push(R(`  ${d.ipa}`, { size: 13, color: "555555" }));
    if (d.vi) runs.push(R(`  – ${d.vi}`, { size: 14 }));
    return P(runs, { after: 20 });
  });
}

// ── build table rows ──
const rows = [headerRow];
let curLetter = "", stripe = 0;
for (const e of data) {
  const L = (e.en[0] || "?").toUpperCase();
  if (L !== curLetter) { curLetter = L; rows.push(letterRow(L)); stripe = 0; }
  const fill = stripe % 2 === 1 ? STRIPE : undefined;
  stripe++;
  rows.push(new TableRow({
    children: [
      C(0, P(R(e.stt, { size: 15 }), { align: AlignmentType.CENTER }), { fill }),
      C(1, P(R(e.en, { bold: true, size: 19 }), {}), { fill }),
      C(2, P(R(e.type, { size: 15 }), { align: AlignmentType.CENTER }), { fill }),
      C(3, P(R(e.ipa, { size: 16, color: "333333" }), {}), { fill }),
      C(4, P(R(e.vi, { size: 16 }), {}), { fill }),
      C(5, derivParas(e.derivatives), { fill }),
    ],
  }));
}

const table = new Table({ width: { size: TABLE_W, type: WidthType.DXA }, columnWidths: COLW, rows });

// ── cover + guide ──
const spacer = (n) => Array.from({ length: n }, () => P(R("")));
const ABBR = [
  ["n", "danh từ"], ["v", "động từ"], ["adj", "tính từ"], ["adv", "trạng từ"],
  ["prep", "giới từ"], ["conj", "liên từ"], ["det", "từ hạn định"], ["pron", "đại từ"],
  ["num", "số từ"], ["phr", "cụm từ"], ["v phr", "cụm động từ"], ["idiom", "thành ngữ"],
];
const abbrRows = ABBR.map(([a, v]) => new TableRow({ children: [
  new TableCell({ width: { size: 1200, type: WidthType.DXA }, borders: BORDERS, margins: { top: 30, bottom: 30, left: 100, right: 100 }, children: [P(R(a, { bold: true, size: 18 }), { align: AlignmentType.CENTER })] }),
  new TableCell({ width: { size: 3000, type: WidthType.DXA }, borders: BORDERS, margins: { top: 30, bottom: 30, left: 100, right: 100 }, children: [P(R(v, { size: 18 }))] }),
] }));
const abbrTable = new Table({ width: { size: 4200, type: WidthType.DXA }, columnWidths: [1200, 3000], alignment: AlignmentType.CENTER, rows: abbrRows });

const total = data.length;
const withDeriv = data.filter((d) => d.derivatives && d.derivatives.length).length;

const cover = [
  ...spacer(6),
  P(R("TỪ ĐIỂN TỪ VỰNG TIẾNG ANH TIỂU HỌC", { bold: true, size: 44, color: "1F3864" }), { align: AlignmentType.CENTER, after: 240 }),
  P(R("Lớp 1 – 5  •  Bộ sách Global Success", { size: 30, color: "2E5496" }), { align: AlignmentType.CENTER, after: 120 }),
  P(R("Kèm phiên âm IPA (Anh–Anh) và từ phái sinh", { size: 24, italics: true, color: "555555" }), { align: AlignmentType.CENTER }),
  ...spacer(10),
  P(R(`${total} mục từ • ${withDeriv} mục có từ mở rộng • sắp xếp A–Z`, { size: 22, color: "7F7F7F" }), { align: AlignmentType.CENTER, after: 80 }),
  P(R("2026", { size: 22, color: "7F7F7F" }), { align: AlignmentType.CENTER }),
  P([new PageBreak()]),
];
const guide = [
  P(R("Hướng dẫn sử dụng", { bold: true, size: 30, color: "1F3864" }), { after: 160 }),
  P(R("Mỗi mục từ gồm 6 cột: số thứ tự (STT), từ vựng, từ loại, phiên âm quốc tế (IPA), nghĩa tiếng Việt, và từ mở rộng — các từ cùng gốc (phái sinh) kèm từ loại, phiên âm và nghĩa. Các từ được sắp xếp theo thứ tự bảng chữ cái A–Z.", { size: 20 }), { after: 200 }),
  P(R("Bảng chữ viết tắt từ loại", { bold: true, size: 24, color: "1F3864" }), { after: 120 }),
  abbrTable,
  P([new PageBreak()]),
];

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 20 } } } },
  sections: [
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 720, left: 600, right: 600 } } }, children: [...cover, ...guide] },
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 940, bottom: 720, left: 600, right: 600 } } },
      headers: { default: new Header({ children: [P([R("Từ điển Từ vựng Tiếng Anh Tiểu học (Lớp 1–5)", { size: 16, color: "999999" })], { align: AlignmentType.CENTER })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Trang ", size: 16, color: "999999", font: FONT }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "999999", font: FONT })] })] }) },
      children: [table],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("Da tao:", OUT);
  console.log("Kich thuoc:", (buf.length / 1024 / 1024).toFixed(2), "MB");
  console.log("So muc tu:", total, "| co tu mo rong:", withDeriv);
});
