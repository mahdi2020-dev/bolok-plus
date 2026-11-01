# -*- coding: utf-8 -*-
"""Generate resources hub + kind pages + item shell."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent
SITE = ROOT.parent
V = "36"

KINDS = [
    ("official_textbook", "کتاب درسی", "text"),
    ("book", "کتاب کمک‌آموزشی", "text"),
    ("professor_notes", "جزوات", "text"),
    ("exam_analysis", "تحلیل آزمون", "text"),
    ("reference", "رفرنس", "text"),
    ("flashcards", "فلش‌کارت", "text"),
    ("video", "ویدیو / کلاس", "video"),
    ("self_exam", "خود آزمون", "online"),
    ("platform", "پلتفرم", "online"),
]

FAMILIES = [
    ("text", "کتبی", "کتاب درسی، کمک‌آموزشی، جزوه و …"),
    ("video", "ویدیو / کلاس", "جلسات ویدیویی و کلاس‌ها"),
    ("online", "تمرین و آزمون", "خودآزمون و پلتفرم"),
]


def shell(title: str, description: str, body: str, extra_js: str = "") -> str:
    return f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0c0e12" />
  <meta name="description" content="{description}" />
  <title>{title} | بلوک</title>
  <link rel="canonical" href="https://bolokapp.ir/resources/" />
  <link rel="icon" href="../assets/bolok-logo.svg?v={V}" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../styles.css?v={V}" />
  <script src="../site-api.js?v={V}" defer></script>
  <script src="../catalog-menu.js?v={V}" defer></script>
  <script src="../app.js?v={V}" defer></script>
  {extra_js}
</head>
<body>
  <a class="skip-link" href="#main">پرش به محتوا</a>
{HEADER}
  <main id="main" class="container">
{body}
  </main>
  <footer class="site-footer container" style="padding:2rem 0;text-align:center;color:#64748b;font-size:0.85rem">
    <p><a href="../index.html">بلوک</a> · منابع کمک‌آموزشی از بانک منابع اپ</p>
  </footer>
</body>
</html>
"""


# Import header builder
import sys

sys.path.insert(0, str(SITE))
from _header_catalog_v36 import build_header  # noqa: E402

HEADER = build_header("../")


def hub() -> str:
    cards = "\n".join(
        f'''      <a class="family-card" id="{fid}" href="#{fid}">
        <h2>{title}</h2>
        <p>{desc}</p>
      </a>'''
        for fid, title, desc in FAMILIES
    )
    chips = "\n".join(
        f'      <a href="{kind}.html">{title}</a>' for kind, title, _ in KINDS
    )
    body = f"""    <section class="resources-hero">
      <h1>منابع کمک‌آموزشی</h1>
      <p>منابع منتشرشده از بانک منابع اپ بلوک — همان سه دسته کتبی، ویدیو/کلاس و تمرین و آزمون.</p>
    </section>
    <div class="family-grid">
{cards}
    </div>
    <div class="kind-chips">
{chips}
    </div>
    <div id="resource-live" class="resource-grid" data-resources-home></div>
    <p id="resource-status" class="cat-empty">در حال بارگذاری منابع…</p>
"""
    extra = f'<script src="resources.js?v={V}" defer></script>'
    return shell("منابع کمک‌آموزشی", "منابع منتشرشده بانک منابع بلوک", body, extra)


def kind_page(kind: str, title: str) -> str:
    chips = "\n".join(
        f'      <a href="{k}.html" class="{"is-active" if k == kind else ""}">{t}</a>'
        for k, t, _ in KINDS
    )
    body = f"""    <section class="resources-hero">
      <h1>{title}</h1>
      <p>منابع منتشرشده از نوع «{title}» در بانک منابع بلوک.</p>
    </section>
    <div class="kind-chips">
      <a href="index.html">همه</a>
{chips}
    </div>
    <div class="resource-grid" data-resources-kind="{kind}"></div>
    <p id="resource-status" class="cat-empty">در حال بارگذاری…</p>
"""
    extra = f'<script src="resources.js?v={V}" defer></script>'
    return shell(title, f"منابع {title} در بلوک", body, extra)


def item_page() -> str:
    body = """    <section class="resources-hero">
      <h1>جزئیات منبع</h1>
      <p>اطلاعات منبع منتشرشده از بانک منابع اپ.</p>
    </section>
    <div class="resource-detail" data-resource-item>
      <p class="cat-empty">در حال بارگذاری…</p>
    </div>
"""
    extra = f'<script src="resources.js?v={V}" defer></script>'
    return shell("جزئیات منبع", "جزئیات منبع کمک‌آموزشی بلوک", body, extra)


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    (ROOT / "index.html").write_text(hub(), encoding="utf-8", newline="\n")
    for kind, title, _ in KINDS:
        (ROOT / f"{kind}.html").write_text(
            kind_page(kind, title), encoding="utf-8", newline="\n"
        )
    (ROOT / "item.html").write_text(item_page(), encoding="utf-8", newline="\n")
    print("resources pages written")


if __name__ == "__main__":
    main()
