# -*- coding: utf-8 -*-
import pathlib, re
root = pathlib.Path(__file__).resolve().parent / "education"
rows = []
for p in root.rglob("*.html"):
    t = p.read_text(encoding="utf-8")
    m = re.search(r'<article class="article-body[^"]*">(.*?)</article>', t, re.S)
    if not m:
        rows.append((None, str(p.relative_to(root)).replace("\\", "/"), ""))
        continue
    body = m.group(1)
    cut = re.split(r'<div class="share-row"', body)[0]
    text = re.sub(r"<[^>]+>", " ", cut)
    text = re.sub(r"\s+", " ", text).strip()
    h = re.search(r"<h1>(.*?)</h1>", t, re.S)
    title = re.sub(r"<[^>]+>", "", h.group(1)).strip() if h else ""
    rows.append((len(text.split()), str(p.relative_to(root)).replace("\\", "/"), title))
rows.sort(key=lambda r: (r[0] is None, r[0] or 0))
out = pathlib.Path(__file__).resolve().parent / "_len_out.txt"
lines = [f"files {len(rows)} no-article {sum(1 for w,_,_ in rows if w is None)}"]
for w, n, title in rows:
    lines.append(f"{str(w):5} {n} | {title}")
out.write_text("\n".join(lines), encoding="utf-8")
print("wrote", len(lines))
