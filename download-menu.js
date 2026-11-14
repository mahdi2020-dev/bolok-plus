(() => {
  const PANEL_ID = "bolok-download-panel";
  const ASSET_V = "56";
  const STORE_URLS = {
    bazaar: "https://cafebazaar.ir/app/ir.bolok.app",
    myket: "https://myket.ir/app/ir.bolok.app",
  };

  const SITE_BASE = (() => {
    const s = document.querySelector('script[src*="download-menu.js"]');
    if (!s) return "";
    return (s.getAttribute("src") || "").replace(/download-menu\.js[^"]*$/i, "");
  })();

  const asset = (name) => `${SITE_BASE}assets/${name}?v=${ASSET_V}`;

  function ensurePanel() {
    let root = document.getElementById(PANEL_ID);
    if (root) return root;

    root = document.createElement("div");
    root.id = PANEL_ID;
    root.className = "dl-root";
    root.hidden = true;
    root.innerHTML = `
      <div class="dl-backdrop" data-dl-close tabindex="-1"></div>
      <div class="dl-popover" role="dialog" aria-modal="true" aria-labelledby="dl-popover-title">
        <button type="button" class="dl-close" data-dl-close aria-label="بستن">×</button>
        <div class="dl-hero">
          <img class="dl-hero-icon" src="${asset("app-icon.png")}" width="88" height="88" alt="" decoding="async" />
          <div class="dl-hero-copy">
            <p class="dl-kicker">اندروید</p>
            <h2 id="dl-popover-title">دانلود اپ بلوک</h2>
            <p class="dl-popover-lead">برنامه روزانه مطالعه را بلوکی بچین و پیشرفت را ثبت کن</p>
          </div>
        </div>
        <div class="dl-store-list">
          <a class="dl-store dl-store--bazaar" href="${STORE_URLS.bazaar}" target="_blank" rel="noopener noreferrer">
            <span class="dl-store-icon" aria-hidden="true">
              <img src="${asset("logo-bazaar.png")}" width="56" height="56" alt="" decoding="async" />
            </span>
            <span class="dl-store-copy">
              <span class="dl-store-label">دریافت از</span>
              <span class="dl-store-name">بازار</span>
            </span>
          </a>
          <a class="dl-store dl-store--myket" href="${STORE_URLS.myket}" target="_blank" rel="noopener noreferrer">
            <span class="dl-store-icon" aria-hidden="true">
              <img src="${asset("logo-myket.png")}" width="56" height="56" alt="" decoding="async" />
            </span>
            <span class="dl-store-copy">
              <span class="dl-store-label">دریافت از</span>
              <span class="dl-store-name">مایکت</span>
            </span>
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(root);
    return root;
  }

  const root = ensurePanel();
  let lastFocus = null;

  function openPanel() {
    lastFocus = document.activeElement;
    root.hidden = false;
    root.classList.remove("dl-anchored");
    const pop = root.querySelector(".dl-popover");
    if (pop) {
      pop.style.removeProperty("--dl-top");
      pop.style.removeProperty("--dl-left");
      pop.style.removeProperty("--dl-width");
    }
    requestAnimationFrame(() => root.classList.add("is-open"));
    const closeBtn = root.querySelector(".dl-close");
    if (closeBtn) closeBtn.focus({ preventScroll: true });
    document.documentElement.classList.add("dl-menu-open");
  }

  function closePanel() {
    root.classList.remove("is-open");
    document.documentElement.classList.remove("dl-menu-open");
    window.setTimeout(() => {
      if (!root.classList.contains("is-open")) root.hidden = true;
    }, 220);
    if (lastFocus && typeof lastFocus.focus === "function") {
      try {
        lastFocus.focus({ preventScroll: true });
      } catch (_) {
        /* ignore */
      }
    }
  }

  function isDownloadTrigger(el) {
    if (!el || el.nodeType !== 1) return null;
    const marked = el.closest("[data-download-open]");
    if (marked) return marked;
    const a = el.closest("a[href]");
    if (!a) return null;
    const href = (a.getAttribute("href") || "").trim();
    if (href === "#download" || href.endsWith("#download") || /index\.html#download$/i.test(href)) {
      return a;
    }
    return null;
  }

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;

    if (t.closest("[data-dl-close]")) {
      e.preventDefault();
      closePanel();
      return;
    }

    const trigger = isDownloadTrigger(t);
    if (trigger) {
      e.preventDefault();
      openPanel();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("is-open")) {
      closePanel();
    }
  });

  if (location.hash === "#download") {
    history.replaceState(null, "", location.pathname + location.search);
    openPanel();
  }
})();
