# -*- coding: utf-8 -*-
"""Generate مشاوره کارشناسی ارشد portal — original Bolok copy (not heyva)."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIR = ROOT / "education" / "konkour" / "arshad"
BASE = "https://bolokapp.ir"
V = "17"
R = "../../../"
PER_PAGE = 10
TODAY = "2026-10-25"

LEAD = (
    "با مدرک کارشناسی می‌توانید مسیر فوق‌لیسانس را در گرایش‌های گوناگون دنبال کنید؛ حتی اگر بخواهید حوزه را عوض کنید. "
    "این بخش بلوک برای شناخت واقع‌بینانه مقطع ارشد، کد ضریب و گرایش‌ها، منابع و سوالات سال‌های اخیر، پروپوزال، "
    "تفاوت وزارت علوم و بهداشت، و نکات ثبت‌نام نوشته شده است. اعداد و تاریخ را از دفترچه و سایت سنجش همان سال تأیید کنید."
)

# Original Bolok prose — titles match user intent, wording rewritten
ARTICLES: list[dict] = [
    {
        "slug": "kod-zarib-hoghugh",
        "title": "کد ضریب ارشد حقوق",
        "desc": "کد ضریب ارشد حقوق مشخص می‌کند هر درس در هر گرایش چه وزنی دارد؛ برای انتخاب گرایش و تخمین رتبه حیاتی است.",
        "theme": "chart",
        "sections": [
            ("s1", "کد ضریب یعنی چه؟", [
                "در دفترچه ارشد، هر مجموعه امتحانی جدول ضرایب دارد. برای حقوق، کد ضریب نشان می‌دهد کدام درس در کدام گرایش پررنگ‌تر است.",
                "بدون این جدول، زمان‌بندی مطالعه و مقایسه گرایش‌ها حدسی می‌ماند.",
            ]),
            ("s2", "چطور استفاده کنیم؟", [
                "گرایش هدف را انتخاب کنید، دروس با ضریب بالا را در برنامه بلوکی جلو بگذارید و برای دروس کم‌ضریب حداقل تسلط نگه دارید.",
                "ضرایب هر سال را از دفترچه همان دوره بخوانید؛ کپی سال قبل ممکن است تغییر کرده باشد.",
            ]),
            ("s3", "هدف‌گذاری رتبه", [
                "با ترکیب درصدهای فرضی و ضرایب، می‌توانید سناریوی رتبه بسازید؛ بعد با کارنامه سال‌های قبل مقایسه کنید.",
            ]),
        ],
    },
    {
        "slug": "rahat-tarin-reshte",
        "title": "راحت‌ترین رشته ارشد برای قبولی",
        "desc": "«راحت‌ترین» ارشد برای همه یکسان نیست؛ رقابت، ظرفیت، تعداد داوطلب و زمینه کارشناسی شما تعیین‌کننده است.",
        "theme": "path",
        "sections": [
            ("s1", "آسان مطلق وجود ندارد", [
                "رشته‌ای که برای یک نفر کم‌رقابت است، برای دیگری به‌خاطر ضعف پایه سخت می‌شود. معیار را شخصی کنید.",
            ]),
            ("s2", "شاخص‌های واقعی", [
                "نسبت داوطلب به ظرفیت، پراکندگی دانشگاه‌ها، همپوشانی منابع با لیسانس‌تان و آمادگی زبان/تخصص را بسنجید.",
                "انتخاب فقط برچسب «آسان» بدون علاقه، معمولاً در ترم‌های بعد هزینه می‌دهد.",
            ]),
            ("s3", "پیشنهاد بلوک", [
                "۳ گرایش هم‌راستا با علاقه و پایه بنویسید، ضرایب و ظرفیت را مقایسه کنید، بعد برنامه مطالعه را در اپ بلوک قفل کنید.",
            ]),
        ],
    },
    {
        "slug": "konkour-afghanestan",
        "title": "کنکور فوق‌لیسانس افغانستان",
        "desc": "آزمون فوق‌لیسانس افغانستان مسیر ورود به مقطع ارشد برای علاقه‌مندان است؛ شرایط و تقویم را از مرجع رسمی همان دوره بگیرید.",
        "theme": "exam",
        "sections": [
            ("s1", "کلیات", [
                "داوطلبان علاقه‌مند به ادامه تحصیل در مقطع ارشد می‌توانند در چارچوب اعلامی همان سال در آزمون شرکت کنند.",
            ]),
            ("s2", "اقدام عملی", [
                "دفترچه/اطلاعیه رسمی، مدارک هویتی و تحصیلی، مهلت ثبت‌نام و حوزه امتحان را از کانال معتبر همان کشور دنبال کنید.",
                "اطلاعات شبکه‌های اجتماعی را بدون سند رسمی مبنا نگذارید.",
            ]),
        ],
    },
    {
        "slug": "vaziyat-kelas-takmili",
        "title": "آخرین وضعیت کلاس‌های تحصیلات تکمیلی",
        "desc": "وضعیت برگزاری کلاس‌های تحصیلات تکمیلی را از ابلاغیه دانشگاه و وزارت علوم همان ترم چک کنید؛ الگو بین واحدها فرق دارد.",
        "theme": "uni",
        "sections": [
            ("s1", "منبع خبر", [
                "حضوری، ترکیبی یا مجازی بودن کلاس‌ها معمولاً با بخشنامه وزارتی و تصمیم هیئت‌رئیسه هر دانشگاه مشخص می‌شود.",
            ]),
            ("s2", "کار دانشجو", [
                "سامانه آموزشی واحد، کانال رسمی دانشکده و تقویم آموزشی ترم را ملاک قرار دهید؛ شایعه را جایگزین ابلاغ نکنید.",
            ]),
        ],
    },
    {
        "slug": "pasokhname-1405",
        "title": "پاسخنامه کنکور ارشد ۱۴۰۵",
        "desc": "کلید رسمی ارشد ۱۴۰۵ را از سایت سازمان سنجش بگیرید تا درصد و عملکرد را دقیق بسنجید.",
        "theme": "key",
        "sections": [
            ("s1", "از کجا دانلود؟", [
                "پس از آزمون، سنجش کلید را در درگاه مربوط منتشر می‌کند. فقط فایل همان سال و همان مجموعه امتحانی را استفاده کنید.",
            ]),
            ("s2", "بعد از کلید", [
                "پاسخ‌ها را با دفترچه خود تطبیق دهید، درصد بگیرید و برای اعتراض احتمالی در مهلت رسمی اقدام کنید.",
            ]),
        ],
    },
    {
        "slug": "soalat-1405",
        "title": "سوالات کنکور کارشناسی ارشد ۱۴۰۵",
        "desc": "دفترچه سوالات ارشد ۱۴۰۵ برای تحلیل سبک سوال و تخمین اولیه کاربرد دارد؛ از منبع رسمی تهیه کنید.",
        "theme": "paper",
        "sections": [
            ("s1", "چرا مهم است؟", [
                "سوالات سال جاری الگوی مفهومی و زمان‌بندی واقعی آزمون را نشان می‌دهد.",
            ]),
            ("s2", "تمرین درست", [
                "در شرایط زمان‌دار بزنید، غلط‌ها را به منبع برگردانید و در برنامه بلوک برای ضعف‌ها بلوک جبرانی بگذارید.",
            ]),
        ],
    },
    {
        "slug": "nemune-proposal",
        "title": "دانلود نمونه پروپوزال ارشد",
        "desc": "نمونه پروپوزال فقط الگوست؛ ساختار را بیاموزید و محتوای پژوهش خودتان را بنویسید، نه کپی آماده.",
        "theme": "docs",
        "sections": [
            ("s1", "فایده نمونه", [
                "دیدن چند نمونه استاندارد، ترتیب بخش‌ها (بیان مسئله، هدف، روش، منابع) را روشن می‌کند.",
            ]),
            ("s2", "خط قرمز", [
                "کپی متن نمونه تخلف پژوهشی است. از نمونه برای قالب و منطق استفاده کنید؛ محتوا باید اصیل باشد.",
                "قالب دانشکده خودتان را از گروه آموزشی بگیرید؛ ممکن است با نمونه‌های عمومی فرق کند.",
            ]),
        ],
    },
    {
        "slug": "kod-zarib-modiriyat",
        "title": "کد ضریب ارشد مدیریت",
        "desc": "ضرایب مجموعه مدیریت مسیر مطالعه و انتخاب گرایش را مشخص می‌کند؛ جدول دفترچه همان سال را مبنا بگذارید.",
        "theme": "chart",
        "sections": [
            ("s1", "نقش ضرایب", [
                "در گرایش‌های مدیریت، وزن دروس تخصصی و عمومی فرق دارد؛ کد ضریب همان وزن را نشان می‌دهد.",
            ]),
            ("s2", "برنامه مطالعه", [
                "دروس پرضریب را زودتر به درصد پایدار برسانید؛ دروس کم‌ضریب را برای تثبیت نگه دارید.",
            ]),
        ],
    },
    {
        "slug": "soalat-1404",
        "title": "سوالات کنکور کارشناسی ارشد ۱۴۰۴",
        "desc": "سوالات ارشد ۱۴۰۴ برای شناخت سبک تحلیلی آزمون و تمرین زمان‌دار هنوز منبع ارزشمندی است.",
        "theme": "paper",
        "sections": [
            ("s1", "استفاده هوشمند", [
                "سال قبل را کامل زمان‌دار بزنید، بعد با کلید همان سال درصد بگیرید.",
            ]),
            ("s2", "اشتباه رایج", [
                "فقط حفظ پاسخ بدون تحلیل گزینه، در آزمون بعدی کمکی نمی‌کند؛ علت غلط را یادداشت کنید.",
            ]),
        ],
    },
    {
        "slug": "pasokhname-1404",
        "title": "پاسخنامه کنکور ارشد ۱۴۰۴",
        "desc": "کلید ارشد ۱۴۰۴ امکان ارزیابی دقیق‌تر عملکرد روی سوالات همان سال را می‌دهد.",
        "theme": "key",
        "sections": [
            ("s1", "تطبیق", [
                "کلید را با دفترچه ۱۴۰۴ مجموعه خودتان جفت کنید؛ اشتباه مجموعه نتایج را بی‌معنا می‌کند.",
            ]),
            ("s2", "تحلیل", [
                "نقاط ضعف موضوعی را به برنامه ترم بعد منتقل کنید.",
            ]),
        ],
    },
    {
        "slug": "atbaa-khareji",
        "title": "شرایط اتباع خارجی در کنکور ارشد",
        "desc": "اتباع دارای اقامت مجاز می‌توانند با رعایت ضوابط دفترچه ارشد در آزمون شرکت کنند.",
        "theme": "docs",
        "sections": [
            ("s1", "پیش‌نیاز قانونی", [
                "اقامت معتبر و مدارک اعلام‌شده در دفترچه همان سال شرط ورود به فرآیند است.",
            ]),
            ("s2", "ثبت‌نام", [
                "فیلدهای مربوط به اتباع را دقیق پر کنید و مدارک را طبق راهنما بارگذاری/ارائه دهید.",
            ]),
        ],
    },
    {
        "slug": "eteraz-olympiad",
        "title": "اعتراض به نتایج نهایی المپیاد دانشجویی",
        "desc": "اعتراض به نتیجه المپیاد دانشجویی فقط در مهلت و از مسیر اعلامی سامانه سنجش پذیرفته می‌شود.",
        "theme": "exam",
        "sections": [
            ("s1", "کجا ثبت شود؟", [
                "پس از اعلام نتیجه، بخش مربوط در سامانه سنجش/المپیاد مسیر ثبت درخواست بررسی را باز می‌کند.",
            ]),
            ("s2", "نکته", [
                "در مهلت رسمی و با دلیل مشخص اقدام کنید؛ خارج از بازه معمولاً بررسی نمی‌شود.",
            ]),
        ],
    },
    {
        "slug": "sajed",
        "title": "سامانه ساجد وزارت علوم",
        "desc": "ساجد برای اتصال دانشگاه و صنعت و هم‌راستا کردن پایان‌نامه‌ها با نیاز واقعی طراحی شده است.",
        "theme": "uni",
        "sections": [
            ("s1", "کاربرد", [
                "اساتید و دانشجویان می‌توانند فرصت‌های ارتباط با صنعت و موضوعات کاربردی را از مسیر رسمی وزارتی پیگیری کنند.",
            ]),
            ("s2", "ورود", [
                "فقط از دامنه و لینک اعلام‌شده وزارت علوم وارد شوید؛ اطلاعات حساب را محرمانه نگه دارید.",
            ]),
        ],
    },
    {
        "slug": "tafawot-behdasht-olum",
        "title": "تفاوت کنکور ارشد وزارت بهداشت و وزارت علوم",
        "desc": "ارشد بهداشت بیشتر مسیرهای علوم پزشکی/بهداشت است؛ ارشد علوم پوشش مهندسی، علوم پایه و انسانی غیرپزشکی دارد.",
        "theme": "path",
        "sections": [
            ("s1", "مرز اصلی", [
                "مرجع برگزاری، دفترچه، رشته‌ها و گاه مدارک بعدی بین دو وزارتخانه جداست.",
            ]),
            ("s2", "انتخاب مسیر", [
                "علاقه شغلی و پیش‌نیاز رشته لیسانس را ببینید؛ قاطی کردن منابع دو آزمون معمولاً نتیجه را ضعیف می‌کند.",
            ]),
        ],
    },
    {
        "slug": "dafaa-melli-1406",
        "title": "کارشناسی ارشد دانشگاه عالی دفاع ملی ۱۴۰۶",
        "desc": "ثبت‌نام ارشد دانشگاه عالی دفاع ملی ۱۴۰۶ اینترنتی و بر پایه دفترچه همان دوره است؛ شرایط اختصاصی را دقیق بخوانید.",
        "theme": "uni",
        "sections": [
            ("s1", "شروع کار", [
                "دفترچه راهنما، مدارک و ضوابط پذیرش اختصاصی این دانشگاه را قبل از پرداخت/ثبت مطالعه کنید.",
            ]),
            ("s2", "ثبت‌نام", [
                "در بازه اعلامی از درگاه رسمی اقدام کنید و رسید پیگیری را نگه دارید.",
            ]),
        ],
    },
    {
        "slug": "proposal-arshad",
        "title": "پروپوزال کارشناسی ارشد",
        "desc": "پروپوزال همان پیشنهاده پژوهش است؛ قبل از نگارش پایان‌نامه باید مسئله، هدف و روش روشن شود.",
        "theme": "docs",
        "sections": [
            ("s1", "اجزای کلیدی", [
                "بیان مسئله، اهمیت، سوالات/فرضیه‌ها، پیشینه کوتاه، روش و منابع حداقلی ستون فقرات پروپوزال‌اند.",
            ]),
            ("s2", "تأیید استاد", [
                "قبل از گسترش کار، با استاد راهنما روی مسئله و امکان‌پذیری توافق کنید تا دوباره‌کاری کم شود.",
            ]),
        ],
    },
    {
        "slug": "pasokhname-1403",
        "title": "پاسخنامه کنکور کارشناسی ارشد ۱۴۰۳",
        "desc": "کلید ۱۴۰۳ برای تمرین روی سوالات همان سال و تخمین گذشته‌نگر مفید است.",
        "theme": "key",
        "sections": [
            ("s1", "دانلود رسمی", [
                "از بایگانی سنجش کلید مجموعه خود را بگیرید.",
            ]),
            ("s2", "تمرین", [
                "پس از تصحیح، مباحث پرتکرار غلط را در برنامه جاری بگنجانید.",
            ]),
        ],
    },
    {
        "slug": "soalat-1403",
        "title": "سوالات کنکور کارشناسی ارشد ۱۴۰۳",
        "desc": "دفترچه ۱۴۰۳ برای تخمین سطح و آشنایی با تیپ سوالات مجموعه امتحانی شما کاربرد دارد.",
        "theme": "paper",
        "sections": [
            ("s1", "زمان‌دار بزنید", [
                "شرایط آزمون را شبیه‌سازی کنید تا مدیریت زمان واقعی شود.",
            ]),
            ("s2", "بعد از آزمون آزمایشی", [
                "با کلید ۱۴۰۳ درصد بگیرید و نقشه ضعف بکشید.",
            ]),
        ],
    },
    {
        "slug": "dafoos",
        "title": "آزمون دافوس",
        "desc": "دافوس دوره تخصصی فرماندهی و ستاد است؛ آزمون آن برای شناسایی افراد واجد شرایط این مسیر برگزار می‌شود.",
        "theme": "exam",
        "sections": [
            ("s1", "دافوس چیست؟", [
                "دوره‌ای تخصصی در حوزه فرماندهی و مدیریت دفاعی است و ورودی خاص خود را دارد.",
            ]),
            ("s2", "اطلاعات ثبت‌نام", [
                "شرایط شرکت، منابع و تقویم را فقط از اطلاعیه رسمی همان دوره دنبال کنید.",
            ]),
        ],
    },
    {
        "slug": "taasis-moasse-mohajerat",
        "title": "شرایط تأسیس مؤسسه مهاجرتی",
        "desc": "تأسیس دفتر مهاجرتی نیازمند رعایت مجوزها و آشنایی با مقررات مبدأ و مقصد است؛ مسیر قانونی را کامل طی کنید.",
        "theme": "docs",
        "sections": [
            ("s1", "الزامات کلی", [
                "مجوزهای صنفی/قانونی، دانش مقررات مهاجرتی و مسئولیت در قبال موکل از پیش‌نیازهای جدی است.",
            ]),
            ("s2", "هشدار", [
                "فعالیت بدون مجوز ریسک حقوقی دارد. از مراجع رسمی همان حوزه مجوز و چک‌لیست روز را بگیرید.",
            ]),
        ],
    },
]

FEED_ORDER = [a["slug"] for a in ARTICLES]

PICKS = [
    ("soalat-1405.html", "سوالات کنکور ارشد ۱۴۰۵", "paper"),
    ("pasokhname-1405.html", "پاسخنامه ارشد ۱۴۰۵", "key"),
    ("kod-zarib-hoghugh.html", "کد ضریب ارشد حقوق", "chart"),
    ("proposal-arshad.html", "پروپوزال کارشناسی ارشد", "docs"),
    ("tafawot-behdasht-olum.html", "تفاوت ارشد بهداشت و علوم", "path"),
]

READS = [
    ("../moshavere/index.html", "مشاوره کنکور سراسری"),
    ("../moshavere/shoroo-az-tabestan.html", "شروع از تابستان"),
    ("../barname-1406.html", "برنامه کنکور ۱۴۰۶"),
    ("../gheyr-entefaee/index.html", "بدون‌آزمون غیرانتفاعی"),
    ("../../../search.html", "جستجو در بلوک"),
]


def thumb(theme: str) -> str:
    return f'<span class="feed-thumb feed-thumb--photo feed-thumb--{theme}" aria-hidden="true"><i></i><b></b></span>'


def header_html() -> str:
    return f"""  <header class="site-header">
    <div class="container inner">
      <a class="brand" href="{R}index.html">
        <img class="brand-logo" src="{R}assets/bolok-logo.svg?v={V}" alt="بلوک" width="36" height="36" />
        <span>بلوک</span>
      </a>
      <nav class="nav" aria-label="اصلی">
        <div class="nav-item--has-sub" data-edu-nav>
          <a class="nav-trigger" href="{R}index.html#education" data-edu-trigger aria-expanded="false" aria-haspopup="true">
            مطالب آموزشی <span class="nav-trigger-caret" aria-hidden="true"></span>
          </a>
          <div class="nav-panel" role="menu">
            <div class="nav-panel-head"><a href="../index.html">هاب کنکور</a></div>
            <div class="nav-panel-group">
              <h4>کارشناسی ارشد</h4>
              <a href="index.html">مشاوره ارشد</a>
              <a href="soalat-1405.html">سوالات ۱۴۰۵</a>
              <a href="proposal-arshad.html">پروپوزال</a>
            </div>
            <div class="nav-panel-group">
              <h4>سایر</h4>
              <a href="../moshavere/index.html">مشاوره کنکور</a>
              <a href="../gheyr-entefaee/index.html">غیرانتفاعی</a>
            </div>
          </div>
        </div>
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
      <a href="index.html">مشاوره ارشد</a>
      <a href="../moshavere/index.html">مشاوره کنکور</a>
      <a href="../index.html">هاب کنکور</a>
      <a href="{R}index.html">خانه</a>
    </div>
  </header>"""


def mega_footer() -> str:
    return f"""  <footer class="site-mega" id="trust" role="contentinfo">
    <div class="container">
      <div class="mega-cta">
        <div>
          <p class="mega-cta-kicker">بلوک</p>
          <h2>برنامه مطالعه برای ارشد و کنکور</h2>
          <p>بلوک‌های مطالعه را در اپ بچین؛ راهنماهای آموزشی را همین‌جا بخوان.</p>
        </div>
        <div class="mega-cta-actions">
          <a class="btn btn-light" href="{R}index.html#download">دانلود اپ</a>
          <a class="btn btn-ghost mega-cta-ghost" href="{R}search.html">جستجو</a>
        </div>
      </div>
      <div class="site-mega-grid">
        <div class="mega-brand">
          <a class="mega-logo" href="{R}index.html">
            <img src="{R}assets/bolok-logo.svg?v={V}" alt="بلوک" width="48" height="48" loading="lazy" decoding="async" />
            <span>بلوک</span>
          </a>
          <p class="mega-tagline">برنامه‌ریز مطالعه فارسی برای کنکور، ارشد و یادگیری جدی.</p>
          <a class="mega-mail" href="mailto:bolokadmin@gmail.com">bolokadmin@gmail.com</a>
        </div>
        <nav class="mega-col" aria-label="آموزش">
          <h3>آموزش</h3>
          <a href="index.html">مشاوره ارشد</a>
          <a href="../moshavere/index.html">مشاوره کنکور</a>
          <a href="../gheyr-entefaee/index.html">غیرانتفاعی</a>
          <a href="../index.html">هاب کنکور</a>
        </nav>
        <nav class="mega-col" aria-label="محصول">
          <h3>محصول</h3>
          <a href="{R}index.html#download">دانلود اپ</a>
          <a href="{R}search.html">جستجو</a>
          <a href="{R}about.html">درباره</a>
        </nav>
        <div class="mega-col">
          <h3>حقوقی</h3>
          <a href="{R}terms.html">شرایط</a>
          <a href="{R}privacy.html">حریم خصوصی</a>
          <a href="https://www.sanjesh.org" target="_blank" rel="noopener noreferrer">سازمان سنجش</a>
        </div>
      </div>
      <div class="mega-bar">
        <p>© بلوک · <a href="{BASE}/">bolokapp.ir</a></p>
        <p class="mega-bar-note">ضرایب و تاریخ‌ها را از دفترچه رسمی همان سال تأیید کنید.</p>
      </div>
    </div>
  </footer>
  <button type="button" class="back-top" data-back-top aria-label="بازگشت به بالا">↑</button>"""


def shell_head(title: str, desc: str, url: str, ld: dict, og_type: str = "article") -> str:
    return f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0c0e12" />
  <meta name="description" content="{desc}" />
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large" />
  <link rel="canonical" href="{url}" />
  <meta property="og:type" content="{og_type}" />
  <meta property="og:locale" content="fa_IR" />
  <meta property="og:site_name" content="بلوک" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{desc}" />
  <meta property="og:url" content="{url}" />
  <meta property="og:image" content="{BASE}/assets/bolok-logo.png" />
  <title>{title} · بلوک</title>
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
{header_html()}
"""


def write_article(a: dict) -> None:
    url = f"{BASE}/education/konkour/arshad/{a['slug']}.html"
    toc = "".join(f'<li><a href="#{sid}">{h}</a></li>' for sid, h, _ in a["sections"])
    body = "".join(
        f'<h2 id="{sid}">{h}</h2>\n' + "".join(f"      <p>{p}</p>\n" for p in paras)
        for sid, h, paras in a["sections"]
    )
    ld = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": a["title"],
        "description": a["desc"],
        "inLanguage": "fa-IR",
        "dateModified": TODAY,
        "author": {"@type": "Organization", "name": "بلوک"},
        "mainEntityOfPage": url,
    }
    html = shell_head(a["title"], a["desc"], url, ld)
    html += f"""  <main id="main" class="container">
    <div class="edu-hero">
      <nav class="breadcrumb" aria-label="مسیر">
        <a href="{R}index.html">خانه</a><span aria-hidden="true">/</span>
        <a href="{R}education/index.html">مطالب آموزشی</a><span aria-hidden="true">/</span>
        <a href="../index.html">کنکور سراسری</a><span aria-hidden="true">/</span>
        <a href="index.html">مشاوره ارشد</a><span aria-hidden="true">/</span>
        <span>{a['title']}</span>
      </nav>
      <p class="edu-kicker">کارشناسی ارشد · بلوک</p>
      <h1><span class="title-mark" aria-hidden="true"></span> {a['title']}</h1>
      <p class="edu-lead">{a['desc']}</p>
      <p class="article-meta"><span>به‌روزرسانی: {TODAY}</span><span>برچسب: کارشناسی ارشد</span></p>
    </div>
    <div class="article-layout">
      <aside class="article-toc"><h2>فهرست</h2><ol>{toc}</ol></aside>
      <article class="article-body">
      {body}
      <div class="callout callout--tip"><strong>با بلوک ادامه بده</strong><p>بلوک‌های مطالعه ارشد را در <a href="{R}index.html#download">اپ بلوک</a> بچین و از <a href="index.html">فهرست مشاوره ارشد</a> راهنماهای مرتبط را ببین.</p></div>
      <aside class="related-rail" aria-label="مطالب مرتبط">
        <h2>ادامه مسیر</h2>
        <div class="related-chips">
          <a class="related-chip" href="index.html">فهرست ارشد</a>
          <a class="related-chip" href="soalat-1405.html">سوالات ۱۴۰۵</a>
          <a class="related-chip" href="proposal-arshad.html">پروپوزال</a>
          <a class="related-chip" href="../moshavere/index.html">مشاوره کنکور</a>
        </div>
      </aside>
      <div class="article-cta-row">
        <a class="btn btn-primary" href="index.html">همه مطالب ارشد</a>
        <a class="btn btn-ghost" href="../index.html">هاب کنکور</a>
        <a class="btn btn-ghost" href="{R}index.html#download">دانلود بلوک</a>
      </div>
      </article>
    </div>
  </main>
{mega_footer()}
</body>
</html>
"""
    (DIR / f"{a['slug']}.html").write_text(html, encoding="utf-8")


def sidebar() -> str:
    picks = "".join(
        f'<li><a class="side-pick" href="{href}">{thumb(theme)}<span>{title}</span></a></li>'
        for href, title, theme in PICKS
    )
    reads = "".join(f'<li><a href="{href}">{title}</a></li>' for href, title in READS)
    return f"""      <aside class="portal-aside" aria-label="ستون کناری">
        <div class="side-box side-box--picks">
          <h2><span class="side-mark" aria-hidden="true"></span> مقالات منتخب</h2>
          <ul class="side-pick-list">{picks}</ul>
        </div>
        <div class="side-box">
          <h2>منتخب‌های خواندنی</h2>
          <ul>{reads}</ul>
        </div>
        <div class="side-box">
          <h2>دسترسی سریع</h2>
          <ul>
            <li><a href="kod-zarib-modiriyat.html">کد ضریب مدیریت</a></li>
            <li><a href="pasokhname-1405.html">پاسخنامه ۱۴۰۵</a></li>
            <li><a href="sajed.html">سامانه ساجد</a></li>
            <li><a href="../moshavere/index.html">مشاوره کنکور</a></li>
            <li><a href="{R}search.html">جستجو</a></li>
          </ul>
        </div>
      </aside>"""


def pager(page: int, total: int) -> str:
    links = []
    for i in range(1, total + 1):
        href = "index.html" if i == 1 else f"page-{i}.html"
        links.append(f'<span class="page-current">{i}</span>' if i == page else f'<a href="{href}">{i}</a>')
    return '<nav class="pager pager--pipes" aria-label="صفحه‌بندی"><span class="pager-label">صفحات:</span> ' + " | ".join(links) + "</nav>"


def write_listing(page: int, total: int, items: list[dict]) -> None:
    is_first = page == 1
    title = "مشاوره تحصیلی کارشناسی ارشد" if is_first else f"مشاوره تحصیلی کارشناسی ارشد — صفحه {page}"
    desc = LEAD[:160]
    url = f"{BASE}/education/konkour/arshad/index.html" if is_first else f"{BASE}/education/konkour/arshad/page-{page}.html"
    feed = "".join(
        f"""<li>
            <a class="feed-card" href="{it['slug']}.html">
              <div class="feed-card-body">
                <h2>{it['title']}</h2>
                <p>{it['desc'][:140]}…</p>
              </div>
              {thumb(it['theme'])}
            </a>
          </li>"""
        for it in items
    )
    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "CollectionPage", "name": title, "description": desc, "url": url, "inLanguage": "fa-IR"},
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "خانه", "item": f"{BASE}/"},
                    {"@type": "ListItem", "position": 2, "name": "مطالب آموزشی", "item": f"{BASE}/education/index.html"},
                    {"@type": "ListItem", "position": 3, "name": "کنکور سراسری", "item": f"{BASE}/education/konkour/index.html"},
                    {"@type": "ListItem", "position": 4, "name": "مشاوره ارشد", "item": f"{BASE}/education/konkour/arshad/index.html"},
                ],
            },
        ],
    }
    intro = f"""      <section class="portal-intro" aria-label="معرفی">
        <div class="portal-intro-text">
          <p class="edu-lead">{LEAD}</p>
          <div class="stat-pills">
            <span class="stat-pill">گرایش و ضریب</span>
            <span class="stat-pill stat-pill--ghost">سوالات و کلید</span>
            <span class="stat-pill stat-pill--ghost">پروپوزال</span>
            <span class="stat-pill stat-pill--ghost">{len(ARTICLES)} راهنما</span>
          </div>
        </div>
        <aside class="portal-media" aria-label="معرفی بخش">
          <div class="portal-media-frame">
            <div class="portal-media-poster">
              <img src="{R}assets/bolok-logo.svg?v={V}" alt="" width="72" height="72" />
              <strong>مشاوره کارشناسی ارشد</strong>
              <span>از انتخاب گرایش تا پروپوزال</span>
            </div>
            <button type="button" class="portal-play" data-portal-play aria-label="پخش معرفی">▶</button>
            <div class="portal-media-caption">بخش ارشد · بلوک</div>
          </div>
          <p class="portal-media-note">متن‌ها بازنویسی اختصاصی بلوک‌اند؛ تاریخ و ضریب را از سنجش چک کنید.</p>
        </aside>
      </section>"""
    html = shell_head(title, desc, url, ld, og_type="website")
    html += f"""  <main id="main" class="container edu-wrap portal-page">
    <div class="edu-hero edu-hero--portal">
      <nav class="breadcrumb" aria-label="مسیر">
        <a href="{R}index.html">خانه</a><span aria-hidden="true">/</span>
        <a href="{R}education/index.html">مطالب آموزشی</a><span aria-hidden="true">/</span>
        <a href="../index.html">کنکور سراسری</a><span aria-hidden="true">/</span>
        <span>مشاوره تحصیلی کارشناسی ارشد</span>
      </nav>
      <h1><span class="title-mark" aria-hidden="true"></span> مشاوره تحصیلی کارشناسی ارشد</h1>
    </div>
{intro if is_first else f'    <p class="edu-lead portal-page-lead">صفحه {page} از فهرست راهنماهای کارشناسی ارشد بلوک.</p>'}
    <div class="portal-layout">
      <div class="portal-main">
        <ul class="feed-list feed-list--cards">
          {feed}
        </ul>
        {pager(page, total)}
      </div>
{sidebar()}
    </div>
  </main>
{mega_footer()}
</body>
</html>
"""
    (DIR / ("index.html" if page == 1 else f"page-{page}.html")).write_text(html, encoding="utf-8")


def wire_site() -> None:
    index = ROOT / "index.html"
    t = index.read_text(encoding="utf-8")
    if "konkour/arshad/index.html" not in t:
        t = t.replace(
            '<a class="btn btn-ghost" href="education/konkour/gheyr-entefaee/index.html">بدون‌آزمون غیرانتفاعی</a>',
            '<a class="btn btn-ghost" href="education/konkour/gheyr-entefaee/index.html">بدون‌آزمون غیرانتفاعی</a>\n'
            '        <a class="btn btn-ghost" href="education/konkour/arshad/index.html">مشاوره ارشد</a>',
            1,
        )
        needle = '<div class="nav-panel-group">\n              <h4>بدون آزمون غیرانتفاعی</h4>'
        insert = (
            '<div class="nav-panel-group">\n              <h4>کارشناسی ارشد</h4>\n'
            '              <a href="education/konkour/arshad/index.html">مشاوره تحصیلی کارشناسی ارشد</a>\n'
            '              <a href="education/konkour/arshad/soalat-1405.html">سوالات ارشد ۱۴۰۵</a>\n'
            '              <a href="education/konkour/arshad/proposal-arshad.html">پروپوزال ارشد</a>\n'
            '            </div>\n'
            '            <div class="nav-panel-group">\n              <h4>بدون آزمون غیرانتفاعی</h4>'
        )
        if needle in t:
            t = t.replace(needle, insert, 1)
        t = t.replace(
            '<a href="education/konkour/gheyr-entefaee/index.html">بدون‌آزمون غیرانتفاعی</a>\n          <a href="education/konkour/sabt-nam.html">',
            '<a href="education/konkour/gheyr-entefaee/index.html">بدون‌آزمون غیرانتفاعی</a>\n'
            '          <a href="education/konkour/arshad/index.html">مشاوره ارشد</a>\n'
            '          <a href="education/konkour/sabt-nam.html">',
            1,
        )
    t = re.sub(r"\?v=\d+", f"?v={V}", t)
    index.write_text(t, encoding="utf-8")

    hub = ROOT / "education" / "konkour" / "index.html"
    if hub.exists():
        ht = hub.read_text(encoding="utf-8")
        if "arshad/index.html" not in ht:
            ht = ht.replace(
                '<a href="gheyr-entefaee/index.html">این بخش</a>',
                '<a href="gheyr-entefaee/index.html">غیرانتفاعی</a> و '
                '<a href="arshad/index.html">مشاوره کارشناسی ارشد</a>',
                1,
            )
            if "arshad/index.html" not in ht:
                ht = ht.replace(
                    "</main>",
                    """    <section class="container" style="padding-bottom:2rem">
      <div class="callout callout--tip">
        <strong>مشاوره تحصیلی کارشناسی ارشد</strong>
        <p>گرایش، ضریب، سوالات و پروپوزال را در
        <a href="arshad/index.html">بخش ارشد</a> دنبال کنید.</p>
      </div>
    </section>
  </main>""",
                    1,
                )
        ht = re.sub(r"\?v=\d+", f"?v={V}", ht)
        hub.write_text(ht, encoding="utf-8")

    sm_path = ROOT / "sitemap.xml"
    sm = sm_path.read_text(encoding="utf-8")
    urls = [f"{BASE}/education/konkour/arshad/index.html", f"{BASE}/education/konkour/arshad/page-2.html"]
    urls += [f"{BASE}/education/konkour/arshad/{a['slug']}.html" for a in ARTICLES]
    block = "".join(
        f"  <url><loc>{u}</loc><lastmod>{TODAY}</lastmod><changefreq>weekly</changefreq></url>\n"
        for u in urls if u not in sm
    )
    if block:
        sm_path.write_text(sm.replace("</urlset>", block + "</urlset>"), encoding="utf-8")


def main() -> None:
    DIR.mkdir(parents=True, exist_ok=True)
    for a in ARTICLES:
        write_article(a)
        print("ok", a["slug"])
    catalog = {a["slug"]: a for a in ARTICLES}
    ordered = [catalog[s] for s in FEED_ORDER]
    total = (len(ordered) + PER_PAGE - 1) // PER_PAGE
    for page in range(1, total + 1):
        write_listing(page, total, ordered[(page - 1) * PER_PAGE : page * PER_PAGE])
        print("list", page)
    wire_site()
    try:
        from _boost_ux_seo import build_search_index
        data = build_search_index()
        (ROOT / "search-index.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print("search", len(data))
    except Exception as e:
        print("search skip", e)
    print("done", len(ARTICLES), "articles", total, "pages")


if __name__ == "__main__":
    main()
