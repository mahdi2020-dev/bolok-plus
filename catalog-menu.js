(() => {
  const SITE = window.BolokSite;
  if (!SITE) return;

  const esc = SITE.esc;
  const root = () => SITE.rootPrefix() || "";

  const ICONS = {
    elementary:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 4l8 4-8 4-8-4 8-4z"/><path d="M4 12l8 4 8-4M4 16l8 4 8-4"/></svg>',
    middle:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
    high_theory:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 14 3-4 3 2 4-6"/></svg>',
    high_tech:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7 8h10v10H7z"/><path d="M10 8V5h4v3"/><path d="M9 18v2M15 18v2"/></svg>',
    exam_goals:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 11l2 2 4-5"/><rect x="4" y="4" width="16" height="16" rx="3"/></svg>',
    text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7 4h7l3 3v13H7z"/><path d="M14 4v3h3"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="6" width="14" height="12" rx="2"/><path d="m17 10 4-2v8l-4-2z"/></svg>',
    online: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 11l2 2 4-5"/><rect x="4" y="4" width="16" height="16" rx="3"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/></svg>',
    official_textbook:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5z"/></svg>',
    default:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>',
  };

  const iconFor = (key) => ICONS[key] || ICONS.default;

  const overlay = document.querySelector("[data-catalog-overlay]");
  const panel = document.querySelector("[data-catalog-panel]");
  const openBtns = document.querySelectorAll("[data-catalog-open]");
  if (!overlay || !panel || !openBtns.length) return;

  const titleEl = panel.querySelector("[data-catalog-title]");
  const backBtn = panel.querySelector("[data-catalog-back]");
  const closeBtn = panel.querySelector("[data-catalog-close]");
  const listEl = panel.querySelector("[data-catalog-list]");

  /** @type {{title:string, items:any[]}[]} */
  let stack = [];
  let menuData = null;
  let loading = false;
  /** @type {{grade?:string, exam_goal?:string}} */
  let audience = {};

  const seedAudienceFromUrl = () => {
    const sp = new URLSearchParams(location.search);
    const g = (sp.get("grade") || "").trim();
    const eg = (sp.get("exam_goal") || "").trim();
    audience = {};
    if (g) audience.grade = g;
    if (eg) audience.exam_goal = eg;
  };

  const setOpen = (open) => {
    overlay.classList.toggle("is-open", open);
    panel.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.classList.toggle("catalog-menu-open", open);
    openBtns.forEach((b) => b.setAttribute("aria-expanded", open ? "true" : "false"));
    // Close mobile drawer when opening catalog
    if (open) {
      document.body.classList.remove("nav-open");
      document.querySelector("[data-nav-drawer]")?.classList.remove("open");
      seedAudienceFromUrl();
    }
    if (open && !menuData && !loading) loadMenu();
  };

  const close = () => setOpen(false);

  const qsAudience = () => {
    const p = new URLSearchParams();
    if (audience.grade) p.set("grade", audience.grade);
    if (audience.exam_goal) p.set("exam_goal", audience.exam_goal);
    return p;
  };

  const withAudienceHref = (href) => {
    const raw = String(href || "").replace(/^\//, "");
    const hashIdx = raw.indexOf("#");
    let path = hashIdx >= 0 ? raw.slice(0, hashIdx) : raw;
    const hash = hashIdx >= 0 ? raw.slice(hashIdx) : "";
    const qIdx = path.indexOf("?");
    const base = qIdx >= 0 ? path.slice(0, qIdx) : path;
    const existing = new URLSearchParams(qIdx >= 0 ? path.slice(qIdx + 1) : "");
    existing.delete("grade");
    existing.delete("exam_goal");
    const aq = qsAudience();
    aq.forEach((v, k) => existing.set(k, v));
    const qs = existing.toString();
    return root() + base + (qs ? `?${qs}` : "") + hash;
  };

  const render = () => {
    const level = stack[stack.length - 1];
    if (!level) return;
    titleEl.textContent = level.title;
    backBtn.hidden = stack.length <= 1;
    listEl.innerHTML = "";
    if (!level.items.length) {
      listEl.innerHTML = '<li class="cat-empty">موردی در این دسته نیست.</li>';
      return;
    }
    level.items.forEach((item) => {
      const li = document.createElement("li");
      const iconKey = item.icon || item.kind || item.id || "default";
      if (item.type === "link") {
        li.innerHTML = `<a class="cat-row cat-row--link" href="${esc(item.href)}">
          <span class="cat-row-icon" aria-hidden="true">${iconFor(iconKey)}</span>
          <span class="cat-row-main">
            <span class="cat-row-title">${esc(item.title)}</span>
            ${item.meta ? `<span class="cat-row-meta">${esc(item.meta)}</span>` : ""}
          </span>
          <span class="cat-row-chevron" aria-hidden="true"></span>
        </a>`;
      } else {
        li.innerHTML = `<button type="button" class="cat-row">
          <span class="cat-row-icon" aria-hidden="true">${iconFor(iconKey)}</span>
          <span class="cat-row-main">
            <span class="cat-row-title">${esc(item.title)}</span>
            ${item.meta ? `<span class="cat-row-meta">${esc(item.meta)}</span>` : item.count != null && Number(item.count) > 0 ? `<span class="cat-row-meta">${esc(String(item.count))} منبع</span>` : ""}
          </span>
          <span class="cat-row-chevron" aria-hidden="true"></span>
        </button>`;
        li.querySelector("button")?.addEventListener("click", () => drill(item));
      }
      listEl.appendChild(li);
    });
  };

  async function loadMenu() {
    loading = true;
    listEl.innerHTML = '<li class="cat-empty">در حال بارگذاری…</li>';
    try {
      const data = await SITE.api("/api/site/catalog/menu");
      menuData = data;
      seedAudienceFromUrl();
      const grades = (data.grades || []).map((g) => ({
        type: "grade_cat",
        id: g.id,
        icon: g.id,
        title: g.title_fa,
        meta: g.subtitle || "",
        options: g.options || [],
        filter: g.filter || "grade",
      }));
      stack = [{ title: "بانک منابع", items: grades }];
      render();
      if (audience.grade || audience.exam_goal) {
        await pushFamilies();
      }
    } catch (e) {
      listEl.innerHTML = `<li class="cat-empty">${esc(e.message || "خطا در بارگذاری")}</li>`;
    } finally {
      loading = false;
    }
  }

  async function pushFamilies() {
    const label = audience.grade || audience.exam_goal || "بانک منابع";
    listEl.innerHTML = '<li class="cat-empty">در حال بارگذاری…</li>';
    try {
      const aq = qsAudience();
      const data = await SITE.api(`/api/site/catalog/menu?${aq}`);
      const families = (data.families || []).map((f) => ({
        type: "family",
        id: f.id,
        icon: f.id,
        title: f.title_fa,
        count: f.count,
        kinds: f.kinds || [],
        href: withAudienceHref(String(f.href || "resources/index.html")),
      }));
      stack.push({ title: `بانک منابع · ${label}`, items: families });
      render();
    } catch (e) {
      listEl.innerHTML = `<li class="cat-empty">${esc(e.message || "خطا در بارگذاری دسته‌ها")}</li>`;
    }
  }

  async function drill(item) {
    if (item.type === "grade_cat") {
      const opts = (item.options || []).map((opt) => ({
        type: "grade_opt",
        icon: item.id,
        title: opt,
        filter: item.filter || "grade",
        value: opt,
      }));
      stack.push({ title: item.title, items: opts });
      render();
      return;
    }

    if (item.type === "grade_opt") {
      audience = {};
      if (item.filter === "exam_goal") audience.exam_goal = item.value;
      else audience.grade = item.value;
      await pushFamilies();
      return;
    }

    if (item.type === "family") {
      const kinds = (item.kinds || []).map((k) => ({
        type: "kind",
        kind: k.kind,
        icon: k.kind,
        title: k.title_fa,
        count: k.count,
        href: withAudienceHref(`resources/${k.kind}.html`),
      }));
      kinds.unshift({
        type: "link",
        icon: item.id,
        title: `همه ${item.title}`,
        href: withAudienceHref(item.href),
        meta: "هاب دسته",
      });
      stack.push({ title: item.title, items: kinds });
      render();
      return;
    }

    if (item.type === "kind") {
      listEl.innerHTML = '<li class="cat-empty">در حال بارگذاری…</li>';
      try {
        const aq = qsAudience();
        aq.set("kind", item.kind);
        aq.set("limit", "40");
        const search = await SITE.api(`/api/site/catalog/search?${aq}`);
        const sources = (search.items || []).map((s) => ({
          type: "link",
          icon: item.kind,
          title: s.name || "منبع",
          meta: [s.lesson, s.publisher].filter(Boolean).join(" · "),
          href: withAudienceHref(
            `resources/item.html?id=${encodeURIComponent(s.id)}`
          ),
        }));
        const head = [
          {
            type: "link",
            icon: item.kind,
            title: `همه «${item.title}»`,
            href: withAudienceHref(item.href),
            meta: "لیست کامل",
          },
        ];
        stack.push({
          title: item.title,
          items: sources.length ? [...head, ...sources] : head,
        });
        render();
      } catch (e) {
        listEl.innerHTML = `<li class="cat-empty">${esc(e.message || "خطا")}</li>`;
      }
    }
  }

  openBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
    });
  });
  closeBtn?.addEventListener("click", close);
  backBtn?.addEventListener("click", () => {
    if (stack.length > 1) {
      stack.pop();
      if (stack.length === 1) audience = {};
      render();
    }
  });
  overlay.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
})();
