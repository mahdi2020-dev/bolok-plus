# -*- coding: utf-8 -*-
"""Legacy one-shot header force — uses SAFE shell regex only (never swallow main/article)."""
from __future__ import annotations

from _header_catalog_v36 import (
    ROOT,
    SHELL_RE,
    HEADER_RE,
    OVERLAY_RE,
    build_header,
    ensure_scripts,
    prefix_for,
)


def main() -> None:
    fixed = 0
    for page in sorted(ROOT.rglob("*.html")):
        if "_deploy_proof" in page.parts:
            continue
        text = page.read_text(encoding="utf-8")
        if "site-header--v36" not in text and "site-header" not in text:
            continue
        needs = (
            "header-phone" not in text
            or "data-catalog-panel" not in text
            or "data-announce" not in text
        )
        p = prefix_for(page)
        if not needs:
            t2 = ensure_scripts(text, p)
            if t2 != text:
                page.write_text(t2, encoding="utf-8", newline="\n")
                fixed += 1
            continue
        text2 = OVERLAY_RE.sub("", text)
        new_header = build_header(p).rstrip() + "\n"
        if SHELL_RE.search(text2):
            text2 = SHELL_RE.sub(new_header, text2, count=1)
        elif HEADER_RE.search(text2):
            text2 = HEADER_RE.sub(new_header.rstrip(), text2, count=1)
        else:
            print("NO MATCH", page.relative_to(ROOT))
            continue
        text2 = ensure_scripts(text2, p)
        if "header-phone" not in text2:
            print("STILL BAD", page.relative_to(ROOT))
            continue
        page.write_text(text2, encoding="utf-8", newline="\n")
        fixed += 1
        print("fixed", page.relative_to(ROOT))
    print("total fixed", fixed)


if __name__ == "__main__":
    main()
