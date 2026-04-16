#!/usr/bin/env python3
"""
extract_pdf.py — PDF -> Markdown + extracted images for the content-processor skill.

Pipeline:
  1. pymupdf4llm.to_markdown() with write_images=True
       → renders text as Markdown, dumps embedded images as PNG/JPG files,
         and inserts ![](image_path) placeholders at the correct reading-order
         position so the LLM downstream sees image-text adjacency naturally.
  2. PyMuPDF (fitz) second pass to record per-image metadata (page, bbox, size,
     SHA-256) into images.json — used for confidence scoring and dedup.
  3. Outputs to a per-document folder so each source is self-contained.

Usage:
  python extract_pdf.py <input.pdf> [--out OUT_DIR] [--dpi 200] [--min-px 60]

Output layout:
  OUT_DIR/
    source.md            -> markdown with inline image refs
    images/              -> extracted PNG/JPG files (named: p{page}-{idx}.png)
    images.json          -> per-image metadata
    extraction.json      -> summary (pages, image_count, ocr_pages_detected)

Exit codes:
  0 = success
  2 = bad arguments
  3 = source unreadable / no text + no images
  4 = dependency missing
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

# Force UTF-8 stdout on Windows so Vietnamese paths/text don't crash `print()`
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

try:
    import pymupdf4llm
    import fitz  # PyMuPDF
except ImportError as e:
    print(
        f"[extract_pdf] Missing dependency: {e.name}. "
        f"Install with: pip install -r .claude/skills/content-processor/requirements.txt",
        file=sys.stderr,
    )
    sys.exit(4)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()[:16]  # short hash, enough for dedup within one doc


def extract(pdf_path: Path, out_dir: Path, dpi: int, min_px: int) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    images_dir = out_dir / "images"
    images_dir.mkdir(exist_ok=True)

    # ─── Pass 1: pymupdf4llm to markdown + images ────────────────────────────
    # write_images=True → real embedded image bytes saved to disk
    # image_path → directory for image files
    # image_format → "png" preserves quality; jpg=smaller for photos
    # dpi → for vector elements rendered as raster
    # filename → prefix for image filenames
    md_text = pymupdf4llm.to_markdown(
        str(pdf_path),
        write_images=True,
        image_path=str(images_dir),
        image_format="png",
        dpi=dpi,
        filename=pdf_path.stem,
    )

    md_path = out_dir / "source.md"
    md_path.write_text(md_text, encoding="utf-8")

    # ─── Pass 2: PyMuPDF for image metadata + dedup ──────────────────────────
    doc = fitz.open(str(pdf_path))
    page_count = doc.page_count

    images_meta: list[dict] = []
    seen_hashes: dict[str, str] = {}  # hash -> first filename that had it
    ocr_candidate_pages: list[int] = []

    for page_idx in range(page_count):
        page = doc.load_page(page_idx)
        text = page.get_text("text").strip()
        if not text:
            ocr_candidate_pages.append(page_idx + 1)

        # get_image_info gives bbox; matches images already extracted by pass 1
        for info in page.get_image_info(xrefs=True):
            bbox = info.get("bbox", (0, 0, 0, 0))
            width = info.get("width", 0)
            height = info.get("height", 0)
            if width < min_px or height < min_px:
                continue  # skip tiny icons / decorative bullets
            images_meta.append(
                {
                    "page": page_idx + 1,
                    "bbox": [round(x, 1) for x in bbox],
                    "width": width,
                    "height": height,
                    "xref": info.get("xref"),
                }
            )

    doc.close()

    # ─── Dedup actual files on disk by hash ──────────────────────────────────
    extracted_files = sorted(images_dir.glob(f"{pdf_path.stem}*"))
    kept: list[dict] = []
    for f in extracted_files:
        h = sha256_file(f)
        if h in seen_hashes:
            # duplicate — remove the redundant file, keep first occurrence
            f.unlink()
            continue
        seen_hashes[h] = f.name
        kept.append(
            {
                "filename": f.name,
                "relative_path": f"images/{f.name}",
                "size_bytes": f.stat().st_size,
                "sha256": h,
            }
        )

    (out_dir / "images.json").write_text(
        json.dumps(
            {
                "extracted_files": kept,
                "page_image_metadata": images_meta,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    summary = {
        "source": str(pdf_path),
        "page_count": page_count,
        "markdown_chars": len(md_text),
        "image_files_kept": len(kept),
        "image_files_dedup_removed": len(extracted_files) - len(kept),
        "ocr_candidate_pages": ocr_candidate_pages,
        "needs_ocr": bool(ocr_candidate_pages),
        "output_markdown": str(md_path),
        "output_images_dir": str(images_dir),
    }
    (out_dir / "extraction.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    if not md_text.strip() and not kept:
        print("[extract_pdf] WARN: source has no extractable text and no images.", file=sys.stderr)
        return summary

    return summary


def main() -> int:
    ap = argparse.ArgumentParser(description="Extract PDF -> Markdown + images.")
    ap.add_argument("pdf", type=Path, help="Input PDF path")
    ap.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output directory (default: tmp/extract/<pdf-stem>/)",
    )
    ap.add_argument("--dpi", type=int, default=200, help="DPI for rendered raster (default 200)")
    ap.add_argument(
        "--min-px",
        type=int,
        default=60,
        help="Skip images smaller than this on either dimension (default 60px) — filters bullet icons",
    )
    args = ap.parse_args()

    if not args.pdf.is_file():
        print(f"[extract_pdf] Not a file: {args.pdf}", file=sys.stderr)
        return 2

    out_dir = args.out or Path("tmp/extract") / args.pdf.stem
    summary = extract(args.pdf, out_dir, args.dpi, args.min_px)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0 if (summary["markdown_chars"] or summary["image_files_kept"]) else 3


if __name__ == "__main__":
    sys.exit(main())
