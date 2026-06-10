"""Assemble public/manual-usuario.html from layout + content fragments."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANUAL_DIR = Path(__file__).resolve().parent / "manual"
LAYOUT_PATH = MANUAL_DIR / "layout.html"
CONTENT_PATH = MANUAL_DIR / "content.html"
OUTPUT_PATH = ROOT / "public" / "manual-usuario.html"
CONTENT_MARKER = "<!-- CONTENT -->"


def build_manual_html() -> str:
    layout = LAYOUT_PATH.read_text(encoding="utf-8")
    content = CONTENT_PATH.read_text(encoding="utf-8").strip()

    if CONTENT_MARKER not in layout:
        raise ValueError(f"Layout must contain {CONTENT_MARKER}")

    return layout.replace(CONTENT_MARKER, content, 1)


def main() -> None:
    OUTPUT_PATH.write_text(build_manual_html(), encoding="utf-8")
    print(f"Generated {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
