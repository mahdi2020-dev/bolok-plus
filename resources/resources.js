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
    if (audienceGrade) chips.push(`<span class="chip">پایه: ${esc(audienceGrade)}</span>`);
    if (audienceGoal) chips.push(`<span class="chip">هدف: ${esc(audienceGoal)}</span>`);
    host.innerHTML = `<div class="resource-filter-active">${chips.join("")}</div>`;
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
        <h3>${esc(item.name || "منبع")}</h3>
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
        if (st) st.textContent = "منبعی یافت نشد.";
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

  renderFilterBar();

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
    bindInfinite(kindEl, (offset) => {
      const aq = audienceQuery();
      aq.set("kind", kind);
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

  const scoreRing = (score) => {
    const n = Math.max(0, Math.min(100, Number(score) || 0));
    const r = 42;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - n / 100);
    return `<div class="resource-score-ring" data-animate-charts aria-label="امتیاز کیفیت ${toFa(n)} از ۱۰۰">
      <svg viewBox="0 0 100 100">
        <circle class="ring-bg" cx="50" cy="50" r="${r}" />
        <circle class="ring-fg" cx="50" cy="50" r="${r}"
          stroke-dasharray="${c.toFixed(1)}"
          stroke-dashoffset="${c.toFixed(1)}"
          data-ring-target="${offset.toFixed(1)}" />
      </svg>
      <div class="ring-num"><strong data-count-to="${n}">${toFa(0)}</strong><span>از ۱۰۰</span></div>
    </div>`;
  };

  const humanSectionLabel = (sec) => {
    const code = String(sec?.code || "").trim();
    const raw = String(sec?.label_fa || sec?.code || "").trim();
    if (code === "ux_structure" || /ساختار\s*و\s*UX|UX/i.test(raw)) {
      return "طراحی ظاهری و خوانایی";
    }
    return raw;
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
    let hotCode = LEVEL_CODES.includes(dominant) ? dominant : "";
    if (!hotCode) {
      hotCode = rows.reduce((a, b) => (b.pct > a.pct ? b : a), rows[0]).code;
    }
    const proLine =
      firstSentence(review?.pros) ||
      "درسنامه و پوشش تست برای شروع و تثبیت مناسب است";
    const conLine =
      firstSentence(review?.cons) ||
      "برای دانش‌آموزان خیلی قوی ممکن است تست‌های فوق‌سنگین کم باشد";
    return `<div class="rsc-spectrum" data-animate-charts role="img" aria-label="پروفایل تناسب سطح">
      <div class="rsc-spectrum-track">${rows
        .map((r) => {
          const hot = r.code === hotCode ? " is-hot" : "";
          return `<div class="rsc-spectrum-seg${hot}" style="flex:${Math.max(r.pct, 12)}">
            <strong>${esc(r.label)}</strong>
            <em>${toFa(Math.round(r.pct))}٪</em>
          </div>`;
        })
        .join("")}</div>
      <p class="rsc-spectrum-hint">بخش پررنگ‌تر = سطح غالب ثبت‌شده در شناسنامهٔ بلوک</p>
      <ul class="rsc-spectrum-takeaways">
        <li class="is-pro"><span class="rsc-spectrum-ico" aria-hidden="true">✓</span><span>نقطه قوت اصلی: ${esc(proLine)}</span></li>
        <li class="is-con"><span class="rsc-spectrum-ico" aria-hidden="true">!</span><span>نکته مهم: ${esc(conLine)}</span></li>
      </ul>
    </div>`;
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

  const dualRadar = (secA, secB) => {
    if (!Array.isArray(secA) || secA.length < 3) return "";
    const n = secA.length;
    const cx = 120;
    const cy = 120;
    const R = 88;
    const angleAt = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const pt = (i, r) => {
      const a = angleAt(i);
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };
    const byCode = new Map((secB || []).map((s) => [s.code, s]));
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
    const polyA = secA
      .map((sec, i) => {
        const pct = Math.max(0, Math.min(100, Number(sec.pct) || 0)) / 100;
        return pt(i, R * pct).join(",");
      })
      .join(" ");
    const polyB = secA
      .map((sec, i) => {
        const other = byCode.get(sec.code) || {};
        const pct = Math.max(0, Math.min(100, Number(other.pct) || 0)) / 100;
        return pt(i, R * pct).join(",");
      })
      .join(" ");
    const labels = secA
      .map((sec, i) => {
        const [x, y] = pt(i, R + 18);
        return `<text x="${x}" y="${y}" class="radar-label">${esc(sec.label_fa || "")}</text>`;
      })
      .join("");
    return `<svg class="resource-radar" viewBox="0 0 240 240" role="img" aria-label="مقایسه معیارها">
      ${grid}${axes}
      <polygon points="${polyA}" class="radar-fill radar-fill--a" />
      <polygon points="${polyB}" class="radar-fill radar-fill--b" />
      ${labels}
    </svg>`;
  };

  const dualBars = (secA, secB) => {
    if (!Array.isArray(secA) || !secA.length) return "";
    const byCode = new Map((secB || []).map((s) => [s.code, s]));
    return `<div class="resource-bars resource-bars--dual">${secA
      .map((a) => {
        const b = byCode.get(a.code) || {};
        const pa = Math.max(0, Math.min(100, Number(a.pct) || 0));
        const pb = Math.max(0, Math.min(100, Number(b.pct) || 0));
        return `<div class="resource-bar resource-bar--dual">
          <div class="resource-bar-head"><span>${esc(a.label_fa || "")}</span>
            <em>${esc(scoreOutOf10Label(a.score, a.max, pa))} · ${esc(
              scoreOutOf10Label(b.score, b.max ?? a.max, pb)
            )}</em>
          </div>
          <div class="resource-dual-track">
            <div class="resource-bar-track resource-bar-track--a"><i style="width:${pa}%"></i></div>
            <div class="resource-bar-track resource-bar-track--b"><i style="width:${pb}%"></i></div>
          </div>
        </div>`;
      })
      .join("")}</div>`;
  };

  const toFa = (n) =>
    String(n ?? "").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

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
      .sort((a, b) => (Number(b.pct) || 0) - (Number(a.pct) || 0))[0];
    const level = labels.dominant_level || top?.label_fa || "—";
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
    const useCases = Array.isArray(review?.use_case_scores)
      ? review.use_case_scores
      : [];
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
    const pro = firstSentence(review?.pros);
    const con = firstSentence(review?.cons);

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
      pro ? `· ${pro}` : "",
      con ? `· توجه: ${con}` : "",
    ].filter(Boolean);
    return bits.join(" ");
  };

  const editorialBox = (s, review, bookMeta) => {
    const raw = String(s.editorial_verdict || "").trim();
    const useOperator = raw && !looksLikePublisherSlogan(raw);
    const text = useOperator ? raw : bolokVerdict(s, review, bookMeta);
    const soft = !useOperator;
    return `<aside class="rsc-verdict${soft ? " rsc-verdict--soft" : ""}" data-animate-charts>
      <span class="rsc-verdict-kicker">در یک نگاه · مناسب برای چه کسانی؟</span>
      <p>${esc(text)}</p>
    </aside>`;
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
    if (s.lesson) accents.push(String(s.lesson));
    if (s.help_book_main_type_label_fa) accents.push(String(s.help_book_main_type_label_fa));
    if (s.kind_label_fa || s.kind) muted.push(String(s.kind_label_fa || s.kind));
    mergeGradeLabels(s.student_grades).slice(0, 2).forEach((g) => muted.push(g));
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
      return `<span class="chip${accent ? " chip--accent" : ""}">${esc(key)}</span>`;
    };
    return [...accents.map((t) => chip(t, true)), ...muted.map((t) => chip(t, false))]
      .filter(Boolean)
      .slice(0, 7)
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
    return `<section class="resource-panel rsc-chapters">
      <h2 class="resource-subhead">نقشهٔ راه فصل‌ها</h2>
      <p class="resource-muted">${toFa(chapters.length)} فصل${
        bookTotal ? ` · حدود ${toFa(bookTotal)} تست` : ""
      }</p>
      <div class="resource-acc">${chapters
        .map((ch, idx) => {
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
              </span>
              <span class="resource-acc-chevron" aria-hidden="true"></span>
            </summary>
            <div class="resource-acc-body">${kidsHtml ||
              '<p class="resource-muted">زیربخش ثبت نشده.</p>'}</div>
          </details>`;
        })
        .join("")}</div>
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
      const secondary =
        t > 0 ? `~${toFa(Math.max(1, Math.ceil(t / days)))} تست` : "—";
      return {
        days,
        secondary,
        secondaryLabel: "حل تست روزانه",
        lead:
          p > 0
            ? `با ${toFa(p)} صفحه، ببین اگر از امروز شروع کنی کی تمام می‌شود.`
            : "حجم صفحهٔ کتاب برای برنامه‌ریزی ثبت نشده است.",
        rangeLabel: "روزی چند صفحه؟",
      };
    }
    const days = t > 0 ? Math.max(1, Math.ceil(t / d)) : 1;
    const secondary =
      p > 0 ? `~${toFa(Math.max(1, Math.ceil(p / days)))} صفحه` : "—";
    return {
      days,
      secondary,
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
    const pages = Number(bookMeta.total_pages) || 0;
    if (total <= 0 && pages <= 0) return "";
    const hasTests = total > 0;
    const hasPages = pages > 0;
    const mode = hasTests ? "tests" : "pages";
    const defs = plannerDefaults(total, pages);
    const daily = mode === "pages" ? defs.dailyPages : defs.dailyTests;
    const initial = computePlanner(mode, daily, total, pages);
    const rangeMin = mode === "pages" ? 3 : 5;
    const rangeMax = mode === "pages" ? 50 : 80;
    const rangeStep = mode === "pages" ? 1 : 5;
    return `<section class="resource-panel rsc-planner rsc-planner--dark" data-planner data-total-tests="${total}" data-total-pages="${pages}" data-planner-mode="${mode}">
      <h2 class="resource-subhead">برنامه‌ریزی مطالعه</h2>
      <p class="resource-muted" data-planner-lead>${esc(initial.lead)}</p>
      <p class="rsc-planner-note">برنامهٔ ترکیبی شامل مطالعهٔ درسنامه + حل تست‌های روزانه است.</p>
      <div class="rsc-planner-modes" role="tablist" aria-label="حالت برنامه‌ریزی">
        <button type="button" class="rsc-planner-mode${mode === "tests" ? " is-active" : ""}${hasTests ? "" : " is-disabled"}" data-planner-mode-btn="tests" ${hasTests ? "" : "disabled"} role="tab" aria-selected="${mode === "tests"}">بر اساس تست</button>
        <button type="button" class="rsc-planner-mode${mode === "pages" ? " is-active" : ""}${hasPages ? "" : " is-disabled"}" data-planner-mode-btn="pages" ${hasPages ? "" : "disabled"} role="tab" aria-selected="${mode === "pages"}">بر اساس صفحه</button>
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
    return `<section class="resource-panel rsc-peers rsc-rivals">
      <div class="rsc-peers-head">
        <h2 class="resource-subhead">معمولاً با این منابع مقایسه می‌شود</h2>
        <button type="button" class="btn btn-ghost btn-sm" data-open-compare>همه</button>
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
    const name = String(s.name || "منبع").trim();
    const bookMeta = s.book_meta && typeof s.book_meta === "object" ? s.book_meta : {};
    const review = s.review && typeof s.review === "object" ? s.review : null;
    const score = Number(review?.total_score ?? s.quality_score);
    const labels = bookMeta.labels_fa || {};
    const chCount = Array.isArray(s.chapters_public)
      ? s.chapters_public.length
      : s.chapter_count;
    const total = Number(bookMeta.total_tests) || 0;
    const pages = Number(bookMeta.total_pages) || 0;
    const defs = plannerDefaults(total, pages);
    const faqMode = total > 0 ? "tests" : pages > 0 ? "pages" : "tests";
    const faqDaily = faqMode === "pages" ? defs.dailyPages : defs.dailyTests;
    const faqPlan =
      total > 0 || pages > 0
        ? computePlanner(faqMode, faqDaily, total, pages)
        : null;
    const dominantCode = String(bookMeta.dominant_level || "").trim().toLowerCase();
    const profile = Array.isArray(review?.level_profile) ? review.level_profile : [];
    const topLevels = (() => {
      if (dominantCode && LEVEL_LABELS[dominantCode]) {
        return labels.dominant_level || LEVEL_LABELS[dominantCode];
      }
      return profile
        .slice()
        .map((p) => ({
          ...p,
          pct: Math.max(0, Number(p.pct != null ? p.pct : p.value) || 0),
        }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 2)
        .map((p) => `${p.label_fa || p.code} (${toFa(Math.round(p.pct))}٪)`)
        .join(" و ");
    })();
    const useCases = Array.isArray(review?.use_case_scores)
      ? review.use_case_scores
      : [];
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
    const sizeFa = [
      bookMeta.edition_year ? `در چاپ ${toFa(bookMeta.edition_year)}` : "",
      pages ? `دارای ${toFa(pages)} صفحه` : "",
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
              topLevels || labels.dominant_level || "سطح متوسط"
            } دارد و برای ${labels.primary_usage || "آموزش و تثبیت"} مناسب است.`
          : `مناسب ${labels.dominant_level || "سطح متوسط"} با کاربری ${
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
    items.push({
      q: `آیا برای دانش‌آموزی که کلاس کنکور نمی‌رود این کتاب کافی است؟`,
      aFa:
        zeroPct >= 55 || /آموزش|شروع|تثبیت/.test(String(labels.primary_usage || ""))
          ? `اگر هدف شروع خودآموز و تثبیت باشد، ارزیابی بلوک نشان می‌دهد درسنامه و تست‌ها برای مطالعهٔ مستقل${
              Number.isFinite(score) ? ` (امتیاز ${toFa(Math.round(score))} از ۱۰۰)` : ""
            } قابل اتکا هستند؛ برای تست‌های فوق‌سنگین ممکن است منبع مکمل لازم شود.`
          : `برای مطالعهٔ کاملاً مستقل، ابتدا سطح خود را با نمونه صفحات بسنجید؛ اگر درسنامه روان نیست، کلاس یا منبع مفهومی مکمل توصیه می‌شود.`,
    });
    return items;
  };

  const faqHtml = (s) => {
    const items = buildFaqItems(s);
    if (!items.length) return "";
    return `<section class="resource-panel rsc-faq">
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
    const name = String(s.name || "منبع").trim();
    const kindHref = s.kind
      ? withAudience(`${encodeURIComponent(s.kind)}.html`)
      : withAudience("index.html");
    const crumbs = [
      { label: "بلوک", href: "../index.html" },
      { label: "بانک منابع", href: withAudience("index.html") },
    ];
    if (s.kind_label_fa || s.kind) {
      crumbs.push({ label: String(s.kind_label_fa || s.kind), href: kindHref });
    }
    if (s.lesson) crumbs.push({ label: String(s.lesson), href: null });
    crumbs.push({ label: name, href: null });
    return crumbs;
  };

  const applySeo = (s) => {
    const name = String(s.name || "منبع").trim();
    const title =
      String(s.seo_title || "").trim() ||
      `بررسی و تحلیل کتاب ${name} | سطح، تست و نمونه PDF - بلوک`;
    document.title = title;
    const bookMeta = s.book_meta && typeof s.book_meta === "object" ? s.book_meta : {};
    const review = s.review && typeof s.review === "object" ? s.review : null;
    const score = Number(review?.total_score ?? s.quality_score);
    const desc =
      String(s.seo_description || "").trim() ||
      [
        `بررسی ${name} برای اولیا و دانش‌آموز`,
        bookMeta.labels_fa?.dominant_level
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

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", location.href.split("#")[0]);

    const authors = Array.isArray(s.authors)
      ? s.authors
      : String(s.authors || "")
          .split(/[,،]/)
          .map((x) => x.trim())
          .filter(Boolean);
    const faq = buildFaqItems(s);
    const crumbs = breadcrumbTrail(s);
    const pageUrl = location.href.split("#")[0];
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

    const graph = [
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.label,
          ...(c.href
            ? { item: new URL(c.href, location.href).href }
            : i === crumbs.length - 1
              ? { item: pageUrl }
              : {}),
        })),
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
        ...(s.isbn || bookMeta.isbn
          ? { isbn: String(s.isbn || bookMeta.isbn) }
          : {}),
        ...(s.cover_url ? { image: s.cover_url } : {}),
        ...(rating ? { aggregateRating: rating } : {}),
      },
      {
        "@type": "Product",
        "@id": `${pageUrl}#product`,
        name,
        description: desc,
        ...(s.cover_url ? { image: s.cover_url } : {}),
        ...(s.isbn || bookMeta.isbn
          ? { sku: String(s.isbn || bookMeta.isbn), gtin13: String(s.isbn || bookMeta.isbn).replace(/\D/g, "").slice(0, 13) }
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
          acceptedAnswer: { "@type": "Answer", text: f.a },
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

  const renderCompareView = (a, b) => {
    const root = document.getElementById("resource-compare-root");
    if (!root) return;
    const ra = a.review || {};
    const rb = b.review || {};
    const scoreA = ra.total_score ?? a.quality_score ?? 0;
    const scoreB = rb.total_score ?? b.quality_score ?? 0;
    const tilesA = metaTiles(a)
      .slice(0, 6)
      .map(
        ([k, v]) =>
          `<div class="resource-stat"><span>${esc(String(k))}</span><strong>${esc(
            String(v)
          )}</strong></div>`
      )
      .join("");
    const tilesB = metaTiles(b)
      .slice(0, 6)
      .map(
        ([k, v]) =>
          `<div class="resource-stat"><span>${esc(String(k))}</span><strong>${esc(
            String(v)
          )}</strong></div>`
      )
      .join("");
    root.querySelector("[data-compare-body]").innerHTML = `
      <div class="cmp-head">
        <button type="button" class="cmp-back" data-compare-back>← انتخاب منبع دیگر</button>
        <h2>مقایسه منابع</h2>
      </div>
      <div class="cmp-names">
        <div class="cmp-name cmp-name--a">
          <span class="cmp-dot"></span>
          <strong>${esc(a.name || "منبع فعلی")}</strong>
          <small>${esc(a.publisher || a.lesson || "")}</small>
        </div>
        <div class="cmp-name cmp-name--b">
          <span class="cmp-dot"></span>
          <strong>${esc(b.name || "منبع دوم")}</strong>
          <small>${esc(b.publisher || b.lesson || "")}</small>
        </div>
      </div>
      <div class="cmp-score-row">
        ${scoreRing(scoreA)}
        <div class="cmp-radar-wrap">${dualRadar(ra.sections || [], rb.sections || [])}</div>
        ${scoreRing(scoreB)}
      </div>
      <div class="cmp-legend">
        <span class="cmp-legend--a">منبع فعلی</span>
        <span class="cmp-legend--b">منبع انتخابی</span>
      </div>
      <h3 class="resource-subhead">معیارهای اصلی</h3>
      ${dualBars(ra.sections || [], rb.sections || [])}
      <div class="cmp-meta-grid">
        <div><h3 class="resource-subhead">شناسنامه · فعلی</h3><div class="resource-stat-grid">${
          tilesA || '<p class="resource-muted">—</p>'
        }</div></div>
        <div><h3 class="resource-subhead">شناسنامه · انتخابی</h3><div class="resource-stat-grid">${
          tilesB || '<p class="resource-muted">—</p>'
        }</div></div>
      </div>
      <div class="cmp-actions">
        <a class="btn btn-ghost" href="${esc(
          withAudience(`item.html?id=${encodeURIComponent(b.id)}`)
        )}">مشاهده منبع انتخابی</a>
        <button type="button" class="btn btn-primary" data-compare-close>بستن</button>
      </div>`;
    root.querySelector("[data-compare-back]")?.addEventListener("click", () => openComparePicker(a));
    root.querySelector("[data-compare-close]")?.addEventListener("click", closeCompare);
  };

  const openComparePicker = (item) => {
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
    const peers = Array.isArray(item.peers) ? item.peers.filter((p) => p && p.id !== item.id) : [];
    const body = root.querySelector("[data-compare-body]");
    if (!peers.length) {
      body.innerHTML = `
        <div class="cmp-head">
          <h2>مقایسه با منبع دیگر</h2>
          <button type="button" class="cmp-x" data-compare-close aria-label="بستن">×</button>
        </div>
        <p class="cat-empty">منبع هم‌درس دیگری برای مقایسه نیست.</p>
        <div class="cmp-actions"><button type="button" class="btn btn-ghost" data-compare-close>بستن</button></div>`;
      return;
    }
    body.innerHTML = `
      <div class="cmp-head">
        <h2>انتخاب منبع برای مقایسه</h2>
        <button type="button" class="cmp-x" data-compare-close aria-label="بستن">×</button>
      </div>
      <p class="resource-muted">منابع هم‌درس${
        audienceGrade ? ` · پایه ${esc(audienceGrade)}` : ""
      }</p>
      <div class="cmp-peer-list">${peers
        .map((p) => {
          const cover = (p.cover_url || "").trim();
          const score = p.quality_score != null ? String(p.quality_score) : "—";
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
        body.innerHTML = `<p class="cat-empty">در حال بارگذاری مقایسه…</p>`;
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

  const bindItemActions = (s) => {
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
        const mode = planner.getAttribute("data-planner-mode") || "tests";
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
          const next = btn.getAttribute("data-planner-mode-btn") || "tests";
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
      <a class="rsc-sticky-btn rsc-sticky-btn--primary" href="../index.html#download" data-download-open>برنامه</a>
      <button type="button" class="rsc-sticky-btn" data-sticky-compare>مقایسه</button>
      ${
        sample
          ? `<a class="rsc-sticky-btn" href="${esc(
              sample
            )}" target="_blank" rel="noopener noreferrer">نمونه</a>`
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

    let chartsHtml = "";
    if (review || totalScore != null) {
      const useCards = useCaseCards(review?.use_case_scores || []);
      const spectrum = levelSpectrum(review?.level_profile || [], review, bookMeta);
      chartsHtml = `
        <section class="resource-panel resource-panel--score">
          <div class="resource-score-head">
            ${scoreRing(totalScore)}
            <div class="resource-score-copy">
              <h2>امتیاز کیفیت بلوک</h2>
              <span class="rsc-score-badge rsc-score-badge--${verbal.tone}">${esc(
                verbal.label
              )}</span>
              ${scoreMicroBadges(review, bookMeta)}
              ${useCards}
            </div>
          </div>
          ${
            review
              ? `<div class="resource-chart-grid">
            <aside class="rsc-radar-card">
              <h3 class="resource-subhead">توازن ویژگی‌های کتاب</h3>
              <div class="resource-radar-wrap">${radarSvg(review.sections || [])}</div>
            </aside>
            <div>
              <h3 class="resource-subhead">معیارهای اصلی و جزئیات</h3>
              ${sectionAccordion(review.sections || [])}
              <h3 class="resource-subhead">پروفایل تناسب سطح</h3>
              ${spectrum}
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

    itemEl.innerHTML = `
      <article class="resource-detail resource-detail--rich">
        <div class="resource-hero rsc-hero" style="--cover-tint:${esc(tint)}">
          <div class="rsc-hero-glow" aria-hidden="true"></div>
          ${coverBlock}
          <div class="resource-hero-copy">
            <h1>${esc(s.name || "منبع")}</h1>
            ${byline ? `<p class="rsc-byline">${esc(byline)}</p>` : ""}
            <div class="meta-row">${chips}</div>
            ${editorialBox(s, review, bookMeta)}
            <div class="resource-detail-actions rsc-hero-actions">
              <a class="btn btn-primary" href="../index.html#download" data-download-open>ساخت برنامهٔ مطالعه</a>
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
          ${chaptersHtml(s)}
          ${plannerHtml(s)}
          ${faqHtml(s)}
          ${peersHtml(s)}
          <div class="resource-detail-actions">
            <a class="btn btn-ghost" href="${esc(backHref)}">بازگشت به بانک منابع</a>
          </div>
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
})();
