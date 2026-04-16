#!/usr/bin/env python3
"""
extract_docx.py — DOCX -> HTML + Markdown + extracted images.

Pipeline:
  1. mammoth.convert_to_html() with image handler that saves embedded images
     to disk and rewrites <img> src to a relative path. Mammoth preserves the
     image position in the HTML flow exactly where it appears in the document.
  2. Convert HTML to Markdown-ish text via BeautifulSoup walk (preserves image
     placeholders and heading structure for the LLM).
  3. Outputs to a per-document folder.

Usage:
  python extract_docx.py <input.docx> [--out OUT_DIR]

Output layout:
  OUT_DIR/
    source.html       -> full mammoth HTML (with style map applied)
    source.md         -> Markdown-ish for LLM consumption
    images/           -> embedded images (named: img-{n}.{ext})
    images.json       -> per-image metadata
    extraction.json   -> summary

Exit codes:
  0 = success
  2 = bad arguments
  3 = no extractable content
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
    import mammoth
    from bs4 import BeautifulSoup, NavigableString
except ImportError as e:
    print(
        f"[extract_docx] Missing dependency: {e.name}. "
        f"Install with: pip install -r .claude/skills/content-processor/requirements.txt",
        file=sys.stderr,
    )
    sys.exit(4)


# Mammoth style map: keep heading/list structure, drop noisy inline styles.
STYLE_MAP = """
p[style-name='Heading 1'] => h1:fresh
p[style-name='Heading 2'] => h2:fresh
p[style-name='Heading 3'] => h3:fresh
p[style-name='Title']     => h1:fresh
p[style-name='Subtitle']  => h2:fresh
p[style-name='Quote']     => blockquote
b => strong
i => em
"""


def make_image_handler(images_dir: Path, counter: dict):
    """Return a mammoth image handler that saves embedded images to disk."""

    def handler(image):
        with image.open() as image_bytes:
            data = image_bytes.read()
        digest = hashlib.sha256(data).hexdigest()[:16]

        # dedup: same hash → reuse filename
        if digest in counter["seen"]:
            return {"src": counter["seen"][digest]}

        ext = image.content_type.split("/")[-1] if image.content_type else "png"
        ext = {"jpeg": "jpg", "x-emf": "emf", "x-wmf": "wmf"}.get(ext, ext)
        n = counter["n"]
        filename = f"img-{n:03d}.{ext}"
        counter["n"] += 1

        out_path = images_dir / filename
        out_path.write_bytes(data)
        rel = f"images/{filename}"
        counter["seen"][digest] = rel
        counter["files"].append(
            {"filename": filename, "relative_path": rel, "size_bytes": len(data), "sha256": digest}
        )
        return {"src": rel}

    return handler


def html_to_markdown_walk(soup: BeautifulSoup) -> str:
    """Crude but reliable HTML→Markdown for our purposes (LLM input)."""
    out: list[str] = []

    def walk(node, depth: int = 0):
        if isinstance(node, NavigableString):
            text = str(node)
            if text.strip():
                out.append(text)
            return
        name = node.name
        if name in {"h1", "h2", "h3", "h4"}:
            level = int(name[1])
            out.append("\n\n" + "#" * level + " ")
            for child in node.children:
                walk(child, depth + 1)
            out.append("\n")
        elif name == "p":
            out.append("\n\n")
            for child in node.children:
                walk(child, depth + 1)
        elif name == "br":
            out.append("\n")
        elif name in {"ul", "ol"}:
            out.append("\n")
            for li in node.find_all("li", recursive=False):
                bullet = "- " if name == "ul" else "1. "
                out.append("\n" + bullet)
                for child in li.children:
                    walk(child, depth + 1)
            out.append("\n")
        elif name == "li":
            for child in node.children:
                walk(child, depth + 1)
        elif name == "img":
            alt = node.get("alt", "")
            src = node.get("src", "")
            out.append(f"\n![{alt}]({src})\n")
        elif name == "table":
            # keep as raw HTML — markdown tables are fragile, LLM handles HTML fine
            out.append("\n\n" + str(node) + "\n\n")
        elif name in {"strong", "b"}:
            out.append("**")
            for child in node.children:
                walk(child, depth + 1)
            out.append("**")
        elif name in {"em", "i"}:
            out.append("*")
            for child in node.children:
                walk(child, depth + 1)
            out.append("*")
        elif name == "blockquote":
            out.append("\n> ")
            for child in node.children:
                walk(child, depth + 1)
            out.append("\n")
        else:
            for child in node.children:
                walk(child, depth + 1)

    walk(soup)
    md = "".join(out)
    # collapse runs of blank lines
    while "\n\n\n" in md:
        md = md.replace("\n\n\n", "\n\n")
    return md.strip() + "\n"


def extract(docx_path: Path, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    images_dir = out_dir / "images"
    images_dir.mkdir(exist_ok=True)

    counter = {"n": 1, "seen": {}, "files": []}
    handler = make_image_handler(images_dir, counter)

    with docx_path.open("rb") as f:
        result = mammoth.convert_to_html(
            f,
            convert_image=mammoth.images.img_element(handler),
            style_map=STYLE_MAP,
        )

    html = result.value
    warnings = [str(m) for m in result.messages]

    (out_dir / "source.html").write_text(html, encoding="utf-8")

    soup = BeautifulSoup(html, "html.parser")
    md = html_to_markdown_walk(soup)
    (out_dir / "source.md").write_text(md, encoding="utf-8")

    (out_dir / "images.json").write_text(
        json.dumps({"extracted_files": counter["files"]}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    summary = {
        "source": str(docx_path),
        "html_chars": len(html),
        "markdown_chars": len(md),
        "image_files_kept": len(counter["files"]),
        "mammoth_warnings": warnings[:20],  # cap to keep summary small
        "warning_count": len(warnings),
        "output_html": str(out_dir / "source.html"),
        "output_markdown": str(out_dir / "source.md"),
        "output_images_dir": str(images_dir),
    }
    (out_dir / "extraction.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return summary


def main() -> int:
    ap = argparse.ArgumentParser(description="Extract DOCX -> HTML + Markdown + images.")
    ap.add_argument("docx", type=Path, help="Input DOCX path")
    ap.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output directory (default: tmp/extract/<docx-stem>/)",
    )
    args = ap.parse_args()

    if not args.docx.is_file():
        print(f"[extract_docx] Not a file: {args.docx}", file=sys.stderr)
        return 2

    out_dir = args.out or Path("tmp/extract") / args.docx.stem
    summary = extract(args.docx, out_dir)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0 if (summary["markdown_chars"] or summary["image_files_kept"]) else 3


if __name__ == "__main__":
    sys.exit(main())
