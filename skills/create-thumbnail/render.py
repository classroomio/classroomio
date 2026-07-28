#!/usr/bin/env python3
"""Render a ClassroomIO thumbnail HTML to a 1920x1080 PNG via headless Chrome.

Resolves the two stable brand assets from the repo and inlines them as base64
so the render is deterministic (a Google Fonts <link> does NOT load before the
screenshot — that is the #1 cause of off-brand headlines). Third-party logos are
NOT handled here: fetch the official svg per task and inline it in your HTML.

Placeholders replaced in the HTML before rendering:
  __GEIST_WOFF2_B64__   -> apps/dashboard/static/fonts/geist/geist-latin.woff2
  __CIO_LOGO_B64__      -> apps/website/static/logo-512.png

Usage:
  python3 render.py <input.html> <output.png>
"""
import base64
import pathlib
import re
import subprocess
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
GEIST = REPO_ROOT / "apps/dashboard/static/fonts/geist/geist-latin.woff2"
CIO_LOGO = REPO_ROOT / "apps/website/static/logo-512.png"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def b64(path: pathlib.Path) -> str:
    if not path.exists():
        sys.exit(f"Missing brand asset: {path}")

    return base64.b64encode(path.read_bytes()).decode()


def inline_local_stylesheets(html: str, base_dir: pathlib.Path) -> str:
    """Replace <link rel="stylesheet" href="local.css"> with an inline <style>
    so placeholders inside the CSS also get substituted."""
    pattern = re.compile(r'<link[^>]*rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\'][^>]*>')

    def replace(match: "re.Match[str]") -> str:
        href = match.group(1)
        if href.startswith(("http://", "https://", "//")):
            return match.group(0)

        css_path = (base_dir / href).resolve()
        if not css_path.exists():
            sys.exit(f"Linked stylesheet not found: {css_path}")

        return f"<style>\n{css_path.read_text()}\n</style>"

    return pattern.sub(replace, html)


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit("Usage: python3 render.py <input.html> <output.png>")

    src = pathlib.Path(sys.argv[1]).resolve()
    out = pathlib.Path(sys.argv[2]).resolve()
    if not src.exists():
        sys.exit(f"Input HTML not found: {src}")

    html = src.read_text()
    html = inline_local_stylesheets(html, src.parent)
    html = html.replace("__GEIST_WOFF2_B64__", b64(GEIST))
    html = html.replace("__CIO_LOGO_B64__", b64(CIO_LOGO))

    inlined = src.with_suffix(".inlined.html")
    inlined.write_text(html)

    subprocess.run(
        [
            CHROME,
            "--headless",
            "--disable-gpu",
            "--hide-scrollbars",
            "--force-device-scale-factor=1",
            "--window-size=1920,1080",
            f"--screenshot={out}",
            f"file://{inlined}",
        ],
        check=True,
    )
    print(f"Rendered {out}")


if __name__ == "__main__":
    main()
