# -*- coding: utf-8 -*-
"""Original Bolok guide: انتخاب رشته تجربی ۱۴۰۵ (Heyva-topic coverage, not copy)."""
from __future__ import annotations

import importlib.util
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
V_OLD, V_NEW = "25", "26"
TODAY = "2026-10-26"

spec = importlib.util.spec_from_file_location("seo", ROOT / "_seo_boost_v25.py")
seo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(seo)

spec_m = importlib.util.spec_from_file_location("mosahab", ROOT / "_mosahab_nav_v24.py")
mosahab = importlib.util.module_from_spec(spec_m)
spec_m.loader.exec_module(mosahab)


def sync_nav_with_tajrobi() -> None:
    """Keep both module copies of CATEGORIES aligned for header builds."""
    for mod in (mosahab, seo.mosahab):
        for i, (k, lab, links) in enumerate(mod.CATEGORIES):
            if k != "entekhab":
                continue
            item = ("education/konkour/entekhab-reshte-tajrobi.html", "انتخاب رشته تجربی")
            links = list(links)
            if item not in links:
                links.insert(1, item)
            mod.CATEGORIES[i] = (k, lab, links)

PAGE = dict(
    slug="entekhab-reshte-tajrobi.html",
    title="راهنمای انتخاب رشته تجربی ۱۴۰۵",
    desc="راهنمای کامل انتخاب رشته کنکور تجربی ۱۴۰۵: کارنامه، ظرفیت و رتبه قبولی، سهمیه، دانشگاه آزاد، اولویت‌بندی تا ۱۵۰ کد و FAQ",
    kicker="گروه آزمایشی تجربی · انتخاب رشته",
    lead="اگر در کنکور تجربی ۱۴۰۵ مجاز شده‌اید، این راهنما مسیر هوشمندانه انتخاب رشته را از خواندن کارنامه تا ثبت فرم سراسری و آزاد توضیح می‌دهد — با تمرکز روی علاقه، شانس قبولی و شرایط واقعی رشته‌محل‌ها.",
    sections=[
        (
            "intro",
            "انتخاب رشته تجربی چیست و چرا سخت‌تر است؟",
            """<p>گروه تجربی معمولاً پرجمعیت‌ترین گروه کنکور است و رقابت روی رشته‌های پزشکی، دندان‌پزشکی، داروسازی و پیراپزشکی بسیار فشرده است. بعد از اعلام نتایج، سوال رایج این است: «با این رتبه کجا قبول می‌شوم؟» سوال سازنده‌تر این است: «چطور با چینش هوشمند، بهترین ترکیب علاقه و شانس را بسازم؟»</p>
<p>داوطلبان مجاز می‌توانند حداکثر حدود <strong>۱۵۰ کد رشته‌محل</strong> را در فرم سراسری ثبت کنند (عدد دقیق را از دفترچه همان سال بگیرید). انتخاب عجولانه فقط بر اساس اسم دانشگاه، یکی از پرتکرارترین خطاهاست.</p>
<p>برای چارچوب کلی همه گروه‌ها، صفحه <a href="entekhab-reshte-1405.html">انتخاب رشته کنکور ۱۴۰۵</a> را هم ببینید.</p>""",
        ),
        (
            "time",
            "زمان انتخاب رشته تجربی ۱۴۰۵",
            """<p>انتخاب رشته کنکور سراسری ۱۴۰۵ از حدود <strong>۱۳ مهر</strong> آغاز و تا حدود <strong>۲۰ مهر</strong> تمدید شد. خارج از مهلت رسمی، ثبت یا ویرایش فرم معمولاً ممکن نیست. ورود سامانه فقط از مسیر سازمان سنجش است:</p>
<ul>
<li><a href="site-entekhab-reshte.html">سایت انتخاب رشته (sanjesh.org)</a></li>
<li>در صورت نیاز: اعلام علاقه‌مندی دوره‌هایی مثل پیام‌نور / غیرانتفاعی طبق اطلاعیه همان سال</li>
<li>مسیر جدا برای <a href="azad-1405.html">انتخاب رشته دانشگاه آزاد</a></li>
</ul>
<div class="callout callout--tip"><strong>پیشنهاد بلوک</strong><p>پیش‌نویس اولویت‌ها را قبل از شلوغی سایت روی کاغذ آماده کنید؛ در ساعت‌های پایانی فقط وارد سامانه شوید و کدها را منتقل کنید.</p></div>""",
        ),
        (
            "smart",
            "چطور انتخاب رشته تجربی را هوشمندانه بچینیم؟",
            """<p>قبل از ثبت اولویت‌ها این چهار لایه را جدا کنید:</p>
<ol>
<li><strong>علاقه قطعی:</strong> رشته‌هایی که واقعاً می‌خواهید بخوانید (نه فقط پرستیژ اسم).</li>
<li><strong>شانس واقع‌بینانه:</strong> مقایسه رتبه/تراز و سهمیه با قبولی‌های تقریبی سال‌های قبل.</li>
<li><strong>شرایط رشته‌محل:</strong> روزانه/شبانه/پردیس، شهر، خوابگاه، شهریه، تعهد خدمت.</li>
<li><strong>لایه امن:</strong> گزینه‌هایی با شانس بالاتر در انتهای فرم تا فرم خالی نماند.</li>
</ol>
<p>از انتخاب صرفاً احساسی یا صرفاً رتبه‌محور پرهیز کنید. ترکیب علاقه + توانایی + آینده شغلی، رضایت بعد از قبولی را بالا می‌برد.</p>
<ul>
<li>تحلیل <a href="karname-avvalie-1405.html">کارنامه اولیه</a></li>
<li>برآورد حدودی با <a href="takhmin-rotbe.html">تخمین رتبه</a></li>
<li>مرتب‌سازی با <a href="narmafzar-entekhab-reshte.html">نرم‌افزار انتخاب رشته</a></li>
</ul>""",
        ),
        (
            "karname",
            "کارنامه ملاک عمل انتخاب رشته تجربی",
            """<p>کارنامه انتخاب رشته (کارنامه علمی / ملاک عمل) روی سایت سنجش منتشر می‌شود. برای تجربی معمولاً سه بخش کلیدی دارد:</p>
<ol>
<li><strong>هویت و سهمیه:</strong> سهمیه، استان بومی و اطلاعات فردی — در بومی‌گزینی و شانس برخی رشته‌محل‌ها اثر دارد.</li>
<li><strong>وضعیت مجاز بودن:</strong> نشان می‌دهد در کدام دوره‌ها (روزانه، نوبت دوم، فرهنگیان و …) مجازید. مجاز شدن در روزانه/فرهنگیان سخت‌گیرانه‌تر از بعضی دوره‌های دیگر است.</li>
<li><strong>عملکرد آزمون:</strong> درصد دروس، نمرات و نمره کل آزمون اختصاصی — پایه مقایسه علمی شما.</li>
</ol>
<p>کارنامه ملاک عمل انتخاب رشته ۱۴۰۵ حدود <strong>۱۲ مهر</strong> منتشر شد. بدون فهمیدن رتبه در سهمیه، رتبه کشوری و نمره کل، چینش فرم کور است. جزئیات بیشتر: <a href="karname-avvalie-1405.html">کارنامه اولیه کنکور</a>.</p>""",
        ),
        (
            "capacity",
            "ظرفیت و رتبه قبولی تجربی",
            """<p>ظرفیت دقیق هر سال با دفترچه همان سال قطعی می‌شود. جدول زیر بر اساس آمار دوره اخیر (نمونه منتشرشده برای درک مقیاس) است و باید با دفترچه ۱۴۰۵/سال جاری تطبیق داده شود:</p>
<table class="steps-table">
<thead><tr><th>دوره</th><th>ظرفیت نمونه (با آزمون و سوابق)</th></tr></thead>
<tbody>
<tr><td>روزانه</td><td>۴۰۸۹۳</td></tr>
<tr><td>نوبت دوم (شبانه)</td><td>۱۱۵۹</td></tr>
<tr><td>پردیس خودگردان و ظرفیت مازاد</td><td>۴۰۰۷</td></tr>
<tr><td>سهمیه مناطق محروم و مصوبات خاص</td><td>۲۸۰</td></tr>
<tr><td>دانشگاه فرهنگیان (ویژه آزاد)</td><td>۶۴۲۵</td></tr>
<tr><td>غیرانتفاعی</td><td>۴۳۵۶</td></tr>
<tr><td>پیام‌نور</td><td>۶۷۷۹</td></tr>
<tr><td>دانشگاه آزاد (با آزمون در دفترچه سراسری)</td><td>۱۳۳۹</td></tr>
<tr><td>ظرفیت مازاد آزاد</td><td>۲۹۳</td></tr>
<tr><td><strong>جمع تقریبی</strong></td><td><strong>۶۴۶۹۵</strong></td></tr>
</tbody>
</table>
<p>با این مقیاس، شانس قبولی در «جایی از مجموعه دوره‌ها» برای بخش قابل‌توجهی از شرکت‌کنندگان وجود دارد؛ اما شانس پزشکی/دندان/دارو در دانشگاه‌های پرتقاضا کاملاً متفاوت است. رشته‌های دارای تعهد خدمت وزارت بهداشت را فقط وقتی انتخاب کنید که متن تعهد را پذیرفته‌اید.</p>
<p>همیشه اول <strong>دفترچه انتخاب رشته تجربی</strong> همان سال را از سنجش دانلود کنید، بعد کدها را وارد فرم کنید.</p>""",
        ),
        (
            "sahmiye",
            "سهمیه‌ها در انتخاب رشته تجربی",
            """<p>پرجمعیت‌ترین سهمیه، <strong>سهمیه مناطق</strong> (منطقه ۱، ۲، ۳) است و معمولاً بیش از ۹۵٪ داوطلبان تجربی در آن قرار می‌گیرند. سهمیه‌های خاص مانند ایثارگران، جانبازان و بهیاری طبق ضوابط دفترچه اعمال می‌شود.</p>
<p>نکته مهم: سهمیه ایثارگری «رتبه شما را جادویی بهتر نمی‌کند»؛ سازوکار مقایسه با تراز/ظرفیت سهمیه است و می‌تواند شانس قبولی را نسبت به داوطلب آزاد در همان رشته‌محل تغییر دهد. جزئیات مشمولان را فقط از دفترچه همان سال بخوانید.</p>
<p>مرتبط: وضعیت بومی و سهمیه را در کارنامه خودتان خط‌به‌خط چک کنید، بعد اولویت‌ها را بسازید.</p>""",
        ),
        (
            "azad",
            "انتخاب رشته دانشگاه آزاد برای تجربی",
            """<p>برای بخش بزرگی از داوطلبان تجربی، انتخاب رشته آزاد به‌اندازه سراسری مهم است. بسیاری از رشته‌محل‌های پزشکی و پیراپزشکی آزاد همچنان از مسیر کنکور و کد دسترسی آزاد پذیرش می‌گیرند؛ پس اگر هدف‌تان این رشته‌هاست، معمولاً باید فرم آزاد را هم جدی بگیرید.</p>
<ul>
<li>انتخاب رشته آزاد اغلب <strong>هزینه جدا</strong> دارد.</li>
<li>سامانه و مهلت می‌تواند با سراسری فرق کند.</li>
<li>چینش اولویت آزاد را جدا از فرم سنجش بسازید.</li>
</ul>
<p>راهنماها: <a href="azad-1405.html">انتخاب رشته آزاد ۱۴۰۵</a> · <a href="azad-nahve.html">نحوه انتخاب رشته آزاد</a> · <a href="azad-shenase.html">شناسه انتخاب رشته آزاد</a>.</p>""",
        ),
        (
            "services",
            "چک‌لیست عملی قبل از ثبت فرم",
            """<p>به‌جای خدمات پراکنده، این مسیر را خودتان با بلوک جلو ببرید:</p>
<ul>
<li>تحلیل کارنامه اولیه و وضعیت مجاز بودن</li>
<li>دانلود دفترچه سراسری و آزاد</li>
<li>آنالیز شانس تقریبی و دسته‌بندی خوش‌بینانه / واقع‌بینانه / امن</li>
<li>بررسی ویژه فرهنگیان اگر در هدف‌تان هست</li>
<li>ثبت فرم سنجش + ذخیره رسید</li>
<li>ثبت فرم آزاد (در صورت نیاز) + کد پیگیری</li>
<li>ویرایش داخل مهلت در صورت اشتباه: <a href="virayesh-entekhab-reshte.html">ویرایش انتخاب رشته</a></li>
</ul>
<p>اگر رمز مای‌سنجش را فراموش کرده‌اید، فقط از بازیابی رسمی پورتال اقدام کنید — نه لینک‌های پیامکی ناشناس. ورود امن: <a href="site-sanjesh.html">سایت سازمان سنجش</a>.</p>""",
        ),
    ],
    faqs=[
        (
            "تکمیل فرم انتخاب رشته سراسری تجربی از چه سایتی است؟",
            "داوطلبان مجاز باید فرم را فقط از سایت سازمان سنجش به نشانی sanjesh.org و پورتال کاربری تکمیل کنند.",
        ),
        (
            "از دفترچه تجربی چند کد رشته‌محل می‌توان انتخاب کرد؟",
            "در دوره‌های اخیر حداکثر حدود ۱۵۰ کد رشته‌محل در فرم سراسری قابل ثبت بوده است؛ عدد قطعی را از دفترچه همان سال بخوانید.",
        ),
        (
            "آیا انتخاب رشته آزاد تجربی هزینه دارد؟",
            "معمولاً بله؛ انتخاب رشته دانشگاه آزاد با پرداخت هزینه اعلام‌شده در سامانه آزاد انجام می‌شود.",
        ),
        (
            "کارنامه ملاک عمل چه زمانی آمد؟",
            "برای ۱۴۰۵ حدود ۱۲ مهر منتشر شد؛ برای سال‌های بعد فقط اطلاعیه سنجش معتبر است.",
        ),
        (
            "سهمیه ایثارگران رتبه را بهتر می‌کند؟",
            "مستقیماً رتبه را عوض نمی‌کند؛ سازوکار مقایسه در سهمیه می‌تواند شانس قبولی را نسبت به ظرفیت همان سهمیه تغییر دهد.",
        ),
    ],
    related=[
        ("entekhab-reshte-1405.html", "انتخاب رشته عمومی"),
        ("karname-avvalie-1405.html", "کارنامه اولیه"),
        ("site-entekhab-reshte.html", "سایت انتخاب رشته"),
        ("azad-1405.html", "انتخاب رشته آزاد"),
        ("virayesh-entekhab-reshte.html", "ویرایش فرم"),
        ("takhmin-rotbe.html", "تخمین رتبه"),
    ],
    checklist=[
        "کارنامه ملاک عمل را ذخیره و بخش سهمیه/مجاز بودن را فهمیده‌ام",
        "دفترچه تجربی سراسری را دانلود کرده‌ام",
        "پیش‌نویس ۱۵۰ اولویت (علاقه / واقع‌بین / امن) آماده‌ است",
        "اگر هدف پزشکی آزاد دارم، هزینه و مهلت آزاد را چک کرده‌ام",
        "بعد از ثبت، رسید و کد رهگیری را ذخیره کرده‌ام",
    ],
)


def patch_mosahab_file() -> None:
    path = ROOT / "_mosahab_nav_v24.py"
    text = path.read_text(encoding="utf-8")
    needle = '("education/konkour/entekhab-reshte-1405.html", "انتخاب رشته ۱۴۰۵"),\n'
    insert = (
        needle
        + '            ("education/konkour/entekhab-reshte-tajrobi.html", "انتخاب رشته تجربی"),\n'
    )
    if "entekhab-reshte-tajrobi.html" not in text:
        text = text.replace(needle, insert, 1)
        path.write_text(text, encoding="utf-8")
        print("nav source updated")
    else:
        print("nav source already has tajrobi")


def patch_hub() -> None:
    path = ROOT / "education" / "konkour" / "index.html"
    html = path.read_text(encoding="utf-8")
    card = (
        '<li><a class="feed-card" href="entekhab-reshte-tajrobi.html">'
        '<div class="feed-card-body"><h2>انتخاب رشته تجربی ۱۴۰۵</h2>'
        "<p>کارنامه، ظرفیت، سهمیه، آزاد و چینش تا ۱۵۰ کد</p></div></a></li>"
    )
    if "entekhab-reshte-tajrobi.html" in html:
        print("hub already linked")
        return
    if "portal-seo-cluster" in html and "</ul>" in html:
        html = html.replace(
            '<li><a class="feed-card" href="entekhab-reshte-1405.html">',
            card + '\n            <li><a class="feed-card" href="entekhab-reshte-1405.html">',
            1,
        )
        path.write_text(html, encoding="utf-8")
        print("hub linked")
    else:
        print("warn: hub cluster not found")


def patch_general_entekhab() -> None:
    path = ROOT / "education" / "konkour" / "entekhab-reshte-1405.html"
    if not path.exists():
        return
    html = path.read_text(encoding="utf-8")
    note = (
        '<div class="callout callout--tip"><strong>ویژه تجربی</strong>'
        "<p>اگر گروه شما تجربی است، راهنمای اختصاصی "
        '<a href="entekhab-reshte-tajrobi.html">انتخاب رشته تجربی ۱۴۰۵</a> '
        "را برای کارنامه، ظرفیت و آزاد بخوانید.</p></div>"
    )
    if "entekhab-reshte-tajrobi.html" in html:
        print("entekhab page already points to tajrobi")
        return
    html = html.replace(
        '<h2 id="prepare">آماده‌سازی قبل از باز شدن فرم</h2>',
        note + '\n\n        <h2 id="prepare">آماده‌سازی قبل از باز شدن فرم</h2>',
        1,
    )
    path.write_text(html, encoding="utf-8")
    print("entekhab-1405 cross-link added")


def rebuild_search_and_sitemap() -> None:
    # reuse seo helpers
    seo.rebuild_search_index()
    seo.rebuild_sitemap()


def refresh_headers() -> None:
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


def bump() -> None:
    n = 0
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".html", ".js", ".css", ".json", ".md", ".py"}:
            continue
        if path.name.startswith("_gen_tajrobi") or path.name.startswith("_seo_boost"):
            continue
        text = path.read_text(encoding="utf-8")
        new = text.replace(f"?v={V_OLD}", f"?v={V_NEW}")
        if new != text:
            path.write_text(new, encoding="utf-8")
            n += 1
    print(f"cache -> v={V_NEW} in {n} files")


def main() -> None:
    patch_mosahab_file()
    # reload mosahab after file patch
    spec_m.loader.exec_module(mosahab)
    seo.extend_nav_categories()
    sync_nav_with_tajrobi()
    html = seo.build_page(**PAGE)
    # force v26 in built page assets
    html = html.replace("?v=25", f"?v={V_NEW}")
    out = ROOT / "education" / "konkour" / PAGE["slug"]
    out.write_text(html, encoding="utf-8")
    print("wrote", out.relative_to(ROOT))
    patch_hub()
    patch_general_entekhab()
    refresh_headers()
    rebuild_search_and_sitemap()
    bump()
    # rewrite page once more so header/cache consistent after bump+header refresh
    html = seo.build_page(**PAGE).replace("?v=25", f"?v={V_NEW}").replace("?v=24", f"?v={V_NEW}")
    # header from latest mosahab
    header = mosahab.build_header(Path("education/konkour") / PAGE["slug"])
    html2, _ = re.subn(
        r"<header class=\"site-header\">.*?</header>",
        header,
        html,
        count=1,
        flags=re.S,
    )
    html2 = html2.replace("?v=25", f"?v={V_NEW}")
    out.write_text(html2, encoding="utf-8")
    print("finalized tajrobi page")


if __name__ == "__main__":
    main()
