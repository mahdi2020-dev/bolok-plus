(() => {
  const SITE = window.BolokSite;
  if (!SITE) return;
  const esc = SITE.esc;
  const PAGE_SIZE = 24;
  const CACHE_PREFIX = "bolok_site_item:";

  const params = new URLSearchParams(location.search);
  const audienceGrade = (params.get("grade") || "").trim();
  const audienceGoal = (params.get("exam_goal") || "").trim();

  const withAudience = (path) => {
    const u = new URL(path, location.href);
    if (audienceGrade) u.searchParams.set("grade", audienceGrade);
    if (audienceGoal) u.searchParams.set("exam_goal", audienceGoal);
    return u.pathname.split("/").pop() + u.search + u.hash;
  };

  const audienceQuery = () => {
    const p = new URLSearchParams();
    if (audienceGrade) p.set("grade", audienceGrade);
    if (audienceGoal) p.set("exam_goal", audienceGoal);
    return p;
  };

  const renderFilterBar = () => {
    const host = document.getElementById("resource-filter-bar");
    if (!host) return;
    if (!audienceGrade && !audienceGoal) {
      host.hidden = true;
      host.innerHTML = "";
      return;
    }
    host.hidden = false;
    const chips = [];
    if (audienceGrade) {
      chips.push(
        `<span class="chip chip--accent">پایه: ${esc(toFa(audienceGrade))}</span>`
      );
    }
    if (audienceGoal) {
      chips.push(`<span class="chip">هدف: ${esc(audienceGoal)}</span>`);
    }
    host.innerHTML = `<div class="resource-filter-active">
      ${chips.join("")}
      <a class="resource-filter-clear" href="index.html">حذف فیلتر پایه</a>
    </div>`;
    const hero = document.querySelector(".resources-hero h1");
    const heroP = document.querySelector(".resources-hero p");
    if (hero && audienceGrade) {
      hero.textContent = `منابع پایه ${toFa(audienceGrade)}`;
    }
    if (heroP && audienceGrade) {
      heroP.textContent = audienceGoal
        ? `منابع منتشرشده برای پایه ${toFa(audienceGrade)} · ${audienceGoal}`
        : `کمک‌آموزشی، جزوه و تمرین‌های مناسب پایه ${toFa(
            audienceGrade
          )} — از جمله منابع مشترک تیزهوشان.`;
    }
  };

  const wireAudienceLinks = () => {
    if (!audienceGrade && !audienceGoal) return;
    document.querySelectorAll(".kind-chips a, .family-grid a.family-card").forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("http")) {
        if (href.startsWith("#")) {
          const base = `index.html${href}`;
          a.setAttribute("href", withAudience(base));
        }
        return;
      }
      a.setAttribute("href", withAudience(href));
    });
  };

  const coverFallbackHtml = (item) => {
    const tint = (item.color || "").trim() || "#dbeafe";
    return `<div class="resource-card-placeholder" style="--cover-tint:${esc(tint)}" aria-hidden="true"></div>`;
  };

  const coverSrc = (item) =>
    (item.cover_url || "").trim() || (item.icon_url || "").trim();

  const coverHtml = (item, { eager = false } = {}) => {
    const src = coverSrc(item);
    const tint = esc((item.color || "").trim() || "#dbeafe");
    if (src) {
      const loading = eager ? "eager" : "lazy";
      return `<img class="resource-cover-img" src="${esc(src)}" alt="" loading="${loading}" decoding="async" data-cover-tint="${tint}" onerror="this.onerror=null;var d=document.createElement('div');d.className='resource-card-placeholder';d.style.setProperty('--cover-tint',this.getAttribute('data-cover-tint')||'#dbeafe');d.setAttribute('aria-hidden','true');this.replaceWith(d);" />`;
    }
    return coverFallbackHtml(item);
  };

  const cardHtml = (item) => {
    const meta = [item.publisher, item.lesson].filter(Boolean).join(" · ");
    const href = withAudience(`item.html?id=${encodeURIComponent(item.id)}`);
    const score =
      item.quality_score != null && Number(item.quality_score) >= 0
        ? `<span class="resource-card-score">${esc(String(item.quality_score))}</span>`
        : "";
    const kindLabel = item.kind_label_fa || item.kind || "";
    return `<a class="resource-card resource-card--book" href="${esc(href)}">
      <div class="resource-card-cover">${coverHtml(item)}${score}</div>
      <div class="resource-card-body">
        <h3>${esc(toFa(item.name || "منبع"))}</h3>
        <p class="meta">${esc(meta || kindLabel)}</p>
      </div>
    </a>`;
  };

  const cacheItem = (id, data) => {
    try {
      sessionStorage.setItem(CACHE_PREFIX + id, JSON.stringify({ t: Date.now(), data }));
    } catch (_) {
      /* ignore quota */
    }
  };

  const readCachedItem = (id) => {
    try {
      const raw = sessionStorage.getItem(CACHE_PREFIX + id);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.data) return null;
      if (Date.now() - (parsed.t || 0) > 1000 * 60 * 60 * 6) return null;
      return parsed.data;
    } catch (_) {
      return null;
    }
  };

  const bindInfinite = (el, buildQuery) => {
    let offset = 0;
    let loading = false;
    let hasMore = true;
    const st = document.getElementById("resource-status");
    const sentinel = document.createElement("div");
    sentinel.className = "resource-load-more";
    sentinel.setAttribute("aria-hidden", "true");
    el.after(sentinel);

    const append = (items, replace) => {
      if (replace) el.innerHTML = "";
      if (!items.length && replace) {
        if (st) {
          const gradeHint = audienceGrade
            ? `برای پایه «${toFa(audienceGrade)}» هنوز منبع منتشرشده‌ای در این بخش نیست.`
            : "منبعی یافت نشد.";
          st.innerHTML = `<span class="rsc-empty-title">${esc(
            gradeHint
          )}</span><span class="rsc-empty-sub">از منوی بانک منابع پایهٔ دیگر را امتحان کنید یا فیلتر را بردارید.</span>`;
        }
        return;
      }
      el.insertAdjacentHTML("beforeend", items.map(cardHtml).join(""));
      if (st) st.textContent = "";
    };

    const load = async (replace) => {
      if (loading || (!hasMore && !replace)) return;
      loading = true;
      if (st && replace) st.textContent = "در حال بارگذاری…";
      try {
        const aq = buildQuery(offset);
        const data = await SITE.api(`/api/site/catalog/search?${aq}`);
        const items = data.items || [];
        append(items, replace);
        hasMore = !!data.has_more && items.length > 0;
        offset += items.length;
        if (!hasMore) sentinel.remove();
      } catch (e) {
        if (st) st.textContent = e.message || "خطا در بارگذاری";
      } finally {
        loading = false;
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) load(false);
      },
      { rootMargin: "240px" }
    );
    io.observe(sentinel);
    load(true);
  };

  const home = document.querySelector("[data-resources-home]");
  const kindEl = document.querySelector("[data-resources-kind]");
  const itemEl = document.querySelector("[data-resource-item]");

  if (home) {
    bindInfinite(home, (offset) => {
      const aq = audienceQuery();
      aq.set("limit", String(PAGE_SIZE));
      aq.set("offset", String(offset));
      return aq;
    });
  }

  if (kindEl) {
    const kind = kindEl.getAttribute("data-resources-kind") || "";
    const lessonFilter = (params.get("lesson") || "").trim();
    bindInfinite(kindEl, (offset) => {
      const aq = audienceQuery();
      aq.set("kind", kind);
      if (lessonFilter) aq.set("lesson", lessonFilter);
      aq.set("limit", String(PAGE_SIZE));
      aq.set("offset", String(offset));
      return aq;
    });
  }

  const radarSvg = (sections) => {
    if (!Array.isArray(sections) || sections.length < 3) return "";
    const n = sections.length;
    const cx = 120;
    const cy = 120;
    const R = 88;
    const angleAt = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const pt = (i, r) => {
      const a = angleAt(i);
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };
    const grid = [0.25, 0.5, 0.75, 1]
      .map((f) => {
        const poly = Array.from({ length: n }, (_, i) => pt(i, R * f).join(",")).join(" ");
        return `<polygon points="${poly}" class="radar-grid" />`;
      })
      .join("");
    const axes = Array.from({ length: n }, (_, i) => {
      const [x, y] = pt(i, R);
      return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="radar-axis" />`;
    }).join("");
    const dataPts = sections.map((sec, i) => {
      const pct = Math.max(0, Math.min(100, Number(sec.pct) || 0)) / 100;
      return pt(i, R * pct).join(",");
    });
    const labels = sections
      .map((sec, i) => {
        const [x, y] = pt(i, R + 18);
        return `<text x="${x}" y="${y}" class="radar-label">${esc(
          humanSectionLabel(sec)
        )}</text>`;
      })
      .join("");
    return `<svg class="resource-radar" viewBox="0 0 240 240" role="img" aria-label="نمودار معیارهای کیفیت">
      ${grid}${axes}
      <polygon points="${dataPts.join(" ")}" class="radar-fill" />
      ${labels}
    </svg>`;
  };

  const scoreRing = (score, { instant = false } = {}) => {
    const n = Math.max(0, Math.min(100, Number(score) || 0));
    const r = 42;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - n / 100);
    const dash = instant ? offset : c;
    const num = instant ? toFa(n) : toFa(0);
    return `<div class="resource-score-ring${instant ? " is-animated" : ""}" data-animate-charts aria-label="امتیاز کیفیت ${toFa(n)} از ۱۰۰">
      <svg viewBox="0 0 100 100">
        <circle class="ring-bg" cx="50" cy="50" r="${r}" />
        <circle class="ring-fg" cx="50" cy="50" r="${r}"
          stroke-dasharray="${c.toFixed(1)}"
          stroke-dashoffset="${dash.toFixed(1)}"
          data-ring-target="${offset.toFixed(1)}" />
      </svg>
      <div class="ring-num"><strong data-count-to="${n}">${num}</strong><span>از ۱۰۰</span></div>
    </div>`;
  };

  const paintCompareCharts = (root) => {
    if (!root) return;
    root.querySelectorAll("[data-bar-width]").forEach((el) => {
      el.style.width = `${el.getAttribute("data-bar-width") || 0}%`;
    });
    root.querySelectorAll("[data-ring-target]").forEach((el) => {
      el.style.strokeDashoffset = el.getAttribute("data-ring-target") || "0";
    });
    root.querySelectorAll("[data-count-to]").forEach((el) => {
      el.textContent = toFa(el.getAttribute("data-count-to") || 0);
    });
  };

  const humanSectionLabel = (sec) => {
    const code = String(sec?.code || "").trim();
    const raw = String(sec?.label_fa || sec?.code || "").trim();
    if (code === "ux_structure" || /ساختار\s*و\s*UX|UX/i.test(raw)) {
      return "طراحی ظاهری و خوانایی";
    }
    if (code === "exam_standard" || /استاندارد\s*کنکور/.test(raw)) {
      return "استاندارد آزمون";
    }
    if (/تناسب\s*کنکور/.test(raw)) return "تناسب با آزمون هدف";
    if (/شبیه\s*کنکور/.test(raw)) return "شبیه آزمون هدف";
    if (/هم[\u200c\-]?سطح\s*کنکور/.test(raw)) return "هم‌سطح آزمون هدف";
    return raw;
  };

  const gradeBandOf = (g) => {
    const t = String(g || "");
    if (/پنجم|ششم|چهارم/.test(t)) return "elem";
    if (/هفتم|هشتم|نهم/.test(t)) return "mid";
    if (/دهم|یازدهم|دوازدهم|فنی|کاردانش/.test(t)) return "high";
    return "";
  };

  const isDualTizhooshanAudience = (s) => {
    const grades = (s?.student_grades || []).map((g) => String(g).trim()).filter(Boolean);
    const name = String(s?.name || "");
    const goals = (s?.exam_goals || []).map((g) => String(g));
    const tiz = goals.some((g) => /تیزهوشان/.test(g));
    const bands = new Set(grades.map(gradeBandOf).filter(Boolean));
    const hasSixth =
      grades.some((g) => /ششم/.test(g)) || /ششم/.test(name);
    const hasNinth =
      grades.some((g) => /نهم/.test(g)) || /نهم/.test(name);
    if (bands.has("elem") && bands.has("mid")) {
      return tiz || bands.size === 2;
    }
    // Cover catalog rows tagged only «ششم» while title/exam imply نهم تیزهوشان.
    return tiz && hasSixth && hasNinth;
  };

  const primaryExamLabel = (s) => {
    const goals = (s?.exam_goals || []).map((g) => String(g).trim()).filter(Boolean);
    if (goals.length) return goals[0];
    if (isDualTizhooshanAudience(s)) return "آزمون تیزهوشان";
    return "آزمون هدف";
  };

  const sectionHint = (sec) => {
    const score = Number(sec?.score) || 0;
    const max = Math.max(1, Number(sec?.max) || 1);
    const pct = (score / max) * 100;
    const code = String(sec?.code || "");
    if (code === "question_bank") {
      if (pct >= 75) return "جامع و تیپ‌بندی‌شده";
      if (pct >= 50) return "پوشش قابل‌قبول";
      return "محدودتر از انتظار";
    }
    if (code === "answer_key") {
      if (pct >= 70) return "تشریحیِ کامل";
      if (pct >= 45) return "توضیح متوسط";
      return "مختصر";
    }
    if (code === "lesson_quality") {
      if (pct >= 70) return "خودآموز و روان";
      if (pct >= 45) return "قابل‌فهم";
      return "نیاز به معلم";
    }
    if (code === "ux_structure") {
      if (pct >= 70) return "فونت و صفحه‌آرایی خوب";
      if (pct >= 45) return "خوانایی استاندارد";
      return "ظاهر معمولی";
    }
    if (pct >= 75) return "قوی";
    if (pct >= 50) return "استاندارد";
    return "متوسط";
  };

  const firstSentence = (text) =>
    String(text || "")
      .split(/[.\n؛]/)
      .map((x) => x.replace(/^[✓✕✖✗\-–—]\s*/, "").trim())
      .find(Boolean) || "";

  const iconSvg = (name) => {
    const common =
      'class="rsc-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"';
    const paths = {
      pages: `<path d="M7 4.5h7.5L18 8v11.5H7z"/><path d="M14 4.5V8h4"/>`,
      tests: `<circle cx="12" cy="12" r="7.5"/><path d="M9.5 12.2 11.2 14l3.4-4"/>`,
      year: `<rect x="4.5" y="6" width="15" height="13.5" rx="2"/><path d="M8 4.5v3M16 4.5v3M4.5 10h15"/>`,
      ch: `<path d="M6 5.5h9.5a2 2 0 0 1 2 2V19l-4-1.5L9.5 19V7.5a2 2 0 0 0-2-2H6"/><path d="M6 5.5v13.5"/>`,
      vol: `<path d="M6 5h4v14H6zM11 5h7v14h-7z"/>`,
      isbn: `<path d="M5 7h14M5 12h14M5 17h9"/>`,
      teach: `<path d="M4.5 18.5V7.5L12 4.5l7.5 3v11L12 15.5z"/><path d="M12 15.5V4.5"/>`,
      quiz: `<path d="M8 8.5a4 4 0 1 1 5.2 3.8L12 14.5v1"/><circle cx="12" cy="18" r=".8" fill="currentColor" stroke="none"/>`,
      summary: `<path d="M6 6.5h12M6 12h12M6 17.5h8"/>`,
      peek: `<circle cx="11" cy="11" r="5.5"/><path d="m15.5 15.5 3 3"/>`,
      clock: `<circle cx="12" cy="12" r="7.5"/><path d="M12 8v4.5l3 1.5"/>`,
      flag: `<path d="M6 20V5.5l9 3.2-9 3.3"/>`,
      level: `<path d="M5 16.5h3.5V8H5zM10.25 16.5h3.5V5.5h-3.5zM15.5 16.5H19V11h-3.5z"/>`,
      tool: `<path d="M14.5 5.5a3.5 3.5 0 0 0-4.7 4.7L5 15v4h4l4.8-4.8a3.5 3.5 0 0 0 .7-3.7"/><path d="m15 9 2.5-2.5"/>`,
      person: `<circle cx="12" cy="8" r="3.2"/><path d="M5.5 19c1.5-3 3.8-4.5 6.5-4.5s5 1.5 6.5 4.5"/>`,
    };
    return `<svg ${common}>${paths[name] || paths.pages}</svg>`;
  };

  const pctOf = (score, max) => {
    const s = Number(score);
    const m = Number(max);
    if (!Number.isFinite(s) || !Number.isFinite(m) || m <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((s / m) * 100)));
  };

  /** Parent-facing score: e.g. «۶.۱ از ۱۰» — raw max stays internal. */
  const scoreOutOf10Label = (score, max, pctHint) => {
    const pct =
      pctHint != null && Number.isFinite(Number(pctHint))
        ? Math.max(0, Math.min(100, Math.round(Number(pctHint))))
        : pctOf(score, max);
    const tenths = Math.round(pct) / 10;
    const nice = Number.isInteger(tenths)
      ? String(tenths)
      : tenths.toFixed(1);
    return `${toFa(nice)} از ۱۰`;
  };

  const segmentedPills = (filled, total = 5) => {
    const m = Math.max(1, Math.min(10, Math.round(Number(total) || 5)));
    const s = Math.max(0, Math.min(m, Math.round(Number(filled) || 0)));
    const cells = Array.from({ length: m }, (_, i) =>
      `<i class="${i < s ? "is-on" : ""}"></i>`
    ).join("");
    return `<div class="rsc-pills" aria-hidden="true">${cells}</div>`;
  };

  const barRows = (items) => {
    if (!Array.isArray(items) || !items.length) return "";
    return `<div class="rsc-subgrid" data-animate-charts>${items
      .map((it) => {
        const score = it.score != null ? Number(it.score) : null;
        const max = it.max != null ? Number(it.max) : null;
        const pct =
          it.pct != null
            ? Math.max(0, Math.min(100, Number(it.pct) || 0))
            : pctOf(score, max);
        const label = it.label_fa || it.name || it.code || "";
        const meta = scoreOutOf10Label(score, max, pct);
        const rawTitle =
          score != null && max != null
            ? `نمرهٔ خام ${score}/${max}`
            : `${pct}٪`;
        const pills = segmentedPills(Math.round(pct / 20), 5);
        return `<div class="rsc-subcell" title="${esc(rawTitle)}">
          <div class="rsc-subcell-head"><span>${esc(label)}</span><em>${esc(meta)}</em></div>
          ${pills}
        </div>`;
      })
      .join("")}</div>`;
  };

  const sectionAccordion = (sections) => {
    if (!Array.isArray(sections) || !sections.length) return "";
    return `<div class="resource-acc">${sections
      .map((sec, idx) => {
        const subs = Array.isArray(sec.subs) ? sec.subs : [];
        const open = idx === 0 ? " open" : "";
        const body = subs.length
          ? barRows(subs)
          : `<p class="resource-muted">جزئیات زیرمعیار ثبت نشده.</p>`;
        const title = humanSectionLabel(sec);
        const hint = sectionHint(sec);
        const pct =
          sec.pct != null
            ? Math.max(0, Math.min(100, Number(sec.pct) || 0))
            : pctOf(sec.score, sec.max);
        const label10 = scoreOutOf10Label(sec.score, sec.max, pct);
        const rawTitle = `نمرهٔ خام ${sec.score ?? 0}/${sec.max ?? 0}`;
        return `<details class="resource-acc-item"${open}>
          <summary>
            <span class="resource-acc-title">${esc(title)}
              <small class="rsc-acc-hint">${esc(hint)}</small>
            </span>
            <span class="resource-acc-meta" title="${esc(rawTitle)}">
              <em>${esc(label10)}</em>
              <span class="rsc-acc-pct">${esc(toFa(pct))}٪</span>
              <span class="resource-acc-chevron" aria-hidden="true"></span>
            </span>
          </summary>
          <div class="resource-acc-body">${body}</div>
        </details>`;
      })
      .join("")}</div>`;
  };

  const useCaseCards = (items) => {
    if (!Array.isArray(items) || !items.length) return "";
    const icons = ["teach", "quiz", "summary"];
    return `<div class="rsc-usecase-grid" data-animate-charts>${items
      .slice(0, 3)
      .map((it, idx) => {
        const v = Math.max(
          0,
          Math.min(100, Number(it.pct != null ? it.pct : it.value) || 0)
        );
        const label = it.label_fa || it.name || it.code || "";
        const tone = v >= 70 ? "good" : v >= 45 ? "mid" : "warn";
        const r = 18;
        const c = 2 * Math.PI * r;
        const off = c * (1 - v / 100);
        return `<div class="rsc-usecase-card rsc-usecase-card--${tone}">
          <span class="rsc-usecase-ico">${iconSvg(icons[idx] || "teach")}</span>
          <strong>${esc(label)}</strong>
          <div class="rsc-usecase-ring" aria-label="${esc(label)} ${toFa(Math.round(v))} درصد">
            <svg viewBox="0 0 44 44" aria-hidden="true">
              <circle class="ring-bg" cx="22" cy="22" r="${r}" />
              <circle class="ring-fg" cx="22" cy="22" r="${r}"
                stroke-dasharray="${c.toFixed(1)}"
                stroke-dashoffset="${c.toFixed(1)}"
                data-ring-target="${off.toFixed(1)}" />
            </svg>
            <em>${toFa(Math.round(v))}٪</em>
          </div>
        </div>`;
      })
      .join("")}</div>`;
  };

  const LEVEL_CODES = ["weak", "mid", "strong"];
  const LEVEL_LABELS = {
    weak: "ضعیف / مبتدی",
    mid: "متوسط",
    strong: "قوی / پیشرفته",
  };

  const levelSpectrum = (items, review, bookMeta) => {
    const dominant = String(bookMeta?.dominant_level || "")
      .trim()
      .toLowerCase();
    const byCode = {};
    (Array.isArray(items) ? items : []).forEach((it) => {
      const code = String(it.code || "").trim().toLowerCase();
      if (!LEVEL_CODES.includes(code)) return;
      byCode[code] = Math.max(0, Math.min(100, Number(it.pct ?? it.value) || 0));
    });
    const hasProfile = LEVEL_CODES.some((c) => (byCode[c] || 0) > 0);
    const rows = LEVEL_CODES.map((code) => {
      let pct = hasProfile ? byCode[code] || 0 : code === dominant ? 100 : 40;
      if (!hasProfile && !dominant) pct = code === "mid" ? 100 : 40;
      const fromItems = (Array.isArray(items) ? items : []).find(
        (it) => String(it.code || "").toLowerCase() === code
      );
      return {
        code,
        label: fromItems?.label_fa || fromItems?.name || LEVEL_LABELS[code],
        pct,
      };
    });
    // Always highlight the highest fit % (e.g. 90% strong), not passport dominant.
    // Tie-break: passport dominant if tied for max, else strong > mid > weak.
    const maxPct = rows.reduce((m, r) => Math.max(m, r.pct), 0);
    const tied = rows.filter((r) => r.pct === maxPct);
    const rank = { strong: 3, mid: 2, weak: 1 };
    let hotCode = tied[0]?.code || "mid";
    if (tied.length > 1) {
      if (LEVEL_CODES.includes(dominant) && tied.some((r) => r.code === dominant)) {
        hotCode = dominant;
      } else {
        hotCode = tied.reduce((a, b) =>
          (rank[b.code] || 0) > (rank[a.code] || 0) ? b : a
        ).code;
      }
    } else if (tied.length === 1) {
      hotCode = tied[0].code;
    }
    const hotRow = rows.find((r) => r.code === hotCode) || rows[0];
    return {
      html: `<div class="rsc-spectrum" data-animate-charts role="img" aria-label="پروفایل تناسب سطح">
      <div class="rsc-spectrum-track">${rows
        .map((r) => {
          const hot = r.code === hotCode ? " is-hot" : "";
          return `<div class="rsc-spectrum-seg${hot}" style="flex:${Math.max(r.pct, 14)}">
            <strong>${esc(r.label)}</strong>
            <em>${toFa(Math.round(r.pct))}٪</em>
            ${hot ? `<span class="rsc-spectrum-tag">بیشترین تناسب</span>` : ""}
          </div>`;
        })
        .join("")}</div>
    </div>`,
      hotCode,
      hotRow,
      rows,
    };
  };

  const isSchoolAudience = (s) => {
    const grades = (s?.student_grades || []).map((g) => String(g).trim());
    if (!grades.length) return isDualTizhooshanAudience(s);
    return grades.some((g) => {
      const b = gradeBandOf(g);
      return b === "elem" || b === "mid";
    });
  };

  const fitForChildHtml = (s, review, bookMeta) => {
    const spectrum = levelSpectrum(review?.level_profile || [], review, bookMeta);
    const useCases = displayUseCases(review).slice(0, 3);
    const dual = isDualTizhooshanAudience(s);
    const exam = primaryExamLabel(s);
    const hotCode = spectrum.hotCode || "mid";
    const dualLead = dual
      ? `<p class="rsc-fit-dual">${
          hotCode === "strong"
            ? "برای پایه ششم بیشتر مناسب دانش‌آموزان قوی و چالشی است؛ برای نهم معمولاً متوسط تا قوی."
            : hotCode === "weak"
              ? "برای شروع پایه ششم و نهم با سطح مبتدی قابل‌استفاده‌تر است؛ دانش‌آموزان خیلی قوی ممکن است منبع مکمل بخواهند."
              : "برای پایه ششم دانش‌آموزان متوسط‌روبه‌بالا و برای نهم طیف متوسط تا قوی پوشش داده می‌شود."
        } مباحث این منبع برای <strong>تیزهوشان ششم و نهم (مشترک)</strong> قابل استفاده است.</p>`
      : "";
    const useHtml = useCases.length
      ? `<div class="rsc-fit-usecases">${useCases
          .map((u) => {
            const v = Math.max(0, Math.min(100, Number(u.pct ?? u.value) || 0));
            const label = u.label_fa || u.name || u.code || "";
            return `<div class="rsc-fit-use"><span>${esc(label)}</span><strong>${toFa(
              Math.round(v)
            )}٪</strong></div>`;
          })
          .join("")}</div>`
      : "";
    const sub = isSchoolAudience(s)
      ? `ویژه والدین و دانش‌آموزان · هدف: ${exam}`
      : `برای انتخاب منبع مناسب سطح شما · هدف: ${exam}`;
    return `<section class="resource-panel rsc-fit-child" data-animate-charts>
      <h2 class="resource-subhead">این منبع برای من مناسب است؟</h2>
      <p class="resource-muted">${esc(sub)}</p>
      ${dualLead}
      ${spectrum.html}
      ${useHtml}
    </section>`;
  };

  const animateCharts = (root) => {
    if (!root || typeof IntersectionObserver === "undefined") {
      root?.querySelectorAll("[data-bar-width]").forEach((el) => {
        el.style.width = `${el.getAttribute("data-bar-width") || 0}%`;
      });
      root?.querySelectorAll("[data-ring-target]").forEach((el) => {
        el.style.strokeDashoffset = el.getAttribute("data-ring-target") || "0";
      });
      return;
    }
    const nodes = root.querySelectorAll("[data-animate-charts]");
    if (!nodes.length) return;
    const run = (node) => {
      if (node.dataset.animated === "1") return;
      node.dataset.animated = "1";
      node.classList.add("is-animated");
      node.querySelectorAll("[data-bar-width]").forEach((el) => {
        requestAnimationFrame(() => {
          el.style.width = `${el.getAttribute("data-bar-width") || 0}%`;
        });
      });
      node.querySelectorAll("[data-ring-target]").forEach((el) => {
        requestAnimationFrame(() => {
          el.style.strokeDashoffset = el.getAttribute("data-ring-target") || "0";
        });
      });
      const counter = node.querySelector("[data-count-to]");
      if (counter) {
        const target = Number(counter.getAttribute("data-count-to") || 0);
        const start = performance.now();
        const dur = 900;
        const tick = (t) => {
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          counter.textContent = toFa(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            run(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    nodes.forEach((n) => io.observe(n));
  };

  const mergeSectionsForCompare = (secA, secB) => {
    const order = [];
    const seen = new Set();
    const add = (list) => {
      (Array.isArray(list) ? list : []).forEach((s) => {
        const code = String(s?.code || "").trim();
        if (!code || seen.has(code)) return;
        seen.add(code);
        order.push(code);
      });
    };
    add(secA);
    add(secB);
    const mapA = new Map((secA || []).map((s) => [String(s.code), s]));
    const mapB = new Map((secB || []).map((s) => [String(s.code), s]));
    return order.map((code) => ({
      code,
      a: mapA.get(code) || null,
      b: mapB.get(code) || null,
      label: humanSectionLabel(mapA.get(code) || mapB.get(code) || { code }),
    }));
  };

  const dualRadar = (secA, secB) => {
    const rows = mergeSectionsForCompare(secA, secB);
    if (rows.length < 3) return "";
    const n = rows.length;
    const cx = 120;
    const cy = 120;
    const R = 78;
    const angleAt = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const pt = (i, r) => {
      const a = angleAt(i);
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };
    const pctOfSec = (sec) => {
      if (!sec) return 0;
      if (sec.pct != null) return Math.max(0, Math.min(100, Number(sec.pct) || 0)) / 100;
      return pctOf(sec.score, sec.max) / 100;
    };
    const grid = [0.25, 0.5, 0.75, 1]
      .map((f) => {
        const poly = Array.from({ length: n }, (_, i) => pt(i, R * f).join(",")).join(" ");
        return `<polygon points="${poly}" class="radar-grid" />`;
      })
      .join("");
    const axes = Array.from({ length: n }, (_, i) => {
      const [x, y] = pt(i, R);
      return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="radar-axis" />`;
    }).join("");
    const polyA = rows.map((row, i) => pt(i, R * pctOfSec(row.a)).join(",")).join(" ");
    const polyB = rows.map((row, i) => pt(i, R * pctOfSec(row.b)).join(",")).join(" ");
    const labels = rows
      .map((row, i) => {
        const [x, y] = pt(i, R + 22);
        const short = String(row.label || "").replace(/\s*\/\s*/g, "/").slice(0, 14);
        return `<text x="${x}" y="${y}" class="radar-label">${esc(short)}</text>`;
      })
      .join("");
    return `<svg class="resource-radar cmp-radar" viewBox="0 0 240 240" role="img" aria-label="مقایسه معیارها">
      ${grid}${axes}
      <polygon points="${polyA}" class="radar-fill radar-fill--a" />
      <polygon points="${polyB}" class="radar-fill radar-fill--b" />
      ${labels}
    </svg>`;
  };

  const dualBars = (secA, secB) => {
    const rows = mergeSectionsForCompare(secA, secB);
    if (!rows.length) return "";
    return `<div class="cmp-duel-list">${rows
      .map((row) => {
        const a = row.a;
        const b = row.b;
        const pa = a
          ? a.pct != null
            ? Math.max(0, Math.min(100, Number(a.pct) || 0))
            : pctOf(a.score, a.max)
          : 0;
        const pb = b
          ? b.pct != null
            ? Math.max(0, Math.min(100, Number(b.pct) || 0))
            : pctOf(b.score, b.max)
          : 0;
        const labelA = a
          ? scoreOutOf10Label(a.score, a.max, pa)
          : "ثبت نشده";
        const labelB = b
          ? scoreOutOf10Label(b.score, b.max, pb)
          : "ثبت نشده";
        const winA = !!(a && b && pa > pb);
        const winB = !!(a && b && pb > pa);
        const rowMod = winA ? " is-win-a" : winB ? " is-win-b" : "";
        return `<div class="cmp-duel-row${rowMod}">
          <div class="cmp-duel-head">
            <span class="cmp-duel-label">${esc(row.label)}</span>
          </div>
          <div class="cmp-duel-scores">
            <div class="cmp-duel-side cmp-duel-side--a${winA ? " is-win" : ""}">
              <em class="cmp-use--a">${esc(labelA)}</em>
              ${winA ? `<span class="cmp-duel-tip cmp-duel-tip--a">برتر</span>` : ""}
            </div>
            <div class="cmp-duel-side cmp-duel-side--b${winB ? " is-win" : ""}">
              <em class="cmp-use--b">${esc(labelB)}</em>
              ${winB ? `<span class="cmp-duel-tip cmp-duel-tip--b">برتر</span>` : ""}
            </div>
          </div>
          <div class="cmp-duel-tracks">
            <div class="resource-bar-track resource-bar-track--a"><i data-bar-width="${pa}" style="width:${pa}%"></i></div>
            <div class="resource-bar-track resource-bar-track--b"><i data-bar-width="${pb}" style="width:${pb}%"></i></div>
          </div>
        </div>`;
      })
      .join("")}</div>`;
  };

  const compareMetaTable = (itemA, itemB) => {
    const mapA = new Map(metaTiles(itemA).map(([k, v]) => [String(k), v]));
    const mapB = new Map(metaTiles(itemB).map(([k, v]) => [String(k), v]));
    const keys = [];
    const seen = new Set();
    [...mapA.keys(), ...mapB.keys()].forEach((k) => {
      if (seen.has(k)) return;
      seen.add(k);
      keys.push(k);
    });
    if (!keys.length) return "";
    const pubA = itemA.publisher || "فعلی";
    const pubB = itemB.publisher || "انتخابی";
    return `<div class="cmp-meta-table-wrap">
      <table class="cmp-meta-table">
        <thead>
          <tr>
            <th>شاخص</th>
            <th class="cmp-col--a">${esc(pubA)}</th>
            <th class="cmp-col--b">${esc(pubB)}</th>
          </tr>
        </thead>
        <tbody>
          ${keys
            .slice(0, 8)
            .map((k) => {
              const va = mapA.has(k) ? mapA.get(k) : "—";
              const vb = mapB.has(k) ? mapB.get(k) : "—";
              return `<tr>
                <th scope="row">${esc(k)}</th>
                <td class="cmp-col--a">${esc(String(va))}</td>
                <td class="cmp-col--b">${esc(String(vb))}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>`;
  };

  const toFa = (n) =>
    String(n ?? "").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

  /** Pages that are actually studied (درسنامه+تست), excluding پاسخنامه when marked. */
  const studyPagesForPlanner = (s) => {
    const bookMeta = s?.book_meta && typeof s.book_meta === "object" ? s.book_meta : {};
    const total = Math.max(0, Number(bookMeta.total_pages) || 0);
    const akStart = Number(bookMeta.answer_key_page_start);
    if (Number.isFinite(akStart) && akStart > 1) {
      const study = akStart - 1;
      if (total <= 0 || study < total) return Math.max(1, study);
    }
    const chapters = Array.isArray(s?.chapters_public) ? s.chapters_public : [];
    let maxEnd = 0;
    chapters.forEach((ch) => {
      const end = Number(ch?.page_end);
      if (Number.isFinite(end) && end > maxEnd) maxEnd = end;
      (Array.isArray(ch?.goftars) ? ch.goftars : []).forEach((g) => {
        const ge = Number(g?.page_end);
        if (Number.isFinite(ge) && ge > maxEnd) maxEnd = ge;
      });
    });
    if (maxEnd > 0 && (total <= 0 || maxEnd < total)) return maxEnd;
    return total;
  };

  /** Soft-align use-case % with section scores so «آموزش از صفر» can't contradict weak درسنامه. */
  const displayUseCases = (review) => {
    const raw = Array.isArray(review?.use_case_scores) ? review.use_case_scores : [];
    const lesson = (review?.sections || []).find(
      (sec) => String(sec?.code || "") === "lesson_quality"
    );
    const lessonPct =
      lesson && Number(lesson.max) > 0
        ? (Math.max(0, Number(lesson.score) || 0) / Number(lesson.max)) * 100
        : null;
    const cons = String(review?.cons || "");
    const consBlocksZero = /نامناسب.{0,24}از\s*صفر|از\s*صفر.{0,24}نامناسب/.test(cons);
    return raw.map((u) => {
      let pct = Math.max(0, Math.min(100, Number(u.pct ?? u.value) || 0));
      const isZero = /صفر|zero/i.test(String(u.code || u.label_fa || ""));
      if (isZero) {
        if (lessonPct != null) {
          // Cap at lesson-quality percentage (e.g. 5.6/10 → ≤۵۶٪).
          pct = Math.min(pct, Math.round(lessonPct));
          if (lessonPct < 55) pct = Math.min(pct, Math.round(lessonPct * 0.9));
        }
        if (consBlocksZero) pct = Math.min(pct, 38);
      }
      return { ...u, pct, value: pct };
    });
  };

  const JALALI_MONTHS = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ];

  const toJalali = (gy, gm, gd) => {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = gy <= 1600 ? 0 : 979;
    gy -= gy <= 1600 ? 621 : 1600;
    const gy2 = gm > 2 ? gy + 1 : gy;
    let days =
      365 * gy +
      Math.floor((gy2 + 3) / 4) -
      Math.floor((gy2 + 99) / 100) +
      Math.floor((gy2 + 399) / 400) -
      80 +
      gd +
      g_d_m[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
    return { jy, jm, jd };
  };

  const formatJalaliFromToday = (addDays) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + Math.max(0, addDays));
    const { jy, jm, jd } = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return `${toFa(jd)} ${JALALI_MONTHS[jm - 1]} ${toFa(jy)}`;
  };

  const metaTiles = (s) => {
    const bookMeta = s.book_meta && typeof s.book_meta === "object" ? s.book_meta : {};
    const labels = bookMeta.labels_fa || {};
    const tiles = [];
    if (bookMeta.total_pages != null) tiles.push(["صفحه", bookMeta.total_pages]);
    if (bookMeta.total_tests != null) tiles.push(["تست", bookMeta.total_tests]);
    if (bookMeta.edition_year) tiles.push(["سال چاپ", bookMeta.edition_year]);
    if (labels.coverage_mode) tiles.push(["پوشش", labels.coverage_mode]);
    if (labels.volume_mode) tiles.push(["جلد", labels.volume_mode]);
    if (labels.dominant_level) tiles.push(["سطح غالب", labels.dominant_level]);
    if (labels.primary_usage) tiles.push(["کاربری اصلی", labels.primary_usage]);
    if (bookMeta.track_grade) tiles.push(["پایهٔ هدف", bookMeta.track_grade]);
    if (s.chapter_count) tiles.push(["فصل", s.chapter_count]);
    if (s.section_count) tiles.push(["بخش", s.section_count]);
    return tiles;
  };

  const scoreVerbal = (score) => {
    const n = Math.max(0, Math.min(100, Number(score) || 0));
    if (n >= 85) return { label: "عالی و توصیهٔ قوی", tone: "excellent" };
    if (n >= 70) return { label: "قوی و قابل‌اعتماد", tone: "strong" };
    if (n >= 55) return { label: "استاندارد و متعادل", tone: "balanced" };
    if (n >= 40) return { label: "متوسط با نقاط ضعف", tone: "mid" };
    return { label: "ضعیف‌تر از انتظار", tone: "weak" };
  };

  const scoreMicroBadges = (review, bookMeta) => {
    const labels = (bookMeta && bookMeta.labels_fa) || {};
    const profile = Array.isArray(review?.level_profile) ? review.level_profile : [];
    const top = profile
      .slice()
      .map((p) => ({
        ...p,
        pct: Math.max(0, Number(p.pct != null ? p.pct : p.value) || 0),
      }))
      .sort((a, b) => b.pct - a.pct)[0];
    // Same source as spectrum «بیشترین تناسب» — avoid passport mid vs profile strong clash.
    const level = top?.label_fa || labels.dominant_level || "—";
    const usage = labels.primary_usage || "آموزش و تثبیت";
    const best = top?.label_fa
      ? `دانش‌آموز ${top.label_fa}`
      : level !== "—"
        ? `دانش‌آموز ${level}`
        : "شروع تا تثبیت";
    return `<div class="rsc-microbadges">
      <span class="rsc-microbadge">${iconSvg("level")}<em>سطح کتاب:</em> <strong>${esc(
        level
      )}</strong></span>
      <span class="rsc-microbadge">${iconSvg("tool")}<em>کاربرد اصلی:</em> <strong>${esc(
        usage
      )}</strong></span>
      <span class="rsc-microbadge">${iconSvg("person")}<em>بهترین بازدهی:</em> <strong>${esc(
        best
      )}</strong></span>
    </div>`;
  };

  const looksLikePublisherSlogan = (text) => {
    const t = String(text || "").trim();
    if (t.length < 12) return true;
    return /تسلط کامل|ارتقای سطح علمی|بهترین کتاب|بی\s*رقیب|منحصر\s*به\s*فرد|در مسیر کنکور است\s*$/i.test(
      t
    );
  };

  const bolokVerdict = (s, review, bookMeta) => {
    const labels = bookMeta?.labels_fa || {};
    const level = labels.dominant_level || "";
    const usage = labels.primary_usage || "";
    const useCases = displayUseCases(review);
    const ranked = useCases
      .map((u) => ({
        ...u,
        pct: Math.max(0, Math.min(100, Number(u.pct != null ? u.pct : u.value) || 0)),
      }))
      .sort((a, b) => b.pct - a.pct);
    const top = ranked[0];
    const weakFit = (review?.level_profile || []).find(
      (p) => p.code === "weak" || /ضعیف/.test(String(p.label_fa || ""))
    );
    const weakPct = Math.max(
      0,
      Number(weakFit?.pct != null ? weakFit.pct : weakFit?.value) || 0
    );
    if (top && top.pct >= 55 && /صفر|آموزش/.test(String(top.label_fa || top.code || ""))) {
      return [
        "مناسب برای شروع از صفر و دانش‌آموزانی که به درسنامهٔ خودآموز و روان با تست‌های خط‌به‌خط نیاز دارند",
        level ? `· سطح غالب: ${level}` : "",
        weakPct >= 40 ? "· بازدهی خوب برای سطح ضعیف تا متوسط" : "",
      ]
        .filter(Boolean)
        .join(" ");
    }
    if (top && /تست|تسلط|حرفه‌ای/.test(String(top.label_fa || top.code || "")) && top.pct >= 55) {
      return [
        "بیشتر برای تثبیت و تست‌زنی جدی مناسب است تا شروع مطلق از صفر",
        level ? `· سطح غالب: ${level}` : "",
        usage ? `· کاربری اصلی: ${usage}` : "",
      ]
        .filter(Boolean)
        .join(" ");
    }
    if (top && /جمع|مرور/.test(String(top.label_fa || top.code || "")) && top.pct >= 55) {
      return [
        "برای جمع‌بندی و مرور نزدیک آزمون مناسب‌تر از آموزش پایه است",
        level ? `· سطح غالب: ${level}` : "",
      ]
        .filter(Boolean)
        .join(" ");
    }
    const bits = [
      level
        ? `مناسب دانش‌آموزان سطح ${level}`
        : "مناسب دانش‌آموزانی که می‌خواهند با منبع استاندارد پیش بروند",
      usage ? `با کاربری «${usage}»` : "",
    ].filter(Boolean);
    return bits.join(" ");
  };

  const editorialBox = (s, review, bookMeta) => {
    const raw = String(s.editorial_verdict || "").trim();
    const useOperator = raw && !looksLikePublisherSlogan(raw);
    let text = useOperator ? raw : bolokVerdict(s, review, bookMeta);
    if (isDualTizhooshanAudience(s)) {
      text = `${text} با اینکه نام روی جلد ممکن است یک پایه باشد، مباحث هوش و استعداد تحلیلی آن برای تیزهوشان ششم و نهم مشترک و کاربردی است.`;
    }
    const soft = !useOperator;
    return `<aside class="rsc-verdict${soft ? " rsc-verdict--soft" : ""}" data-animate-charts>
      <span class="rsc-verdict-kicker">در یک نگاه · مناسب برای چه کسانی؟</span>
      <p>${esc(text)}</p>
    </aside>`;
  };

  const bestFitLevelLabel = (review, bookMeta) => {
    const labels = (bookMeta && bookMeta.labels_fa) || {};
    const profile = Array.isArray(review?.level_profile) ? review.level_profile : [];
    const top = profile
      .slice()
      .map((p) => ({
        ...p,
        pct: Math.max(0, Number(p.pct != null ? p.pct : p.value) || 0),
      }))
      .sort((a, b) => b.pct - a.pct)[0];
    return top?.label_fa || labels.dominant_level || "";
  };

  const advisorReviewHtml = (s, review, bookMeta) => {
    const score = Number(review?.total_score ?? s.quality_score);
    const labels = bookMeta?.labels_fa || {};
    const exam = primaryExamLabel(s);
    const dual = isDualTizhooshanAudience(s);
    const sample = String(s.sample_pdf_url || "").trim();
    const fitLevel = bestFitLevelLabel(review, bookMeta);
    const paras = [];
    // Do not restate editorial_verdict — that copy already lives in editorialBox.
    if (Number.isFinite(score) && score > 0) {
      paras.push(
        `از دید مشاوران بلوک، امتیاز کیفیت این منبع ${toFa(
          Math.round(score)
        )} از ۱۰۰ برای مسیر «${exam}» است${
          fitLevel ? ` و بیشترین تناسب سطح با «${fitLevel}» است` : ""
        }.`
      );
    }
    if (dual) {
      paras.push(
        "اگر فرزندتان ششم است و پایهٔ قوی دارد، این منبع معمولاً چالشی و مفید است؛ برای نهم بیشتر در بازه متوسط تا قوی می‌نشیند. اگر هنوز در شروع مفهومی هستید، بهتر است قبلش یک منبع ساده‌تر بخوانید."
      );
    } else if (labels.primary_usage) {
      paras.push(
        `کاربری اصلی این منبع «${labels.primary_usage}» است؛ برای تصمیم نهایی بخش «چرا بخرید / حواستان باشد» را کنار امتیازها ببینید.`
      );
    }
    if (sample) {
      paras.push(
        "قبل از خرید، چند صفحهٔ نمونه را ورق بزنید تا فونت، چیدمان و سنگینی تست‌ها را خودتان بسنجید."
      );
    }
    if (!paras.length) return "";
    return `<section class="resource-panel rsc-advisor">
      <h2 class="resource-subhead">نظر مشاوران بلوک (جمع‌بندی نهایی)</h2>
      ${paras.map((p) => `<p>${esc(p)}</p>`).join("")}
    </section>`;
  };

  const identityStrip = (s) => {
    const bookMeta = s.book_meta && typeof s.book_meta === "object" ? s.book_meta : {};
    const items = [];
    if (bookMeta.total_pages != null) {
      items.push({
        key: "pages",
        label: "صفحه",
        value: toFa(bookMeta.total_pages),
        icon: "pages",
      });
    }
    if (bookMeta.total_tests != null) {
      items.push({
        key: "tests",
        label: "تست",
        value: toFa(bookMeta.total_tests),
        icon: "tests",
      });
    }
    if (bookMeta.edition_year) {
      items.push({
        key: "year",
        label: "چاپ",
        value: toFa(bookMeta.edition_year),
        icon: "year",
      });
    }
    if (s.chapter_count) {
      items.push({
        key: "ch",
        label: "فصل",
        value: toFa(s.chapter_count),
        icon: "ch",
      });
    }
    if (bookMeta.labels_fa?.volume_mode) {
      items.push({
        key: "vol",
        label: "جلد",
        value: bookMeta.labels_fa.volume_mode,
        icon: "vol",
      });
    }
    if (bookMeta.isbn || s.isbn) {
      items.push({
        key: "isbn",
        label: "شابک",
        value: toFa(bookMeta.isbn || s.isbn),
        icon: "isbn",
      });
    }
    if (!items.length) return "";
    return `<nav class="rsc-id-strip rsc-id-strip--glass" aria-label="شناسنامه منبع">${items
      .map(
        (it) =>
          `<div class="rsc-id-item rsc-id-item--${esc(it.key)}">
            <span class="rsc-id-ico">${iconSvg(it.icon)}</span>
            <em>${esc(it.label)}</em>
            <strong>${esc(String(it.value))}</strong>
          </div>`
      )
      .join("")}</nav>`;
  };

  const mergeGradeLabels = (grades) => {
    const list = (grades || []).map((g) => String(g).trim()).filter(Boolean);
    if (!list.length) return [];
    const order = [
      ["دهم", "یازدهم", "دوازدهم"],
      ["هفتم", "هشتم", "نهم"],
      ["چهارم", "پنجم", "ششم"],
    ];
    const used = new Set();
    const out = [];
    for (const band of order) {
      const hits = band.filter((g) => list.some((x) => x.includes(g)));
      if (hits.length >= 2) {
        hits.forEach((g) => {
          list.forEach((x) => {
            if (x.includes(g)) used.add(x);
          });
        });
        out.push(
          hits.length === 3
            ? `جامع (${hits[0]} تا ${hits[2]})`
            : `${hits[0]} تا ${hits[hits.length - 1]}`
        );
      }
    }
    list.forEach((x) => {
      if (!used.has(x)) out.push(x);
    });
    return out;
  };

  const tagChipsHtml = (s) => {
    const accents = [];
    const muted = [];
    const mainType = String(s.help_book_main_type || "").trim();
    const isTestBank =
      mainType === "Standard_MCQ" ||
      mainType === "Challenging_MCQ" ||
      /تست|MCQ/i.test(String(s.help_book_main_type_label_fa || ""));
    const dual = isDualTizhooshanAudience(s);
    if (dual) {
      accents.push("مناسب تیزهوشان ششم و نهم (مشترک)");
      muted.push("ششم و نهم");
    }
    if (s.lesson) accents.push(String(s.lesson));
    if (s.help_book_main_type_label_fa) accents.push(String(s.help_book_main_type_label_fa));
    if (s.kind_label_fa || s.kind) muted.push(String(s.kind_label_fa || s.kind));
    if (!dual) {
      mergeGradeLabels(s.student_grades).slice(0, 2).forEach((g) => muted.push(g));
    }
    const publisher = String(s.publisher || "").trim();
    if (publisher) muted.push(publisher);
    const goals = (s.exam_goals || [])
      .map((g) => String(g).trim())
      .filter(Boolean)
      .filter((g) => !(isTestBank && /امتحان\s*نهایی/.test(g)));
    goals.slice(0, 2).forEach((g) => muted.push(g));
    const seen = new Set();
    const chip = (label, accent) => {
      const key = label.trim();
      if (!key || seen.has(key)) return "";
      seen.add(key);
      const dualClass = /ششم و نهم/.test(key) ? " chip--dual" : "";
      return `<span class="chip${accent ? " chip--accent" : ""}${dualClass}">${esc(key)}</span>`;
    };
    return [...accents.map((t) => chip(t, true)), ...muted.map((t) => chip(t, false))]
      .filter(Boolean)
      .slice(0, 8)
      .join("");
  };

  const chapterTestCount = (ch) => {
    const kids = Array.isArray(ch.goftars) ? ch.goftars : [];
    let sum = 0;
    let minS = Infinity;
    let maxE = -Infinity;
    kids.forEach((g) => {
      const ks = Number(g.test_start);
      const ke = Number(g.test_end);
      if (Number.isFinite(ks) && Number.isFinite(ke) && ke >= ks) {
        sum += ke - ks + 1;
        minS = Math.min(minS, ks);
        maxE = Math.max(maxE, ke);
      }
    });
    if (sum > 0) {
      const span = maxE >= minS ? maxE - minS + 1 : 0;
      // Prefer goftar-derived count; never keep a smaller chapter-level stub.
      return Math.max(sum, span);
    }
    const declared = Number(ch.test_count) || 0;
    const ts = Number(ch.test_start);
    const te = Number(ch.test_end);
    if (Number.isFinite(ts) && Number.isFinite(te) && te >= ts) {
      return Math.max(declared, te - ts + 1);
    }
    return declared;
  };

  const chaptersHtml = (s) => {
    const chapters = Array.isArray(s.chapters_public) ? s.chapters_public : [];
    const bookMeta = s.book_meta && typeof s.book_meta === "object" ? s.book_meta : {};
    if (!chapters.length && !(bookMeta.answer_key_page_start && bookMeta.answer_key_page_end)) {
      return "";
    }
    const counts = chapters.map(chapterTestCount);
    const totalTests = counts.reduce((sum, n) => sum + n, 0);
    const bookTotal = Number(bookMeta.total_tests) || totalTests;
    const akStart = Number(bookMeta.answer_key_page_start);
    const akEnd = Number(bookMeta.answer_key_page_end);
    const separateVol = bookMeta.answer_key_style === "separate_volume";
    const akRow =
      Number.isFinite(akStart) &&
      Number.isFinite(akEnd) &&
      akEnd >= akStart
        ? `<div class="rsc-ch-answerkey">
            <strong>پاسخنامه تشریحی</strong>
            <span>${
              separateVol
                ? "جلد جدا / پاسخنامهٔ مستقل"
                : `صفحه ${toFa(akStart)} تا ${toFa(akEnd)}`
            }</span>
          </div>`
        : separateVol
          ? `<div class="rsc-ch-answerkey">
            <strong>پاسخنامه</strong>
            <span>طبق شناسنامه: جلد پاسخنامه جداگانه</span>
          </div>`
          : "";
    if (!chapters.length) {
      return akRow
        ? `<section class="resource-panel rsc-chapters">
      <h2 class="resource-subhead">نقشهٔ راه فصل‌ها</h2>
      ${akRow}
    </section>`
        : "";
    }
    const previewLimit = 5;
    const hiddenCount = Math.max(0, chapters.length - previewLimit);
    const chapterCard = (ch, idx) => {
      const kids = Array.isArray(ch.goftars) ? ch.goftars : [];
      const tests = counts[idx] || 0;
      const share =
        bookTotal > 0 && tests > 0 ? Math.round((tests / bookTotal) * 100) : 0;
      const pageRange =
        ch.page_start != null && ch.page_end != null
          ? `صفحه ${toFa(ch.page_start)} تا ${toFa(ch.page_end)}`
          : "";
      const density =
        tests > 0
          ? `<span class="rsc-ch-density">${toFa(tests)} تست${
              share ? ` (${toFa(share)}٪ کل کتاب)` : ""
            }</span>`
          : "";
      const shareBar =
        share > 0
          ? `<span class="rsc-ch-share" aria-hidden="true"><i data-bar-width="${share}" style="width:0%"></i></span>`
          : "";
      const metaBits = [pageRange].filter(Boolean).join(" · ");
      const kidsHtml = kids.length
        ? `<ol class="rsc-ch-timeline">${kids
            .map((g) => {
              const gm = [
                g.page_start != null && g.page_end != null
                  ? `ص ${toFa(g.page_start)}–${toFa(g.page_end)}`
                  : "",
                g.test_start != null && g.test_end != null
                  ? `تست ${toFa(g.test_start)}–${toFa(g.test_end)}`
                  : "",
              ]
                .filter(Boolean)
                .join(" · ");
              return `<li>
                    <span class="rsc-ch-dot" aria-hidden="true"></span>
                    <div><strong>${esc(g.title || "")}</strong>${
                      gm ? `<small>${esc(gm)}</small>` : ""
                    }</div>
                  </li>`;
            })
            .join("")}</ol>`
        : "";
      return `<details class="resource-acc-item"${idx === 0 ? " open" : ""}>
            <summary>
              <span class="resource-acc-main">
                <span class="resource-acc-title">${esc(ch.title || `فصل ${idx + 1}`)}</span>
                <span class="resource-acc-meta">
                  ${density}
                  ${metaBits ? `<em>${esc(metaBits)}</em>` : ""}
                </span>
                ${shareBar}
              </span>
              <span class="resource-acc-chevron" aria-hidden="true"></span>
            </summary>
            <div class="resource-acc-body">${kidsHtml ||
              '<p class="resource-muted">زیربخش ثبت نشده.</p>'}</div>
          </details>`;
    };
    return `<section class="resource-panel rsc-chapters" id="rsc-chapters" data-animate-charts>
      <h2 class="resource-subhead">فهرست فصل‌ها و تعداد تست‌های این منبع</h2>
      <p class="resource-muted">${toFa(chapters.length)} فصل${
        bookTotal ? ` · حدود ${toFa(bookTotal)} تست` : ""
      }</p>
      <div class="resource-acc rsc-ch-grid">${chapters
        .slice(0, previewLimit)
        .map((ch, idx) => chapterCard(ch, idx))
        .join("")}</div>
      ${
        hiddenCount > 0
          ? `<details class="rsc-ch-more">
        <summary class="rsc-ch-more-btn">مشاهده تمام ${toFa(
          chapters.length
        )} فصل (${toFa(hiddenCount)} فصل دیگر)</summary>
        <div class="resource-acc rsc-ch-grid">${chapters
          .slice(previewLimit)
          .map((ch, i) => chapterCard(ch, i + previewLimit))
          .join("")}</div>
      </details>`
          : ""
      }
      ${akRow}
    </section>`;
  };

  const plannerDefaults = (tests, pages) => {
    const t = Math.max(0, Number(tests) || 0);
    const p = Math.max(0, Number(pages) || 0);
    const dailyTests =
      t > 0 ? Math.min(40, Math.max(10, Math.round(t / 30) || 20)) : 10;
    const dailyPages =
      p > 0 ? Math.min(40, Math.max(5, Math.round(p / 30) || 10)) : 10;
    return { dailyTests, dailyPages };
  };

  const computePlanner = (mode, daily, tests, pages) => {
    const t = Math.max(0, Number(tests) || 0);
    const p = Math.max(0, Number(pages) || 0);
    const d = Math.max(1, Number(daily) || 1);
    if (mode === "pages") {
      const days = p > 0 ? Math.max(1, Math.ceil(p / d)) : 1;
      // Implied daily tests from page pace: (tests/pages) * dailyPages
      let dailyTests = "—";
      if (t > 0 && p > 0) {
        const n = Math.min(t, Math.max(1, Math.ceil((t / p) * d)));
        dailyTests = `حدود ${toFa(n)} تست`;
      }
      return {
        days,
        secondary: dailyTests,
        secondaryLabel: "حل تست روزانه",
        lead:
          p > 0
            ? `با ${toFa(p)} صفحه، ببین اگر از امروز شروع کنی کی تمام می‌شود.`
            : "حجم صفحهٔ کتاب برای برنامه‌ریزی ثبت نشده است.",
        rangeLabel: "روزی چند صفحه؟",
      };
    }
    const days = t > 0 ? Math.max(1, Math.ceil(t / d)) : 1;
    // Implied daily pages from test pace: (pages/tests) * dailyTests
    let dailyPages = "—";
    if (p > 0 && t > 0) {
      const n = Math.min(p, Math.max(1, Math.ceil((p / t) * d)));
      dailyPages = `حدود ${toFa(n)} صفحه`;
    } else if (p > 0 && days > 0) {
      dailyPages = `حدود ${toFa(Math.min(p, Math.max(1, Math.ceil(p / days))))} صفحه`;
    }
    return {
      days,
      secondary: dailyPages,
      secondaryLabel: "مطالعه روزانه",
      lead:
        t > 0
          ? `با ${toFa(t)} تست، ببین اگر از امروز شروع کنی کی تمام می‌شود.`
          : "تعداد تست کتاب برای برنامه‌ریزی ثبت نشده است.",
      rangeLabel: "روزی چند تست؟",
    };
  };

  const plannerHtml = (s) => {
    const bookMeta = s.book_meta && typeof s.book_meta === "object" ? s.book_meta : {};
    const total = Number(bookMeta.total_tests) || 0;
    const catalogPages = Number(bookMeta.total_pages) || 0;
    const pages = studyPagesForPlanner(s) || catalogPages;
    if (total <= 0 && pages <= 0) return "";
    const hasTests = total > 0;
    const hasPages = pages > 0;
    const mode = hasPages ? "pages" : "tests";
    const defs = plannerDefaults(total, pages);
    const daily = mode === "pages" ? defs.dailyPages : defs.dailyTests;
    const initial = computePlanner(mode, daily, total, pages);
    const rangeMin = mode === "pages" ? 3 : 5;
    const rangeMax = mode === "pages" ? 50 : 80;
    const rangeStep = mode === "pages" ? 1 : 5;
    return `<section class="resource-panel rsc-planner rsc-planner--dark" id="rsc-planner" data-planner data-total-tests="${total}" data-total-pages="${pages}" data-planner-mode="${mode}">
      <h2 class="resource-subhead">برنامه مطالعه این کتاب در اپ بلوک</h2>
      <p class="resource-muted" data-planner-lead>${esc(initial.lead)}</p>
      <p class="rsc-planner-note">برنامهٔ ترکیبی شامل مطالعهٔ درسنامه + حل تست‌های روزانه است.</p>
      <div class="rsc-planner-modes" role="tablist" aria-label="حالت برنامه‌ریزی">
        <button type="button" class="rsc-planner-mode${mode === "pages" ? " is-active" : ""}${hasPages ? "" : " is-disabled"}" data-planner-mode-btn="pages" ${hasPages ? "" : "disabled"} role="tab" aria-selected="${mode === "pages"}">بر اساس صفحه</button>
        <button type="button" class="rsc-planner-mode${mode === "tests" ? " is-active" : ""}${hasTests ? "" : " is-disabled"}" data-planner-mode-btn="tests" ${hasTests ? "" : "disabled"} role="tab" aria-selected="${mode === "tests"}">بر اساس تست</button>
      </div>
      <label class="rsc-planner-label" for="rsc-daily-amount" data-planner-range-label>${esc(initial.rangeLabel)}</label>
      <div class="rsc-planner-row">
        <input id="rsc-daily-amount" type="range" min="${rangeMin}" max="${rangeMax}" step="${rangeStep}" value="${daily}" data-planner-range data-default-tests="${defs.dailyTests}" data-default-pages="${defs.dailyPages}" />
        <strong data-planner-daily>${toFa(daily)}</strong>
      </div>
      <div class="rsc-planner-tickets">
        <div class="rsc-ticket">
          <span class="rsc-ticket-ico">${iconSvg("clock")}</span>
          <em>مدت زمان</em>
          <strong><span data-planner-days>${toFa(initial.days)}</span> روز</strong>
        </div>
        <div class="rsc-ticket">
          <span class="rsc-ticket-ico">${iconSvg("pages")}</span>
          <em data-planner-secondary-label>${esc(initial.secondaryLabel)}</em>
          <strong data-planner-pages>${initial.secondary}</strong>
        </div>
        <div class="rsc-ticket">
          <span class="rsc-ticket-ico">${iconSvg("flag")}</span>
          <em>تاریخ اتمام</em>
          <strong data-planner-finish>${esc(formatJalaliFromToday(initial.days))}</strong>
        </div>
      </div>
      <a class="btn btn-light rsc-planner-cta" href="../index.html#download" data-download-open data-planner-cta>
        دریافت برنامهٔ ${toFa(initial.days)} روزهٔ این کتاب در اپ بلوک
      </a>
    </section>`;
  };

  const peersHtml = (s) => {
    const peers = Array.isArray(s.peers) ? s.peers.filter((p) => p && p.id !== s.id) : [];
    if (!peers.length) return "";
    return `<section class="resource-panel rsc-peers rsc-rivals" id="rsc-rivals">
      <div class="rsc-peers-head">
        <h2 class="resource-subhead">رقبای اصلی این کتاب</h2>
        <button type="button" class="btn btn-ghost btn-sm" data-open-compare>مقایسه همه</button>
      </div>
      <div class="rsc-rival-list">${peers
        .slice(0, 2)
        .map((p) => {
          const href = withAudience(`item.html?id=${encodeURIComponent(p.id)}`);
          const score = p.quality_score != null ? toFa(p.quality_score) : "—";
          return `<div class="rsc-rival-card">
            <a class="rsc-rival-main" href="${esc(href)}">
              <span class="rsc-peer-cover">${coverHtml(p)}</span>
              <span class="rsc-peer-copy">
                <strong>${esc(p.name || "منبع")}</strong>
                <small>${esc([p.publisher, p.lesson].filter(Boolean).join(" · "))}</small>
              </span>
              <span class="rsc-peer-score">${esc(score)}<small>از ۱۰۰</small></span>
            </a>
            <button type="button" class="btn btn-primary btn-sm" data-compare-peer="${esc(
              String(p.id)
            )}">مقایسهٔ سریع</button>
          </div>`;
        })
        .join("")}</div>
    </section>`;
  };

  const prosConsHtml = (review) => {
    if (!review || (!review.pros && !review.cons)) return "";
    const splitLines = (text) =>
      String(text || "")
        .split(/[\n•·؛]| (?=[✓✕✖✗-])/)
        .map((x) => x.replace(/^[✓✕✖✗\-–—]\s*/, "").trim())
        .filter(Boolean);
    const pros = splitLines(review.pros);
    const cons = splitLines(review.cons);
    const prosBlock = review.pros
      ? `<div class="resource-pros rsc-pros">
          <h3>چرا بخرید؟</h3>
          ${
            pros.length > 1
              ? `<ul>${pros.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>`
              : `<p>${esc(review.pros)}</p>`
          }
        </div>`
      : "";
    const consBlock = review.cons
      ? `<div class="resource-cons rsc-cons">
          <h3>حواستان باشد</h3>
          ${
            cons.length > 1
              ? `<ul>${cons.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`
              : `<p>${esc(review.cons)}</p>`
          }
        </div>`
      : "";
    return `<section class="resource-panel resource-panel--split rsc-proscons">
      ${prosBlock}${consBlock}
    </section>`;
  };

  const galleryHtml = (gallery) => {
    if (!Array.isArray(gallery) || !gallery.length) return "";
    return `<section class="resource-panel rsc-preview">
      <h2 class="resource-subhead">پیش‌نمایش صفحات</h2>
      <div class="resource-gallery">${gallery
        .slice(0, 3)
        .map(
          (g, i) =>
            `<button type="button" class="rsc-gallery-btn" data-lightbox-open="${i}">
              <figure>
                <img src="${esc(g.url)}" alt="" loading="lazy" decoding="async" />
                ${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ""}
              </figure>
            </button>`
        )
        .join("")}</div>
    </section>`;
  };

  const semanticBars = (items, valueKey = "value") => {
    if (!Array.isArray(items) || !items.length) return "";
    return `<div class="resource-bars resource-bars--semantic" data-animate-charts>${items
      .map((it, idx) => {
        const v = Math.max(0, Math.min(100, Number(it[valueKey] ?? it.pct) || 0));
        const label = it.label_fa || it.name || it.code || "";
        const tone = v >= 70 ? "good" : v >= 45 ? "mid" : "warn";
        const extra =
          it.score != null && it.max != null
            ? `<em title="${esc(`خام ${it.score}/${it.max}`)}">${esc(
                scoreOutOf10Label(it.score, it.max, it.pct ?? v)
              )}</em>`
            : `<em>${esc(toFa(v))}٪</em>`;
        return `<div class="resource-bar resource-bar--${tone}" style="--bar-delay:${idx * 70}ms">
          <div class="resource-bar-head"><span>${esc(label)}</span>${extra}</div>
          <div class="resource-bar-track"><i data-bar-width="${v}" style="width:0%"></i></div>
        </div>`;
      })
      .join("")}</div>`;
  };

  const buildFaqItems = (s) => {
    const name = toFa(String(s.name || "منبع").trim());
    const bookMeta = s.book_meta && typeof s.book_meta === "object" ? s.book_meta : {};
    const review = s.review && typeof s.review === "object" ? s.review : null;
    const score = Number(review?.total_score ?? s.quality_score);
    const labels = bookMeta.labels_fa || {};
    const chCount = Array.isArray(s.chapters_public)
      ? s.chapters_public.length
      : s.chapter_count;
    const total = Number(bookMeta.total_tests) || 0;
    const catalogPages = Number(bookMeta.total_pages) || 0;
    const studyPages = studyPagesForPlanner(s) || 0;
    const pages = studyPages || catalogPages;
    const defs = plannerDefaults(total, pages);
    const faqMode = total > 0 ? "tests" : pages > 0 ? "pages" : "tests";
    const faqDaily = faqMode === "pages" ? defs.dailyPages : defs.dailyTests;
    const faqPlan =
      total > 0 || pages > 0
        ? computePlanner(faqMode, faqDaily, total, pages)
        : null;
    const profile = Array.isArray(review?.level_profile) ? review.level_profile : [];
    const fitLevel = bestFitLevelLabel(review, bookMeta);
    const topLevels = (() => {
      const ranked = profile
        .slice()
        .map((p) => ({
          ...p,
          pct: Math.max(0, Number(p.pct != null ? p.pct : p.value) || 0),
        }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 2);
      if (ranked.length) {
        return ranked
          .map((p) => `${p.label_fa || p.code} (${toFa(Math.round(p.pct))}٪)`)
          .join(" و ");
      }
      return fitLevel || labels.dominant_level || "";
    })();
    const useCases = displayUseCases(review);
    const zeroPct = Math.max(
      0,
      Number(
        (
          useCases.find((u) => /صفر|zero/i.test(String(u.code || u.label_fa || ""))) ||
          {}
        ).pct ??
          (
            useCases.find((u) => /صفر|zero/i.test(String(u.code || u.label_fa || ""))) ||
            {}
          ).value
      ) || 0
    );

    const items = [];
    const answerPages =
      catalogPages > 0 && studyPages > 0 && catalogPages > studyPages
        ? catalogPages - studyPages
        : 0;
    const pagesFa =
      catalogPages > 0 && studyPages > 0 && answerPages > 0
        ? `دارای ${toFa(catalogPages)} صفحه (${toFa(studyPages)} صفحه درسنامه و تست + ${toFa(
            answerPages
          )} صفحه پاسخنامه تشریحی)`
        : catalogPages
          ? `دارای ${toFa(catalogPages)} صفحه`
          : studyPages
            ? `دارای ${toFa(studyPages)} صفحه`
            : "";
    const sizeFa = [
      bookMeta.edition_year ? `در چاپ ${toFa(bookMeta.edition_year)}` : "",
      pagesFa,
      total ? `و مجموعاً ${toFa(total)} تست` : "",
      chCount ? `در ${toFa(chCount)} فصل` : "",
    ]
      .filter(Boolean)
      .join(" ");
    items.push({
      q: `کتاب ${name} چند تست و چند صفحه دارد؟`,
      aFa: sizeFa ? `${sizeFa}.` : "جزئیات صفحه‌شمار در شناسنامه منبع ثبت شده است.",
    });
    items.push({
      q: `این کتاب برای چه سطحی از دانش‌آموزان مناسب است؟`,
      aFa:
        Number.isFinite(score) && score > 0
          ? `بر اساس ارزیابی کارشناسان بلوک (امتیاز ${toFa(
              Math.round(score)
            )} از ۱۰۰)، این منبع بیشترین تناسب را با ${
              topLevels || fitLevel || "سطح متوسط"
            } دارد و برای ${labels.primary_usage || "آموزش و تثبیت"} مناسب است.`
          : `مناسب ${fitLevel || labels.dominant_level || "سطح متوسط"} با کاربری ${
              labels.primary_usage || "آموزش و تثبیت"
            }.`,
    });
    if (faqPlan && faqPlan.days > 0 && (total > 0 || pages > 0)) {
      const unit = faqMode === "pages" ? "صفحه" : "تست";
      items.push({
        q: `چطور این کتاب را قبل از آزمون تمام کنیم؟`,
        aFa: `برنامهٔ ترکیبی درسنامه + تست: با روزی ${toFa(faqDaily)} ${unit}${
          faqPlan.secondary && faqPlan.secondary !== "—"
            ? ` (${faqPlan.secondary} در روز)`
            : ""
        } می‌توانید کل کتاب را در حدود ${toFa(faqPlan.days)} روز تمام کنید.`,
      });
    }
    const examName = primaryExamLabel(s);
    items.push({
      q: `آیا برای داوطلبی که کلاس آموزشی نمی‌رود (خودخوان)، این کتاب برای ${examName} کافی است؟`,
      aFa:
        zeroPct >= 55 || /آموزش|شروع|تثبیت/.test(String(labels.primary_usage || ""))
          ? `اگر هدف شروع خودآموز و تثبیت برای ${examName} باشد، ارزیابی بلوک نشان می‌دهد درسنامه و تست‌ها برای مطالعهٔ مستقل${
              Number.isFinite(score) ? ` (امتیاز ${toFa(Math.round(score))} از ۱۰۰)` : ""
            } قابل اتکا هستند؛ برای تست‌های فوق‌سنگین ممکن است منبع مکمل لازم شود.`
          : `برای مطالعهٔ کاملاً مستقل در مسیر ${examName}، ابتدا سطح خود را با نمونه صفحات بسنجید؛ اگر درسنامه روان نیست، کلاس یا منبع مفهومی مکمل توصیه می‌شود.`,
    });
    if (isDualTizhooshanAudience(s)) {
      items.push({
        q: `آیا کتاب ${name} برای تیزهوشان ششم هم قابل استفاده است؟`,
        aFa: `بله. مباحث هوش و استعداد تحلیلی (به‌ویژه تصویری و فضایی) بین آزمون سمپاد ششم به هفتم و نهم به دهم مشترک است. برای دانش‌آموز قوی ششم معمولاً چالشی و مفید است؛ برای نهم در بازه متوسط تا قوی می‌نشیند.`,
      });
    }
    return items;
  };

  const faqHtml = (s) => {
    const items = buildFaqItems(s);
    if (!items.length) return "";
    return `<section class="resource-panel rsc-faq" id="rsc-faq">
      <h2 class="resource-subhead">سؤالات متداول والدین و دانش‌آموزان</h2>
      <div class="resource-acc">${items
        .map(
          (f, i) => `<details class="resource-acc-item"${i === 0 ? " open" : ""}>
          <summary><span class="resource-acc-title">${esc(f.q)}</span>
            <span class="resource-acc-meta"><span class="resource-acc-chevron" aria-hidden="true"></span></span>
          </summary>
          <div class="resource-acc-body"><p>${esc(f.aFa || f.a)}</p></div>
        </details>`
        )
        .join("")}</div>
    </section>`;
  };

  const breadcrumbTrail = (s) => {
    const name = toFa(String(s.name || "منبع").trim());
    const kindFile = s.kind
      ? `${encodeURIComponent(s.kind)}.html`
      : "index.html";
    const kindHref = withAudience(kindFile);
    const crumbs = [
      { label: "بلوک", href: "../index.html" },
      { label: "بانک منابع", href: withAudience("index.html") },
    ];
    if (s.kind_label_fa || s.kind) {
      crumbs.push({ label: String(s.kind_label_fa || s.kind), href: kindHref });
    }
    // Google BreadcrumbList requires `item` (URL) on every crumb except we always set it.
    if (s.lesson) {
      const lessonQ = new URLSearchParams();
      if (audienceGrade) lessonQ.set("grade", audienceGrade);
      if (audienceGoal) lessonQ.set("exam_goal", audienceGoal);
      lessonQ.set("lesson", String(s.lesson).trim());
      crumbs.push({
        label: String(s.lesson),
        href: `${kindFile}?${lessonQ.toString()}`,
      });
    }
    crumbs.push({ label: name, href: null, isCurrent: true });
    return crumbs;
  };

  const applySeo = (s) => {
    const name = toFa(String(s.name || "منبع").trim());
    const bookMeta = s.book_meta && typeof s.book_meta === "object" ? s.book_meta : {};
    const review = s.review && typeof s.review === "object" ? s.review : null;
    const yearFa = bookMeta.edition_year ? ` - چاپ ${toFa(bookMeta.edition_year)}` : "";
    const title = toFa(
      String(s.seo_title || "").trim() ||
        `بررسی و تحلیل کتاب ${name}${yearFa} | سطح، تست و نمونه PDF - بلوک`
    );
    document.title = title;
    const score = Number(review?.total_score ?? s.quality_score);
    const fitLevel = bestFitLevelLabel(review, bookMeta);
    const desc =
      String(s.seo_description || "").trim() ||
      [
        `بررسی ${name} برای اولیا و دانش‌آموز`,
        fitLevel
          ? `سطح ${fitLevel}`
          : bookMeta.labels_fa?.dominant_level
            ? `سطح ${bookMeta.labels_fa.dominant_level}`
            : "",
        bookMeta.total_tests != null ? `${bookMeta.total_tests} تست` : "",
        bookMeta.total_pages != null ? `${bookMeta.total_pages} صفحه` : "",
        s.publisher || "",
      ]
        .filter(Boolean)
        .join(" · ")
        .slice(0, 160) ||
      "جزئیات منبع کمک‌آموزشی در بانک منابع بلوک";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute(
      "content",
      "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"
    );

    const pageUrlClean = (() => {
      const u = new URL(location.href);
      u.hash = "";
      // Keep only id for stable canonical (drop grade/exam_goal noise).
      const id = u.searchParams.get("id");
      u.search = "";
      if (id) u.searchParams.set("id", id);
      return u.toString();
    })();

    let canonical =
      document.getElementById("rsc-canonical") ||
      document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      canonical.id = "rsc-canonical";
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", pageUrlClean);

    const setOg = (prop, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", prop);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setOg("og:title", title);
    setOg("og:description", desc);
    setOg("og:url", pageUrlClean);
    setOg("og:type", "book");
    setOg("og:locale", "fa_IR");
    setOg("og:site_name", "بلوک");
    if (s.cover_url) setOg("og:image", String(s.cover_url));

    const authors = Array.isArray(s.authors)
      ? s.authors
      : String(s.authors || "")
          .split(/[,،]/)
          .map((x) => x.trim())
          .filter(Boolean);
    const faq = buildFaqItems(s);
    const crumbs = breadcrumbTrail(s);
    const pageUrl = pageUrlClean;
    const rating =
      Number.isFinite(score) && score > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Math.round((Math.round(score) / 20) * 10) / 10,
            bestRating: 5,
            worstRating: 1,
            ratingCount: 1,
          }
        : null;

    const isbnRaw = String(s.isbn || bookMeta.isbn || "").trim();
    const isbnOk = isbnRaw && isbnRaw !== "-" && /\d/.test(isbnRaw);
    const gtin13 = isbnOk ? isbnRaw.replace(/\D/g, "").slice(0, 13) : "";

    const graph = [
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => {
          const itemUrl = c.href
            ? new URL(c.href, location.href).href
            : pageUrl;
          return {
            "@type": "ListItem",
            position: i + 1,
            name: c.label,
            item: itemUrl,
          };
        }),
      },
      {
        "@type": "Book",
        "@id": `${pageUrl}#book`,
        name,
        description: desc,
        inLanguage: "fa",
        url: pageUrl,
        ...(s.publisher
          ? { publisher: { "@type": "Organization", name: s.publisher } }
          : {}),
        ...(authors.length
          ? { author: authors.map((a) => ({ "@type": "Person", name: a })) }
          : {}),
        ...(isbnOk ? { isbn: isbnRaw } : {}),
        ...(s.cover_url ? { image: s.cover_url } : {}),
        ...(rating ? { aggregateRating: rating } : {}),
      },
      {
        "@type": "Product",
        "@id": `${pageUrl}#product`,
        name,
        description: desc,
        ...(s.cover_url ? { image: s.cover_url } : {}),
        ...(isbnOk
          ? {
              sku: isbnRaw,
              ...(gtin13.length === 13 ? { gtin13 } : {}),
            }
          : {}),
        brand: { "@type": "Brand", name: s.publisher || "بلوک" },
        ...(rating ? { aggregateRating: rating } : {}),
      },
    ];
    if (faq.length) {
      graph.push({
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.aFa || f.a || "",
          },
        })),
      });
    }
    document.querySelectorAll("script[data-rsc-jsonld]").forEach((n) => n.remove());
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-rsc-jsonld", "1");
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": graph,
    });
    document.head.appendChild(script);

    const hero = document.querySelector(".resources-hero");
    if (hero) {
      hero.innerHTML = `<nav class="rsc-crumb" aria-label="مسیر صفحه">${crumbs
        .map((c, i) => {
          const sep =
            i < crumbs.length - 1
              ? `<span class="rsc-crumb-sep" aria-hidden="true">›</span>`
              : "";
          if (c.href) {
            return `<a href="${esc(c.href)}">${esc(c.label)}</a>${sep}`;
          }
          return `<span>${esc(c.label)}</span>${sep}`;
        })
        .join("")}</nav>`;
    }
  };

  const openLightbox = (gallery, startIdx) => {
    const items = (gallery || []).filter((g) => g && g.url).slice(0, 12);
    if (!items.length) return;
    let root = document.getElementById("rsc-lightbox");
    if (!root) {
      root = document.createElement("div");
      root.id = "rsc-lightbox";
      root.className = "rsc-lightbox";
      root.innerHTML = `<button type="button" class="rsc-lb-backdrop" data-lb-close aria-label="بستن"></button>
        <div class="rsc-lb-panel" role="dialog" aria-modal="true">
          <button type="button" class="rsc-lb-x" data-lb-close aria-label="بستن">×</button>
          <button type="button" class="rsc-lb-nav rsc-lb-prev" data-lb-prev aria-label="قبلی">‹</button>
          <figure><img data-lb-img alt="" /><figcaption data-lb-cap></figcaption></figure>
          <button type="button" class="rsc-lb-nav rsc-lb-next" data-lb-next aria-label="بعدی">›</button>
        </div>`;
      document.body.appendChild(root);
      root.addEventListener("click", (e) => {
        const state = root._lb || { items: [], idx: 0 };
        if (e.target.closest("[data-lb-close]")) {
          root.hidden = true;
          document.body.classList.remove("lightbox-open");
          return;
        }
        if (!state.items.length) return;
        if (e.target.closest("[data-lb-prev]")) {
          state.idx = (state.idx - 1 + state.items.length) % state.items.length;
          root._paintLb?.();
        }
        if (e.target.closest("[data-lb-next]")) {
          state.idx = (state.idx + 1) % state.items.length;
          root._paintLb?.();
        }
      });
    }
    root._lb = {
      items,
      idx: Math.max(0, Math.min(items.length - 1, startIdx || 0)),
    };
    root._paintLb = () => {
      const state = root._lb;
      const g = state.items[state.idx];
      if (!g) return;
      root.querySelector("[data-lb-img]").src = g.url;
      root.querySelector("[data-lb-cap]").textContent = g.caption || "";
    };
    root._paintLb();
    root.hidden = false;
    document.body.classList.add("lightbox-open");
  };

  let currentItem = null;

  const closeCompare = () => {
    document.getElementById("resource-compare-root")?.remove();
    document.body.classList.remove("compare-open");
  };

  const lessonTokens = (text) => {
    const stop = new Set(["و", "یا", "در", "از", "به", "با", "برای", "کتاب", "بخش", "جلد"]);
    return String(text || "")
      .split(/[^\u0600-\u06FFa-zA-Z0-9]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 1 && !stop.has(t));
  };

  const lessonSimilarity = (a, b) => {
    const ta = new Set(lessonTokens(a));
    const tb = new Set(lessonTokens(b));
    if (!ta.size || !tb.size) return 0;
    let inter = 0;
    ta.forEach((t) => {
      if (tb.has(t)) inter += 1;
    });
    return inter / new Set([...ta, ...tb]).size;
  };

  const fetchCompareCandidates = async (item) => {
    const fromPeers = (Array.isArray(item.peers) ? item.peers : []).filter(
      (p) => p && String(p.id) !== String(item.id)
    );
    if (fromPeers.length) return fromPeers;

    const aq = audienceQuery();
    aq.set("kind", String(item.kind || "book"));
    aq.set("limit", "24");
    aq.set("offset", "0");
    const tokens = lessonTokens(item.lesson || item.name || "");
    if (tokens.length) aq.set("q", tokens.slice(0, 3).join(" "));
    try {
      const data = await SITE.api(`/api/site/catalog/search?${aq}`);
      const items = (data.items || []).filter((p) => p && String(p.id) !== String(item.id));
      return items
        .map((p) => ({
          ...p,
          _sim: lessonSimilarity(item.lesson || "", p.lesson || "") ||
            lessonSimilarity(item.name || "", p.name || ""),
        }))
        .filter((p) => p._sim >= 0.25 || !tokens.length)
        .sort(
          (a, b) =>
            (b._sim || 0) - (a._sim || 0) ||
            (Number(b.quality_score) || 0) - (Number(a.quality_score) || 0)
        )
        .slice(0, 8);
    } catch (_) {
      return [];
    }
  };

  const renderCompareView = (a, b) => {
    const root = document.getElementById("resource-compare-root");
    if (!root) return;
    const body = root.querySelector("[data-compare-body]");
    if (!body) return;
    const ra = a.review || {};
    const rb = b.review || {};
    const scoreA = Math.round(Number(ra.total_score ?? a.quality_score ?? 0) || 0);
    const scoreB = Math.round(Number(rb.total_score ?? b.quality_score ?? 0) || 0);
    const delta = Math.abs(scoreA - scoreB);
    const nameA = a.name || "منبع فعلی";
    const nameB = b.name || "منبع دوم";
    let winnerHtml;
    const winTone = scoreA === scoreB ? "tie" : scoreA > scoreB ? "a" : "b";
    if (winTone === "tie") {
      winnerHtml = `<p class="cmp-winner cmp-winner--tie"><span class="cmp-winner-badge">مساوی</span><span class="cmp-winner-text">امتیاز کلی یکسان · هر دو ${toFa(scoreA)}</span></p>`;
    } else if (winTone === "a") {
      winnerHtml = `<p class="cmp-winner cmp-winner--a"><span class="cmp-winner-badge">برتر</span><span class="cmp-winner-text"><strong>${esc(nameA)}</strong> بالاتر · اختلاف ${toFa(delta)} امتیاز</span></p>`;
    } else {
      winnerHtml = `<p class="cmp-winner cmp-winner--b"><span class="cmp-winner-badge">برتر</span><span class="cmp-winner-text"><strong>${esc(nameB)}</strong> بالاتر · اختلاف ${toFa(delta)} امتیاز</span></p>`;
    }
    const coverCard = (s, tone, score, isWinner) => {
      const cover = (s.cover_url || "").trim();
      const img = cover
        ? `<img src="${esc(cover)}" alt="" />`
        : `<span class="cmp-peer-ph" aria-hidden="true"></span>`;
      const scored = Number.isFinite(score) && score > 0;
      return `<div class="cmp-hero-card cmp-hero-card--${tone}${isWinner ? " is-winner" : ""}">
        ${isWinner ? `<span class="cmp-hero-win">برتر</span>` : ""}
        <div class="cmp-hero-cover">${img}</div>
        <div class="cmp-hero-copy">
          <strong>${esc(s.name || "منبع")}</strong>
          <small>${esc([s.publisher, s.lesson].filter(Boolean).join(" · "))}</small>
        </div>
        ${
          scored
            ? `<div class="cmp-hero-ring">${scoreRing(score, { instant: true })}</div>`
            : `<div class="cmp-hero-noscore">ثبت نشده</div>`
        }
      </div>`;
    };
    const useA = displayUseCases(a.review).slice(0, 4);
    const useB = displayUseCases(b.review);
    const useByCode = new Map(useB.map((u) => [String(u.code || u.label_fa), u]));
    const useHtml = useA.length
      ? `<div class="cmp-use-grid">${useA
          .map((u) => {
            const key = String(u.code || u.label_fa);
            const other = useByCode.get(key) || {};
            const hasA = u.pct != null || u.value != null;
            const hasB = other.pct != null || other.value != null;
            const pa = Math.round(Number(u.pct ?? u.value) || 0);
            const pb = Math.round(Number(other.pct ?? other.value) || 0);
            return `<div class="cmp-use-row">
              <span>${esc(u.label_fa || u.code || "")}</span>
              <strong class="cmp-use--a">${hasA ? `${toFa(pa)}٪` : "ثبت نشده"}</strong>
              <strong class="cmp-use--b">${hasB ? `${toFa(pb)}٪` : "ثبت نشده"}</strong>
            </div>`;
          })
          .join("")}</div>`
      : "";
    const radarSvg = dualRadar(ra.sections || [], rb.sections || []);
    const metaTable = compareMetaTable(a, b);

    body.innerHTML = `
      <div class="cmp-head cmp-head--sticky">
        <button type="button" class="cmp-back" data-compare-back>← انتخاب دیگر</button>
        <h2>مقایسه منابع</h2>
        <button type="button" class="cmp-x" data-compare-close aria-label="بستن">×</button>
      </div>
      <div class="cmp-scroll">
        <div class="cmp-heroes">
          ${coverCard(a, "a", scoreA, winTone === "a")}
          <div class="cmp-vs" aria-hidden="true"><span>در برابر</span></div>
          ${coverCard(b, "b", scoreB, winTone === "b")}
        </div>
        ${winnerHtml}
        <div class="cmp-legend">
          <span class="cmp-legend--a">${esc(a.publisher || nameA)}</span>
          <span class="cmp-legend--b">${esc(b.publisher || nameB)}</span>
        </div>
        <h3 class="resource-subhead cmp-section-title">دوئل معیارها</h3>
        ${dualBars(ra.sections || [], rb.sections || []) || '<p class="resource-muted">معیاری ثبت نشده</p>'}
        ${
          radarSvg
            ? `<details class="cmp-radar-details">
                <summary>نمودار رادار معیارها</summary>
                <div class="cmp-radar-wrap">${radarSvg}</div>
              </details>
              <div class="cmp-radar-desktop">
                <h3 class="resource-subhead">نمودار رادار</h3>
                <div class="cmp-radar-wrap">${radarSvg}</div>
              </div>`
            : ""
        }
        ${
          useHtml
            ? `<h3 class="resource-subhead">تناسب کاربری</h3>${useHtml}`
            : ""
        }
        ${
          metaTable
            ? `<h3 class="resource-subhead">شناسنامه روبه‌رو</h3>${metaTable}`
            : ""
        }
      </div>
      <div class="cmp-actions cmp-actions--sticky">
        <a class="btn btn-ghost" href="${esc(
          withAudience(`item.html?id=${encodeURIComponent(a.id)}`)
        )}">منبع فعلی</a>
        <a class="btn btn-primary" href="${esc(
          withAudience(`item.html?id=${encodeURIComponent(b.id)}`)
        )}">منبع مقابل</a>
      </div>`;
    body.querySelector("[data-compare-back]")?.addEventListener("click", () =>
      openComparePicker(a)
    );
    body.querySelectorAll("[data-compare-close]").forEach((el) => {
      el.addEventListener("click", closeCompare);
    });
    paintCompareCharts(body);
  };

  const paintPeerPicker = (item, peers, body) => {
    if (!peers.length) {
      body.innerHTML = `
        <div class="cmp-head">
          <h2>مقایسه با منبع دیگر</h2>
          <button type="button" class="cmp-x" data-compare-close aria-label="بستن">×</button>
        </div>
        <p class="cat-empty">هنوز منبع مشابهی برای مقایسه پیدا نشد. منابع هم‌مبحث را از لیست بانک منابع باز کنید.</p>
        <div class="cmp-actions">
          <a class="btn btn-ghost" href="${esc(withAudience("book.html"))}">بانک کمک‌آموزشی</a>
          <button type="button" class="btn btn-primary" data-compare-close>بستن</button>
        </div>`;
      return;
    }
    body.innerHTML = `
      <div class="cmp-head">
        <h2>انتخاب منبع برای مقایسه</h2>
        <button type="button" class="cmp-x" data-compare-close aria-label="بستن">×</button>
      </div>
      <p class="resource-muted">منابع مشابه${
        item.lesson ? ` · ${esc(item.lesson)}` : ""
      }${audienceGrade ? ` · پایه ${esc(toFa(audienceGrade))}` : ""}</p>
      <div class="cmp-peer-list">${peers
        .map((p) => {
          const cover = (p.cover_url || "").trim();
          const score = p.quality_score != null ? toFa(p.quality_score) : "—";
          const thumb = cover
            ? `<img src="${esc(cover)}" alt="" loading="lazy" />`
            : `<span class="cmp-peer-ph" aria-hidden="true"></span>`;
          return `<button type="button" class="cmp-peer" data-peer-id="${esc(String(p.id))}">
            <span class="cmp-peer-cover">${thumb}</span>
            <span class="cmp-peer-main">
              <strong>${esc(p.name || "منبع")}</strong>
              <small>${esc([p.publisher, p.lesson].filter(Boolean).join(" · "))}</small>
            </span>
            <span class="cmp-peer-score">${esc(score)}</span>
          </button>`;
        })
        .join("")}</div>`;
    body.querySelectorAll("[data-peer-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const pid = btn.getAttribute("data-peer-id");
        body.innerHTML = `<p class="cat-empty">در حال آماده‌سازی مقایسه…</p>`;
        try {
          const aq = audienceQuery();
          const q = aq.toString();
          const data = await SITE.api(
            `/api/site/catalog/item/${encodeURIComponent(pid)}${q ? `?${q}` : ""}`
          );
          const other = data.item || {};
          cacheItem(pid, other);
          renderCompareView(item, other);
        } catch (e) {
          body.innerHTML = `<p class="cat-empty">${esc(e.message || "خطا")}</p>
            <div class="cmp-actions"><button type="button" class="btn btn-ghost" data-compare-back>بازگشت</button></div>`;
          body.querySelector("[data-compare-back]")?.addEventListener("click", () =>
            openComparePicker(item)
          );
        }
      });
    });
  };

  const openComparePicker = async (item) => {
    let root = document.getElementById("resource-compare-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "resource-compare-root";
      root.className = "resource-compare-sheet";
      root.innerHTML = `<div class="cmp-backdrop" data-compare-close></div>
        <div class="cmp-panel" role="dialog" aria-modal="true" aria-label="مقایسه منابع">
          <div data-compare-body></div>
        </div>`;
      document.body.appendChild(root);
      root.addEventListener("click", (e) => {
        if (e.target.closest("[data-compare-close]")) closeCompare();
      });
    }
    document.body.classList.add("compare-open");
    const body = root.querySelector("[data-compare-body]");
    body.innerHTML = `<p class="cat-empty">در حال پیدا کردن منابع مشابه…</p>`;
    const peers = await fetchCompareCandidates(item);
    paintPeerPicker(item, peers, body);
  };

  const compareWithPeer = async (item, peerId) => {
    openComparePicker(item);
    const root = document.getElementById("resource-compare-root");
    const body = root?.querySelector("[data-compare-body]");
    if (!body) return;
    body.innerHTML = `<p class="cat-empty">در حال بارگذاری مقایسه…</p>`;
    try {
      const aq = audienceQuery();
      const q = aq.toString();
      const data = await SITE.api(
        `/api/site/catalog/item/${encodeURIComponent(peerId)}${q ? `?${q}` : ""}`
      );
      const other = data.item || {};
      cacheItem(peerId, other);
      renderCompareView(item, other);
    } catch (e) {
      body.innerHTML = `<p class="cat-empty">${esc(e.message || "خطا")}</p>
        <div class="cmp-actions"><button type="button" class="btn btn-ghost" data-compare-back>بازگشت</button></div>`;
      body.querySelector("[data-compare-back]")?.addEventListener("click", () =>
        openComparePicker(item)
      );
    }
  };

  const scrollToPlanner = (e) => {
    const target = document.getElementById("rsc-planner");
    if (!target) return;
    e?.preventDefault?.();
    const reduce =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  };

  const bindItemActions = (s) => {
    itemEl.querySelectorAll("[data-scroll-planner]").forEach((el) => {
      el.addEventListener("click", scrollToPlanner);
    });
    document.querySelectorAll("[data-scroll-planner]").forEach((el) => {
      el.addEventListener("click", scrollToPlanner);
    });
    itemEl.querySelectorAll("[data-open-compare]").forEach((btn) => {
      btn.addEventListener("click", () => openComparePicker(s));
    });
    document.querySelectorAll("[data-sticky-compare]").forEach((btn) => {
      btn.addEventListener("click", () => openComparePicker(s));
    });
    itemEl.querySelectorAll("[data-compare-peer]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-compare-peer");
        if (pid) compareWithPeer(s, pid);
      });
    });
    const gallery = Array.isArray(s.gallery) ? s.gallery : [];
    itemEl.querySelectorAll("[data-lightbox-open]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openLightbox(gallery, Number(btn.getAttribute("data-lightbox-open") || 0));
      });
    });
    const planner = itemEl.querySelector("[data-planner]");
    if (planner) {
      const total = Number(planner.getAttribute("data-total-tests") || 0);
      const pages = Number(planner.getAttribute("data-total-pages") || 0);
      const range = planner.querySelector("[data-planner-range]");
      const dailyEl = planner.querySelector("[data-planner-daily]");
      const daysEl = planner.querySelector("[data-planner-days]");
      const pagesEl = planner.querySelector("[data-planner-pages]");
      const finishEl = planner.querySelector("[data-planner-finish]");
      const ctaEl = planner.querySelector("[data-planner-cta]");
      const leadEl = planner.querySelector("[data-planner-lead]");
      const labelEl = planner.querySelector("[data-planner-range-label]");
      const secondaryLabelEl = planner.querySelector("[data-planner-secondary-label]");
      const modeBtns = planner.querySelectorAll("[data-planner-mode-btn]");

      const applyRangeBounds = (mode) => {
        if (!range) return;
        if (mode === "pages") {
          range.min = "3";
          range.max = "50";
          range.step = "1";
          const def = Number(range.getAttribute("data-default-pages") || 10);
          range.value = String(Math.min(50, Math.max(3, def)));
        } else {
          range.min = "5";
          range.max = "80";
          range.step = "5";
          const def = Number(range.getAttribute("data-default-tests") || 20);
          range.value = String(Math.min(80, Math.max(5, def)));
        }
      };

      const paint = () => {
        const mode = planner.getAttribute("data-planner-mode") || "pages";
        const daily = Math.max(1, Number(range?.value) || 1);
        if (dailyEl) dailyEl.textContent = toFa(daily);
        const result = computePlanner(mode, daily, total, pages);
        if (daysEl) daysEl.textContent = toFa(result.days);
        if (pagesEl) pagesEl.textContent = result.secondary;
        if (secondaryLabelEl) secondaryLabelEl.textContent = result.secondaryLabel;
        if (leadEl) leadEl.textContent = result.lead;
        if (labelEl) labelEl.textContent = result.rangeLabel;
        if (finishEl) finishEl.textContent = formatJalaliFromToday(result.days);
        if (ctaEl) {
          ctaEl.textContent = `دریافت برنامهٔ ${toFa(
            result.days
          )} روزهٔ این کتاب در اپ بلوک`;
        }
      };

      modeBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          if (btn.disabled || btn.classList.contains("is-disabled")) return;
          const next = btn.getAttribute("data-planner-mode-btn") || "pages";
          planner.setAttribute("data-planner-mode", next);
          modeBtns.forEach((b) => {
            const on = b.getAttribute("data-planner-mode-btn") === next;
            b.classList.toggle("is-active", on);
            b.setAttribute("aria-selected", on ? "true" : "false");
          });
          applyRangeBounds(next);
          paint();
        });
      });

      range?.addEventListener("input", paint);
      paint();
    }
  };

  const ensureStickyBar = (s) => {
    const sample = (s.sample_pdf_url || "").trim();
    let bar = document.getElementById("rsc-sticky-cta");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "rsc-sticky-cta";
      bar.className = "rsc-sticky-cta";
      document.body.appendChild(bar);
      document.body.classList.add("has-rsc-sticky");
    }
    bar.innerHTML = `
      <a class="rsc-sticky-btn rsc-sticky-btn--primary" href="#rsc-planner" data-scroll-planner>برنامه</a>
      <button type="button" class="rsc-sticky-btn" data-sticky-compare>مقایسه</button>
      ${
        sample
          ? `<a class="rsc-sticky-btn" href="${esc(
              sample
            )}" target="_blank" rel="noopener noreferrer">نمونه PDF</a>`
          : `<a class="rsc-sticky-btn" href="${esc(
              withAudience("index.html")
            )}">منابع</a>`
      }`;
  };

  const renderItem = (s) => {
    currentItem = s;
    applySeo(s);
    ensureStickyBar(s);

    const sample = (s.sample_pdf_url || "").trim();
    const tint = (s.color || "").trim() || "#dbeafe";
    const coverPeek = sample
      ? `<a class="rsc-cover-peek" href="${esc(
          sample
        )}" target="_blank" rel="noopener noreferrer">
          ${iconSvg("peek")}
          <span>ورق زدن نمونه</span>
        </a>`
      : "";
    const coverBlock = `<div class="resource-hero-cover rsc-cover-3d">${coverHtml(s, {
      eager: true,
    })}${coverPeek}</div>`;
    const authors = Array.isArray(s.authors)
      ? s.authors.filter(Boolean)
      : String(s.authors || "")
          .split(/[,،]/)
          .map((x) => x.trim())
          .filter(Boolean);
    const byline = [s.publisher, authors.length ? authors.join("، ") : ""]
      .filter(Boolean)
      .join(" · ");
    const chips = tagChipsHtml(s);

    const review = s.review && typeof s.review === "object" ? s.review : null;
    const bookMeta = s.book_meta && typeof s.book_meta === "object" ? s.book_meta : {};
    const totalScore = review?.total_score ?? s.quality_score;
    const verbal = scoreVerbal(totalScore);

    const yearFa = bookMeta.edition_year ? ` - چاپ ${toFa(bookMeta.edition_year)}` : "";
    const h1 = `بررسی و تحلیل ${toFa(s.name || "منبع")}${yearFa}`;
    const sampleCta = sample
      ? `<a class="btn btn-ghost" href="${esc(
          sample
        )}" target="_blank" rel="noopener noreferrer">ورق زدن نمونه صفحات (PDF رایگان)</a>`
      : "";

    let chartsHtml = "";
    if (review || totalScore != null) {
      chartsHtml = `
        <section class="resource-panel resource-panel--score" id="rsc-score">
          <div class="resource-score-head">
            ${scoreRing(totalScore)}
            <div class="resource-score-copy">
              <h2>امتیاز کیفیت بلوک</h2>
              <span class="rsc-score-badge rsc-score-badge--${verbal.tone}">${esc(
                verbal.label
              )}</span>
              ${scoreMicroBadges(review, bookMeta)}
            </div>
          </div>
          ${
            review
              ? `${fitForChildHtml(s, review, bookMeta)}
          <div class="resource-chart-grid">
            <aside class="rsc-radar-card">
              <h3 class="resource-subhead">توازن ویژگی‌های کتاب</h3>
              <div class="resource-radar-wrap">${radarSvg(review.sections || [])}</div>
            </aside>
            <div>
              <h3 class="resource-subhead">تحلیل درسنامه، بانک تست و پاسخنامه</h3>
              ${sectionAccordion(review.sections || [])}
            </div>
          </div>`
              : ""
          }
        </section>`;
    }

    const gallery = Array.isArray(s.gallery) ? s.gallery : [];
    const peerCount = Array.isArray(s.peers)
      ? s.peers.filter((p) => p && p.id !== s.id).length
      : 0;
    const backHref = withAudience("index.html");
    const hasPlanner =
      Number(bookMeta.total_tests) > 0 || Number(bookMeta.total_pages) > 0;

    itemEl.innerHTML = `
      <article class="resource-detail resource-detail--rich">
        <div class="rsc-back-bar">
          <a class="rsc-back-link" href="${esc(backHref)}">
            <span class="rsc-back-ico" aria-hidden="true">→</span>
            بازگشت به بانک منابع
          </a>
        </div>
        <div class="resource-hero rsc-hero" style="--cover-tint:${esc(tint)}">
          <div class="rsc-hero-glow" aria-hidden="true"></div>
          ${coverBlock}
          <div class="resource-hero-copy">
            <h1>${esc(h1)}</h1>
            ${byline ? `<p class="rsc-byline">${esc(byline)}</p>` : ""}
            <div class="meta-row">${chips}</div>
            ${editorialBox(s, review, bookMeta)}
            <div class="resource-detail-actions rsc-hero-actions">
              ${
                hasPlanner
                  ? `<a class="btn btn-primary" href="#rsc-planner" data-scroll-planner>ساخت برنامهٔ مطالعه</a>`
                  : `<a class="btn btn-primary" href="../index.html#download" data-download-open>ساخت برنامهٔ مطالعه</a>`
              }
              ${sampleCta}
              <button type="button" class="btn btn-ghost" data-open-compare>
                مقایسه${peerCount ? ` (${esc(toFa(peerCount))})` : ""}
              </button>
            </div>
          </div>
        </div>
        <div class="resource-detail-body">
          ${identityStrip(s)}
          ${chartsHtml}
          ${prosConsHtml(review)}
          ${galleryHtml(gallery)}
          ${plannerHtml(s)}
          ${chaptersHtml(s)}
          ${advisorReviewHtml(s, review, bookMeta)}
          ${faqHtml(s)}
          ${peersHtml(s)}
        </div>
      </article>`;
    bindItemActions(s);
    animateCharts(itemEl);
  };

  if (itemEl) {
    const id = params.get("id") || "";
    if (!id) {
      itemEl.innerHTML = '<p class="cat-empty">شناسه منبع مشخص نشده.</p>';
      return;
    }
    const cached = readCachedItem(id);
    if (cached) renderItem(cached);
    const aq = audienceQuery();
    const q = aq.toString();
    SITE.api(`/api/site/catalog/item/${encodeURIComponent(id)}${q ? `?${q}` : ""}`)
      .then((data) => {
        const s = data.item || {};
        cacheItem(id, s);
        renderItem(s);
      })
      .catch((e) => {
        if (!cached) {
          itemEl.innerHTML = `<p class="cat-empty">${esc(e.message || "منبع یافت نشد")}</p>`;
        }
      });
  }

  renderFilterBar();
  wireAudienceLinks();
})();
