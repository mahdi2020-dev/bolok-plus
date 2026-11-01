# -*- coding: utf-8 -*-
"""Generate psychology / academic consultation hub pages from existing articles."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # bolok_plus
CONSULT = Path(__file__).resolve().parent
V = "40"

# Motivation / path anxiety / emotional decision — not exam papers or pure study tips
PSYCH_STEMS = {
    "tajrobe-posht-konkouri",
    "dalayel-oft-rotbe",
    "posht-konkour-ya-mohajerat",
    "azad-ya-posht-konkour",
    "agar-parastari-ghabool-nasham",
    "parastari-ya-otagh-amal",
    "radiology-ya-oloum-azmayeshgahi",
    "hoghugh-azad-ya-payamnoor",
    "diplom-bozorgsalan-ya-roozane",
    "jaygozin-konkour",
}

PSYCH_SECTIONS: list[tuple[str, set[str]]] = [
    (
        "تصمیم مسیر",
        {
            "azad-ya-posht-konkour",
            "posht-konkour-ya-mohajerat",
            "jaygozin-konkour",
            "diplom-bozorgsalan-ya-roozane",
            "hoghugh-azad-ya-payamnoor",
            "parastari-ya-otagh-amal",
            "radiology-ya-oloum-azmayeshgahi",
        },
    ),
    (
        "انگیزه و فشار",
        {
            "dalayel-oft-rotbe",
            "agar-parastari-ghabool-nasham",
        },
    ),
    (
        "تجربه پشت‌کنکور",
        {
            "tajrobe-posht-konkouri",
        },
    ),
]

SKIP_STEMS = {"index", "page-2", "page-3", "page-4"}

TITLE_TAG_RE = re.compile(r"<title>(.*?)</title>", re.S | re.I)
H1_RE = re.compile(r"<h1[^>]*>(.*?)</h1>", re.S)
OG_RE = re.compile(
    r'<meta\s+property=["\']og:title["\']\s+content=["\'](.*?)["\']',
    re.I,
)
TAG_RE = re.compile(r"<[^>]+>")


def page_title(path: Path) -> str:
    try:
        html = path.read_text(encoding="utf-8")
    except OSError:
        return path.stem
    for rx in (OG_RE, TITLE_TAG_RE, H1_RE):
        m = rx.search(html)
        if not m:
            continue
        t = TAG_RE.sub("", m.group(1))
        t = re.sub(r"\s+", " ", t).strip()
        t = re.sub(r"\s*[·|]\s*بلوک\s*$", "", t).strip()
        if t:
            return t
    return path.stem.replace("-", " ")


def dedupe(items: list[tuple[str, str]]) -> list[tuple[str, str]]:
    seen: set[str] = set()
    out: list[tuple[str, str]] = []
    for href, title in items:
        if href in seen:
            continue
        seen.add(href)
        out.append((href, title))
    return out


def collect_articles() -> tuple[
    dict[str, list[tuple[str, str]]],
    dict[str, list[tuple[str, str]]],
]:
    psych_by_section: dict[str, list[tuple[str, str]]] = {
        title: [] for title, _ in PSYCH_SECTIONS
    }
    academic: dict[str, list[tuple[str, str]]] = {
        "مشاوره و سوابق": [],
        "سوالات و پاسخنامه": [],
        "کنکور سراسری": [],
        "آزاد و غیرانتفاعی": [],
        "ارشد": [],
    }

    stem_to_psych_section = {
        stem: section for section, stems in PSYCH_SECTIONS for stem in stems
    }

    mosh = ROOT / "education" / "konkour" / "moshavere"
    for path in sorted(mosh.glob("*.html")):
        stem = path.stem
        if stem in SKIP_STEMS:
            continue
        href = f"../../konkour/moshavere/{path.name}"
        title = page_title(path)
        if stem in PSYCH_STEMS:
            section = stem_to_psych_section.get(stem, "انگیزه و فشار")
            psych_by_section.setdefault(section, []).append((href, title))
            continue
        if stem.startswith("soalat-") or stem.startswith("pasokhname-"):
            academic["سوالات و پاسخنامه"].append((href, title))
        else:
            academic["مشاوره و سوابق"].append((href, title))

    konkour = ROOT / "education" / "konkour"
    for path in sorted(konkour.glob("*.html")):
        if path.name in {"index.html", "maghalat.html"}:
            continue
        href = f"../../konkour/{path.name}"
        academic["کنکور سراسری"].append((href, page_title(path)))

    for sub, section in (("gheyr-entefaee", "آزاد و غیرانتفاعی"), ("arshad", "ارشد")):
        folder = konkour / sub
        if not folder.is_dir():
            continue
        idx = folder / "index.html"
        if idx.exists():
            academic[section].append((f"../../konkour/{sub}/index.html", page_title(idx)))
        for path in sorted(folder.glob("*.html")):
            if path.name == "index.html" or path.stem.startswith("page-"):
                continue
            academic[section].append((f"../../konkour/{sub}/{path.name}", page_title(path)))

    for key in list(psych_by_section):
        psych_by_section[key] = dedupe(psych_by_section[key])
    for key in list(academic):
        academic[key] = dedupe(academic[key])

    return psych_by_section, academic


def shell(title: str, description: str, body: str, *, depth: int = 3) -> str:
    import sys

    sys.path.insert(0, str(ROOT))
    from _header_catalog_v36 import build_header  # type: ignore

    p = "../" * depth
    header = build_header(p)
    return f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0c0e12" />
  <meta name="description" content="{description}" />
  <title>{title} | بلوک</title>
  <link rel="icon" href="{p}assets/bolok-logo.svg?v={V}" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="{p}styles.css?v={V}" />
  <script src="{p}site-api.js?v={V}" defer></script>
  <script src="{p}catalog-menu.js?v={V}" defer></script>
  <script src="{p}download-menu.js?v={V}" defer></script>
  <script src="{p}app.js?v={V}" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">پرش به محتوا</a>
{header}
  <main id="main" class="container consult-hub">
{body}
  </main>
  <footer class="site-footer container" style="padding:2rem 0;text-align:center;color:#64748b;font-size:0.85rem">
    <p><a href="{p}index.html">بلوک</a> · بخش مشاوره</p>
  </footer>
</body>
</html>
"""


def list_html(items: list[tuple[str, str]]) -> str:
    if not items:
        return ""
    lis = "\n".join(
        f'      <li><a class="consult-card" href="{href}"><strong>{title}</strong></a></li>'
        for href, title in items
    )
    return f'<ul class="consult-list">\n{lis}\n    </ul>'


def sections_html(sections: dict[str, list[tuple[str, str]]], order: list[str]) -> str:
    blocks: list[str] = []
    for title in order:
        items = sections.get(title) or []
        if not items:
            continue
        blocks.append(
            f"""    <section class="consult-section">
      <h2 class="consult-section-title">{title}</h2>
      {list_html(items)}
    </section>"""
        )
    return "\n".join(blocks)


def main() -> None:
    psych, academic = collect_articles()
    psych_count = sum(len(v) for v in psych.values())
    acad_count = sum(len(v) for v in academic.values())

    (CONSULT / "psychology").mkdir(parents=True, exist_ok=True)
    (CONSULT / "academic").mkdir(parents=True, exist_ok=True)

    # consult/index.html is one level under education/consult → depth 2 for assets
    root_body = """    <section class="resources-hero">
      <h1>مشاوره</h1>
      <p>بین دو شاخه انتخاب کنید: روانشناسی یا تحصیلی.</p>
    </section>
    <div class="family-grid consult-branches">
      <a class="family-card" href="psychology/index.html">
        <h2>روانشناسی</h2>
        <p>انگیزه، فشار کنکور، تصمیم‌های سنگین و مسیر ذهنی</p>
      </a>
      <a class="family-card" href="academic/index.html">
        <h2>تحصیلی</h2>
        <p>ثبت‌نام، انتخاب رشته، برنامه، سوالات و راهنماهای کنکور</p>
      </a>
    </div>
"""
    # Shell for consult/index uses depth 2 (education/consult/)
    # but psychology/academic use depth 3. Special-case root.
    import sys

    sys.path.insert(0, str(ROOT))
    from _header_catalog_v36 import build_header  # type: ignore

    def write_page(path: Path, title: str, description: str, body: str, depth: int) -> None:
        p = "../" * depth
        header = build_header(p)
        html = f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0c0e12" />
  <meta name="description" content="{description}" />
  <title>{title} | بلوک</title>
  <link rel="icon" href="{p}assets/bolok-logo.svg?v={V}" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="{p}styles.css?v={V}" />
  <script src="{p}site-api.js?v={V}" defer></script>
  <script src="{p}catalog-menu.js?v={V}" defer></script>
  <script src="{p}download-menu.js?v={V}" defer></script>
  <script src="{p}app.js?v={V}" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">پرش به محتوا</a>
{header}
  <main id="main" class="container consult-hub">
{body}
  </main>
  <footer class="site-footer container" style="padding:2rem 0;text-align:center;color:#64748b;font-size:0.85rem">
    <p><a href="{p}index.html">بلوک</a> · بخش مشاوره</p>
  </footer>
</body>
</html>
"""
        path.write_text(html, encoding="utf-8", newline="\n")

    write_page(
        CONSULT / "index.html",
        "مشاوره",
        "مشاوره روانشناسی و تحصیلی بلوک",
        root_body,
        2,
    )

    psych_order = [t for t, _ in PSYCH_SECTIONS]
    psych_body = f"""    <section class="resources-hero">
      <h1>مشاوره روانشناسی</h1>
      <p>مقالات مرتبط با انگیزه، فشار و تصمیم‌های مسیر کنکور.</p>
      <p><a href="../index.html">← بازگشت به مشاوره</a></p>
    </section>
{sections_html(psych, psych_order)}
"""
    write_page(
        CONSULT / "psychology" / "index.html",
        "مشاوره روانشناسی",
        "مشاوره روانشناسی کنکور",
        psych_body,
        3,
    )

    acad_order = [
        "مشاوره و سوابق",
        "کنکور سراسری",
        "آزاد و غیرانتفاعی",
        "ارشد",
        "سوالات و پاسخنامه",
    ]
    acad_body = f"""    <section class="resources-hero">
      <h1>مشاوره تحصیلی</h1>
      <p>راهنماهای ثبت‌نام، انتخاب رشته، برنامه و منابع آموزشی کنکور.</p>
      <p><a href="../index.html">← بازگشت به مشاوره</a></p>
    </section>
{sections_html(academic, acad_order)}
"""
    write_page(
        CONSULT / "academic" / "index.html",
        "مشاوره تحصیلی",
        "مشاوره تحصیلی کنکور",
        acad_body,
        3,
    )
    print(f"psych={psych_count} academic={acad_count}")


if __name__ == "__main__":
    main()
