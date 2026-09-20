#!/usr/bin/env python3
"""Render a brand-system asset to PNG via headless Chrome.

Inlines local stylesheets (including their @import chain) and embeds Geist and the
ClassroomIO logo as base64, so a render never races a webfont request — the single
most common cause of an asset rendering in a fallback face.

Usage:
  python3 render.py <input.html[?params]> <output.png> [WIDTHxHEIGHT]

The operator HUD is always hidden in a render. Params on the input select state:
  python3 render.py "examples/thumb-mobile.html?theme=dark" out.png 1080x1920
  python3 render.py "08b-learning-paths.html?beat=3" out.png

Size defaults to the stage's data-w/data-h when present, else 1920x1080.
"""
import base64
import pathlib
import re
import subprocess
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
GEIST = REPO_ROOT / "apps/dashboard/static/fonts/geist/geist-latin.woff2"
LOGO = REPO_ROOT / "apps/website/static/logo-512.png"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

LINK = re.compile(r'<link[^>]*rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\'][^>]*>')
IMPORT = re.compile(r'@import\s+url\(([\'"]?)([^\'")]+)\1\);')
STAGE_SIZE = re.compile(r'data-w=["\'](\d+)["\']\s+data-h=["\'](\d+)["\']')


def b64(path: pathlib.Path) -> str:
    if not path.exists():
        sys.exit(f"Missing asset: {path}")

    return base64.b64encode(path.read_bytes()).decode()


def inline_css(text: str, base_dir: pathlib.Path) -> str:
    """Resolve @import chains so Chrome never has to fetch a stylesheet."""

    def replace(match: "re.Match[str]") -> str:
        href = match.group(2)
        if href.startswith(("http://", "https://", "//")):
            return match.group(0)

        path = (base_dir / href).resolve()
        if not path.exists():
            sys.exit(f"@import not found: {path}")

        return inline_css(path.read_text(), path.parent)

    return IMPORT.sub(replace, text)


def inline_stylesheets(html: str, base_dir: pathlib.Path) -> str:
    def replace(match: "re.Match[str]") -> str:
        href = match.group(1)
        if href.startswith(("http://", "https://", "//")):
            return ""

        path = (base_dir / href).resolve()
        if not path.exists():
            sys.exit(f"Stylesheet not found: {path}")

        return f"<style>\n{inline_css(path.read_text(), path.parent)}\n</style>"

    return LINK.sub(replace, html)


def main() -> None:
    if len(sys.argv) not in (3, 4):
        sys.exit(__doc__)

    target, _, query = sys.argv[1].partition("?")
    src = pathlib.Path(target).resolve()
    out = pathlib.Path(sys.argv[2]).resolve()
    if not src.exists():
        sys.exit(f"Input HTML not found: {src}")

    html = src.read_text()

    if len(sys.argv) == 4:
        width, height = sys.argv[3].lower().split("x")
    else:
        found = STAGE_SIZE.search(html)
        width, height = found.groups() if found else ("1920", "1080")

    html = inline_stylesheets(html, src.parent)
    html = html.replace("__GEIST_WOFF2_B64__", b64(GEIST))
    html = html.replace("__CIO_LOGO_B64__", b64(LOGO))

    font = (
        "<style>@font-face{font-family:'Geist';font-style:normal;font-weight:100 900;"
        f"font-display:block;src:url(data:font/woff2;base64,{b64(GEIST)}) format('woff2');}}</style>"
    )
    html = html.replace("</head>", font + "</head>", 1)

    inlined = src.with_suffix(".inlined.html")
    inlined.write_text(html)

    try:
        subprocess.run(
            [
                CHROME,
                "--headless",
                "--disable-gpu",
                "--hide-scrollbars",
                "--force-device-scale-factor=1",
                f"--window-size={width},{height}",
                f"--screenshot={out}",
                f"file://{inlined}?clean=1" + (f"&{query}" if query else ""),
            ],
            check=True,
            capture_output=True,
        )
    finally:
        inlined.unlink(missing_ok=True)

    print(f"Rendered {out} at {width}x{height}" + (f" ({query})" if query else ""))


if __name__ == "__main__":
    main()
