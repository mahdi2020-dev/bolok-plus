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
        return `<text x="${x}" y="${y}" class="radar-label">${esc(sec.label_fa || sec.code || "")}</text>`;
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
    return `<div class="resource-score-ring" data-animate-charts aria-label="امتیاز کیفیت ${n} از ۱۰۰">
      <svg viewBox="0 0 100 100">
        <circle class="ring-bg" cx="50" cy="50" r="${r}" />
        <circle class="ring-fg" cx="50" cy="50" r="${r}"
          stroke-dasharray="${c.toFixed(1)}"
          stroke-dashoffset="${c.toFixed(1)}"
          data-ring-target="${offset.toFixed(1)}" />
      </svg>
      <div class="ring-num"><strong data-count-to="${n}">0</strong><span>از ۱۰۰</span></div>
    </div>`;
  };

  const barRows = (items, valueKey = "value") => {
    if (!Array.isArray(items) || !items.length) return "";
    return `<div class="resource-bars" data-animate-charts>${items
      .map((it, idx) => {
        const v = Math.max(0, Math.min(100, Number(it[valueKey] ?? it.pct) || 0));
        const label = it.label_fa || it.name || it.code || "";
        const extra =
          it.score != null && it.max != null
            ? `<em>${esc(String(it.score))}/${esc(String(it.max))}</em>`
            : `<em>${esc(String(v))}٪</em>`;
        return `<div class="resource-bar" style="--bar-delay:${idx * 70}ms">
          <div class="resource-bar-head"><span>${esc(label)}</span>${extra}</div>
          <div class="resource-bar-track"><i data-bar-width="${v}" style="width:0%"></i></div>
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
        return `<details class="resource-acc-item"${open}>
          <summary>
            <span class="resource-acc-title">${esc(sec.label_fa || sec.code || "")}</span>
            <span class="resource-acc-meta">
              <em>${esc(String(sec.score ?? 0))}/${esc(String(sec.max ?? 0))}</em>
              <span class="resource-acc-chevron" aria-hidden="true"></span>
            </span>
          </summary>
          <div class="resource-acc-body">${body}</div>
        </details>`;
      })
      .join("")}</div>`;
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
          counter.textContent = String(Math.round(target * eased));
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
            <em>${esc(String(a.score ?? 0))}/${esc(String(a.max ?? 0))} · ${esc(
          String(b.score ?? 0)
        )}/${esc(String(b.max ?? a.max ?? 0))}</em>
          </div>
          <div class="resource-dual-track">
            <div class="resource-bar-track resource-bar-track--a"><i style="width:${pa}%"></i></div>
            <div class="resource-bar-track resource-bar-track--b"><i style="width:${pb}%"></i></div>
          </div>
        </div>`;
      })
      .join("")}</div>`;
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

  const bindItemActions = (s) => {
    itemEl.querySelector("[data-open-compare]")?.addEventListener("click", () => {
      openComparePicker(s);
    });
  };

  const renderItem = (s) => {
    currentItem = s;
    const sample = (s.sample_pdf_url || "").trim();
    const coverBlock = `<div class="resource-hero-cover">${coverHtml(s, { eager: true })}</div>`;
    const chips = [
      s.kind_label_fa || s.kind,
      s.help_book_main_type_label_fa,
      s.lesson,
      s.publisher,
      ...(s.student_grades || []).slice(0, 8),
      ...(s.exam_goals || []).slice(0, 8),
    ]
      .filter(Boolean)
      .map((c) => `<span class="chip">${esc(String(c))}</span>`)
      .join("");

    const review = s.review && typeof s.review === "object" ? s.review : null;

    let chartsHtml = "";
    if (review) {
      const useBars = barRows(review.use_case_scores || []);
      const profileBars = barRows(review.level_profile || []);
      chartsHtml = `
        <section class="resource-panel resource-panel--score">
          <div class="resource-score-head">
            ${scoreRing(review.total_score ?? s.quality_score)}
            <div class="resource-score-copy">
              <h2>امتیاز کیفیت بلوک</h2>
              <p>بر اساس درسنامه، بانک تست، پاسخنامه، استاندارد کنکور، تناسب سطح و ساختار کتاب. هر معیار را باز کنید تا زیرمعیارها را ببینید.</p>
              ${useBars}
            </div>
          </div>
          <div class="resource-chart-grid">
            <div class="resource-radar-wrap">${radarSvg(review.sections || [])}</div>
            <div>
              <h3 class="resource-subhead">معیارهای اصلی و جزئیات</h3>
              ${sectionAccordion(review.sections || [])}
              <h3 class="resource-subhead">پروفایل تناسب سطح</h3>
              ${profileBars}
            </div>
          </div>
        </section>`;
    }

    const statTiles = metaTiles(s);
    const statsHtml = statTiles.length
      ? `<section class="resource-panel"><h2 class="resource-subhead">شناسنامه منبع</h2>
          <div class="resource-stat-grid">${statTiles
            .map(
              ([k, v]) =>
                `<div class="resource-stat"><span>${esc(String(k))}</span><strong>${esc(
                  String(v)
                )}</strong></div>`
            )
            .join("")}</div></section>`
      : "";

    let prosCons = "";
    if (review && (review.pros || review.cons)) {
      prosCons = `<section class="resource-panel resource-panel--split">
        ${
          review.pros
            ? `<div class="resource-pros"><h3>نقاط قوت</h3><p>${esc(review.pros)}</p></div>`
            : ""
        }
        ${
          review.cons
            ? `<div class="resource-cons"><h3>محدودیت‌ها</h3><p>${esc(review.cons)}</p></div>`
            : ""
        }
      </section>`;
    }

    const blocks = Array.isArray(s.showcase_blocks) ? s.showcase_blocks : [];
    const showcaseHtml = blocks.length
      ? `<section class="resource-panel"><h2 class="resource-subhead">ویترین</h2>
          <div class="resource-showcase">${blocks
            .map((b) => {
              if (b.type === "image" && b.url) {
                return `<figure class="rsc-block rsc-block--image"><img src="${esc(
                  b.url
                )}" alt="" loading="lazy" />${
                  b.title ? `<figcaption>${esc(b.title)}</figcaption>` : ""
                }</figure>`;
              }
              if (b.type === "bullets" && Array.isArray(b.items)) {
                return `<div class="rsc-block"><h3>${esc(b.title || "نکات")}</h3><ul>${b.items
                  .map((i) => `<li>${esc(i)}</li>`)
                  .join("")}</ul></div>`;
              }
              if (b.type === "pros_cons") {
                const pros = Array.isArray(b.pros) ? b.pros : [];
                const cons = Array.isArray(b.cons) ? b.cons : [];
                return `<div class="rsc-block resource-panel--split">
                  <div class="resource-pros"><h3>مزایا</h3><ul>${pros
                    .map((i) => `<li>${esc(i)}</li>`)
                    .join("")}</ul></div>
                  <div class="resource-cons"><h3>محدودیت</h3><ul>${cons
                    .map((i) => `<li>${esc(i)}</li>`)
                    .join("")}</ul></div>
                </div>`;
              }
              return `<div class="rsc-block"><h3>${esc(b.title || "")}</h3><p>${esc(
                b.body || ""
              )}</p></div>`;
            })
            .join("")}</div></section>`
      : "";

    const gallery = Array.isArray(s.gallery) ? s.gallery : [];
    const galleryHtml = gallery.length
      ? `<div class="resource-gallery">${gallery
          .map(
            (g) =>
              `<figure><img src="${esc(g.url)}" alt="" loading="lazy" decoding="async" />${
                g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ""
              }</figure>`
          )
          .join("")}</div>`
      : "";

    const sampleBtn = sample
      ? `<a class="btn btn-light" href="${esc(sample)}" target="_blank" rel="noopener noreferrer">دانلود نمونه جزوه</a>`
      : "";
    const backHref = withAudience("index.html");
    const desc =
      s.description ||
      "این منبع در بانک منابع اپ بلوک منتشر شده است. جزئیات امتیاز و مقایسه با منابع هم‌درس را همین‌جا ببینید.";
    const peerCount = Array.isArray(s.peers) ? s.peers.filter((p) => p && p.id !== s.id).length : 0;

    itemEl.innerHTML = `
      <article class="resource-detail resource-detail--rich">
        <div class="resource-hero">
          ${coverBlock}
          <div class="resource-hero-copy">
            <h1>${esc(s.name || "منبع")}</h1>
            <div class="meta-row">${chips}</div>
            <p class="resource-desc">${esc(desc)}</p>
          </div>
        </div>
        <div class="resource-detail-body">
          ${chartsHtml}
          ${statsHtml}
          ${prosCons}
          ${showcaseHtml}
          ${galleryHtml}
          <div class="resource-detail-actions">
            <button type="button" class="btn btn-primary" data-open-compare>
              مقایسه با منبع دیگر${peerCount ? ` (${esc(String(peerCount))})` : ""}
            </button>
            ${sampleBtn}
            <a class="btn btn-ghost" href="${esc(backHref)}">بازگشت به بانک منابع</a>
          </div>
          <p class="resource-app-hint"><a href="../index.html#download" data-download-open>دانلود اپ بلوک</a> برای چیدن برنامه روزانه</p>
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
