# -*- coding: utf-8 -*-
"""Expand Bolok education articles with original, source-checked copy (v35)."""
from __future__ import annotations

import re
from pathlib import Path

from _v35_mosh import ARTS as A_MOSH
from _v35_other import ARTS as A_OTHER

ROOT = Path(__file__).resolve().parent
EDU = ROOT / "education"
ARTS = {**A_MOSH, **A_OTHER}
MARKER = "bolok-deep-v35"
LONG = {
    "konkour/sabt-nam.html",
    "konkour/entekhab-reshte-tajrobi.html",
}


def esc(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def render(spec: dict, rel: str) -> str:
    up = "" if rel.count("/") == 1 else "../"
    root = "../" * (rel.count("/") + 1)
    parts = [
        f"<!-- {MARKER} -->",
        '<div class="callout callout--warn"><strong>مرجع رسمی</strong>'
        "<p>عدد، مهلت و ظرفیت فقط با اطلاعیه همان سال روی "
        '<a href="https://www.sanjesh.org" target="_blank" rel="noopener noreferrer">sanjesh.org</a>'
        " یا سامانه معرفی‌شده در همان اطلاعیه قطعی است. این صفحه راهنمای بلوک است، نه جایگزین دفترچه.</p></div>",
    ]
    for sid, title, paras, bullets in spec["sections"]:
        parts.append(f'<h2 id="{sid}">{esc(title)}</h2>')
        for p in paras:
            parts.append(f"<p>{p}</p>")
        if bullets:
            parts.append("<ul>")
            for b in bullets:
                parts.append(f"<li>{b}</li>")
            parts.append("</ul>")
    if spec.get("faq"):
        parts.append('<h2 id="faq">سوالات متداول</h2>')
        parts.append('<div class="faq">')
        for i, (q, a) in enumerate(spec["faq"]):
            op = " open" if i == 0 else ""
            parts.append(f"<details{op}><summary>{esc(q)}</summary><p>{a}</p></details>")
        parts.append("</div>")
    parts.append(
        '<div class="callout callout--tip"><strong>قدم بعدی در بلوک</strong>'
        f'<p>مهلت‌ها را به بلوک‌های تقویم تبدیل کنید و مطالعه واقعی را ثبت کنید: '
        f'<a href="{root}index.html#download">دانلود اپ بلوک</a>. '
        f'نقشه کل مطالب: <a href="{up}index.html">هاب کنکور</a>.</p></div>'
    )
    return "\n".join(parts)


def toc_html(spec: dict) -> str:
    items = [f'<li><a href="#{sid}">{esc(title)}</a></li>' for sid, title, *_ in spec["sections"]]
    if spec.get("faq"):
        items.append('<li><a href="#faq">سوالات متداول</a></li>')
    return "<ol>\n" + "\n".join(items) + "\n</ol>"


def words_of(html: str) -> int:
    text = re.sub(r"<[^>]+>", " ", html)
    return len(re.sub(r"\s+", " ", text).split())


def apply_one(rel: str, spec: dict) -> str:
    path = EDU / rel
    html = path.read_text(encoding="utf-8")
    if MARKER in html:
        return "already"
    m = re.search(r'(<article class="article-body[^"]*">)(.*?)(</article>)', html, re.S)
    if not m:
        return "no-article"
    body = m.group(2)
    idxs = [body.find(tok) for tok in (
        '<div class="share-row"',
        '<aside class="related-rail"',
        '<div class="article-cta-row"',
    ) if body.find(tok) != -1]
    cut = min(idxs) if idxs else len(body)
    suffix = body[cut:]
    fresh = render(spec, rel)
    if rel in LONG:
        new_body = body[:cut].rstrip() + "\n" + fresh + "\n" + suffix
    else:
        new_body = "\n" + fresh + "\n" + suffix
    html = html[: m.start(2)] + new_body + html[m.end(2) :]
    if rel not in LONG:
        html = re.sub(
            r'(<aside class="article-toc"[^>]*>\s*<h2>[^<]*</h2>\s*)<ol>.*?</ol>',
            lambda mm: mm.group(1) + toc_html(spec),
            html,
            count=1,
            flags=re.S,
        )
        lead = spec["lead"]
        html = re.sub(
            r'(<p class="edu-lead">).*?(</p>)',
            lambda mm: mm.group(1) + lead + mm.group(2),
            html,
            count=1,
            flags=re.S,
        )
        html = re.sub(
            r'(<meta name="description" content=").*?(")',
            lambda mm: mm.group(1) + lead[:220] + mm.group(2),
            html,
            count=1,
        )
        html = re.sub(
            r'(<meta property="og:description" content=").*?(")',
            lambda mm: mm.group(1) + lead[:220] + mm.group(2),
            html,
            count=1,
        )
        mins = max(5, words_of(fresh) // 160)
        html = re.sub(r"زمان مطالعه:\s*[^<]+", f"زمان مطالعه: {mins} دقیقه", html, count=1)
    html = html.replace('"dateModified": "2026-10-25"', '"dateModified": "2026-10-26"')
    html = html.replace("به‌روزرسانی: 2026-10-25", "به‌روزرسانی: 2026-10-26")
    path.write_text(html, encoding="utf-8", newline="\n")
    return "append" if rel in LONG else "replace"


def main() -> None:
    missing = []
    stats = {"replace": 0, "append": 0, "already": 0, "no-article": 0}
    for p in EDU.rglob("*.html"):
        rel = str(p.relative_to(EDU)).replace("\\", "/")
        text = p.read_text(encoding="utf-8")
        if '<article class="article-body' not in text:
            continue
        spec = ARTS.get(rel)
        if not spec:
            missing.append(rel)
            continue
        stats[apply_one(rel, spec)] += 1
    print(stats)
    print("missing", len(missing))
    for rel in missing:
        print("MISSING", rel)


if __name__ == "__main__":
    main()
