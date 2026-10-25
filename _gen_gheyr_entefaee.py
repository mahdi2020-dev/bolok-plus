# -*- coding: utf-8 -*-
"""Generate بدون‌آزمون دانشگاه غیرانتفاعی portal + SEO articles (Bolok original)."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIR = ROOT / "education" / "konkour" / "gheyr-entefaee"
BASE = "https://bolokapp.ir"
V = "16"
R = "../../../"
PER_PAGE = 12
TODAY = "2026-10-25"

LEAD = (
    "پذیرش بدون آزمون دانشگاه‌های غیرانتفاعی بر اساس سوابق تحصیلی انجام می‌شود و مسیر جداگانه‌ای از کنکور سراسری دارد. "
    "در این بخش، زمان و نحوه ثبت‌نام، دفترچه و لیست رشته‌ها، شهریه، نتایج، تکمیل ظرفیت، سهمیه و امور دانشجویی "
    "مثل برنامه کلاسی، تسویه و فارغ‌التحصیلی را با زبان ساده بلوک می‌خوانید. تاریخ‌های قطعی را همیشه از سازمان سنجش "
    "و سایت رسمی واحد دانشگاهی چک کنید."
)

ARTICLES: list[dict] = [
    {
        "slug": "darsa-imamreza",
        "title": "سامانه درسا دانشگاه امام رضا",
        "desc": "سامانه درسا (darsa.imamreza.ac.ir) بستر آموزش الکترونیکی و امور تحصیلی دانشگاه امام رضاست؛ ورود، کلاس مجازی و خدمات دانشجویی.",
        "theme": "uni",
        "sections": [
            ("s1", "درسا چیست؟", [
                "سامانه درسا دانشگاه امام رضا یک بستر یکپارچه برای آموزش الکترونیکی و مدیریت امور تحصیلی است. دانشجویان از همین مسیر به کلاس‌های مجازی، منابع درس، نمرات و بخشی از درخواست‌های آموزشی دسترسی پیدا می‌کنند.",
                "آدرس رسمی معمولاً روی دامنه دانشگاه (مانند darsa.imamreza.ac.ir) اعلام می‌شود؛ فقط از لینک‌های اعلام‌شده در سایت اصلی دانشگاه وارد شوید.",
            ]),
            ("s2", "چه کارهایی انجام می‌شود؟", [
                "ورود با نام کاربری دانشجویی، مشاهده برنامه و لینک کلاس، دریافت فایل و تکلیف، پیگیری نمرات و ارتباط آموزشی از کاربردهای رایج است.",
                "اگر رمز عبور را فراموش کردید، از بازیابی داخل سامانه یا پشتیبانی فناوری اطلاعات واحد استفاده کنید.",
            ]),
            ("s3", "نکته امنیتی", [
                "پیام‌ها و لینک‌های ناشناس که ادعای ورود اجباری به درسا دارند را جدی نگیرید. منبع معتبر، سایت رسمی دانشگاه است.",
            ]),
        ],
    },
    {
        "slug": "faregh-tahsili",
        "title": "فارغ‌التحصیلی دانشگاه غیرانتفاعی",
        "desc": "پس از گذراندن واحدها و کسب نمرات قبولی، مراحل فارغ‌التحصیلی غیرانتفاعی شامل تسویه، درخواست و دریافت مدارک است.",
        "theme": "docs",
        "sections": [
            ("s1", "پیش‌نیازها", [
                "فارغ‌التحصیلی معمولاً بعد از اتمام همه واحدها، ثبت نمرات نهایی و نبود درس مردودی باز است.",
                "بدهی شهریه، کتابخانه و سایر بدهی‌های واحد باید قبل از صدور مدارک تسویه شود.",
            ]),
            ("s2", "مراحل رایج", [
                "درخواست در سامانه آموزشی، تأیید آموزش، تسویه حساب و سپس صدور گواهی موقت یا دانشنامه طبق روال دانشگاه.",
            ]),
        ],
    },
    {
        "slug": "barname-kelasi",
        "title": "مشاهده برنامه کلاسی دانشگاه غیرانتفاعی",
        "desc": "برنامه کلاسی دانشگاه‌های غیرانتفاعی از سامانه‌های آموزشی واحد قابل مشاهده است.",
        "theme": "exam",
        "sections": [
            ("s1", "کجا ببینم؟", [
                "بیشتر واحدها برنامه کلاسی را داخل سامانه آموزشی دانشجویی پس از انتخاب واحد نمایش می‌دهند.",
            ]),
            ("s2", "چه چیزهایی را چک کنید", [
                "روز و ساعت، نوع برگزاری، کد درس، استاد و تداخل با سایر دروس را قبل از تثبیت انتخاب واحد بررسی کنید.",
            ]),
        ],
    },
    {
        "slug": "tasvie-hesab",
        "title": "تسویه حساب دانشگاه غیرانتفاعی",
        "desc": "تسویه حساب برای فارغ‌التحصیلی، انتقال یا انصراف لازم است و از طریق سامانه مالی واحد انجام می‌شود.",
        "theme": "card",
        "sections": [
            ("s1", "کی لازم است؟", [
                "برای فارغ‌التحصیلی، انصراف، مهمانی، انتقالی یا دریافت برخی مدارک، تسویه الزامی است.",
            ]),
            ("s2", "مسیر انجام", [
                "از سامانه آموزشی یا میز خدمت، بدهی را ببینید و فقط از درگاه رسمی واحد پرداخت کنید.",
            ]),
        ],
    },
    {
        "slug": "sabt-nam-paziroftegan",
        "title": "ثبت‌نام پذیرفته‌شدگان بدون کنکور دانشگاه‌های غیرانتفاعی",
        "desc": "ثبت‌نام پذیرفته‌شدگان در بازه اعلامی هر دانشگاه و از طریق سایت رسمی همان واحد انجام می‌شود.",
        "theme": "docs",
        "sections": [
            ("s1", "بعد از قبولی", [
                "هر دانشگاه بازه و مدارک ثبت‌نام خودش را اعلام می‌کند؛ تأخیر ممکن است قبولی را لغو کند.",
            ]),
            ("s2", "مدارک پرتکرار", [
                "مدارک هویتی، دیپلم و سوابق، عکس و فرم‌های واحد را طبق چک‌لیست همان دانشگاه آماده کنید.",
            ]),
        ],
    },
    {
        "slug": "tamdid-mohlat",
        "title": "تمدید مهلت ثبت‌نام بدون کنکور دانشگاه غیرانتفاعی",
        "desc": "گاهی سنجش مهلت ثبت‌نام بدون کنکور غیرانتفاعی را تمدید می‌کند؛ فقط اطلاعیه رسمی را ملاک بگیرید.",
        "theme": "card",
        "sections": [
            ("s1", "چرا تمدید؟", [
                "برای پوشش داوطلبانی که در مهلت اول جا مانده‌اند، گاه مهلت تمدید می‌شود.",
            ]),
            ("s2", "چطور مطمئن شویم؟", [
                "متن اطلاعیه سایت سازمان سنجش و درگاه ثبت‌نام معتبر است؛ لیست رشته‌محل به‌روز را دوباره چک کنید.",
            ]),
        ],
    },
    {
        "slug": "tasir-sahmiye",
        "title": "تأثیر سهمیه در پذیرش بدون کنکور دانشگاه غیرانتفاعی",
        "desc": "سهمیه‌هایی مانند مناطق و ایثارگران طبق ضوابط سنجش در پذیرش بدون کنکور اعمال می‌شود.",
        "theme": "chart",
        "sections": [
            ("s1", "سهمیه‌ها", [
                "بر اساس ضوابط اعلامی می‌توان از سهمیه مناطق و حسب مورد ایثارگری استفاده کرد.",
            ]),
            ("s2", "نکته", [
                "اطلاعات نادرست می‌تواند قبولی را باطل کند؛ جزئیات را از دفترچه سال جاری بخوانید.",
            ]),
        ],
    },
    {
        "slug": "nahve-pardakht-shahriye",
        "title": "نحوه پرداخت شهریه دانشگاه غیرانتفاعی",
        "desc": "پرداخت شهریه از سامانه واحد انجام می‌شود؛ مبلغ را پس از ورود ببینید و از درگاه رسمی بپردازید.",
        "theme": "card",
        "sections": [
            ("s1", "مسیر پرداخت", [
                "پس از ورود به حساب دانشجویی، بخش مالی مبلغ ترم را نشان می‌دهد و به درگاه بانکی وصل می‌شود.",
            ]),
            ("s2", "ثابت و متغیر", [
                "معمولاً شهریه ثابت و متغیر (بر اساس واحد) دارد؛ رسید پرداخت را ذخیره کنید.",
            ]),
        ],
    },
    {
        "slug": "nahve-sabt-nam-1405",
        "title": "نحوه ثبت‌نام دانشگاه غیرانتفاعی ۱۴۰۵",
        "desc": "نحوه ثبت‌نام ۱۴۰۵ را از اطلاعیه‌های رسمی سنجش دنبال کنید؛ شامل زمان، درگاه و مدارک است.",
        "theme": "docs",
        "sections": [
            ("s1", "منبع رسمی", [
                "مراحل نام‌نویسی و ضوابط در اطلاعیه‌های پذیرش بر اساس سوابق تحصیلی منتشر می‌شود.",
            ]),
            ("s2", "گام‌ها", [
                "مطالعه دفترچه، آماده‌سازی مدارک، ورود در مهلت، انتخاب رشته‌محل و دریافت کد پیگیری.",
            ]),
        ],
    },
    {
        "slug": "shahriye-1405-1406",
        "title": "شهریه دانشگاه غیرانتفاعی ۱۴۰۵–۱۴۰۶",
        "desc": "شهریه ۱۴۰۵–۱۴۰۶ بر اساس مقطع، رشته و نوع واحد تعیین می‌شود و بین واحدها متفاوت است.",
        "theme": "chart",
        "sections": [
            ("s1", "عوامل مبلغ", [
                "مقطع، رشته، تعداد واحد و سیاست هر مؤسسه مبلغ را تغییر می‌دهد.",
            ]),
            ("s2", "عدد دقیق", [
                "جدول شهریه را از سایت واحد یا پیوست مالی همان سال بگیرید؛ به ارقام غیررسمی اعتماد نکنید.",
            ]),
        ],
    },
    {
        "slug": "daftarche-entekhab-reshte",
        "title": "دفترچه انتخاب رشته دانشگاه غیرانتفاعی",
        "desc": "دفترچه انتخاب رشته هم‌زمان با ثبت‌نام بدون آزمون برای ورودی مهر و بهمن منتشر می‌شود.",
        "theme": "paper",
        "sections": [
            ("s1", "محتوا", [
                "ضوابط پذیرش، جدول رشته‌محل‌ها، ظرفیت‌ها و نکات سهمیه معمولاً در دفترچه است.",
            ]),
            ("s2", "استفاده", [
                "علاقه، شهر، شهریه و ادامه تحصیل را بسنجید؛ نسخه PDF رسمی را نگه دارید.",
            ]),
        ],
    },
    {
        "slug": "shahriye",
        "title": "شهریه دانشگاه غیرانتفاعی",
        "desc": "شهریه معمولاً ثابت + متغیر است و با مقطع، رشته و تعداد واحد تغییر می‌کند.",
        "theme": "chart",
        "sections": [
            ("s1", "ساختار", [
                "بخش ثابت هر ترم و بخش متغیر به‌ازای واحد، الگوی رایج است.",
            ]),
            ("s2", "برنامه مالی", [
                "قبل از ثبت‌نام برآورد ترم‌های بعد و امکان اقساط را از واحد بپرسید.",
            ]),
        ],
    },
    {
        "slug": "zaman-elam-natayej-1405",
        "title": "زمان اعلام نتایج بدون آزمون دانشگاه غیرانتفاعی ۱۴۰۵",
        "desc": "نتایج معمولاً چند هفته پس از پایان مهلت ثبت‌نام برای مهر و بهمن اعلام می‌شود.",
        "theme": "exam",
        "sections": [
            ("s1", "تقویم", [
                "پس از بسته شدن سامانه، سنجش زمان اعلام نتایج را اطلاع‌رسانی می‌کند.",
            ]),
            ("s2", "بعد از نتیجه", [
                "در صورت قبولی فوراً مهلت ثبت‌نام دانشگاه را از سایت واحد بخوانید.",
            ]),
        ],
    },
    {
        "slug": "zaman-sabt-nam-1405",
        "title": "زمان ثبت‌نام دانشگاه غیرانتفاعی ۱۴۰۵",
        "desc": "زمان ثبت‌نام ۱۴۰۵ را سازمان سنجش اعلام می‌کند؛ برای مهر و گاه بهمن بازه جدا دارد.",
        "theme": "card",
        "sections": [
            ("s1", "منبع تاریخ", [
                "تاریخ شروع و پایان فقط از اطلاعیه سنجش معتبر است.",
            ]),
            ("s2", "آمادگی", [
                "مدارک و لیست علاقه‌مندی را از قبل آماده کنید تا در روزهای شلوغ جا نمانید.",
            ]),
        ],
    },
    {
        "slug": "nahve-sabt-nam-sarasari-bedoon-1405",
        "title": "نحوه ثبت‌نام بدون کنکور دانشگاه سراسری ۱۴۰۵",
        "desc": "ثبت‌نام رشته‌های بدون آزمون سراسری نیازمند بررسی لیست رشته‌محل و ضوابط سنجش است.",
        "theme": "docs",
        "sections": [
            ("s1", "تفاوت با غیرانتفاعی", [
                "پذیرش بدون کنکور سراسری دفترچه و ضوابط جدا از مؤسسات غیرانتفاعی دارد.",
            ]),
            ("s2", "اقدام", [
                "لیست رشته‌محل را بخوانید و در مهلت سامانه سنجش ثبت‌نام را کامل کنید.",
            ]),
        ],
    },
    {
        "slug": "sabt-nam-1405",
        "title": "ثبت‌نام دانشگاه غیرانتفاعی ۱۴۰۵",
        "desc": "ثبت‌نام ۱۴۰۵ در دو نوبت مهر و بهمن ممکن است؛ پس از آماده‌سازی مدارک در مهلت سنجش اقدام کنید.",
        "theme": "docs",
        "sections": [
            ("s1", "دو نوبت", [
                "ظرفیت و رشته‌ها می‌تواند بین مهر و بهمن فرق کند.",
            ]),
            ("s2", "چک‌لیست", [
                "اطلاعیه، ورود به سامانه، انتخاب رشته‌محل، صحت اطلاعات و کد پیگیری.",
            ]),
        ],
    },
    {
        "slug": "elam-natayej-takmil-zarfiat",
        "title": "اعلام نتایج تکمیل ظرفیت دانشگاه غیرانتفاعی",
        "desc": "نتایج تکمیل ظرفیت معمولاً کوتاه‌مدت پس از پایان مهلت ثبت‌نام اعلام می‌شود.",
        "theme": "exam",
        "sections": [
            ("s1", "تکمیل ظرفیت", [
                "اگر ظرفیت خالی بماند، ممکن است مرحله تکمیل ظرفیت بدون کنکور اعلام شود.",
            ]),
            ("s2", "پیگیری", [
                "نتیجه را از همان درگاه ثبت‌نام دنبال کنید و مهلت دانشگاه را از دست ندهید.",
            ]),
        ],
    },
    {
        "slug": "list-reshteha",
        "title": "لیست رشته‌های دانشگاه غیرانتفاعی",
        "desc": "سازمان سنجش لیست رشته‌های غیرانتفاعی را در نوبت‌های مختلف منتشر می‌کند.",
        "theme": "paper",
        "sections": [
            ("s1", "منبع لیست", [
                "فایل رسمی رشته‌محل‌ها همراه دفترچه یا پیوست در سایت سنجش منتشر می‌شود.",
            ]),
            ("s2", "انتخاب", [
                "علاقه، شهریه، شهر و ادامه تحصیل را بسنجید؛ اصلاحیه‌ها را هم چک کنید.",
            ]),
        ],
    },
    {
        "slug": "sharayet-hazine-ensraf",
        "title": "شرایط و هزینه انصراف از دانشگاه غیرانتفاعی",
        "desc": "انصراف معمولاً با درخواست و پرداخت هزینه طبق آیین‌نامه همان واحد انجام می‌شود.",
        "theme": "docs",
        "sections": [
            ("s1", "شرایط", [
                "درخواست انصراف، تأیید آموزش و تسویه بدهی‌ها از پیش‌نیازهای رایج است.",
            ]),
            ("s2", "هزینه", [
                "مبلغ بین دانشگاه‌ها متفاوت است؛ قبل از اقدام از مالی واحد عدد دقیق را بپرسید.",
            ]),
        ],
    },
    {
        "slug": "elam-natayej-bedoon-konkour",
        "title": "اعلام نتایج بدون کنکور دانشگاه غیرانتفاعی",
        "desc": "نتایج پس از پایان مهلت ثبت‌نام و بررسی مدارک از سوی سنجش منتشر می‌شود.",
        "theme": "exam",
        "sections": [
            ("s1", "مشاهده", [
                "با اطلاعات ثبت‌نام وارد درگاه اعلام نتایج شوید.",
            ]),
            ("s2", "گام بعدی", [
                "قبول‌شدگان باید طبق اطلاعیه دانشگاه ثبت‌نام قطعی را انجام دهند.",
            ]),
        ],
    },
    {
        "slug": "madarek-sabt-nam-1405",
        "title": "مدارک لازم برای ثبت‌نام بدون کنکور دانشگاه غیرانتفاعی ۱۴۰۵",
        "desc": "مدارک شامل هویت، تحصیلی و عکس است؛ چک‌لیست نهایی را از اطلاعیه واحد بگیرید.",
        "theme": "docs",
        "sections": [
            ("s1", "پرتکرار", [
                "شناسنامه و کارت ملی، عکس، مدرک دیپلم و ریزنمرات و فرم‌های دانشگاه.",
            ]),
            ("s2", "تفاوت واحدها", [
                "هر مؤسسه ممکن است مدرک اضافه بخواهد؛ لیست همان دانشگاه ملاک است.",
            ]),
        ],
    },
    {
        "slug": "hazine-sabt-nam-1405",
        "title": "هزینه ثبت‌نام بدون کنکور دانشگاه غیرانتفاعی ۱۴۰۵",
        "desc": "هزینه ثبت‌نام سنجش و شهریه دانشگاه دو موضوع جداست؛ مبالغ را از درگاه رسمی بپردازید.",
        "theme": "card",
        "sections": [
            ("s1", "مرحله سنجش", [
                "معمولاً مبلغی بابت ثبت‌نام در سامانه سنجش دریافت می‌شود.",
            ]),
            ("s2", "مرحله دانشگاه", [
                "پس از قبولی، شهریه ترم و گاه هزینه خدمات ثبت‌نام توسط واحد اخذ می‌شود.",
            ]),
        ],
    },
    {
        "slug": "sabt-nam",
        "title": "ثبت‌نام دانشگاه غیرانتفاعی",
        "desc": "راهنمای کلی: از پذیرش بدون آزمون تا ثبت‌نام قطعی در واحد قبول‌شده.",
        "theme": "path",
        "sections": [
            ("s1", "دو مرحله", [
                "۱) ثبت‌نام و انتخاب رشته‌محل در سنجش ۲) ثبت‌نام قطعی در دانشگاه پس از قبولی.",
            ]),
            ("s2", "جمع‌بندی", [
                "دفترچه را بخوانید، در مهلت اقدام کنید، نتیجه را پیگیری کنید و مدارک واحد را کامل کنید.",
            ]),
        ],
    },
]

FEED_ORDER = [
    "darsa-imamreza", "faregh-tahsili", "barname-kelasi", "tasvie-hesab",
    "sabt-nam-paziroftegan", "tamdid-mohlat", "tasir-sahmiye", "nahve-pardakht-shahriye",
    "nahve-sabt-nam-1405", "shahriye-1405-1406", "daftarche-entekhab-reshte", "shahriye",
    "zaman-elam-natayej-1405", "zaman-sabt-nam-1405", "nahve-sabt-nam-sarasari-bedoon-1405",
    "sabt-nam-1405", "elam-natayej-takmil-zarfiat", "list-reshteha", "sharayet-hazine-ensraf",
    "elam-natayej-bedoon-konkour", "madarek-sabt-nam-1405", "hazine-sabt-nam-1405", "sabt-nam",
]

PICKS = [
    ("list-reshteha.html", "لیست رشته‌های دانشگاه غیرانتفاعی", "paper"),
    ("elam-natayej-bedoon-konkour.html", "اعلام نتایج بدون کنکور غیرانتفاعی", "exam"),
    ("madarek-sabt-nam-1405.html", "مدارک ثبت‌نام بدون کنکور ۱۴۰۵", "docs"),
    ("sabt-nam.html", "ثبت‌نام دانشگاه غیرانتفاعی", "path"),
    ("hazine-sabt-nam-1405.html", "هزینه ثبت‌نام بدون کنکور ۱۴۰۵", "card"),
]

READS = [
    ("../moshavere/shoroo-az-tabestan.html", "شروع مطالعه از تابستان"),
    ("../moshavere/dalayel-oft-rotbe.html", "دلایل افت رتبه"),
    ("../barname-1406.html", "برنامه‌ریزی کنکور ۱۴۰۶"),
    ("../sabt-nam.html", "ثبت نام کنکور سراسری"),
    ("../../../search.html", "جستجو در مطالب بلوک"),
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
              <h4>غیرانتفاعی</h4>
              <a href="index.html">بدون آزمون غیرانتفاعی</a>
              <a href="sabt-nam-1405.html">ثبت‌نام ۱۴۰۵</a>
              <a href="list-reshteha.html">لیست رشته‌ها</a>
            </div>
            <div class="nav-panel-group">
              <h4>مشاوره</h4>
              <a href="../moshavere/index.html">مشاوره کنکور</a>
              <a href="../barname-1406.html">برنامه ۱۴۰۶</a>
            </div>
            <div class="nav-panel-group">
              <h4>کنکور سراسری</h4>
              <a href="../sabt-nam.html">ثبت نام کنکور</a>
              <a href="../zaman-sabt-nam.html">زمان ثبت نام</a>
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
      <a href="index.html">غیرانتفاعی بدون آزمون</a>
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
          <h2>برنامه مطالعه + راهنمای کنکور</h2>
          <p>از اپ برای چیدن روز استفاده کن؛ از مطالب آموزشی برای مسیر دانشگاه و کنکور.</p>
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
        <nav class="mega-col" aria-label="آموزش">
          <h3>آموزش</h3>
          <a href="index.html">بدون آزمون غیرانتفاعی</a>
          <a href="../moshavere/index.html">مشاوره کنکور</a>
          <a href="../index.html">هاب کنکور</a>
          <a href="../sabt-nam.html">ثبت نام کنکور</a>
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
        <p class="mega-bar-note">تاریخ‌ها و ظرفیت‌ها را از سنجش و سایت واحد چک کنید.</p>
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
    url = f"{BASE}/education/konkour/gheyr-entefaee/{a['slug']}.html"
    toc = "".join(f'<li><a href="#{sid}">{h}</a></li>' for sid, h, _ in a["sections"])
    body = ""
    for sid, h, paras in a["sections"]:
        body += f'<h2 id="{sid}">{h}</h2>\n'
        for p in paras:
            body += f"      <p>{p}</p>\n"
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
        <a href="index.html">بدون آزمون غیرانتفاعی</a><span aria-hidden="true">/</span>
        <span>{a['title']}</span>
      </nav>
      <p class="edu-kicker">دانشگاه غیرانتفاعی · بلوک</p>
      <h1><span class="title-mark" aria-hidden="true"></span> {a['title']}</h1>
      <p class="edu-lead">{a['desc']}</p>
      <p class="article-meta"><span>به‌روزرسانی: {TODAY}</span><span>برچسب: غیرانتفاعی بدون آزمون</span></p>
    </div>
    <div class="article-layout">
      <aside class="article-toc"><h2>فهرست</h2><ol>{toc}</ol></aside>
      <article class="article-body">
      {body}
      <div class="callout callout--tip"><strong>با بلوک ادامه بده</strong><p>برنامه مطالعه را در <a href="{R}index.html#download">اپ بلوک</a> بچین و از <a href="index.html">فهرست بدون‌آزمون غیرانتفاعی</a> بقیه راهنماها را ببین.</p></div>
      <aside class="related-rail" aria-label="مطالب مرتبط">
        <h2>ادامه مسیر</h2>
        <div class="related-chips">
          <a class="related-chip" href="index.html">فهرست غیرانتفاعی</a>
          <a class="related-chip" href="sabt-nam-1405.html">ثبت‌نام ۱۴۰۵</a>
          <a class="related-chip" href="list-reshteha.html">لیست رشته‌ها</a>
          <a class="related-chip" href="../moshavere/index.html">مشاوره کنکور</a>
        </div>
      </aside>
      <div class="article-cta-row">
        <a class="btn btn-primary" href="index.html">همه مطالب این بخش</a>
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
            <li><a href="sabt-nam.html">ثبت‌نام غیرانتفاعی</a></li>
            <li><a href="zaman-sabt-nam-1405.html">زمان ثبت‌نام ۱۴۰۵</a></li>
            <li><a href="shahriye.html">شهریه</a></li>
            <li><a href="../moshavere/index.html">مشاوره کنکور</a></li>
            <li><a href="{R}search.html">جستجو</a></li>
          </ul>
        </div>
      </aside>"""


def pager(page: int, total: int) -> str:
    links = []
    for i in range(1, total + 1):
        href = "index.html" if i == 1 else f"page-{i}.html"
        links.append(
            f'<span class="page-current">{i}</span>' if i == page else f'<a href="{href}">{i}</a>'
        )
    return (
        '<nav class="pager pager--pipes" aria-label="صفحه‌بندی">'
        '<span class="pager-label">صفحات:</span> '
        + " | ".join(links)
        + "</nav>"
    )


def write_listing(page: int, total: int, items: list[dict]) -> None:
    is_first = page == 1
    title = "بدون آزمون دانشگاه غیرانتفاعی" if is_first else f"بدون آزمون دانشگاه غیرانتفاعی — صفحه {page}"
    desc = LEAD[:160]
    url = (
        f"{BASE}/education/konkour/gheyr-entefaee/index.html"
        if is_first
        else f"{BASE}/education/konkour/gheyr-entefaee/page-{page}.html"
    )
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
                    {"@type": "ListItem", "position": 4, "name": "بدون آزمون غیرانتفاعی", "item": f"{BASE}/education/konkour/gheyr-entefaee/index.html"},
                ],
            },
        ],
    }
    intro = f"""      <section class="portal-intro" aria-label="معرفی">
        <div class="portal-intro-text">
          <p class="edu-lead">{LEAD}</p>
          <div class="stat-pills">
            <span class="stat-pill">سوابق تحصیلی</span>
            <span class="stat-pill stat-pill--ghost">شهریه و ثبت‌نام</span>
            <span class="stat-pill stat-pill--ghost">نتایج و تکمیل ظرفیت</span>
            <span class="stat-pill stat-pill--ghost">{len(ARTICLES)} راهنما</span>
          </div>
        </div>
        <aside class="portal-media" aria-label="معرفی بخش">
          <div class="portal-media-frame">
            <div class="portal-media-poster">
              <img src="{R}assets/bolok-logo.svg?v={V}" alt="" width="72" height="72" />
              <strong>بدون آزمون غیرانتفاعی</strong>
              <span>راهنمای پذیرش و امور دانشجویی</span>
            </div>
            <button type="button" class="portal-play" data-portal-play aria-label="پخش معرفی">▶</button>
            <div class="portal-media-caption">راهنمای بخش · بلوک</div>
          </div>
          <p class="portal-media-note">از ثبت‌نام تا شهریه و فارغ‌التحصیلی — با ارجاع به منابع رسمی.</p>
        </aside>
      </section>"""
    html = shell_head(title, desc, url, ld, og_type="website")
    html += f"""  <main id="main" class="container edu-wrap portal-page">
    <div class="edu-hero edu-hero--portal">
      <nav class="breadcrumb" aria-label="مسیر">
        <a href="{R}index.html">خانه</a><span aria-hidden="true">/</span>
        <a href="{R}education/index.html">مطالب آموزشی</a><span aria-hidden="true">/</span>
        <a href="../index.html">کنکور سراسری</a><span aria-hidden="true">/</span>
        <span>بدون آزمون دانشگاه غیرانتفاعی</span>
      </nav>
      <h1><span class="title-mark" aria-hidden="true"></span> بدون آزمون دانشگاه غیرانتفاعی</h1>
    </div>
{intro if is_first else f'    <p class="edu-lead portal-page-lead">صفحه {page} از فهرست راهنماهای غیرانتفاعی بلوک.</p>'}
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
    out = DIR / ("index.html" if page == 1 else f"page-{page}.html")
    out.write_text(html, encoding="utf-8")


def wire_site() -> None:
    index = ROOT / "index.html"
    t = index.read_text(encoding="utf-8")
    if "gheyr-entefaee/index.html" not in t:
        t = t.replace(
            '<a class="btn btn-ghost" href="education/konkour/moshavere/index.html">مشاوره کنکور</a>',
            '<a class="btn btn-ghost" href="education/konkour/moshavere/index.html">مشاوره کنکور</a>\n'
            '        <a class="btn btn-ghost" href="education/konkour/gheyr-entefaee/index.html">بدون‌آزمون غیرانتفاعی</a>',
            1,
        )
    if "بدون آزمون دانشگاه غیرانتفاعی" not in t or 'href="education/konkour/gheyr-entefaee/index.html"' not in t.split("nav-panel")[1][:2000]:
        needle = '<div class="nav-panel-group">\n              <h4>انتخاب رشته دانشگاه آزاد</h4>'
        insert = (
            '<div class="nav-panel-group">\n              <h4>بدون آزمون غیرانتفاعی</h4>\n'
            '              <a href="education/konkour/gheyr-entefaee/index.html">بدون آزمون دانشگاه غیرانتفاعی</a>\n'
            '              <a href="education/konkour/gheyr-entefaee/sabt-nam-1405.html">ثبت‌نام ۱۴۰۵</a>\n'
            '              <a href="education/konkour/gheyr-entefaee/list-reshteha.html">لیست رشته‌ها</a>\n'
            '            </div>\n'
            '            <div class="nav-panel-group">\n              <h4>انتخاب رشته دانشگاه آزاد</h4>'
        )
        if needle in t and "gheyr-entefaee/sabt-nam-1405" not in t:
            t = t.replace(needle, insert, 1)
    t = t.replace(
        '<a href="education/konkour/moshavere/index.html">مشاوره کنکور</a>\n          <a href="education/konkour/sabt-nam.html">',
        '<a href="education/konkour/moshavere/index.html">مشاوره کنکور</a>\n'
        '          <a href="education/konkour/gheyr-entefaee/index.html">بدون‌آزمون غیرانتفاعی</a>\n'
        '          <a href="education/konkour/sabt-nam.html">',
        1,
    )
    t = re.sub(r"\?v=\d+", f"?v={V}", t)
    index.write_text(t, encoding="utf-8")

    hub = ROOT / "education" / "konkour" / "index.html"
    if hub.exists():
        ht = hub.read_text(encoding="utf-8")
        if "gheyr-entefaee/index.html" not in ht:
            ht = ht.replace(
                "</main>",
                """    <section class="container" style="padding-bottom:2rem">
      <div class="callout callout--tip">
        <strong>بدون آزمون دانشگاه غیرانتفاعی</strong>
        <p>راهنمای ثبت‌نام، شهریه، نتایج و امور دانشجویی را در
        <a href="gheyr-entefaee/index.html">این بخش</a> بخوانید.</p>
      </div>
    </section>
  </main>""",
                1,
            )
        ht = re.sub(r"\?v=\d+", f"?v={V}", ht)
        hub.write_text(ht, encoding="utf-8")

    sm_path = ROOT / "sitemap.xml"
    sm = sm_path.read_text(encoding="utf-8")
    urls = [
        f"{BASE}/education/konkour/gheyr-entefaee/index.html",
        f"{BASE}/education/konkour/gheyr-entefaee/page-2.html",
    ] + [f"{BASE}/education/konkour/gheyr-entefaee/{a['slug']}.html" for a in ARTICLES]
    block = "".join(
        f"  <url><loc>{u}</loc><lastmod>{TODAY}</lastmod><changefreq>weekly</changefreq></url>\n"
        for u in urls
        if u not in sm
    )
    if block:
        sm_path.write_text(sm.replace("</urlset>", block + "</urlset>"), encoding="utf-8")


def main() -> None:
    DIR.mkdir(parents=True, exist_ok=True)
    for a in ARTICLES:
        write_article(a)
        print("article", a["slug"])
    catalog = {a["slug"]: a for a in ARTICLES}
    ordered = [catalog[s] for s in FEED_ORDER if s in catalog]
    total = (len(ordered) + PER_PAGE - 1) // PER_PAGE
    for page in range(1, total + 1):
        chunk = ordered[(page - 1) * PER_PAGE : page * PER_PAGE]
        write_listing(page, total, chunk)
        print("list", page, len(chunk))
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
