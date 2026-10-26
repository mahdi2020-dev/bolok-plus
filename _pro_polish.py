# -*- coding: utf-8 -*-
"""Principled UI/SEO/UX hardening for bolok_plus (v19)."""
from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import quote, urljoin

ROOT = Path(__file__).resolve().parent
BASE = "https://bolokapp.ir"
V = "20"
TODAY = "2026-10-25"

SECTION_NAMES = {
    "moshavere": "مشاوره کنکور سراسری",
    "gheyr-entefaee": "بدون آزمون دانشگاه غیرانتفاعی",
    "arshad": "مشاوره تحصیلی کارشناسی ارشد",
}

FAQ_ITEMS = [
    ("بلوک چیست و برای چه کسی ساخته شده؟",
     "بلوک یک برنامه‌ریز مطالعه فارسی برای اندروید است؛ برای دانش‌آموزان، داوطلبان کنکور و ارشد و هر کسی که می‌خواهد مطالعه روزانه را بلوکی، قابل‌اندازه‌گیری و منظم پیش ببرد."),
    ("چطور با بلوک برنامه مطالعه بچینم؟",
     "روز را به چند بلوک مشخص تقسیم کنید، برای هر بلوک منبع و هدف بنویسید و بعد مطالعه واقعی را ثبت کنید. شروع ساده و پایدار از برنامه سنگین و ناتمام بهتر است."),
    ("مطالب آموزشی سایت چه کمکی می‌کند؟",
     "راهنماهای آموزشی مسیر ثبت‌نام کنکور، زمان‌بندی، انتخاب رشته، مشاوره، بدون‌آزمون غیرانتفاعی و کارشناسی ارشد را ساده توضیح می‌دهند. تاریخ و عدد قطعی را همیشه از اطلاعیه رسمی سنجش بررسی کنید."),
    ("ثبت‌نام کنکور را از کجا پیگیری کنم؟",
     "از هاب کنکور و صفحه زمان ثبت‌نام شروع کنید، سپس اطلاعیه همان سال سازمان سنجش را باز کنید. مهلت‌ها هر دوره ممکن است تغییر کند."),
    ("پذیرش بدون آزمون غیرانتفاعی بر چه اساسی است؟",
     "این پذیرش معمولاً بر اساس سوابق تحصیلی انجام می‌شود. دفترچه، لیست رشته‌محل‌ها، شهریه و مهلت ثبت‌نام را از اطلاعیه سنجش و سایت واحد دانشگاهی بررسی کنید."),
]


def page_url(rel: Path) -> str:
    p = rel.as_posix()
    if p == "index.html":
        return f"{BASE}/"
    return f"{BASE}/{p}"


def strip_tags(s: str) -> str:
    return re.sub(r"<[^>]+>", "", s).strip()


def get_title(html: str) -> str:
    m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
    if m:
        return strip_tags(m.group(1))
    m = re.search(r"<title>(.*?)</title>", html, re.S)
    return strip_tags(m.group(1)).replace("· بلوک", "").strip() if m else "بلوک"


def breadcrumb_ld(rel: Path, title: str) -> dict | None:
    parts = rel.parts
    items: list[tuple[str, str]] = [("خانه", f"{BASE}/")]
    if parts[0] != "education":
        return None
    items.append(("مطالب آموزشی", f"{BASE}/education/index.html"))
    if len(parts) >= 2 and parts[1] == "konkour":
        items.append(("کنکور سراسری", f"{BASE}/education/konkour/index.html"))
        if len(parts) == 3:
            # direct konkour file or hub itself
            if rel.name == "index.html":
                pass
            else:
                items.append((title, page_url(rel)))
        elif len(parts) == 4:
            sec = parts[2]
            sec_name = SECTION_NAMES.get(sec, sec)
            items.append((sec_name, f"{BASE}/education/konkour/{sec}/index.html"))
            if rel.name not in ("index.html",):
                items.append((title, page_url(rel)))
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": u}
            for i, (n, u) in enumerate(items)
        ],
    }


def inject_ld(html: str, obj: dict, marker: str) -> str:
    if marker in html:
        return html
    script = (
        '  <script type="application/ld+json">\n  '
        + json.dumps(obj, ensure_ascii=False)
        + "\n  </script>\n"
    )
    return html.replace("</head>", script + "</head>", 1)


def upgrade_article_schema(html: str) -> str:
    # datePublished alongside dateModified (both compact and spaced forms)
    html = re.sub(
        r'"dateModified"\s*:\s*"2026-10-25"',
        '"datePublished": "2026-10-25", "dateModified": "2026-10-25"',
        html,
    )
    # publisher next to author org when missing
    if '"publisher"' not in html:
        html = html.replace(
            '"author":{"@type":"Organization","name":"بلوک"}',
            '"author":{"@type":"Organization","name":"بلوک"},'
            '"publisher":{"@type":"Organization","name":"بلوک","logo":{"@type":"ImageObject","url":"'
            + BASE + '/assets/bolok-logo.png"}}',
            1,
        )
        html = html.replace(
            '"author": {"@type": "Organization", "name": "بلوک"}',
            '"author": {"@type": "Organization", "name": "بلوک"}, '
            '"publisher": {"@type": "Organization", "name": "بلوک", "logo": {"@type": "ImageObject", "url": "'
            + BASE + '/assets/bolok-logo.png"}}',
            1,
        )
    return html


def add_share_and_reading(html: str, rel: Path, title: str) -> str:
    if "article-body" not in html:
        return html
    # reading time
    m = re.search(r'<article class="article-body">(.*?)</article>', html, re.S)
    if m and "زمان مطالعه" not in html:
        words = len(strip_tags(m.group(1)).split())
        minutes = max(1, round(words / 180))
        html = html.replace(
            '<p class="article-meta">',
            f'<p class="article-meta"><span>زمان مطالعه: {minutes} دقیقه</span>',
            1,
        ) if '<p class="article-meta">' in html else html
    if "data-share-row" in html:
        return html
    url = page_url(rel)
    share = f"""      <div class="share-row" data-share-row aria-label="اشتراک‌گذاری">
        <span>اشتراک‌گذاری:</span>
        <button type="button" class="share-btn" data-copy-link="{url}">کپی لینک</button>
        <a class="share-btn" href="https://t.me/share/url?url={quote(url, safe='')}&text={quote(title, safe='')}" target="_blank" rel="noopener noreferrer">تلگرام</a>
        <a class="share-btn" href="https://wa.me/?text={quote(title + ' ' + url, safe='')}" target="_blank" rel="noopener noreferrer">واتساپ</a>
      </div>
"""
    if '<aside class="related-rail"' in html:
        html = html.replace('<aside class="related-rail"', share + '      <aside class="related-rail"', 1)
    elif '<div class="article-cta-row">' in html:
        html = html.replace('<div class="article-cta-row">', share + '      <div class="article-cta-row">', 1)
    return html


def add_itemlist(html: str, rel: Path) -> str:
    if "ItemList" in html:
        return html
    cards = re.findall(
        r'<a class="feed-card" href="([^"]+)">.*?<h2>(.*?)</h2>', html, re.S
    )
    if len(cards) < 3:
        return html
    base = page_url(rel)
    obj = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": get_title(html),
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": i + 1,
                "name": strip_tags(t),
                "url": urljoin(base, href),
            }
            for i, (href, t) in enumerate(cards[:20])
        ],
    }
    return inject_ld(html, obj, '"ItemList"')


def footer_links(html: str) -> str:
    if "site-mega" not in html:
        return html
    m = re.search(
        r'(<a href="([^"]*?)education/konkour/moshavere/index\.html">[^<]*</a>)', html
    )
    if not m:
        return html
    prefix = m.group(2)
    if f"{prefix}education/konkour/arshad/index.html" in html.split("site-mega", 1)[-1]:
        return html
    insert = (
        f'\n          <a href="{prefix}education/konkour/gheyr-entefaee/index.html">بدون‌آزمون غیرانتفاعی</a>'
        f'\n          <a href="{prefix}education/konkour/arshad/index.html">مشاوره ارشد</a>'
    )
    return html.replace(m.group(1), m.group(1) + insert, 1)


def homepage_faq(html: str) -> str:
    if 'id="faq"' in html:
        return html
    details = "".join(
        f"""        <details class="faq-item">
          <summary>{q}</summary>
          <p>{a}</p>
        </details>"""
        for q, a in FAQ_ITEMS
    )
    section = f"""    <section class="container faq-section" id="faq" aria-labelledby="faq-title">
      <div class="section-title">
        <h2 id="faq-title" class="reveal">پرسش‌های پرتکرار</h2>
        <p class="reveal">پاسخ کوتاه و کاربردی قبل از شروع</p>
      </div>
      <div class="faq-list">
{details}
      </div>
    </section>

"""
    if '<section class="final-cta container">' in html:
        html = html.replace('<section class="final-cta container">', section + '    <section class="final-cta container">', 1)
    if "mobile-download" not in html:
        html = html.replace(
            "</body>",
            '  <a class="mobile-download" href="#download">دانلود اپ بلوک</a>\n</body>',
            1,
        )
    ld = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a},
            }
            for q, a in FAQ_ITEMS
        ],
    }
    return inject_ld(html, ld, '"FAQPage"')


def polish_page(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    if "_deploy" in rel.parts or rel.name == "404.html":
        # still bump cache on 404 harmlessly below
        pass
    html = path.read_text(encoding="utf-8")
    orig = html
    html = re.sub(r"\?v=\d+", f"?v={V}", html)

    # perf: logo preload only matters on homepage
    if rel.as_posix() != "index.html":
        html = re.sub(
            r'\s*<link rel="preload" href="[^"]*bolok-logo\.svg\?v=\d+" as="image" type="image/svg\+xml" />',
            "",
            html,
        )
    # dedupe manifest
    parts = html.split('<link rel="manifest"')
    if len(parts) > 2:
        first = parts[0] + '<link rel="manifest"' + parts[1]
        rest = "".join(parts[2:])
        # remove the duplicate tag start from rest chunks: each chunk began after tag open
        cleaned = []
        for chunk in parts[2:]:
            end = chunk.find("/>")
            cleaned.append(chunk[end + 2:] if end != -1 else chunk)
        html = first + "".join(cleaned)

    if 'name="twitter:image"' not in html and 'property="og:image"' in html:
        html = html.replace(
            '<meta name="twitter:card" content="summary" />',
            '<meta name="twitter:card" content="summary" />\n'
            f'  <meta name="twitter:image" content="{BASE}/assets/bolok-logo.png" />',
            1,
        )

    if rel.as_posix() == "search.html":
        html = html.replace(
            'content="index,follow,max-snippet:-1,max-image-preview:large"',
            'content="noindex,follow"',
            1,
        )
        html = re.sub(r"بین .*? صفحه راهنما", "در همه راهنماها", html)
        html = html.replace(
            '<p class="search-meta" data-search-meta></p>',
            '<p class="search-meta" data-search-meta aria-live="polite"></p>\n'
            '      <div class="search-chips" aria-label="جستجوهای پرتکرار">\n'
            '        <button type="button" data-search-chip="ثبت نام کنکور">ثبت‌نام کنکور</button>\n'
            '        <button type="button" data-search-chip="پاسخنامه">پاسخنامه</button>\n'
            '        <button type="button" data-search-chip="شهریه غیرانتفاعی">شهریه غیرانتفاعی</button>\n'
            '        <button type="button" data-search-chip="پروپوزال ارشد">پروپوزال ارشد</button>\n'
            '        <button type="button" data-search-chip="برنامه مطالعه">برنامه مطالعه</button>\n'
            '      </div>',
            1,
        )
        html = html.replace(
            '<ul class="feed-list" data-search-results></ul>',
            '<ul class="feed-list" data-search-results aria-live="polite"></ul>',
            1,
        )

    title = get_title(html)
    html = upgrade_article_schema(html)
    ld = breadcrumb_ld(rel, title)
    if ld:
        html = inject_ld(html, ld, '"BreadcrumbList"')
    html = add_itemlist(html, rel)
    html = add_share_and_reading(html, rel, title)
    html = footer_links(html)

    if rel.as_posix() == "index.html":
        html = homepage_faq(html)

    if html != orig:
        path.write_text(html, encoding="utf-8")
        return True
    return False


def category_for(path_str: str) -> str:
    if "moshavere" in path_str:
        return "مشاوره کنکور"
    if "gheyr-entefaee" in path_str:
        return "غیرانتفاعی"
    if "arshad" in path_str:
        return "کارشناسی ارشد"
    if "konkour" in path_str:
        return "کنکور"
    if path_str in ("about.html", "privacy.html", "terms.html"):
        return "بلوک"
    return "آموزشی"


def rebuild_search() -> None:
    from _boost_ux_seo import build_search_index

    data = build_search_index()
    for it in data:
        it["category"] = category_for(it["path"])
    data = [
        d
        for d in data
        if d["path"] not in ("404.html", "search.html")
        and not any(p.startswith("_") for p in Path(d["path"]).parts)
    ]
    (ROOT / "search-index.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("search", len(data))


def rebuild_sitemap() -> None:
    exclude = {"404.html", "search.html"}
    entries: list[tuple[str, str, str]] = []
    for path in sorted(ROOT.rglob("*.html")):
        if any(p.startswith("_") for p in path.parts):
            continue
        rel = path.relative_to(ROOT)
        if rel.as_posix() in exclude:
            continue
        url = page_url(rel)
        if url.endswith("/index.html"):
            url = url[: -len("index.html")]
        if url in [e[0] for e in entries]:
            continue
        if rel.as_posix() == "index.html":
            prio, freq = "1.0", "weekly"
        elif rel.name == "index.html" or rel.name.startswith("page-"):
            prio, freq = "0.9", "weekly"
        elif rel.parts[0] in ("about.html", "privacy.html", "terms.html") or rel.name in (
            "about.html", "privacy.html", "terms.html",
        ):
            prio, freq = "0.3", "monthly"
        else:
            prio, freq = "0.7", "monthly"
        entries.append((url, prio, freq))
    entries.sort(key=lambda e: (-float(e[1]), e[0]))
    body = "".join(
        f'  <url><loc>{u}</loc><lastmod>{TODAY}</lastmod><changefreq>{f}</changefreq><priority>{p}</priority></url>\n'
        for u, p, f in entries
    )
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + body + "</urlset>\n"
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
    print("sitemap", len(entries))


def write_extras() -> None:
    (ROOT / "site.webmanifest").write_text(
        json.dumps(
            {
                "name": "بلوک",
                "short_name": "بلوک",
                "description": "برنامه‌ریز مطالعه فارسی و راهنمای کنکور و ارشد",
                "lang": "fa-IR",
                "dir": "rtl",
                "start_url": "/",
                "scope": "/",
                "display": "standalone",
                "background_color": "#e8eaee",
                "theme_color": "#0c0e12",
                "icons": [
                    {"src": "/assets/app-icon.png", "sizes": "192x192", "type": "image/png"},
                    {"src": "/assets/bolok-logo.png", "sizes": "521x521", "type": "image/png"},
                ],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    (ROOT / "llms.txt").write_text(
        "# بلوک (Bolok)\n\n"
        "> برنامه‌ریز مطالعه فارسی برای اندروید + راهنمای آموزشی کنکور سراسری، بدون‌آزمون غیرانتفاعی و کارشناسی ارشد.\n\n"
        "## صفحات اصلی\n"
        f"- [خانه]({BASE}/)\n"
        f"- [هاب کنکور]({BASE}/education/konkour/index.html)\n"
        f"- [مشاوره کنکور]({BASE}/education/konkour/moshavere/index.html)\n"
        f"- [بدون آزمون غیرانتفاعی]({BASE}/education/konkour/gheyr-entefaee/index.html)\n"
        f"- [مشاوره کارشناسی ارشد]({BASE}/education/konkour/arshad/index.html)\n"
        f"- [جستجو]({BASE}/search.html)\n\n"
        "## منبع رسمی زمان‌بندی\n"
        "- سازمان سنجش: https://www.sanjesh.org\n",
        encoding="utf-8",
    )
    (ROOT / "liara_nginx.conf").write_text(
        """add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header X-Frame-Options "SAMEORIGIN" always;

location ~* \\.(?:css|js|svg|png|jpg|jpeg|webp|woff2|ico)$ {
  expires 7d;
  add_header Cache-Control "public, immutable";
  add_header X-Content-Type-Options "nosniff" always;
}

location / {
  index index.html;
  try_files $uri $uri/ =404;
}

error_page 404 /404.html;
location = /404.html {
  internal;
}
""",
        encoding="utf-8",
    )


def main() -> None:
    n = 0
    for path in ROOT.rglob("*.html"):
        if any(p.startswith("_") for p in path.relative_to(ROOT).parts):
            continue
        if polish_page(path):
            n += 1
    rebuild_search()
    rebuild_sitemap()
    write_extras()
    print(f"polished {n} pages @ v={V}")


if __name__ == "__main__":
    main()
