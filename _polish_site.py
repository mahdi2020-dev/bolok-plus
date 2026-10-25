# -*- coding: utf-8 -*-
"""Sitewide footer + perf/SEO polish for bolok_plus."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
V = "15"
BASE = "https://bolokapp.ir"


def depth_prefix(rel: Path) -> str:
    depth = len(rel.parts) - 1
    return "../" * depth if depth else ""


def mega_footer(prefix: str, *, with_enamad: bool = False) -> str:
    enamad = ""
    if with_enamad:
        enamad = """
          <p class="mega-kicker">نماد اعتماد</p>
          <div class="enamad-frame enamad-frame--compact" id="enamad">
            <a referrerpolicy="origin" target="_blank" rel="noopener noreferrer" href="https://trustseal.enamad.ir/?id=7806432&Code=UkmiQCpizBsL3zKeePhPJGmhKEhW7NtH">
              <img referrerpolicy="origin" loading="lazy" decoding="async" width="125" height="125" src="https://trustseal.enamad.ir/logo.aspx?id=7806432&Code=UkmiQCpizBsL3zKeePhPJGmhKEhW7NtH" alt="نماد اعتماد الکترونیکی" />
            </a>
          </div>"""

    return f"""  <footer class="site-mega" id="trust" role="contentinfo">
    <div class="container">
      <div class="mega-cta reveal">
        <div>
          <p class="mega-cta-kicker">بلوک</p>
          <h2>برنامه مطالعه + راهنمای کنکور</h2>
          <p>از اپ برای چیدن روز استفاده کن؛ از مطالب آموزشی برای مسیر کنکور.</p>
        </div>
        <div class="mega-cta-actions">
          <a class="btn btn-light" href="{prefix}index.html#download">دانلود اپ</a>
          <a class="btn btn-ghost mega-cta-ghost" href="{prefix}search.html">جستجوی مطالب</a>
        </div>
      </div>

      <div class="site-mega-grid">
        <div class="mega-brand">
          <a class="mega-logo" href="{prefix}index.html">
            <img src="{prefix}assets/bolok-logo.svg?v={V}" alt="بلوک" width="48" height="48" loading="lazy" decoding="async" />
            <span>بلوک</span>
          </a>
          <p class="mega-tagline">برنامه‌ریز مطالعه فارسی برای کنکور، امتحان و یادگیری جدی.</p>
          <a class="mega-mail" href="mailto:bolokadmin@gmail.com">bolokadmin@gmail.com</a>
          <div class="mega-chips" aria-label="ویژگی‌ها">
            <span>اندروید</span>
            <span>فارسی</span>
            <span>اینماد</span>
          </div>
        </div>

        <nav class="mega-col" aria-label="مطالب آموزشی">
          <h3>آموزش کنکور</h3>
          <a href="{prefix}education/konkour/index.html">هاب کنکور سراسری</a>
          <a href="{prefix}education/konkour/moshavere/index.html">مشاوره کنکور</a>
          <a href="{prefix}education/konkour/sabt-nam.html">ثبت نام کنکور</a>
          <a href="{prefix}education/konkour/zaman-sabt-nam.html">زمان ثبت نام</a>
          <a href="{prefix}education/konkour/entekhab-reshte-1405.html">انتخاب رشته</a>
          <a href="{prefix}education/konkour/barname-1406.html">برنامه ۱۴۰۶</a>
        </nav>

        <nav class="mega-col" aria-label="محصول">
          <h3>محصول</h3>
          <a href="{prefix}index.html#download">دانلود اپ</a>
          <a href="{prefix}index.html#showcase">معرفی امکانات</a>
          <a href="{prefix}index.html#why">چرا بلوک</a>
          <a href="{prefix}search.html">جستجو</a>
          <a href="{prefix}about.html">درباره ما</a>
        </nav>

        <div class="mega-col mega-col--trust">
          <h3>اعتماد و حقوقی</h3>
          <a href="{prefix}terms.html">شرایط استفاده</a>
          <a href="{prefix}privacy.html">حریم خصوصی</a>
          <a href="https://www.sanjesh.org" target="_blank" rel="noopener noreferrer">سازمان سنجش</a>
          {enamad}
        </div>
      </div>

      <div class="mega-bar">
        <p>© بلوک · <a href="{BASE}/">bolokapp.ir</a></p>
        <p class="mega-bar-note">محتوای آموزشی مکمل اپ است؛ تاریخ‌های رسمی را از سنجش چک کنید.</p>
      </div>
    </div>
  </footer>"""


HOME_FOOTER_RE = re.compile(
    r'<footer class="site-trust"[\s\S]*?</footer>',
    re.MULTILINE,
)
SIMPLE_FOOTER_RE = re.compile(
    r'<footer class="site-footer"[\s\S]*?</footer>',
    re.MULTILINE,
)
ANY_MEGA_RE = re.compile(
    r'<footer class="site-mega"[\s\S]*?</footer>',
    re.MULTILINE,
)


def polish_head(html: str, rel: Path) -> str:
    prefix = depth_prefix(rel)
    html = re.sub(r"\?v=\d+", f"?v={V}", html)

    if 'rel="dns-prefetch" href="https://trustseal.enamad.ir"' not in html and rel.as_posix() == "index.html":
        html = html.replace(
            '<link rel="preconnect" href="https://fonts.googleapis.com" />',
            '<link rel="dns-prefetch" href="https://trustseal.enamad.ir" />\n'
            '  <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />\n'
            '  <link rel="preconnect" href="https://fonts.googleapis.com" />',
            1,
        )

    if 'rel="preload"' not in html and "bolok-logo.svg" in html:
        html = html.replace(
            f'<link rel="icon" href="{prefix}assets/bolok-logo.svg?v={V}"',
            f'<link rel="preload" href="{prefix}assets/bolok-logo.svg?v={V}" as="image" type="image/svg+xml" />\n'
            f'  <link rel="icon" href="{prefix}assets/bolok-logo.svg?v={V}"',
            1,
        ) if f'href="{prefix}assets/bolok-logo.svg?v={V}"' in html else html.replace(
            f'<link rel="icon" href="assets/bolok-logo.svg?v={V}"',
            f'<link rel="preload" href="assets/bolok-logo.svg?v={V}" as="image" type="image/svg+xml" />\n'
            f'  <link rel="icon" href="assets/bolok-logo.svg?v={V}"',
            1,
        )

    # font-display already via Google URL; ensure display=swap
    if "fonts.googleapis.com" in html and "display=swap" not in html:
        html = html.replace("&display=swap", "&display=swap")

    return html


def polish_homepage(html: str) -> str:
    # SoftwareApplication + richer Organization
    if "SoftwareApplication" not in html:
        html = html.replace(
            '"sameAs": []\n      },',
            '"sameAs": [],\n'
            '        "contactPoint": {\n'
            '          "@type": "ContactPoint",\n'
            '          "email": "bolokadmin@gmail.com",\n'
            '          "contactType": "customer support",\n'
            '          "availableLanguage": ["fa"]\n'
            '        }\n'
            '      },\n'
            '      {\n'
            '        "@type": "SoftwareApplication",\n'
            '        "name": "بلوک",\n'
            '        "applicationCategory": "EducationalApplication",\n'
            '        "operatingSystem": "Android",\n'
            '        "inLanguage": "fa-IR",\n'
            '        "offers": {\n'
            '          "@type": "Offer",\n'
            '          "price": "0",\n'
            '          "priceCurrency": "IRR"\n'
            '        },\n'
            '        "url": "https://bolokapp.ir/#download"\n'
            '      },',
            1,
        )

    # hero logo priority
    html = html.replace(
        f'<img class="hero-logo" src="assets/bolok-logo.svg?v={V}" alt="لوگوی بلوک" width="112" height="112" />',
        f'<img class="hero-logo" src="assets/bolok-logo.svg?v={V}" alt="لوگوی بلوک" width="112" height="112" fetchpriority="high" decoding="async" />',
        1,
    )

    footer = mega_footer("", with_enamad=True)
    if HOME_FOOTER_RE.search(html):
        html = HOME_FOOTER_RE.sub(footer, html, count=1)
    elif ANY_MEGA_RE.search(html):
        html = ANY_MEGA_RE.sub(footer, html, count=1)
    return html


def polish_page(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    if "_deploy" in rel.parts:
        return False
    html = path.read_text(encoding="utf-8")
    original = html
    html = polish_head(html, rel)
    prefix = depth_prefix(rel)

    if rel.as_posix() == "index.html":
        html = polish_homepage(html)
    elif HOME_FOOTER_RE.search(html):
        html = HOME_FOOTER_RE.sub(mega_footer(prefix, with_enamad=False), html, count=1)
    elif SIMPLE_FOOTER_RE.search(html):
        html = SIMPLE_FOOTER_RE.sub(mega_footer(prefix, with_enamad=False), html, count=1)
    elif ANY_MEGA_RE.search(html):
        html = ANY_MEGA_RE.sub(mega_footer(prefix, with_enamad=False), html, count=1)

    # ensure back-top exists
    if "data-back-top" not in html and "</body>" in html:
        html = html.replace(
            "</body>",
            '  <button type="button" class="back-top" data-back-top aria-label="بازگشت به بالا">↑</button>\n</body>',
            1,
        )

    if html != original:
        path.write_text(html, encoding="utf-8")
        return True
    return False


def main() -> None:
    n = 0
    for path in ROOT.rglob("*.html"):
        if path.name.startswith("_"):
            continue
        if polish_page(path):
            n += 1
    print(f"polished {n} pages @ v={V}")


if __name__ == "__main__":
    main()
