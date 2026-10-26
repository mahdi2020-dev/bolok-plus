# -*- coding: utf-8 -*-
"""Mosahab-inspired portal nav for Bolok (ink brand, not blue) · v24."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
V_OLD, V_NEW = "23", "24"

# Categories mirror mosahab's multi-dropdown portal pattern
CATEGORIES: list[tuple[str, str, list[tuple[str, str]]]] = [
    (
        "sabt",
        "ثبت نام کنکور",
        [
            ("education/konkour/index.html", "هاب کنکور سراسری"),
            ("education/konkour/sabt-nam.html", "ثبت نام کنکور سراسری"),
            ("education/konkour/zaman-sabt-nam.html", "زمان ثبت نام"),
            ("education/konkour/nahve-sabt-nam.html", "نحوه ثبت نام"),
            ("education/konkour/sharayet-ekhtesasi.html", "شرایط اختصاصی"),
        ],
    ),
    (
        "entekhab",
        "انتخاب رشته",
        [
            ("education/konkour/entekhab-reshte-1405.html", "انتخاب رشته ۱۴۰۵"),
            ("education/konkour/elam-natayej-1405.html", "اعلام نتایج نهایی"),
            ("education/konkour/eslahiye-daftarche.html", "اصلاحیه دفترچه"),
            ("education/konkour/narmafzar-entekhab-reshte.html", "نرم‌افزار انتخاب رشته"),
            ("education/konkour/behtarin-reshte-ensani.html", "رشته‌های انسانی"),
        ],
    ),
    (
        "moshavere",
        "مشاوره کنکور",
        [
            ("education/konkour/moshavere/index.html", "مشاوره کنکور سراسری"),
            ("education/konkour/barname-1406.html", "برنامه‌ریزی ۱۴۰۶"),
            ("education/konkour/tasir-moadel-1405.html", "تاثیر معدل"),
            ("education/konkour/shahriye-pardis.html", "شهریه پردیس"),
            ("education/konkour/rad-medu.html", "راد مدیو"),
            ("education/konkour/maghalat.html", "سایر مقالات"),
        ],
    ),
    (
        "gheyr",
        "غیرانتفاعی",
        [
            ("education/konkour/gheyr-entefaee/index.html", "بدون‌آزمون غیرانتفاعی"),
            ("education/konkour/gheyr-entefaee/sabt-nam-1405.html", "ثبت‌نام ۱۴۰۵"),
            ("education/konkour/gheyr-entefaee/list-reshteha.html", "لیست رشته‌ها"),
            ("education/konkour/gheyr-entefaee/shahriye-1405-1406.html", "شهریه ۱۴۰۵"),
            ("education/konkour/gheyr-entefaee/zaman-sabt-nam-1405.html", "زمان ثبت‌نام"),
        ],
    ),
    (
        "arshad",
        "کارشناسی ارشد",
        [
            ("education/konkour/arshad/index.html", "مشاوره ارشد"),
            ("education/konkour/arshad/soalat-1405.html", "سوالات ارشد ۱۴۰۵"),
            ("education/konkour/arshad/proposal-arshad.html", "پروپوزال ارشد"),
            ("education/konkour/arshad/pasokhname-1405.html", "پاسخنامه ۱۴۰۵"),
            ("education/konkour/arshad/page-2.html", "بیشتر…"),
        ],
    ),
    (
        "azad",
        "دانشگاه آزاد",
        [
            ("education/konkour/azad-1405.html", "انتخاب رشته آزاد ۱۴۰۵"),
            ("education/konkour/azad-nahve.html", "نحوه انتخاب رشته آزاد"),
            ("education/konkour/azad-shenase.html", "شناسه انتخاب رشته"),
        ],
    ),
]


def rel_prefix(page: Path) -> str:
    depth = len(page.parts) - 1
    return "../" * depth


def href(prefix: str, target: str) -> str:
    if target.startswith("#") or target.startswith("http"):
        return target
    return f"{prefix}{target}"


def build_nav(prefix: str, *, home_hash: bool = False) -> str:
    items = []
    for key, label, links in CATEGORIES:
        links_html = "\n".join(
            f'            <a href="{href(prefix, u)}" role="menuitem">{t}</a>' for u, t in links
        )
        # first item in category can be hub; trigger goes to first link
        trigger_href = href(prefix, links[0][0])
        items.append(
            f"""        <div class="nav-item--has-sub" data-nav-item data-nav-key="{key}">
          <a class="nav-trigger" href="{trigger_href}" data-nav-trigger aria-expanded="false" aria-haspopup="true">
            {label} <span class="nav-trigger-caret" aria-hidden="true"></span>
          </a>
          <div class="nav-dropdown" role="menu">
{links_html}
          </div>
        </div>"""
        )
    about = href(prefix, "about.html")
    showcase = f"{prefix}index.html#showcase" if not home_hash else "#showcase"
    items.append(f'        <a class="nav-link" href="{showcase}">معرفی</a>')
    items.append(f'        <a class="nav-link" href="{about}">درباره</a>')
    return "\n".join(items)


def build_drawer(prefix: str, *, home_hash: bool = False) -> str:
    blocks = [
        f'      <a href="{href(prefix, "search.html")}">جستجوی مطالب</a>',
    ]
    for key, label, links in CATEGORIES:
        links_html = "\n".join(
            f'          <a href="{href(prefix, u)}">{t}</a>' for u, t in links
        )
        blocks.append(
            f"""      <div class="drawer-sub" data-drawer-sub>
        <button class="drawer-sub-toggle" type="button" data-drawer-sub-toggle aria-expanded="false">
          {label} <span aria-hidden="true">+</span>
        </button>
        <div class="drawer-sub-panel">
{links_html}
        </div>
      </div>"""
        )
    download = "#download" if home_hash else f"{prefix}index.html#download"
    showcase = "#showcase" if home_hash else f"{prefix}index.html#showcase"
    blocks.extend(
        [
            f'      <a href="{showcase}">معرفی اپ</a>',
            f'      <a href="{href(prefix, "about.html")}">درباره بلوک</a>',
            f'      <a href="{href(prefix, "terms.html")}">شرایط استفاده</a>',
            f'      <a href="{href(prefix, "privacy.html")}">حریم خصوصی</a>',
            f'      <a href="{download}">دانلود اپ بلوک</a>',
        ]
    )
    return "\n".join(blocks)


def build_header(page: Path) -> str:
    prefix = rel_prefix(page)
    home = page.name == "index.html" and page.parent == ROOT
    logo = href(prefix, f"assets/bolok-logo.svg?v={V_NEW}")
    brand_href = "index.html" if home else href(prefix, "index.html")
    search = href(prefix, "search.html")
    download = "#download" if home else f"{prefix}index.html#download"
    nav = build_nav(prefix, home_hash=home)
    drawer = build_drawer(prefix, home_hash=home)
    return f"""  <header class="site-header">
    <div class="container inner">
      <a class="brand" href="{brand_href}">
        <img class="brand-logo" src="{logo}" alt="بلوک" width="36" height="36" />
        <span class="brand-text">
          <strong>بلوک</strong>
          <small>برنامه‌ریز مطالعه</small>
        </span>
      </a>

      <nav class="nav" aria-label="اصلی">
{nav}
      </nav>

      <div class="header-actions">
        <a class="header-search" href="{search}" aria-label="جستجو در مطالب">
          <span class="header-search-icon" aria-hidden="true"></span>
          <span class="header-search-label">جستجو…</span>
        </a>
        <a class="btn btn-primary header-cta" href="{download}">دانلود اپ</a>
        <button class="nav-toggle" type="button" data-nav-toggle aria-label="منو"><span></span></button>
      </div>
    </div>
    <div class="nav-drawer" data-nav-drawer>
{drawer}
    </div>
  </header>"""


CSS_APPEND = r"""

/* ——— Mosahab-style portal nav (Bolok ink) · v24 ——— */
.site-header {
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(16px) saturate(1.1);
  -webkit-backdrop-filter: blur(16px) saturate(1.1);
}

.site-header.is-scrolled {
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 8px 28px rgba(12, 14, 18, 0.07);
}

.brand {
  gap: 0.55rem;
  align-items: center;
}

.brand-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.05rem;
  line-height: 1.15;
  text-align: right;
}

.brand-text strong {
  font-size: 1.05rem;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.brand-text small {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--muted);
  letter-spacing: 0;
}

.nav {
  gap: 0.2rem;
  font-size: 0.84rem;
  font-weight: 700;
}

.nav > .nav-link {
  position: relative;
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  color: var(--ink-soft);
  white-space: nowrap;
  transition: background 0.18s ease, color 0.18s ease;
}

.nav > .nav-link::after {
  display: none;
}

.nav > .nav-link:hover {
  color: var(--ink);
  background: rgba(12, 14, 18, 0.05);
}

.nav-trigger {
  padding: 0.45rem 0.7rem;
  border-radius: 8px;
  min-height: 0;
  gap: 0.4rem;
  color: var(--ink-soft);
  transition: background 0.18s ease, color 0.18s ease;
}

.nav-trigger::after {
  display: none !important;
}

.nav-item--has-sub:hover > .nav-trigger,
.nav-item--has-sub.is-open > .nav-trigger,
.nav-item--has-sub:focus-within > .nav-trigger {
  background: #0c0e12;
  color: #fff;
}

.nav-item--has-sub:hover .nav-trigger-caret,
.nav-item--has-sub.is-open .nav-trigger-caret {
  opacity: 1;
  border-color: #fff;
}

.nav-trigger-caret {
  width: 0.38rem;
  height: 0.38rem;
  opacity: 0.55;
}

/* Simple vertical dropdown (mosahab pattern) */
.nav-dropdown {
  position: absolute;
  top: calc(100% + 0.35rem);
  inset-inline-start: 0;
  inset-inline-end: auto;
  left: auto;
  right: auto;
  transform: none;
  width: max(220px, 100%);
  min-width: 230px;
  max-width: min(320px, calc(100vw - 2rem));
  padding: 0.25rem 0;
  border-radius: 10px;
  background: #fff;
  border: 1px solid rgba(12, 14, 18, 0.1);
  box-shadow: 0 16px 40px rgba(12, 14, 18, 0.14);
  display: none;
  z-index: 70;
  opacity: 1;
}

.nav-item--has-sub.is-open .nav-dropdown,
.nav-item--has-sub:hover .nav-dropdown,
.nav-item--has-sub:focus-within .nav-dropdown {
  display: block;
  animation: drawer-in 0.18s var(--ease-out);
  grid-template-columns: none;
}

.nav-dropdown a {
  display: block;
  padding: 0.72rem 1rem;
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--ink-soft);
  border-bottom: 1px solid rgba(12, 14, 18, 0.06);
  text-align: right;
  transition: color 0.15s ease, background 0.15s ease, padding-inline 0.15s ease;
}

.nav-dropdown a:last-child {
  border-bottom: 0;
}

.nav-dropdown a:hover,
.nav-dropdown a:focus-visible {
  color: var(--ink);
  background: rgba(12, 14, 18, 0.035);
  padding-inline-start: 1.15rem;
}

/* Hide legacy mega panel if any leftover markup */
.nav-panel {
  display: none !important;
}

.header-search {
  min-width: 148px;
  gap: 0.45rem;
  justify-content: flex-start;
  padding: 0.4rem 0.75rem;
  background: #f3f4f6;
  border-color: transparent;
  color: var(--muted);
  border-radius: 10px;
}

.header-search:hover {
  background: #eceef2;
  color: var(--ink-soft);
  border-color: transparent;
  box-shadow: none;
  transform: none;
}

.header-search-icon {
  width: 0.95rem;
  height: 0.95rem;
  border: 1.7px solid currentColor;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
  opacity: 0.75;
}

.header-search-icon::after {
  content: "";
  position: absolute;
  width: 0.4rem;
  height: 1.7px;
  background: currentColor;
  inset-inline-start: 0.72rem;
  top: 0.78rem;
  transform: rotate(45deg);
  border-radius: 1px;
}

.header-search-label {
  font-size: 0.82rem;
  font-weight: 700;
}

@media (max-width: 759px) {
  .brand-text small {
    display: none;
  }
  .header-search {
    min-width: 44px;
    width: 44px;
    padding: 0;
    justify-content: center;
  }
  .header-search-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
}

@media (min-width: 760px) and (max-width: 1100px) {
  .nav {
    gap: 0;
    font-size: 0.78rem;
  }
  .nav-trigger,
  .nav > .nav-link {
    padding: 0.4rem 0.45rem;
  }
  .header-search {
    min-width: 120px;
  }
  .header-search-label {
    font-size: 0.78rem;
  }
  .brand-text small {
    display: none;
  }
}

@media (min-width: 1101px) {
  .nav {
    gap: 0.15rem;
    font-size: 0.86rem;
  }
}
"""


JS_NAV_OLD = """  // Desktop education submenu (hover/CSS + click toggle; anchor may scroll to #education)
  const eduNav = document.querySelector("[data-edu-nav]");
  const eduTrigger = eduNav?.querySelector("[data-edu-trigger]");
  const closeEduNav = () => {
    if (!eduNav || !eduTrigger) return;
    eduNav.classList.remove("is-open");
    eduTrigger.setAttribute("aria-expanded", "false");
  };
  if (eduNav && eduTrigger) {
    eduTrigger.addEventListener("click", (e) => {
      const href = eduTrigger.getAttribute("href") || "";
      const isHash = href.startsWith("#");
      const desktop = window.matchMedia("(min-width: 760px)").matches;
      // On desktop, allow hash navigation; panel opens via :hover
      if (desktop && isHash) {
        eduNav.classList.remove("is-open");
        eduTrigger.setAttribute("aria-expanded", "false");
        return;
      }
      e.preventDefault();
      const open = !eduNav.classList.contains("is-open");
      eduNav.classList.toggle("is-open", open);
      eduTrigger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", (e) => {
      if (!eduNav.contains(e.target)) closeEduNav();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeEduNav();
    });
  }"""

JS_NAV_NEW = """  // Desktop category dropdowns (mosahab-style; hover on fine pointer, click toggle)
  const navItems = Array.from(document.querySelectorAll("[data-nav-item]"));
  const closeAllNav = () => {
    navItems.forEach((item) => {
      item.classList.remove("is-open");
      item.querySelector("[data-nav-trigger]")?.setAttribute("aria-expanded", "false");
    });
  };
  navItems.forEach((item) => {
    const trigger = item.querySelector("[data-nav-trigger]");
    if (!trigger) return;
    trigger.addEventListener("click", (e) => {
      const desktop = window.matchMedia("(min-width: 760px)").matches;
      const fine = window.matchMedia("(pointer: fine)").matches;
      // Desktop + mouse: let CSS :hover open the menu; allow navigation
      if (desktop && fine) return;
      e.preventDefault();
      const open = !item.classList.contains("is-open");
      closeAllNav();
      item.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  document.addEventListener("click", (e) => {
    if (!navItems.some((item) => item.contains(e.target))) closeAllNav();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllNav();
  });"""


def patch_css() -> None:
    path = ROOT / "styles.css"
    css = path.read_text(encoding="utf-8")
    if "Mosahab-style portal nav" in css:
        # replace previous append block if re-run
        css = re.sub(
            r"\n/\* ——— Mosahab-style portal nav.*?$",
            "",
            css,
            flags=re.S,
        )
    css = css.rstrip() + CSS_APPEND + "\n"
    path.write_text(css, encoding="utf-8")
    print("styles.css: mosahab nav appended")


def patch_js() -> None:
    path = ROOT / "app.js"
    js = path.read_text(encoding="utf-8")
    if "data-nav-item" in js and "closeAllNav" in js:
        print("app.js already has multi-nav")
        return
    if JS_NAV_OLD in js:
        js = js.replace(JS_NAV_OLD, JS_NAV_NEW)
    elif "data-edu-nav" in js:
        # already partially changed — force replace edu block via regex
        js = re.sub(
            r"  // Desktop education submenu.*?  \}\n\n  // Mobile drawer",
            JS_NAV_NEW + "\n\n  // Mobile drawer",
            js,
            count=1,
            flags=re.S,
        )
    else:
        # insert before mobile drawer
        js = js.replace(
            "  // Mobile drawer accordion for education",
            JS_NAV_NEW + "\n\n  // Mobile drawer accordion for education",
            1,
        )
    path.write_text(js, encoding="utf-8")
    print("app.js patched")


def patch_headers() -> int:
    n = 0
    for path in ROOT.rglob("*.html"):
        if "_deploy" in path.parts or path.name.startswith("_"):
            continue
        html = path.read_text(encoding="utf-8")
        rel = path.relative_to(ROOT)
        new_header = build_header(rel)
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
        else:
            print("warn: no header in", rel)
    print(f"headers replaced in {n} pages")
    return n


def bump_cache() -> None:
    n = 0
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".html", ".js", ".css", ".md", ".json", ".py"}:
            continue
        if path.name.startswith("_mosahab") or path.name.startswith("_header"):
            continue
        text = path.read_text(encoding="utf-8")
        new = text.replace(f"?v={V_OLD}", f"?v={V_NEW}")
        if new != text:
            path.write_text(new, encoding="utf-8")
            n += 1
    print(f"cache -> v={V_NEW} in {n} files")


def main() -> None:
    patch_css()
    patch_js()
    patch_headers()
    bump_cache()


if __name__ == "__main__":
    main()
