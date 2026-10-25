# -*- coding: utf-8 -*-
"""Fix root-relative asset paths in moshavere article pages (depth 3)."""
from pathlib import Path
import re

DIR = Path(__file__).resolve().parent / "education" / "konkour" / "moshavere"
SKIP = {"index.html", "page-2.html", "page-3.html", "page-4.html"}

# ../../X → ../../../X for root assets only (not ../konkour siblings)
ROOT_TARGETS = (
    "assets/",
    "styles.css",
    "app.js",
    "site.webmanifest",
    "index.html",
    "about.html",
    "search.html",
    "privacy.html",
    "terms.html",
)

def needs_root(path: str) -> bool:
    return any(path.startswith(t) or path == t for t in ROOT_TARGETS) or path.startswith("index.html#")


def fix_html(text: str) -> str:
    def repl_href(m):
        q = m.group(1)
        url = m.group(2)
        if url.startswith("../../") and not url.startswith("../../../"):
            rest = url[6:]
            if needs_root(rest):
                return f"href={q}../../../{rest}{q}"
        return m.group(0)

    def repl_src(m):
        q = m.group(1)
        url = m.group(2)
        if url.startswith("../../") and not url.startswith("../../../"):
            rest = url[6:]
            if needs_root(rest):
                return f"src={q}../../../{rest}{q}"
        return m.group(0)

    text = re.sub(r'href=(["\'])([^"\']+)\1', repl_href, text)
    text = re.sub(r'src=(["\'])([^"\']+)\1', repl_src, text)
    # cache bump for listing consistency
    text = re.sub(r"\?v=\d+", "?v=14", text)
    return text


def main() -> None:
    n = 0
    for path in DIR.glob("*.html"):
        if path.name in SKIP:
            continue
        raw = path.read_text(encoding="utf-8")
        fixed = fix_html(raw)
        if fixed != raw:
            path.write_text(fixed, encoding="utf-8")
            n += 1
    print(f"fixed {n} article pages")


if __name__ == "__main__":
    main()
