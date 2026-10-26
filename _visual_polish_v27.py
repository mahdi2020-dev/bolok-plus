# -*- coding: utf-8 -*-
"""Smoother UI: tables, charts, timelines, motion (v27)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
V_OLD, V_NEW = "26", "27"

CSS = r"""

/* ——— Visual polish: tables / charts / motion · v27 ——— */
:root {
  --motion: cubic-bezier(0.22, 1, 0.36, 1);
  --chart-ink: #0c0e12;
  --chart-mid: #3a4250;
  --chart-soft: #9aa3b2;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 1.15rem 0 1.4rem;
  border-radius: 18px;
  border: 1px solid var(--line);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(247, 248, 250, 0.9));
  box-shadow: 0 18px 40px rgba(12, 14, 18, 0.06);
}

.table-wrap .steps-table {
  margin: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  min-width: 420px;
}

.steps-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 1.15rem 0 1.4rem;
  font-size: 0.92rem;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 36px rgba(12, 14, 18, 0.05);
}

.steps-table th,
.steps-table td {
  padding: 0.85rem 1rem;
  text-align: start;
  border-bottom: 1px solid rgba(12, 14, 18, 0.07);
  font-weight: 700;
  color: var(--ink-soft);
  transition: background 0.2s ease, color 0.2s ease;
}

.steps-table th {
  background: linear-gradient(135deg, #12151b 0%, #0c0e12 55%, #1a2230 100%);
  color: #fff;
  font-weight: 900;
  letter-spacing: -0.01em;
  position: sticky;
  top: 0;
  z-index: 1;
}

.steps-table tbody tr:nth-child(even) td {
  background: rgba(12, 14, 18, 0.025);
}

.steps-table tbody tr:hover td {
  background: rgba(12, 14, 18, 0.055);
  color: var(--ink);
}

.steps-table tr:last-child td {
  border-bottom: 0;
}

.steps-table td:first-child {
  width: auto;
  color: var(--ink);
  font-weight: 900;
}

.steps-table tr.is-total td,
.steps-table tr:last-child td {
  background: rgba(12, 14, 18, 0.06);
  color: var(--ink);
  font-weight: 900;
}

.steps-table.steps-table--compact th,
.steps-table.steps-table--compact td {
  padding: 0.65rem 0.8rem;
  font-size: 0.86rem;
}

/* Charts */
.chart-bars {
  display: grid;
  gap: 0.95rem;
  margin: 1.25rem 0 1.5rem;
  padding: 1.25rem 1.3rem 1.35rem;
  border-radius: 20px;
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.96), rgba(241, 243, 247, 0.9));
  border: 1px solid var(--line);
  box-shadow: 0 20px 44px rgba(12, 14, 18, 0.06);
}

.chart-bars-title {
  margin: 0 0 0.15rem;
  font-size: 0.95rem;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.chart-bars-note {
  margin: 0 0 0.35rem;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 700;
}

.chart-row {
  display: grid;
  gap: 0.4rem;
}

.chart-row-label {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: baseline;
  font-size: 0.84rem;
  font-weight: 800;
  color: var(--ink-soft);
}

.chart-row-label span:last-child {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}

.chart-track {
  height: 14px;
  border-radius: 999px;
  background: rgba(12, 14, 18, 0.08);
  overflow: hidden;
  position: relative;
}

.chart-track::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
  opacity: 0.35;
  pointer-events: none;
}

.chart-fill {
  height: 100%;
  width: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--chart-ink) 0%, var(--chart-mid) 70%, #5b6575 100%);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset;
  transition: width 1.05s var(--motion);
  will-change: width;
}

.chart-bars.is-inview .chart-fill {
  width: var(--w, 0%);
}

.chart-fill--soft {
  background: linear-gradient(90deg, #3a4250, #8b93a1);
}

.chart-fill--accent {
  background: linear-gradient(90deg, #0c0e12, #2a3342 55%, #6b7280);
}

/* Timeline */
.timeline {
  display: grid;
  gap: 0;
  margin: 1.35rem 0 1.65rem;
  padding: 1.35rem 1.35rem 0.85rem;
  border-radius: 22px;
  background:
    linear-gradient(165deg, rgba(255, 255, 255, 0.96), rgba(242, 244, 248, 0.9));
  border: 1px solid var(--line);
  box-shadow: 0 22px 48px rgba(12, 14, 18, 0.07);
}

.timeline-row {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 0.95rem;
  position: relative;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.55s var(--motion), transform 0.55s var(--motion);
}

.timeline.is-inview .timeline-row {
  opacity: 1;
  transform: none;
}

.timeline.is-inview .timeline-row:nth-child(1) { transition-delay: 0.05s; }
.timeline.is-inview .timeline-row:nth-child(2) { transition-delay: 0.12s; }
.timeline.is-inview .timeline-row:nth-child(3) { transition-delay: 0.19s; }
.timeline.is-inview .timeline-row:nth-child(4) { transition-delay: 0.26s; }
.timeline.is-inview .timeline-row:nth-child(5) { transition-delay: 0.33s; }

.timeline-row:not(:last-child) .timeline-dot::after {
  content: "";
  position: absolute;
  top: 30px;
  inset-inline-start: 14px;
  width: 2px;
  height: calc(100% - 6px);
  background: linear-gradient(180deg, #0c0e12, rgba(12, 14, 18, 0.08));
  border-radius: 2px;
}

.timeline-dot {
  position: relative;
  width: 28px;
  height: 28px;
  margin-top: 0.1rem;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #2a3140, #0c0e12 70%);
  box-shadow:
    0 0 0 5px rgba(12, 14, 18, 0.08),
    0 8px 18px rgba(12, 14, 18, 0.18);
}

.timeline-dot::before {
  content: "";
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
}

.timeline-dot--soft {
  background: radial-gradient(circle at 35% 30%, #7b8494, #4b5563 70%);
  box-shadow: 0 0 0 5px rgba(75, 85, 99, 0.12);
}

.timeline-body strong {
  font-size: 1.02rem;
  letter-spacing: -0.02em;
}

.timeline-body p {
  line-height: 1.7;
}

/* Article rhythm */
.article-body h2 {
  position: relative;
  padding-inline-start: 0.85rem;
  margin-top: 2rem;
}

.article-body h2::before {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  top: 0.35em;
  width: 3px;
  height: 1.05em;
  border-radius: 3px;
  background: linear-gradient(180deg, #0c0e12, #6b7280);
}

.article-layout .article-toc {
  border-radius: 18px;
  backdrop-filter: blur(10px);
}

.feed-card,
.feat-card,
.icon-tile,
.callout {
  transition:
    transform 0.28s var(--motion),
    box-shadow 0.28s var(--motion),
    border-color 0.28s ease;
}

.feed-card:hover,
.feat-card:hover,
.icon-tile:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 36px rgba(12, 14, 18, 0.1);
}

.checklist li {
  transition: transform 0.22s var(--motion), border-color 0.22s ease, background 0.22s ease;
}

.checklist li:hover {
  transform: translateX(-3px);
  border-color: rgba(12, 14, 18, 0.2);
  background: rgba(255, 255, 255, 0.92);
}

.faq details {
  transition: border-color 0.2s ease, box-shadow 0.25s var(--motion), transform 0.25s var(--motion);
}

.faq details[open] {
  box-shadow: 0 14px 32px rgba(12, 14, 18, 0.08);
  transform: translateY(-1px);
}

/* Soft page enter for key blocks without GSAP dependency */
@media (prefers-reduced-motion: no-preference) {
  .edu-hero h1 {
    animation: hero-rise 0.7s var(--motion) both;
  }
  .edu-hero .edu-lead {
    animation: hero-rise 0.75s var(--motion) 0.08s both;
  }
}

@keyframes hero-rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chart-fill,
  .timeline-row,
  .feed-card,
  .feat-card,
  .icon-tile,
  .checklist li,
  .edu-hero h1,
  .edu-hero .edu-lead {
    transition: none !important;
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  .chart-bars .chart-fill {
    width: var(--w, 0%) !important;
  }
}
"""

JS_SNIPPET = r"""
  // Animate charts, timelines, and table polish on scroll
  const motionIO =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-inview");
              motionIO.unobserve(entry.target);
            });
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.2 },
        )
      : null;

  document.querySelectorAll(".chart-bars").forEach((box) => {
    box.querySelectorAll(".chart-fill").forEach((fill) => {
      const inline = fill.getAttribute("style") || "";
      const m = inline.match(/width\s*:\s*([\d.]+)%/i);
      const w = m ? m[1] : null;
      if (w) {
        fill.style.setProperty("--w", `${w}%`);
        fill.style.removeProperty("width");
        if (reduceMotion) fill.style.width = `${w}%`;
      }
    });
    if (reduceMotion) box.classList.add("is-inview");
    else if (motionIO) motionIO.observe(box);
    else box.classList.add("is-inview");
  });

  document.querySelectorAll(".timeline").forEach((tl) => {
    if (reduceMotion) tl.classList.add("is-inview");
    else if (motionIO) motionIO.observe(tl);
    else tl.classList.add("is-inview");
  });

  // Wrap naked steps-tables for mobile scroll polish
  document.querySelectorAll("table.steps-table").forEach((table) => {
    if (table.parentElement?.classList.contains("table-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
"""


def patch_css() -> None:
    path = ROOT / "styles.css"
    css = path.read_text(encoding="utf-8")
    if "Visual polish: tables / charts / motion · v27" in css:
        css = re.sub(
            r"\n/\* ——— Visual polish: tables / charts / motion · v27 ——— \*/.*$",
            "",
            css,
            flags=re.S,
        )
    # neutralize old blue chart gradient earlier in file via later override — OK
    path.write_text(css.rstrip() + "\n" + CSS + "\n", encoding="utf-8")
    print("styles.css polished")


def patch_js() -> None:
    path = ROOT / "app.js"
    js = path.read_text(encoding="utf-8")
    if "Animate charts, timelines" in js:
        print("app.js already has chart motion")
        return
    marker = "  const boot = () => {"
    if marker not in js:
        raise SystemExit("boot marker missing")
    js = js.replace(marker, JS_SNIPPET + "\n" + marker, 1)
    path.write_text(js, encoding="utf-8")
    print("app.js motion wired")


TAJROBI_CHART = """
<div class="chart-bars" aria-label="نمودار سهم تقریبی ظرفیت دوره‌ها">
  <p class="chart-bars-title">سهم تقریبی ظرفیت دوره‌ها (نمونه)</p>
  <p class="chart-bars-note">نسبت به جمع حدود ۶۴۶۹۵ — برای درک مقیاس، نه جایگزین دفترچه</p>
  <div class="chart-row"><div class="chart-row-label"><span>روزانه</span><span>۶۳٪</span></div><div class="chart-track"><div class="chart-fill chart-fill--accent" style="width:63%"></div></div></div>
  <div class="chart-row"><div class="chart-row-label"><span>فرهنگیان</span><span>۱۰٪</span></div><div class="chart-track"><div class="chart-fill" style="width:10%"></div></div></div>
  <div class="chart-row"><div class="chart-row-label"><span>پیام‌نور</span><span>۱۰٪</span></div><div class="chart-track"><div class="chart-fill chart-fill--soft" style="width:10%"></div></div></div>
  <div class="chart-row"><div class="chart-row-label"><span>غیرانتفاعی</span><span>۷٪</span></div><div class="chart-track"><div class="chart-fill chart-fill--soft" style="width:7%"></div></div></div>
  <div class="chart-row"><div class="chart-row-label"><span>پردیس / مازاد</span><span>۶٪</span></div><div class="chart-track"><div class="chart-fill" style="width:6%"></div></div></div>
  <div class="chart-row"><div class="chart-row-label"><span>سایر (شبانه، آزاد دفترچه، …)</span><span>۴٪</span></div><div class="chart-track"><div class="chart-fill chart-fill--soft" style="width:4%"></div></div></div>
</div>
"""


def patch_tajrobi() -> None:
    path = ROOT / "education" / "konkour" / "entekhab-reshte-tajrobi.html"
    html = path.read_text(encoding="utf-8")
    if "نمودار سهم تقریبی ظرفیت" in html:
        print("tajrobi chart exists")
    else:
        html = html.replace(
            '<table class="steps-table">',
            TAJROBI_CHART + '\n<table class="steps-table">',
            1,
        )
        # mark total row
        html = html.replace(
            "<tr><td><strong>جمع تقریبی</strong></td>",
            '<tr class="is-total"><td><strong>جمع تقریبی</strong></td>',
            1,
        )
        path.write_text(html, encoding="utf-8")
        print("tajrobi chart added")

    # also enhance hub timeline if not already classed — CSS handles via IO
    hub = ROOT / "education" / "konkour" / "index.html"
    # no markup change needed


def bump() -> None:
    n = 0
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".html", ".js", ".css", ".json", ".md", ".py"}:
            continue
        if path.name.startswith("_visual_polish"):
            continue
        text = path.read_text(encoding="utf-8")
        new = text.replace(f"?v={V_OLD}", f"?v={V_NEW}")
        # fix leftover older busts on logos in headers
        new = new.replace("?v=24", f"?v={V_NEW}").replace("?v=25", f"?v={V_NEW}")
        if new != text:
            path.write_text(new, encoding="utf-8")
            n += 1
    print(f"cache -> v={V_NEW} in {n} files")


def main() -> None:
    patch_css()
    patch_js()
    patch_tajrobi()
    bump()


if __name__ == "__main__":
    main()
