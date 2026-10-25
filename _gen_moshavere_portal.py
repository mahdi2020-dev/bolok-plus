# -*- coding: utf-8 -*-
"""Rebuild moshavere listing pages with heyva-like portal UX (Bolok brand)."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIR = ROOT / "education" / "konkour" / "moshavere"
BASE = "https://bolokapp.ir"
V = "14"
PER_PAGE = 10

LEAD = (
    "برای موفقیت در کنکور سراسری به ابزار متنوعی مثل منابع کنکور، کتاب‌های کمک‌آموزشی، "
    "آزمون‌های آزمایشی خوب برای رشته‌های ریاضی، تجربی، انسانی، هنر و زبان، مشاوره برنامه‌ریزی "
    "و تست‌زنی، نحوه صحیح مطالعه، جبران عقب‌افتادگی در تعطیلات، جمع‌بندی و مدیریت زمان در "
    "جلسه آزمون نیاز دارید. در این بخش راهنماهای عملی بلوک برای مسیر کنکور را می‌خوانید."
)

# Order preserved from current hub pages (original Bolok guides)
ARTICLES: list[tuple[str, str, str, str]] = [
    # href, title, excerpt, thumb theme
    ("natayej-arzyabi-farhangian.html", "نتایج ارزیابی شایستگی دانشگاه فرهنگیان", "نتایج ارزیابی شایستگی دانشگاه فرهنگیان معمولاً به‌صورت نمره مستقل اعلام نمی‌شود؛ عملکرد در ارزیابی و مصاحبه در کنار تراز کتبی مسیر قبولی را می‌سازد…", "exam"),
    ("gom-shodan-kart-vorod.html", "اگر کارت ورود به جلسه را گم کنیم چه می‌شود", "اگر کارت ورود به جلسه را گم کنید، اول وسایل را دقیق بگردید؛ اگر پیدا نشد، فوراً به سامانه رسمی برگزارکننده آزمون مراجعه کنید…", "card"),
    ("azmoon-jame-jaygozin.html", "طرح آزمون جامع جایگزین کنکور", "طرح آزمون جامع جایگزین کنکور ایده‌ای برای اصلاح نظام سنجش و پوشش دروس متوسطه دوم است که با هدف عدالت آموزشی مطرح می‌شود…", "chart"),
    ("tafavot-madrak-bedoon-ba-konkour.html", "تفاوت مدرک بدون کنکور و با کنکور", "تفاوت مدرک بدون کنکور و با کنکور بیشتر در نحوه پذیرش است؛ در هر دو مسیر، تحصیل در دانشگاه معتبر می‌تواند به مدرک رسمی منجر شود…", "docs"),
    ("pasokhname-honar-1405.html", "پاسخنامه کنکور هنر ۱۴۰۵", "پاسخنامه کنکور هنر ۱۴۰۵ حدود ۱ شهریور در سایت سنجش منتشر شده و امکان بررسی پاسخ‌ها و ارزیابی اولیه عملکرد را می‌دهد…", "key"),
    ("pasokhname-zaban-1405.html", "پاسخنامه کنکور زبان ۱۴۰۵", "پاسخنامه کنکور زبان ۱۴۰۵ حدود ۱ شهریور در سایت سنجش منتشر شده است…", "key"),
    ("pasokhname-ensani-1405.html", "پاسخنامه کنکور انسانی ۱۴۰۵", "پاسخنامه کنکور انسانی ۱۴۰۵ حدود ۱ شهریور در سایت سنجش منتشر شده است…", "key"),
    ("pasokhname-riazi-1405.html", "پاسخنامه کنکور ریاضی ۱۴۰۵", "پاسخنامه کنکور ریاضی ۱۴۰۵ حدود ۱ شهریور در سایت سنجش منتشر شده است…", "key"),
    ("soalat-honar-1405.html", "سوالات کنکور هنر ۱۴۰۵", "سوالات کنکور هنر ۱۴۰۵ پس از آزمون (حدود ۲۹ مرداد) از منابع رسمی منتشر شده است…", "paper"),
    ("soalat-zaban-1405.html", "سوالات کنکور زبان ۱۴۰۵", "سوالات کنکور زبان ۱۴۰۵ حدود ۲۹ مرداد از سایت سنجش منتشر شده است…", "paper"),
    ("soalat-ensani-1405.html", "سوالات کنکور انسانی ۱۴۰۵", "سوالات کنکور انسانی ۱۴۰۵ حدود ۲۹ مرداد از سایت سنجش منتشر شده است…", "paper"),
    ("soalat-riazi-1405.html", "سوالات کنکور ریاضی ۱۴۰۵", "سوالات کنکور ریاضی ۱۴۰۵ حدود ۲۹ مرداد از سایت سنجش منتشر شده است…", "paper"),
    ("pasokhname-tajrobi-1405.html", "پاسخنامه کنکور تجربی ۱۴۰۵", "پاسخنامه کنکور تجربی ۱۴۰۵ حدود ۱ شهریور در سایت سنجش منتشر شده و برای تخمین درصد و تحلیل عملکرد کاربرد دارد…", "key"),
    ("soalat-tajrobi-1405.html", "سوالات کنکور تجربی ۱۴۰۵", "سوالات کنکور تجربی ۱۴۰۵ پس از برگزاری آزمون از منابع رسمی منتشر شده است…", "exam"),
    ("pasokhname-sarasari-1405.html", "پاسخنامه کنکور سراسری ۱۴۰۵", "پاسخنامه کنکور سراسری ۱۴۰۵ گروه‌های آزمایشی اصلی را پوشش می‌دهد و معمولاً هم‌زمان با اعلام کلید رسمی در دسترس قرار می‌گیرد…", "key"),
    ("soalat-sarasari-1405.html", "سوالات کنکور سراسری ۱۴۰۵", "سوالات کنکور سراسری ۱۴۰۵ پس از آزمون تیرماه، حدود ۲۹ و ۳۰ مرداد از سایت سازمان سنجش برای داوطلبان منتشر شده است…", "exam"),
    ("pasokhname-farhangian-1405.html", "پاسخنامه کنکور فرهنگیان ۱۴۰۵", "پاسخنامه کنکور فرهنگیان ۱۴۰۵ حدود ۱ شهریور در سایت سنجش منتشر شده تا امکان محاسبه درصد و ارزیابی عملکرد فراهم شود…", "key"),
    ("soalat-farhangian-1405.html", "سوالات کنکور فرهنگیان ۱۴۰۵", "سوالات کنکور فرهنگیان ۱۴۰۵ حدود ۳۰ مرداد منتشر شده و برای تحلیل سوالات سال‌های قبل مفید است…", "paper"),
    ("sahmiye-dahak-khanebar.html", "سهمیه دهک‌بندی خانوار در کنکور", "سهمیه دهک‌بندی خانوار با هدف عدالت آموزشی و در نظر گرفتن وضعیت اقتصادی خانوار و موقعیت استانی مطرح شده است…", "chart"),
    ("radiology-ya-oloum-azmayeshgahi.html", "رادیولوژی بهتره یا علوم آزمایشگاهی", "انتخاب بین رادیولوژی و علوم آزمایشگاهی به علاقه، هدف شغلی و نوع کار با تجهیزات بستگی دارد…", "lab"),
    ("parastari-ya-otagh-amal.html", "پرستاری بهتره یا اتاق عمل", "مقایسه پرستاری و اتاق عمل از نظر محیط کار، شیفت‌ها و مسیر ادامه تحصیل…", "lab"),
    ("agar-parastari-ghabool-nasham.html", "اگر پرستاری قبول نشوم چه کنم", "اگر پرستاری قبول نشدید، گزینه‌های جایگزین و برنامه جبرانی را با واقعیت تراز و علاقه بسنجید…", "path"),
    ("behtarin-daneshgah-daroosazi.html", "بهترین دانشگاه داروسازی", "معیارهای انتخاب دانشکده داروسازی: هیئت علمی، بیمارستان آموزشی، شهریه و مسیر تخصص…", "uni"),
    ("chart-darsi-hoghugh.html", "چارت درسی حقوق", "نمای کلی چارت درسی حقوق و ترتیب منطقی دروس پایه تا تخصصی…", "docs"),
    ("hoghugh-azad-ya-payamnoor.html", "حقوق آزاد بهتره یا پیام‌نور", "مقایسه مسیر حقوق در دانشگاه آزاد و پیام‌نور از نظر هزینه، حضور و اعتبار…", "uni"),
    ("diplom-bozorgsalan-ya-roozane.html", "دیپلم بزرگسالان یا روزانه", "تفاوت دیپلم بزرگسالان و روزانه برای ادامه مسیر کنکور و ورود به دانشگاه…", "docs"),
    ("konkour-bozorgsalan.html", "کنکور بزرگسالان", "شرایط و نکات کنکور برای داوطلبان بزرگسال و مدارک لازم…", "exam"),
    ("eshtebah-sabtnam-internet.html", "اشتباه در ثبت‌نام اینترنتی کنکور", "اگر در ثبت‌نام اینترنتی اشتباه کردید، مهلت ویرایش و مسیر اصلاحیه را از دست ندهید…", "card"),
    ("madarek-farhangian-1405.html", "مدارک فرهنگیان ۱۴۰۵", "فهرست مدارک و نکات تحویل برای مسیر پذیرش فرهنگیان…", "docs"),
    ("moallem-honarestan.html", "معلم هنرستان شدن", "مسیر معلمی هنرستان، شرایط و تفاوت با دبیری متوسطه…", "path"),
    ("nafarat-bartar-ghalamchi.html", "نفرات برتر قلم‌چی", "چطور از کارنامه و رتبه آزمون‌های آزمایشی برای اصلاح برنامه استفاده کنید…", "chart"),
    ("jaygozin-konkour.html", "جایگزین کنکور", "گزینه‌های جایگزین یا مکمل مسیر کنکور برای ورود به دانشگاه…", "path"),
    ("azad-ya-posht-konkour.html", "آزاد بهتره یا پشت‌کنکور", "تصمیم بین رفتن به آزاد و یک‌سال پشت‌کنکور ماندن را با داده و هدف بسنجید…", "path"),
    ("posht-konkour-ya-mohajerat.html", "پشت‌کنکور یا مهاجرت", "مقایسه واقع‌بینانه پشت‌کنکور ماندن و مسیر مهاجرت تحصیلی…", "path"),
    ("tajrobe-posht-konkouri.html", "تجربه پشت‌کنکوری‌ها", "درس‌های عملی از تجربه پشت‌کنکوری‌ها برای سال دوم…", "exam"),
    ("shoroo-az-tabestan.html", "شروع از تابستان", "چطور از تابستان برای پیش‌خوانی و تثبیت پایه قبل از سال کنکور استفاده کنید…", "path"),
    ("dalayel-oft-rotbe.html", "دلایل افت رتبه", "علل رایج افت رتبه در آزمون‌ها و راه‌های اصلاح برنامه…", "chart"),
    ("tasir-moadel-yazdahom.html", "تأثیر معدل یازدهم", "نقش معدل پایه یازدهم در سوابق تحصیلی و برنامه ترمیم…", "docs"),
    ("teb-sonnati-bedoon-konkour.html", "طب سنتی بدون کنکور", "واقعیت مسیر طب سنتی و پذیرش بدون کنکور را از ادعاهای تبلیغاتی جدا کنید…", "lab"),
    ("shekayat-azad-bazresi.html", "شکایت و بازرسی دانشگاه آزاد", "مسیر پیگیری اعتراض و بازرسی در سامانه دانشگاه آزاد…", "docs"),
]

PICKS = [
    ("../barname-1406.html", "برنامه‌ریزی کنکور ۱۴۰۶", "path"),
    ("../zaman-sabt-nam.html", "زمان ثبت نام کنکور", "card"),
    ("../sabt-nam.html", "ثبت نام کنکور سراسری", "docs"),
    ("../entekhab-reshte-1405.html", "انتخاب رشته ۱۴۰۵", "chart"),
    ("../behtarin-reshte-ensani.html", "بهترین رشته‌های انسانی", "uni"),
    ("shoroo-az-tabestan.html", "شروع مطالعه از تابستان", "path"),
]

R = "../../../"  # to site root from moshavere/


def thumb_html(theme: str, label: str = "") -> str:
    return f'<span class="feed-thumb feed-thumb--photo feed-thumb--{theme}" aria-hidden="true"><i></i><b>{label}</b></span>'


def header_block() -> str:
    # moshavere is 3 levels deep: education/konkour/moshavere
    r = "../../../"
    return f"""  <header class="site-header">
    <div class="container inner">
      <a class="brand" href="{r}index.html">
        <img class="brand-logo" src="{r}assets/bolok-logo.svg?v={V}" alt="بلوک" width="36" height="36" />
        <span>بلوک</span>
      </a>
      <nav class="nav" aria-label="اصلی">
        <div class="nav-item--has-sub" data-edu-nav>
          <a class="nav-trigger" href="{r}index.html#education" data-edu-trigger aria-expanded="false" aria-haspopup="true">
            مطالب آموزشی <span class="nav-trigger-caret" aria-hidden="true"></span>
          </a>
          <div class="nav-panel" role="menu">
            <div class="nav-panel-head"><a href="../index.html">هاب کنکور</a></div>
            <div class="nav-panel-group">
              <h4>مشاوره</h4>
              <a href="index.html">مشاوره کنکور سراسری</a>
              <a href="../barname-1406.html">برنامه‌ریزی ۱۴۰۶</a>
              <a href="../tasir-moadel-1405.html">تاثیر معدل</a>
            </div>
            <div class="nav-panel-group">
              <h4>ثبت نام</h4>
              <a href="../sabt-nam.html">ثبت نام</a>
              <a href="../zaman-sabt-nam.html">زمان ثبت نام</a>
            </div>
            <div class="nav-panel-group">
              <h4>انتخاب رشته</h4>
              <a href="../entekhab-reshte-1405.html">انتخاب رشته</a>
              <a href="../behtarin-reshte-ensani.html">رشته‌های انسانی</a>
            </div>
            <div class="nav-panel-group">
              <h4>سامانه‌ها</h4>
              <a href="../rad-medu.html">راد مدیو</a>
              <a href="../azad-1405.html">دانشگاه آزاد</a>
            </div>
          </div>
        </div>
        <a href="{r}search.html">جستجو</a>
        <a href="{r}about.html">درباره</a>
      </nav>
      <div class="header-actions">
        <a class="header-search" href="{r}search.html" aria-label="جستجو">جستجو</a>
        <a class="btn btn-primary header-cta" href="{r}index.html#download">دانلود اپ</a>
        <button class="nav-toggle" type="button" data-nav-toggle aria-label="منو"><span></span></button>
      </div>
    </div>
    <div class="nav-drawer" data-nav-drawer>
      <a href="index.html">مشاوره کنکور</a>
      <a href="../index.html">هاب کنکور</a>
      <a href="{r}search.html">جستجو</a>
      <a href="{r}index.html">خانه</a>
    </div>
  </header>"""


def sidebar() -> str:
    picks = "".join(
        f'<li><a class="side-pick" href="{href}">{thumb_html(theme)}<span>{title}</span></a></li>'
        for href, title, theme in PICKS
    )
    return f"""      <aside class="portal-aside" aria-label="ستون کناری">
        <div class="side-box side-box--picks">
          <h2><span class="side-mark" aria-hidden="true"></span> مقالات منتخب</h2>
          <ul class="side-pick-list">{picks}</ul>
        </div>
        <div class="side-box">
          <h2>دسترسی سریع</h2>
          <ul>
            <li><a href="../sabt-nam.html">ثبت نام کنکور</a></li>
            <li><a href="../zaman-sabt-nam.html">زمان ثبت نام</a></li>
            <li><a href="../barname-1406.html">برنامه ۱۴۰۶</a></li>
            <li><a href="../entekhab-reshte-1405.html">انتخاب رشته</a></li>
            <li><a href="{R}search.html">جستجو در مطالب</a></li>
            <li><a href="{R}index.html#download">دانلود اپ بلوک</a></li>
          </ul>
        </div>
        <div class="side-box">
          <h2>رسمی</h2>
          <ul>
            <li><a href="https://www.sanjesh.org" target="_blank" rel="noopener noreferrer">سازمان سنجش</a></li>
          </ul>
        </div>
      </aside>"""


def pager(page: int, total_pages: int) -> str:
    parts = ['<nav class="pager pager--pipes" aria-label="صفحه‌بندی"><span class="pager-label">صفحات:</span> ']
    links = []
    for i in range(1, total_pages + 1):
        href = "index.html" if i == 1 else f"page-{i}.html"
        if i == page:
            links.append(f'<span class="page-current">{i}</span>')
        else:
            links.append(f'<a href="{href}">{i}</a>')
    parts.append(" | ".join(links))
    parts.append("</nav>")
    return "".join(parts)


def page_url(page: int) -> str:
    if page == 1:
        return f"{BASE}/education/konkour/moshavere/index.html"
    return f"{BASE}/education/konkour/moshavere/page-{page}.html"


def build_page(page: int, total_pages: int, items: list[tuple[str, str, str, str]]) -> str:
    is_first = page == 1
    title = "مشاوره کنکور سراسری" if is_first else f"مشاوره کنکور سراسری — صفحه {page}"
    desc = LEAD[:155]
    url = page_url(page)
    feed = "".join(
        f"""<li>
            <a class="feed-card" href="{href}">
              <div class="feed-card-body">
                <h2>{t}</h2>
                <p>{ex}</p>
              </div>
              {thumb_html(theme)}
            </a>
          </li>"""
        for href, t, ex, theme in items
    )

    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "name": title,
                "description": desc,
                "url": url,
                "inLanguage": "fa-IR",
                "isPartOf": {"@type": "WebSite", "name": "بلوک", "url": f"{BASE}/"},
            },
            {
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
                    {
                        "@type": "ListItem",
                        "position": 4,
                        "name": "مشاوره کنکور سراسری",
                        "item": f"{BASE}/education/konkour/moshavere/index.html",
                    },
                ],
            },
        ],
    }

    intro = f"""      <section class="portal-intro" aria-label="معرفی">
        <div class="portal-intro-text">
          <p class="edu-lead">{LEAD}</p>
          <div class="stat-pills">
            <span class="stat-pill">برنامه‌ریزی</span>
            <span class="stat-pill stat-pill--ghost">سوالات و پاسخنامه</span>
            <span class="stat-pill stat-pill--ghost">انتخاب مسیر</span>
            <span class="stat-pill stat-pill--ghost">{len(ARTICLES)} راهنما</span>
          </div>
        </div>
        <aside class="portal-media" aria-label="ویدیوی معرفی">
          <div class="portal-media-frame">
            <div class="portal-media-poster">
              <img src="{R}assets/bolok-logo.svg?v={V}" alt="" width="72" height="72" />
              <strong>مشاوره کنکور سراسری</strong>
              <span>راهنمای مسیر مطالعه با بلوک</span>
            </div>
            <button type="button" class="portal-play" data-portal-play aria-label="پخش معرفی">▶</button>
            <div class="portal-media-caption">۰:۴۵ · معرفی بخش مشاوره</div>
          </div>
          <p class="portal-media-note">ویدیوی کوتاه معرفی مسیر مشاوره — نسخه کامل را در اپ بلوک دنبال کنید.</p>
        </aside>
      </section>"""

    return f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0c0e12" />
  <meta name="description" content="{desc}" />
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large" />
  <link rel="canonical" href="{url}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="fa_IR" />
  <meta property="og:site_name" content="بلوک" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{desc}" />
  <meta property="og:url" content="{url}" />
  <meta property="og:image" content="{BASE}/assets/bolok-logo.png" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="{title}" />
  <meta name="twitter:description" content="{desc}" />
  <title>{title} · بلوک</title>
  <link rel="icon" href="{R}assets/bolok-logo.svg?v={V}" type="image/svg+xml" />
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="{R}styles.css?v={V}" />
  <link rel="manifest" href="{R}site.webmanifest" />
  <link rel="alternate" href="{url}" hreflang="fa-IR" />
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
{header_block()}
  <main id="main" class="container edu-wrap portal-page">
    <div class="edu-hero edu-hero--portal">
      <nav class="breadcrumb" aria-label="مسیر">
        <a href="{R}index.html">خانه</a><span aria-hidden="true">/</span>
        <a href="{R}education/index.html">مطالب آموزشی</a><span aria-hidden="true">/</span>
        <a href="../index.html">کنکور سراسری</a><span aria-hidden="true">/</span>
        <span>مشاوره کنکور سراسری</span>
      </nav>
      <h1><span class="title-mark" aria-hidden="true"></span> مشاوره کنکور سراسری</h1>
    </div>
{intro if is_first else f'    <p class="edu-lead portal-page-lead">صفحه {page} از فهرست راهنماهای مشاوره کنکور بلوک.</p>'}
    <div class="portal-layout">
      <div class="portal-main">
        <ul class="feed-list feed-list--cards">
          {feed}
        </ul>
        {pager(page, total_pages)}
      </div>
{sidebar()}
    </div>
  </main>
  <footer class="site-footer"><div class="container">© بلوک · <a href="index.html">مشاوره کنکور</a> · <a href="../index.html">هاب کنکور</a> · <a href="{R}search.html">جستجو</a></div></footer>
  <button type="button" class="back-top" data-back-top aria-label="بازگشت به بالا">↑</button>
</body>
</html>
"""


def main() -> None:
    # Prefer excerpts from existing article meta if present
    enriched = []
    for href, title, excerpt, theme in ARTICLES:
        path = DIR / href
        if path.exists():
            text = path.read_text(encoding="utf-8", errors="ignore")
            m = re.search(r'<meta name="description" content="([^"]*)"', text)
            if m and m.group(1).strip():
                excerpt = m.group(1).strip()
                if len(excerpt) > 140:
                    excerpt = excerpt[:137].rstrip() + "…"
            h = re.search(r"<h1[^>]*>([^<]+)</h1>", text)
            if h and h.group(1).strip():
                title = h.group(1).strip()
        enriched.append((href, title, excerpt, theme))

    total_pages = (len(enriched) + PER_PAGE - 1) // PER_PAGE
    for page in range(1, total_pages + 1):
        chunk = enriched[(page - 1) * PER_PAGE : page * PER_PAGE]
        html = build_page(page, total_pages, chunk)
        out = DIR / ("index.html" if page == 1 else f"page-{page}.html")
        out.write_text(html, encoding="utf-8")
        print("wrote", out.name, len(chunk))
    print("total", len(enriched), "pages", total_pages)


if __name__ == "__main__":
    main()
