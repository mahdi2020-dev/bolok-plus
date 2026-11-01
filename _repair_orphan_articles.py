# -*- coding: utf-8 -*-
"""Rebuild wiped education article bodies from v35 specs or head meta/FAQ."""
from __future__ import annotations

import json
import re
from pathlib import Path

from _v35_apply import render, toc_html
from _v35_mosh import ARTS as A_MOSH
from _v35_other import ARTS as A_OTHER

ROOT = Path(__file__).resolve().parent
EDU = ROOT / "education"
ARTS = {**A_MOSH, **A_OTHER}
MARKER = "bolok-repair-v43"


def esc(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def is_orphan(html: str) -> bool:
    if re.search(r"<article[^>]*>", html):
        return False
    return "article-cta-row" in html or "</article>" in html


def extract_title(html: str) -> str:
    m = re.search(r"<title>(.*?)</title>", html, re.S)
    if not m:
        return "مقاله آموزشی"
    title = re.sub(r"\s*[·|].*$", "", m.group(1)).strip()
    return title or "مقاله آموزشی"


def extract_desc(html: str) -> str:
    m = re.search(
        r'<meta\s+name="description"\s+content="([^"]*)"',
        html,
        re.I,
    )
    return (m.group(1).strip() if m else "") or "راهنمای آموزشی بلوک برای مسیر کنکور و انتخاب رشته."


def extract_faq(html: str) -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    for block in re.findall(
        r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>',
        html,
        re.S,
    ):
        if "FAQPage" not in block:
            continue
        try:
            data = json.loads(block)
        except Exception:
            continue
        for item in data.get("mainEntity") or []:
            if not isinstance(item, dict):
                continue
            q = str(item.get("name") or "").strip()
            ans = item.get("acceptedAnswer") or {}
            a = str(ans.get("text") or "").strip() if isinstance(ans, dict) else ""
            if q and a:
                out.append((q, a))
    return out[:12]


def prefix_depth(rel: str) -> str:
    return "../" * (rel.count("/") + 1)


def hub_href(rel: str) -> str:
    if "/moshavere/" in rel:
        return "index.html"
    if "/gheyr-entefaee/" in rel:
        return "index.html"
    if "/arshad/" in rel:
        return "index.html"
    return "index.html"


def build_main(rel: str, title: str, lead: str, body_html: str, toc: str, cta_html: str) -> str:
    root = prefix_depth(rel)
    return f"""
  <main id="main" class="container">
    <div class="edu-hero">
      <a class="back-home" href="{hub_href(rel)}">→ بازگشت</a>
      <p class="edu-kicker">مطالب آموزشی بلوک</p>
      <h1>{esc(title)}</h1>
      <p class="edu-lead">{esc(lead)}</p>
      <p class="article-meta"><span>به‌روزرسانی: 2026-11-01</span><span>نویسنده: بلوک</span></p>
    </div>
    <div class="article-layout">
      <aside class="article-toc" aria-label="فهرست">
        <h2>فهرست</h2>
        {toc}
      </aside>
      <article class="article-body">
        <!-- {MARKER} -->
{body_html}
{cta_html}
      </article>
    </div>
  </main>
"""


def default_cta(rel: str) -> str:
    root = prefix_depth(rel)
    if "/moshavere/" in rel:
        return f"""        <div class="article-cta-row">
          <a class="btn btn-primary" href="index.html">همه مطالب مشاوره</a>
          <a class="btn btn-ghost" href="../index.html">هاب کنکور</a>
          <a class="btn btn-ghost" href="{root}index.html#download" data-download-open>دانلود بلوک</a>
        </div>"""
    return f"""        <div class="article-cta-row">
          <a class="btn btn-ghost" href="https://www.sanjesh.org" target="_blank" rel="noopener noreferrer">سایت سنجش</a>
          <a class="btn btn-ghost" href="{hub_href(rel)}">هاب کنکور</a>
          <a class="btn btn-primary" href="{root}index.html#download" data-download-open>دانلود اپ بلوک</a>
        </div>"""


def body_from_meta(title: str, desc: str, faq: list[tuple[str, str]]) -> tuple[str, str, str]:
    lead = desc[:280]
    sections = [
        (
            "overview",
            "جمع‌بندی سریع",
            [desc, "جزئیات عددی و مهلت‌ها را فقط از اطلاعیه رسمی سازمان سنجش روی sanjesh.org قطعی کنید."],
            ["اطلاعیه رسمی را ذخیره کنید", "مهلت و سامانه را با دفترچه همان سال چک کنید"],
        )
    ]
    for i, (q, a) in enumerate(faq[:6]):
        sections.append((f"faq-{i+1}", q, [a], []))
    spec = {"lead": lead, "sections": sections, "faq": faq}
    # Minimal render without importing full apply path for fake rel
    parts = [
        '<div class="callout callout--warn"><strong>مرجع رسمی</strong>'
        "<p>عدد و مهلت فقط با اطلاعیه همان سال سنجش قطعی است. این صفحه راهنمای بلوک است.</p></div>"
    ]
    for sid, stitle, paras, bullets in sections:
        parts.append(f'<h2 id="{sid}">{esc(stitle)}</h2>')
        for p in paras:
            parts.append(f"<p>{esc(p)}</p>")
        if bullets:
            parts.append("<ul>")
            for b in bullets:
                parts.append(f"<li>{esc(b)}</li>")
            parts.append("</ul>")
    if faq:
        parts.append('<h2 id="faq">سوالات متداول</h2><div class="faq">')
        for i, (q, a) in enumerate(faq):
            op = " open" if i == 0 else ""
            parts.append(f"<details{op}><summary>{esc(q)}</summary><p>{esc(a)}</p></details>")
        parts.append("</div>")
    toc_items = [f'<li><a href="#{sid}">{esc(stitle)}</a></li>' for sid, stitle, *_ in sections]
    if faq:
        toc_items.append('<li><a href="#faq">سوالات متداول</a></li>')
    toc = "<ol>\n" + "\n".join(toc_items) + "\n</ol>"
    return lead, "\n".join(parts), toc


def repair_one(path: Path) -> str:
    rel = str(path.relative_to(EDU)).replace("\\", "/")
    html = path.read_text(encoding="utf-8")
    if not is_orphan(html):
        return "skip"
    if MARKER in html and re.search(r"<article[^>]*>", html):
        return "already"

    aside_end = html.find("</aside>")
    if aside_end < 0:
        return "no-aside"
    aside_end += len("</aside>")

    footer_i = html.find('<footer')
    if footer_i < 0:
        footer_i = html.find("</body>")
    if footer_i < 0:
        return "no-footer"

    # Prefer leftover CTA markup if present
    cta_m = re.search(r'<div class="article-cta-row">.*?</div>', html[aside_end:footer_i], re.S)
    cta_html = cta_m.group(0) if cta_m else default_cta(rel)

    title = extract_title(html)
    spec = ARTS.get(rel)
    if spec:
        lead = spec["lead"]
        body_html = render(spec, rel)
        toc = toc_html(spec)
    else:
        lead, body_html, toc = body_from_meta(title, extract_desc(html), extract_faq(html))

    main = build_main(rel, title, lead, body_html, toc, cta_html)
    new_html = html[:aside_end] + "\n" + main + "\n  " + html[footer_i:]
    # Drop orphan closers that may precede footer in original slice (already replaced)
    path.write_text(new_html, encoding="utf-8", newline="\n")
    return "repaired-arts" if spec else "repaired-meta"


def main() -> None:
    stats: dict[str, int] = {}
    for path in sorted(EDU.rglob("*.html")):
        status = repair_one(path)
        stats[status] = stats.get(status, 0) + 1
        if status.startswith("repaired"):
            print(status, path.relative_to(EDU))
    print(stats)


if __name__ == "__main__":
    main()
