"""Quick internal-link audit for bolok_plus HTML."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
href_re = re.compile(r"""href=["']([^"']+)["']""", re.I)
broken: list[tuple[str, str]] = []
checked = 0

for page in ROOT.rglob("*.html"):
    if "_deploy_proof" in page.parts:
        continue
    text = page.read_text(encoding="utf-8", errors="ignore")
    for href in href_re.findall(text):
        if href.startswith(("http://", "https://", "mailto:", "tel:", "#", "data:")):
            continue
        if href.startswith("//"):
            continue
        target = (page.parent / href.split("?")[0].split("#")[0]).resolve()
        checked += 1
        try:
            target.relative_to(ROOT)
        except ValueError:
            # outside site root (ok for rare cases)
            if not target.exists():
                broken.append((str(page.relative_to(ROOT)), href))
            continue
        if not target.exists():
            broken.append((str(page.relative_to(ROOT)), href))

print(f"checked={checked} broken={len(broken)}")
for src, href in broken[:40]:
    print(f"  {src} -> {href}")
