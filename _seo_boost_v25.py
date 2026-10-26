# -*- coding: utf-8 -*-
"""SEO boost v25: original Bolok long-form pages + tech SEO vs Heyva topic gaps."""
from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
TODAY = "2026-10-26"
V_OLD, V_NEW = "24", "25"
BASE = "https://bolokapp.ir"

# Import header builder from mosahab nav script
import importlib.util

spec = importlib.util.spec_from_file_location("mosahab", ROOT / "_mosahab_nav_v24.py")
mosahab = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mosahab)

# Extend nav categories with new SEO pages before regenerating headers
EXTRA_SABT = [
    ("education/konkour/site-sanjesh.html", "سایت سازمان سنجش"),
    ("education/konkour/kart-vorod-jalase.html", "کارت ورود به جلسه"),
    ("education/konkour/taghirat-konkour-1405.html", "تغییرات کنکور ۱۴۰۵"),
]
EXTRA_ENTEKHAB = [
    ("education/konkour/site-entekhab-reshte.html", "سایت انتخاب رشته"),
    ("education/konkour/virayesh-entekhab-reshte.html", "ویرایش انتخاب رشته"),
    ("education/konkour/karname-avvalie-1405.html", "کارنامه اولیه"),
]
EXTRA_MOSHAVERE = [
    ("education/konkour/termim-moadel-1405.html", "ترمیم معدل ۱۴۰۵"),
    ("education/konkour/takhmin-rotbe.html", "تخمین رتبه"),
    ("education/konkour/hazfiyat-konkour-1405.html", "حذفیات کنکور ۱۴۰۵"),
]


def extend_nav_categories() -> None:
    new_cats: list[tuple[str, str, list[tuple[str, str]]]] = []
    for key, label, links in mosahab.CATEGORIES:
        links = list(links)
        extras = {
            "sabt": EXTRA_SABT,
            "entekhab": EXTRA_ENTEKHAB,
            "moshavere": EXTRA_MOSHAVERE,
        }.get(key, [])
        for item in extras:
            if item not in links:
                links.append(item)
        new_cats.append((key, label, links))
    mosahab.CATEGORIES = new_cats


DISCLAIMER = (
    '<div class="callout callout--warn"><strong>مرجع رسمی</strong>'
    "<p>تاریخ‌ها، ظرفیت‌ها و ضوابط فقط با اطلاعیه همان سال سازمان سنجش روی "
    '<a href="https://www.sanjesh.org" target="_blank" rel="noopener noreferrer">sanjesh.org</a> '
    "قطعی می‌شود. بلوک راهنمای کمکی است، نه جایگزین دفترچه.</p></div>"
)

BOLOK_TIP = (
    '<div class="callout callout--tip"><strong>نکته بلوک</strong>'
    "<p>مهلت‌ها و برنامه مطالعه را در اپ بلوک بلوک‌بندی کنید تا روزهای حساس "
    "(ثبت‌نام، کارت، انتخاب رشته) از دست نرود.</p></div>"
)


def faq_html(items: list[tuple[str, str]]) -> str:
    parts = ['<div class="faq">']
    for i, (q, a) in enumerate(items):
        op = " open" if i == 0 else ""
        parts.append(f"<details{op}><summary>{q}</summary><p>{a}</p></details>")
    parts.append("</div>")
    return "\n".join(parts)


def faq_ld(items: list[tuple[str, str]]) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a},
            }
            for q, a in items
        ],
    }


def article_ld(title: str, desc: str, url: str) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": desc,
        "inLanguage": "fa-IR",
        "datePublished": "2026-10-25",
        "dateModified": TODAY,
        "author": {"@type": "Organization", "name": "بلوک"},
        "publisher": {
            "@type": "Organization",
            "name": "بلوک",
            "logo": {"@type": "ImageObject", "url": f"{BASE}/assets/bolok-logo.png"},
        },
        "mainEntityOfPage": url,
    }


def breadcrumb_ld(title: str, url: str) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "خانه", "item": f"{BASE}/"},
            {
                "@type": "ListItem",
                "position": 2,
                "name": "مطالب آموزشی",
                "item": f"{BASE}/education/index.html",
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": "کنکور سراسری",
                "item": f"{BASE}/education/konkour/index.html",
            },
            {"@type": "ListItem", "position": 4, "name": title, "item": url},
        ],
    }


def toc_from_sections(sections: list[tuple[str, str, str]]) -> str:
    lis = "\n".join(f'          <li><a href="#{sid}">{label}</a></li>' for sid, label, _ in sections)
    return f"""      <aside class="article-toc" aria-label="فهرست مطالب">
        <h2>فهرست</h2>
        <ol>
{lis}
          <li><a href="#faq">سوالات متداول</a></li>
        </ol>
      </aside>"""


def related_block(links: list[tuple[str, str]]) -> str:
    chips = "".join(f'<a class="related-chip" href="{u}">{t}</a>' for u, t in links)
    return f"""      <aside class="related-rail" aria-label="مطالب مرتبط">
        <h2>ادامه مسیر مطالعه</h2>
        <div class="related-chips">{chips}</div>
      </aside>"""


def build_page(
    slug: str,
    title: str,
    desc: str,
    kicker: str,
    lead: str,
    sections: list[tuple[str, str, str]],
    faqs: list[tuple[str, str]],
    related: list[tuple[str, str]],
    checklist: list[str] | None = None,
) -> str:
    rel = Path("education/konkour") / slug
    url = f"{BASE}/education/konkour/{slug}"
    header = mosahab.build_header(rel)
    # Fix footer paths for depth 2
    prefix = "../../"
    toc = toc_from_sections(sections)
    body_parts = []
    for sid, label, html in sections:
        body_parts.append(f'        <h2 id="{sid}">{label}</h2>\n        {html}')
    if checklist:
        items = "\n".join(f"          <li>{x}</li>" for x in checklist)
        body_parts.append(
            f'        <h2 id="checklist">چک‌لیست سریع</h2>\n        <ul class="checklist">\n{items}\n        </ul>'
        )
    body_parts.append(f'        <h2 id="faq">سوالات متداول</h2>\n        {faq_html(faqs)}')
    body_parts.append(BOLOK_TIP)
    body = "\n\n".join(body_parts)

    schemas = [
        breadcrumb_ld(title, url),
        article_ld(title, desc, url),
        faq_ld(faqs),
    ]
    schema_tags = "\n".join(
        f'  <script type="application/ld+json">\n  {json.dumps(s, ensure_ascii=False)}\n  </script>'
        for s in schemas
    )

    share_title = quote(title)
    share_url = quote(url, safe="")

    return f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0c0e12" />
  <meta name="description" content="{desc}" />
  <title>{title} · بلوک</title>
  <link rel="canonical" href="{url}" />
  <link rel="icon" href="{prefix}assets/bolok-logo.svg?v={V_NEW}" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="{prefix}styles.css?v={V_NEW}" />
  <script src="{prefix}app.js?v={V_NEW}" defer></script>
  <meta property="og:type" content="article" />
  <meta property="og:locale" content="fa_IR" />
  <meta property="og:site_name" content="بلوک" />
  <meta property="og:title" content="{title} · بلوک" />
  <meta property="og:description" content="{desc}" />
  <meta property="og:url" content="{url}" />
  <meta property="og:image" content="{BASE}/assets/bolok-logo.png" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="{title} · بلوک" />
  <meta name="twitter:description" content="{desc}" />
  <meta name="twitter:image" content="{BASE}/assets/bolok-logo.png" />
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large" />
  <meta name="author" content="بلوک" />
  <meta name="article:modified_time" content="{TODAY}" />
  <link rel="manifest" href="{prefix}site.webmanifest" />
  <link rel="alternate" href="{url}" hreflang="fa-IR" />
{schema_tags}
</head>
<body>
  <a class="skip-link" href="#main">پرش به محتوا</a>
  <div class="read-progress" data-read-progress aria-hidden="true"></div>
  <div class="aurora" aria-hidden="true"></div>
  <div class="dot-grid" aria-hidden="true"></div>
  <div class="grain" aria-hidden="true"></div>
{header}
  <main id="main" class="container">
    <div class="edu-hero">
      <a class="back-home" href="index.html">→ بازگشت به کنکور سراسری</a>
      <p class="edu-kicker">{kicker}</p>
      <h1>{title}</h1>
      <p class="edu-lead">{lead}</p>
      <p class="article-meta"><span>به‌روزرسانی: {TODAY}</span><span>مرجع: سازمان سنجش</span><span>نویسنده: بلوک</span></p>
      <div class="share-row" data-share-row aria-label="اشتراک‌گذاری">
        <span>اشتراک‌گذاری:</span>
        <button type="button" class="share-btn" data-copy-link="{url}">کپی لینک</button>
        <a class="share-btn" href="https://t.me/share/url?url={share_url}&text={share_title}" target="_blank" rel="noopener noreferrer">تلگرام</a>
        <a class="share-btn" href="https://wa.me/?text={share_title}%20{share_url}" target="_blank" rel="noopener noreferrer">واتساپ</a>
      </div>
    </div>

    <div class="article-layout">
{toc}
      <article class="article-body">
        {DISCLAIMER}

{body}

{related_block(related)}
        <div class="article-cta-row">
          <a class="btn btn-ghost" href="https://www.sanjesh.org" target="_blank" rel="noopener noreferrer">سایت سنجش</a>
          <a class="btn btn-ghost" href="index.html">هاب کنکور</a>
          <a class="btn btn-primary" href="{prefix}index.html#download">دانلود اپ بلوک</a>
        </div>
      </article>
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
          <a class="btn btn-light" href="{prefix}index.html#download">دانلود اپ</a>
          <a class="btn btn-ghost mega-cta-ghost" href="{prefix}search.html">جستجوی مطالب</a>
        </div>
      </div>
      <div class="site-mega-grid">
        <div class="mega-brand">
          <a class="mega-logo" href="{prefix}index.html">
            <img src="{prefix}assets/bolok-logo.svg?v={V_NEW}" alt="بلوک" width="48" height="48" loading="lazy" decoding="async" />
            <span>بلوک</span>
          </a>
          <p class="mega-tagline">برنامه‌ریز مطالعه فارسی برای کنکور، امتحان و یادگیری جدی.</p>
          <a class="mega-mail" href="mailto:bolokadmin@gmail.com">bolokadmin@gmail.com</a>
        </div>
        <nav class="mega-col" aria-label="مطالب آموزشی">
          <h3>آموزش کنکور</h3>
          <a href="index.html">هاب کنکور سراسری</a>
          <a href="sabt-nam.html">ثبت نام کنکور</a>
          <a href="entekhab-reshte-1405.html">انتخاب رشته</a>
          <a href="moshavere/index.html">مشاوره کنکور</a>
          <a href="taghirat-konkour-1405.html">تغییرات کنکور</a>
          <a href="termim-moadel-1405.html">ترمیم معدل</a>
        </nav>
        <nav class="mega-col" aria-label="محصول">
          <h3>محصول</h3>
          <a href="{prefix}index.html#download">دانلود اپ</a>
          <a href="{prefix}search.html">جستجو</a>
          <a href="{prefix}about.html">درباره ما</a>
        </nav>
        <div class="mega-col mega-col--trust">
          <h3>اعتماد و حقوقی</h3>
          <a href="{prefix}terms.html">شرایط استفاده</a>
          <a href="{prefix}privacy.html">حریم خصوصی</a>
          <a href="https://www.sanjesh.org" target="_blank" rel="noopener noreferrer">سازمان سنجش</a>
        </div>
      </div>
      <div class="mega-bar">
        <p>© بلوک · <a href="https://bolokapp.ir/">bolokapp.ir</a></p>
        <p class="mega-bar-note">محتوای آموزشی مکمل اپ است؛ تاریخ‌های رسمی را از سنجش چک کنید.</p>
      </div>
    </div>
  </footer>
  <button type="button" class="back-top" data-back-top aria-label="بازگشت به بالا">↑</button>
</body>
</html>
"""


# ——— Content definitions (original Bolok copy) ———

PAGES: list[dict] = []


def add(page: dict) -> None:
    PAGES.append(page)


add(
    dict(
        slug="site-sanjesh.html",
        title="سایت سازمان سنجش sanjesh.org",
        desc="راهنمای کامل سایت سازمان سنجش آموزش کشور: ثبت‌نام کنکور، کارنامه، انتخاب رشته، کارت ورود و پورتال مای‌سنجش",
        kicker="سامانه رسمی · کنکور سراسری",
        lead="سایت سازمان سنجش (sanjesh.org) تنها مرجع رسمی ثبت‌نام، کارت ورود، کارنامه و انتخاب رشته کنکور سراسری است. این راهنما مسیر ورود، بخش‌های مهم و اشتباهات رایج را شفاف می‌کند.",
        sections=[
            (
                "what",
                "سایت سنجش چیست و چه خدماتی دارد؟",
                """<p>سازمان سنجش آموزش کشور سامانه رسمی آزمون‌های سراسری است. از طریق <a href="https://www.sanjesh.org" target="_blank" rel="noopener noreferrer">sanjesh.org</a> داوطلب معمولاً این کارها را انجام می‌دهد:</p>
<ul>
<li>دانلود دفترچه ثبت‌نام و انتخاب رشته</li>
<li>ثبت‌نام و ویرایش اطلاعات کنکور</li>
<li>دریافت کارت ورود به جلسه</li>
<li>مشاهده کارنامه اولیه و نتایج نهایی</li>
<li>تکمیل فرم انتخاب رشته و دریافت کد رهگیری</li>
</ul>
<p>برای بسیاری از خدمات، ورود از طریق پورتال کاربری (مای‌سنجش) با کد ملی و رمز عبور انجام می‌شود.</p>""",
            ),
            (
                "how",
                "نحوه ورود صحیح به سایت سنجش",
                """<ol>
<li>آدرس را دستی تایپ کنید: <strong>www.sanjesh.org</strong> — از لینک‌های ناشناس پیامکی پرهیز کنید.</li>
<li>از منوی «سراسری» اطلاعیه سال موردنظر را باز کنید.</li>
<li>برای ثبت‌نام/انتخاب رشته وارد پورتال کاربری شوید.</li>
<li>پس از هر عملیات مهم، پرینت یا اسکرین رسید و کد رهگیری را ذخیره کنید.</li>
</ol>
<p>در ساعات اوج (پایان مهلت) سایت ممکن است کند شود؛ اتصال پایدار و زمان‌بندی زودهنگام کمک می‌کند.</p>""",
            ),
            (
                "sections",
                "بخش‌های پرتکرار برای داوطلب کنکور",
                """<ul>
<li><strong>ثبت‌نام:</strong> فرم اطلاعات فردی، تحصیلی، سهمیه و گروه آزمایشی</li>
<li><strong>کارت ورود:</strong> معمولاً چند روز قبل از آزمون</li>
<li><strong>کارنامه اولیه:</strong> رتبه، تراز و وضعیت مجاز بودن</li>
<li><strong>انتخاب رشته:</strong> تا سقف اعلام‌شده در دفترچه (مثلاً ۱۵۰ کد رشته‌محل در دوره‌های اخیر)</li>
</ul>
<p>صفحات مرتبط بلوک: <a href="sabt-nam.html">ثبت نام</a>، <a href="kart-vorod-jalase.html">کارت ورود</a>، <a href="site-entekhab-reshte.html">سایت انتخاب رشته</a>.</p>""",
            ),
            (
                "security",
                "امنیت و جلوگیری از کلاهبرداری",
                """<p>هرگز رمز عبور یا کد ملی را در سایت‌های متفرقه وارد نکنید. سنجش هزینه رسمی را از درگاه اعلام‌شده می‌گیرد؛ پیام‌هایی که «لینک پرداخت فوری» می‌فرستند را جدی نگیرید. اگر حساب قفل شد، فقط از مسیر بازیابی رسمی پورتال اقدام کنید.</p>""",
            ),
        ],
        faqs=[
            ("آیا دانشگاه آزاد هم از سایت سنجش ثبت‌نام می‌شود؟", "در سال‌های اخیر ثبت‌نام آزمون سراسری و مسیر باآزمون آزاد تا حد زیادی از طریق سنجش ادغام شده؛ جزئیات همان سال را از دفترچه بخوانید."),
            ("مای‌سنجش چیست؟", "پورتال کاربری داوطلب روی بستر سنجش است که با آن ثبت‌نام، کارت، کارنامه و انتخاب رشته پیگیری می‌شود."),
            ("اگر سایت باز نشد چه کنم؟", "آدرس را دوباره چک کنید، کش مرورگر را پاک کنید، از شبکه دیگر امتحان کنید و در ساعات خلوت‌تر دوباره وارد شوید."),
        ],
        related=[
            ("sabt-nam.html", "ثبت نام کنکور"),
            ("zaman-sabt-nam.html", "زمان ثبت نام"),
            ("site-entekhab-reshte.html", "سایت انتخاب رشته"),
            ("kart-vorod-jalase.html", "کارت ورود"),
        ],
        checklist=[
            "آدرس رسمی sanjesh.org را ذخیره کرده‌ام",
            "اطلاعیه سال خودم را پیدا کرده‌ام",
            "ورود پورتال را تست کرده‌ام",
            "از لینک‌های ناشناس استفاده نمی‌کنم",
        ],
    )
)

add(
    dict(
        slug="site-entekhab-reshte.html",
        title="سایت انتخاب رشته کنکور ۱۴۰۵",
        desc="سایت انتخاب رشته کنکور سراسری ۱۴۰۵ در sanjesh.org: ورود به مای‌سنجش، دفترچه، فرم ۱۵۰ انتخاب و کد رهگیری",
        kicker="انتخاب رشته · سامانه رسمی",
        lead="سایت انتخاب رشته کنکور فقط از مسیر سازمان سنجش فعال می‌شود. بعد از کارنامه اولیه و مجاز شدن، دفترچه را می‌خوانید، اولویت می‌چینید و فرم را در پورتال ثبت می‌کنید.",
        sections=[
            (
                "when",
                "چه زمانی سایت انتخاب رشته باز می‌شود؟",
                """<p>پس از اعلام نتایج اولیه، سنجش بازه انتخاب رشته را اعلام می‌کند. برای کنکور ۱۴۰۵ این بازه در مهر ماه اعلام و در دوره‌های اخیر تا حدود ۲۰ مهر تمدید شد. همیشه تاریخ دقیق را از اطلاعیه همان سال بگیرید — نه از خاطره‌های سال قبل.</p>""",
            ),
            (
                "steps",
                "مراحل کار در سایت انتخاب رشته",
                """<ol>
<li>ورود به <a href="https://www.sanjesh.org" target="_blank" rel="noopener noreferrer">sanjesh.org</a> و بخش سراسری</li>
<li>دانلود دفترچه انتخاب رشته گروه آزمایشی خود</li>
<li>بررسی اصلاحیه‌ها قبل از ثبت نهایی</li>
<li>ورود به پورتال و تأیید سوابق تحصیلی</li>
<li>وارد کردن کد رشته‌محل‌ها به ترتیب اولویت</li>
<li>تأیید نهایی و دریافت رسید / کد رهگیری</li>
</ol>
<p>راهنمای کامل‌تر اولویت‌بندی: <a href="entekhab-reshte-1405.html">انتخاب رشته کنکور ۱۴۰۵</a>.</p>""",
            ),
            (
                "limits",
                "سقف انتخاب و نکات فنی فرم",
                """<p>در دوره‌های اخیر داوطلب مجاز می‌توانست حداکثر حدود ۱۵۰ کد رشته‌محل ثبت کند. ترتیب انتخاب‌ها همان اولویت قبولی است؛ جابه‌جایی بعد از مهلت معمولاً ممکن نیست مگر ویرایش داخل همان بازه. کد اشتباه، شرط بومی، تعهد خدمت و جنسیت را دوبار چک کنید.</p>""",
            ),
            (
                "edit",
                "ویرایش در سایت انتخاب رشته",
                """<p>تا پایان مهلت اعلام‌شده معمولاً می‌توانید فرم را ویرایش کنید. جزئیات را در <a href="virayesh-entekhab-reshte.html">ویرایش انتخاب رشته</a> بخوانید.</p>""",
            ),
        ],
        faqs=[
            ("آیا انتخاب رشته رایگان است؟", "معمولاً ثبت فرم انتخاب رشته آزمون سراسری هزینه جداگانه ندارد؛ هر هزینه احتمالی فقط طبق اطلاعیه رسمی همان سال است."),
            ("بدون کارنامه اولیه می‌توانم وارد شوم؟", "خیر؛ ابتدا باید نتایج اولیه و وضعیت مجاز بودن مشخص شود."),
            ("انتخاب رشته آزاد جداست؟", "مسیر آزاد ممکن است سامانه جدا یا زمان جدا داشته باشد؛ صفحه <a href='azad-1405.html'>انتخاب رشته آزاد</a> را ببینید."),
        ],
        related=[
            ("entekhab-reshte-1405.html", "راهنمای انتخاب رشته"),
            ("virayesh-entekhab-reshte.html", "ویرایش انتخاب رشته"),
            ("eslahiye-daftarche.html", "اصلاحیه دفترچه"),
            ("karname-avvalie-1405.html", "کارنامه اولیه"),
        ],
        checklist=[
            "دفترچه گروه خودم را دانلود کرده‌ام",
            "اصلاحیه‌ها را خوانده‌ام",
            "فهرست پیش‌نویس اولویت‌ها آماده است",
            "کد رهگیری نهایی را ذخیره کرده‌ام",
        ],
    )
)

add(
    dict(
        slug="virayesh-entekhab-reshte.html",
        title="ویرایش انتخاب رشته کنکور سراسری ۱۴۰۵",
        desc="ویرایش انتخاب رشته کنکور ۱۴۰۵: تا کی ممکن است، چند بار می‌توان تغییر داد و چطور در سایت سنجش اصلاح کنیم",
        kicker="انتخاب رشته · ویرایش فرم",
        lead="اگر کد رشته‌محل را اشتباه زده‌اید یا اولویت‌ها را عوض کرده‌اید، معمولاً فقط داخل مهلت رسمی انتخاب رشته می‌توانید فرم را در سایت سنجش ویرایش کنید.",
        sections=[
            (
                "window",
                "بازه مجاز ویرایش",
                """<p>ویرایش انتخاب رشته معمولاً از شروع تا پایان مهلت همان دوره فعال است. برای ۱۴۰۵، بازه انتخاب رشته در مهر اعلام و تمدید شد؛ خارج از این پنجره، تغییر فرم به‌صورت عادی ممکن نیست. تمدید را فقط از اطلاعیه سنجش جدی بگیرید.</p>""",
            ),
            (
                "how",
                "چطور ویرایش کنیم؟",
                """<ol>
<li>وارد پورتال کاربری سنجش شوید</li>
<li>فرم انتخاب رشته ثبت‌شده را باز کنید</li>
<li>کدها را اصلاح یا جابه‌جا کنید</li>
<li>دوباره تأیید نهایی بگیرید و رسید جدید را ذخیره کنید</li>
</ol>
<p>بعد از هر ویرایش، نسخه قبلی را کنار نگذارید تا اگر نیاز به مقایسه بود، تاریخچه داشته باشید.</p>""",
            ),
            (
                "mistakes",
                "چه چیزهایی را حتماً اصلاح کنید؟",
                """<ul>
<li>کد رشته‌محل غلط یا جابه‌جا</li>
<li>نادیده گرفتن شرط معدل/بومی/تعهد</li>
<li>اولویت‌بندی احساسی بدون شانس واقع‌بینانه</li>
<li>فراموش کردن رشته‌های علاقه‌مند در انتهای لیست امن</li>
</ul>""",
            ),
        ],
        faqs=[
            ("چند بار می‌توان ویرایش کرد؟", "معمولاً تا وقتی مهلت باز است می‌توانید چندبار اصلاح کنید؛ محدودیت دقیق را از متن سامانه همان سال بخوانید."),
            ("بعد از اتمام مهلت چی؟", "بعد از بسته شدن سامانه، ویرایش عادی ممکن نیست مگر اطلاعیه خاص سنجش."),
            ("ویرایش باعث حذف انتخاب قبلی می‌شود؟", "فرم جدید جایگزین می‌شود؛ حتماً رسید نهایی آخر را نگه دارید."),
        ],
        related=[
            ("site-entekhab-reshte.html", "سایت انتخاب رشته"),
            ("entekhab-reshte-1405.html", "انتخاب رشته ۱۴۰۵"),
            ("eslahiye-daftarche.html", "اصلاحیه دفترچه"),
            ("elam-natayej-1405.html", "نتایج نهایی"),
        ],
        checklist=[
            "داخل مهلت رسمی هستم",
            "کدهای مشکوک را علامت زده‌ام",
            "بعد از ویرایش رسید جدید گرفته‌ام",
        ],
    )
)

add(
    dict(
        slug="taghirat-konkour-1405.html",
        title="تغییرات کنکور سراسری ۱۴۰۵",
        desc="تغییرات کنکور ۱۴۰۵: یک نوبت تیرماه، تاثیر قطعی معدل، حذف دروس عمومی از آزمون، حذف زیرگروه و تمرکز روی دروس تخصصی",
        kicker="مصوبات · برنامه‌ریزی",
        lead="کنکور ۱۴۰۵ نسبت به سال‌های دو نوبته تفاوت‌های مهمی دارد. شناخت این تغییرات، منبع مطالعه و استراتژی برنامه‌ریزی شما را عوض می‌کند.",
        sections=[
            (
                "summary",
                "خلاصه مهم‌ترین تغییرات ۱۴۰۵",
                """<ul>
<li><strong>یک نوبت برگزاری:</strong> تمرکز اصلی روی تیرماه (تاریخ دقیق را از سنجش تأیید کنید؛ در اعلام‌های اخیر ۱۱ و ۱۲ تیر مطرح شده بود).</li>
<li><strong>تاثیر سوابق تحصیلی:</strong> نقش معدل نهایی پررنگ‌تر شده و در سیاست‌های اخیر حول تاثیر قطعی حدود ۶۰٪ برای پایه دوازدهم مطرح است — عدد دقیق همان سال را از دفترچه بخوانید.</li>
<li><strong>حذف دروس عمومی از دفترچه آزمون:</strong> عمومی‌ها از مسیر سوابق اثر می‌گذارند؛ در جلسه عمدتاً تخصصی‌ها را می‌زنید.</li>
<li><strong>حذف زیرگروه‌ها:</strong> ضرایب یکپارچه‌تر شده و میانگین وزنی دروس تخصصی مبنای نمره کل است.</li>
</ul>""",
            ),
            (
                "study",
                "این تغییرات برای مطالعه چه معنایی دارد؟",
                """<p>باید زمان بیشتری روی امتحانات نهایی و کیفیت معدل بگذارید و همزمان بانک تست تخصصی را عمیق کار کنید. صفحه <a href="tasir-moadel-1405.html">تاثیر معدل</a> و <a href="termim-moadel-1405.html">ترمیم معدل</a> را جدی بگیرید. برای سال بعد، <a href="barname-1406.html">برنامه ۱۴۰۶</a> را از همین الان ببندید.</p>""",
            ),
            (
                "sources",
                "منابع و حذفیات",
                """<p>منابع بر اساس نظام ۶-۳-۳ و اطلاعیه حذفیات همان سال است. لیست حذفیات را در <a href="hazfiyat-konkour-1405.html">حذفیات کنکور ۱۴۰۵</a> دنبال کنید و نسخه PDF سنجش را دانلود کنید.</p>""",
            ),
        ],
        faqs=[
            ("آیا کنکور ۱۴۰۵ دو مرحله‌ای است؟", "طبق اعلام‌های اخیر، مسیر ۱۴۰۵ یک نوبت اصلی در تیر است؛ هر تغییر را فقط از سنجش تأیید کنید."),
            ("عمومی‌ها کاملاً بی‌اثرند؟", "از دفترچه سوالات آزمون حذف شده‌اند اما از مسیر سوابق تحصیلی اثر دارند."),
            ("زیرگروه برگشته؟", "در سیاست اخیر حذف زیرگروه‌ها اعمال شده؛ ضرایب را از دفترچه همان سال بخوانید."),
        ],
        related=[
            ("tasir-moadel-1405.html", "تاثیر معدل"),
            ("hazfiyat-konkour-1405.html", "حذفیات"),
            ("termim-moadel-1405.html", "ترمیم معدل"),
            ("barname-1406.html", "برنامه ۱۴۰۶"),
        ],
        checklist=[
            "تک‌نوبته بودن را در برنامه‌ام لحاظ کرده‌ام",
            "نهایی دوازدهم / ترمیم را جدی گرفته‌ام",
            "حذفیات رسمی را دانلود کرده‌ام",
        ],
    )
)

add(
    dict(
        slug="kart-vorod-jalase.html",
        title="کارت ورود به جلسه کنکور سراسری",
        desc="کارت ورود به جلسه کنکور: زمان دریافت از سایت سنجش، بررسی مشخصات حوزه، اشتباهات رایج و اگر کارت نیامد چه کنیم",
        kicker="قبل از آزمون · کارت جلسه",
        lead="بدون کارت ورود به جلسه معمولاً اجازه حضور در حوزه را ندارید. چند روز قبل از آزمون از پورتال سنجش کارت را بگیرید، چاپ کنید و مشخصات را خط‌به‌خط چک کنید.",
        sections=[
            (
                "when",
                "زمان دریافت کارت",
                """<p>کارت ورود معمولاً چند روز مانده به آزمون روی سامانه سنجش فعال می‌شود. تاریخ دقیق هر سال با اطلاعیه رسمی می‌آید. همان روز اول شلوغ است؛ بهتر است زودتر دانلود و چاپ کنید.</p>""",
            ),
            (
                "how",
                "نحوه دریافت",
                """<ol>
<li>ورود به سایت سنجش / پورتال کاربری</li>
<li>باز کردن لینک کارت ورود به جلسه سال مربوط</li>
<li>کنترل عکس، نام، شماره داوطلبی، گروه و آدرس حوزه</li>
<li>چاپ خوانا + همراه داشتن کارت ملی/شناسنامه طبق ضوابط همان سال</li>
</ol>""",
            ),
            (
                "errors",
                "اگر اطلاعات کارت اشتباه بود",
                """<p>طبق اطلاعیه همان سال، مسیر اصلاح عکس یا مشخصات اعلام می‌شود (گاهی باجه رفع نقص). تا قبل از آزمون پیگیری کنید؛ روز جلسه دیر است. اگر کارت اصلاً صادر نشد، وضعیت ثبت‌نام و پرداخت را در پورتال چک کنید.</p>
<p>مرتبط: <a href="moshavere/gom-shodan-kart-vorod.html">گم شدن کارت ورود</a>.</p>""",
            ),
        ],
        faqs=[
            ("آیا نسخه موبایل کافی است؟", "معمولاً نسخه چاپی خواسته می‌شود؛ متن اطلاعیه همان سال را ملاک بگیرید."),
            ("کارت ترمیم معدل جداست؟", "بله؛ مسیر امتحانات نهایی/ترمیم اغلب از مای‌مدیو است. صفحه ترمیم معدل را ببینید."),
            ("حوزه امتحان کجا اعلام می‌شود؟", "روی خود کارت ورود درج می‌شود."),
        ],
        related=[
            ("sabt-nam.html", "ثبت نام"),
            ("site-sanjesh.html", "سایت سنجش"),
            ("termim-moadel-1405.html", "ترمیم معدل"),
            ("moshavere/gom-shodan-kart-vorod.html", "گم شدن کارت"),
        ],
        checklist=[
            "کارت را دانلود و چاپ کرده‌ام",
            "آدرس حوزه را روی نقشه چک کرده‌ام",
            "مدرک شناسایی همراه دارم",
        ],
    )
)

add(
    dict(
        slug="termim-moadel-1405.html",
        title="ترمیم معدل ۱۴۰۵",
        desc="ترمیم معدل ۱۴۰۵ برای کنکور: ثبت‌نام، تأثیر روی سوابق تحصیلی، کارت ورود امتحان، غیبت و تفاوت با معدل دیپلم",
        kicker="سوابق تحصیلی · نهایی",
        lead="با پررنگ‌شدن تاثیر معدل در کنکور، ترمیم نمرات نهایی برای خیلی از داوطلبان حیاتی شده است. ترمیم معمولاً نمره سابقه را برای سنجش بهتر می‌کند و الزاماً دیپلم جدید صادر نمی‌کند.",
        sections=[
            (
                "why",
                "چرا ترمیم معدل مهم است؟",
                """<p>وقتی بخش مهمی از نمره کل از سوابق می‌آید، یک نمره ضعیف نهایی می‌تواند رتبه را جابه‌جا کند. ترمیم فرصت بهبود همان درس‌هاست. جزئیات تاثیر را در <a href="tasir-moadel-1405.html">تاثیر معدل در کنکور</a> ببینید.</p>""",
            ),
            (
                "register",
                "ثبت‌نام و سامانه",
                """<p>ثبت‌نام ایجاد/ترمیم سابقه معمولاً از مسیرهای اعلام‌شده آموزش‌وپرورش و سنجش (مانند مای‌مدیو / مای‌سنجش) انجام می‌شود. زمان‌بندی خرداد و نوبت‌های جبرانی را فقط از اطلاعیه رسمی بخوانید.</p>""",
            ),
            (
                "rules",
                "قواعد مهم غیبت و اعتبار نمره",
                """<p>در سیاست‌های اخیر، در اولین ترمیم اگر در جلسه‌ای غایب باشید ممکن است نمره معتبر قبلی همان درس لحاظ شود؛ اما در ترمیم مجدد، غیبت می‌تواند صفر محسوب شود. متن بخشنامه همان سال را دقیق بخوانید.</p>
<p>نمرات ترمیم معمولاً برای سوابق کنکور اعتبار دارند و جایگزین خودکار معدل درج‌شده روی دیپلم به‌معنای صدور دیپلم جدید نیستند.</p>""",
            ),
            (
                "card",
                "کارت ورود امتحان ترمیم",
                """<p>برای حضور در جلسه ترمیم/نهایی باید کارت ورود مربوط را به‌موقع بگیرید. مسیر اغلب آنلاین است؛ جزئیات را با صفحه <a href="kart-vorod-jalase.html">کارت ورود</a> و اطلاعیه my.medu.ir هماهنگ کنید.</p>""",
            ),
        ],
        faqs=[
            ("ترمیم معدل دیپلم را عوض می‌کند؟", "معمولاً برای اعمال در سوابق کنکور است و به‌معنای چاپ دیپلم جدید نیست."),
            ("پشت‌کنکوری هم می‌تواند ترمیم کند؟", "در چارچوب ضوابط همان سال بله؛ شرایط فارغ‌التحصیلان را از بخشنامه بخوانید."),
            ("کدام درس‌ها را ترمیم کنم؟", "درس‌هایی با نمره ضعیف و ضریب اثر بالا در گروه خودتان اولویت دارند."),
        ],
        related=[
            ("tasir-moadel-1405.html", "تاثیر معدل"),
            ("taghirat-konkour-1405.html", "تغییرات ۱۴۰۵"),
            ("rad-medu.html", "راد مدیو"),
            ("barname-1406.html", "برنامه ۱۴۰۶"),
        ],
        checklist=[
            "بخشنامه ترمیم همان سال را خوانده‌ام",
            "درس‌های هدف را انتخاب کرده‌ام",
            "زمان کارت و حوزه را می‌دانم",
        ],
    )
)

add(
    dict(
        slug="takhmin-rotbe.html",
        title="تخمین رتبه کنکور سراسری",
        desc="راهنمای تخمین رتبه و تراز کنکور: نقش درصد دروس تخصصی، معدل، سهمیه مناطق و محدودیت‌های تخمین تقریبی",
        kicker="تحلیل عملکرد · انتخاب رشته",
        lead="تخمین رتبه فقط یک برآورد است، نه کارنامه رسمی. با درصد دروس تخصصی، معدل و سهمیه می‌توانید حدود شانس را بسنجید و برای انتخاب رشته آماده‌تر شوید.",
        sections=[
            (
                "how",
                "تخمین رتبه چگونه کار می‌کند؟",
                """<p>ابزارهای تخمین معمولاً درصد یا نمره خام دروس را با آمار سال‌های قبل و مدل تراز مقایسه می‌کنند. هرچه جامعه آماری و مدل به سال جاری نزدیک‌تر باشد، خطا کمتر است — اما هیچ تخمینی جای کارنامه سنجش را نمی‌گیرد.</p>""",
            ),
            (
                "inputs",
                "ورودی‌های مهم برای تخمین بهتر",
                """<ul>
<li>درصد یا تعداد درست/غلط دروس تخصصی</li>
<li>معدل و سوابق (با توجه به ضرایب همان سال)</li>
<li>سهمیه منطقه یا ایثارگران</li>
<li>گروه آزمایشی صحیح</li>
</ul>
<p>برای درک تاثیر معدل، <a href="tasir-moadel-1405.html">این صفحه</a> را بخوانید.</p>""",
            ),
            (
                "use",
                "از تخمین چطور در انتخاب رشته استفاده کنیم؟",
                """<p>تخمین را برای ساختن سه لایه اولویت به‌کار ببرید: خوش‌بینانه، واقع‌بینانه، محافظه‌کارانه. سپس با دفترچه و ظرفیت‌ها در <a href="entekhab-reshte-1405.html">انتخاب رشته</a> نهایی کنید. نرم‌افزار کمکی: <a href="narmafzar-entekhab-reshte.html">نرم‌افزار انتخاب رشته</a>.</p>""",
            ),
        ],
        faqs=[
            ("آیا تخمین دقیق است؟", "خیر؛ تقریبی است و به آمار سال‌های قبل وابسته است."),
            ("بدون معدل می‌توان تخمین زد؟", "می‌شود؛ اما با پررنگ شدن سوابق، بدون معدل خطا بیشتر می‌شود."),
            ("کی تخمین مفید است؟", "بعد از آزمون‌های جامع و قبل از انتخاب رشته برای تنظیم انتظارات."),
        ],
        related=[
            ("entekhab-reshte-1405.html", "انتخاب رشته"),
            ("karname-avvalie-1405.html", "کارنامه اولیه"),
            ("narmafzar-entekhab-reshte.html", "نرم‌افزار"),
            ("tasir-moadel-1405.html", "تاثیر معدل"),
        ],
        checklist=[
            "درصدهای واقعی آخر را وارد کرده‌ام",
            "سهمیه را درست انتخاب کرده‌ام",
            "سه سناریو اولویت ساخته‌ام",
        ],
    )
)

add(
    dict(
        slug="hazfiyat-konkour-1405.html",
        title="حذفیات کنکور سراسری ۱۴۰۵",
        desc="حذفیات کنکور ۱۴۰۵: چرا مهم است، از کجا فایل رسمی را بگیرید و چطور برنامه مطالعه را با لیست حذفی هماهنگ کنید",
        kicker="منابع آزمون · بهینه‌سازی مطالعه",
        lead="لیست حذفیات کنکور مشخص می‌کند کدام بخش کتاب‌ها در آزمون نمی‌آید. مطالعه هدفمند یعنی اول فایل رسمی سنجش را بگیرید، بعد برنامه را سبک کنید.",
        sections=[
            (
                "why",
                "چرا حذفیات را جدی بگیریم؟",
                """<p>حجم کتاب‌ها بالاست. دانستن حذفیات رسمی باعث می‌شود زمان را روی مباحث باقی‌مانده و تست‌خیز بگذارید. اتکا به لیست‌های غیررسمی کانال‌ها خطرناک است.</p>""",
            ),
            (
                "where",
                "از کجا دانلود کنیم؟",
                """<p>فقط از اطلاعیه منابع و حذفیات روی <a href="https://www.sanjesh.org" target="_blank" rel="noopener noreferrer">sanjesh.org</a>. فایل را با گروه آزمایشی خودتان تطبیق دهید و تاریخ انتشار را چک کنید.</p>""",
            ),
            (
                "plan",
                "چطور در برنامه اعمال کنیم؟",
                """<ul>
<li>مباحث حذف‌شده را از جدول مطالعه خط بزنید</li>
<li>بودجه‌بندی آزمون‌های آزمایشی را با حذفیات هم‌راستا کنید</li>
<li>برای نهایی و ترمیم، حذفیات کنکور را با بارم‌بندی امتحان نهایی قاطی نکنید</li>
</ul>
<p>برنامه سال بعد: <a href="barname-1406.html">برنامه‌ریزی ۱۴۰۶</a>.</p>""",
            ),
        ],
        faqs=[
            ("حذفیات هر سال یکی است؟", "خیر؛ ممکن است تغییر کند. همیشه فایل همان سال را ملاک بگیرید."),
            ("حذفیات عمومی‌ها چه می‌شود؟", "با حذف عمومی از آزمون، تمرکز حذفیات روی تخصصی‌ها و منابع اعلامی است."),
            ("آیا معلم می‌تواند حذفیات بدهد؟", "کمک آموزشی خوب است؛ اما سند رسمی فقط سنجش است."),
        ],
        related=[
            ("taghirat-konkour-1405.html", "تغییرات ۱۴۰۵"),
            ("barname-1406.html", "برنامه ۱۴۰۶"),
            ("moshavere/index.html", "مشاوره"),
            ("site-sanjesh.html", "سایت سنجش"),
        ],
        checklist=[
            "PDF رسمی حذفیات را دارم",
            "برنامه‌ام را با آن به‌روز کرده‌ام",
            "از لیست‌های نامعتبر استفاده نمی‌کنم",
        ],
    )
)

add(
    dict(
        slug="karname-avvalie-1405.html",
        title="کارنامه اولیه کنکور ۱۴۰۵",
        desc="کارنامه اولیه کنکور ۱۴۰۵: رتبه، تراز، وضعیت مجاز بودن، سهمیه و آماده‌سازی برای انتخاب رشته",
        kicker="نتایج اولیه · تحلیل کارنامه",
        lead="کارنامه اولیه وضعیت علمی شما را برای انتخاب رشته روشن می‌کند: نمرات، تراز، رتبه‌ها و مجاز بودن در دوره‌ها. قبل از عجله برای فرم، کارنامه را دقیق بخوانید.",
        sections=[
            (
                "read",
                "چه چیزهایی در کارنامه اولیه می‌آید؟",
                """<ul>
<li>درصد یا نمره دروس</li>
<li>نمره کل / تراز</li>
<li>رتبه در سهمیه و رتبه کشوری (بر اساس قالب همان سال)</li>
<li>وضعیت مجاز بودن برای دوره‌های مختلف</li>
</ul>
<p>بدون فهمیدن این بخش‌ها، اولویت‌بندی انتخاب رشته کور است.</p>""",
            ),
            (
                "next",
                "بعد از کارنامه چه کار کنیم؟",
                """<ol>
<li>وضعیت مجاز بودن را مشخص کنید</li>
<li>دفترچه انتخاب رشته را دانلود کنید</li>
<li>با تخمین و علاقه، پیش‌نویس اولویت بسازید</li>
<li>در مهلت، فرم را در سایت سنجش ثبت کنید</li>
</ol>
<p>ادامه مسیر: <a href="site-entekhab-reshte.html">سایت انتخاب رشته</a> و <a href="entekhab-reshte-1405.html">راهنمای انتخاب رشته</a>.</p>""",
            ),
            (
                "mistakes",
                "اشتباهات رایج در خواندن کارنامه",
                """<ul>
<li>توجه فقط به رتبه کشوری و نادیده گرفتن سهمیه</li>
<li>مقایسه با سال قبل بدون درنظر گرفتن تغییرات آزمون</li>
<li>شروع انتخاب رشته قبل از خواندن اصلاحیه دفترچه</li>
</ul>""",
            ),
        ],
        faqs=[
            ("کارنامه اولیه همان نتیجه نهایی است؟", "خیر؛ نهایی بعد از انتخاب رشته و اعلام قبولی می‌آید."),
            ("اگر مجاز نشدم چه؟", "مسیرهای بدون‌آزمون یا دوره‌های دیگر را طبق کارنامه و دفترچه بررسی کنید."),
            ("کی کارنامه می‌آید؟", "طبق اطلاعیه نتایج اولیه همان سال روی سنجش."),
        ],
        related=[
            ("elam-natayej-1405.html", "نتایج نهایی"),
            ("entekhab-reshte-1405.html", "انتخاب رشته"),
            ("takhmin-rotbe.html", "تخمین رتبه"),
            ("site-sanjesh.html", "سایت سنجش"),
        ],
        checklist=[
            "کارنامه را ذخیره/چاپ کرده‌ام",
            "وضعیت مجاز بودن را فهمیده‌ام",
            "پیش‌نویس انتخاب رشته را شروع کرده‌ام",
        ],
    )
)

# Expanded replacements for thin pages
add(
    dict(
        slug="entekhab-reshte-1405.html",
        title="انتخاب رشته کنکور ۱۴۰۵",
        desc="راهنمای جامع انتخاب رشته کنکور سراسری ۱۴۰۵: زمان، دفترچه، اولویت‌بندی تا ۱۵۰ کد، اشتباهات رایج و چک‌لیست نهایی",
        kicker="انتخاب رشته · کنکور سراسری",
        lead="انتخاب رشته کنکور ۱۴۰۵ مرحله‌ای است که رتبه را به صندلی دانشگاه وصل می‌کند. با کارنامه اولیه، دفترچه و اولویت‌بندی هوشمند، فرم را در سایت سنجش کامل کنید.",
        sections=[
            (
                "time",
                "زمان انتخاب رشته ۱۴۰۵",
                """<p>پس از نتایج اولیه، سنجش بازه را اعلام می‌کند. در ۱۴۰۵ انتخاب رشته از حدود ۱۳ مهر آغاز و تا حدود ۲۰ مهر تمدید شد. برای سال‌های بعد فقط اطلاعیه جدید را مبنا بگیرید. صفحه <a href="site-entekhab-reshte.html">سایت انتخاب رشته</a> را برای ورود سامانه ببینید.</p>""",
            ),
            (
                "prepare",
                "آماده‌سازی قبل از باز شدن فرم",
                """<ul>
<li>تحلیل <a href="karname-avvalie-1405.html">کارنامه اولیه</a></li>
<li>دانلود دفترچه گروه آزمایشی</li>
<li>مطالعه <a href="eslahiye-daftarche.html">اصلاحیه دفترچه</a></li>
<li>نوشتن پیش‌نویس اولویت‌ها روی کاغذ</li>
</ul>""",
            ),
            (
                "priority",
                "اصول اولویت‌بندی انتخاب‌ها",
                """<p>از علاقه قطعی و رشته‌محل‌های سخت‌تر شروع کنید، لایه میانی واقع‌بینانه بچینید و انتها را با انتخاب‌های امن پر کنید. فقط «اسم دانشگاه» کافی نیست: شهر، هزینه، خوابگاه، تعهد و بازار کار را بسنجید.</p>
<p>سقف تعداد انتخاب در دوره‌های اخیر حدود ۱۵۰ کد بوده است — عدد دقیق دفترچه همان سال را چک کنید.</p>""",
            ),
            (
                "steps",
                "مراحل ثبت در سامانه",
                """<ol>
<li>ورود به سنجش و پورتال</li>
<li>تأیید سوابق تحصیلی</li>
<li>ورود کدها به ترتیب اولویت</li>
<li>بازبینی و تأیید نهایی</li>
<li>ذخیره کد رهگیری و رسید</li>
</ol>
<p>اگر لازم شد اصلاح کنید: <a href="virayesh-entekhab-reshte.html">ویرایش انتخاب رشته</a>.</p>""",
            ),
            (
                "mistakes",
                "خطاهای پرتکرار",
                """<ul>
<li>کد اشتباه به‌خاطر کپی عجولانه</li>
<li>نادیده گرفتن شرط بومی یا تعهد خدمت</li>
<li>خالی گذاشتن انتهای لیست</li>
<li>تکیه مطلق روی تخمین‌های غیررسمی</li>
</ul>""",
            ),
        ],
        faqs=[
            ("انتخاب رشته کی شروع می‌شود؟", "بعد از کارنامه اولیه و طبق اطلاعیه سنجش؛ در ۱۴۰۵ مهر ماه بود."),
            ("آزاد جداست؟", "اغلب بله؛ <a href='azad-1405.html'>انتخاب رشته آزاد</a> را جدا دنبال کنید."),
            ("نرم‌افزار لازم است؟", "اجباری نیست اما برای مرتب‌کردن علاقه‌ها کمک است؛ صفحه نرم‌افزار بلوک را ببینید."),
        ],
        related=[
            ("site-entekhab-reshte.html", "سایت انتخاب رشته"),
            ("virayesh-entekhab-reshte.html", "ویرایش"),
            ("karname-avvalie-1405.html", "کارنامه اولیه"),
            ("azad-1405.html", "آزاد ۱۴۰۵"),
        ],
        checklist=[
            "دفترچه و اصلاحیه را خوانده‌ام",
            "پیش‌نویس اولویت آماده است",
            "فرم را ثبت و کد رهگیری گرفته‌ام",
            "از پیش‌نمایش نهایی خروجی دارم",
        ],
    )
)

add(
    dict(
        slug="nahve-sabt-nam.html",
        title="نحوه ثبت نام کنکور سراسری",
        desc="نحوه ثبت نام کنکور سراسری گام‌به‌گام در سایت سنجش: دفترچه، مدارک، پرداخت، فرم اینترنتی و کد رهگیری",
        kicker="ثبت نام · آموزش گام‌به‌گام",
        lead="نحوه ثبت نام کنکور سراسری کاملاً اینترنتی و از مسیر سازمان سنجش است. این صفحه مراحل را از ورود به سایت تا دریافت کد رهگیری به‌صورت عملی توضیح می‌دهد.",
        sections=[
            (
                "prep",
                "قبل از ورود به سامانه",
                """<ul>
<li>مطالعه دفترچه ثبت‌نام همان سال</li>
<li>آماده‌سازی عکس پرسنلی استاندارد</li>
<li>آماده‌بودن کد سوابق / اطلاعات تحصیلی</li>
<li>کارت بانکی برای پرداخت</li>
</ul>
<p>جزئیات کامل‌تر: <a href="sabt-nam.html">ثبت نام کنکور سراسری</a>.</p>""",
            ),
            (
                "steps",
                "مراحل نحوه ثبت نام",
                """<ol>
<li>ورود به sanjesh.org و بخش سراسری</li>
<li>باز کردن لینک سیستم ثبت‌نام سال مربوط</li>
<li>خرید کارت اعتباری / پرداخت هزینه</li>
<li>تکمیل مشخصات فردی و تحصیلی</li>
<li>بارگذاری عکس و بررسی نهایی</li>
<li>دریافت شماره پرونده و کد رهگیری</li>
</ol>""",
            ),
            (
                "after",
                "بعد از ثبت‌نام",
                """<p>اطلاعات ورود پورتال را ذخیره کنید، در صورت نیاز در مهلت ویرایش اصلاح کنید و منتظر کارت ورود بمانید. زمان‌ها: <a href="zaman-sabt-nam.html">زمان ثبت نام</a>.</p>""",
            ),
        ],
        faqs=[
            ("ثبت‌نام حضوری دارد؟", "خیر؛ مسیر رسمی اینترنتی است."),
            ("بدون کد رهگیری ثبت‌نام کامل است؟", "خیر؛ کد رهگیری نشانه اتمام موفق است."),
            ("عکس استاندارد چیست؟", "طبق ضوابط دفترچه: زمینه روشن، اخیر، بدون مهر و واضح."),
        ],
        related=[
            ("sabt-nam.html", "ثبت نام کامل"),
            ("zaman-sabt-nam.html", "زمان ثبت نام"),
            ("sharayet-ekhtesasi.html", "شرایط"),
            ("site-sanjesh.html", "سایت سنجش"),
        ],
        checklist=[
            "دفترچه را خوانده‌ام",
            "عکس و مدارک آماده‌اند",
            "پرداخت انجام شده",
            "کد رهگیری ذخیره شده",
        ],
    )
)

add(
    dict(
        slug="elam-natayej-1405.html",
        title="اعلام نتایج نهایی کنکور ۱۴۰۵",
        desc="اعلام نتایج نهایی کنکور ۱۴۰۵: تفاوت با کارنامه اولیه، زمان تقریبی، مشاهده در سایت سنجش و اقدامات بعد از قبولی",
        kicker="نتایج · قبولی",
        lead="نتایج نهایی کنکور بعد از انتخاب رشته اعلام می‌شود و وضعیت قبولی رشته‌محل را مشخص می‌کند. این صفحه مسیر مشاهده نتیجه و قدم بعدی را شفاف می‌کند.",
        sections=[
            (
                "diff",
                "نتایج نهایی با کارنامه اولیه چه فرقی دارد؟",
                """<p>کارنامه اولیه رتبه و مجاز بودن را می‌گوید؛ نتایج نهایی می‌گوید در کدام کد رشته‌محل قبول شده‌اید (یا نشده‌اید). بدون انتخاب رشته، نتیجه نهایی معنادار برای قبولی شکل نمی‌گیرد.</p>""",
            ),
            (
                "how",
                "چطور نتیجه را ببینیم؟",
                """<p>از سایت سنجش و پورتال کاربری، لینک اعلام نتایج همان سال را باز کنید. رسید انتخاب رشته و اطلاعات ورود را دم دست داشته باشید.</p>""",
            ),
            (
                "after",
                "بعد از قبولی چه کنیم؟",
                """<ul>
<li>زمان ثبت‌نام دانشگاه را از اطلاعیه همان دانشگاه بگیرید</li>
<li>مدارک را طبق لیست دانشگاه آماده کنید</li>
<li>اگر قبول نشده‌اید، مسیرهای تکمیل ظرفیت یا بدون‌آزمون را بررسی کنید</li>
</ul>
<p>مرتبط: <a href="gheyr-entefaee/index.html">بدون‌آزمون غیرانتفاعی</a>.</p>""",
            ),
        ],
        faqs=[
            ("نتایج نهایی کی می‌آید؟", "معمولاً هفته‌ها بعد از پایان انتخاب رشته؛ تاریخ دقیق اطلاعیه سنجش است."),
            ("اعتراض ممکن است؟", "در صورت پیش‌بینی در اطلاعیه، بله؛ خارج از آن انتظار غیرواقعی نسازید."),
            ("قبولی آزاد جدا اعلام می‌شود؟", "ممکن است زمان/سامانه جدا داشته باشد."),
        ],
        related=[
            ("karname-avvalie-1405.html", "کارنامه اولیه"),
            ("entekhab-reshte-1405.html", "انتخاب رشته"),
            ("site-sanjesh.html", "سایت سنجش"),
            ("gheyr-entefaee/index.html", "غیرانتفاعی"),
        ],
        checklist=[
            "لینک رسمی نتایج را از سنجش باز کرده‌ام",
            "وضعیت قبولی را ذخیره کرده‌ام",
            "تقویم ثبت‌نام دانشگاه را چک کرده‌ام",
        ],
    )
)

add(
    dict(
        slug="tasir-moadel-1405.html",
        title="تاثیر معدل در کنکور ۱۴۰۵ و ۱۴۰۶",
        desc="تاثیر معدل در کنکور ۱۴۰۵ و ۱۴۰۶: سوابق تحصیلی، نقش نهایی دوازدهم، ترمیم معدل و اثر روی رتبه",
        kicker="سوابق تحصیلی · استراتژی",
        lead="تاثیر معدل دیگر حاشیه نیست؛ بخش بزرگی از سرنوشت رتبه را می‌سازد. بفهمید سوابق چطور وارد نمره کل می‌شوند و برای بهبود آن چه کنید.",
        sections=[
            (
                "policy",
                "سیاست تاثیر معدل در ۱۴۰۵",
                """<p>در سیاست‌های اخیر، تاثیر سوابق تحصیلی قطعی و پررنگ (در حد حدود ۶۰٪ برای پایه دوازدهم در اعلام‌های مرتبط با ۱۴۰۵) مطرح شده است. عدد و جزئیات دقیق را فقط از دفترچه/مصوبه همان سال بگیرید؛ چون ممکن است بازنگری شود.</p>
<p>تغییرات کلی‌تر: <a href="taghirat-konkour-1405.html">تغییرات کنکور ۱۴۰۵</a>.</p>""",
            ),
            (
                "improve",
                "چطور معدل مؤثر را بهتر کنیم؟",
                """<ul>
<li>تمرکز روی امتحانات نهایی</li>
<li>استفاده از مسیر <a href="termim-moadel-1405.html">ترمیم معدل</a> در صورت نیاز</li>
<li>هم‌راستا کردن برنامه تستی با آمادگی تشریحی</li>
</ul>""",
            ),
            (
                "1406",
                "نگاه به ۱۴۰۶",
                """<p>اگر هدف ۱۴۰۶ است، از حالا نهایی و پایه‌های اثرگذار را جدی بگیرید. برنامه پیشنهادی: <a href="barname-1406.html">برنامه‌ریزی برای کنکور ۱۴۰۶</a>.</p>""",
            ),
        ],
        faqs=[
            ("معدل دیپلم همان سوابق است؟", "سوابق از نمرات نهایی اعلامی ساخته می‌شود؛ جزئیات را دفترچه مشخص می‌کند."),
            ("تأثیر مثبت است یا قطعی؟", "در سال‌های اخیر به سمت قطعی رفته؛ متن همان سال را بخوانید."),
            ("فقط دوازدهم مهم است؟", "برای ۱۴۰۵ تمرکز اصلی روی دوازدهم اعلام شده؛ هر تغییر بعدی را رصد کنید."),
        ],
        related=[
            ("termim-moadel-1405.html", "ترمیم معدل"),
            ("taghirat-konkour-1405.html", "تغییرات"),
            ("barname-1406.html", "برنامه ۱۴۰۶"),
            ("takhmin-rotbe.html", "تخمین رتبه"),
        ],
        checklist=[
            "نمرات نهایی‌ام را لیست کرده‌ام",
            "نیاز به ترمیم را مشخص کرده‌ام",
            "برنامه نهایی + تست را هم‌زمان چیده‌ام",
        ],
    )
)

add(
    dict(
        slug="sharayet-ekhtesasi.html",
        title="شرایط اختصاصی ثبت نام کنکور سراسری",
        desc="شرایط اختصاصی کنکور سراسری: مدارک تحصیلی مجاز، نظام وظیفه، طرح، محرومیت‌ها و نکات دفترچه سنجش",
        kicker="ضوابط ثبت‌نام · دفترچه",
        lead="شرایط اختصاصی مشخص می‌کند با چه مدرک و وضعیتی اجازه ثبت‌نام و پذیرش دارید. قبل از پرداخت هزینه، این بندها را در دفترچه همان سال خط‌به‌خط بخوانید.",
        sections=[
            (
                "docs",
                "مدارک تحصیلی رایج",
                """<p>معمولاً یکی از این مدارک مطرح است: دیپلم نظام جدید ۱۲۳، پیش‌دانشگاهی، دیپلم نظام قدیم، یا کاردانی مورد تأیید. تاریخ اخذ مدرک برای ورودی نیمسال‌ها در دفترچه قید می‌شود.</p>""",
            ),
            (
                "duty",
                "نظام وظیفه و طرح",
                """<p>آقایان باید وضعیت نظام وظیفه مطابق ضوابط آزمون را داشته باشند. داوطلبان مشمول طرح در رشته‌های علوم پزشکی باید بندهای تعویق/انجام طرح را از دفترچه بخوانند.</p>""",
            ),
            (
                "ban",
                "محرومیت‌ها",
                """<p>برخی محرومیت‌های قبلی پذیرش یا تخلفات آزمون می‌تواند مانع ثبت‌نام شود. اگر وضعیت خاصی دارید، قبل از ثبت‌نام با متن رسمی یا پشتیبانی سنجش شفاف کنید.</p>
<p>شرایط عمومی و مسیر کامل: <a href="sabt-nam.html">ثبت نام کنکور</a>.</p>""",
            ),
        ],
        faqs=[
            ("شرط سنی داریم؟", "معمولاً شرط سنی عمومی سخت مثل قدیم مطرح نیست؛ هر قید خاص در دفترچه همان سال است."),
            ("دیپلم ناقص می‌تواند ثبت‌نام کند؟", "بستگی به تاریخ اخذ مدرک و نیمسال پذیرش دارد."),
            ("کجا دقیق بخوانم؟", "دفترچه ثبت‌نام همان سال روی sanjesh.org."),
        ],
        related=[
            ("sabt-nam.html", "ثبت نام"),
            ("nahve-sabt-nam.html", "نحوه ثبت نام"),
            ("site-sanjesh.html", "سایت سنجش"),
            ("zaman-sabt-nam.html", "زمان ثبت نام"),
        ],
        checklist=[
            "مدرک تحصیلی‌ام با دفترچه جور است",
            "وضعیت نظام وظیفه/طرح را می‌دانم",
            "محرومیت احتمالی را چک کرده‌ام",
        ],
    )
)

add(
    dict(
        slug="zaman-sabt-nam.html",
        title="زمان ثبت نام کنکور سراسری ۱۴۰۵ و ۱۴۰۶",
        desc="زمان ثبت نام کنکور سراسری: بازه ۱۴۰۵، تمدیدها، تقویم کارت و انتخاب رشته، و آماده‌باش برای ۱۴۰۶",
        kicker="تقویم کنکور · مهلت‌ها",
        lead="زمان ثبت نام کنکور هر سال با اطلاعیه سنجش قطعی می‌شود. برای ۱۴۰۵ بازه اردیبهشت–خرداد فعال بود؛ برای ۱۴۰۶ باید به محض انتشار اطلاعیه رسمی برنامه بچینید.",
        sections=[
            (
                "1405",
                "زمان ثبت نام ۱۴۰۵ (نمونه انجام‌شده)",
                """<p>ثبت‌نام کنکور ۱۴۰۵ از ۲۷ اردیبهشت تا ۸ خرداد در سایت سنجش انجام و در عمل تا همان بازه تمدید/فعال بود. این تاریخ‌ها برای مرجع تاریخی مفیدند؛ کپی کردن چشم‌بسته برای ۱۴۰۶ اشتباه است.</p>""",
            ),
            (
                "calendar",
                "زنجیره زمانی بعد از ثبت‌نام",
                """<ul>
<li>ثبت‌نام و ویرایش</li>
<li>کارت ورود به جلسه</li>
<li>آزمون</li>
<li>کارنامه اولیه</li>
<li>انتخاب رشته و نتایج نهایی</li>
</ul>
<p>برای هر حلقه صفحه جدا در بلوک دارید: <a href="kart-vorod-jalase.html">کارت</a>، <a href="karname-avvalie-1405.html">کارنامه</a>، <a href="entekhab-reshte-1405.html">انتخاب رشته</a>.</p>""",
            ),
            (
                "1406",
                "آماده‌باش برای ۱۴۰۶",
                """<p>دفترچه و اطلاعیه ثبت‌نام ۱۴۰۶ را از کانال رسمی سنجش دنبال کنید. تا قبل از اعلام، روی معدل، پایه و برنامه مطالعاتی سرمایه‌گذاری کنید — <a href="barname-1406.html">برنامه ۱۴۰۶</a>.</p>""",
            ),
        ],
        faqs=[
            ("آیا ثبت‌نام همیشه تمدید می‌شود؟", "خیر؛ تمدید تضمینی نیست."),
            ("بهترین روز ثبت‌نام کی است؟", "اوایل بازه؛ نه ساعت‌های آخر."),
            ("زمان آزاد جداست؟", "ثبت‌نام باآزمون اغلب هم‌مسیر سنجش است؛ انتخاب رشته آزاد ممکن است جدا باشد."),
        ],
        related=[
            ("sabt-nam.html", "ثبت نام"),
            ("nahve-sabt-nam.html", "نحوه ثبت نام"),
            ("site-sanjesh.html", "سایت سنجش"),
            ("barname-1406.html", "برنامه ۱۴۰۶"),
        ],
        checklist=[
            "اطلاعیه رسمی را ذخیره کرده‌ام",
            "یادآور مهلت در گوشی/اپ گذاشته‌ام",
            "مدارک را قبل از باز شدن آماده کرده‌ام",
        ],
    )
)


def write_pages() -> None:
    extend_nav_categories()
    for page in PAGES:
        html = build_page(**page)
        path = ROOT / "education" / "konkour" / page["slug"]
        path.write_text(html, encoding="utf-8")
        print("wrote", path.relative_to(ROOT))


def rebuild_search_index() -> None:
    items = []
    for path in sorted((ROOT / "education").rglob("*.html")):
        if path.name.startswith("page-"):
            continue
        rel = path.relative_to(ROOT).as_posix()
        text = path.read_text(encoding="utf-8")
        title_m = re.search(r"<title>(.*?)</title>", text, re.S)
        desc_m = re.search(r'name="description"\s+content="(.*?)"', text)
        h1_m = re.search(r"<h1[^>]*>(.*?)</h1>", text, re.S)
        title = re.sub(r"<[^>]+>", "", (h1_m or title_m).group(1)).replace("· بلوک", "").strip()
        desc = desc_m.group(1) if desc_m else ""
        parts = path.parts
        if "moshavere" in parts:
            cat = "مشاوره"
        elif "gheyr-entefaee" in parts:
            cat = "غیرانتفاعی"
        elif "arshad" in parts:
            cat = "ارشد"
        else:
            cat = "کنکور"
        url = "/" + rel if rel != "index.html" else "/"
        # search.html is at root — urls should be relative from root
        items.append(
            {
                "title": title,
                "desc": desc,
                "url": rel,
                "path": rel,
                "category": cat,
            }
        )
    out = ROOT / "search-index.json"
    out.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"search-index.json: {len(items)} items")


def rebuild_sitemap() -> None:
    urls = []
    # homepage
    urls.append(("/", "1.0", "weekly"))
    for path in sorted(ROOT.rglob("*.html")):
        if any(x in path.parts for x in ("_deploy_proof",)):
            continue
        if path.name == "404.html":
            continue
        rel = path.relative_to(ROOT).as_posix()
        if rel == "index.html":
            continue
        loc = "/" + rel.replace("index.html", "")
        if loc.endswith("/") and rel.endswith("index.html"):
            pass
        else:
            loc = "/" + rel
        priority = "0.9" if path.name == "index.html" else "0.8"
        if path.parent == ROOT:
            priority = "0.7"
        urls.append((loc if loc != "/index.html" else "/", priority, "weekly"))

    # dedupe preserve order
    seen = set()
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for loc, pri, freq in urls:
        if loc in seen:
            continue
        seen.add(loc)
        full = BASE + (loc if loc.startswith("/") else "/" + loc)
        if full.endswith("/index.html"):
            full = full[: -len("index.html")]
        lines.append(
            f"  <url><loc>{full}</loc><lastmod>{TODAY}</lastmod>"
            f"<changefreq>{freq}</changefreq><priority>{pri}</priority></url>"
        )
    lines.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"sitemap.xml: {len(seen)} urls")


def patch_hub() -> None:
    path = ROOT / "education" / "konkour" / "index.html"
    html = path.read_text(encoding="utf-8")
    block = """
        <section class="portal-seo-cluster" aria-label="راهنماهای مهم">
          <h2>پوشش کامل مسیر کنکور</h2>
          <p class="edu-lead">راهنماهای به‌روز بلوک برای رقابت با پرتکرارترین موضوعات کنکور — متن اصلی، نه کپی.</p>
          <ul class="feed-list feed-list--cards">
            <li><a class="feed-card" href="site-sanjesh.html"><div class="feed-card-body"><h2>سایت سازمان سنجش</h2><p>ورود امن به sanjesh.org و خدمات پرتکرار داوطلب</p></div></a></li>
            <li><a class="feed-card" href="taghirat-konkour-1405.html"><div class="feed-card-body"><h2>تغییرات کنکور ۱۴۰۵</h2><p>یک نوبت، معدل، حذف عمومی و اثر روی برنامه</p></div></a></li>
            <li><a class="feed-card" href="entekhab-reshte-1405.html"><div class="feed-card-body"><h2>انتخاب رشته ۱۴۰۵</h2><p>اولویت‌بندی، سقف انتخاب و کد رهگیری</p></div></a></li>
            <li><a class="feed-card" href="termim-moadel-1405.html"><div class="feed-card-body"><h2>ترمیم معدل</h2><p>بهبود سوابق تحصیلی برای رتبه بهتر</p></div></a></li>
            <li><a class="feed-card" href="kart-vorod-jalase.html"><div class="feed-card-body"><h2>کارت ورود به جلسه</h2><p>زمان دریافت، چاپ و رفع نقص</p></div></a></li>
            <li><a class="feed-card" href="takhmin-rotbe.html"><div class="feed-card-body"><h2>تخمین رتبه</h2><p>برآورد تقریبی قبل از انتخاب رشته</p></div></a></li>
          </ul>
        </section>
"""
    if "portal-seo-cluster" in html:
        html = re.sub(
            r'<section class="portal-seo-cluster"[\s\S]*?</section>',
            block.strip(),
            html,
            count=1,
        )
    elif '<div class="portal-layout">' in html:
        html = html.replace('<div class="portal-layout">', block + '\n    <div class="portal-layout">', 1)
    else:
        html = html.replace("</main>", block + "\n  </main>", 1)
    path.write_text(html, encoding="utf-8")
    print("hub cluster patched")


def patch_index_org_schema() -> None:
    path = ROOT / "index.html"
    html = path.read_text(encoding="utf-8")
    schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": f"{BASE}/#organization",
                "name": "بلوک",
                "url": BASE,
                "logo": f"{BASE}/assets/bolok-logo.png",
                "email": "bolokadmin@gmail.com",
                "sameAs": [],
            },
            {
                "@type": "WebSite",
                "@id": f"{BASE}/#website",
                "url": BASE,
                "name": "بلوک",
                "inLanguage": "fa-IR",
                "publisher": {"@id": f"{BASE}/#organization"},
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": f"{BASE}/search.html?q={{search_term_string}}",
                    "query-input": "required name=search_term_string",
                },
            },
        ],
    }
    tag = (
        '  <script type="application/ld+json" id="bolok-graph">\n  '
        + json.dumps(schema, ensure_ascii=False)
        + "\n  </script>\n"
    )
    if 'id="bolok-graph"' in html:
        html = re.sub(
            r'<script type="application/ld\+json" id="bolok-graph">[\s\S]*?</script>\n',
            tag,
            html,
            count=1,
        )
    else:
        html = html.replace("</head>", tag + "</head>", 1)
    path.write_text(html, encoding="utf-8")
    print("index Organization/WebSite schema ok")


def refresh_all_headers() -> None:
    """Re-run header injection so new nav links appear sitewide."""
    n = 0
    for path in ROOT.rglob("*.html"):
        if path.name == "404.html":
            continue
        html = path.read_text(encoding="utf-8")
        rel = path.relative_to(ROOT)
        new_header = mosahab.build_header(rel)
        updated, count = re.subn(
            r"<header class=\"site-header\">.*?</header>",
            new_header,
            html,
            count=1,
            flags=re.S,
        )
        if count:
            path.write_text(updated, encoding="utf-8")
            n += 1
    print(f"headers refreshed: {n}")


def bump_cache() -> None:
    n = 0
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".html", ".js", ".css", ".json", ".md", ".py"}:
            continue
        if path.name.startswith("_seo_boost") or path.name.startswith("_mosahab") or path.name.startswith("_header"):
            continue
        text = path.read_text(encoding="utf-8")
        new = text.replace(f"?v={V_OLD}", f"?v={V_NEW}")
        if new != text:
            path.write_text(new, encoding="utf-8")
            n += 1
    print(f"cache -> v={V_NEW} in {n} files")


def main() -> None:
    write_pages()
    refresh_all_headers()
    patch_hub()
    patch_index_org_schema()
    rebuild_search_index()
    rebuild_sitemap()
    bump_cache()
    # rewrite pages again after bump so their inline v matches (build_page already used V_NEW)
    print("done")


if __name__ == "__main__":
    main()
