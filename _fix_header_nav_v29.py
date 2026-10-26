"""Collapse crowded top nav: keep 3 primaries + بیشتر + معرفی; fix relative prefixes."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def prefix_for(page: Path) -> str:
    rel = page.relative_to(ROOT)
    depth = len(rel.parts) - 1
    return "../" * depth


def build_nav(p: str) -> str:
    # p is path prefix to site root, e.g. "" or "../../"
    return f"""      <nav class="nav" aria-label="اصلی">
        <div class="nav-item--has-sub" data-nav-item data-nav-key="sabt">
          <a class="nav-trigger" href="{p}education/konkour/index.html" data-nav-trigger aria-expanded="false" aria-haspopup="true">
            ثبت نام کنکور <span class="nav-trigger-caret" aria-hidden="true"></span>
          </a>
          <div class="nav-dropdown" role="menu">
            <a href="{p}education/konkour/index.html" role="menuitem">هاب کنکور سراسری</a>
            <a href="{p}education/konkour/sabt-nam.html" role="menuitem">ثبت نام کنکور سراسری</a>
            <a href="{p}education/konkour/zaman-sabt-nam.html" role="menuitem">زمان ثبت نام</a>
            <a href="{p}education/konkour/nahve-sabt-nam.html" role="menuitem">نحوه ثبت نام</a>
            <a href="{p}education/konkour/sharayet-ekhtesasi.html" role="menuitem">شرایط اختصاصی</a>
            <a href="{p}education/konkour/site-sanjesh.html" role="menuitem">سایت سازمان سنجش</a>
            <a href="{p}education/konkour/kart-vorod-jalase.html" role="menuitem">کارت ورود به جلسه</a>
            <a href="{p}education/konkour/taghirat-konkour-1405.html" role="menuitem">تغییرات کنکور ۱۴۰۵</a>
          </div>
        </div>
        <div class="nav-item--has-sub" data-nav-item data-nav-key="entekhab">
          <a class="nav-trigger" href="{p}education/konkour/entekhab-reshte-1405.html" data-nav-trigger aria-expanded="false" aria-haspopup="true">
            انتخاب رشته <span class="nav-trigger-caret" aria-hidden="true"></span>
          </a>
          <div class="nav-dropdown" role="menu">
            <a href="{p}education/konkour/entekhab-reshte-1405.html" role="menuitem">انتخاب رشته ۱۴۰۵</a>
            <a href="{p}education/konkour/entekhab-reshte-tajrobi.html" role="menuitem">انتخاب رشته تجربی</a>
            <a href="{p}education/konkour/elam-natayej-1405.html" role="menuitem">اعلام نتایج نهایی</a>
            <a href="{p}education/konkour/eslahiye-daftarche.html" role="menuitem">اصلاحیه دفترچه</a>
            <a href="{p}education/konkour/narmafzar-entekhab-reshte.html" role="menuitem">نرم‌افزار انتخاب رشته</a>
            <a href="{p}education/konkour/behtarin-reshte-ensani.html" role="menuitem">رشته‌های انسانی</a>
            <a href="{p}education/konkour/site-entekhab-reshte.html" role="menuitem">سایت انتخاب رشته</a>
            <a href="{p}education/konkour/virayesh-entekhab-reshte.html" role="menuitem">ویرایش انتخاب رشته</a>
            <a href="{p}education/konkour/karname-avvalie-1405.html" role="menuitem">کارنامه اولیه</a>
          </div>
        </div>
        <div class="nav-item--has-sub" data-nav-item data-nav-key="moshavere">
          <a class="nav-trigger" href="{p}education/konkour/moshavere/index.html" data-nav-trigger aria-expanded="false" aria-haspopup="true">
            مشاوره <span class="nav-trigger-caret" aria-hidden="true"></span>
          </a>
          <div class="nav-dropdown" role="menu">
            <a href="{p}education/konkour/moshavere/index.html" role="menuitem">مشاوره کنکور سراسری</a>
            <a href="{p}education/konkour/barname-1406.html" role="menuitem">برنامه‌ریزی ۱۴۰۶</a>
            <a href="{p}education/konkour/tasir-moadel-1405.html" role="menuitem">تاثیر معدل</a>
            <a href="{p}education/konkour/shahriye-pardis.html" role="menuitem">شهریه پردیس</a>
            <a href="{p}education/konkour/rad-medu.html" role="menuitem">راد مدیو</a>
            <a href="{p}education/konkour/maghalat.html" role="menuitem">سایر مقالات</a>
            <a href="{p}education/konkour/termim-moadel-1405.html" role="menuitem">ترمیم معدل ۱۴۰۵</a>
            <a href="{p}education/konkour/takhmin-rotbe.html" role="menuitem">تخمین رتبه</a>
            <a href="{p}education/konkour/hazfiyat-konkour-1405.html" role="menuitem">حذفیات کنکور ۱۴۰۵</a>
          </div>
        </div>
        <div class="nav-item--has-sub nav-item--more" data-nav-item data-nav-key="more">
          <a class="nav-trigger" href="{p}education/index.html" data-nav-trigger aria-expanded="false" aria-haspopup="true">
            بیشتر <span class="nav-trigger-caret" aria-hidden="true"></span>
          </a>
          <div class="nav-dropdown nav-dropdown--more" role="menu">
            <a href="{p}education/index.html" role="menuitem">همه مطالب آموزشی</a>
            <a href="{p}education/konkour/gheyr-entefaee/index.html" role="menuitem">غیرانتفاعی بدون‌آزمون</a>
            <a href="{p}education/konkour/arshad/index.html" role="menuitem">کارشناسی ارشد</a>
            <a href="{p}education/konkour/azad-1405.html" role="menuitem">دانشگاه آزاد</a>
            <a href="{p}education/konkour/maghalat.html" role="menuitem">سایر مقالات کنکور</a>
          </div>
        </div>
        <a class="nav-link" href="{p}index.html#showcase">معرفی</a>
      </nav>"""


def build_actions(p: str) -> str:
    return f"""      <div class="header-actions">
        <a class="header-search" href="{p}search.html" aria-label="جستجو در مطالب">
          <span class="header-search-icon" aria-hidden="true"></span>
          <span class="header-search-label">جستجو</span>
        </a>
        <a class="btn btn-primary header-cta" href="{p}index.html#download">دانلود اپ</a>
        <button class="nav-toggle" type="button" data-nav-toggle aria-label="منو"><span></span></button>
      </div>"""


NAV_RE = re.compile(
    r"<nav class=\"nav\" aria-label=\"اصلی\">.*?</nav>",
    re.S,
)
ACTIONS_RE = re.compile(
    r"<div class=\"header-actions\">.*?</div>\s*(?=<div class=\"nav-drawer\")",
    re.S,
)


def process(page: Path) -> bool:
    text = page.read_text(encoding="utf-8")
    if 'aria-label="اصلی"' not in text:
        return False
    p = prefix_for(page)
    new_text, n1 = NAV_RE.subn(build_nav(p), text, count=1)
    new_text, n2 = ACTIONS_RE.subn(build_actions(p) + "\n", new_text, count=1)
    if n1 == 0:
        return False
    if new_text != text:
        page.write_text(new_text, encoding="utf-8")
        return True
    return False


def main() -> None:
    changed = 0
    for page in ROOT.rglob("*.html"):
        if "_deploy_proof" in page.parts:
            continue
        if process(page):
            changed += 1
            print("updated", page.relative_to(ROOT))
    print(f"done changed={changed}")


if __name__ == "__main__":
    main()
