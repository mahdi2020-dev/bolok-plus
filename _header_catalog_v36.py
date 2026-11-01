# -*- coding: utf-8 -*-
"""Paytakht-inspired header — 4 nav items + grade-first catalog (v40)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
V_CSS = "45"
ASSET_V = "45"
SUPPORT_EMAIL = "sanjaporg@gmail.com"


def prefix_for(page: Path) -> str:
    rel = page.relative_to(ROOT)
    depth = len(rel.parts) - 1
    return "../" * depth


def build_header(p: str, *, home_hash: bool = False) -> str:
    showcase = "#showcase" if home_hash else f"{p}index.html#showcase"
    return f"""  <header class="site-header site-header--v36" data-site-root="{p}">
    <div class="container header-shell">
      <div class="header-top">
        <a class="header-search-wide" href="{p}search.html" aria-label="جستجو در مطالب">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16.5 16.5 4 4"/></svg>
          <span>جستجو کنید...</span>
        </a>
        <a class="brand" href="{p}index.html">
          <img class="brand-logo" src="{p}assets/bolok-logo.svg?v={ASSET_V}" alt="بلوک" width="40" height="40" />
          <span class="brand-text">
            <strong>بلوک</strong>
            <small>برنامه‌ریز مطالعه</small>
          </span>
        </a>
        <div class="header-top-actions">
          <a class="header-phone" href="mailto:{SUPPORT_EMAIL}" title="پشتیبانی">
            <span class="header-phone-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6.5 4.5h3l1.2 3.2-1.8 1.8a12 12 0 0 0 5.6 5.6l1.8-1.8 3.2 1.2v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 6.7 2 2 0 0 1 6.5 4.5z"/></svg>
            </span>
            <span class="header-phone-text">
              <strong>پشتیبانی بلوک</strong>
              <small>{SUPPORT_EMAIL}</small>
            </span>
          </a>
          <a class="header-icon-btn header-search-compact" href="{p}search.html" aria-label="جستجو" title="جستجو">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16.5 16.5 4 4"/></svg>
          </a>
          <a class="header-icon-btn" href="{p}about.html" aria-label="درباره ما" title="درباره ما">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="8" r="3.4"/><path d="M5.2 19.2c1.6-3.2 4-4.7 6.8-4.7s5.2 1.5 6.8 4.7"/></svg>
          </a>
          <a class="header-icon-btn header-icon-btn--accent" href="#download" data-download-open aria-label="دانلود اپ" title="دانلود اپ">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v11"/><path d="m7.5 9.5 4.5 4.5 4.5-4.5"/><path d="M5 20h14"/></svg>
          </a>
        </div>
      </div>
      <div class="header-bottom">
        <nav class="header-links header-links--main" aria-label="اصلی">
          <button type="button" class="nav-link-btn" data-catalog-open aria-expanded="false" aria-controls="catalog-panel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/></svg>
            بانک منابع
          </button>
          <div class="nav-item--has-sub header-consult" data-nav-item data-consult>
            <button type="button" class="nav-link-btn" data-nav-trigger data-consult-toggle aria-expanded="false" aria-haspopup="true">
              مشاوره <span class="nav-trigger-caret" aria-hidden="true"></span>
            </button>
            <div class="nav-dropdown nav-dropdown--consult" role="menu">
              <a href="{p}education/consult/psychology/index.html" role="menuitem">روانشناسی</a>
              <a href="{p}education/consult/academic/index.html" role="menuitem">تحصیلی</a>
            </div>
          </div>
          <a href="{showcase}">معرفی ما</a>
          <a href="{p}about.html">درباره ما</a>
        </nav>
        <div class="header-announce" data-announce>
          <button type="button" class="header-announce-btn" data-announce-toggle aria-expanded="false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M7 10a5 5 0 0 1 10 0c0 4 1.5 5.5 1.5 5.5H5.5S7 14 7 10z"/><path d="M10 18a2 2 0 0 0 4 0"/></svg>
            آخرین اطلاعیه‌ها
          </button>
          <div class="announce-panel" data-announce-panel hidden>
            <a class="announce-item" href="{p}resources/index.html">
              <span class="announce-dot" aria-hidden="true"></span>
              <span class="announce-body">
                <strong>بانک منابع کمک‌آموزشی</strong>
                <em>با انتخاب پایه، منابع آماده اپ بلوک را ببینید.</em>
                <small>هم‌اکنون فعال</small>
              </span>
            </a>
            <a class="announce-item" href="#download" data-download-open>
              <span class="announce-dot" aria-hidden="true"></span>
              <span class="announce-body">
                <strong>دانلود اپ بلوک</strong>
                <em>برنامه روزانه را بلوکی بچین و مطالعه واقعی را ثبت کن.</em>
                <small>اندروید</small>
              </span>
            </a>
          </div>
        </div>
        <button class="nav-toggle" type="button" data-nav-toggle aria-label="منو"><span></span></button>
        <div class="nav-drawer" data-nav-drawer>
          <button type="button" class="drawer-catalog-btn" data-catalog-open>بانک منابع · دسته‌بندی</button>
          <div class="drawer-sub" data-drawer-sub>
            <button class="drawer-sub-toggle" type="button" data-drawer-sub-toggle aria-expanded="false">
              مشاوره <span aria-hidden="true">+</span>
            </button>
            <div class="drawer-sub-panel">
              <a href="{p}education/consult/psychology/index.html">روانشناسی</a>
              <a href="{p}education/consult/academic/index.html">تحصیلی</a>
            </div>
          </div>
          <a href="{showcase}">معرفی ما</a>
          <a href="{p}about.html">درباره ما</a>
          <a href="{p}resources/index.html">هاب بانک منابع</a>
          <a href="{p}search.html">جستجو</a>
          <a href="{p}terms.html">شرایط استفاده</a>
          <a href="{p}privacy.html">حریم خصوصی</a>
          <a class="drawer-cta" href="#download" data-download-open>دانلود اپ بلوک</a>
        </div>
      </div>
    </div>
  </header>
  <div class="catalog-overlay" data-catalog-overlay></div>
  <aside class="catalog-panel" id="catalog-panel" data-catalog-panel aria-hidden="true">
    <div class="catalog-panel-head">
      <button type="button" data-catalog-close aria-label="بستن" class="catalog-x">×</button>
      <h2 data-catalog-title>بانک منابع</h2>
      <button type="button" data-catalog-back aria-label="بازگشت" class="catalog-back" hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 5l-7 7 7 7"/></svg>
      </button>
    </div>
    <div data-catalog-stack>
      <ul class="catalog-list" data-catalog-list>
        <li class="cat-empty">در حال آماده‌سازی…</li>
      </ul>
    </div>
  </aside>
"""


HEADER_RE = re.compile(
    r"<header class=\"site-header\".*?</header>",
    re.S,
)

OVERLAY_RE = re.compile(
    r"\s*<div class=\"catalog-overlay\"[^>]*>.*?</div>\s*"
    r"<aside class=\"catalog-panel\"[^>]*>.*?</aside>",
    re.S,
)

SHELL_RE = re.compile(
    r"<header class=\"site-header(?: site-header--v36)?\".*?</header>"
    r"(?:\s*<div class=\"catalog-overlay\"[^>]*>.*?</div>\s*"
    r"<aside class=\"catalog-panel\"[^>]*>.*?</aside>)?",
    re.S,
)


def ensure_scripts(html: str, p: str) -> str:
    html = re.sub(r"styles\.css\?v=\d+", f"styles.css?v={V_CSS}", html)
    html = re.sub(r"app\.js\?v=\d+", f"app.js?v={V_CSS}", html)
    html = re.sub(r"bolok-logo\.svg\?v=\d+", f"bolok-logo.svg?v={ASSET_V}", html)
    html = re.sub(r"bolok-logo\.png\?v=\d+", f"bolok-logo.png?v={ASSET_V}", html)
    html = re.sub(r"site-api\.js\?v=\d+", f"site-api.js?v={V_CSS}", html)
    html = re.sub(r"catalog-menu\.js\?v=\d+", f"catalog-menu.js?v={V_CSS}", html)
    html = re.sub(r"download-menu\.js\?v=\d+", f"download-menu.js?v={V_CSS}", html)
    html = re.sub(r"page-render\.js\?v=\d+", f"page-render.js?v={V_CSS}", html)
    html = re.sub(r"resources\.js\?v=\d+", f"resources.js?v={V_CSS}", html)
    html = re.sub(r"comments\.js\?v=\d+", f"comments.js?v={V_CSS}", html)

    core_inject = (
        f'  <script src="{p}site-api.js?v={V_CSS}" defer></script>\n'
        f'  <script src="{p}catalog-menu.js?v={V_CSS}" defer></script>\n'
        f'  <script src="{p}download-menu.js?v={V_CSS}" defer></script>\n'
    )
    if "site-api.js" not in html:
        if re.search(r"<script[^>]+app\.js", html):
            html = re.sub(
                r"(<script[^>]+app\.js[^>]*></script>)",
                core_inject + r"\1",
                html,
                count=1,
            )
        else:
            html = html.replace("</head>", core_inject + "</head>", 1)
    elif "download-menu.js" not in html:
        dl = f'  <script src="{p}download-menu.js?v={V_CSS}" defer></script>\n'
        if "catalog-menu.js" in html:
            html = re.sub(
                r"(<script[^>]+catalog-menu\.js[^>]*></script>\s*)",
                r"\1" + dl,
                html,
                count=1,
            )
        elif re.search(r"<script[^>]+app\.js", html):
            html = re.sub(
                r"(<script[^>]+app\.js[^>]*></script>)",
                dl + r"\1",
                html,
                count=1,
            )
        else:
            html = html.replace("</body>", dl + "</body>", 1)
    return html


def patch_download_triggers(html: str) -> str:
    """Mark common download CTAs outside the header shell."""
    html = re.sub(
        r'<a\b([^>]*href=["\'][^"\']*#download["\'][^>]*)>',
        lambda m: (
            f"<a{m.group(1)}>"
            if "data-download-open" in m.group(1)
            else f'<a{m.group(1)} data-download-open>'
        ),
        html,
    )
    html = re.sub(
        r'<a\b([^>]*class=["\'][^"\']*mobile-download[^"\']*["\'][^>]*)>',
        lambda m: (
            f"<a{m.group(1)}>"
            if "data-download-open" in m.group(1)
            else f'<a{m.group(1)} data-download-open>'
        ),
        html,
    )
    return html


def patch_support_email(html: str) -> str:
    return html.replace("bolokadmin@gmail.com", SUPPORT_EMAIL)


def patch_file(page: Path) -> bool:
    text = page.read_text(encoding="utf-8")
    if 'class="site-header"' not in text and "site-header--v36" not in text:
        # Still replace email / scripts on non-header pages if needed
        text2 = patch_support_email(text)
        text2 = patch_download_triggers(text2)
        if text2 != text:
            page.write_text(text2, encoding="utf-8", newline="\n")
            return True
        return False
    p = prefix_for(page)
    home_hash = page.name == "index.html" and page.parent == ROOT
    new_header = build_header(p, home_hash=home_hash).rstrip() + "\n"
    if SHELL_RE.search(text):
        text2 = SHELL_RE.sub(new_header, text, count=1)
    elif HEADER_RE.search(text):
        text2 = HEADER_RE.sub(new_header.rstrip(), text, count=1)
        # Drop orphaned catalog shell if header-only replace left a duplicate
        text2 = OVERLAY_RE.sub("\n", text2, count=1)
    else:
        return False
    text2 = ensure_scripts(text2, p)
    text2 = patch_download_triggers(text2)
    text2 = patch_support_email(text2)
    if text2 != text:
        page.write_text(text2, encoding="utf-8", newline="\n")
        return True
    return False


def main() -> None:
    changed = 0
    errors = 0
    for page in sorted(ROOT.rglob("*.html")):
        if "_deploy_proof" in page.parts:
            continue
        try:
            if patch_file(page):
                changed += 1
                print("patched", page.relative_to(ROOT))
        except OSError as exc:
            errors += 1
            print("SKIP", page.relative_to(ROOT), exc)
    print(f"done: {changed} files, {errors} errors")


if __name__ == "__main__":
    main()
