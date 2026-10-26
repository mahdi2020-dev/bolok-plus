# -*- coding: utf-8 -*-
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
pages = [
    "education/konkour/sabt-nam.html",
    "education/konkour/zaman-sabt-nam.html",
    "education/konkour/entekhab-reshte-1405.html",
    "education/konkour/nahve-sabt-nam.html",
    "education/konkour/sharayet-ekhtesasi.html",
    "education/konkour/elam-natayej-1405.html",
    "education/konkour/index.html",
    "education/konkour/tasir-moadel-1405.html",
]
for p in pages:
    t = (ROOT / p).read_text(encoding="utf-8")
    body = re.search(r"<main[\s\S]*?</main>", t)
    text = re.sub(r"<[^>]+>", " ", body.group(0) if body else t)
    words = len(re.findall(r"\S+", text))
    title = re.search(r"<title>(.*?)</title>", t)
    print(f"{words:5d}  {p}  | {(title.group(1)[:70] if title else '?')}")

cands = [
    "taghirat",
    "virayesh",
    "site-sanjesh",
    "kart-vorod",
    "hazfiyat",
    "takhmin",
    "karname",
    "termim",
    "site-entekhab",
]
for c in cands:
    hits = list((ROOT / "education").rglob(f"*{c}*"))
    print(c, "EXISTS" if hits else "MISSING", [h.name for h in hits[:3]])
