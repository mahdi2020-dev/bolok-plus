(() => {
  const TOAST_MSG = "منتظر باشید، در حال انتشاریم";
  const PANEL_ID = "bolok-download-panel";

  const STORE_SVG = {
    bazaar:
      '<svg class="dl-store-mark" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2 3.6 7v10L12 21.8 20.4 17V7L12 2.2zm0 2.3 6.1 3.5v7L12 18.5l-6.1-3.5v-7L12 4.5z"/><path fill="currentColor" d="M12 8.2 8.4 10.3v3.4L12 15.8l3.6-2.1v-3.4L12 8.2z"/></svg>',
    myket:
      '<svg class="dl-store-mark" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.5 5.5h15v13h-15z" opacity=".15"/><path fill="currentColor" d="M7 8.2h2.2l1.6 4.4L12.4 8.2H15l-2.7 7.6h-2.2L7 8.2zm8.2 0H19v1.7h-2.1v1.5H18v1.6h-1.9v3H15.2V8.2z"/></svg>',
  };

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
        <div class="dl-popover-head">
          <h2 id="dl-popover-title">دانلود اپ بلوک</h2>
          <button type="button" class="dl-close" data-dl-close aria-label="بستن">×</button>
        </div>
        <p class="dl-popover-lead">از یکی از فروشگاه‌ها نصب کنید</p>
        <div class="dl-store-list">
          <button type="button" class="dl-store-btn" data-dl-store="bazaar">
            ${STORE_SVG.bazaar}
            <span class="dl-store-copy">
              <small>دریافت از</small>
              <strong>بازار</strong>
            </span>
          </button>
          <button type="button" class="dl-store-btn" data-dl-store="myket">
            ${STORE_SVG.myket}
            <span class="dl-store-copy">
              <small>دریافت از</small>
              <strong>مایکت</strong>
            </span>
          </button>
        </div>
      </div>
      <div class="dl-toast" data-dl-toast hidden role="status" aria-live="polite"></div>
    `;
    document.body.appendChild(root);
    return root;
  }

  const root = ensurePanel();
  const toastEl = root.querySelector("[data-dl-toast]");
  let toastTimer = 0;
  let lastFocus = null;

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    toastEl.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove("is-on");
      toastEl.hidden = true;
    }, 2600);
  }

  function openPanel(anchor) {
    lastFocus = document.activeElement;
    root.hidden = false;
    requestAnimationFrame(() => root.classList.add("is-open"));
    const closeBtn = root.querySelector(".dl-close");
    if (closeBtn) closeBtn.focus({ preventScroll: true });
    document.documentElement.classList.add("dl-menu-open");
    if (anchor && typeof anchor.getBoundingClientRect === "function") {
      positionNear(anchor);
    } else {
      root.querySelector(".dl-popover")?.style.removeProperty("--dl-top");
      root.querySelector(".dl-popover")?.style.removeProperty("--dl-left");
      root.classList.remove("dl-anchored");
    }
  }

  function positionNear(anchor) {
    const pop = root.querySelector(".dl-popover");
    if (!pop) return;
    const r = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(280, vw - 24);
    let left = r.left + r.width / 2 - width / 2;
    left = Math.max(12, Math.min(left, vw - width - 12));
    let top = r.bottom + 10;
    if (top + 220 > vh) top = Math.max(12, r.top - 220);
    pop.style.setProperty("--dl-top", `${Math.round(top)}px`);
    pop.style.setProperty("--dl-left", `${Math.round(left)}px`);
    pop.style.setProperty("--dl-width", `${width}px`);
    root.classList.add("dl-anchored");
  }

  function closePanel() {
    root.classList.remove("is-open");
    document.documentElement.classList.remove("dl-menu-open");
    window.setTimeout(() => {
      if (!root.classList.contains("is-open")) root.hidden = true;
    }, 180);
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
    if (a.classList.contains("mobile-download")) return a;
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

    const storeBtn = t.closest("[data-dl-store]");
    if (storeBtn && root.contains(storeBtn)) {
      e.preventDefault();
      showToast(TOAST_MSG);
      return;
    }

    const trigger = isDownloadTrigger(t);
    if (trigger) {
      e.preventDefault();
      openPanel(trigger);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("is-open")) {
      closePanel();
    }
  });

  if (location.hash === "#download") {
    history.replaceState(null, "", location.pathname + location.search);
    openPanel(null);
  }
})();
