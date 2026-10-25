# -*- coding: utf-8 -*-
"""Sitewide UX + SEO boost for bolok_plus static site."""
from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parent
BASE = "https://bolokapp.ir"
V = "13"
TODAY = date.today().isoformat()


class TitleDesc(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.desc = ""
        self.h1 = ""
        self._in_title = False
        self._in_h1 = False
        self._capture = ""

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title":
            self._in_title = True
            self._capture = ""
        elif tag == "h1":
            self._in_h1 = True
            self._capture = ""
        elif tag == "meta" and attrs.get("name") == "description":
            self.desc = attrs.get("content", "")

    def handle_endtag(self, tag):
        if tag == "title" and self._in_title:
            self.title = self._capture.strip()
            self._in_title = False
        if tag == "h1" and self._in_h1:
            self.h1 = self._capture.strip()
            self._in_h1 = False

    def handle_data(self, data):
        if self._in_title or self._in_h1:
            self._capture += data


def rel_to_url(rel: Path) -> str:
    p = rel.as_posix()
    if p == "index.html":
        return f"{BASE}/"
    return f"{BASE}/{p}"


def depth_prefix(rel: Path) -> str:
    depth = len(rel.parts) - 1
    return "../" * depth if depth else ""


def inject_head_seo(html: str, rel: Path, title: str, desc: str) -> str:
    url = rel_to_url(rel)
    prefix = depth_prefix(rel)
    # bump cache
    html = re.sub(r"\?v=\d+", f"?v={V}", html)

    if 'rel="canonical"' not in html:
        html = html.replace(
            "</title>",
            f'</title>\n  <link rel="canonical" href="{url}" />',
            1,
        )
    else:
        html = re.sub(
            r'<link rel="canonical" href="[^"]*"\s*/?>',
            f'<link rel="canonical" href="{url}" />',
            html,
            count=1,
        )

    if 'property="og:title"' not in html:
        og = f"""  <meta property="og:type" content="website" />
  <meta property="og:locale" content="fa_IR" />
  <meta property="og:site_name" content="بلوک" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{desc}" />
  <meta property="og:url" content="{url}" />
  <meta property="og:image" content="{BASE}/assets/bolok-logo.png" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="{title}" />
  <meta name="twitter:description" content="{desc}" />
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large" />
  <link rel="manifest" href="{prefix}site.webmanifest" />
  <link rel="alternate" href="{url}" hreflang="fa-IR" />
"""
        html = html.replace("</head>", og + "</head>", 1)
    else:
        if "site.webmanifest" not in html:
            html = html.replace(
                "</head>",
                f'  <link rel="manifest" href="{prefix}site.webmanifest" />\n</head>',
                1,
            )

    return html


def inject_body_ux(html: str, rel: Path) -> str:
    prefix = depth_prefix(rel)
    if 'class="skip-link"' not in html:
        skip = f'<a class="skip-link" href="#main">پرش به محتوا</a>\n  <div class="read-progress" data-read-progress aria-hidden="true"></div>\n'
        html = html.replace("<body>", "<body>\n  " + skip, 1)

    # mark main
    if 'id="main"' not in html:
        html = html.replace("<main", '<main id="main"', 1)

    # back to top + sticky search hint for education
    extras = ""
    if 'data-back-top' not in html:
        extras += f"""
  <button type="button" class="back-top" data-back-top aria-label="بازگشت به بالا">↑</button>
"""
    if extras and "data-back-top" not in html:
        html = html.replace("</body>", extras + "</body>", 1)

    # footer enrich once
    if "site-trust" in html and "footer-seo-links" not in html:
        html = html.replace(
            '<nav class="footer-links" aria-label="پیوندهای حقوقی">',
            """<nav class="footer-links footer-seo-links" aria-label="پیوندهای مهم">
        <a href="education/konkour/index.html">کنکور سراسری</a>
        <a href="education/konkour/moshavere/index.html">مشاوره کنکور</a>
        <a href="education/konkour/sabt-nam.html">ثبت نام کنکور</a>
        <a href="education/konkour/zaman-sabt-nam.html">زمان ثبت نام</a>
        <a href="search.html">جستجو</a>
      </nav>
      <nav class="footer-links" aria-label="پیوندهای حقوقی">""",
            1,
        )
    elif "site-footer" in html and "search.html" not in html and rel.name != "search.html":
        # add search link in simple footers
        html = html.replace(
            "</div>\n  </footer>",
            f' · <a href="{prefix}search.html">جستجو</a></div>\n  </footer>',
            1,
        )

    return html


def build_search_index() -> list[dict]:
    items = []
    for path in ROOT.rglob("*.html"):
        if path.name.startswith("_") or "_deploy" in path.parts:
            continue
        rel = path.relative_to(ROOT)
        if rel.as_posix().startswith("_"):
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        p = TitleDesc()
        try:
            p.feed(text)
        except Exception:
            continue
        title = p.h1 or p.title.replace(" · بلوک", "").replace("· بلوک", "").strip()
        if not title:
            continue
        items.append(
            {
                "title": title,
                "desc": p.desc[:160],
                "url": "/" + rel.as_posix() if rel.as_posix() != "index.html" else "/",
                "path": rel.as_posix(),
            }
        )
    # prefer unique by url
    seen = set()
    out = []
    for it in items:
        if it["url"] in seen:
            continue
        seen.add(it["url"])
        out.append(it)
    return out


def patch_homepage(html: str) -> str:
    # stronger title/description
    html = html.replace(
        "<title>بلوک</title>",
        "<title>بلوک | برنامه‌ریز مطالعه و راهنمای کنکور سراسری</title>",
        1,
    )
    html = re.sub(
        r'<meta name="description" content="[^"]*" />',
        '<meta name="description" content="بلوک؛ برنامه‌ریز مطالعه فارسی + راهنمای کامل کنکور سراسری: ثبت‌نام، زمان‌بندی، انتخاب رشته، مشاوره و سوابق تحصیلی." />',
        html,
        count=1,
    )
    if "application/ld+json" not in html or "WebSite" not in html:
        ld = f"""  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@graph": [
      {{
        "@type": "Organization",
        "name": "بلوک",
        "url": "{BASE}/",
        "logo": "{BASE}/assets/bolok-logo.png",
        "email": "bolokadmin@gmail.com",
        "sameAs": []
      }},
      {{
        "@type": "WebSite",
        "name": "بلوک",
        "url": "{BASE}/",
        "inLanguage": "fa-IR",
        "potentialAction": {{
          "@type": "SearchAction",
          "target": "{BASE}/search.html?q={{search_term_string}}",
          "query-input": "required name=search_term_string"
        }}
      }}
    ]
  }}
  </script>
"""
        html = html.replace("</head>", ld + "</head>", 1)
    # search in header actions
    if 'href="search.html"' not in html.split("header-actions")[1][:400] if "header-actions" in html else True:
        html = html.replace(
            '<div class="header-actions">\n        <a class="btn btn-primary header-cta" href="#download">دانلود اپ</a>',
            '<div class="header-actions">\n        <a class="header-search" href="search.html" aria-label="جستجو">جستجو</a>\n        <a class="btn btn-primary header-cta" href="#download">دانلود اپ</a>',
            1,
        )
    return html


def write_search_page(index_count: int) -> None:
    (ROOT / "search.html").write_text(
        f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0c0e12" />
  <meta name="description" content="جستجو در مطالب آموزشی بلوک؛ کنکور، ثبت‌نام، مشاوره و راهنماهای مطالعه." />
  <link rel="canonical" href="{BASE}/search.html" />
  <title>جستجو · بلوک</title>
  <link rel="icon" href="assets/bolok-logo.svg?v={V}" type="image/svg+xml" />
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css?v={V}" />
  <link rel="manifest" href="site.webmanifest" />
  <script src="app.js?v={V}" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">پرش به محتوا</a>
  <div class="aurora" aria-hidden="true"></div>
  <div class="dot-grid" aria-hidden="true"></div>
  <div class="grain" aria-hidden="true"></div>
  <header class="site-header">
    <div class="container inner">
      <a class="brand" href="index.html">
        <img class="brand-logo" src="assets/bolok-logo.svg?v={V}" alt="بلوک" width="36" height="36" />
        <span>بلوک</span>
      </a>
      <nav class="nav" aria-label="اصلی">
        <a href="index.html#education">مطالب آموزشی</a>
        <a href="education/konkour/index.html">کنکور</a>
        <a href="education/konkour/moshavere/index.html">مشاوره</a>
        <a href="about.html">درباره</a>
      </nav>
      <div class="header-actions">
        <a class="btn btn-primary header-cta" href="index.html#download">دانلود اپ</a>
        <button class="nav-toggle" type="button" data-nav-toggle aria-label="منو"><span></span></button>
      </div>
    </div>
    <div class="nav-drawer" data-nav-drawer>
      <a href="index.html">خانه</a>
      <a href="education/konkour/index.html">کنکور</a>
      <a href="education/konkour/moshavere/index.html">مشاوره</a>
    </div>
  </header>
  <main id="main" class="container edu-wrap">
    <div class="edu-hero">
      <h1>جستجو در بلوک</h1>
      <p class="edu-lead">بین {index_count} صفحه راهنما و مطالب آموزشی جستجو کنید.</p>
      <form class="search-box" data-site-search role="search">
        <label class="sr-only" for="q">عبارت جستجو</label>
        <input id="q" name="q" type="search" placeholder="مثلاً: ثبت نام کنکور، پاسخنامه تجربی، راد مدیو" autocomplete="off" />
        <button class="btn btn-primary" type="submit">جستجو</button>
      </form>
      <p class="search-meta" data-search-meta></p>
    </div>
    <ul class="feed-list" data-search-results></ul>
  </main>
  <footer class="site-footer"><div class="container">© بلوک · <a href="index.html">خانه</a></div></footer>
  <button type="button" class="back-top" data-back-top aria-label="بازگشت به بالا">↑</button>
</body>
</html>
""",
        encoding="utf-8",
    )


def write_manifest() -> None:
    (ROOT / "site.webmanifest").write_text(
        json.dumps(
            {
                "name": "بلوک",
                "short_name": "بلوک",
                "lang": "fa-IR",
                "dir": "rtl",
                "start_url": "/",
                "display": "standalone",
                "background_color": "#e8eaee",
                "theme_color": "#0c0e12",
                "icons": [
                    {
                        "src": "/assets/bolok-logo.png",
                        "sizes": "192x192",
                        "type": "image/png",
                    }
                ],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


def write_404() -> None:
    (ROOT / "404.html").write_text(
        f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>صفحه پیدا نشد · بلوک</title>
  <link rel="stylesheet" href="styles.css?v={V}" />
</head>
<body>
  <main id="main" class="container edu-wrap" style="text-align:center;padding:4rem 0">
    <h1>۴۰۴</h1>
    <p class="edu-lead">این صفحه پیدا نشد.</p>
    <div class="article-cta-row" style="justify-content:center">
      <a class="btn btn-primary" href="/">خانه</a>
      <a class="btn btn-ghost" href="/search.html">جستجو</a>
      <a class="btn btn-ghost" href="/education/konkour/index.html">هاب کنکور</a>
    </div>
  </main>
</body>
</html>
""",
        encoding="utf-8",
    )


def add_related_block(html: str, rel: Path) -> str:
    if "related-rail" in html:
        return html
    if "article-body" not in html:
        return html
    # pick related by folder
    related = []
    if "moshavere" in rel.parts:
        related = [
            ("index.html", "فهرست مشاوره کنکور"),
            ("dalayel-oft-rotbe.html", "دلایل افت رتبه"),
            ("shoroo-az-tabestan.html", "شروع از تابستان"),
            ("../sabt-nam.html", "ثبت نام کنکور"),
        ]
    elif rel.parts[:2] == ("education", "konkour"):
        related = [
            ("index.html", "هاب کنکور"),
            ("sabt-nam.html", "ثبت نام کنکور"),
            ("zaman-sabt-nam.html", "زمان ثبت نام"),
            ("moshavere/index.html", "مشاوره کنکور"),
        ]
    else:
        return html
    links = "".join(
        f'<a class="related-chip" href="{href}">{label}</a>' for href, label in related
    )
    block = f"""
      <aside class="related-rail" aria-label="مطالب مرتبط">
        <h2>ادامه مسیر مطالعه</h2>
        <div class="related-chips">{links}</div>
      </aside>
"""
    # insert before closing article-body if possible
    if '<div class="article-cta-row">' in html:
        html = html.replace(
            '<div class="article-cta-row">',
            block + '      <div class="article-cta-row">',
            1,
        )
    return html


def main() -> None:
    index_data = build_search_index()
    (ROOT / "search-index.json").write_text(
        json.dumps(index_data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    write_search_page(len(index_data))
    write_manifest()
    write_404()

    # ensure search in sitemap
    sm = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    if "/search.html" not in sm:
        sm = sm.replace(
            "</urlset>",
            f'  <url><loc>{BASE}/search.html</loc><lastmod>{TODAY}</lastmod><changefreq>weekly</changefreq></url>\n</urlset>',
        )
        (ROOT / "sitemap.xml").write_text(sm, encoding="utf-8")

    robots = f"""User-agent: *
Allow: /
Disallow: /_deploy_proof/
Sitemap: {BASE}/sitemap.xml
Host: {BASE}
"""
    (ROOT / "robots.txt").write_text(robots, encoding="utf-8")

    count = 0
    for path in ROOT.rglob("*.html"):
        if "_deploy" in path.parts:
            continue
        rel = path.relative_to(ROOT)
        html = path.read_text(encoding="utf-8")
        if rel.as_posix() == "index.html":
            html = patch_homepage(html)
        parser = TitleDesc()
        try:
            parser.feed(html)
        except Exception:
            pass
        title = parser.title or "بلوک"
        desc = parser.desc or "بلوک — برنامه‌ریز مطالعه و راهنمای کنکور"
        html = inject_head_seo(html, rel, title, desc)
        html = inject_body_ux(html, rel)
        html = add_related_block(html, rel)
        path.write_text(html, encoding="utf-8")
        count += 1

    print(f"patched {count} html files; search index {len(index_data)}")


if __name__ == "__main__":
    main()
