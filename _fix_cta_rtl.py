# -*- coding: utf-8 -*-
"""Bump cache to v20 after CTA/RTL fix."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
n = 0
for path in ROOT.rglob("*.html"):
    if any(p.startswith("_") for p in path.relative_to(ROOT).parts):
        continue
    text = path.read_text(encoding="utf-8")
    new = re.sub(r"\?v=\d+", "?v=20", text)
    if new != text:
        path.write_text(new, encoding="utf-8")
        n += 1
print(f"bumped {n} pages to v=20")
