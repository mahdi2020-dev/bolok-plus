# -*- coding: utf-8 -*-
"""سایر مقالات کنکور — polished article-feed listing (Bolok brand)."""
from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parent
KONKOUR = ROOT / "education" / "konkour"
OUT = KONKOUR / "maghalat.html"
BASE = "https://bolokapp.ir"
V = "21"
R = "../../"
TODAY = "2026-10-25"

# (anchor, group title, slugs in order)
GROUPS: list[tuple[str, str, list[str]]] = [
    ("sabt-nam", "ثبت‌نام کنکور سراسری", [
        "sabt-nam", "zaman-sabt-nam", "nahve-sabt-nam", "sharayet-ekhtesasi",
    ]),
    ("entekhab", "انتخاب رشته و نتایج", [
        "entekhab-reshte-1405", "elam-natayej-1405", "eslahiye-daftarche",
        "narmafzar-entekhab-reshte", "behtarin-reshte-ensani",
    ]),
    ("moshavere", "مشاوره و سوابق تحصیلی", [
        "tasir-moadel-1405", "barname-1406", "shahriye-pardis", "rad-medu",
    ]),
    ("azad", "دانشگاه آزاد", [
        "azad-1405", "azad-nahve", "azad-shenase",
    ]),
]

THEMES = {
    "sabt-nam": "docs", "zaman-sabt-nam": "card", "nahve-sabt-nam": "docs",
    "sharayet-ekhtesasi": "exam", "entekhab-reshte-1405": "chart",
    "elam-natayej-1405": "exam", "eslahiye-daftarche": "paper",
    "narmafzar-entekhab-reshte": "chart", "behtarin-reshte-ensani": "uni",
    "tasir-moadel-1405": "docs", "barname-1406": "path",
    "shahriye-pardis": "card", "rad-medu": "uni",
    "azad-1405": "uni", "azad-nahve": "path", "azad-shenase": "card",
}

PICKS = [
    ("sabt-nam.html", "ثبت نام کنکور سراسری", "docs"),
    ("zaman-sabt-nam.html", "زمان ثبت نام کنکور", "card"),
    ("eslahiye-daftarche.html", "اصلاحیه دفترچه انتخاب رشته", "paper"),
    ("rad-medu.html", "سامانه راد مدیو", "uni"),
    ("moshavere/index.html", "مشاوره کنکور سراسری", "path"),
]


def meta_of(slug: str) -> tuple[str, str]:
    path = KONKOUR / f"{slug}.html"
    text = path.read_text(encoding="utf-8", errors="ignore")
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", text, re.S)
    title = re.sub(r"<[^>]+>", "", h1.group(1)).strip() if h1 else slug
    d = re.search(r'<meta name="description" content="([^"]*)"', text)
    desc = d.group(1).strip() if d else ""
    if len(desc) > 150:
        desc = desc[:147].rstrip() + "…"
    return title, desc


def thumb(theme: str) -> str:
    return f'<span class="feed-thumb feed-thumb--photo feed-thumb--{theme}" aria-hidden="true"><i></i><b></b></span>'


def main() -> None:
    groups_html = ""
    itemlist: list[dict] = []
    pos = 0
    total_count = 0
    for anchor, gtitle, slugs in GROUPS:
        cards = ""
        for slug in slugs:
            title, desc = meta_of(slug)
            total_count += 1
            pos += 1
            itemlist.append({
                "@type": "ListItem", "position": pos, "name": title,
                "url": f"{BASE}/education/konkour/{slug}.html",
            })
            cards += f"""          <li>
            <a class="feed-card" href="{slug}.html">
              <div class="feed-card-body">
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
              {thumb(THEMES.get(slug, 'docs'))}
            </a>
          </li>
"""
        groups_html += f"""      <section class="mag-group" id="{anchor}" aria-labelledby="g-{anchor}">
        <h2 id="g-{anchor}" class="mag-group-title"><span class="title-mark" aria-hidden="true"></span> {gtitle}</h2>
        <ul class="feed-list feed-list--cards">
{cards}        </ul>
      </section>
"""

    picks = "".join(
        f'<li><a class="side-pick" href="{href}">{thumb(theme)}<span>{t}</span></a></li>'
        for href, t, theme in PICKS
    )

    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "name": "سایر مقالات کنکور سراسری",
                "description": "فهرست کامل راهنماهای کنکور سراسری بلوک: ثبت‌نام، زمان‌بندی، انتخاب رشته، مشاوره، سوابق و دانشگاه آزاد.",
                "url": f"{BASE}/education/konkour/maghalat.html",
                "inLanguage": "fa-IR",
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "خانه", "item": f"{BASE}/"},
                    {"@type": "ListItem", "position": 2, "name": "مطالب آموزشی", "item": f"{BASE}/education/index.html"},
                    {"@type": "ListItem", "position": 3, "name": "کنکور سراسری", "item": f"{BASE}/education/konkour/index.html"},
                    {"@type": "ListItem", "position": 4, "name": "سایر مقالات", "item": f"{BASE}/education/konkour/maghalat.html"},
                ],
            },
            {"@type": "ItemList", "name": "مقالات کنکور سراسری", "itemListElement": itemlist},
        ],
    }

    html = f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0c0e12" />
  <meta name="description" content="سایر مقالات کنکور سراسری در بلوک؛ فهرست کامل راهنماهای ثبت‌نام، زمان‌بندی، شرایط، انتخاب رشته، مشاوره، سوابق تحصیلی و دانشگاه آزاد با خلاصه هر مقاله." />
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large" />
  <link rel="canonical" href="{BASE}/education/konkour/maghalat.html" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="fa_IR" />
  <meta property="og:site_name" content="بلوک" />
  <meta property="og:title" content="سایر مقالات کنکور سراسری" />
  <meta property="og:description" content="فهرست کامل راهنماهای کنکور سراسری بلوک با عنوان و خلاصه هر مقاله." />
  <meta property="og:url" content="{BASE}/education/konkour/maghalat.html" />
  <meta property="og:image" content="{BASE}/assets/bolok-logo.png" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:image" content="{BASE}/assets/bolok-logo.png" />
  <title>سایر مقالات کنکور سراسری · بلوک</title>
  <link rel="icon" href="{R}assets/bolok-logo.svg?v={V}" type="image/svg+xml" />
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="{R}styles.css?v={V}" />
  <link rel="manifest" href="{R}site.webmanifest" />
  <script src="{R}app.js?v={V}" defer></script>
  <script type="application/ld+json">
  {json.dumps(ld, ensure_ascii=False)}
  </script>
</head>
<body>
  <a class="skip-link" href="#main">پرش به محتوا</a>
  <div class="read-progress" data-read-progress aria-hidden="true"></div>
  <div class="aurora" aria-hidden="true"></div>
  <div class="dot-grid" aria-hidden="true"></div>
  <div class="grain" aria-hidden="true"></div>
  <header class="site-header">
    <div class="container inner">
      <a class="brand" href="{R}index.html">
        <img class="brand-logo" src="{R}assets/bolok-logo.svg?v={V}" alt="بلوک" width="36" height="36" />
        <span>بلوک</span>
      </a>
      <nav class="nav" aria-label="اصلی">
        <a href="index.html">هاب کنکور</a>
        <a href="sabt-nam.html">ثبت‌نام</a>
        <a href="moshavere/index.html">مشاوره</a>
        <a href="{R}search.html">جستجو</a>
        <a href="{R}about.html">درباره</a>
      </nav>
      <div class="header-actions">
        <a class="header-search" href="{R}search.html" aria-label="جستجو">جستجو</a>
        <a class="btn btn-primary header-cta" href="{R}index.html#download">دانلود اپ</a>
        <button class="nav-toggle" type="button" data-nav-toggle aria-label="منو"><span></span></button>
      </div>
    </div>
    <div class="nav-drawer" data-nav-drawer>
      <a href="index.html">هاب کنکور</a>
      <a href="maghalat.html">سایر مقالات</a>
      <a href="moshavere/index.html">مشاوره کنکور</a>
      <a href="{R}index.html">خانه</a>
    </div>
  </header>
  <main id="main" class="container edu-wrap portal-page">
    <div class="edu-hero edu-hero--portal">
      <nav class="breadcrumb" aria-label="مسیر">
        <a href="{R}index.html">خانه</a><span aria-hidden="true">/</span>
        <a href="{R}education/index.html">مطالب آموزشی</a><span aria-hidden="true">/</span>
        <a href="index.html">کنکور سراسری</a><span aria-hidden="true">/</span>
        <span>سایر مقالات</span>
      </nav>
      <h1><span class="title-mark" aria-hidden="true"></span> سایر مقالات کنکور سراسری</h1>
      <p class="edu-lead">همه راهنماهای کنکور بلوک یکجا؛ هر کارت عنوان و خلاصه دارد تا سریع به مقاله درست برسید. از ثبت‌نام و زمان‌بندی تا انتخاب رشته، سوابق و آزاد.</p>
      <div class="stat-pills">
        <span class="stat-pill">{total_count} راهنما</span>
        <span class="stat-pill stat-pill--ghost">ثبت‌نام</span>
        <span class="stat-pill stat-pill--ghost">انتخاب رشته</span>
        <span class="stat-pill stat-pill--ghost">مشاوره و سوابق</span>
        <span class="stat-pill stat-pill--ghost">دانشگاه آزاد</span>
      </div>
      <nav class="mag-jump" aria-label="پرش به بخش">
        <a href="#sabt-nam">ثبت‌نام</a>
        <a href="#entekhab">انتخاب رشته</a>
        <a href="#moshavere">مشاوره و سوابق</a>
        <a href="#azad">دانشگاه آزاد</a>
      </nav>
    </div>
    <div class="portal-layout">
      <div class="portal-main">
{groups_html}      </div>
      <aside class="portal-aside" aria-label="ستون کناری">
        <div class="side-box side-box--picks">
          <h2><span class="side-mark" aria-hidden="true"></span> مقالات منتخب</h2>
          <ul class="side-pick-list">{picks}</ul>
        </div>
        <div class="side-box">
          <h2>بخش‌های تخصصی</h2>
          <ul>
            <li><a href="moshavere/index.html">مشاوره کنکور (۴۰ راهنما)</a></li>
            <li><a href="gheyr-entefaee/index.html">بدون‌آزمون غیرانتفاعی</a></li>
            <li><a href="arshad/index.html">مشاوره کارشناسی ارشد</a></li>
            <li><a href="{R}search.html">جستجو در همه مطالب</a></li>
          </ul>
        </div>
        <div class="side-box">
          <h2>رسمی</h2>
          <ul>
            <li><a href="https://www.sanjesh.org" target="_blank" rel="noopener noreferrer">سازمان سنجش</a></li>
            <li><a href="https://rad.medu.ir" target="_blank" rel="noopener noreferrer">راد مدیو</a></li>
          </ul>
        </div>
      </aside>
    </div>
  </main>
  <footer class="site-mega" id="trust" role="contentinfo">
    <div class="container">
      <div class="mega-cta">
        <div>
          <p class="mega-cta-kicker">بلوک</p>
          <h2>برنامه مطالعه + راهنمای کنکور</h2>
          <p>از اپ برای چیدن روز استفاده کن؛ از مطالب آموزشی برای مسیر کنکور.</p>
        </div>
        <div class="mega-cta-actions">
          <a class="btn btn-light" href="{R}index.html#download">دانلود اپ</a>
          <a class="btn btn-ghost mega-cta-ghost" href="{R}search.html">جستجوی مطالب</a>
        </div>
      </div>
      <div class="site-mega-grid">
        <div class="mega-brand">
          <a class="mega-logo" href="{R}index.html">
            <img src="{R}assets/bolok-logo.svg?v={V}" alt="بلوک" width="48" height="48" loading="lazy" decoding="async" />
            <span>بلوک</span>
          </a>
          <p class="mega-tagline">برنامه‌ریز مطالعه فارسی برای کنکور، امتحان و یادگیری جدی.</p>
          <a class="mega-mail" href="mailto:bolokadmin@gmail.com">bolokadmin@gmail.com</a>
        </div>
        <nav class="mega-col" aria-label="آموزش کنکور">
          <h3>آموزش کنکور</h3>
          <a href="index.html">هاب کنکور سراسری</a>
          <a href="maghalat.html">سایر مقالات کنکور</a>
          <a href="moshavere/index.html">مشاوره کنکور</a>
          <a href="gheyr-entefaee/index.html">بدون‌آزمون غیرانتفاعی</a>
          <a href="arshad/index.html">مشاوره ارشد</a>
          <a href="sabt-nam.html">ثبت نام کنکور</a>
        </nav>
        <nav class="mega-col" aria-label="محصول">
          <h3>محصول</h3>
          <a href="{R}index.html#download">دانلود اپ</a>
          <a href="{R}search.html">جستجو</a>
          <a href="{R}about.html">درباره ما</a>
        </nav>
        <div class="mega-col">
          <h3>اعتماد و حقوقی</h3>
          <a href="{R}terms.html">شرایط استفاده</a>
          <a href="{R}privacy.html">حریم خصوصی</a>
          <a href="https://www.sanjesh.org" target="_blank" rel="noopener noreferrer">سازمان سنجش</a>
        </div>
      </div>
      <div class="mega-bar">
        <p>© بلوک · <a href="{BASE}/">bolokapp.ir</a></p>
        <p class="mega-bar-note">تاریخ‌های رسمی را از سنجش چک کنید.</p>
      </div>
    </div>
  </footer>
  <button type="button" class="back-top" data-back-top aria-label="بازگشت به بالا">↑</button>
</body>
</html>
"""
    OUT.write_text(html, encoding="utf-8")
    print("wrote maghalat", total_count, "articles in", len(GROUPS), "groups")


def wire() -> None:
    home = ROOT / "index.html"
    t = home.read_text(encoding="utf-8")
    t = t.replace(
        '<a class="btn btn-ghost" href="education/konkour/entekhab-reshte-1405.html">سایر مقالات</a>',
        '<a class="btn btn-ghost" href="education/konkour/maghalat.html#entekhab">سایر مقالات</a>',
    )
    t = t.replace(
        '<a class="btn btn-ghost" href="education/konkour/barname-1406.html">سایر مقالات</a>',
        '<a class="btn btn-ghost" href="education/konkour/maghalat.html#moshavere">سایر مقالات</a>',
    )
    t = t.replace(
        '<a class="btn btn-ghost" href="education/konkour/azad-nahve.html">سایر مقالات</a>',
        '<a class="btn btn-ghost" href="education/konkour/maghalat.html#azad">سایر مقالات</a>',
    )
    home.write_text(t, encoding="utf-8")

    hub = KONKOUR / "index.html"
    h = hub.read_text(encoding="utf-8")
    if "maghalat.html" not in h:
        h = h.replace(
            '<a href="sabt-nam.html">ثبت نام کامل</a>',
            '<a href="sabt-nam.html">ثبت نام کامل</a>\n      <a href="maghalat.html">سایر مقالات</a>',
            1,
        )
        h = h.replace(
            "<h2 class=\"reveal\" style=\"margin:0 0 1rem;font-weight:900\">آخرین راهنماها</h2>",
            '<h2 class="reveal" style="margin:0 0 1rem;font-weight:900">آخرین راهنماها</h2>\n'
            '        <p class="mag-hub-cta"><a class="btn btn-primary" href="maghalat.html">سایر مقالات کنکور</a></p>',
            1,
        )
    hub.write_text(h, encoding="utf-8")

    # sitemap + search
    sm_path = ROOT / "sitemap.xml"
    sm = sm_path.read_text(encoding="utf-8")
    url = f"{BASE}/education/konkour/maghalat.html"
    if url not in sm:
        sm = sm.replace(
            "</urlset>",
            f'  <url><loc>{url}</loc><lastmod>{TODAY}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>\n</urlset>',
        )
        sm_path.write_text(sm, encoding="utf-8")
    try:
        from _boost_ux_seo import build_search_index
        data = build_search_index()
        data = [d for d in data if d["path"] not in ("404.html", "search.html")
                and not any(p.startswith("_") for p in Path(d["path"]).parts)]
        for it in data:
            p = it["path"]
            it["category"] = (
                "مشاوره کنکور" if "moshavere" in p else
                "غیرانتفاعی" if "gheyr-entefaee" in p else
                "کارشناسی ارشد" if "arshad" in p else
                "کنکور" if "konkour" in p else "آموزشی"
            )
        (ROOT / "search-index.json").write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print("search", len(data))
    except Exception as e:
        print("search skip", e)


def bump_v21() -> None:
    for path in ROOT.rglob("*.html"):
        if any(p.startswith("_") for p in path.relative_to(ROOT).parts):
            continue
        text = path.read_text(encoding="utf-8")
        new = re.sub(r"\?v=\d+", f"?v={V}", text)
        if new != text:
            path.write_text(new, encoding="utf-8")


if __name__ == "__main__":
    main()
    wire()
    bump_v21()
    print("done v21")
