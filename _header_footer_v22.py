# -*- coding: utf-8 -*-
"""Professional header + footer chrome for phone / tablet / desktop (v22)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
V_OLD = "21"
V_NEW = "22"

HEADER_CSS = """/* Header — brand right, nav center, actions left (RTL) · v22 */
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  height: calc(var(--header-h) + env(safe-area-inset-top, 0px));
  padding-top: env(safe-area-inset-top, 0px);
  backdrop-filter: blur(22px) saturate(1.2);
  -webkit-backdrop-filter: blur(22px) saturate(1.2);
  background: rgba(236, 238, 242, 0.72);
  border-bottom: 1px solid transparent;
  transition:
    box-shadow 0.28s var(--ease-out),
    background 0.28s ease,
    border-color 0.28s ease;
}

.site-header.is-scrolled {
  background: rgba(247, 248, 250, 0.9);
  border-bottom-color: var(--line);
  box-shadow: 0 10px 36px rgba(12, 14, 18, 0.08);
}

.site-header.is-open {
  background: rgba(247, 248, 250, 0.98);
  border-bottom-color: var(--line);
}

.site-header .inner {
  height: var(--header-h);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 900;
  font-size: 1.1rem;
  letter-spacing: -0.04em;
  justify-self: start;
  z-index: 2;
  min-height: 44px;
  padding: 0.15rem 0.2rem 0.15rem 0;
  border-radius: 12px;
  transition: opacity 0.18s ease;
}

.brand:hover {
  opacity: 0.88;
}

.brand span {
  line-height: 1;
}

.header-actions {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 2;
}

.header-cta {
  display: none;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1.35;
  min-height: 40px;
  padding: 0.45rem 1.05rem;
  border-radius: 12px;
  font-size: 0.84rem;
  white-space: nowrap;
  box-shadow: 0 8px 20px rgba(12, 14, 18, 0.12);
}

.brand-logo {
  width: 34px;
  height: 34px;
  border-radius: 0;
  object-fit: contain;
  background: transparent;
  padding: 0;
  box-shadow: none;
  flex-shrink: 0;
}

.nav {
  display: none;
  gap: 1.15rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--ink-soft);
  justify-self: center;
  align-items: center;
  z-index: 1;
}

.nav > a {
  position: relative;
  transition: color 0.2s ease;
  padding: 0.35rem 0.1rem;
  white-space: nowrap;
}

.nav-trigger {
  transition: color 0.2s ease;
}

.nav > a:hover,
.nav-trigger:hover {
  color: var(--ink);
}

.nav > a::after,
.nav-trigger::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  height: 1.5px;
  background: var(--ink);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.25s var(--ease-out);
}

.nav > a:hover::after,
.nav-item--has-sub:hover .nav-trigger::after,
.nav-item--has-sub.is-open .nav-trigger::after {
  transform: scaleX(1);
}

.nav-item--has-sub {
  position: relative;
}

.nav-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 0;
  background: transparent;
  padding: 0.35rem 0.1rem;
  font: inherit;
  font-weight: 700;
  color: inherit;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  min-height: 40px;
}

.nav-trigger-caret {
  width: 0.42rem;
  height: 0.42rem;
  border-inline-end: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg) translateY(-2px);
  opacity: 0.65;
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.nav-item--has-sub.is-open .nav-trigger-caret,
.nav-item--has-sub:hover .nav-trigger-caret {
  transform: rotate(225deg) translateY(-1px);
  opacity: 1;
}

.nav-panel {
  position: absolute;
  top: calc(100% + 0.85rem);
  left: 50%;
  right: auto;
  transform: translateX(-50%) translateY(6px);
  width: min(780px, calc(100vw - 2rem));
  padding: 1.15rem 1.2rem 1.25rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.985);
  border: 1px solid var(--line);
  box-shadow:
    0 28px 56px rgba(12, 14, 18, 0.14),
    0 2px 0 rgba(255, 255, 255, 0.8) inset;
  backdrop-filter: blur(18px);
  display: none;
  z-index: 60;
  opacity: 0;
}

.nav-item--has-sub.is-open .nav-panel,
.nav-item--has-sub:hover .nav-panel,
.nav-item--has-sub:focus-within .nav-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem 1.2rem;
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  animation: drawer-in 0.24s var(--ease-out);
}

.nav-panel-head {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid var(--line);
  margin-bottom: 0.1rem;
}

.nav-panel-head a {
  font-weight: 900;
  color: var(--ink);
  font-size: 0.95rem;
}

.nav-panel-head a::after {
  display: none;
}

.nav-panel-group h4 {
  margin: 0 0 0.45rem;
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  color: var(--muted);
}

.nav-panel-group a {
  display: block;
  padding: 0.32rem 0;
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--ink-soft);
  border-radius: 6px;
  transition: color 0.15s ease, padding-inline 0.15s ease;
}

.nav-panel-group a:hover {
  color: var(--ink);
  padding-inline-start: 0.2rem;
}

.nav-panel-group a::after {
  display: none;
}

.nav-toggle {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.88);
  border-radius: 12px;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.nav-toggle:hover {
  background: #fff;
  border-color: rgba(12, 14, 18, 0.22);
}

.nav-toggle:active {
  transform: scale(0.96);
}

.nav-toggle span,
.nav-toggle span::before,
.nav-toggle span::after {
  display: block;
  width: 18px;
  height: 2px;
  background: var(--ink);
  position: relative;
  border-radius: 2px;
  transition: transform 0.22s var(--ease-out), top 0.22s var(--ease-out), background 0.18s ease;
}

.nav-toggle span::before,
.nav-toggle span::after {
  content: "";
  position: absolute;
  inset-inline: 0;
}

.nav-toggle span::before {
  top: -6px;
}

.nav-toggle span::after {
  top: 6px;
}

.nav-toggle[aria-expanded="true"] span {
  background: transparent;
}

.nav-toggle[aria-expanded="true"] span::before {
  top: 0;
  transform: rotate(45deg);
}

.nav-toggle[aria-expanded="true"] span::after {
  top: 0;
  transform: rotate(-45deg);
}

.nav-drawer {
  display: none;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 248, 250, 0.98));
  padding: 0.35rem 0.85rem calc(1.15rem + env(safe-area-inset-bottom, 0px));
  max-height: min(78dvh, 640px);
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  box-shadow: 0 22px 48px rgba(12, 14, 18, 0.1);
}

.nav-drawer.open {
  display: block;
  animation: drawer-in 0.28s var(--ease-out);
}

@keyframes drawer-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.nav-drawer a {
  display: block;
  padding: 0.85rem 0.45rem;
  font-weight: 700;
  border-bottom: 1px solid var(--line);
  transition: color 0.15s ease, background 0.15s ease;
  border-radius: 8px;
}

.nav-drawer > a:hover,
.nav-drawer > a:focus-visible {
  color: var(--ink);
  background: rgba(12, 14, 18, 0.03);
}

.nav-drawer > a[href*="download"],
.nav-drawer > a.drawer-cta {
  margin-top: 0.45rem;
  border: 1px solid transparent;
  background: #0c0e12;
  color: #fff;
  text-align: center;
  border-radius: 12px;
  font-weight: 900;
  padding: 0.9rem 0.75rem;
}

.nav-drawer > a[href*="download"]:hover,
.nav-drawer > a.drawer-cta:hover {
  background: #1a1f28;
  color: #fff;
}

.drawer-sub {
  border-bottom: 1px solid var(--line);
}

.drawer-sub-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 0.45rem;
  border: 0;
  background: transparent;
  font: inherit;
  font-weight: 700;
  color: inherit;
  cursor: pointer;
  text-align: start;
  border-radius: 8px;
}

.drawer-sub-toggle:hover {
  background: rgba(12, 14, 18, 0.03);
}

.drawer-sub-toggle span[aria-hidden="true"] {
  display: inline-grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--line);
  font-size: 0.95rem;
  line-height: 1;
  color: var(--ink-soft);
  transition: transform 0.2s ease, background 0.2s ease;
}

.drawer-sub.is-open .drawer-sub-toggle span[aria-hidden="true"] {
  transform: rotate(45deg);
  background: rgba(12, 14, 18, 0.06);
}

.drawer-sub-panel {
  display: none;
  padding: 0.15rem 0.35rem 0.85rem 0.55rem;
}

.drawer-sub.is-open .drawer-sub-panel {
  display: block;
  animation: drawer-in 0.2s var(--ease-out);
}

.drawer-sub-panel a {
  border-bottom: 0;
  padding: 0.55rem 0.45rem;
  font-size: 0.9rem;
  color: var(--ink-soft);
  border-radius: 8px;
}

.drawer-sub-panel a:hover {
  color: var(--ink);
  background: rgba(12, 14, 18, 0.03);
}

.drawer-sub-label {
  margin: 0.55rem 0 0.2rem;
  font-size: 0.72rem;
  font-weight: 900;
  color: var(--muted);
}

body.nav-open {
  overflow: hidden;
}

@media (min-width: 760px) {
  .nav {
    display: flex;
    align-items: center;
  }
  .header-cta {
    display: inline-flex;
  }
  .nav-toggle,
  .nav-drawer {
    display: none !important;
  }
  body.nav-open {
    overflow: auto;
  }
}

@media (min-width: 760px) and (max-width: 1023px) {
  .nav {
    gap: 0.75rem;
    font-size: 0.82rem;
  }
  .header-actions {
    gap: 0.4rem;
  }
  .header-cta {
    padding: 0.4rem 0.85rem;
    font-size: 0.8rem;
    min-height: 38px;
  }
  .nav-panel {
    width: min(680px, calc(100vw - 2.5rem));
  }
}

@media (min-width: 1024px) {
  .nav {
    gap: 1.35rem;
    font-size: 0.9rem;
  }
  .nav-item--has-sub.is-open .nav-panel,
  .nav-item--has-sub:hover .nav-panel,
  .nav-item--has-sub:focus-within .nav-panel {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 759px) {
  .site-header .inner {
    grid-template-columns: 1fr auto;
  }
  .nav {
    display: none;
  }
  .header-search {
    min-width: 44px;
    min-height: 44px;
    padding: 0.35rem 0.7rem;
    justify-content: center;
  }
}
"""

FOOTER_CSS = """/* ——— Mega footer · v22 ——— */
.site-mega {
  margin-top: 2.5rem;
  padding: 2.75rem 0 calc(2rem + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--line);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.42), rgba(247, 248, 250, 0.94)),
    radial-gradient(55% 70% at 100% 0%, rgba(12, 14, 18, 0.045), transparent 58%);
  content-visibility: auto;
  contain-intrinsic-size: 720px;
}

.mega-cta {
  display: grid;
  gap: 1.15rem;
  align-items: center;
  padding: 1.45rem 1.35rem;
  margin-bottom: 2rem;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(135deg, #12151b 0%, #0c0e12 46%, #172033 100%);
  color: #fff;
  box-shadow:
    0 24px 52px rgba(12, 14, 18, 0.2),
    0 1px 0 rgba(255, 255, 255, 0.08) inset;
}

@media (min-width: 760px) {
  .mega-cta {
    grid-template-columns: 1fr auto;
    padding: 1.7rem 1.85rem;
    gap: 1.5rem;
  }
}

.mega-cta-kicker {
  margin: 0 0 0.4rem;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.62);
}

.mega-cta h2 {
  margin: 0;
  font-size: clamp(1.28rem, 3vw, 1.72rem);
  font-weight: 900;
  letter-spacing: -0.035em;
  line-height: 1.25;
}

.mega-cta p {
  margin: 0.45rem 0 0;
  color: rgba(255, 255, 255, 0.76);
  font-weight: 600;
  font-size: 0.92rem;
  max-width: 36rem;
  line-height: 1.7;
}

.mega-cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
}

.mega-cta .btn-light {
  background: #fff;
  color: #0c0e12;
  min-height: 44px;
  padding-inline: 1.15rem;
  font-weight: 900;
}

.mega-cta-ghost {
  border-color: rgba(255, 255, 255, 0.28);
  color: #fff;
  background: transparent;
  min-height: 44px;
}

.mega-cta-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.site-mega-grid {
  display: grid;
  gap: 1.75rem 1.35rem;
  padding-bottom: 1.75rem;
}

@media (min-width: 560px) and (max-width: 899px) {
  .site-mega-grid {
    grid-template-columns: 1fr 1fr;
  }
  .mega-brand {
    grid-column: 1 / -1;
  }
}

@media (min-width: 900px) {
  .site-mega-grid {
    grid-template-columns: 1.45fr 1fr 1fr 1fr;
    gap: 1.75rem 1.5rem;
  }
}

.mega-brand {
  display: grid;
  gap: 0.7rem;
  align-content: start;
}

.mega-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-weight: 900;
  font-size: 1.22rem;
  letter-spacing: -0.04em;
  color: var(--ink);
  width: fit-content;
}

.mega-logo:hover {
  opacity: 0.88;
}

.mega-logo img {
  width: 46px;
  height: 46px;
  object-fit: contain;
}

.mega-tagline {
  margin: 0;
  color: var(--ink-soft);
  font-weight: 600;
  font-size: 0.9rem;
  line-height: 1.75;
  max-width: 24rem;
}

.mega-mail {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  padding: 0.5rem 0.95rem;
  border-radius: 12px;
  background: #0c0e12;
  color: #fff;
  font-weight: 800;
  font-size: 0.84rem;
  transition: transform 0.18s var(--ease-out), background 0.18s ease;
}

.mega-mail:hover {
  transform: translateY(-1px);
  background: #1a1f28;
}

.mega-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.15rem;
}

.mega-chips span {
  padding: 0.3rem 0.7rem;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.82);
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--ink-soft);
}

.mega-col {
  display: grid;
  gap: 0.4rem;
  align-content: start;
}

.mega-col h3 {
  margin: 0 0 0.45rem;
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  color: var(--ink);
  padding-bottom: 0.45rem;
  border-bottom: 1px solid var(--line);
}

.mega-col a {
  color: var(--ink-soft);
  font-weight: 700;
  font-size: 0.88rem;
  padding: 0.28rem 0;
  transition: color 0.15s ease, transform 0.15s ease;
  width: fit-content;
}

.mega-col a:hover {
  color: var(--ink);
  transform: translateX(-3px);
}

.mega-kicker {
  margin: 0.95rem 0 0;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--muted);
}

.mega-bar {
  display: grid;
  gap: 0.4rem;
  padding-top: 1.35rem;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 600;
}

@media (min-width: 760px) {
  .mega-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.65rem 1.25rem;
  }
}

.mega-bar a {
  color: var(--ink-soft);
  font-weight: 800;
}

.mega-bar a:hover {
  color: var(--ink);
}

.mega-bar-note {
  margin: 0;
  font-size: 0.75rem;
  color: var(--muted);
  max-width: 36rem;
  line-height: 1.6;
}

.mega-bar p {
  margin: 0;
}
"""

V22_APPEND = """

/* ——— Header / Footer chrome (v22) ——— */
:root {
  --header-h: 68px;
}

.header-search {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0.35rem 0.8rem;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.78);
  color: var(--ink-soft);
  font-weight: 800;
  font-size: 0.84rem;
  transition:
    transform 0.18s var(--ease-out),
    border-color 0.18s ease,
    color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.header-search:hover {
  color: var(--ink);
  border-color: rgba(12, 14, 18, 0.28);
  background: #fff;
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(12, 14, 18, 0.06);
}

.site-header {
  transition:
    box-shadow 0.28s var(--ease-out),
    background 0.28s ease,
    border-color 0.28s ease;
}

.site-header.is-scrolled {
  box-shadow: 0 10px 36px rgba(12, 14, 18, 0.08);
}

@media (min-width: 760px) and (max-width: 1023px) {
  .header-search {
    font-size: 0.8rem;
    min-height: 38px;
    padding: 0.32rem 0.7rem;
  }
}

@media (min-width: 1200px) {
  .site-header .inner,
  .site-mega > .container {
    width: min(1120px, calc(100% - 2.5rem));
  }
}
"""


def brace_balance(text: str) -> int:
    return text.count("{") - text.count("}")


def replace_span(css: str, start_pat: str, end_pat: str, replacement: str) -> str:
    """Replace from start_pat match through line before end_pat match."""
    sm = re.search(start_pat, css)
    em = re.search(end_pat, css)
    if not sm or not em or em.start() <= sm.start():
        raise SystemExit(f"span not found: {start_pat!r} -> {end_pat!r}")
    return css[: sm.start()] + replacement.rstrip() + "\n\n" + css[em.start() :]


def patch_css() -> None:
    path = ROOT / "styles.css"
    css = path.read_text(encoding="utf-8")
    before_bal = brace_balance(css)
    before_len = len(css)

    # Header: from comment through the mobile max-width block that only touches header.
    # End marker = next major section after header media queries.
    # Original file has hero rules after the 759px header media.
    css = replace_span(
        css,
        r"/\* Header[^\n]*\*/",
        r"/\* Atmospheric|\.hero,|\.hero \{|main \{|\.skip-link",
        HEADER_CSS,
    )

    # If end marker was wrong, try a more reliable one: look for `.hero` after header
    # Re-read approach: find start, then find `@media (max-width: 759px)` that contains
    # `.site-header .inner`, take until that media block ends.

    path.write_text(css, encoding="utf-8")
    # Verify we didn't destroy the file
    css = path.read_text(encoding="utf-8")
    if ".hero" not in css or ".site-mega" not in css:
        raise SystemExit("CSS patch destroyed hero/mega — abort, restore needed")
    if brace_balance(css) != before_bal and abs(len(css) - before_len) > 50000:
        print("warn: large change / brace drift", brace_balance(css), before_bal, len(css), before_len)


def patch_css_by_lines() -> None:
    path = ROOT / "styles.css"
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)

    def find_idx(pred, start=0):
        for i in range(start, len(lines)):
            if pred(lines[i]):
                return i
        return -1

    h0 = find_idx(lambda L: L.startswith("/* Header"))
    if h0 < 0:
        raise SystemExit("header comment not found")

    # Find the max-width 759 header media that sets .site-header .inner
    m759 = -1
    for i in range(h0, len(lines)):
        if "@media (max-width: 759px)" in lines[i]:
            # peek ahead
            chunk = "".join(lines[i : i + 12])
            if ".site-header .inner" in chunk:
                m759 = i
                break
    if m759 < 0:
        raise SystemExit("header mobile media not found")

    # Find closing brace of that media query (brace depth from m759)
    depth = 0
    h1 = -1
    for i in range(m759, len(lines)):
        depth += lines[i].count("{") - lines[i].count("}")
        if i > m759 and depth == 0:
            h1 = i  # inclusive end line
            break
    if h1 < 0:
        raise SystemExit("header media close not found")

    f0 = find_idx(lambda L: "Mega footer" in L)
    if f0 < 0:
        raise SystemExit("footer comment not found")
    # Footer ends just before `/* Inner pages */`
    f1 = find_idx(lambda L: L.startswith("/* Inner pages"), f0)
    if f1 < 0:
        raise SystemExit("Inner pages marker not found")

    new_lines = (
        lines[:h0]
        + [HEADER_CSS.rstrip() + "\n", "\n"]
        + lines[h1 + 1 : f0]
        + [FOOTER_CSS.rstrip() + "\n", "\n"]
        + lines[f1:]
    )
    css = "".join(new_lines)

    # Bump :root header height once
    css = re.sub(r"(--header-h:\s*)\d+px", r"\g<1>68px", css, count=1)

    if "Header / Footer chrome (v22)" not in css:
        css = css.rstrip() + V22_APPEND + "\n"

    if brace_balance(css) != 0:
        raise SystemExit(f"CSS braces unbalanced: {brace_balance(css)}")
    if ".hero" not in css or len(css) < 40_000:
        raise SystemExit("CSS looks truncated after patch")

    path.write_text(css, encoding="utf-8")
    print(f"styles.css patched ({len(css)} bytes, braces ok)")


def patch_js() -> None:
    path = ROOT / "app.js"
    js = path.read_text(encoding="utf-8")
    if "setDrawer" in js and "nav-open" in js:
        print("app.js already patched")
        return

    old_nav = """  // Nav drawer
  const drawer = document.querySelector("[data-nav-drawer]");
  const toggle = document.querySelector("[data-nav-toggle]");
  if (toggle && drawer) {
    toggle.setAttribute("aria-expanded", "false");
    const closeDrawer = () => {
      drawer.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", () => {
      const open = !drawer.classList.contains("open");
      drawer.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    drawer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", closeDrawer);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
    document.addEventListener("click", (e) => {
      if (
        drawer.classList.contains("open") &&
        !drawer.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        closeDrawer();
      }
    });
  }"""

    new_nav = """  // Nav drawer (mobile) — body lock, header state, resize close
  const drawer = document.querySelector("[data-nav-drawer]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const siteHeaderEl = document.querySelector(".site-header");
  if (toggle && drawer) {
    toggle.setAttribute("aria-expanded", "false");
    const setDrawer = (open) => {
      drawer.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
      siteHeaderEl?.classList.toggle("is-open", open);
    };
    const closeDrawer = () => setDrawer(false);
    toggle.addEventListener("click", () => {
      setDrawer(!drawer.classList.contains("open"));
    });
    drawer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", closeDrawer);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
    document.addEventListener("click", (e) => {
      if (
        drawer.classList.contains("open") &&
        !drawer.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        closeDrawer();
      }
    });
    window.addEventListener(
      "resize",
      () => {
        if (window.matchMedia("(min-width: 760px)").matches) closeDrawer();
      },
      { passive: true },
    );
  }"""

    if old_nav not in js:
        raise SystemExit("nav drawer JS block not found")
    path.write_text(js.replace(old_nav, new_nav), encoding="utf-8")
    print("app.js patched")


def polish_index_header() -> None:
    path = ROOT / "index.html"
    html = path.read_text(encoding="utf-8")
    if "جستجوی مطالب" in html and "راهنماهای کنکور" in html:
        print("index.html drawer already polished")
        return

    old_drawer = """    <div class="nav-drawer" data-nav-drawer>
      <a href="#education">مطالب آموزشی</a>
      <div class="drawer-sub" data-drawer-sub>
        <button class="drawer-sub-toggle" type="button" data-drawer-sub-toggle aria-expanded="false">
          زیرمنوی کنکور <span aria-hidden="true">+</span>
        </button>
        <div class="drawer-sub-panel">
          <a href="education/konkour/sabt-nam.html">ثبت نام کنکور سراسری</a>
          <a href="education/konkour/zaman-sabt-nam.html">زمان ثبت نام</a>
          <a href="education/konkour/nahve-sabt-nam.html">نحوه ثبت نام</a>
          <a href="education/konkour/elam-natayej-1405.html">نتایج نهایی ۱۴۰۵</a>
          <a href="education/konkour/entekhab-reshte-1405.html">انتخاب رشته ۱۴۰۵</a>
          <a href="education/konkour/barname-1406.html">برنامه ۱۴۰۶</a>
          <a href="education/konkour/azad-1405.html">انتخاب رشته آزاد</a>
          <a href="education/konkour/index.html">همه مطالب کنکور</a>
        </div>
      </div>
      <a href="#showcase">معرفی</a>
      <a href="about.html">درباره</a>
      <a href="terms.html">شرایط</a>
      <a href="privacy.html">حریم خصوصی</a>
      <a href="#download">دانلود اپ</a>
    </div>"""

    new_drawer = """    <div class="nav-drawer" data-nav-drawer>
      <a href="search.html">جستجوی مطالب</a>
      <a href="#education">مطالب آموزشی</a>
      <div class="drawer-sub" data-drawer-sub>
        <button class="drawer-sub-toggle" type="button" data-drawer-sub-toggle aria-expanded="false">
          راهنماهای کنکور <span aria-hidden="true">+</span>
        </button>
        <div class="drawer-sub-panel">
          <p class="drawer-sub-label">مسیرهای اصلی</p>
          <a href="education/konkour/index.html">هاب کنکور سراسری</a>
          <a href="education/konkour/moshavere/index.html">مشاوره کنکور</a>
          <a href="education/konkour/gheyr-entefaee/index.html">بدون‌آزمون غیرانتفاعی</a>
          <a href="education/konkour/arshad/index.html">مشاوره ارشد</a>
          <p class="drawer-sub-label">ثبت‌نام و انتخاب رشته</p>
          <a href="education/konkour/sabt-nam.html">ثبت نام کنکور سراسری</a>
          <a href="education/konkour/zaman-sabt-nam.html">زمان ثبت نام</a>
          <a href="education/konkour/entekhab-reshte-1405.html">انتخاب رشته ۱۴۰۵</a>
          <a href="education/konkour/barname-1406.html">برنامه ۱۴۰۶</a>
          <a href="education/konkour/azad-1405.html">انتخاب رشته آزاد</a>
        </div>
      </div>
      <a href="#showcase">معرفی اپ</a>
      <a href="about.html">درباره بلوک</a>
      <a href="terms.html">شرایط استفاده</a>
      <a href="privacy.html">حریم خصوصی</a>
      <a href="#download">دانلود اپ بلوک</a>
    </div>"""

    if old_drawer not in html:
        raise SystemExit("index drawer not found for polish")
    path.write_text(html.replace(old_drawer, new_drawer), encoding="utf-8")
    print("index.html drawer polished")


def bump_cache() -> None:
    n = 0
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".html", ".js", ".css", ".py", ".md", ".json"}:
            continue
        if path.name.startswith("_header_footer"):
            continue
        text = path.read_text(encoding="utf-8")
        new = text.replace(f"?v={V_OLD}", f"?v={V_NEW}")
        if new != text:
            path.write_text(new, encoding="utf-8")
            n += 1
    # Also ensure any leftover v=21 after restore of styles isn't an issue
    print(f"cache bumped to v={V_NEW} in {n} files")


def main() -> None:
    patch_css_by_lines()
    patch_js()
    polish_index_header()
    bump_cache()


if __name__ == "__main__":
    main()
