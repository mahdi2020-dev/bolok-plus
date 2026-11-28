(() => {
  const S = () => window.BolokSite;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const STATUS_FA = {
    draft: "پیش‌نویس",
    pending_review: "در انتظار بررسی",
    needs_revision: "نیازمند اصلاح",
    rejected: "غیرقابل پذیرش",
    pending_payment: "در انتظار پرداخت پیش‌فاکتور",
    in_preparation: "در حال کمک جزوه‌نویسی",
    awaiting_author_approval: "تأیید نسخه نهایی",
    ready_to_publish: "آماده انتشار",
    published: "منتشرشده",
    suspended: "معلق",
    stopped: "متوقف",
  };

  function buzz(pattern = [35, 45, 55]) {
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (_) {}
  }

  function clearFieldErrors(root = document) {
    root
      .querySelectorAll(".is-field-error, .is-invalid")
      .forEach((node) => {
        node.classList.remove("is-field-error", "is-invalid");
      });
  }

  function fieldFromErrorText(text) {
    const t = String(text || "");
    if (/رشته/.test(t)) return "#major";
    if (/درس/.test(t)) return "#course_name";
    if (/توضیح|محتویات|outline/i.test(t)) return "#outline_text";
    if (/عنوان/.test(t)) return "#title";
    if (/توضیحات|خلاصه|summary/i.test(t)) return "#summary";
    if (/PDF|پی‌دی‌اف|فایل PDF/i.test(t)) return "#file_pdf";
    if (/تعهد|حقوق|حقوقی|سلامت/.test(t)) return "#rights";
    return null;
  }

  function friendlyErrText(text) {
    const raw = String(text || "").trim();
    if (!raw) return "خطا";
    if (/failed to fetch|networkerror|load failed/i.test(raw)) {
      return "ارتباط با سرور برقرار نشد. بعد از ۱ ساعت دوباره امتحان کنید.";
    }
    return raw;
  }

  function showStickyErr(text) {
    let toast = document.getElementById("jh-sticky-err");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "jh-sticky-err";
      toast.className = "jh-sticky-err";
      toast.setAttribute("role", "alert");
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="jh-sticky-err-mark" aria-hidden="true">!</span><span class="jh-sticky-err-text">${S().esc(
      friendlyErrText(text)
    )}</span>`;
    toast.hidden = false;
    toast.classList.remove("is-out");
    toast.classList.add("is-on", "is-shake");
    window.clearTimeout(toast._hideTimer);
    toast._hideTimer = window.setTimeout(() => {
      toast.classList.add("is-out");
      toast.classList.remove("is-on", "is-shake");
      window.setTimeout(() => {
        toast.hidden = true;
      }, 220);
    }, 4200);
  }

  function hideStickyErr() {
    const toast = document.getElementById("jh-sticky-err");
    if (!toast) return;
    toast.classList.add("is-out");
    toast.classList.remove("is-on", "is-shake");
    toast.hidden = true;
  }

  function msg(el, text, ok = false) {
    if (!el) return;
    const kind = ok ? "ok" : "err";
    const mark = ok ? "✓" : "!";
    const shown = ok ? text || "" : friendlyErrText(text);
    el.className = `jh-msg ${kind}`;
    el.innerHTML = `<span class="jh-msg-mark" aria-hidden="true">${mark}</span><span class="jh-msg-text">${S().esc(
      shown
    )}</span>`;
    el.hidden = false;
    el.setAttribute("role", ok ? "status" : "alert");
    el.classList.remove("is-shake");

    if (ok) {
      hideStickyErr();
      clearFieldErrors();
      return;
    }

    // Error: vibrate + sticky top banner + scroll so user sees it without hunting
    buzz();
    showStickyErr(text);
    void el.offsetWidth;
    el.classList.add("is-shake");
    const fieldSel = fieldFromErrorText(text);
    clearFieldErrors();
    const field = fieldSel ? document.querySelector(fieldSel) : null;
    if (field) {
      field.classList.add("is-field-error");
      const wrap = field.closest("label") || field;
      wrap.classList?.add("is-field-error");
      try {
        field.focus({ preventScroll: true });
      } catch (_) {
        try {
          field.focus();
        } catch (__) {}
      }
    }
    requestAnimationFrame(() => {
      const target = field?.closest("label") || field || el;
      try {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (_) {
        el.scrollIntoView({ block: "center" });
      }
      // Also keep the inline banner in view near the top of the form
      try {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } catch (_) {}
    });
  }

  function money(n) {
    return Number(n || 0).toLocaleString("fa-IR") + " تومان";
  }

  const DEFAULT_UNIT_TIERS = { 1: 99000, 2: 199000, 3: 299000, 4: 399000 };

  function unitCountOf(p) {
    const u = Number(p?.unit_count || 0);
    if (u >= 1 && u <= 4) return u;
    return 2;
  }

  function unitBadgeHtml(p) {
    const free = Number(p?.price_irt || 0) <= 0;
    if (free) return "";
    const u = unitCountOf(p);
    return `<span class="jh-badge jh-badge--units">${toFaDigits(u)} واحدی</span>`;
  }

  function tierPriceIrt(units, meta) {
    const tiers = meta?.unit_pricing?.tier_prices_irt || DEFAULT_UNIT_TIERS;
    const u = Number(units) || 2;
    const raw = tiers[u] ?? tiers[String(u)];
    return Number(raw || DEFAULT_UNIT_TIERS[u] || DEFAULT_UNIT_TIERS[2]);
  }

  /** جزوه‌سرا — درگاه لایو زرین‌پال (bolokapp.ir) */
  const PAY_ENV = "live";
  const PAYOUT_STATUS_FA = {
    pending: "در انتظار بررسی",
    approved: "تأیید شده",
    paid: "پرداخت‌شده",
    rejected: "رد شده",
  };

  let _pdfjsLoading = null;
  /** CDN cMaps/fonts keep typed Persian CID PDFs readable with vendored pdf.min.js. */
  const PDFJS_CMAP_URL =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/";
  const PDFJS_STANDARD_FONT_URL =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/";

  function pdfDocumentOpts(data) {
    return {
      data,
      cMapUrl: PDFJS_CMAP_URL,
      cMapPacked: true,
      standardFontDataUrl: PDFJS_STANDARD_FONT_URL,
      disableAutoFetch: false,
      disableStream: true,
      useSystemFonts: false,
    };
  }

  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (_pdfjsLoading) return _pdfjsLoading;
    _pdfjsLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "../assets/vendor/pdfjs/pdf.min.js";
      s.onload = () => {
        const lib = window.pdfjsLib;
        if (!lib) {
          reject(new Error("pdfjs"));
          return;
        }
        lib.GlobalWorkerOptions.workerSrc =
          "../assets/vendor/pdfjs/pdf.worker.min.js";
        resolve(lib);
      };
      s.onerror = () => reject(new Error("pdfjs"));
      document.head.appendChild(s);
    });
    return _pdfjsLoading;
  }

  async function mountPreviewFlipper(
    host,
    pamphletId,
    fallbackHtml,
    bookPages = 0
  ) {
    if (!host || !pamphletId) return;
    const bookTotal = Math.max(1, Math.floor(Number(bookPages) || 0) || 1);
    /** Tiers: <6→1, 6–10→3, ≥11→5 (server preview_pages matches). */
    const freePreviewCap = (n) => {
      const t = Math.max(0, Math.floor(Number(n) || 0));
      if (t < 6) return 1;
      if (t <= 10) return 3;
      return 5;
    };
    const PREVIEW_MAX = Math.max(1, Math.min(freePreviewCap(bookTotal), bookTotal));
    const clampPage = (n) =>
      Math.max(1, Math.min(PREVIEW_MAX, Math.floor(Number(n) || 1)));
    host.innerHTML = `
      <div class="jh-flip" data-flip>
        <div class="jh-flip-stage">
          <div class="jh-flip-sheet" data-flip-sheet>
            <canvas class="jh-flip-canvas" hidden></canvas>
          </div>
          <div class="jh-flip-fallback">${fallbackHtml || ""}</div>
          <div class="jh-flip-loading">
            <span class="jh-flip-spinner" aria-hidden="true"></span>
            <strong>در حال آماده‌سازی…</strong>
            <span>پیش‌نمایش رایگان تا ${toFaDigits(PREVIEW_MAX)} صفحه از ${toFaDigits(bookTotal)}</span>
          </div>
          <div class="jh-flip-error" hidden>
            <strong>پیش‌نمایش لود نشد</strong>
            <span>اتصال را چک کن یا دوباره تلاش کن</span>
            <button type="button" class="jh-btn secondary" data-flip-retry>تلاش دوباره</button>
          </div>
          <div class="jh-flip-lock" data-flip-lock hidden>
            <strong>ادامه بعد از خرید</strong>
            <span>پیش‌نمایش رایگان فقط تا صفحه ${toFaDigits(PREVIEW_MAX)} است</span>
          </div>
          <button type="button" class="jh-flip-zoom-fab" data-flip-zoom-open hidden title="بزرگ‌نمایی">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M11 8v6M8 11h6"/></svg>
            <span>بزرگ‌نمایی</span>
          </button>
        </div>
        <div class="jh-flip-bar">
          <button type="button" class="jh-flip-btn jh-flip-btn--prev" data-flip-prev aria-label="صفحه قبل" title="صفحه قبل">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
          </button>
          <div class="jh-flip-meta">
            <div class="jh-flip-pager" dir="rtl">
              صفحه <b data-flip-cur>۱</b>
              <span class="jh-flip-pager-sep">از</span>
              <b data-flip-book>${toFaDigits(bookTotal)}</b>
              <span class="jh-flip-free-hint">· رایگان تا ${toFaDigits(PREVIEW_MAX)}</span>
            </div>
            <div class="jh-flip-track" data-flip-track role="progressbar"
              aria-valuemin="1" aria-valuemax="${PREVIEW_MAX}" aria-valuenow="1"
              aria-label="پیش‌نمایش صفحات ۱ تا ${toFaDigits(PREVIEW_MAX)}">
              <span class="jh-flip-track-fill" data-flip-fill></span>
              <span class="jh-flip-track-knob" data-flip-knob></span>
            </div>
            <div class="jh-flip-dots" data-flip-dots aria-hidden="true"></div>
          </div>
          <button type="button" class="jh-flip-btn jh-flip-btn--next" data-flip-next aria-label="صفحه بعد" title="صفحه بعد">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
          </button>
        </div>
      </div>`;
    const canvas = host.querySelector(".jh-flip-canvas");
    const sheet = host.querySelector("[data-flip-sheet]");
    const fallback = host.querySelector(".jh-flip-fallback");
    const loading = host.querySelector(".jh-flip-loading");
    const errBox = host.querySelector(".jh-flip-error");
    const lockBox = host.querySelector("[data-flip-lock]");
    const zoomFab = host.querySelector("[data-flip-zoom-open]");
    const curEl = host.querySelector("[data-flip-cur]");
    const bookEl = host.querySelector("[data-flip-book]");
    const dotsEl = host.querySelector("[data-flip-dots]");
    const fillEl = host.querySelector("[data-flip-fill]");
    const knobEl = host.querySelector("[data-flip-knob]");
    const trackEl = host.querySelector("[data-flip-track]");
    const prevBtn = host.querySelector("[data-flip-prev]");
    const nextBtn = host.querySelector("[data-flip-next]");
    const retryBtn = host.querySelector("[data-flip-retry]");
    let pdf = null;
    let pageNo = 1;
    let previewTotal = PREVIEW_MAX;
    let busy = false;
    let lockFlash = null;
    let zoomOverlay = null;

    const paintDots = () => {
      if (!dotsEl) return;
      dotsEl.innerHTML = Array.from({ length: previewTotal }, (_, i) => {
        const n = i + 1;
        return `<button type="button" class="jh-flip-dot${
          n === pageNo ? " on" : ""
        }" data-flip-goto="${n}" aria-label="صفحه ${toFaDigits(n)}"></button>`;
      }).join("");
      dotsEl.querySelectorAll("[data-flip-goto]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const n = clampPage(btn.getAttribute("data-flip-goto"));
          if (n <= previewTotal) renderPage(n);
        });
      });
    };

    const setUi = () => {
      if (curEl) curEl.textContent = toFaDigits(pageNo);
      if (bookEl) bookEl.textContent = toFaDigits(bookTotal);
      const pct =
        previewTotal <= 1 ? 100 : ((pageNo - 1) / (previewTotal - 1)) * 100;
      if (fillEl) fillEl.style.width = `${Math.max(8, pct)}%`;
      if (knobEl) knobEl.style.insetInlineStart = `calc(${pct}% - 0.45rem)`;
      if (trackEl) trackEl.setAttribute("aria-valuenow", String(pageNo));
      if (prevBtn) prevBtn.disabled = !pdf || pageNo <= 1 || busy;
      if (nextBtn) {
        const atEnd = pageNo >= previewTotal;
        const moreLocked = bookTotal > previewTotal;
        nextBtn.disabled = !pdf || busy || (atEnd && !moreLocked);
        nextBtn.classList.toggle("is-locked", !!pdf && atEnd && moreLocked);
        nextBtn.title =
          atEnd && moreLocked ? "ادامه بعد از خرید" : "صفحه بعد";
      }
      if (zoomFab) zoomFab.hidden = !pdf || canvas?.hidden;
      paintDots();
    };

    const flashLock = () => {
      if (!lockBox) return;
      lockBox.hidden = false;
      if (lockFlash) window.clearTimeout(lockFlash);
      lockFlash = window.setTimeout(() => {
        lockBox.hidden = true;
      }, 1600);
    };

    const showState = (mode) => {
      if (loading) loading.hidden = mode !== "loading";
      if (errBox) errBox.hidden = mode !== "error";
      if (fallback) fallback.hidden = mode !== "fallback" && mode !== "error";
      if (canvas) canvas.hidden = mode !== "ready";
      if (sheet) sheet.hidden = mode !== "ready";
      if (lockBox && mode !== "ready") lockBox.hidden = true;
      if (zoomFab) zoomFab.hidden = mode !== "ready";
    };

    const renderPdfPageToCanvas = async (page, targetCanvas, fitW, fitH, minScale = 1) => {
      const base = page.getViewport({ scale: 1 });
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const fit = Math.min(fitW / base.width, fitH / base.height);
      const cssScale = Math.max(minScale, fit);
      const vp = page.getViewport({ scale: cssScale * dpr });
      const ctx = targetCanvas.getContext("2d", { alpha: false });
      targetCanvas.width = Math.floor(vp.width);
      targetCanvas.height = Math.floor(vp.height);
      targetCanvas.style.width = `${Math.floor(vp.width / dpr)}px`;
      targetCanvas.style.height = `${Math.floor(vp.height / dpr)}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      return { cssW: Math.floor(vp.width / dpr), cssH: Math.floor(vp.height / dpr) };
    };

    const renderPage = async (n) => {
      if (!pdf || !canvas || busy) return;
      const target = clampPage(Math.min(n, previewTotal));
      busy = true;
      setUi();
      try {
        const page = await pdf.getPage(target);
        const stage = host.querySelector(".jh-flip-stage");
        const wrapW = Math.max(
          260,
          (stage?.clientWidth || host.clientWidth || 320) - 20
        );
        const wrapH = Math.max(340, (stage?.clientHeight || 420) - 28);
        await renderPdfPageToCanvas(page, canvas, wrapW, wrapH, 0.95);
        pageNo = target;
        showState("ready");
      } catch (_) {
        showState(pdf ? "ready" : "fallback");
      } finally {
        busy = false;
        setUi();
      }
    };

    const closeZoom = () => {
      if (!zoomOverlay) return;
      zoomOverlay.remove();
      zoomOverlay = null;
      document.body.classList.remove("jh-preview-zoom-open");
    };

    const openZoom = async () => {
      if (!pdf) return;
      closeZoom();
      document.body.classList.add("jh-preview-zoom-open");
      zoomOverlay = document.createElement("div");
      zoomOverlay.className = "jh-preview-zoom";
      zoomOverlay.innerHTML = `
        <div class="jh-preview-zoom-panel" role="dialog" aria-modal="true" aria-label="بزرگ‌نمایی پیش‌نمایش">
          <header class="jh-preview-zoom-head">
            <div class="jh-preview-zoom-title">
              <span class="jh-preview-zoom-eyebrow">پیش‌نمایش رایگان</span>
              <strong data-z-title>صفحه ${toFaDigits(pageNo)} از ${toFaDigits(previewTotal)}</strong>
            </div>
            <div class="jh-preview-zoom-tools">
              <button type="button" class="jh-preview-zoom-tool" data-z-out title="کوچک‌تر">−</button>
              <button type="button" class="jh-preview-zoom-tool" data-z-reset title="اندازه صفحه" data-z-pct>۱۰۰٪</button>
              <button type="button" class="jh-preview-zoom-tool" data-z-in title="بزرگ‌تر">+</button>
              <button type="button" class="jh-preview-zoom-close" data-z-close aria-label="بستن">×</button>
            </div>
          </header>
          <div class="jh-preview-zoom-stage" data-z-stage>
            <canvas class="jh-preview-zoom-canvas" data-z-canvas></canvas>
          </div>
          <footer class="jh-preview-zoom-foot">
            <button type="button" class="jh-preview-zoom-nav" data-z-prev ${pageNo <= 1 ? "disabled" : ""}>صفحه قبل</button>
            <span class="jh-preview-zoom-hint">اسکرول برای زوم · درگ برای جابه‌جایی</span>
            <button type="button" class="jh-preview-zoom-nav" data-z-next ${pageNo >= previewTotal ? "disabled" : ""}>صفحه بعد</button>
          </footer>
        </div>`;
      document.body.appendChild(zoomOverlay);
      const zCanvas = zoomOverlay.querySelector("[data-z-canvas]");
      const zStage = zoomOverlay.querySelector("[data-z-stage]");
      const zPct = zoomOverlay.querySelector("[data-z-pct]");
      let zPage = pageNo;
      let zScale = 1;
      let panX = 0;
      let panY = 0;
      let contentW = 0;
      let contentH = 0;
      let dragging = false;
      let dragOrigin = null;
      let painting = false;

      const waitFrames = (n = 2) =>
        new Promise((resolve) => {
          let left = n;
          const tick = () => {
            left -= 1;
            if (left <= 0) resolve();
            else requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });

      const overflows = () => {
        if (!zStage) return false;
        return (
          contentW * zScale > zStage.clientWidth + 2 ||
          contentH * zScale > zStage.clientHeight + 2
        );
      };

      const clampPan = () => {
        if (!zStage) return;
        const maxX = Math.max(0, (contentW * zScale - zStage.clientWidth) / 2 + 28);
        const maxY = Math.max(0, (contentH * zScale - zStage.clientHeight) / 2 + 28);
        panX = Math.min(maxX, Math.max(-maxX, panX));
        panY = Math.min(maxY, Math.max(-maxY, panY));
      };

      const applyTransform = () => {
        if (!zCanvas) return;
        clampPan();
        zCanvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zScale})`;
        if (zPct) zPct.textContent = `${toFaDigits(Math.round(zScale * 100))}٪`;
        if (zStage) {
          zStage.classList.toggle("is-pannable", overflows());
          zStage.classList.toggle("is-zoomed", zScale > 1.01);
        }
      };

      const setZoom = (next) => {
        zScale = Math.min(4, Math.max(1, next));
        if (zScale <= 1.01) {
          zScale = 1;
          panX = 0;
          panY = 0;
        }
        applyTransform();
      };

      const paintZoomPage = async (n) => {
        if (!zCanvas || !zStage || painting) return;
        painting = true;
        try {
          await waitFrames(2);
          const target = clampPage(n);
          const page = await pdf.getPage(target);
          const fitW = Math.max(180, zStage.clientWidth - 48);
          const fitH = Math.max(180, zStage.clientHeight - 48);
          const painted = await renderPdfPageToCanvas(
            page,
            zCanvas,
            fitW,
            fitH,
            0.12
          );
          contentW = painted.cssW;
          contentH = painted.cssH;
          zPage = target;
          zScale = 1;
          panX = 0;
          panY = 0;
          applyTransform();
          const title = zoomOverlay.querySelector("[data-z-title]");
          if (title)
            title.textContent = `صفحه ${toFaDigits(zPage)} از ${toFaDigits(previewTotal)}`;
          const prev = zoomOverlay.querySelector("[data-z-prev]");
          const next = zoomOverlay.querySelector("[data-z-next]");
          if (prev) prev.disabled = zPage <= 1;
          if (next) next.disabled = zPage >= previewTotal;
        } finally {
          painting = false;
        }
      };

      let resizeTimer = 0;
      const onResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          paintZoomPage(zPage);
        }, 120);
      };
      const onKey = (e) => {
        if (e.key === "Escape") teardownZoom();
      };
      const teardownZoom = () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("keydown", onKey);
        window.clearTimeout(resizeTimer);
        closeZoom();
      };

      zoomOverlay.addEventListener("click", (e) => {
        if (e.target === zoomOverlay) teardownZoom();
      });
      zoomOverlay.querySelector("[data-z-close]")?.addEventListener("click", teardownZoom);
      zoomOverlay.querySelector("[data-z-in]")?.addEventListener("click", () => {
        setZoom(zScale + 0.25);
      });
      zoomOverlay.querySelector("[data-z-out]")?.addEventListener("click", () => {
        setZoom(zScale - 0.25);
      });
      zoomOverlay.querySelector("[data-z-reset]")?.addEventListener("click", () => {
        setZoom(1);
      });
      zoomOverlay.querySelector("[data-z-prev]")?.addEventListener("click", async () => {
        if (zPage > 1) {
          await paintZoomPage(zPage - 1);
          renderPage(zPage);
        }
      });
      zoomOverlay.querySelector("[data-z-next]")?.addEventListener("click", async () => {
        if (zPage < previewTotal) {
          await paintZoomPage(zPage + 1);
          renderPage(zPage);
        } else if (bookTotal > previewTotal) {
          flashLock();
        }
      });

      zStage?.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          if (e.shiftKey && overflows()) {
            panY -= e.deltaY;
            applyTransform();
            return;
          }
          const delta = e.deltaY > 0 ? -0.12 : 0.12;
          setZoom(zScale + delta);
        },
        { passive: false }
      );

      const onPointerDown = (e) => {
        if (!overflows() && zScale <= 1) return;
        dragging = true;
        dragOrigin = { x: e.clientX - panX, y: e.clientY - panY };
        zStage?.setPointerCapture?.(e.pointerId);
      };
      const onPointerMove = (e) => {
        if (!dragging || !dragOrigin) return;
        panX = e.clientX - dragOrigin.x;
        panY = e.clientY - dragOrigin.y;
        applyTransform();
      };
      const onPointerUp = () => {
        dragging = false;
        dragOrigin = null;
      };
      zStage?.addEventListener("pointerdown", onPointerDown);
      zStage?.addEventListener("pointermove", onPointerMove);
      zStage?.addEventListener("pointerup", onPointerUp);
      zStage?.addEventListener("pointercancel", onPointerUp);

      window.addEventListener("keydown", onKey);
      window.addEventListener("resize", onResize);

      await paintZoomPage(pageNo);
    };

    const loadPreview = async () => {
      showState("loading");
      pdf = null;
      pageNo = 1;
      previewTotal = PREVIEW_MAX;
      setUi();
      const LOAD_MS = 16000;
      let timedOut = false;
      const timer = window.setTimeout(() => {
        timedOut = true;
      }, LOAD_MS);
      try {
        const lib = await loadPdfJs();
        if (timedOut) throw new Error("timeout");
        const path = `/api/site/pamphlets/item/${encodeURIComponent(
          pamphletId
        )}/preview`;
        let buf;
        const fetchBytes = S().fetchPdfBytes
          ? S().fetchPdfBytes(path)
          : (async () => {
              const blob = await S().fetchPdfBlob(path);
              return blob.arrayBuffer();
            })();
        buf = await Promise.race([
          fetchBytes,
          new Promise((_, reject) =>
            window.setTimeout(() => reject(new Error("timeout")), LOAD_MS)
          ),
        ]);
        if (timedOut) throw new Error("timeout");
        if (!buf || buf.byteLength < 8) throw new Error("empty");
        pdf = await lib.getDocument(pdfDocumentOpts(buf)).promise;
        if (timedOut) throw new Error("timeout");
        previewTotal = Math.min(PREVIEW_MAX, Math.max(1, pdf.numPages || 1));
        setUi();
        await renderPage(1);
        if (timedOut && loading && !loading.hidden) {
          showState("error");
        }
      } catch (_) {
        pdf = null;
        showState("error");
        setUi();
      } finally {
        window.clearTimeout(timer);
        if (loading && !loading.hidden && !pdf) showState("error");
      }
    };

    prevBtn?.addEventListener("click", () => {
      if (pageNo > 1) renderPage(pageNo - 1);
    });
    nextBtn?.addEventListener("click", () => {
      if (pageNo < previewTotal) return renderPage(pageNo + 1);
      if (bookTotal > previewTotal) flashLock();
    });
    retryBtn?.addEventListener("click", () => loadPreview());
    zoomFab?.addEventListener("click", () => openZoom());
    canvas?.addEventListener("click", () => openZoom());
    canvas?.addEventListener("dblclick", () => openZoom());

    host.tabIndex = 0;
    host.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (pageNo < previewTotal) renderPage(pageNo + 1);
        else if (bookTotal > previewTotal) flashLock();
      }
      if (e.key === "ArrowRight" && pageNo > 1) {
        e.preventDefault();
        renderPage(pageNo - 1);
      }
      if ((e.key === "+" || e.key === "=") && pdf) {
        e.preventDefault();
        openZoom();
      }
    });

    let touchX = null;
    host.addEventListener(
      "touchstart",
      (e) => {
        touchX = e.changedTouches?.[0]?.clientX ?? null;
      },
      { passive: true }
    );
    host.addEventListener(
      "touchend",
      (e) => {
        if (touchX == null) return;
        const x = e.changedTouches?.[0]?.clientX;
        if (x == null) return;
        const dx = x - touchX;
        touchX = null;
        if (Math.abs(dx) < 40) return;
        if (dx > 0 && pageNo > 1) renderPage(pageNo - 1);
        if (dx < 0) {
          if (pageNo < previewTotal) renderPage(pageNo + 1);
          else if (bookTotal > previewTotal) flashLock();
        }
      },
      { passive: true }
    );

    const onResize = () => {
      if (pdf && !canvas?.hidden) renderPage(pageNo);
    };
    window.addEventListener("resize", onResize);

    await loadPreview();
  }

  const FA_DIGIT_CHARS = "۰۱۲۳۴۵۶۷۸۹";

  function toAsciiDigits(s) {
    return String(s || "")
      .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  }

  function toFaDigitChars(s) {
    return String(s ?? "").replace(/\d/g, (d) => FA_DIGIT_CHARS[d]);
  }

  function formatPhoneDisplay(raw) {
    const digits = toAsciiDigits(raw).replace(/\D/g, "").slice(0, 11);
    return toFaDigitChars(digits);
  }

  function setPhoneInputs(value) {
    const fa = formatPhoneDisplay(value);
    if ($("#phone")) $("#phone").value = fa;
    if ($("#phone_otp")) $("#phone_otp").value = fa;
  }

  function bindPhoneFaInputs(ids) {
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", () => {
        const fa = formatPhoneDisplay(el.value);
        if (el.value === fa) return;
        el.value = fa;
        try {
          el.setSelectionRange(fa.length, fa.length);
        } catch (_) {}
      });
    });
  }

  function normalizePhone(raw) {
    let p = toAsciiDigits(raw).replace(/[^\d]/g, "");
    if (p.startsWith("98") && p.length === 12) p = "0" + p.slice(2);
    return p;
  }

  function nextUrl(fallback = "account.html?tab=overview") {
    const n = (new URLSearchParams(location.search).get("next") || "").trim();
    if (!n || n.startsWith("/") || n.includes("://") || n.includes("..")) {
      return fallback;
    }
    if (!/^[a-z0-9_.-]+\.html(\?[a-z0-9_=&%-]*)?$/i.test(n)) return fallback;
    return n;
  }

  function go(url) {
    location.replace(url);
  }

  const REF_STORAGE_KEY = "jh_referral_code";

  function captureReferralFromUrl() {
    try {
      const q = new URLSearchParams(location.search);
      const code = (q.get("ref") || q.get("referral") || "").trim();
      if (code && code.length >= 4) {
        localStorage.setItem(REF_STORAGE_KEY, code);
      }
    } catch (_) {}
  }

  function storedReferralCode() {
    try {
      return (localStorage.getItem(REF_STORAGE_KEY) || "").trim();
    } catch (_) {
      return "";
    }
  }

  function clearStoredReferral() {
    try {
      localStorage.removeItem(REF_STORAGE_KEY);
    } catch (_) {}
  }

  function myReferralSignupUrl(code) {
    const c = (code || "").trim();
    if (!c) return "";
    try {
      const u = new URL("login.html", location.href);
      u.searchParams.set("ref", c);
      return u.toString();
    } catch (_) {
      return `login.html?ref=${encodeURIComponent(c)}`;
    }
  }

  async function copyText(text) {
    const t = String(text || "");
    if (!t) return false;
    try {
      await navigator.clipboard.writeText(t);
      return true;
    } catch (_) {
      try {
        const ta = document.createElement("textarea");
        ta.value = t;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        return ok;
      } catch (_) {
        return false;
      }
    }
  }

  function referralInviteHtml(code, { compact = false } = {}) {
    const c = (code || "").trim();
    if (!c) {
      return `<div class="jh-ref-box">
        <p class="jh-note">کد معرف هنوز ساخته نشده؛ یک‌بار صفحه را تازه کن.</p>
      </div>`;
    }
    const link = myReferralSignupUrl(c);
    return `<div class="jh-ref-box${compact ? " jh-ref-box--compact" : ""}">
      <p class="jh-ref-box-kicker">کد و لینک ثبت‌نام رفرالی تو</p>
      <p class="jh-note">هر کسی با این لینک ثبت‌نام کند، کد معرفت خودکار اعمال می‌شود و تا یک سال از فروش جزوه‌هایش سهم سفیر می‌گیری.</p>
      <div class="jh-ref-row">
        <span class="jh-ref-label">کد معرف</span>
        <code class="jh-ref-code" dir="ltr">${S().esc(c)}</code>
        <button type="button" class="jh-btn secondary" data-ref-copy="code">کپی کد</button>
      </div>
      <div class="jh-ref-row">
        <span class="jh-ref-label">لینک ثبت‌نام</span>
        <input class="jh-ref-link" dir="ltr" readonly value="${S().esc(link)}" />
        <button type="button" class="jh-btn secondary" data-ref-copy="link">کپی لینک</button>
      </div>
      <div class="jh-ref-actions">
        <button type="button" class="jh-btn" data-ref-share>ارسال لینک</button>
      </div>
    </div>`;
  }

  function bindReferralInvite(root, code, errEl) {
    const c = (code || "").trim();
    const link = myReferralSignupUrl(c);
    root?.querySelectorAll("[data-ref-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const kind = btn.getAttribute("data-ref-copy");
        const ok = await copyText(kind === "code" ? c : link);
        msg(errEl, ok ? (kind === "code" ? "کد معرف کپی شد" : "لینک ثبت‌نام کپی شد") : "کپی نشد؛ دستی کپی کن", ok);
      });
    });
    root?.querySelector("[data-ref-share]")?.addEventListener("click", async () => {
      const text = `با این لینک در جزوه‌سرا ثبت‌نام کن:\n${link}`;
      try {
        if (navigator.share) {
          await navigator.share({
            title: "دعوت به جزوه‌سرا بلوک",
            text,
            url: link,
          });
          return;
        }
      } catch (_) {}
      const ok = await copyText(link);
      msg(errEl, ok ? "لینک کپی شد؛ بفرست برای دوستت" : "اشتراک‌گذاری در دسترس نیست", ok);
    });
  }

  function showStep(id) {
    ["step-password", "step-phone", "step-code", "step-set-password", "step-profile"].forEach(
      (sid) => {
        const el = $("#" + sid);
        if (el) el.hidden = sid !== id;
      }
    );
  }

  function injectChrome(active) {
    if ($(".jh-topbar")) return;
    const root = S().rootPrefix();
    const bar = document.createElement("header");
    bar.className = "jh-topbar";
    bar.innerHTML = `
      <div class="jh-topbar-inner">
        <a class="jh-brand" href="${root}index.html">
          <img src="${root}assets/bolok-logo.svg?v=59" alt="بلوک" />
          <span>جزوه‌سرا<em>بلوک</em></span>
        </a>
        <div class="jh-topbar-actions">
          <a class="jh-wallet-chip" href="account.html?tab=wallet" data-jh-wallet hidden aria-label="کیف پول">
            <span class="jh-wallet-chip-money" data-jh-wallet-money>—</span>
            <span class="jh-wallet-chip-units" data-jh-wallet-units hidden></span>
          </a>
          <a class="jh-account-chip" href="login.html" data-nav="login" data-jh-account aria-busy="true">
            <span class="jh-account-avatar" aria-hidden="true">?</span>
            <span class="jh-account-name">…</span>
          </a>
          <button class="jh-nav-toggle" type="button" data-jh-nav-toggle aria-label="منو" aria-expanded="false" aria-controls="jh-nav-panel">
            <span></span>
          </button>
        </div>
      </div>
      <nav class="jh-top-nav" aria-label="جزوات">
        <a href="index.html" data-nav="index">فروشگاه</a>
        <a href="learn.html" data-nav="learn">آموزش و راهنما و قوانین</a>
        <a href="submit.html" data-nav="submit">انتشار</a>
      </nav>
      <div class="jh-nav-backdrop" data-jh-nav-backdrop hidden></div>
      <nav class="jh-nav-panel" id="jh-nav-panel" data-jh-nav-panel aria-hidden="true">
        <a href="index.html" data-nav="index">فروشگاه</a>
        <a href="learn.html" data-nav="learn">آموزش و راهنما و قوانین</a>
        <a href="submit.html" data-nav="submit">انتشار</a>
        <a href="${root}index.html">بازگشت به بلوک</a>
      </nav>`;
    document.body.prepend(bar);
    if (!$(".jh-aurora")) {
      const a = document.createElement("div");
      a.className = "jh-aurora";
      a.setAttribute("aria-hidden", "true");
      document.body.prepend(a);
    }
    document.body.classList.add("jh-body");
    $$(`[data-nav="${active}"]`).forEach((el) =>
      el.setAttribute("aria-current", "page")
    );
    wireJhNavToggle(bar);
    refreshAccountChip();
    maybeShowVpnAdvisory();
  }

  const VPN_HINT_KEY = "jh_vpn_hint_dismissed_day";

  function vpnHintDismissedToday() {
    try {
      const day = new Date().toISOString().slice(0, 10);
      return sessionStorage.getItem(VPN_HINT_KEY) === day;
    } catch (_) {
      return false;
    }
  }

  function dismissVpnHintToday() {
    try {
      sessionStorage.setItem(
        VPN_HINT_KEY,
        new Date().toISOString().slice(0, 10)
      );
    } catch (_) {}
  }

  function timezoneLooksAbroad() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (!tz) return false;
      return tz !== "Asia/Tehran";
    } catch (_) {
      return false;
    }
  }

  function paintVpnAdvisoryBanner(message) {
    if ($("[data-jh-vpn-banner]")) return;
    const el = document.createElement("aside");
    el.className = "jh-vpn-banner";
    el.setAttribute("data-jh-vpn-banner", "1");
    el.setAttribute("role", "status");
    el.innerHTML = `
      <div class="jh-vpn-banner-inner">
        <span class="jh-vpn-banner-ico" aria-hidden="true">⚠</span>
        <div class="jh-vpn-banner-copy">
          <strong>فیلترشکن، VPN یا DNS changer فعال به نظر می‌رسد</strong>
          <p>${S().esc(
            message ||
              "برای استفادهٔ صحیح و کامل، فیلترشکن خود را خاموش بفرمایید."
          )}</p>
        </div>
        <button type="button" class="jh-vpn-banner-x" data-jh-vpn-dismiss aria-label="بستن">×</button>
      </div>`;
    const dash = $(".jh-dash-main");
    const wrap = $(".jh-wrap");
    if (dash) {
      const top = dash.querySelector(".jh-dash-top");
      if (top?.nextSibling) dash.insertBefore(el, top.nextSibling);
      else dash.prepend(el);
    } else if (wrap) {
      wrap.prepend(el);
    } else {
      document.body.prepend(el);
    }
    el.querySelector("[data-jh-vpn-dismiss]")?.addEventListener("click", () => {
      dismissVpnHintToday();
      el.remove();
    });
  }

  async function maybeShowVpnAdvisory() {
    if (vpnHintDismissedToday()) return;
    let advise = false;
    let message =
      "برای استفادهٔ صحیح و کامل باید فیلترشکن، VPN یا DNS changer خود را خاموش بفرمایید.";
    let apiKnown = false;
    try {
      if (window.BolokSite?.api) {
        const res = await S().api("/api/site/network-advisory");
        const d = res?.data || {};
        const signal = String(d.signal || "");
        const country = String(d.country || "")
          .trim()
          .toUpperCase();
        if (d.message_fa) message = d.message_fa;
        if (signal === "local" || country === "IR") {
          // In Iran (edge country) — never warn for wrong OS timezone alone
          return;
        }
        if (d.advise_disable_vpn || signal === "country") {
          advise = true;
          apiKnown = true;
        } else if (signal === "unknown" || !country) {
          apiKnown = false;
        } else {
          apiKnown = true;
        }
      }
    } catch (_) {
      apiKnown = false;
    }
    // TZ is only a weak fallback when country is unknown / API failed
    if (!advise && !apiKnown && timezoneLooksAbroad()) {
      advise = true;
    }
    if (advise) paintVpnAdvisoryBanner(message);
  }

  function wireJhNavToggle(bar) {
    const toggle = bar.querySelector("[data-jh-nav-toggle]");
    const panel = bar.querySelector("[data-jh-nav-panel]");
    const backdrop = bar.querySelector("[data-jh-nav-backdrop]");
    if (!toggle || !panel) return;
    const setOpen = (open) => {
      panel.classList.toggle("is-open", open);
      panel.setAttribute("aria-hidden", open ? "false" : "true");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      bar.classList.toggle("is-nav-open", open);
      document.body.classList.toggle("jh-nav-open", open);
      if (backdrop) {
        backdrop.hidden = !open;
        backdrop.classList.toggle("is-on", open);
      }
    };
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      setOpen(!panel.classList.contains("is-open"));
    });
    backdrop?.addEventListener("click", () => setOpen(false));
    panel.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => setOpen(false))
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
    window.addEventListener(
      "resize",
      () => {
        if (window.matchMedia("(min-width: 721px)").matches) setOpen(false);
      },
      { passive: true }
    );
  }

  let _restorePromise = null;
  let _restoreCached = null;
  let _restoreCachedAt = 0;

  function invalidateSessionCache() {
    _restorePromise = null;
    _restoreCached = null;
    _restoreCachedAt = 0;
  }

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), ms)
      ),
    ]);
  }

  async function restoreSessionOnce() {
    const token = S()?.getSiteSession?.() || "";
    if (!token) {
      invalidateSessionCache();
      return null;
    }
    const now = Date.now();
    if (_restoreCached && now - _restoreCachedAt < 8000) {
      return _restoreCached;
    }
    if (_restorePromise) return _restorePromise;
    _restorePromise = (async () => {
      try {
        const res = await withTimeout(
          S().api("/api/site/auth/restore-session", {
            method: "POST",
            body: "{}",
          }),
          4000
        );
        if (!res?.ok) {
          S().setSiteSession("");
          invalidateSessionCache();
          return null;
        }
        _restoreCached = res;
        _restoreCachedAt = Date.now();
        return res;
      } catch (_) {
        // Keep token on timeout/network — only clear on explicit auth failure
        _restorePromise = null;
        return null;
      } finally {
        _restorePromise = null;
      }
    })();
    return _restorePromise;
  }

  function paintWalletChip(wallet) {
    const chip = $("[data-jh-wallet]");
    if (!chip) return;
    if (!wallet) {
      chip.hidden = true;
      return;
    }
    const bal = Math.max(0, Math.floor(Number(wallet.wallet_balance_irt) || 0));
    const units = Math.max(0, Math.floor(Number(wallet.wallet_units) || 0));
    const buyIrt = purchasableValueIrt(wallet);
    chip.hidden = false;
    const moneyEl = chip.querySelector("[data-jh-wallet-money]");
    const unitsEl = chip.querySelector("[data-jh-wallet-units]");
    if (moneyEl) moneyEl.textContent = money(bal);
    if (unitsEl) {
      if (units > 0) {
        unitsEl.hidden = false;
        unitsEl.textContent = `${toFaDigits(units)} واحد · ${money(buyIrt)}`;
      } else {
        unitsEl.hidden = true;
        unitsEl.textContent = "";
      }
    }
    const labelParts = [`موجودی ${money(bal)}`];
    if (units > 0)
      labelParts.push(`${toFaDigits(units)} واحد · ${money(buyIrt)}`);
    chip.setAttribute("aria-label", labelParts.join(" · "));
  }

  function paintAccountChip(me) {
    const chips = $$("[data-jh-account]");
    if (!chips.length) return;
    chips.forEach((el) => {
      el.removeAttribute("aria-busy");
      el.style.pointerEvents = "";
      let avatar = el.querySelector(".jh-account-avatar");
      let nameEl = el.querySelector(".jh-account-name");
      if (!avatar || !nameEl) {
        el.innerHTML =
          `<span class="jh-account-avatar" aria-hidden="true">?</span><span class="jh-account-name"></span>`;
        avatar = el.querySelector(".jh-account-avatar");
        nameEl = el.querySelector(".jh-account-name");
      }
      if (me) {
        const full =
          `${me.first_name || ""} ${me.last_name || ""}`.trim() || "حساب من";
        const short =
          (me.first_name || "").trim() || full.split(/\s+/)[0] || "حساب";
        const initial = (short.slice(0, 1) || "ب").toUpperCase();
        if (avatar) avatar.textContent = initial;
        if (nameEl) {
          nameEl.textContent = short;
          nameEl.title = full;
        }
        el.href = "account.html?tab=overview";
        el.classList.add("is-on");
        el.setAttribute("aria-label", full);
        if (el.hasAttribute("data-nav")) el.setAttribute("data-nav", "account");
        // Soft paint from session; wallet/me refreshes units + income
        paintWalletChip({
          wallet_balance_irt: me.wallet_balance_irt,
          wallet_units: me.wallet_units,
        });
        S()
          .api("/api/site/pamphlets/wallet/me")
          .then((res) => paintWalletChip(res?.data || null))
          .catch(() => {});
      } else {
        if (avatar) avatar.textContent = "و";
        if (nameEl) {
          nameEl.textContent = "ورود";
          nameEl.removeAttribute("title");
        }
        {
          const stored = storedReferralCode();
          el.href = stored
            ? `login.html?ref=${encodeURIComponent(stored)}`
            : "login.html";
        }
        el.classList.remove("is-on");
        el.setAttribute("aria-label", "ورود");
        paintWalletChip(null);
      }
    });
  }

  function paintAccountChipPending() {
    $$("[data-jh-account]").forEach((el) => {
      el.setAttribute("aria-busy", "true");
      el.style.pointerEvents = "none";
      let avatar = el.querySelector(".jh-account-avatar");
      let nameEl = el.querySelector(".jh-account-name");
      if (!avatar || !nameEl) {
        el.innerHTML =
          `<span class="jh-account-avatar" aria-hidden="true">…</span><span class="jh-account-name"></span>`;
        avatar = el.querySelector(".jh-account-avatar");
        nameEl = el.querySelector(".jh-account-name");
      }
      if (avatar) avatar.textContent = "…";
      if (nameEl) {
        nameEl.textContent = "در حال اتصال";
        nameEl.removeAttribute("title");
      }
      el.setAttribute("aria-label", "در حال بررسی نشست");
    });
  }

  async function refreshAccountChip() {
    const chips = $$("[data-jh-account]");
    if (!chips.length) return;
    const hasToken = !!(S()?.getSiteSession?.() || "");
    paintAccountChipPending();
    let me = null;
    try {
      me = await ensureSession();
    } catch (_) {
      me = null;
    }
    if (!me && hasToken) {
      // Timeout/network: keep pending, one short retry — never flash «ورود»
      try {
        invalidateSessionCache();
        me = await ensureSession();
      } catch (_) {
        me = null;
      }
    }
    if (!me && hasToken) {
      paintAccountChipPending();
      return;
    }
    paintAccountChip(me);
  }

  async function ensureSession({ requireProfile = false } = {}) {
    if (!window.BolokSite) return null;
    const res = await restoreSessionOnce();
    if (!res?.ok || !res.data) return null;
    if (requireProfile && res.needs_profile) {
      const here = encodeURIComponent(
        (location.pathname.split("/").pop() || "") + location.search
      );
      // need_profile=1 تا login دوباره «ورود موفق» نزند و لوپ نشود
      go(`login.html?next=${here}&need_profile=1`);
      return null;
    }
    return res.data;
  }

  function ensureBootShell(boot, title, note) {
    if (!boot) return;
    if (!boot.querySelector(".jh-boot-orb")) {
      boot.innerHTML = `<div class="jh-boot-card">
        <div class="jh-boot-orb" aria-hidden="true">
          <span class="jh-boot-halo"></span>
          <span class="jh-boot-ring jh-boot-ring--a"></span>
          <span class="jh-boot-ring jh-boot-ring--b"></span>
          <span class="jh-boot-ring jh-boot-ring--c"></span>
          <span class="jh-boot-core"><em>ج</em></span>
          <span class="jh-boot-spark jh-boot-spark--1"></span>
          <span class="jh-boot-spark jh-boot-spark--2"></span>
        </div>
        <strong class="jh-boot-title"></strong>
        <p class="jh-boot-note"></p>
      </div>`;
    }
    const t = boot.querySelector(".jh-boot-title");
    const n = boot.querySelector(".jh-boot-note");
    if (t && title != null) t.textContent = title;
    if (n) {
      if (note) {
        n.innerHTML = `${S().esc(note)}<span class="jh-boot-dots" aria-hidden="true"><i></i><i></i><i></i></span>`;
        n.hidden = false;
      } else if (note === "") {
        n.hidden = true;
      }
    }
  }

  function setBootLabel(boot, title, note) {
    if (!boot) return;
    boot.classList.remove("jh-boot--success", "is-leaving");
    ensureBootShell(boot, title, note);
    boot.hidden = false;
  }

  function dismissBoot(boot, ui) {
    if (!boot) {
      if (ui) ui.hidden = false;
      return;
    }
    boot.classList.remove("jh-boot--success");
    boot.classList.add("is-leaving");
    const finish = () => {
      boot.hidden = true;
      boot.classList.remove("is-leaving");
      if (ui) ui.hidden = false;
    };
    window.setTimeout(finish, 420);
  }

  function revealBoot(boot, ui, text) {
    if (boot) setBootLabel(boot, text || "در حال بارگذاری…", "یه لحظه صبر کن");
    if (ui) ui.hidden = true;
  }

  function revealUi(boot, ui) {
    dismissBoot(boot, ui);
  }

  function firstNameOf(account) {
    const n = String(account?.first_name || "").trim();
    return n || "دوست عزیز";
  }

  function showLoginSuccess(boot, ui, account, dest) {
    const name = firstNameOf(account);
    if (boot) {
      boot.classList.add("jh-boot--success");
      boot.hidden = false;
      boot.innerHTML = `<div class="jh-login-ok" role="status">
        <span class="jh-login-ok-mark" aria-hidden="true">✓</span>
        <strong>ورود موفق</strong>
        <p>سلام <em>${S().esc(name)}</em>، خوش اومدی به جزوه‌سرا</p>
      </div>`;
    }
    if (ui) ui.hidden = true;
    window.setTimeout(() => go(dest || "account.html?tab=overview"), 1400);
  }

  function vaultInitial(label, phone) {
    const n = String(label || "").trim();
    if (n) return n.slice(0, 1);
    const p = String(phone || "").replace(/\D/g, "");
    return p.slice(-2, -1) || "ب";
  }

  function renderVault(host, { onPick, onForget } = {}) {
    if (!host) return;
    const vault = S().listVault?.() || [];
    if (!vault.length) {
      host.hidden = true;
      host.innerHTML = "";
      host.classList.remove("jh-vault--on");
      return;
    }
    const active = S().getSiteSession?.() || "";
    host.hidden = false;
    host.classList.add("jh-vault--on");
    host.innerHTML = `
      <header class="jh-vault-head">
        <div>
          <strong>حساب‌های ذخیره‌شده</strong>
          <p>یک ضربه برای ورود سریع</p>
        </div>
        <span class="jh-vault-count">${toFaDigits(vault.length)}</span>
      </header>
      <ul class="jh-vault-list" role="list">
        ${vault
          .map((v, i) => {
            const name = v.label || v.phone || "حساب";
            const phoneFa = toFaDigits(v.phone || "");
            const isActive = !!active && v.token === active;
            const initial = vaultInitial(v.label, v.phone);
            return `<li class="jh-vault-row${isActive ? " is-active" : ""}">
              <button type="button" class="jh-vault-item" data-token="${S().esc(
                v.token
              )}" aria-label="ورود با ${S().esc(name)}">
                <span class="jh-vault-avatar" aria-hidden="true" data-tone="${
                  i % 4
                }">${S().esc(initial)}</span>
                <span class="jh-vault-meta">
                  <strong>${S().esc(name)}</strong>
                  <span dir="ltr">${S().esc(phoneFa)}</span>
                </span>
                <span class="jh-vault-go">${
                  isActive ? "فعال" : "ورود"
                }</span>
              </button>
              <button type="button" class="jh-vault-forget" data-forget="${S().esc(
                v.id || v.token
              )}" aria-label="حذف ${S().esc(name)} از این دستگاه" title="حذف از این دستگاه">×</button>
            </li>`;
          })
          .join("")}
      </ul>
      <p class="jh-vault-or"><span>یا ورود با رمز / پیامک</span></p>`;
    host.querySelectorAll(".jh-vault-item[data-token]").forEach((btn) => {
      btn.addEventListener("click", () => onPick?.(btn.dataset.token));
    });
    host.querySelectorAll(".jh-vault-forget[data-forget]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const key = btn.dataset.forget;
        S().removeFromVault?.(key);
        onForget?.(key);
        renderVault(host, { onPick, onForget });
      });
    });
  }

  function authorInitial(name) {
    const n = String(name || "").trim();
    return n.slice(0, 1) || "ج";
  }

  function pamphletCoverInner(p) {
    const major = p.major || p.field_of_study || "پیراپزشکی";
    const kind = p.content_kind === "handwritten" ? "دست‌نویس" : "تایپی";
    const course = String(p.course_name || "جزوه").trim().slice(0, 28);
    const id = String(p.id || "");
    const coverUrl = (p.cover_url || "").trim();
    if (coverUrl) {
      return `<div class="jh-tall-cover is-page" data-cover-ready="1" aria-hidden="true">
        <img class="jh-tall-thumb jh-tall-img" src="${S().esc(
          coverUrl
        )}" alt="" loading="lazy" />
      </div>`;
    }
    const sample = p.sample_url
      ? `<img class="jh-tall-img jh-tall-sample" src="${S().esc(
          p.sample_url
        )}" alt="" loading="lazy" hidden />`
      : "";
    return `<div class="jh-tall-cover" data-preview-id="${S().esc(id)}" aria-hidden="true">
      <canvas class="jh-tall-thumb" hidden></canvas>
      ${sample}
      <div class="jh-tall-fallback">
        <span class="jh-cover-major">${S().esc(major)}</span>
        <strong>${S().esc(course)}</strong>
        <span class="jh-cover-kind">${kind}</span>
      </div>
    </div>`;
  }

  const _previewPdfCache = new Map();

  async function fetchPreviewPdf(pamphletId) {
    const id = String(pamphletId || "");
    if (!id) throw new Error("id");
    if (_previewPdfCache.has(id)) return _previewPdfCache.get(id);
    const pending = (async () => {
      const lib = await loadPdfJs();
      const url = `${S().API_BASE}/api/site/pamphlets/item/${encodeURIComponent(
        id
      )}/preview`;
      const res = await fetch(url, { headers: { Accept: "application/pdf" } });
      if (!res.ok) throw new Error("preview");
      const buf = await res.arrayBuffer();
      const pdf = await lib.getDocument(pdfDocumentOpts(buf)).promise;
      return pdf;
    })();
    _previewPdfCache.set(id, pending);
    try {
      return await pending;
    } catch (e) {
      _previewPdfCache.delete(id);
      throw e;
    }
  }

  async function paintCoverPageOne(coverEl) {
    if (!coverEl || coverEl.dataset.coverReady === "1") return;
    const id = coverEl.getAttribute("data-preview-id");
    const canvas = coverEl.querySelector(".jh-tall-thumb");
    const fallback = coverEl.querySelector(".jh-tall-fallback");
    const sample = coverEl.querySelector(".jh-tall-sample");
    if (!id || !canvas) return;
    try {
      const pdf = await fetchPreviewPdf(id);
      const page = await pdf.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const box = coverEl.getBoundingClientRect();
      const targetW = Math.max(220, box.width || 280);
      const scale = Math.min(2.4, (targetW * 2) / base.width);
      const vp = page.getViewport({ scale });
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      await page.render({
        canvasContext: canvas.getContext("2d"),
        viewport: vp,
      }).promise;
      canvas.hidden = false;
      if (fallback) fallback.hidden = true;
      if (sample) sample.hidden = true;
      coverEl.dataset.coverReady = "1";
      coverEl.classList.add("is-page");
    } catch (_) {
      if (sample) {
        sample.hidden = false;
        if (fallback) fallback.hidden = true;
        coverEl.dataset.coverReady = "1";
      }
    }
  }

  function hydrateCardCovers(root = document) {
    const covers = root.querySelectorAll(
      ".jh-tall-cover[data-preview-id]:not([data-cover-ready='1'])"
    );
    if (!covers.length) return;
    if (!("IntersectionObserver" in window)) {
      covers.forEach((el) => paintCoverPageOne(el));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          io.unobserve(el);
          paintCoverPageOne(el);
        });
      },
      { rootMargin: "120px 0px", threshold: 0.05 }
    );
    covers.forEach((el) => io.observe(el));
  }

  function pamphletCreditLine(p) {
    const author = p.is_anonymous
      ? "ناشناس"
      : (p.authors_text || "").trim();
    const professor = (p.professor_name || "").trim();
    if (professor && author) return `استاد: ${professor} · نویسنده: ${author}`;
    if (professor) return `استاد: ${professor}`;
    if (author) return `نویسنده: ${author}`;
    return "";
  }

  function goldenBadgeHtml(p) {
    return p.golden_badge
      ? '<span class="jh-badge jh-badge--golden" title="تأییدیه طلایی">طلایی</span>'
      : "";
  }

  function cardHtml(p) {
    const kind = p.content_kind === "handwritten" ? "دست‌نویس" : "تایپی";
    const major = p.major || p.field_of_study || "پیراپزشکی";
    const credit = pamphletCreditLine(p);
    const pages = toFaDigits(p.pages_count || "—");
    const free = Number(p.price_irt || 0) <= 0;
    const price = free
      ? '<span class="jh-badge free">رایگان</span>'
      : `<span class="jh-badge">${money(p.price_irt)}</span>`;
    const cta = free ? "دریافت" : "مشاهده";
    return `<article class="jh-card jh-card-tall span-4">
      <a class="jh-tall-media" href="item.html?id=${S().esc(p.id)}">
        ${pamphletCoverInner(p)}
        <span class="jh-pages-badge">${pages} صفحه</span>
      </a>
      <div class="jh-tall-body">
        <h3><a class="title-link" href="item.html?id=${S().esc(p.id)}">${S().esc(
      p.title
    )}</a></h3>
        <p class="jh-meta">${S().esc(major)} · ${kind}${
      credit ? ` · ${S().esc(credit)}` : ""
    }</p>
        <div class="jh-product-foot">
          ${goldenBadgeHtml(p)}${unitBadgeHtml(p)}${price}
          <a class="jh-card-cta" href="item.html?id=${S().esc(p.id)}">${cta}</a>
        </div>
      </div>
    </article>`;
  }

  function similarHtml(p) {
    const pages = toFaDigits(p.pages_count || "—");
    const priceN = Number(p.price_irt || 0);
    const priceFa = priceN <= 0 ? "رایگان" : money(priceN);
    const credit = pamphletCreditLine(p);
    const course = (p.course_name || p.major || "").trim();
    return `<a class="jh-similar-item" href="item.html?id=${S().esc(p.id)}">
      <div class="jh-similar-thumb">${pamphletCoverInner(p)}</div>
      <div class="jh-similar-text">
        <strong>${S().esc(p.title || "جزوه")}</strong>
        ${
          course
            ? `<span class="jh-similar-course">${S().esc(course)}</span>`
            : ""
        }
        ${
          credit
            ? `<span class="jh-similar-credit">${S().esc(credit)}</span>`
            : ""
        }
        <span class="jh-similar-meta">
          <em>${pages} صفحه</em>
          <span class="jh-similar-price">${S().esc(priceFa)}</span>
        </span>
      </div>
    </a>`;
  }

  async function initLogin() {
    injectChrome("login");
    const boot = $("#jh-auth-boot");
    const ui = $("#jh-auth-ui");
    const err = $("#jh-err");
    let account = null;
    let sessionMeta = null;
    const dest = () => nextUrl("account.html?tab=overview");

    let phone = "";
    let profileBound = false;

    const bindProfileStep = () => {
      if (profileBound) return;
      profileBound = true;
      $("#btn-complete-profile")?.addEventListener("click", async () => {
        try {
          const first = ($("#profile_first")?.value || "").trim();
          const last = ($("#profile_last")?.value || "").trim();
          const major = ($("#profile_major")?.value || "").trim();
          if (!first || !last) return msg(err, "نام و نام خانوادگی لازم است");
          if (!major) return msg(err, "رشته را انتخاب کن");
          const refVal = ($("#profile_referral")?.value || "").trim();
          const referralCode =
            storedReferralCode() ||
            (/ثبت‌شده|کد معرف قبلاً/.test(refVal) ? "" : refVal);
          const saved = await S().api("/api/site/auth/complete-profile", {
            method: "POST",
            body: JSON.stringify({
              first_name: first,
              last_name: last,
              university:
                ($("#profile_uni")?.value || "").trim() ||
                "دانشگاه علوم پزشکی شهید بهشتی",
              field_of_study: major,
              referral_code: referralCode,
            }),
          });
          if (saved.data?.has_referrer) clearStoredReferral();
          invalidateSessionCache();
          showLoginSuccess(boot, ui, saved.data || {}, dest());
        } catch (e) {
          msg(err, e.message || "خطا");
        }
      });
    };

    const paintLockedPhone = (displayId, lockId, rawPhone) => {
      const p = normalizePhone(rawPhone || phone || "");
      const el = $(displayId);
      const lock = $(lockId);
      if (el && p) el.textContent = toFaDigitChars(p);
      if (lock) lock.hidden = !p;
    };

    const openProfileStep = (data) => {
      revealUi(boot, ui);
      showStep("step-profile");
      bindProfileStep();
      const lockedPhone = data?.phone || phone || "";
      if (lockedPhone) phone = normalizePhone(lockedPhone);
      paintLockedPhone("#profile-phone-display", "#profile-phone-lock", phone);
      if ($("#profile_first") && data?.first_name)
        $("#profile_first").value = data.first_name;
      if ($("#profile_last") && data?.last_name)
        $("#profile_last").value = data.last_name;
      if ($("#profile_uni") && data?.university)
        $("#profile_uni").value = data.university;
      if ($("#profile_major") && data?.field_of_study)
        $("#profile_major").value = data.field_of_study;
      const refInput = $("#profile_referral");
      if (refInput) {
        const fromUrl = storedReferralCode();
        if (fromUrl && !refInput.value.trim()) refInput.value = fromUrl;
        if (data?.has_referrer) {
          refInput.readOnly = true;
          const name = data.referrer_name || data.referrer?.full_name || "";
          refInput.value = name
            ? `ثبت‌شده · سفیر: ${name}`
            : "کد معرف قبلاً ثبت شده";
        }
      }
      msg(err, "برای ادامه، مشخصات پروفایل را کامل کن", true);
    };

    try {
      sessionMeta = await restoreSessionOnce();
      if (sessionMeta?.ok && sessionMeta.data) {
        account = sessionMeta.data;
        if (sessionMeta.needs_profile) {
          openProfileStep(account);
          return;
        }
        showLoginSuccess(boot, ui, account, dest());
        return;
      }
    } catch (_) {
      account = null;
    } finally {
      if (!account) revealUi(boot, ui);
    }

    const finishAuth = (res) => {
      invalidateSessionCache();
      S().rememberAuth?.(res);
      const authPhone = res?.data?.phone || phone;
      if (authPhone) phone = normalizePhone(authPhone);
      if (res.needs_password) {
        revealUi(boot, ui);
        paintLockedPhone(
          "#setpass-phone-display",
          "#setpass-phone-lock",
          phone
        );
        showStep("step-set-password");
        msg(err, "برای ورود بعدی بدون پیامک، یک رمز بگذار", true);
        return;
      }
      if (res.needs_profile) {
        openProfileStep(res.data || {});
        return;
      }
      showLoginSuccess(boot, ui, res.data || {}, dest());
    };

    const bindVault = () =>
      renderVault($("#jh-vault"), {
        onPick: async (token) => {
          const row = Array.from(
            $("#jh-vault")?.querySelectorAll(".jh-vault-item") || []
          ).find((b) => b.dataset.token === token);
          row?.classList.add("is-busy");
          try {
            invalidateSessionCache();
            S().setActiveAccount?.(token);
            const restored = await restoreSessionOnce();
            if (!restored?.ok || !restored.data) {
              S().removeFromVault?.(token);
              msg(err, "این نشست منقضی شده؛ دوباره وارد شو");
              bindVault();
              return;
            }
            if (restored.needs_profile) {
              openProfileStep(restored.data);
              return;
            }
            showLoginSuccess(boot, ui, restored.data, dest());
          } catch (e) {
            msg(err, e.message || "ورود با حساب ذخیره‌شده ناموفق بود");
            row?.classList.remove("is-busy");
          }
        },
        onForget: () => {
          msg(err, "حساب از این دستگاه حذف شد", true);
        },
      });
    bindVault();

    const vault = S().listVault?.() || [];
    bindPhoneFaInputs(["phone", "phone_otp"]);
    if (vault[0]?.phone) setPhoneInputs(vault[0].phone);

    showStep("step-password");

    $("#btn-goto-otp")?.addEventListener("click", () => {
      setPhoneInputs($("#phone")?.value || "");
      showStep("step-phone");
      err.hidden = true;
    });
    $("#btn-goto-password")?.addEventListener("click", () => {
      showStep("step-password");
      err.hidden = true;
    });

    $("#btn-login-password")?.addEventListener("click", async () => {
      try {
        phone = normalizePhone($("#phone")?.value || "");
        const password = $("#password")?.value || "";
        if (!/^09\d{9}$/.test(phone)) {
          return msg(err, "شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.");
        }
        if (!password) return msg(err, "رمز را وارد کن");
        setPhoneInputs(phone);
        const res = await S().api("/api/site/auth/login-password", {
          method: "POST",
          body: JSON.stringify({ phone, password }),
        });
        if (!res.ok) {
          if (res.needs_otp) {
            showStep("step-phone");
            setPhoneInputs(phone);
          }
          return msg(err, res.message || "ورود ناموفق");
        }
        finishAuth(res);
      } catch (e) {
        msg(err, e.message || "خطا");
      }
    });

    $("#btn-send-otp")?.addEventListener("click", async () => {
      try {
        phone = normalizePhone(
          ($("#phone_otp")?.value || $("#phone")?.value || "").trim()
        );
        if (!/^09\d{9}$/.test(phone)) {
          return msg(err, "شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.");
        }
        setPhoneInputs(phone);
        await S().api("/api/site/auth/request-otp", {
          method: "POST",
          body: JSON.stringify({ phone }),
        });
        msg(err, "کد پیامک شد", true);
        showStep("step-code");
        paintLockedPhone("#code-phone-display", "#code-phone-lock", phone);
        const hint = $("#code-hint");
        if (hint)
          hint.textContent = `کد ارسال‌شده به ${toFaDigitChars(phone)} را وارد کن`;
      } catch (e) {
        msg(err, e.message || "خطا");
      }
    });
    $("#btn-edit-phone")?.addEventListener("click", () => {
      showStep("step-phone");
      err.hidden = true;
    });
    $("#btn-verify-otp")?.addEventListener("click", async () => {
      try {
        const code = toAsciiDigits($("#code")?.value || "").replace(/\D/g, "");
        const res = await S().api("/api/site/auth/verify-otp", {
          method: "POST",
          body: JSON.stringify({ phone, code }),
        });
        if (!res.ok) return msg(err, res.message || "کد غلط است");
        paintLockedPhone(
          "#setpass-phone-display",
          "#setpass-phone-lock",
          phone
        );
        paintLockedPhone("#profile-phone-display", "#profile-phone-lock", phone);
        finishAuth(res);
      } catch (e) {
        msg(err, e.message || "خطا");
      }
    });
    $("#btn-set-password")?.addEventListener("click", async () => {
      try {
        const p1 = $("#new_password")?.value || "";
        const p2 = $("#new_password2")?.value || "";
        if (p1.length < 8) return msg(err, "رمز باید حداقل ۸ کاراکتر باشد");
        if (p1 !== p2) return msg(err, "تکرار رمز یکسان نیست");
        const setRes = await S().api("/api/site/auth/set-password", {
          method: "POST",
          body: JSON.stringify({ password: p1 }),
        });
        showLoginSuccess(boot, ui, setRes.data || {}, dest());
      } catch (e) {
        msg(err, e.message || "خطا");
      }
    });
    $("#btn-skip-password")?.addEventListener("click", async () => {
      try {
        const restored = await restoreSessionOnce();
        if (restored?.needs_profile) {
          openProfileStep(restored.data || {});
          return;
        }
        showLoginSuccess(boot, ui, restored?.data || {}, dest());
      } catch (_) {
        showLoginSuccess(boot, ui, {}, dest());
      }
    });

    bindProfileStep();
  }

  function normSearchQuery(raw) {
    let s = toAsciiDigits(String(raw || "")).trim();
    s = s
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/ة/g, "ه")
      .replace(/\u200c/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return s;
  }

  function initWayLottie() {
    const stage = $("#jh-way-stage") || $(".jh-way-stage");
    const fallback = $(".jh-way-mascot");
    if (!stage) return;
    // Static illustrated center — no Lottie overlay
    if (stage.querySelector(".jh-way-mascot") && !stage.querySelector("lottie-player")) {
      return;
    }

    const sources = [
      "assets/gumhead.json?v=2",
      "https://assets.gumroad.com/images/about/gumhead.json",
    ];

    const showFallback = () => {
      stage.querySelectorAll("lottie-player").forEach((el) => {
        el.hidden = true;
        el.style.visibility = "hidden";
      });
      if (fallback) {
        fallback.hidden = false;
        fallback.style.display = "block";
      }
      stage.classList.add("is-fallback");
      stage.classList.remove("is-playing");
    };

    const showPlaying = (player) => {
      if (fallback) {
        fallback.hidden = true;
        fallback.style.display = "none";
      }
      if (player) {
        player.hidden = false;
        player.style.visibility = "visible";
      }
      stage.classList.add("is-playing");
      stage.classList.remove("is-fallback");
      try {
        player.play?.();
      } catch (_) {}
    };

    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;
    if (reduce) {
      showFallback();
      return;
    }

    const mount = async () => {
      try {
        if (!customElements.get("lottie-player")) {
          await Promise.race([
            customElements.whenDefined("lottie-player"),
            new Promise((_, rej) =>
              window.setTimeout(() => rej(new Error("lottie-timeout")), 5000)
            ),
          ]);
        }
      } catch (_) {
        showFallback();
        return;
      }

      stage.querySelectorAll("lottie-player").forEach((el) => el.remove());

      const player = document.createElement("lottie-player");
      player.className = "jh-way-lottie";
      player.id = "jh-way-lottie";
      player.setAttribute("background", "transparent");
      player.setAttribute("speed", "1");
      player.setAttribute("loop", "");
      player.setAttribute("autoplay", "");
      player.setAttribute("aria-label", "کاراکتر جزوه‌سرا");
      player.style.width = "100%";
      player.style.height = "100%";
      stage.appendChild(player);

      let srcIdx = 0;
      let settled = false;

      const failTimer = window.setTimeout(() => {
        if (!settled) showFallback();
      }, 8000);

      const tryLoad = (src) => {
        const onReady = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(failTimer);
          showPlaying(player);
        };
        const onErr = () => {
          srcIdx += 1;
          if (srcIdx < sources.length) {
            tryLoad(sources[srcIdx]);
            return;
          }
          if (!settled) {
            settled = true;
            window.clearTimeout(failTimer);
            showFallback();
          }
        };
        player.removeEventListener("ready", onReady);
        player.removeEventListener("load", onReady);
        player.removeEventListener("error", onErr);
        player.addEventListener("ready", onReady, { once: true });
        player.addEventListener("load", onReady, { once: true });
        player.addEventListener("error", onErr, { once: true });
        try {
          if (typeof player.load === "function") player.load(src);
          else player.setAttribute("src", src);
        } catch (_) {
          onErr();
        }
      };

      tryLoad(sources[0]);
    };

    mount();
  }

  async function initIndex() {
    injectChrome("index");
    const list = $("#jh-list");
    const err = $("#jh-err");
    const metaEl = $("#jh-results-meta");
    const qInput = $("#filter-q");
    const heroDash = $("#jh-hero-dash");
    if (heroDash) {
      ensureSession()
        .then((me) => {
          if (!heroDash.isConnected) return;
          if (me) {
            heroDash.href = "account.html?tab=overview";
            const lab = heroDash.querySelector("span");
            if (lab) lab.textContent = "ورود به داشبورد";
          } else {
            const stored = storedReferralCode();
            heroDash.href = stored
              ? `login.html?ref=${encodeURIComponent(stored)}`
              : "login.html";
          }
        })
        .catch(() => {});
    }
    const params0 = new URLSearchParams(location.search);
    const urlMajor = (params0.get("major") || "").trim();
    const urlQ = (params0.get("q") || "").trim();
    const urlKind = (params0.get("kind") || "").trim();
    const urlPriced = (params0.get("priced") || "").trim();
    let loadSeq = 0;
    let debounceTimer = 0;
    let majorsList = [];

    let coursesList = [];
    try {
      const meta = await S().api("/api/site/pamphlets/meta");
      const majorSel = $("#filter-major");
      const tax = meta.data?.taxonomy || {};
      majorsList = tax.majors || [];
      const byMajor = tax.courses_by_major || {};
      const courseSet = new Set();
      Object.values(byMajor).forEach((arr) => {
        (arr || []).forEach((c) => {
          const name = String(c || "").trim();
          if (name) courseSet.add(name);
        });
      });
      coursesList = [...courseSet];
      majorsList.forEach((m) => {
        const o = document.createElement("option");
        o.value = m;
        o.textContent = m;
        majorSel?.appendChild(o);
      });
      if (urlMajor && majorSel) majorSel.value = urlMajor;
    } catch (_) {}

    if (qInput && urlQ) qInput.value = urlQ;
    if ($("#filter-kind") && urlKind) $("#filter-kind").value = urlKind;
    if ($("#filter-priced") && urlPriced) $("#filter-priced").value = urlPriced;

    // Full Beheshti paramed catalog for cloud + marquee (dense seamless loops)
    const beheshtiCourseCatalog = [
      "شیمی عمومی",
      "آناتومی",
      "بافت‌شناسی",
      "بیوشیمی عمومی",
      "زیست‌شناسی سلولی و مولکولی",
      "فیزیولوژی",
      "آمار حیاتی و روش تحقیق",
      "فوریت‌های پزشکی",
      "بهداشت عمومی و اپیدمیولوژی",
      "مقدمات آزمایشگاه",
      "میکروب‌شناسی عمومی",
      "بیوشیمی پزشکی ۱",
      "بیوشیمی پزشکی ۲",
      "ویروس‌شناسی پزشکی",
      "ایمنی‌شناسی پزشکی ۱",
      "ایمنی‌شناسی پزشکی ۲",
      "خون‌شناسی ۱",
      "خون‌شناسی ۲",
      "قارچ‌شناسی پزشکی",
      "باکتری‌شناسی پزشکی",
      "انگل‌شناسی ۱ (کرم‌ها)",
      "انگل‌شناسی ۲ (تک‌یاخته و حشره)",
      "ژنتیک پزشکی",
      "ایمونوهماتولوژی و انتقال خون",
      "آسیب‌شناسی عمومی",
      "داروشناسی و سم‌شناسی",
      "هورمون‌شناسی",
      "تضمین کیفیت در آزمایشگاه",
      "تکنیک‌های مولکولی و پیشرفته آزمایشگاهی",
      "فیزیک پرتوها",
      "روش‌های پرتونگاری ۱",
      "روش‌های پرتونگاری ۲",
      "روش‌های پرتونگاری ۳",
      "روش‌های پرتونگاری اختصاصی",
      "فیزیک پرتوشناسی تشخیصی",
      "رادیوبیولوژی",
      "آناتومی مقطعی",
      "سی‌تی‌اسکن",
      "ام‌آرآی",
      "سونوگرافی",
      "دوزیمتری پرتوهای یونیزان",
      "ارزیابی تصاویر پزشکی ۱",
      "ارزیابی تصاویر پزشکی ۲",
      "حفاظت در برابر پرتوهای یونیزان",
      "فیزیک تشعشع",
      "دوزیمتری",
      "دوزیمتری کلینیکی",
      "مبانی انکولوژی",
      "دستگاه‌های پرتودرمانی",
      "کاربردهای بالینی پرتودرمانی ۱",
      "کاربردهای بالینی پرتودرمانی ۲",
      "سیمولیشن و لوکالیزاسیون",
      "فیزیک براکی‌تراپی",
      "تکنیک‌های براکی‌تراپی",
      "انکولوژی اطفال",
      "مدلینگ (قالب و فیکساتورسازی)",
      "کنترل کیفی",
      "روانشناسی بیماران سرطان",
      "پاتولوژی بیماری‌های بدخیم",
      "روند درمان و مراقبت‌های لازم در بیماران سرطانی",
      "پزشکی هسته‌ای",
      "بانک خون",
      "فارماکولوژی",
      "تکنیک‌های تصویربرداری",
    ];

    const collectCoursePool = (minSize = 36) => {
      const pool = [];
      const seen = new Set();
      const pushUnique = (name) => {
        const n = String(name || "").trim();
        if (!n || seen.has(n)) return;
        seen.add(n);
        pool.push(n);
      };
      (coursesList || []).forEach(pushUnique);
      beheshtiCourseCatalog.forEach(pushUnique);
      let guard = 0;
      while (pool.length < minSize && guard < 80) {
        beheshtiCourseCatalog.forEach(pushUnique);
        guard += 1;
        if (pool.length >= minSize) break;
      }
      return pool;
    };

    const paintSubjectCloud = () => {
      const cloud = $("#jh-subject-cloud");
      if (!cloud) return;

      const pool = collectCoursePool(24);
      const stickers = [
        "sticker-book.svg",
        "sticker-brain.svg",
        "sticker-microscope.svg",
        "sticker-pen.svg",
        "sticker-flask.svg",
        "sticker-lamp.svg",
        "discover/education.svg",
        "discover/writing.svg",
        "sticker-cap.svg",
        "discover/design.svg",
      ];
      const rowCount = 4;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      const chunkRows = (items, n) => {
        const rows = Array.from({ length: n }, () => []);
        items.forEach((item, i) => rows[i % n].push(item));
        return rows;
      };

      const renderSeq = (names, rowIndex, interactive) => {
        const bits = [];
        names.forEach((name, i) => {
          const tagAttrs = interactive
            ? `type="button" class="jh-cloud-tag" data-q="${S().esc(name)}"`
            : `type="button" class="jh-cloud-tag is-static" tabindex="-1" aria-hidden="true"`;
          bits.push(
            `<button ${tagAttrs}>${S().esc(name)}</button>`
          );
          // denser stickers: roughly every 2 tags
          if (i % 2 === 1) {
            const src = stickers[(rowIndex * 3 + i) % stickers.length];
            bits.push(
              `<span class="jh-cloud-sticker" aria-hidden="true"><img src="assets/${src}?v=3" alt="" width="40" height="40" loading="lazy" decoding="async" onerror="this.parentElement.hidden=true" /></span>`
            );
          }
        });
        return bits.join("");
      };

      const intro =
        cloud.querySelector(".jh-cloud-intro")?.outerHTML ||
        `<header class="jh-cloud-intro">
          <h2 class="jh-cloud-kicker">از درس‌های پایه تا تخصصی، جای جزوه‌ات اینجاست.</h2>
          <p class="jh-cloud-sub">جزوه‌های موردنیازت رو پیدا کن و منابع درسی‌ات رو کنار برنامهٔ مطالعه‌ات داشته باش.</p>
        </header>`;

      const rows = chunkRows(pool, rowCount);
      const lanes = rows
        .map((names, rowIndex) => {
          let laneNames = names.slice();
          if (laneNames.length < 6) {
            for (const n of pool) {
              if (laneNames.length >= 6) break;
              if (!laneNames.includes(n)) laneNames.push(n);
            }
          }
          const seq = renderSeq(laneNames, rowIndex, true);
          const clone = reduceMotion
            ? ""
            : `<div class="jh-cloud-seq" aria-hidden="true">${renderSeq(
                laneNames,
                rowIndex,
                false
              )}</div>`;
          return `<div class="jh-cloud-row" data-dir="${
            rowIndex % 2 === 0 ? 1 : -1
          }" data-speed="${0.26 + (rowIndex % 3) * 0.05}">
            <div class="jh-cloud-track">
              <div class="jh-cloud-seq">${seq}</div>
              ${clone}
            </div>
          </div>`;
        })
        .join("");

      cloud.innerHTML = `${intro}<div class="jh-cloud-lanes" aria-label="برچسب‌های درسی">${lanes}</div>`;

      const activateTag = (btn) => {
        const q = btn.getAttribute("data-q") || "";
        if (!q || btn.classList.contains("is-static")) return;
        if (qInput) qInput.value = q;
        cloud.querySelectorAll(".jh-cloud-tag:not(.is-static)").forEach((b) =>
          b.classList.toggle("is-on", b === btn)
        );
        syncClearBtn();
        document
          .getElementById("jh-shop")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
        load({ immediate: true });
      };

      cloud.querySelectorAll(".jh-cloud-tag:not(.is-static)").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          if (btn.closest(".jh-cloud-row")?.dataset.suppressClick === "1") {
            e.preventDefault();
            return;
          }
          activateTag(btn);
        });
      });

      if (reduceMotion) return;

      const lanesEl = cloud.querySelector(".jh-cloud-lanes");
      let hovering = false;

      const states = Array.from(cloud.querySelectorAll(".jh-cloud-row")).map(
        (row) => {
          const track = row.querySelector(".jh-cloud-track");
          const dir = Number(row.getAttribute("data-dir") || 1);
          const speed = Number(row.getAttribute("data-speed") || 0.3);
          return {
            row,
            track,
            dir,
            speed,
            offset: 0,
            dragging: false,
            startX: 0,
            startOffset: 0,
            moved: false,
            half: 0,
            primed: false,
          };
        }
      );

      const measure = () => {
        states.forEach((s) => {
          const seq = s.track.querySelector(".jh-cloud-seq");
          s.half = seq ? seq.offsetWidth : Math.floor(s.track.scrollWidth / 2);
          if (!s.primed) {
            s.offset = s.dir < 0 ? -s.half : 0;
            s.primed = true;
          }
        });
      };

      const wrapOffset = (s) => {
        if (!s.half) return;
        while (s.offset <= -s.half) s.offset += s.half;
        while (s.offset > 0) s.offset -= s.half;
      };

      const apply = (s) => {
        s.track.style.transform = `translate3d(${s.offset}px, 0, 0)`;
      };

      const tick = () => {
        states.forEach((s) => {
          if (!s.dragging && !hovering) {
            s.offset -= s.speed * s.dir;
            wrapOffset(s);
            apply(s);
          }
        });
        cloud._jhCloudRaf = requestAnimationFrame(tick);
      };

      lanesEl?.addEventListener("pointerenter", (e) => {
        if (e.pointerType === "mouse") hovering = true;
      });
      lanesEl?.addEventListener("pointerleave", (e) => {
        if (e.pointerType === "mouse" && !states.some((s) => s.dragging)) {
          hovering = false;
        }
      });

      states.forEach((s) => {
        const onDown = (e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          s.dragging = true;
          s.moved = false;
          s.startX = e.clientX;
          s.startOffset = s.offset;
          s.row.classList.add("is-dragging");
          s.row.dataset.suppressClick = "0";
          hovering = true;
          try {
            s.row.setPointerCapture(e.pointerId);
          } catch (_) {}
        };
        const onMove = (e) => {
          if (!s.dragging) return;
          const dx = e.clientX - s.startX;
          if (Math.abs(dx) > 6) {
            s.moved = true;
            s.row.dataset.suppressClick = "1";
          }
          s.offset = s.startOffset + dx;
          wrapOffset(s);
          apply(s);
        };
        const onUp = (e) => {
          if (!s.dragging) return;
          s.dragging = false;
          s.row.classList.remove("is-dragging");
          try {
            s.row.releasePointerCapture(e.pointerId);
          } catch (_) {}
          if (s.moved) {
            setTimeout(() => {
              s.row.dataset.suppressClick = "0";
            }, 120);
          }
          hovering =
            e.pointerType === "mouse" && !!lanesEl?.matches(":hover");
        };

        s.row.addEventListener("pointerdown", onDown);
        s.row.addEventListener("pointermove", onMove);
        s.row.addEventListener("pointerup", onUp);
        s.row.addEventListener("pointercancel", onUp);
      });

      measure();
      states.forEach(apply);
      window.addEventListener("resize", () => {
        const prev = states.map((s) => ({
          ratio: s.half ? s.offset / s.half : 0,
        }));
        measure();
        states.forEach((s, i) => {
          s.offset = (prev[i]?.ratio || 0) * s.half;
          wrapOffset(s);
          apply(s);
        });
      });
      cloud._jhCloudRaf = requestAnimationFrame(tick);
    };

    const paintMarquee = () => {
      const track = $("#jh-mkt-marquee");
      if (!track) return;
      const courseNames = collectCoursePool(36);

      const base = [
        { label: "علوم آزمایشگاهی", major: "علوم آزمایشگاهی" },
        { label: "رادیولوژی", major: "رادیولوژی" },
        { label: "رادیوتراپی", major: "رادیوتراپی" },
        { label: "تایپی", kind: "typed" },
        { label: "دست‌نویس", kind: "handwritten" },
        { label: "رایگان", priced: "free" },
        ...courseNames.map((c) => ({ label: c, q: c })),
      ];
      const renderTag = (t) => {
        const attrs = [
          t.q ? `data-q="${S().esc(t.q)}"` : "",
          t.kind ? `data-kind="${S().esc(t.kind)}"` : "",
          t.priced ? `data-priced="${S().esc(t.priced)}"` : "",
          t.major ? `data-major="${S().esc(t.major)}"` : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `<button type="button" class="jh-mkt-tag" ${attrs}>${S().esc(
          t.label
        )}</button>`;
      };
      // Triple copy + -33.333% animation = seamless, no white gap
      const seq = base.map(renderTag).join("");
      track.innerHTML = `
        <div class="jh-mkt-marquee-seq">${seq}</div>
        <div class="jh-mkt-marquee-seq" aria-hidden="true">${seq}</div>
        <div class="jh-mkt-marquee-seq" aria-hidden="true">${seq}</div>
      `;
      track.querySelectorAll(".jh-mkt-tag").forEach((btn) => {
        btn.addEventListener("click", () => {
          const q = btn.getAttribute("data-q") || "";
          const kind = btn.getAttribute("data-kind") || "";
          const priced = btn.getAttribute("data-priced") || "";
          const major = btn.getAttribute("data-major") || "";
          if (qInput && q) qInput.value = q;
          if ($("#filter-kind") && kind) $("#filter-kind").value = kind;
          if ($("#filter-priced") && priced) $("#filter-priced").value = priced;
          if ($("#filter-major") && major) $("#filter-major").value = major;
          track.querySelectorAll(".jh-mkt-tag").forEach((b) =>
            b.classList.toggle("is-on", b === btn)
          );
          syncClearBtn();
          document
            .getElementById("jh-shop")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
          load({ immediate: true });
        });
      });
    };

    const readFilters = () => ({
      q: normSearchQuery(qInput?.value || ""),
      major: ($("#filter-major")?.value || "").trim(),
      priced: ($("#filter-priced")?.value || "").trim(),
      content_kind: ($("#filter-kind")?.value || "").trim(),
    });

    const hasActiveFilters = () => {
      const f = readFilters();
      return !!(f.q || f.major || f.priced || f.content_kind);
    };

    const syncClearBtn = () => {
      const clearBtn = $("#btn-clear-filters");
      if (!clearBtn) return;
      clearBtn.hidden = !hasActiveFilters();
    };

    const syncUrl = (f) => {
      const next = new URLSearchParams();
      if (f.q) next.set("q", f.q);
      if (f.major) next.set("major", f.major);
      if (f.content_kind) next.set("kind", f.content_kind);
      if (f.priced) next.set("priced", f.priced);
      const qs = next.toString();
      const url = qs ? `${location.pathname}?${qs}` : location.pathname;
      history.replaceState(null, "", url);
    };

    async function load(opts = {}) {
      const immediate = !!opts.immediate;
      err.hidden = true;
      const f = readFilters();
      syncUrl(f);
      const qs = new URLSearchParams({ limit: "60" });
      if (f.q) qs.set("q", f.q);
      if (f.major) qs.set("major", f.major);
      if (f.priced) qs.set("priced", f.priced);
      if (f.content_kind) qs.set("content_kind", f.content_kind);
      const seq = ++loadSeq;
      if (list && !list.dataset.loading) {
        list.dataset.loading = "1";
        if (metaEl) {
          metaEl.hidden = false;
          metaEl.textContent = "در حال جست‌وجو…";
        }
      }
      try {
        const res = await S().api(`/api/site/pamphlets?${qs}`);
        if (seq !== loadSeq) return;
        const items = res.data || [];
        if (metaEl) {
          metaEl.hidden = false;
          metaEl.textContent = items.length
            ? `${items.length.toLocaleString("fa-IR")} جزوه`
            : hasActiveFilters()
              ? "نتیجه‌ای نیست"
              : "";
          if (!metaEl.textContent) metaEl.hidden = true;
        }
        if (items.length) {
          list.innerHTML = `<div class="jh-grid">${items.map(cardHtml).join("")}</div>`;
          hydrateCardCovers(list);
          return;
        }
        if (hasActiveFilters()) {
          list.innerHTML = `<div class="jh-empty">
            <strong>برای این جست‌وجو نتیجه‌ای پیدا نشد</strong>
            <p>نام درس را کوتاه‌تر بنویس یا بعضی فیلترها را حذف کن.</p>
            <div class="jh-actions">
              <button class="jh-btn" type="button" id="btn-clear-inline">پاک‌کردن فیلترها</button>
            </div>
          </div>`;
          $("#btn-clear-inline")?.addEventListener("click", clearFilters);
        } else {
          list.innerHTML = `<div class="jh-empty">
            <strong>هنوز جزوه‌ای در فروشگاه منتشر نشده</strong>
            <p>به‌زودی جزوات پایلوت اینجا می‌آید. اگر فایل آماده داری می‌توانی منتشر کنی.</p>
            <div class="jh-actions">
              <a class="jh-btn secondary" href="learn.html#publish-steps">آموزش و راهنما و قوانین</a>
              <a class="jh-btn warm" href="submit.html">انتشار جزوه</a>
            </div>
          </div>`;
        }
      } catch (e) {
        if (seq !== loadSeq) return;
        list.innerHTML = `<div class="jh-empty">
          <strong>دریافت فهرست ممکن نشد</strong>
          <p>${S().esc(e.message || "خطای سرور")}</p>
          <div class="jh-actions">
            <button class="jh-btn" type="button" id="btn-retry">تلاش دوباره</button>
          </div>
        </div>`;
        $("#btn-retry")?.addEventListener("click", () => load({ immediate: true }));
        msg(err, e.message || "خطا");
      } finally {
        if (seq === loadSeq && list) delete list.dataset.loading;
      }
      void immediate;
    }

    function scheduleLoad() {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => load({ immediate: true }), 320);
    }

    function clearFilters() {
      if (qInput) qInput.value = "";
      if ($("#filter-major")) $("#filter-major").value = "";
      if ($("#filter-priced")) $("#filter-priced").value = "";
      if ($("#filter-kind")) $("#filter-kind").value = "";
      $$(".jh-mkt-tag").forEach((b) => b.classList.remove("is-on"));
      syncClearBtn();
      load({ immediate: true });
    }

    paintSubjectCloud();
    initWayLottie();

    const jumpToShop = () => {
      document
        .getElementById("jh-shop")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    $("#btn-filter")?.addEventListener("click", () => {
      syncClearBtn();
      load({ immediate: true });
      jumpToShop();
    });
    $("#btn-clear-filters")?.addEventListener("click", clearFilters);
    qInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        window.clearTimeout(debounceTimer);
        syncClearBtn();
        load({ immediate: true });
        jumpToShop();
      }
    });
    qInput?.addEventListener("input", () => {
      syncClearBtn();
      scheduleLoad();
    });
    qInput?.addEventListener("search", () => {
      syncClearBtn();
      load({ immediate: true });
    });
    ["filter-major", "filter-kind", "filter-priced"].forEach((id) => {
      $(`#${id}`)?.addEventListener("change", () => {
        syncClearBtn();
        load({ immediate: true });
      });
    });
    syncClearBtn();
    await load({ immediate: true });
    if (location.hash === "#jh-shop") {
      window.requestAnimationFrame(() => {
        document
          .getElementById("jh-shop")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function formatBytesFa(n) {
    const v = Number(n) || 0;
    if (v < 1024) return `${toFaDigits(v)} B`;
    if (v < 1024 * 1024) return `${toFaDigits((v / 1024).toFixed(1))} KB`;
    return `${toFaDigits((v / (1024 * 1024)).toFixed(1))} MB`;
  }

  async function initItem() {
    injectChrome("index");
    const id = new URLSearchParams(location.search).get("id");
    const box = $("#jh-item");
    const err = $("#jh-err");
    if (!id) return msg(err, "شناسه نامعتبر");
    try {
      const [res, metaRes, commentsRes] = await Promise.all([
        S().api(`/api/site/pamphlets/item/${encodeURIComponent(id)}`),
        S().api("/api/site/pamphlets/meta").catch(() => ({ data: {} })),
        S()
          .api(`/api/site/pamphlets/item/${encodeURIComponent(id)}/comments`)
          .catch(() => ({ data: [] })),
      ]);
      const p = res.data;
      const me = await ensureSession();
      let walletUnits = Number(me?.wallet_units || 0);
      try {
        if (me) {
          const w = await S().api("/api/site/pamphlets/wallet/me");
          walletUnits = Number(w?.data?.wallet_units || 0);
          paintWalletChip(w?.data || null);
        }
      } catch (_) {}
      const priceNum = Number(p.price_irt || 0);
      const unitsNeed = unitCountOf(p);
      const priceLabel =
        priceNum <= 0
          ? "رایگان"
          : `${money(priceNum)} · ${toFaDigits(unitsNeed)} واحدی`;
      // فقط خریدار واقعی حق دانلود/مطالعه دارد — نویسنده از پنل خودش مدیریت می‌کند
      const purchased = !!p.purchase;
      const isAuthor = !!p.is_author;
      const authorName = p.is_anonymous
        ? "ناشناس"
        : (p.authors_text || "").trim() || "نویسنده جزوه‌سرا";
      const initial = authorInitial(authorName);
      const goldenChip = p.golden_badge
        ? '<span class="jh-badge jh-badge--golden">تأییدیه طلایی</span>'
        : "";
      const kindFa = p.content_kind === "handwritten" ? "دست‌نویس" : "تایپی";
      const covFa =
        ({
          short: "بخش کوتاه",
          midterm: "میان‌ترم",
          final: "پایان‌ترم",
          full: "پوشش کامل",
          partial: "بخشی از درس",
        })[p.coverage] || "بخش کوتاه";
      const topics = Array.isArray(p.topics) ? p.topics : [];
      const tags = [p.faculty || "پیراپزشکی", p.major, p.course_name, kindFa]
        .filter(Boolean)
        .map((t) => `<span class="jh-tag">${S().esc(t)}</span>`)
        .join("");
      const sizeFa = formatBytesFa(p.file_size_bytes || 0);
      const viewsFa = toFaDigits(p.downloads || p.sales_count || 0);
      const updatedRaw = p.updated_at || p.published_at || "";
      const updatedFa = formatJalaliDateFa(updatedRaw);
      const updatedSlashFa = formatJalaliSlashFa(updatedRaw);
      const comments = commentsRes.data || [];
      const majorQ = encodeURIComponent(p.major || p.field_of_study || "");
      const courseQ = encodeURIComponent(p.course_name || "");

      const dedupeRelated = (list) => {
        const seen = new Set();
        return (list || []).filter((x) => {
          const xid = String(x.id);
          if (xid === String(id) || seen.has(xid)) return false;
          seen.add(xid);
          return true;
        });
      };
      const relatedPromise = (async () => {
        const same = await S()
          .api(
            `/api/site/pamphlets?major=${majorQ}&course=${courseQ}&limit=12`
          )
          .catch(() => ({ data: [] }));
        const sameCourse = dedupeRelated(same.data || []);
        let similar = [...sameCourse];
        if (similar.length < 3 && majorQ) {
          const byMajor = await S()
            .api(`/api/site/pamphlets?major=${majorQ}&limit=12`)
            .catch(() => ({ data: [] }));
          similar = dedupeRelated([...similar, ...(byMajor.data || [])]);
        }
        return { sameCourse, similar };
      })();

      const fallbackCover = `<div class="jh-hero-fallback">
            <span>${S().esc(p.major || "پیراپزشکی")}</span>
            <strong>${S().esc(p.course_name || "جزوه")}</strong>
            <span>${S().esc(kindFa)}</span>
          </div>`;

      const badgeLabel = [p.major, p.course_name].filter(Boolean).slice(0, 1)[0] ||
        "جزوه";
      box.innerHTML = `
        <nav class="jh-crumb" aria-label="مسیر">
          <a href="index.html">فروشگاه</a>
          <span>›</span>
          <a href="index.html?major=${majorQ}">${S().esc(
        p.major || "پیراپزشکی"
      )}</a>
          <span>›</span>
          <span>${S().esc(p.course_name || "جزوه")}</span>
        </nav>

        <article class="jh-gama-card">
          <div class="jh-gama-stage">
            <div class="jh-gama-tools" role="group" aria-label="ابزارهای جزوه">
              <span class="jh-vtool jh-vtool--stat" id="jh-dl-stat" title="تعداد دانلود موفق" aria-label="${viewsFa} دانلود موفق">
                <span class="jh-vtool-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/></svg>
                </span>
                <span class="jh-vtool-val" id="jh-dl-count">${viewsFa}</span>
                <span class="jh-vtool-lab">دانلود موفق</span>
              </span>
              <button type="button" class="jh-vtool jh-vtool--share" id="btn-share" aria-label="اشتراک‌گذاری" aria-expanded="false" aria-controls="jh-share-sheet">
                <span class="jh-vtool-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.5-4.1"/><path d="m8.2 13.2 7.5 4.1"/></svg>
                </span>
                <span class="jh-vtool-lab">اشتراک</span>
              </button>
              <div class="jh-share-sheet" id="jh-share-sheet" hidden>
                <header class="jh-share-sheet-head">
                  <strong>اشتراک‌گذاری جزوه</strong>
                  <button type="button" class="jh-share-close" id="btn-share-close" aria-label="بستن">×</button>
                </header>
                <p class="jh-share-sheet-note" id="jh-share-note">لینک این صفحه را کپی کن یا با اپ‌ها بفرست.</p>
                <div class="jh-share-link-row">
                  <input class="jh-share-input" id="jh-share-url" type="text" readonly dir="ltr" />
                  <button type="button" class="jh-btn" id="btn-share-copy">کپی لینک</button>
                </div>
                <div class="jh-share-apps" id="jh-share-apps">
                  <a class="jh-share-app jh-share-app--tg" id="jh-share-tg" target="_blank" rel="noopener">تلگرام</a>
                  <a class="jh-share-app jh-share-app--wa" id="jh-share-wa" target="_blank" rel="noopener">واتساپ</a>
                  <a class="jh-share-app jh-share-app--bale" id="jh-share-bale" target="_blank" rel="noopener">بله</a>
                  <a class="jh-share-app jh-share-app--eitaa" id="jh-share-eitaa" target="_blank" rel="noopener">ایتا</a>
                  <button type="button" class="jh-share-app jh-share-app--sys" id="btn-share-native" hidden>اشتراک دستگاه</button>
                </div>
              </div>
            </div>
            <div class="jh-hero-preview" id="jh-hero-preview">
              ${fallbackCover}
              <span class="jh-gama-badge">${S().esc(badgeLabel)}</span>
            </div>
          </div>

          <div class="jh-gama-info">
            <h1 class="jh-item-title">${S().esc(p.title)} ${goldenChip}</h1>
            <div class="jh-author-row">
              <span class="jh-avatar" aria-hidden="true">${S().esc(
                initial
              )}</span>
              <div class="jh-author-meta">
                <strong dir="rtl">${S().esc(authorName)}</strong>
                <span class="jh-author-date" dir="rtl">
                  <span class="jh-author-date-label">به‌روزرسانی</span>
                  <time datetime="${S().esc(
                    String(updatedRaw).slice(0, 10)
                  )}">${S().esc(updatedFa)}</time>
                </span>
                ${
                  p.professor_name
                    ? `<span class="jh-author-prof" dir="rtl">استاد ${S().esc(
                        p.professor_name
                      )}</span>`
                    : ""
                }
              </div>
            </div>

            <div class="jh-tabs" role="tablist">
              <button type="button" class="jh-tab on" data-ptab="desc">توضیحات</button>
              <button type="button" class="jh-tab" data-ptab="topics">مباحث</button>
            </div>
            <div class="jh-ptab on" data-ptab-panel="desc">
              <div class="jh-budget">${S().esc(covFa)} · ${S().esc(
        p.degree_level || "مقطع—"
      )} · ${S().esc(kindFa)}</div>
              <p class="jh-note" dir="rtl">${S().esc(p.summary || "بدون توضیح")}</p>
              <p class="jh-note" dir="rtl"><strong>خارج از پوشش:</strong> ${S().esc(
                p.out_of_scope_text || "—"
              )}</p>
              <p class="jh-note jh-note--soft" dir="rtl">${S().esc(
                metaRes.data?.health_disclaimer || ""
              )}</p>
              <div class="jh-tags">${tags}</div>
              <button type="button" class="jh-report-link" id="btn-report">گزارش تخلف یا خطا</button>
            </div>
            <div class="jh-ptab" data-ptab-panel="topics" hidden>
              <ul class="jh-guide-list">
                ${
                  topics.length
                    ? topics.map((t) => `<li>${S().esc(t)}</li>`).join("")
                    : `<li>${S().esc(
                        p.outline_text || "سرفصل ثبت نشده"
                      )}</li>`
                }
              </ul>
            </div>

            <div class="jh-gama-meta">
              <span class="jh-gama-chip">${S().esc(kindFa)}</span>
              <span class="jh-gama-chip">${S().esc(covFa)}</span>
              <span class="jh-gama-chip jh-gama-chip--muted" dir="rtl">به‌روزرسانی ${S().esc(
                updatedSlashFa
              )}</span>
            </div>

            ${
              !me && !purchased
                ? `<div class="jh-login-hint">برای خرید و دریافت جزوه وارد حساب خود شوید.
                    <a href="login.html?next=${encodeURIComponent(
                      `item.html?id=${id}`
                    )}">ورود</a></div>`
                : ""
            }
          </div>

          <aside class="jh-gama-aside">
            <div class="jh-gama-thumb" id="jh-gama-thumb">
              ${pamphletCoverInner(p)}
            </div>
            <div class="jh-similar" id="jh-similar">
              <header class="jh-similar-head">
                <strong>موارد مشابه</strong>
                <a class="jh-similar-more" href="index.html?major=${majorQ}">همه در این رشته</a>
              </header>
              <div class="jh-similar-list" id="jh-similar-list">
                <p class="jh-meta">در حال بارگذاری…</p>
              </div>
            </div>
          </aside>
        </article>

        <section class="jh-comments" id="jh-comments">
          <header>
            <strong>نظرات خریداران</strong>
            <span id="jh-comments-count">${toFaDigits(comments.length)} نظر تأییدشده</span>
          </header>
          ${
            purchased || isAuthor
              ? `<div class="jh-comment-compose">
            <input id="jh-comment-input" type="text" dir="rtl" lang="fa" maxlength="500"
              placeholder="نظرت را بنویس؛ بعد از تأیید نویسنده منتشر می‌شود…" />
            <button type="button" class="jh-comment-send" id="jh-comment-send" aria-label="ارسال نظر" title="ارسال">←</button>
          </div>
          <p class="jh-comment-hint">نظرها بلافاصله عمومی نمی‌شوند؛ نویسنده جزوه باید تأیید کند.</p>`
              : me
                ? `<p class="jh-comment-gate">بعد از خرید این جزوه می‌توانی نظر بدهی. نظرات تأییدشدهٔ خریداران را پایین ببین.</p>`
                : `<p class="jh-comment-gate">برای نظر دادن ابتدا <a href="login.html?next=${encodeURIComponent(
                    `item.html?id=${id}`
                  )}">وارد شو</a> و جزوه را بخر.</p>`
          }
          <div id="jh-comments-list" class="jh-comments-list"></div>
        </section>

        <section class="jh-rail" id="jh-rail" hidden>
          <header class="jh-rail-head">
            <strong>جزوه‌های ${S().esc(p.course_name || "همین درس")}</strong>
            <div class="jh-rail-nav">
              <button type="button" class="jh-rail-btn" data-rail="prev" aria-label="قبلی">‹</button>
              <button type="button" class="jh-rail-btn" data-rail="next" aria-label="بعدی">›</button>
            </div>
          </header>
          <div class="jh-rail-track" id="jh-rail-track"></div>
        </section>

        <div class="jh-sticky-spacer" aria-hidden="true"></div>
        <div class="jh-sticky-dock" id="jh-sticky-dock">
          <div class="jh-buy-bar" id="jh-buy-bar"></div>
        </div>`;

      const heroHost = $("#jh-hero-preview");
      if (heroHost) {
        const badge = heroHost.querySelector(".jh-gama-badge");
        await mountPreviewFlipper(
          heroHost,
          id,
          fallbackCover,
          p.pages_count || 0
        );
        if (badge) heroHost.appendChild(badge);
      }
      const thumbHost = $("#jh-gama-thumb");
      if (thumbHost) hydrateCardCovers(thumbHost);

      const renderComments = (list) => {
        const host = $("#jh-comments-list");
        const count = $("#jh-comments-count");
        if (count) count.textContent = `${toFaDigits(list.length)} نظر`;
        if (!host) return;
        host.innerHTML = list.length
          ? list
              .map(
                (c) => `<article class="jh-comment" dir="rtl">
              <strong>${S().esc(c.author_name || "کاربر")}</strong>
              <p dir="rtl">${S().esc(c.body || "")}</p>
              <span class="jh-meta">${S().esc(
                (c.created_at || "").slice(0, 16)
              )}</span>
            </article>`
              )
              .join("")
          : `<p class="jh-meta">هنوز نظری ثبت نشده.</p>`;
      };
      renderComments(comments);

      $$("[data-ptab]").forEach((btn) =>
        btn.addEventListener("click", () => {
          const t = btn.getAttribute("data-ptab");
          $$("[data-ptab]").forEach((b) =>
            b.classList.toggle("on", b === btn)
          );
          $$("[data-ptab-panel]").forEach((panel) => {
            const on = panel.getAttribute("data-ptab-panel") === t;
            panel.hidden = !on;
            panel.classList.toggle("on", on);
          });
        })
      );

      const buy = $("#jh-buy-bar");
      const safePdfName = () => {
        const base = String(p.title || "pamphlet")
          .replace(/[^A-Za-z0-9._-]+/g, "_")
          .replace(/_+/g, "_")
          .replace(/^_|_$/g, "")
          .slice(0, 40);
        return `${base || "pamphlet"}.pdf`;
      };
      const setCtaBusy = (busy, label) => {
        const btn =
          $("#btn-dl") ||
          (document.activeElement?.id === "btn-buy-units"
            ? $("#btn-buy-units")
            : null) ||
          $("#btn-buy-units") ||
          $("#btn-buy");
        if (!btn) return;
        btn.disabled = !!busy;
        btn.classList.toggle("is-busy", !!busy);
        const lab = btn.querySelector(".jh-dl-label");
        if (lab && label) lab.textContent = label;
        $$("#btn-buy, #btn-buy-units").forEach((b) => {
          if (b !== btn) b.disabled = !!busy;
        });
      };
      const bumpDownloadStat = () => {
        const el = $("#jh-dl-count");
        if (!el) return;
        const raw = String(el.textContent || "")
          .replace(/[^\d۰-۹٠-٩]/g, "")
          .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
          .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
        const n = Number(raw || 0) + 1;
        el.textContent = toFaDigits(n);
      };
      const renderPurchasedDock = () => {
        buy.innerHTML = `
          <div class="jh-dock-actions">
            <button type="button" class="jh-dl-cta jh-dl-cta--owned" id="btn-dl">
              <span class="jh-dl-owned-badge">خریداری‌شده</span>
              <span class="jh-dl-owned-main">
                <span class="jh-dl-label">دانلود PDF</span>
                <span class="jh-dl-owned-sub">فایل آماده‌ات</span>
              </span>
              <span class="jh-dl-file" dir="ltr"><span class="jh-dl-file-ico">PDF</span><span>${S().esc(
                sizeFa
              )}</span></span>
            </button>
            <a class="jh-dock-read" href="read.html?id=${S().esc(
              id
            )}">مطالعه</a>
          </div>`;
        $("#btn-dl")?.addEventListener("click", doDownload);
      };
      const renderBuyDock = () => {
        const canUnits = priceNum > 0 && walletUnits >= unitsNeed;
        const chargeHref = "account.html?tab=overview&buy=1";
        if (priceNum <= 0) {
          buy.innerHTML = `
            <div class="jh-dock-actions">
              <button type="button" class="jh-dl-cta" id="btn-buy">
                <span class="jh-dl-price">${S().esc(priceLabel)}</span>
                <span class="jh-dl-label">دریافت رایگان PDF</span>
                <span class="jh-dl-file" dir="ltr"><span class="jh-dl-file-ico">PDF</span><span>${S().esc(
                  sizeFa
                )}</span></span>
              </button>
            </div>`;
          $("#btn-buy")?.addEventListener("click", () => doBuy("zarinpal"));
          return;
        }
        if (canUnits) {
          buy.innerHTML = `
            <div class="jh-dock-actions">
              <button type="button" class="jh-dl-cta jh-dl-cta--units" id="btn-buy-units">
                <span class="jh-dl-price">${toFaDigits(unitsNeed)} واحد</span>
                <span class="jh-dl-label">خرید با موجودی قابل خرید</span>
                <span class="jh-dl-file" dir="ltr"><span class="jh-dl-file-ico">کیف</span><span>موجودی ${toFaDigits(
                  walletUnits
                )}</span></span>
              </button>
              <button type="button" class="jh-btn secondary jh-buy-units" id="btn-buy">
                خرید نقدی با زرین‌پال
                <span class="jh-meta">${S().esc(priceLabel)}</span>
              </button>
            </div>`;
          $("#btn-buy-units")?.addEventListener("click", () => doBuy("units"));
          $("#btn-buy")?.addEventListener("click", () => doBuy("zarinpal"));
          return;
        }
        buy.innerHTML = `
          <div class="jh-dock-actions">
            <button type="button" class="jh-dl-cta" id="btn-buy">
              <span class="jh-dl-price">${S().esc(priceLabel)}</span>
              <span class="jh-dl-label">خرید با زرین‌پال</span>
              <span class="jh-dl-file" dir="ltr"><span class="jh-dl-file-ico">PDF</span><span>${S().esc(
                sizeFa
              )}</span></span>
            </button>
            <a class="jh-btn secondary jh-buy-units-link" href="${chargeHref}">
              موجودی قابل خرید ناکافی
              <span class="jh-meta">الان ${toFaDigits(
                walletUnits
              )} واحد · نیاز به ${toFaDigits(unitsNeed)} · انتقال یا خرید اشتراک</span>
            </a>
          </div>`;
        $("#btn-buy")?.addEventListener("click", () => doBuy("zarinpal"));
      };
      const doDownload = async () => {
        setCtaBusy(true, "در حال دانلود…");
        try {
          const blob = await S().fetchPdfBlob(
            `/api/site/pamphlets/item/${encodeURIComponent(id)}/download`
          );
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = safePdfName();
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          bumpDownloadStat();
          msg(err, "دانلود شروع شد", true);
        } catch (e) {
          msg(err, e.message || "دانلود ناموفق");
        } finally {
          setCtaBusy(false, "دانلود PDF");
        }
      };
      const doBuy = async (payWith = "zarinpal") => {
        const sess = await ensureSession();
        if (!sess)
          return (location.href = `login.html?next=${encodeURIComponent(
            `item.html?id=${id}`
          )}`);
        const withUnits = payWith === "units";
        setCtaBusy(
          true,
          priceNum <= 0
            ? "در حال دریافت…"
            : withUnits
              ? "در حال کسر واحد…"
              : "انتقال به درگاه امن…"
        );
        try {
          const pay = await S().api(
            `/api/site/pamphlets/item/${encodeURIComponent(id)}/purchase`,
            {
              method: "POST",
              body: JSON.stringify({
                environment: PAY_ENV,
                pay_with: withUnits ? "units" : "zarinpal",
              }),
            }
          );
          if (pay.data?.already_owned || pay.data?.free || pay.data?.paid_with_units) {
            if (pay.data?.wallet_units != null) {
              walletUnits = Number(pay.data.wallet_units) || 0;
              paintWalletChip({
                wallet_balance_irt: sess.wallet_balance_irt,
                wallet_units: walletUnits,
              });
            }
            renderPurchasedDock();
            await doDownload();
            return;
          }
          if (pay.data?.start_pay_url)
            return (location.href = pay.data.start_pay_url);
          msg(err, "پاسخ درگاه نامعتبر");
        } catch (e) {
          msg(err, e.message || "خطای خرید");
        } finally {
          const unitsPrimary = !!$("#btn-buy-units.jh-dl-cta");
          setCtaBusy(
            false,
            priceNum <= 0
              ? "دریافت رایگان PDF"
              : unitsPrimary
                ? "خرید با موجودی قابل خرید"
                : "خرید با زرین‌پال"
          );
        }
      };

      if (purchased) {
        renderPurchasedDock();
      } else if (isAuthor) {
        buy.innerHTML = `
          <div class="jh-dock-actions">
            <a class="jh-dl-cta jh-dl-cta--author" href="account.html?tab=mine">
              <span class="jh-dl-price">نویسنده</span>
              <span class="jh-dl-label">مدیریت در حساب من</span>
              <span class="jh-dl-file" dir="ltr"><span class="jh-dl-file-ico">PDF</span><span>${S().esc(
                sizeFa
              )}</span></span>
            </a>
          </div>`;
      } else {
        renderBuyDock();
      }

      const shareBtn = $("#btn-share");
      const shareSheet = $("#jh-share-sheet");
      const shareInput = $("#jh-share-url");
      const shareNote = $("#jh-share-note");
      const shareNativeBtn = $("#btn-share-native");
      const preferNativeShare = () => {
        if (typeof navigator.share !== "function") return false;
        const ua = navigator.userAgent || "";
        const mobileUa = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry/i.test(
          ua
        );
        const coarse =
          window.matchMedia &&
          window.matchMedia("(pointer: coarse)").matches;
        const narrow = window.matchMedia && window.matchMedia("(max-width: 820px)").matches;
        return mobileUa || (coarse && narrow);
      };
      const closeShareSheet = () => {
        if (!shareSheet) return;
        shareSheet.hidden = true;
        shareBtn?.setAttribute("aria-expanded", "false");
      };
      const openShareSheet = (shareUrl) => {
        if (!shareSheet || !shareInput) return;
        shareInput.value = shareUrl;
        if (shareNote) {
          shareNote.textContent = preferNativeShare()
            ? "روی گوشی می‌تونی لینک را کپی کنی یا با تلگرام، واتساپ، بله و ایتا بفرستی."
            : "لینک صفحه را کپی کن یا در تلگرام، واتساپ، بله و ایتا باز کن.";
        }
        const tg = $("#jh-share-tg");
        const wa = $("#jh-share-wa");
        const bale = $("#jh-share-bale");
        const eitaa = $("#jh-share-eitaa");
        const title = p.title || "جزوه جزوه‌سرا";
        const encUrl = encodeURIComponent(shareUrl);
        const encText = encodeURIComponent(title);
        if (tg) {
          tg.href = `https://t.me/share/url?url=${encUrl}&text=${encText}`;
        }
        if (wa) {
          wa.href = `https://wa.me/?text=${encodeURIComponent(
            `${title}\n${shareUrl}`
          )}`;
        }
        if (bale) {
          bale.href = `https://ble.ir/share/url?url=${encUrl}&text=${encText}`;
        }
        if (eitaa) {
          eitaa.href = `https://eitaa.com/share/url?url=${encUrl}&text=${encText}`;
        }
        if (shareNativeBtn) {
          shareNativeBtn.hidden = typeof navigator.share !== "function";
        }
        shareSheet.hidden = false;
        shareBtn?.setAttribute("aria-expanded", "true");
        shareInput.focus();
        shareInput.select();
      };
      const copyShareLink = async (shareUrl) => {
        try {
          await navigator.clipboard.writeText(shareUrl);
          msg(err, "لینک کپی شد", true);
          shareBtn?.classList.add("is-done");
          const lab = shareBtn?.querySelector(".jh-vtool-lab");
          if (lab) lab.textContent = "کپی شد";
          window.setTimeout(() => {
            shareBtn?.classList.remove("is-done");
            if (lab) lab.textContent = "اشتراک";
          }, 1600);
          return true;
        } catch (_) {
          if (shareInput) {
            shareInput.focus();
            shareInput.select();
          }
          msg(err, "لینک را دستی کپی کن");
          return false;
        }
      };
      shareBtn?.addEventListener("click", async () => {
        const shareUrl = location.href.split("#")[0];
        if (preferNativeShare() && typeof navigator.share === "function") {
          try {
            await navigator.share({
              title: p.title || "جزوه",
              text: p.title || "جزوه در جزوه‌سرا",
              url: shareUrl,
            });
            shareBtn.classList.add("is-done");
            const lab = shareBtn.querySelector(".jh-vtool-lab");
            if (lab) lab.textContent = "ارسال شد";
            window.setTimeout(() => {
              shareBtn.classList.remove("is-done");
              if (lab) lab.textContent = "اشتراک";
            }, 1600);
            return;
          } catch (e) {
            if (e && e.name === "AbortError") return;
            // fall through to sheet if native share fails
          }
        }
        if (shareSheet && !shareSheet.hidden) {
          closeShareSheet();
          return;
        }
        openShareSheet(shareUrl);
      });
      $("#btn-share-close")?.addEventListener("click", closeShareSheet);
      $("#btn-share-copy")?.addEventListener("click", () =>
        copyShareLink(shareInput?.value || location.href)
      );
      shareNativeBtn?.addEventListener("click", async () => {
        const shareUrl = shareInput?.value || location.href;
        try {
          await navigator.share({
            title: p.title || "جزوه",
            text: p.title || "جزوه در جزوه‌سرا",
            url: shareUrl,
          });
          closeShareSheet();
        } catch (e) {
          if (e && e.name === "AbortError") return;
          await copyShareLink(shareUrl);
        }
      });
      document.addEventListener("click", (ev) => {
        if (!shareSheet || shareSheet.hidden) return;
        const t = ev.target;
        if (shareSheet.contains(t) || shareBtn?.contains(t)) return;
        closeShareSheet();
      });

      const REPORT_OPTIONS = [
        { code: "duplicate", label: "تکراری" },
        { code: "copyright", label: "نقض کپی‌رایت" },
        { code: "scientific", label: "غلط علمی" },
        { code: "typo", label: "غلط تایپی" },
      ];
      const openReportSheet = () => {
        let sheet = $("#jh-report-sheet");
        if (!sheet) {
          sheet = document.createElement("div");
          sheet.id = "jh-report-sheet";
          sheet.className = "jh-report-sheet";
          sheet.hidden = true;
          sheet.innerHTML = `
            <div class="jh-report-panel" role="dialog" aria-modal="true" aria-labelledby="jh-report-title">
              <header class="jh-report-head">
                <strong id="jh-report-title">گزارش تخلف جزوه</strong>
                <button type="button" class="jh-share-close" id="btn-report-close" aria-label="بستن">×</button>
              </header>
              <p class="jh-note">دلیل گزارش را انتخاب کن. تیم بلوک آن را در ادمین بررسی می‌کند.</p>
              <div class="jh-report-options" id="jh-report-options">
                ${REPORT_OPTIONS.map(
                  (o) =>
                    `<button type="button" class="jh-report-opt" data-reason="${o.code}">${o.label}</button>`
                ).join("")}
              </div>
              <label class="jh-report-details">توضیح بیشتر (اختیاری)
                <textarea id="jh-report-details" rows="3" maxlength="500" placeholder="جزئیات کوتاه…"></textarea>
              </label>
              <button type="button" class="jh-btn" id="btn-report-send" disabled>ثبت گزارش</button>
            </div>`;
          document.body.appendChild(sheet);
        }
        const closeSheet = () => {
          sheet.hidden = true;
        };
        sheet.hidden = false;
        let selected = "";
        const sync = () => {
          $$(".jh-report-opt", sheet).forEach((b) =>
            b.classList.toggle("on", b.dataset.reason === selected)
          );
          const send = $("#btn-report-send", sheet);
          if (send) send.disabled = !selected;
        };
        $$(".jh-report-opt", sheet).forEach((b) => {
          b.onclick = () => {
            selected = b.dataset.reason || "";
            sync();
          };
        });
        $("#btn-report-close", sheet).onclick = closeSheet;
        sheet.onclick = (ev) => {
          if (ev.target === sheet) closeSheet();
        };
        $("#btn-report-send", sheet).onclick = async () => {
          if (!selected) return;
          const sendBtn = $("#btn-report-send", sheet);
          if (sendBtn) sendBtn.disabled = true;
          const details = ($("#jh-report-details", sheet)?.value || "").trim();
          try {
            await S().api(
              `/api/site/pamphlets/item/${encodeURIComponent(id)}/report`,
              {
                method: "POST",
                body: JSON.stringify({
                  reason: selected,
                  details: details.slice(0, 500),
                }),
              }
            );
            closeSheet();
            msg(err, "گزارش ثبت شد و برای بررسی ادمین ارسال شد", true);
            const btn = $("#btn-report");
            if (btn) {
              btn.classList.add("is-done");
              btn.textContent = "گزارش ثبت شد";
              btn.disabled = true;
            }
          } catch (e) {
            msg(err, e.message || "خطا در ثبت گزارش");
            sync();
          }
        };
        sync();
      };
      $("#btn-report")?.addEventListener("click", async () => {
        if (!(await ensureSession()))
          return (location.href = `login.html?next=${encodeURIComponent(
            `item.html?id=${id}`
          )}`);
        openReportSheet();
      });

      const postComment = async () => {
        if (!(purchased || isAuthor)) {
          return msg(err, "فقط خریداران این جزوه می‌توانند نظر بدهند");
        }
        const body = ($("#jh-comment-input")?.value || "").trim();
        if (!body) return;
        if (!(await ensureSession()))
          return (location.href = `login.html?next=${encodeURIComponent(
            `item.html?id=${id}`
          )}`);
        try {
          const r = await S().api(
            `/api/site/pamphlets/item/${encodeURIComponent(id)}/comments`,
            { method: "POST", body: JSON.stringify({ body }) }
          );
          $("#jh-comment-input").value = "";
          renderComments(r.data || []);
          msg(
            err,
            r.message || "نظر ثبت شد و منتظر تأیید نویسنده است",
            true
          );
        } catch (e) {
          msg(err, e.message || "ثبت نظر ناموفق");
        }
      };
      $("#jh-comment-send")?.addEventListener("click", postComment);
      $("#jh-comment-input")?.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          postComment();
        }
      });

      const relatedRes = await relatedPromise;
      const sameCourse = relatedRes.sameCourse || [];
      const similar = relatedRes.similar || [];
      const similarHost = $("#jh-similar-list");
      if (similarHost) {
        similarHost.innerHTML = similar.length
          ? similar.slice(0, 8).map(similarHtml).join("")
          : `<div class="jh-similar-empty">
              <strong>فعلاً مورد مشابهی نیست</strong>
              <p>جزوه‌های هم‌رشته را در فروشگاه ببین.</p>
              <a class="jh-btn secondary" href="index.html?major=${majorQ}">رفتن به فروشگاه</a>
            </div>`;
        if (similar.length) hydrateCardCovers(similarHost);
      }
      const rail = $("#jh-rail");
      const track = $("#jh-rail-track");
      if (rail && track && sameCourse.length) {
        rail.hidden = false;
        track.innerHTML = sameCourse.map(cardHtml).join("");
        hydrateCardCovers(track);
        $$("[data-rail]").forEach((btn) =>
          btn.addEventListener("click", () => {
            const dir = btn.getAttribute("data-rail") === "next" ? 1 : -1;
            track.scrollBy({ left: dir * -280, behavior: "smooth" });
          })
        );
      } else if (rail) {
        rail.hidden = true;
      }

      // Sync header chip with known session (avoid «ورود» while author dock shows)
      if (me) {
        paintAccountChip(me);
      } else if (
        (isAuthor || purchased) &&
        (S()?.getSiteSession?.() || "")
      ) {
        invalidateSessionCache();
        const again = await ensureSession().catch(() => null);
        if (again) paintAccountChip(again);
        else paintAccountChipPending();
      }
    } catch (e) {
      msg(err, e.message || "یافت نشد");
    }
  }

  async function initLearn() {
    injectChrome("learn");
    const box = $("#jh-learn");
    const err = $("#jh-err");
    try {
      const meta = await S().api("/api/site/pamphlets/meta");
      const types = meta.data?.taxonomy?.content_type_table || [];
      let learn = {};
      try {
        const local = await fetch("guide/learn-curriculum.json?v=4");
        if (local.ok) learn = await local.json();
      } catch (_) {}
      if (!learn?.sections?.length) {
        learn = meta.data?.taxonomy?.learn_curriculum || {};
      }
      const toc = (learn.toc || [])
        .map(
          (t) =>
            `<li><a href="#${S().esc(t.id)}">${S().esc(t.label)}</a></li>`
        )
        .join("");
      // This guide is text-first; skip legacy Word/Nitro screenshot embeds.
      const fig = () => "";
      const sections = (learn.sections || [])
        .map((sec) => {
          const blocks = (sec.blocks || [])
            .map((b) => {
              const steps = (b.steps || [])
                .map((s, i) => `<li>${toFaDigits(i + 1)}. ${S().esc(s)}</li>`)
                .join("");
              const bullets = (b.bullets || [])
                .map((x) => `<li>${S().esc(x)}</li>`)
                .join("");
              const examples = (b.examples || [])
                .map((ex) => {
                  const bad = ex.bad
                    ? `<p class="jh-ex-bad"><span aria-hidden="true">❌</span> <span>${S().esc(
                        ex.bad
                      )}</span></p>`
                    : "";
                  const good = ex.good
                    ? `<p class="jh-ex-good"><span aria-hidden="true">✅</span> <span>${S().esc(
                        ex.good
                      )}</span></p>`
                    : "";
                  const note = ex.note
                    ? `<p class="jh-rule-note">${S().esc(ex.note)}</p>`
                    : "";
                  return `<div class="jh-rule-ex">${bad}${good}${note}</div>`;
                })
                .join("");
              const pairs = (b.pairs || [])
                .map(
                  (p) => `<li class="jh-rule-pair">
                    <span class="jh-pair-from">${S().esc(p.from || "")}</span>
                    <span class="jh-pair-arrow" aria-hidden="true">→</span>
                    <span class="jh-pair-to">${S().esc(p.to || "")}</span>
                  </li>`
                )
                .join("");
              const lead = b.lead
                ? `<p class="jh-rule-lead">${S().esc(b.lead)}</p>`
                : "";
              const callout = b.callout
                ? `<aside class="jh-rule-callout jh-rule-callout--${S().esc(
                    b.callout.tone || "note"
                  )}">
                    ${
                      b.callout.title
                        ? `<strong>${S().esc(b.callout.title)}</strong>`
                        : ""
                    }
                    <p>${S().esc(b.callout.body || "")}</p>
                  </aside>`
                : "";
              const table = b.use_content_type_table
                ? `<table class="jh-type-table"><thead><tr><th>نوع</th><th>توضیح</th></tr></thead><tbody>${types
                    .map(
                      (r) =>
                        `<tr><td><strong>${S().esc(
                          r.title || ""
                        )}</strong></td><td>${S().esc(r.desc || "")}</td></tr>`
                    )
                    .join("")}</tbody></table>`
                : "";
              return `<article class="jh-learn-block jh-rule-card">
                ${b.heading ? `<h3>${S().esc(b.heading)}</h3>` : ""}
                ${lead}
                ${b.body ? `<p class="jh-note">${S().esc(b.body)}</p>` : ""}
                ${callout}
                ${bullets ? `<ul class="jh-guide-list">${bullets}</ul>` : ""}
                ${steps ? `<ol class="jh-guide-list">${steps}</ol>` : ""}
                ${examples ? `<div class="jh-rule-examples">${examples}</div>` : ""}
                ${
                  pairs
                    ? `<ul class="jh-rule-pairs">${pairs}</ul>`
                    : ""
                }
                ${table}
                ${fig(b)}
              </article>`;
            })
            .join("");
          return `<section class="jh-guide-section" id="${S().esc(sec.id)}">
            <h2>${S().esc(sec.title || "")}</h2>
            ${blocks}
          </section>`;
        })
        .join("");
      const cta = learn.cta || {};
      const secLinks = (cta.secondary || [])
        .map((x) => {
          const dl = x.download ? " download" : "";
          return `<a class="jh-btn secondary" href="${S().esc(
            x.href || "#"
          )}"${dl}>${S().esc(x.label || "")}</a>`;
        })
        .join("");
      box.innerHTML = `
        <header class="jh-shop-head">
          <p class="jh-meta">${S().esc(learn.updated_fa || "")}</p>
          <h1>${S().esc(learn.title || "آموزش و راهنما و قوانین")}</h1>
          <p class="jh-note">${S().esc(learn.intro || "")}</p>
        </header>
        <aside class="jh-learn-toc">
          <strong>فهرست راهنما</strong>
          <ol>${toc}</ol>
        </aside>
        ${sections}
        <div class="jh-actions" style="margin-top:1.5rem">
          ${
            cta.primary
              ? `<a class="jh-btn" href="${S().esc(
                  cta.primary.href || "submit.html"
                )}">${S().esc(cta.primary.label || "ثبت جزوه")}</a>`
              : ""
          }
          ${secLinks}
        </div>`;
      const hash = (location.hash || "").replace(/^#/, "");
      if (hash) {
        requestAnimationFrame(() => {
          document.getElementById(hash)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }
    } catch (e) {
      msg(err, e.message || "خطا");
    }
  }

  async function initGuide() {
    location.replace("learn.html" + (location.hash || ""));
  }

  const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
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

  function toFaDigits(v) {
    return String(v ?? "").replace(/\d/g, (d) => FA_DIGITS[d]);
  }

  function fromFaDigits(v) {
    return String(v ?? "")
      .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
      .replace(/[^\d]/g, "");
  }

  function formatFaMoney(n) {
    const num = Math.max(0, Math.floor(Number(n) || 0));
    return toFaDigits(num.toLocaleString("en-US"));
  }

  const IR_BANK_CODES = {
    "010": "مرکزی",
    "011": "صنعت و معدن",
    "012": "ملت",
    "013": "رفاه",
    "014": "مسکن",
    "015": "سپه",
    "016": "کشاورزی",
    "017": "ملی",
    "018": "تجارت",
    "019": "صادرات",
    "020": "توسعه صادرات",
    "021": "پست‌بانک",
    "022": "توسعه تعاون",
    "051": "مؤسسه اعتباری توسعه",
    "053": "کارآفرین",
    "054": "پارسیان",
    "055": "اقتصاد نوین",
    "056": "سامان",
    "057": "سرمایه",
    "058": "پاسارگاد",
    "059": "خاورمیانه",
    "060": "مهر ایران",
    "061": "شهر",
    "062": "آینده",
    "063": "انصار",
    "064": "گردشگری",
    "066": "دی",
    "069": "ایران‌زمین",
    "070": "رسالت",
    "078": "خاورمیانه",
    "080": "ملی (شعب خارج)",
    "095": "ایران و ونزوئلا",
  };

  function onlyDigits(raw) {
    return fromFaDigits(String(raw || "")).replace(/[^\d]/g, "");
  }

  function formatGroupedAmount(raw) {
    const digits = onlyDigits(raw);
    if (!digits) return "";
    return toFaDigits(Number(digits).toLocaleString("en-US"));
  }

  function parseAmountInput(raw) {
    const digits = onlyDigits(raw);
    if (!digits) return 0;
    return Math.max(0, Math.floor(Number(digits) || 0));
  }

  function amountToFaWords(n) {
    const num = Math.max(0, Math.floor(Number(n) || 0));
    if (!num) return "صفر تومان";
    const ones = [
      "",
      "یک",
      "دو",
      "سه",
      "چهار",
      "پنج",
      "شش",
      "هفت",
      "هشت",
      "نه",
    ];
    const teens = [
      "ده",
      "یازده",
      "دوازده",
      "سیزده",
      "چهارده",
      "پانزده",
      "شانزده",
      "هفده",
      "هجده",
      "نوزده",
    ];
    const tens = [
      "",
      "",
      "بیست",
      "سی",
      "چهل",
      "پنجاه",
      "شصت",
      "هفتاد",
      "هشتاد",
      "نود",
    ];
    const hundreds = [
      "",
      "صد",
      "دویست",
      "سیصد",
      "چهارصد",
      "پانصد",
      "ششصد",
      "هفتصد",
      "هشتصد",
      "نهصد",
    ];
    const scales = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];
    const under1000 = (x) => {
      const parts = [];
      const h = Math.floor(x / 100);
      const t = Math.floor((x % 100) / 10);
      const o = x % 10;
      if (h) parts.push(hundreds[h]);
      if (t === 1) parts.push(teens[o]);
      else {
        if (t) parts.push(tens[t]);
        if (o) parts.push(ones[o]);
      }
      return parts.join(" و ");
    };
    const chunks = [];
    let rest = num;
    let scale = 0;
    while (rest > 0 && scale < scales.length) {
      const chunk = rest % 1000;
      if (chunk) {
        const label = under1000(chunk);
        chunks.unshift(scales[scale] ? `${label} ${scales[scale]}` : label);
      }
      rest = Math.floor(rest / 1000);
      scale += 1;
    }
    return `${chunks.join(" و ")} تومان`;
  }

  function normalizeIban(raw) {
    let s = String(raw || "")
      .toUpperCase()
      .replace(/[\s\-_.]/g, "");
    s = s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
    s = s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
    if (s.startsWith("IR")) s = s.slice(2);
    s = s.replace(/[^\d]/g, "").slice(0, 24);
    return s;
  }

  function formatIbanDigits(digits) {
    const d = normalizeIban(digits);
    if (!d) return "";
    // IR12 0540 1026 8002 1234 5678 90
    const parts = [];
    if (d.length) parts.push(d.slice(0, 2));
    for (let i = 2; i < d.length; i += 4) parts.push(d.slice(i, i + 4));
    return parts.filter(Boolean).join(" ");
  }

  function ibanMod97Ok(digits24) {
    const d = normalizeIban(digits24);
    if (d.length !== 24) return false;
    // Move IR+check to end → BBAN + "1827" + checkDigits
    const rearranged = `${d.slice(2)}1827${d.slice(0, 2)}`;
    let rem = 0;
    for (const ch of rearranged) {
      rem = (rem * 10 + (ch.charCodeAt(0) - 48)) % 97;
    }
    return rem === 1;
  }

  function bankFromIban(digits24) {
    const d = normalizeIban(digits24);
    if (d.length < 5) return null;
    const code = d.slice(2, 5);
    const name = IR_BANK_CODES[code];
    if (!name) return { code, name: `بانک کد ${code}` };
    return { code, name: `بانک ${name}` };
  }

  function isValidNationalId(raw) {
    const code = onlyDigits(raw);
    if (!/^\d{10}$/.test(code)) return false;
    if (/^(\d)\1{9}$/.test(code)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += Number(code[i]) * (10 - i);
    const r = sum % 11;
    const check = Number(code[9]);
    return (r < 2 && check === r) || (r >= 2 && check === 11 - r);
  }

  function bindPayoutForm({
    balance,
    minPayout,
    savedIban,
    savedNationalId,
    errEl,
  }) {
    const amountEl = $("#payout_amount");
    const ibanEl = $("#iban_digits");
    const nidEl = $("#national_id");
    const nidWrap = $("#jh-nid-wrap");
    const amountWords = $("#payout_amount_words");
    const amountHint = $("#payout_amount_hint");
    const ibanHint = $("#iban_hint");
    const ibanBank = $("#iban_bank");
    const nidHint = $("#nid_hint");
    const btn = $("#btn-payout");
    const maxBtn = $("#btn-payout-max");
    const bal = Math.max(0, Math.floor(Number(balance) || 0));
    const min = Math.max(0, Math.floor(Number(minPayout) || 500000));

    const amountOk = () => {
      const v = parseAmountInput(amountEl?.value || "");
      return v >= min && v <= bal;
    };
    const ibanOk = () => {
      const digits = normalizeIban(ibanEl?.value || "");
      return digits.length === 24 && ibanMod97Ok(digits);
    };
    const nidOk = () => isValidNationalId(nidEl?.value || "");

    const syncSubmitLock = () => {
      if (!btn) return;
      const ok = amountOk() && ibanOk() && nidOk();
      btn.disabled = !ok;
      btn.classList.toggle("is-locked", !ok);
      btn.setAttribute(
        "aria-disabled",
        ok ? "false" : "true"
      );
      btn.title = ok
        ? "ثبت درخواست تسویه"
        : "ابتدا مبلغ، شبا و کد ملی معتبر را کامل کن";
    };

    const setAmount = (n) => {
      const v = Math.max(0, Math.floor(Number(n) || 0));
      if (amountEl) amountEl.value = v ? formatGroupedAmount(String(v)) : "";
      if (amountWords) {
        amountWords.className = "jh-amount-words";
        if (!v) {
          amountWords.textContent = "مبلغ را وارد کن";
          amountWords.classList.add("is-muted");
        } else if (v < min) {
          amountWords.textContent = `معادل ${amountToFaWords(v)}`;
          amountWords.classList.add("is-bad");
        } else if (v > bal) {
          amountWords.textContent = `معادل ${amountToFaWords(v)}`;
          amountWords.classList.add("is-bad");
        } else {
          amountWords.textContent = `معادل ${amountToFaWords(v)}`;
          amountWords.classList.add("is-ok");
        }
      }
      if (amountHint) {
        amountHint.textContent = "";
        amountHint.className = "jh-field-hint";
        amountHint.hidden = true;
        if (v && v < min) {
          amountHint.hidden = false;
          amountHint.textContent = `حداقل درآمد قابل تسویه ${money(min)} است`;
          amountHint.classList.add("is-bad");
        } else if (v && v > bal) {
          amountHint.hidden = false;
          amountHint.textContent = "بیشتر از موجودی قابل تسویه است";
          amountHint.classList.add("is-bad");
        }
      }
      syncSubmitLock();
    };

    const syncIban = () => {
      if (!ibanEl) return;
      const digits = normalizeIban(ibanEl.value);
      const caretEnd = ibanEl.selectionStart === ibanEl.value.length;
      ibanEl.value = formatIbanDigits(digits);
      if (caretEnd) {
        try {
          ibanEl.setSelectionRange(ibanEl.value.length, ibanEl.value.length);
        } catch (_) {}
      }
      const bank = bankFromIban(digits);
      if (ibanBank) {
        if (bank && digits.length >= 5) {
          ibanBank.hidden = false;
          ibanBank.innerHTML = `<span class="jh-bank-badge" data-code="${S().esc(
            bank.code
          )}">${S().esc(bank.code)}</span><strong>${S().esc(
            bank.name
          )}</strong>`;
        } else {
          ibanBank.hidden = true;
          ibanBank.innerHTML = "";
        }
      }
      if (ibanHint) {
        ibanHint.className = "jh-field-hint";
        if (!digits.length) {
          ibanHint.textContent = "۲۴ رقم شبا را بدون IR وارد یا بچسبان";
        } else if (digits.length < 24) {
          ibanHint.textContent = `${toFaDigits(digits.length)} از ۲۴ رقم`;
        } else if (!ibanMod97Ok(digits)) {
          ibanHint.textContent =
            "ساختار شماره شبا معتبر نیست (احتمالاً رقمی جابه‌جا شده)";
          ibanHint.classList.add("is-bad");
        } else {
          ibanHint.textContent = "شبا معتبر است";
          ibanHint.classList.add("is-ok");
        }
      }
      ibanEl.classList.toggle("is-valid", ibanOk());
      ibanEl.classList.toggle("is-invalid", digits.length === 24 && !ibanOk());
      syncSubmitLock();
    };

    const syncNid = () => {
      if (!nidEl) return;
      const code = onlyDigits(nidEl.value).slice(0, 10);
      nidEl.value = toFaDigits(code);
      const valid = isValidNationalId(code);
      nidWrap?.classList.toggle("is-valid", valid);
      nidEl.classList.toggle("is-valid", valid);
      nidEl.classList.toggle("is-invalid", code.length === 10 && !valid);
      if (nidHint) {
        nidHint.className = "jh-field-hint";
        if (!code.length) {
          nidHint.textContent = "۱۰ رقم، صفر ابتدایی حفظ می‌شود";
        } else if (code.length < 10) {
          nidHint.textContent = `${toFaDigits(code.length)} از ۱۰ رقم`;
        } else if (!valid) {
          nidHint.textContent = "کد ملی معتبر نیست";
          nidHint.classList.add("is-bad");
        } else {
          nidHint.textContent = "";
        }
      }
      syncSubmitLock();
    };

    if (savedIban) {
      const dig = normalizeIban(savedIban);
      if (ibanEl && dig) ibanEl.value = formatIbanDigits(dig);
    }
    if (savedNationalId && nidEl) {
      nidEl.value = toFaDigits(onlyDigits(savedNationalId).slice(0, 10));
    }
    setAmount(min <= bal ? min : "");
    syncIban();
    syncNid();
    syncSubmitLock();

    amountEl?.addEventListener("input", () => {
      const v = parseAmountInput(amountEl.value);
      setAmount(v || "");
    });
    maxBtn?.addEventListener("click", () => {
      if (bal < min) {
        msg(errEl, `موجودی کمتر از حداقل درآمد قابل تسویه (${money(min)}) است`);
        return;
      }
      setAmount(bal);
    });
    ibanEl?.addEventListener("input", syncIban);
    ibanEl?.addEventListener("paste", (ev) => {
      ev.preventDefault();
      const text = ev.clipboardData?.getData("text") || "";
      ibanEl.value = normalizeIban(text);
      syncIban();
    });
    nidEl?.addEventListener("input", syncNid);
    nidEl?.addEventListener("paste", (ev) => {
      ev.preventDefault();
      const text = ev.clipboardData?.getData("text") || "";
      nidEl.value = onlyDigits(text).slice(0, 10);
      syncNid();
    });

    $$(".jh-payout-saved").forEach((card) => {
      card.addEventListener("click", () => {
        const dig = card.getAttribute("data-iban") || "";
        const nid = card.getAttribute("data-nid") || "";
        if (ibanEl && dig) {
          ibanEl.value = normalizeIban(dig);
          syncIban();
        }
        if (nidEl && nid) {
          nidEl.value = onlyDigits(nid).slice(0, 10);
          syncNid();
        }
        msg(errEl, "حساب تسویه انتخاب شد", true);
      });
    });

    btn?.addEventListener("click", async () => {
      if (!amountOk() || !ibanOk() || !nidOk()) {
        syncSubmitLock();
        if (!ibanOk()) {
          ibanEl?.focus();
          ibanEl?.classList.add("jh-shake");
          window.setTimeout(() => ibanEl?.classList.remove("jh-shake"), 450);
        } else if (!nidOk()) {
          nidEl?.focus();
          nidEl?.classList.add("jh-shake");
          window.setTimeout(() => nidEl?.classList.remove("jh-shake"), 450);
        } else {
          amountEl?.focus();
        }
        return msg(errEl, "ابتدا فیلدهای تسویه را درست و کامل کن");
      }
      const amount = parseAmountInput(amountEl?.value || "");
      const digits = normalizeIban(ibanEl?.value || "");
      const nid = onlyDigits(nidEl?.value || "");
      try {
        btn.disabled = true;
        btn.textContent = "در حال ثبت…";
        await S().api("/api/site/pamphlets/wallet/payout", {
          method: "POST",
          body: JSON.stringify({
            amount_irt: amount,
            iban: `IR${digits}`,
            national_id: nid,
          }),
        });
        msg(errEl, "درخواست تسویه ثبت شد", true);
        location.reload();
      } catch (e) {
        msg(errEl, e.message || "خطا در ثبت تسویه");
        syncSubmitLock();
      } finally {
        btn.textContent = "ثبت درخواست تسویه";
        syncSubmitLock();
      }
    });
  }

  function gregorianToJalali(gy, gm, gd) {
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
    const jm =
      days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
    return { jy, jm, jd };
  }

  /** ISO/date string → «۲۲ آبان ۱۴۰۴» (fa digits). */
  function formatJalaliDateFa(raw) {
    const s = String(raw || "").trim();
    if (!s) return "—";
    const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
    let gy;
    let gm;
    let gd;
    if (m) {
      gy = +m[1];
      gm = +m[2];
      gd = +m[3];
    } else {
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return toFaDigits(s.slice(0, 10));
      gy = d.getFullYear();
      gm = d.getMonth() + 1;
      gd = d.getDate();
    }
    const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
    const month = JALALI_MONTHS[jm - 1] || "";
    return `${toFaDigits(jd)} ${month} ${toFaDigits(jy)}`;
  }

  function formatJalaliSlashFa(raw) {
    const s = String(raw || "").trim();
    if (!s) return "—";
    const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
    let gy;
    let gm;
    let gd;
    if (m) {
      gy = +m[1];
      gm = +m[2];
      gd = +m[3];
    } else {
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return toFaDigits(s.slice(0, 10));
      gy = d.getFullYear();
      gm = d.getMonth() + 1;
      gd = d.getDate();
    }
    const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
    const pad = (n) => String(n).padStart(2, "0");
    return toFaDigits(`${jy}/${pad(jm)}/${pad(jd)}`);
  }

  function jalaliDaysInMonth(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    const a = (jy - (jy > 0 ? 474 : 473)) % 2820 + 474;
    const leap = ((a + 38) * 682) % 2816 < 682;
    return leap ? 30 : 29;
  }

  function todayJalali() {
    const n = new Date();
    return gregorianToJalali(n.getFullYear(), n.getMonth() + 1, n.getDate());
  }

  function parseJalaliString(s) {
    const raw = fromFaDigits(s || "");
    const m = raw.match(/^(\d{3,4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (!m) return null;
    return { jy: +m[1], jm: +m[2], jd: +m[3] };
  }

  const TERM_YEAR_MIN = 1390;
  const TERM_YEAR_MAX = 1430;

  function composeTermYear(year, term) {
    const y = String(year || "").trim();
    const t = String(term || "").trim();
    if (!y || !t) return "";
    return `${toFaDigits(y)}–${toFaDigits(t)}`;
  }

  function parseTermYear(raw) {
    const s = fromFaDigits(String(raw || "").trim());
    if (!s) return { year: "", term: "" };
    const nums = s.match(/\d+/g) || [];
    let year = "";
    let term = "";
    for (const n of nums) {
      const v = Number(n);
      if (!year && v >= TERM_YEAR_MIN && v <= TERM_YEAR_MAX) year = String(v);
      else if (!term && v >= 1 && v <= 8) term = String(v);
    }
    if (!year && nums.length) {
      const yCand = nums.find((n) => String(n).length === 4);
      if (yCand) {
        const v = Number(yCand);
        if (v >= TERM_YEAR_MIN && v <= TERM_YEAR_MAX) year = String(v);
      }
    }
    if (!term && nums.length) {
      const tCand = nums.find((n) => {
        const v = Number(n);
        return v >= 1 && v <= 8 && String(n).length <= 2;
      });
      if (tCand) term = String(Number(tCand));
    }
    return { year, term };
  }

  function syncTermYearField() {
    const y = $("#academic_year")?.value || "";
    const t = $("#academic_term")?.value || "";
    const hidden = $("#term_year");
    if (hidden) hidden.value = composeTermYear(y, t);
  }

  function fillTermYearSelects(selectedRaw = "") {
    const yearSel = $("#academic_year");
    const termSel = $("#academic_term");
    if (!yearSel || !termSel) return;
    const parsed = parseTermYear(selectedRaw);
    const today = todayJalali();
    const preferYear =
      parsed.year ||
      (today.jy >= TERM_YEAR_MIN && today.jy <= TERM_YEAR_MAX
        ? String(today.jy)
        : "");

    yearSel.innerHTML = '<option value="">انتخاب سال</option>';
    for (let y = TERM_YEAR_MAX; y >= TERM_YEAR_MIN; y -= 1) {
      const o = document.createElement("option");
      o.value = String(y);
      o.textContent = toFaDigits(y);
      yearSel.appendChild(o);
    }
    termSel.innerHTML = '<option value="">انتخاب ترم</option>';
    for (let t = 1; t <= 8; t += 1) {
      const o = document.createElement("option");
      o.value = String(t);
      o.textContent = toFaDigits(t);
      termSel.appendChild(o);
    }
    if (preferYear) yearSel.value = preferYear;
    if (parsed.term) termSel.value = parsed.term;
    syncTermYearField();
    refreshCombo(yearSel);
    refreshCombo(termSel);
  }

  function enhanceCombos(root = document) {
    root.querySelectorAll("select[data-jh-combo]").forEach((sel) => {
      if (sel.dataset.jhComboReady === "1") {
        refreshCombo(sel);
        return;
      }
      sel.dataset.jhComboReady = "1";
      const wrap = document.createElement("div");
      wrap.className = "jh-combo";
      sel.parentNode.insertBefore(wrap, sel);
      wrap.appendChild(sel);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "jh-combo-btn";
      btn.innerHTML = `<span class="jh-combo-label"></span><span class="jh-combo-caret" aria-hidden="true">▾</span>`;
      wrap.appendChild(btn);
      const panel = document.createElement("div");
      panel.className = "jh-combo-panel";
      panel.hidden = true;
      const searchable = sel.hasAttribute("data-jh-combo-search");
      let search = null;
      if (searchable) {
        search = document.createElement("input");
        search.className = "jh-combo-search";
        search.type = "search";
        search.placeholder = "جستجو…";
        search.setAttribute("autocomplete", "off");
        panel.appendChild(search);
      }
      const list = document.createElement("div");
      list.className = "jh-combo-list";
      list.setAttribute("role", "listbox");
      panel.appendChild(list);
      wrap.appendChild(panel);

      const syncLabel = () => {
        const opt = sel.options[sel.selectedIndex];
        btn.querySelector(".jh-combo-label").textContent =
          opt?.textContent || "انتخاب…";
      };
      const renderList = (q = "") => {
        const qq = q.trim();
        list.innerHTML = "";
        let shown = 0;
        Array.from(sel.options).forEach((opt) => {
          if (qq && !opt.textContent.includes(qq)) return;
          shown += 1;
          const b = document.createElement("button");
          b.type = "button";
          b.textContent = opt.textContent;
          b.setAttribute(
            "aria-selected",
            opt.value === sel.value ? "true" : "false"
          );
          b.addEventListener("click", () => {
            sel.value = opt.value;
            sel.dispatchEvent(new Event("change", { bubbles: true }));
            syncLabel();
            panel.hidden = true;
          });
          list.appendChild(b);
        });
        if (!shown) {
          list.innerHTML = `<div class="jh-combo-empty">موردی پیدا نشد</div>`;
        }
      };
      const open = () => {
        $$(".jh-combo-panel").forEach((p) => {
          if (p !== panel) p.hidden = true;
        });
        panel.hidden = false;
        renderList(search?.value || "");
        search?.focus();
      };
      btn.addEventListener("click", () => {
        if (panel.hidden) open();
        else panel.hidden = true;
      });
      search?.addEventListener("input", () => renderList(search.value));
      sel.addEventListener("change", syncLabel);
      syncLabel();
      sel._jhRefreshCombo = () => {
        syncLabel();
        if (!panel.hidden) renderList(search?.value || "");
      };
    });
    if (!document._jhComboDocBound) {
      document._jhComboDocBound = true;
      document.addEventListener("click", (e) => {
        if (!e.target.closest(".jh-combo")) {
          $$(".jh-combo-panel").forEach((p) => (p.hidden = true));
        }
      });
    }
  }

  function refreshCombo(sel) {
    sel?._jhRefreshCombo?.();
  }

  function formatBytes(n) {
    const v = Number(n) || 0;
    const fa = (num) => toFaDigits(Number(num).toFixed(1)).replace(".", "٫");
    if (v < 1024) return `${toFaDigits(v)} بایت`;
    if (v < 1024 * 1024) return `${fa(v / 1024)} کیلوبایت`;
    return `${fa(v / (1024 * 1024))} مگابایت`;
  }

  function softFileName(name) {
    return S().esc(name || "فایل").replace(/([_\-.])/g, "$1<wbr>");
  }

  function renderUploadCard(host, { ok, name, size, onChange }) {
    if (!host) return;
    host.hidden = false;
    host.className = `jh-upload-status ${ok ? "is-ok" : "is-err"}`;
    host.innerHTML = `
      <span class="jh-upload-ico" aria-hidden="true">${ok ? "✓" : "×"}</span>
      <div class="jh-upload-meta">
        <strong>${ok ? "فایل PDF آماده است" : "آپلود ناموفق بود"}</strong>
        <span class="jh-upload-name">${ok ? softFileName(name) : "دوباره تلاش کن یا فایل دیگری انتخاب کن"}</span>
        ${ok ? `<span class="jh-upload-size">${S().esc(formatBytes(size))}</span>` : ""}
      </div>
      <button type="button" class="jh-btn secondary" data-jh-change-file>تغییر فایل</button>`;
    host.querySelector("[data-jh-change-file]")?.addEventListener("click", () => {
      onChange?.();
    });
  }

  async function initSubmit() {
    if (!$(".jh-aurora")) {
      const a = document.createElement("div");
      a.className = "jh-aurora";
      a.setAttribute("aria-hidden", "true");
      document.body.prepend(a);
    }
    const session = await restoreSessionOnce();
    if (!session?.ok || !session.data) {
      location.href =
        "login.html?next=" + encodeURIComponent("submit.html");
      return;
    }
    if (session.needs_profile) {
      location.href =
        "login.html?next=" +
        encodeURIComponent("submit.html") +
        "&need_profile=1";
      return;
    }
    const me = session.data;
    const err = $("#jh-err");
    let meta;
    try {
      meta = await S().api("/api/site/pamphlets/meta");
    } catch (e) {
      msg(err, e.message || "بارگذاری اطلاعات فرم ناموفق بود");
      return;
    }
    const tax = meta.data?.taxonomy || {};
    const majors = tax.majors || [];
    const courses = tax.courses_by_major || {};
    const majorSel = $("#major");
    majors.forEach((m) => {
      const o = document.createElement("option");
      o.value = m;
      o.textContent = m;
      majorSel?.appendChild(o);
    });

    const fillCourses = () => {
      const csel = $("#course_name");
      if (!csel) return;
      const list = courses[majorSel.value] || [];
      csel.innerHTML =
        '<option value="">انتخاب درس…</option>' +
        list
          .map((c) => `<option value="${S().esc(c)}">${S().esc(c)}</option>`)
          .join("");
      refreshCombo(csel);
    };
    majorSel?.addEventListener("change", fillCourses);
    fillCourses();
    fillTermYearSelects();
    $("#academic_year")?.addEventListener("change", () => {
      syncTermYearField();
      refreshSuggest();
    });
    $("#academic_term")?.addEventListener("change", () => {
      syncTermYearField();
      refreshSuggest();
    });
    if ($("#health_txt"))
      $("#health_txt").textContent = meta.data?.health_disclaimer || "";

    const freeToggle = $("#price_free");
    const priceHidden = $("#price_irt");
    const unitHidden = $("#unit_count");
    const priceDisplay = $("#price_irt_display");
    const priceBlock = $("#jh-price-block");
    const priceNote = $("#jh-price-note");
    const pricePerPage = $("#jh-price-perpage");
    const unitPicker = $("#jh-unit-picker");
    // Paint tier labels from API when available
    $$("[data-tier]").forEach((el) => {
      const u = Number(el.getAttribute("data-tier"));
      const p = tierPriceIrt(u, meta.data);
      el.textContent = formatFaMoney(p);
    });
    let draftPagesCount = 0;
    const selectedUnits = () => {
      const checked = $('input[name="unit_count"]:checked');
      return Number(checked?.value || unitHidden?.value || 2) || 2;
    };
    const syncPriceUi = () => {
      const free = !!freeToggle?.checked;
      priceBlock?.classList.toggle("is-free", free);
      if (unitPicker) unitPicker.hidden = free;
      if (priceDisplay) priceDisplay.disabled = true;
      if (free) {
        if (priceHidden) priceHidden.value = "0";
        if (priceDisplay) {
          priceDisplay.value = "";
          priceDisplay.placeholder = "رایگان";
        }
        if (priceNote)
          priceNote.textContent =
            "این جزوه بدون پرداخت در اختیار خریدار قرار می‌گیرد.";
        if (pricePerPage) {
          pricePerPage.hidden = true;
          pricePerPage.textContent = "";
          pricePerPage.className = "jh-price-perpage";
        }
      } else if (priceDisplay && priceHidden) {
        const units = selectedUnits();
        const current = tierPriceIrt(units, meta.data);
        if (unitHidden) unitHidden.value = String(units);
        priceHidden.value = String(current);
        priceDisplay.value = formatFaMoney(current);
        if (priceNote)
          priceNote.textContent =
            `${toFaDigits(units)} واحدی = ${money(current)}. قیمت لیست ثابت است؛ داوری واحد را قفل می‌کند.`;
        if (pricePerPage) {
          if (current > 0 && draftPagesCount > 0) {
            const per = Math.round(current / draftPagesCount);
            pricePerPage.hidden = false;
            pricePerPage.className = "jh-price-perpage is-ok";
            pricePerPage.textContent = `معادل ${formatFaMoney(
              per
            )} تومان به ازای هر صفحه (${toFaDigits(draftPagesCount)} صفحه)`;
          } else {
            pricePerPage.hidden = true;
            pricePerPage.textContent = "";
          }
        }
      }
    };
    freeToggle?.addEventListener("change", () => {
      syncPriceUi();
    });
    $$('input[name="unit_count"]').forEach((el) => {
      el.addEventListener("change", syncPriceUi);
    });
    syncPriceUi();

    const refreshSuggest = () => {
      const host = $("#jh-suggest");
      if (!host) return;
      const kind = $("#content_kind")?.value || "typed";
      const cov = $("#coverage")?.value || "midterm";
      const course = $("#course_name")?.value || "";
      const major = $("#major")?.value || "";
      syncTermYearField();
      const term = $("#term_year")?.value || "";
      const kindFa = kind === "typed" ? "تایپی" : "دست‌نویس";
      const covFa =
        ({
          short: "بخش کوتاه",
          midterm: "میان‌ترم",
          final: "پایان‌ترم",
          full: "کامل",
          partial: "بخشی",
        })[cov] || "بخش کوتاه";
      const titles = [
        `جزوه ${course || "درس"} — ${major || "پیراپزشکی"} — ${kindFa}`,
        `خلاصه ${course || "درس"} (${covFa}) — دانشکده پیراپزشکی بهشتی`,
        `درسنامه ${course || "درس"} — ${major || "پیراپزشکی"}${
          term ? ` — ${term}` : ""
        }`,
        `${course || "درس"} | جزوه دانشجویی ${kindFa}`,
        `مرور ${course || "درس"} برای دانشجویان ${major || "پیراپزشکی"}`,
      ];
      host.innerHTML = titles
        .map(
          (t) =>
            `<button type="button" data-suggest="${S().esc(t)}">${S().esc(
              t
            )}</button>`
        )
        .join("");
      host.querySelectorAll("[data-suggest]").forEach((b) =>
        b.addEventListener("click", () => {
          if ($("#title")) $("#title").value = b.dataset.suggest || "";
        })
      );
    };
    ["content_kind", "coverage", "major", "course_name"].forEach((id) => {
      $(`#${id}`)?.addEventListener("change", refreshSuggest);
      $(`#${id}`)?.addEventListener("input", refreshSuggest);
    });
    refreshSuggest();

    const summary = $("#summary");
    const summaryCount = $("#summary-count");
    const syncSummaryCount = () => {
      const n = (summary?.value || "").trim().length;
      if (summaryCount) {
        summaryCount.textContent = `${toFaDigits(n)} / ${toFaDigits(70)}`;
        summaryCount.classList.toggle("is-ok", n >= 70);
      }
    };
    summary?.addEventListener("input", syncSummaryCount);
    syncSummaryCount();

    enhanceCombos();

    let step = 1;
    let currentId = new URLSearchParams(location.search).get("id") || "";
    let uploaded = { pdf: null, docx: null, answer: null, consent: null, cover: null };

    const showStep = (n) => {
      step = n;
      $$(".jh-panel").forEach((p) =>
        p.classList.toggle("on", String(p.dataset.step) === String(n))
      );
      $$(".jh-step").forEach((s) => {
        const i = Number(s.dataset.stepIdx);
        s.classList.toggle("on", i === n);
        s.classList.toggle("done", i < n);
      });
      if (n === 3 && uploaded.pdf) {
        renderUploadCard($("#jh-upload-summary"), {
          ok: true,
          name: uploaded.pdf.name,
          size: uploaded.pdf.size,
          onChange: () => showStep(2),
        });
      }
    };
    showStep(1);

    const syncSubmitEnabled = () => {
      const btn = $("#btn-submit");
      if (!btn) return;
      btn.disabled = !($("#rights")?.checked && $("#health")?.checked);
    };
    $("#rights")?.addEventListener("change", syncSubmitEnabled);
    $("#health")?.addEventListener("change", syncSubmitEnabled);
    syncSubmitEnabled();

    const contentBlurb = () => ($("#outline_text")?.value || "").trim();

    const collect = () => {
      const outline = contentBlurb();
      const topicLines = outline
        .split(/\n|،|,/)
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 20);
      return {
        title: ($("#title")?.value || "").trim(),
        course_name: ($("#course_name")?.value || "").trim(),
        subject: topicLines.slice(0, 3).join("، "),
        university: "دانشگاه علوم پزشکی شهید بهشتی",
        faculty: "پیراپزشکی",
        major: ($("#major")?.value || "").trim(),
        field_of_study: ($("#major")?.value || "").trim(),
        degree_level: ($("#degree_level")?.value || "").trim(),
        authors_text: ($("#authors_text")?.value || "").trim(),
        professor_name: ($("#professor_name")?.value || "").trim(),
        term_year: (() => {
          syncTermYearField();
          return ($("#term_year")?.value || "").trim();
        })(),
        summary: ($("#summary")?.value || "").trim(),
        outline_text: outline,
        out_of_scope_text: ($("#out_of_scope_text")?.value || "").trim(),
        sources_text: ($("#sources_text")?.value || "").trim(),
        revision_date: "",
        content_kind: ($("#content_kind")?.value || "").trim(),
        coverage: ($("#coverage")?.value || "").trim(),
        difficulty: ($("#difficulty")?.value || "").trim(),
        topics: topicLines,
        wants_services: false,
        price_irt: Number($("#price_irt")?.value || 0),
        unit_count: Number($("#unit_count")?.value || 2) || 2,
        is_free: !!$("#price_free")?.checked,
        access_mode: "downloadable",
        author_rights_accepted: !!$("#rights")?.checked,
        health_disclaimer_accepted: !!$("#health")?.checked,
        is_anonymous: !!$("#is_anonymous")?.checked,
      };
    };

    const validatePricing = (body) => {
      const free = !!$("#price_free")?.checked;
      if (!free) {
        const u = Number(body.unit_count || 0);
        if (u < 1 || u > 4)
          throw new Error("تعداد واحد را بین ۱ تا ۴ انتخاب کن");
        if (!(Number(body.price_irt) > 0))
          throw new Error("قیمت واحدی نامعتبر است؛ واحد را دوباره انتخاب کن");
      }
    };

    const validateStep1 = (body) => {
      if (!body.major) throw new Error("رشته را انتخاب کن");
      if (!body.course_name) throw new Error("درس را انتخاب کن");
      if (body.outline_text.length < 15)
        throw new Error("توضیح کوتاه محتویات فایل را بنویس (حداقل ۱۵ کاراکتر)");
      if (!body.content_kind) throw new Error("نوع جزوه را انتخاب کن");
      if (!body.coverage) throw new Error("پوشش درس را انتخاب کن");
      if (!body.difficulty) throw new Error("سطح سختی را انتخاب کن");
      if (!body.degree_level) throw new Error("مقطع را بنویس");
      if (!($("#academic_year")?.value || "").trim())
        throw new Error("سال تحصیلی را انتخاب کن");
      if (!($("#academic_term")?.value || "").trim())
        throw new Error("ترم را انتخاب کن");
      if (!body.term_year) throw new Error("ترم و سال را کامل کن");
      if (!body.professor_name) throw new Error("نام استاد / اساتید را بنویس");
      if (!body.authors_text) throw new Error("نویسنده / نویسندگان جزوه را بنویس");
      validatePricing(body);
    };

    const validateStep2 = (body) => {
      if (!body.title) throw new Error("عنوان را وارد کن");
      if (body.summary.length < 70)
        throw new Error("توضیحات کامل باید حداقل ۷۰ کاراکتر باشد");
      if (body.out_of_scope_text.length < 8)
        throw new Error("خارج از پوشش را بنویس");
      if (body.sources_text.length < 12)
        throw new Error("رفرنس‌ها را بنویس");
      validatePricing(body);
    };

    const saveMeta = async () => {
      const body = collect();
      validateStep1(body);
      if (step >= 2) validateStep2(body);
      if (!body.title) {
        body.title = `جزوه ${body.course_name} — ${body.major}`;
        if ($("#title")) $("#title").value = body.title;
      }
      let res;
      if (currentId) {
        res = await S().api(`/api/site/pamphlets/mine/${currentId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        res = await S().api("/api/site/pamphlets/mine", {
          method: "POST",
          body: JSON.stringify(body),
        });
        currentId = res.data.id;
        history.replaceState(
          {},
          "",
          `submit.html?id=${encodeURIComponent(currentId)}`
        );
      }
      return res.data;
    };

    const paintPct = (ui, n) => {
      const v = Math.max(0, Math.min(100, Math.round(n)));
      if (ui.bar) ui.bar.style.width = `${v}%`;
      if (ui.pct) ui.pct.textContent = `${toFaDigits(v)}٪`;
      ui._shown = v;
    };

    const runMeter = (ui) => {
      cancelAnimationFrame(ui._raf);
      const tick = () => {
        if (ui._halt) return;
        const cur = ui._shown || 0;
        const goal = ui._target ?? cur;
        if (cur !== goal) {
          const step = Math.max(1, Math.round(Math.abs(goal - cur) * 0.28));
          const next =
            cur < goal ? Math.min(goal, cur + step) : Math.max(goal, cur - step);
          paintPct(ui, next);
        }
        if ((ui._shown || 0) >= 100 && (ui._target || 0) >= 100 && ui._finish) {
          const done = ui._finish;
          ui._finish = null;
          done();
          return;
        }
        ui._raf = requestAnimationFrame(tick);
      };
      ui._raf = requestAnimationFrame(tick);
    };

    const untilFull = (ui) => {
      if ((ui._shown || 0) >= 100 && (ui._target || 0) >= 100) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        ui._finish = resolve;
      });
    };

    let pdfjsLoading = null;
    const loadPdfJs = () => {
      if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
      if (pdfjsLoading) return pdfjsLoading;
      pdfjsLoading = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "../assets/vendor/pdfjs/pdf.min.js";
        s.onload = () => {
          const lib = window.pdfjsLib;
          if (!lib) {
            reject(new Error("pdfjs"));
            return;
          }
          lib.GlobalWorkerOptions.workerSrc =
            "../assets/vendor/pdfjs/pdf.worker.min.js";
          resolve(lib);
        };
        s.onerror = () => reject(new Error("pdfjs"));
        document.head.appendChild(s);
      });
      return pdfjsLoading;
    };

    const showPdfPreview = async (file, canvas, wrap, { trackPages = false } = {}) => {
      if (!canvas || !wrap) return;
      const isPdf =
        file &&
        (/pdf/i.test(file.type || "") || /\.pdf$/i.test(file.name || ""));
      if (!isPdf) {
        wrap.hidden = true;
        return;
      }
      wrap.hidden = false;
      try {
        const lib = await loadPdfJs();
        const data = await file.arrayBuffer();
        const pdf = await lib.getDocument(pdfDocumentOpts(data)).promise;
        if (trackPages) {
          draftPagesCount = Math.max(0, Number(pdf.numPages) || 0);
          syncPriceUi();
        }
        const page = await pdf.getPage(1);
        const base = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: 240 / base.width });
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        await page.render({
          canvasContext: canvas.getContext("2d"),
          viewport: vp,
        }).promise;
      } catch (_) {
        wrap.hidden = true;
      }
    };

    const presentFile = (ui, file, note) => {
      const slot = ui.slot;
      const idle = slot?.querySelector(".jh-drop-idle");
      if (!file) {
        if (ui.card) ui.card.hidden = true;
        if (idle) idle.hidden = false;
        slot?.classList.remove("is-done", "is-err", "is-uploading");
        return;
      }
      if (idle) idle.hidden = true;
      if (ui.card) ui.card.hidden = false;
      if (ui.name) {
        ui.name.textContent = file.name;
        ui.name.title = file.name;
      }
      if (ui.meta) ui.meta.textContent = formatBytes(file.size);
      if (ui.state) ui.state.textContent = note || "در حال آماده‌سازی آپلود…";
      const isPdf =
        /pdf/i.test(file.type || "") || /\.pdf$/i.test(file.name || "");
      const isImg =
        /^image\//i.test(file.type || "") ||
        /\.(jpe?g|png|webp)$/i.test(file.name || "");
      const fallback = ui.preview?.querySelector(".jh-doc-fallback");
      const thumb = ui.preview?.querySelector("img");
      if (ui.canvas) ui.canvas.hidden = !isPdf;
      if (fallback) fallback.hidden = isPdf || isImg;
      if (thumb && isImg) {
        try {
          if (ui._objectUrl) URL.revokeObjectURL(ui._objectUrl);
          ui._objectUrl = URL.createObjectURL(file);
          thumb.src = ui._objectUrl;
          if (ui.preview) ui.preview.hidden = false;
        } catch (_) {}
      }
      if (ui.preview) {
        if (isPdf) {
          ui.preview.classList.remove("jh-page-preview--doc");
          showPdfPreview(file, ui.canvas, ui.preview, {
            trackPages: ui.bucket === "pdf" || ui.role === "original",
          });
        } else if (isImg) {
          ui.preview.classList.remove("jh-page-preview--doc");
        } else if (fallback) {
          ui.preview.hidden = false;
          ui.preview.classList.add("jh-page-preview--doc");
        } else ui.preview.hidden = true;
      }
      slot?.classList.remove("is-done", "is-err", "is-uploading");
    };

    const slotUi = (prefix, inputId) => ({
      input: $(`#${inputId}`),
      slot: $(`#slot-${prefix === "answer" ? "answer" : prefix}`),
      card: $(`#${prefix}-card`),
      name: $(`#${prefix}-name`),
      meta: $(`#${prefix}-meta`),
      preview: $(`#${prefix}-preview`),
      canvas: $(`#${prefix}-canvas`),
      state: $(`#${prefix}-state`),
      progress: $(`#${prefix}-progress`),
      bar: $(`#${prefix}-bar`),
      pct: $(`#${prefix}-pct`),
      status: $(`#${prefix}-status`),
    });

    const isUploadAborted = (e) =>
      e?.name === "UploadAborted" || e?.code === "UPLOAD_ABORTED";

    const abortSlotUpload = (ui, { quiet = false } = {}) => {
      if (!ui) return;
      ui._token = (ui._token || 0) + 1;
      try {
        ui._upload?.abort?.();
      } catch (_) {}
      ui._upload = null;
      ui._inflight = null;
      ui._halt = true;
      cancelAnimationFrame(ui._raf);
      ui.slot?.classList.remove("is-uploading", "is-done", "is-err");
      if (ui.progress) ui.progress.hidden = true;
      paintPct(ui, 0);
      if (!quiet && ui.state) {
        ui.state.textContent = ui.input?.files?.[0]
          ? "آپلود متوقف شد — می‌توانی دوباره آپلود کنی"
          : "";
      }
    };

    const wireSlot = (ui) => {
      const input = ui.input;
      const slot = ui.slot;
      if (!input || !slot) return;
      input.addEventListener("change", () => {
        const file = input.files?.[0] || null;
        presentFile(ui, file);
        if (file) startSlotUpload(ui);
      });
      slot.querySelectorAll("[data-pick]").forEach((btn) => {
        btn.addEventListener("click", () => {
          abortSlotUpload(ui, { quiet: true });
          input.click();
        });
      });
      slot.querySelectorAll("[data-jh-abort-upload]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          abortSlotUpload(ui);
          msg(err, "آپلود متوقف شد", true);
        });
      });
      ["dragenter", "dragover"].forEach((ev) =>
        slot.addEventListener(ev, (e) => {
          e.preventDefault();
          slot.classList.add("is-drag");
        })
      );
      ["dragleave", "drop"].forEach((ev) =>
        slot.addEventListener(ev, (e) => {
          e.preventDefault();
          slot.classList.remove("is-drag");
        })
      );
      slot.addEventListener("drop", (e) => {
        const f = e.dataTransfer?.files?.[0];
        if (!f || typeof DataTransfer === "undefined") return;
        const dt = new DataTransfer();
        dt.items.add(f);
        input.files = dt.files;
        input.dispatchEvent(new Event("change"));
      });
    };

    const pdfUi = Object.assign(slotUi("pdf", "file_pdf"), {
      role: "original",
      bucket: "pdf",
    });
    const docxUi = Object.assign(slotUi("docx", "file_docx"), {
      role: "editable",
      bucket: "docx",
    });
    const answerUi = Object.assign(slotUi("answer", "file_answer"), {
      role: "answer",
      bucket: "answer",
    });
    const consentUi = Object.assign(slotUi("consent", "file_consent"), {
      role: "consent",
      bucket: "consent",
    });
    const coverUi = Object.assign(slotUi("cover", "file_cover"), {
      role: "cover",
      bucket: "cover",
    });
    [coverUi, pdfUi, docxUi, answerUi, consentUi].forEach(wireSlot);

    const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

    const startSlotUpload = (ui) => {
      const file = ui.input?.files?.[0];
      if (!file) return;
      if (file.size > MAX_UPLOAD_BYTES) {
        ui.slot?.classList.remove("is-uploading", "is-done");
        ui.slot?.classList.add("is-err");
        if (ui.progress) ui.progress.hidden = true;
        if (ui.state) ui.state.textContent = "حجم فایل بیشتر از ۱۰۰ مگابایت است";
        msg(err, "حداکثر حجم هر فایل ۱۰۰ مگابایت است");
        return;
      }
      try {
        ui._upload?.abort?.();
      } catch (_) {}
      const token = (ui._token || 0) + 1;
      ui._token = token;
      ui._inflight = (async () => {
        if (!currentId) await saveMeta();
        if (!currentId) throw new Error("اول مرحله اطلاعات را ذخیره کن");
        if (ui._token !== token) return null;
        const done = await uploadOne(file, ui.role, ui, token);
        if (ui._token !== token || !done) return null;
        uploaded[ui.bucket] = done;
        return done;
      })().catch((e) => {
        if (ui._token === token && !isUploadAborted(e)) {
          msg(err, e.message || "آپلود ناموفق");
        }
        throw e;
      });
    };

    const markStored = (ui, label) => {
      const idle = ui.slot?.querySelector(".jh-drop-idle");
      if (idle) idle.hidden = true;
      if (ui.card) ui.card.hidden = false;
      if (ui.name) ui.name.textContent = label;
      if (ui.meta) ui.meta.textContent = "روی سرور ذخیره شده";
      if (ui.state) ui.state.textContent = "آپلود قبلی سالم است";
      if (ui.progress) ui.progress.hidden = false;
      paintPct(ui, 100);
      ui.slot?.classList.add("is-done");
    };

    const uploadOne = async (file, role, ui, token) => {
      const fd = new FormData();
      fd.append("file", file);
      if (role !== "cover") fd.append("file_role", role);
      ui._halt = true;
      cancelAnimationFrame(ui._raf);
      ui._shown = 0;
      ui._target = 0;
      ui.slot?.classList.remove("is-done", "is-err");
      ui.slot?.classList.add("is-uploading");
      if (ui.progress) ui.progress.hidden = false;
      if (ui.state) ui.state.textContent = "در حال آپلود…";
      paintPct(ui, 0);
      const endpoint =
        role === "cover"
          ? `/api/site/pamphlets/mine/${currentId}/cover`
          : `/api/site/pamphlets/mine/${currentId}/upload`;
      const req = S().apiFormProgress(
        endpoint,
        fd,
        {
          onProgress: ({ percent }) => {
            if (token != null && ui._token !== token) return;
            const p = Math.max(0, Math.min(99, percent));
            ui._target = p;
            paintPct(ui, p);
          },
        }
      );
      ui._upload = req;
      try {
        await req;
        if (token != null && ui._token !== token) return null;
        ui._upload = null;
        ui.slot?.classList.remove("is-uploading");
        ui.slot?.classList.add("is-done");
        if (ui.state) ui.state.textContent = "آپلود شد";
        paintPct(ui, 100);
        return { name: file.name, size: file.size };
      } catch (e) {
        ui._upload = null;
        ui.slot?.classList.remove("is-uploading");
        if (isUploadAborted(e) || (token != null && ui._token !== token)) {
          return null;
        }
        ui.slot?.classList.add("is-err");
        if (ui.state) ui.state.textContent = e.message || "آپلود ناموفق بود. دوباره تلاش کن.";
        throw e;
      }
    };

    const renderAttachList = (atts = []) => {
      const host = $("#jh-attach-list");
      if (!host) return;
      host.innerHTML = atts
        .map(
          (a) => `<div class="jh-attach-row" data-att="${S().esc(a.id)}">
          <strong>${S().esc(a.title || a.file_name || "پیوست")}</strong>
          <span class="jh-meta">${S().esc(a.role)} · ${formatBytes(
            a.file_size_bytes
          )}</span>
          <span></span>
          <button type="button" class="jh-btn secondary" data-att-del="${S().esc(
            a.id
          )}">حذف</button>
        </div>`
        )
        .join("");
      host.querySelectorAll("[data-att-del]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          if (!currentId) return;
          try {
            await S().api(
              `/api/site/pamphlets/mine/${currentId}/attachments/${btn.dataset.attDel}`,
              { method: "DELETE", body: "{}" }
            );
            const row = btn.closest("[data-att]");
            row?.remove();
          } catch (e) {
            msg(err, e.message || "حذف ناموفق");
          }
        })
      );
    };

    $("#btn-add-attach")?.addEventListener("click", () => {
      const host = $("#jh-attach-list");
      if (!host) return;
      const row = document.createElement("div");
      row.className = "jh-attach-row";
      row.innerHTML = `
        <select data-att-role>
          <option value="video_solution">حل ویدیویی</option>
          <option value="audio">فایل صوتی</option>
          <option value="extra">فایل اضافه</option>
        </select>
        <input type="file" data-att-file />
        <button type="button" class="jh-btn" data-att-upload>آپلود</button>
        <button type="button" class="jh-btn secondary" data-att-cancel>×</button>`;
      host.appendChild(row);
      row.querySelector("[data-att-cancel]")?.addEventListener("click", () =>
        row.remove()
      );
      row.querySelector("[data-att-upload]")?.addEventListener("click", async () => {
        if (!currentId) return msg(err, "اول مشخصات را ذخیره کن");
        const file = row.querySelector("[data-att-file]")?.files?.[0];
        const role = row.querySelector("[data-att-role]")?.value || "extra";
        if (!file) return msg(err, "فایل را انتخاب کن");
        if (file.size > 100 * 1024 * 1024)
          return msg(err, "حداکثر حجم هر فایل ۱۰۰ مگابایت است");
        const fd = new FormData();
        fd.append("file", file);
        fd.append("role", role);
        fd.append("title", file.name);
        try {
          const res = await S().apiForm(
            `/api/site/pamphlets/mine/${currentId}/attachments`,
            fd
          );
          renderAttachList(res.data?.attachments || []);
          msg(err, "پیوست اضافه شد", true);
        } catch (e) {
          msg(err, e.message || "آپلود پیوست ناموفق");
        }
      });
    });

    $("#btn-next-1")?.addEventListener("click", async () => {
      try {
        await saveMeta();
        msg(err, "ذخیره شد", true);
        refreshSuggest();
        showStep(2);
      } catch (e) {
        msg(err, e.message || "خطا");
      }
    });
    $("#btn-back-2")?.addEventListener("click", () => showStep(1));
    $("#btn-back-3")?.addEventListener("click", () => showStep(2));

    $("#btn-next-2")?.addEventListener("click", async () => {
      try {
        const body = collect();
        validateStep1(body);
        validateStep2(body);
        await saveMeta();
        if (!currentId) return msg(err, "پرونده ساخته نشد");
        const ensureUploaded = async (ui) => {
          if (ui._inflight) {
            try {
              await ui._inflight;
            } catch (_) {}
          }
          const file = ui.input?.files?.[0];
          if (ui.slot?.classList.contains("is-done") && uploaded[ui.bucket]) return;
          if (!file) return;
          uploaded[ui.bucket] = await uploadOne(file, ui.role, ui);
        };
        const pdf = $("#file_pdf")?.files?.[0];
        if (!pdf && !uploaded.pdf)
          return msg(err, "فایل PDF جزوه را انتخاب کن");
        if (pdfUi.slot?.classList.contains("is-uploading") || pdfUi.slot?.classList.contains("is-err")) {
          /* wait or retry below */
        }
        await ensureUploaded(coverUi);
        if (!uploaded.cover) return msg(err, "عکس روی جلد را آپلود کن");
        await ensureUploaded(pdfUi);
        if (!uploaded.pdf) return msg(err, "فایل PDF هنوز آپلود نشده");
        await ensureUploaded(consentUi);
        await ensureUploaded(docxUi);
        await ensureUploaded(answerUi);
        msg(err, "فایل‌ها آماده شد", true);
        showStep(3);
      } catch (e) {
        msg(err, e.message || "آپلود ناموفق");
      }
    });

    $("#btn-submit")?.addEventListener("click", async () => {
      if (!currentId) return msg(err, "پرونده ناقص است");
      if (!$("#rights")?.checked || !$("#health")?.checked) {
        return msg(err, "ابتدا تعهدات را بپذیر");
      }
      try {
        await saveMeta();
        await S().api(`/api/site/pamphlets/mine/${currentId}/submit`, {
          method: "POST",
          body: "{}",
        });
        msg(err, "برای بررسی ارسال شد", true);
        setTimeout(() => (location.href = "account.html?tab=mine"), 700);
      } catch (e) {
        msg(err, e.message || "ارسال ناموفق");
      }
    });

    if (currentId) {
      try {
        const all = await S().api("/api/site/pamphlets/mine/list");
        const p = (all.data || []).find((x) => x.id === currentId);
        if (p) {
          if ($("#title")) $("#title").value = p.title || "";
          majorSel.value = p.major || p.field_of_study || "";
          fillCourses();
          $("#course_name").value = p.course_name || "";
          refreshCombo($("#course_name"));
          refreshCombo(majorSel);
          if ($("#summary")) $("#summary").value = p.summary || "";
          if ($("#outline_text")) {
            const blurb =
              (p.outline_text || "").trim() ||
              (Array.isArray(p.topics) ? p.topics.join("\n") : "");
            $("#outline_text").value = blurb;
          }
          if ($("#out_of_scope_text"))
            $("#out_of_scope_text").value = p.out_of_scope_text || "";
          if ($("#sources_text")) $("#sources_text").value = p.sources_text || "";
          if ($("#content_kind")) $("#content_kind").value = p.content_kind || "typed";
          if ($("#coverage")) {
            const cov = p.coverage || "";
            // Map legacy values into the new coverage set
            $("#coverage").value =
              cov === "full" ? "final" : cov === "partial" ? "short" : cov;
          }
          if ($("#difficulty")) $("#difficulty").value = p.difficulty || "";
          refreshCombo($("#content_kind"));
          refreshCombo($("#coverage"));
          refreshCombo($("#difficulty"));
          if ($("#authors_text")) $("#authors_text").value = p.authors_text || "";
          if ($("#is_anonymous")) $("#is_anonymous").checked = !!p.is_anonymous;
          if ($("#professor_name"))
            $("#professor_name").value = p.professor_name || "";
          fillTermYearSelects(p.term_year || "");
          if ($("#degree_level")) $("#degree_level").value = p.degree_level || "";
          const price = Number(
            p.proposed_price_irt != null ? p.proposed_price_irt : p.price_irt || 0
          );
          const units = unitCountOf(p);
          if (unitHidden) unitHidden.value = String(units);
          const radio = $(`input[name="unit_count"][value="${units}"]`);
          if (radio) radio.checked = true;
          if (priceHidden) priceHidden.value = String(price);
          if (freeToggle) freeToggle.checked = price <= 0;
          draftPagesCount = Math.max(0, Number(p.pages_count) || 0);
          syncPriceUi();
          if (p.price_locked) {
            const block = $("#jh-price-block");
            if (block) {
              block.classList.add("is-locked");
              const note = $("#jh-price-note");
              if (note)
                note.textContent =
                  "واحد و قیمت نهایی توسط داوری قفل شده و قابل ویرایش نیست.";
            }
            if (priceHidden) priceHidden.disabled = true;
            if (freeToggle) freeToggle.disabled = true;
            const disp = $("#price_irt_display");
            if (disp) disp.disabled = true;
          }
          syncSummaryCount();
          refreshSuggest();
          if (p.cover_media_id) {
            uploaded.cover = { name: "جلد قبلی", size: 0 };
            markStored(coverUi, "جلد قبلی");
          }
          if (p.original_media_id) {
            uploaded.pdf = { name: "فایل PDF قبلی", size: p.file_size_bytes || 0 };
            markStored(pdfUi, "فایل PDF قبلی");
          }
          if (p.editable_media_id) {
            uploaded.docx = { name: "Word قبلی", size: 0 };
            markStored(docxUi, "فایل Word قبلی");
          }
          if (p.answer_media_id) {
            uploaded.answer = { name: "پاسخنامه قبلی", size: 0 };
            markStored(answerUi, "پاسخنامه قبلی");
          }
          if (p.consent_media_id) {
            uploaded.consent = { name: "برگه رضایت قبلی", size: 0 };
            markStored(consentUi, "برگه رضایت قبلی");
          }
          renderAttachList(p.attachments || []);
          const bar = $("#jh-case-bar");
          if (bar && p.status) {
            bar.hidden = false;
            const label = p.status_label || STATUS_FA[p.status] || p.status;
            const code = toFaDigits(p.content_code || "—");
            bar.innerHTML = `<span class="jh-case-status">${S().esc(label)}</span>
              <span class="jh-case-code">کد ${S().esc(code)}</span>`;
          }
        }
      } catch (_) {}
    }
  }

  function renderAccountSwitcher(host, me) {
    if (!host) return;
    const vault = S().listVault?.() || [];
    if (vault.length < 2) {
      host.innerHTML = "";
      return;
    }
    host.innerHTML = `<label class="jh-switcher-label">سوییچ حساب
      <select id="jh-switch-select">
        ${vault
          .map(
            (v) =>
              `<option value="${S().esc(v.token)}" ${
                v.id === me.id ? "selected" : ""
              }>${S().esc(v.label || v.phone)}</option>`
          )
          .join("")}
      </select>
    </label>`;
    $("#jh-switch-select")?.addEventListener("change", async (e) => {
      const token = e.target.value;
      invalidateSessionCache();
      S().setActiveAccount?.(token);
      const ok = await ensureSession();
      if (!ok) {
        S().removeFromVault?.(token);
        msg($("#jh-err"), "نشست این حساب منقضی شده");
        return;
      }
      location.reload();
    });
  }

  function purchasePackages(wallet) {
    const list = wallet?.packages || wallet?.unit_pricing?.packages || [];
    if (list.length) return list;
    return defaultUnitCatalog();
  }

  function defaultUnitCatalog() {
    return [
      {
        sku: "charge_99",
        units: 2,
        price_irt: 99000,
        kind: "topup",
        title_fa: "شارژ ۹۹٬۰۰۰",
      },
      {
        sku: "charge_199",
        units: 4,
        price_irt: 199000,
        kind: "topup",
        title_fa: "شارژ ۱۹۹٬۰۰۰",
      },
      {
        sku: "charge_399",
        units: 8,
        price_irt: 399000,
        kind: "topup",
        title_fa: "شارژ ۳۹۹٬۰۰۰",
      },
      {
        sku: "charge_699",
        units: 14,
        price_irt: 699000,
        kind: "topup",
        title_fa: "شارژ ۶۹۹٬۰۰۰",
      },
      {
        sku: "charge_999",
        units: 20,
        price_irt: 999000,
        kind: "topup",
        title_fa: "شارژ ۹۹۹٬۰۰۰",
      },
      {
        sku: "units_6",
        units: 6,
        price_irt: 299000,
        list_price_irt: 600000,
        discount_pct: 50,
        badge_fa: "پیشنهاد بلوک",
        kind: "pack",
        featured: true,
        unit_value_irt: 49833,
        title_fa: "پکیج ۶ واحدی",
      },
      {
        sku: "units_12",
        units: 12,
        price_irt: 599000,
        list_price_irt: 1200000,
        discount_pct: 50,
        badge_fa: "پیشنهاد ویژه",
        kind: "pack",
        featured: false,
        unit_value_irt: 49916,
        title_fa: "پکیج ۱۲ واحدی",
      },
    ];
  }

  function unitTopups(wallet) {
    const all = purchasePackages(wallet);
    const tops = all.filter((p) => (p.kind || "pack") === "topup");
    return tops.length
      ? tops
      : defaultUnitCatalog().filter((p) => p.kind === "topup");
  }

  function unitPacks(wallet) {
    const all = purchasePackages(wallet);
    const packs = all.filter((p) => (p.kind || "pack") !== "topup");
    return packs.length
      ? packs
      : defaultUnitCatalog().filter((p) => p.kind === "pack");
  }

  function packCardHtml(pkg) {
    const list = Number(pkg.list_price_irt || 0);
    const price = Number(pkg.price_irt || 0);
    const disc = Number(pkg.discount_pct || 0);
    const badge = pkg.badge_fa
      ? `<span class="jh-pack-badge">${S().esc(pkg.badge_fa)}</span>`
      : "";
    const was =
      list > price
        ? `<span class="jh-pack-was">${money(list)}</span>`
        : "";
    const save =
      disc > 0
        ? `<span class="jh-pack-off">${toFaDigits(disc)}٪ تخفیف</span>`
        : "";
    const featured = pkg.featured ? " jh-pack-card--featured" : "";
    return `<button type="button" class="jh-pack-card${featured}" data-unit-sku="${S().esc(
      pkg.sku
    )}">
      ${badge}
      <strong class="jh-pack-title">${S().esc(pkg.title_fa || "پکیج")}</strong>
      <span class="jh-pack-units">${toFaDigits(pkg.units)} واحد خرید</span>
      <span class="jh-pack-price-row">${was}<em class="jh-pack-now">${money(
      price
    )}</em></span>
      ${save}
      <span class="jh-pack-hint">≈ ${money(
        pkg.unit_value_irt || Math.floor(price / Math.max(1, pkg.units || 1))
      )} / واحد</span>
    </button>`;
  }

  function topupChipHtml(pkg) {
    return `<button type="button" class="jh-topup-chip" data-unit-sku="${S().esc(
      pkg.sku
    )}">
      <strong>${money(pkg.price_irt)}</strong>
      <span>${toFaDigits(pkg.units)} واحد</span>
    </button>`;
  }

  async function payUnitSku(sku, btn, errEl) {
    if (!sku) return;
    if (btn) btn.disabled = true;
    try {
      const pay = await S().api(
        `/api/site/pamphlets/wallet/units/packages/${encodeURIComponent(
          sku
        )}/pay`,
        {
          method: "POST",
          body: JSON.stringify({ environment: PAY_ENV }),
        }
      );
      if (pay.data?.start_pay_url) {
        location.href = pay.data.start_pay_url;
        return;
      }
      if (pay.data?.dev) {
        msg(
          errEl,
          `شارژ آزمایشی: ${toFaDigits(pay.data.units || 0)} واحد`,
          true
        );
        location.reload();
        return;
      }
      msg(errEl, "پاسخ درگاه نامعتبر");
    } catch (e) {
      msg(errEl, e.message || "خطای خرید");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function incomeUnitValueOf(wallet) {
    const n = Number(wallet?.income_unit_value_irt || 0);
    if (n > 0) return n;
    const six = purchasePackages(wallet).find((p) => p.sku === "units_6");
    const fromPkg = Number(six?.unit_value_irt || 0);
    if (fromPkg > 0) return fromPkg;
    return Math.floor(299000 / 6);
  }

  /** ارزش تومانی موجودی قابل خرید (prepaid واقعی یا برآورد از واحد). */
  function purchasableValueIrt(wallet) {
    const prepaid = Math.max(
      0,
      Math.floor(Number(wallet?.wallet_units_prepaid_irt) || 0)
    );
    if (prepaid > 0) return prepaid;
    const units = Math.max(0, Math.floor(Number(wallet?.wallet_units) || 0));
    if (units <= 0) return 0;
    return units * incomeUnitValueOf(wallet);
  }

  function purchasableUnitsLabel(wallet) {
    const units = Math.max(0, Math.floor(Number(wallet?.wallet_units) || 0));
    return `${toFaDigits(units)} واحد`;
  }

  function openPurchaseBalanceSheet(wallet, onUpdate) {
    document.getElementById("jh-buybal")?.remove();
    const unitValue = incomeUnitValueOf(wallet);
    let pick = 1;
    const topupHtml = unitTopups(wallet).map(topupChipHtml).join("");
    const packHtml = unitPacks(wallet).map(packCardHtml).join("");
    const root = document.createElement("div");
    root.id = "jh-buybal";
    root.className = "jh-buybal";
    root.innerHTML = `
      <button type="button" class="jh-buybal-backdrop" data-buybal-close aria-label="بستن"></button>
      <div class="jh-buybal-panel" role="dialog" aria-modal="true" aria-labelledby="jh-buybal-title" tabindex="-1">
        <div class="jh-buybal-head">
          <div>
            <p class="jh-wallet-kicker">موجودی قابل خرید</p>
            <h3 id="jh-buybal-title">شارژ حساب یا انتقال</h3>
          </div>
          <button type="button" class="jh-buybal-x" data-buybal-close aria-label="بستن">×</button>
        </div>
        <p class="jh-buybal-now">قابل خرید: <strong data-buybal-units></strong> · قابل تسویه: <strong data-buybal-withdraw></strong></p>
        <p class="jh-buybal-rules">فقط برای خرید جزوه است. برگشت به درآمد نویسنده، تسویه شبا، یا بازگشت وجه نقدی ندارد.</p>
        <section class="jh-buybal-sec">
          <h4>شارژ سریع</h4>
          <div class="jh-topup-grid">${topupHtml}</div>
        </section>
        <section class="jh-buybal-sec">
          <h4>پکیج اشتراک</h4>
          <div class="jh-pack-grid">${packHtml}</div>
        </section>
        <section class="jh-buybal-sec">
          <h4>انتقال از موجودی قابل تسویه</h4>
          <p class="jh-note">یک‌طرفه: هر واحد ${money(
            unitValue
          )} · حداکثر: <strong data-buybal-max>۰</strong> واحد</p>
          <div class="jh-buybal-step">
            <button type="button" class="jh-btn secondary" data-buybal-step="-1" aria-label="کمتر">−</button>
            <strong data-buybal-count>۱</strong>
            <button type="button" class="jh-btn secondary" data-buybal-step="1" aria-label="بیشتر">+</button>
            <button type="button" class="jh-chip" data-buybal-step="max">حداکثر</button>
          </div>
          <p class="jh-buybal-cost" data-buybal-cost></p>
          <button type="button" class="jh-btn" data-buybal-charge>انتقال به موجودی قابل خرید</button>
        </section>
        <div class="jh-buybal-foot">
          <a class="jh-btn secondary" href="index.html">رفتن به فروشگاه جزوه</a>
        </div>
        <p class="jh-buybal-msg" data-buybal-msg hidden></p>
      </div>`;
    document.body.appendChild(root);

    const countEl = root.querySelector("[data-buybal-count]");
    const costEl = root.querySelector("[data-buybal-cost]");
    const maxEl = root.querySelector("[data-buybal-max]");
    const unitsNow = root.querySelector("[data-buybal-units]");
    const withdrawEl = root.querySelector("[data-buybal-withdraw]");
    const noteEl = root.querySelector("[data-buybal-msg]");
    const chargeBtn = root.querySelector("[data-buybal-charge]");

    const maxUnits = () =>
      Math.max(
        0,
        Math.floor(Number(wallet.wallet_balance_irt || 0) / unitValue)
      );

    const say = (text, ok) => {
      if (!noteEl) return;
      noteEl.hidden = !text;
      noteEl.textContent = text || "";
      noteEl.classList.toggle("is-ok", !!ok);
    };

    const paint = () => {
      const max = maxUnits();
      if (pick < 1) pick = 1;
      if (max > 0 && pick > max) pick = max;
      if (countEl) countEl.textContent = toFaDigits(max > 0 ? pick : 0);
      if (costEl) {
        costEl.textContent =
          max > 0
            ? `انتقال از قابل تسویه: ${money(pick * unitValue)}`
            : `برای یک واحد حداقل ${money(unitValue)} موجودی قابل تسویه لازم است`;
      }
      if (maxEl) maxEl.textContent = toFaDigits(max);
      if (unitsNow) {
        unitsNow.textContent = `${purchasableUnitsLabel(wallet)} · ${money(
          purchasableValueIrt(wallet)
        )}`;
      }
      if (withdrawEl) withdrawEl.textContent = money(wallet.wallet_balance_irt || 0);
      if (chargeBtn) chargeBtn.disabled = max < 1;
    };

    const close = () => {
      document.removeEventListener("keydown", onKey);
      root.remove();
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    root.querySelectorAll("[data-buybal-close]").forEach((el) => {
      el.addEventListener("click", close);
    });
    root.querySelectorAll("[data-buybal-step]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const step = btn.getAttribute("data-buybal-step");
        const max = maxUnits();
        if (step === "max") pick = Math.max(1, max);
        else pick += Number(step) || 0;
        if (pick < 1) pick = 1;
        paint();
      });
    });
    root.querySelectorAll("[data-unit-sku]").forEach((btn) => {
      btn.addEventListener("click", () =>
        payUnitSku(
          btn.getAttribute("data-unit-sku"),
          btn,
          $("#jh-err") || noteEl
        )
      );
    });
    chargeBtn?.addEventListener("click", async () => {
      const max = maxUnits();
      if (max < 1 || pick < 1) return;
      chargeBtn.disabled = true;
      say("", false);
      try {
        const res = await S().api(
          "/api/site/pamphlets/wallet/units/from-income",
          {
            method: "POST",
            body: JSON.stringify({ units: pick }),
          }
        );
        const d = res.data || {};
        wallet.wallet_balance_irt = Number(d.wallet_balance_irt || 0);
        wallet.wallet_units = Number(d.wallet_units || 0);
        wallet.wallet_units_prepaid_irt = Number(
          d.wallet_units_prepaid_irt || 0
        );
        onUpdate?.(wallet);
        say(
          `${toFaDigits(d.units || pick)} واحد به موجودی قابل خرید منتقل شد`,
          true
        );
        paint();
      } catch (e) {
        say(e.message || "انتقال ناموفق", false);
        paint();
      }
    });
    paint();
    root.querySelector(".jh-buybal-panel")?.focus();
  }

  function bindPurchaseBalanceOpener(btn, wallet, onUpdate) {
    if (!btn) return;
    btn.addEventListener("click", () => {
      openPurchaseBalanceSheet(wallet, onUpdate);
    });
  }

  async function mountDashShopCatalog(box, errEl) {
    if (!box) return;
    box.innerHTML = `
      <section class="jh-dash-shop-panel" aria-labelledby="jh-dash-shop-title">
        <header class="jh-dash-shop-head">
          <div>
            <p class="jh-wallet-kicker">خرید جزوه</p>
            <h2 id="jh-dash-shop-title">جزوه‌های فروشگاه</h2>
            <p class="jh-note">فقط فهرست قابل خرید — با فیلتر رشته، نوع و قیمت.</p>
          </div>
        </header>
        <div class="jh-dash-shop-search">
          <label class="jh-search-combo">
            <span class="visually-hidden">جست‌وجو</span>
            <input id="dash-filter-q" type="search" placeholder="جست‌وجو نام درس، جزوه یا نویسنده…" autocomplete="off" enterkeyhint="search" />
          </label>
        </div>
        <div class="jh-filter-chips" role="toolbar" aria-label="فیلتر فروشگاه">
          <label class="jh-chip-select">
            <span class="jh-chip-select-lab">رشته</span>
            <select id="dash-filter-major"><option value="">همه</option></select>
          </label>
          <label class="jh-chip-select">
            <span class="jh-chip-select-lab">نوع</span>
            <select id="dash-filter-kind">
              <option value="">همه</option>
              <option value="typed">تایپی</option>
              <option value="handwritten">دست‌نویس</option>
            </select>
          </label>
          <label class="jh-chip-select">
            <span class="jh-chip-select-lab">قیمت</span>
            <select id="dash-filter-priced">
              <option value="">همه</option>
              <option value="free">رایگان</option>
              <option value="paid">پولی</option>
            </select>
          </label>
          <button class="jh-chip-clear" type="button" id="dash-btn-clear" hidden>پاک‌کردن</button>
        </div>
        <div class="jh-results-meta" id="dash-results-meta" hidden></div>
        <div id="dash-shop-list" class="jh-dash-shop-list"></div>
      </section>`;

    const list = $("#dash-shop-list", box);
    const metaEl = $("#dash-results-meta", box);
    const qInput = $("#dash-filter-q", box);
    const majorSel = $("#dash-filter-major", box);
    const clearBtn = $("#dash-btn-clear", box);
    let loadSeq = 0;
    let debounceTimer = 0;

    try {
      const meta = await S().api("/api/site/pamphlets/meta");
      const majors = meta.data?.taxonomy?.majors || [];
      majors.forEach((m) => {
        const o = document.createElement("option");
        o.value = m;
        o.textContent = m;
        majorSel?.appendChild(o);
      });
    } catch (_) {}

    const readFilters = () => ({
      q: normSearchQuery(qInput?.value || ""),
      major: ($("#dash-filter-major", box)?.value || "").trim(),
      priced: ($("#dash-filter-priced", box)?.value || "").trim(),
      content_kind: ($("#dash-filter-kind", box)?.value || "").trim(),
    });

    const hasActive = () => {
      const f = readFilters();
      return !!(f.q || f.major || f.priced || f.content_kind);
    };

    const syncClear = () => {
      if (clearBtn) clearBtn.hidden = !hasActive();
    };

    const load = async () => {
      const f = readFilters();
      syncClear();
      const qs = new URLSearchParams({ limit: "60" });
      if (f.q) qs.set("q", f.q);
      if (f.major) qs.set("major", f.major);
      if (f.priced) qs.set("priced", f.priced);
      if (f.content_kind) qs.set("content_kind", f.content_kind);
      const seq = ++loadSeq;
      if (metaEl) {
        metaEl.hidden = false;
        metaEl.textContent = "در حال جست‌وجو…";
      }
      try {
        const res = await S().api(`/api/site/pamphlets?${qs}`);
        if (seq !== loadSeq || !list) return;
        const items = res.data || [];
        if (metaEl) {
          metaEl.textContent = items.length
            ? `${items.length.toLocaleString("fa-IR")} جزوه`
            : hasActive()
              ? "نتیجه‌ای نیست"
              : "";
          metaEl.hidden = !metaEl.textContent;
        }
        if (items.length) {
          list.innerHTML = `<div class="jh-grid">${items.map(cardHtml).join("")}</div>`;
          hydrateCardCovers(list);
          return;
        }
        list.innerHTML = hasActive()
          ? `<div class="jh-empty"><strong>نتیجه‌ای پیدا نشد</strong><p>فیلترها را ساده‌تر کن.</p></div>`
          : `<div class="jh-empty"><strong>هنوز جزوه‌ای منتشر نشده</strong><p>به‌زودی اینجا می‌آید.</p></div>`;
      } catch (e) {
        if (seq !== loadSeq) return;
        if (metaEl) metaEl.hidden = true;
        list.innerHTML = `<div class="jh-empty"><strong>دریافت فهرست ممکن نشد</strong><p>${S().esc(
          e.message || "خطا"
        )}</p></div>`;
        msg(errEl, e.message || "خطا");
      }
    };

    const schedule = () => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(load, 280);
    };

    clearBtn?.addEventListener("click", () => {
      if (qInput) qInput.value = "";
      if (majorSel) majorSel.value = "";
      if ($("#dash-filter-kind", box)) $("#dash-filter-kind", box).value = "";
      if ($("#dash-filter-priced", box))
        $("#dash-filter-priced", box).value = "";
      load();
    });
    qInput?.addEventListener("input", schedule);
    qInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        window.clearTimeout(debounceTimer);
        load();
      }
    });
    ["dash-filter-major", "dash-filter-kind", "dash-filter-priced"].forEach(
      (id) => {
        $(`#${id}`, box)?.addEventListener("change", () => load());
      }
    );
    await load();
  }

  function syncOverviewPurchaseCards(next) {
    const balEl = document.querySelector("[data-overview-balance]");
    const unitsEl = document.querySelector("[data-overview-units]");
    const irtEl = document.querySelector("[data-overview-units-irt]");
    const noteEl = document.querySelector("[data-overview-units-note]");
    if (balEl) balEl.textContent = money(next.wallet_balance_irt || 0);
    const buyIrt = purchasableValueIrt(next);
    if (unitsEl) unitsEl.textContent = purchasableUnitsLabel(next);
    if (irtEl) irtEl.textContent = money(buyIrt);
    if (noteEl) {
      noteEl.textContent = "فقط برای خرید جزوه — بدون تسویه شبا";
    }
    const walletUnits = document.querySelector("[data-wallet-units]");
    const walletUnitsIrt = document.querySelector("[data-wallet-units-irt]");
    const walletBal = document.querySelector("[data-wallet-balance]");
    if (walletUnits) {
      walletUnits.textContent = toFaDigits(next.wallet_units || 0);
    }
    if (walletUnitsIrt) {
      walletUnitsIrt.textContent = money(buyIrt);
    }
    if (walletBal) {
      walletBal.textContent = money(next.wallet_balance_irt || 0);
      walletBal.classList.add("jh-money-settle");
    }
    paintWalletChip(next);
  }

  async function initAccount() {
    injectChrome("account");
    const boot = $("#jh-dash-boot");
    const dash = $("#jh-dash");
    let me = null;
    try {
      me = await ensureSession();
      if (!me) {
        setBootLabel(boot, "در حال رفتن به ورود…", "الان منتقل می‌شی");
        go(
          "login.html?next=" +
            encodeURIComponent("account.html" + location.search)
        );
        return;
      }
    } catch (_) {
      setBootLabel(boot, "در حال رفتن به ورود…", "الان منتقل می‌شی");
      go(
        "login.html?next=" +
          encodeURIComponent("account.html" + location.search)
      );
      return;
    } finally {
      if (me) {
        setBootLabel(boot, "حساب آماده‌ست", "خوش اومدی");
        dismissBoot(boot, dash);
      }
    }

    const err = $("#jh-err");
    const tab = new URLSearchParams(location.search).get("tab") || "overview";
    const displayName =
      `${me.first_name || ""} ${me.last_name || ""}`.trim() || "کاربر";
    const hello = $("#jh-hello");
    if (hello) hello.textContent = `سلام، ${displayName}`;
    S().rememberAuth?.({
      session_token: S().getSiteSession(),
      data: me,
    });
    renderAccountSwitcher($("#jh-switcher"), me);

    const side = $("#jh-dash-side");
    const backdrop = $("#jh-dash-backdrop");
    const closeMenu = () => {
      side?.classList.remove("open");
      if (backdrop) backdrop.hidden = true;
    };
    $("#btn-dash-menu")?.addEventListener("click", () => {
      side?.classList.toggle("open");
      if (backdrop) backdrop.hidden = !side?.classList.contains("open");
    });
    backdrop?.addEventListener("click", closeMenu);

    $$(`[data-tab]`).forEach((a) =>
      a.setAttribute(
        "aria-current",
        a.getAttribute("data-tab") === tab ? "page" : null
      )
    );
    $$(".jh-tab-panel").forEach((p) =>
      p.classList.toggle("on", p.dataset.tab === tab)
    );

    try {
      if (tab === "overview") {
        const [lib, mine, wallet] = await Promise.all([
          S().api("/api/site/pamphlets/library/me").catch(() => ({ data: [] })),
          S().api("/api/site/pamphlets/mine/list").catch(() => ({ data: [] })),
          S().api("/api/site/pamphlets/wallet/me").catch(() => ({ data: {} })),
        ]);
        const libItems = lib.data || [];
        const libN = libItems.length;
        const freeN = libItems.filter(
          (p) =>
            Number(p.price_irt || 0) <= 0 ||
            p.purchase_status === "free_granted"
        ).length;
        const paidN = Math.max(0, libN - freeN);
        const mineList = mine.data || [];
        const actionMine = mineList.find((p) =>
          [
            "needs_revision",
            "ready_to_publish",
            "awaiting_author_approval",
            "pending_payment",
          ].includes(p.status)
        );
        const publishedMine = mineList.filter((p) => p.status === "published")
          .length;
        const wlt = wallet.data || {};
        const bal = Number(wlt.wallet_balance_irt || 0);
        const earned = Number(wlt.earned_irt || 0);
        const buyUnits = Math.max(0, Math.floor(Number(wlt.wallet_units) || 0));
        const buyPrepaid = Math.max(
          0,
          Math.floor(Number(wlt.wallet_units_prepaid_irt) || 0)
        );
        const recentMine = mineList
          .slice()
          .sort(
            (a, b) =>
              new Date(b.updated_at || b.created_at || 0).getTime() -
              new Date(a.updated_at || a.created_at || 0).getTime()
          )
          .slice(0, 3);
        const recentLib = libItems
          .slice()
          .sort(
            (a, b) =>
              new Date(
                b.purchased_at || b.updated_at || b.created_at || 0
              ).getTime() -
              new Date(
                a.purchased_at || a.updated_at || a.created_at || 0
              ).getTime()
          )
          .slice(0, 3);
        const statusTodayHtml = () => {
          const mineRows = recentMine.length
            ? `<ul class="jh-dash-recent">${recentMine
                .map(
                  (p) => `<li>
                    <a href="account.html?tab=mine">
                      <strong>${S().esc(p.title || "بدون عنوان")}</strong>
                      <span class="jh-dash-st">${S().esc(
                        STATUS_FA[p.status] || p.status || ""
                      )}</span>
                    </a>
                  </li>`
                )
                .join("")}</ul>`
            : `<p class="jh-dash-empty-line">هنوز جزوه‌ای نفرستادی. <a href="submit.html">انتشار جزوه</a></p>`;
          const libRows = recentLib.length
            ? `<ul class="jh-dash-recent">${recentLib
                .map((p) => {
                  const free =
                    Number(p.price_irt || 0) <= 0 ||
                    p.purchase_status === "free_granted";
                  return `<li>
                    <a href="item.html?id=${S().esc(p.id || "")}">
                      <strong>${S().esc(p.title || "جزوه")}</strong>
                      <span class="jh-dash-st">${
                        free ? "رایگان" : "خریداری‌شده"
                      }</span>
                    </a>
                  </li>`;
                })
                .join("")}</ul>`
            : `<p class="jh-dash-empty-line">کتابخانه خالی است. <a href="account.html?tab=shop">برو فروشگاه</a></p>`;
          return `<div class="jh-dash-next jh-dash-next--today">
            <div class="jh-dash-next-copy">
              <p class="jh-dash-next-eyebrow">وضعیت امروز</p>
              <h3>آخرین جزوه‌ها</h3>
              <p class="jh-note">کتابخانه و پرونده‌های خودت را یک‌جا ببین.</p>
            </div>
            <div class="jh-dash-today-grid">
              <section class="jh-dash-today-col">
                <header>
                  <strong>کتابخانه من</strong>
                  <a href="account.html?tab=library">همه</a>
                </header>
                ${libRows}
              </section>
              <section class="jh-dash-today-col">
                <header>
                  <strong>جزوه‌های من</strong>
                  <a href="account.html?tab=mine">همه</a>
                </header>
                ${mineRows}
              </section>
            </div>
          </div>`;
        };
        $("#panel-overview").innerHTML = `
          <div class="jh-dash-cards jh-dash-cards--4">
            <a class="jh-dash-card jh-dash-card--lib" href="account.html?tab=library">
              <div class="jh-dash-card-top">
                <span class="jh-dash-card-ico" aria-hidden="true">☰</span>
                <span class="jh-dash-card-kicker">کتابخانه من</span>
              </div>
              <div class="jh-dash-card-body">
                <strong>${toFaDigits(libN)}</strong>
                <em>${
                  libN
                    ? `${toFaDigits(paidN)} خریده‌شده${
                        freeN ? ` · ${toFaDigits(freeN)} رایگان` : ""
                      }`
                    : "جزوه‌های خریداری و رایگان"
                }</em>
              </div>
              <span class="jh-dash-card-cta">مشاهده کتابخانه <span aria-hidden="true">←</span></span>
            </a>
            <a class="jh-dash-card jh-dash-card--mine" href="account.html?tab=mine">
              <div class="jh-dash-card-top">
                <span class="jh-dash-card-ico" aria-hidden="true">✎</span>
                <span class="jh-dash-card-kicker">جزوه‌های من</span>
              </div>
              <div class="jh-dash-card-body">
                <strong>${toFaDigits(mineList.length)}</strong>
                <em>${
                  actionMine
                    ? STATUS_FA[actionMine.status] || "نیاز به اقدام"
                    : publishedMine
                      ? `${toFaDigits(publishedMine)} منتشرشده`
                      : "پرونده‌های ارسالی شما"
                }</em>
              </div>
              <span class="jh-dash-card-cta">مدیریت جزوه‌ها <span aria-hidden="true">←</span></span>
            </a>
            <a class="jh-dash-card jh-dash-card--wallet" href="account.html?tab=wallet">
              <div class="jh-dash-card-top">
                <span class="jh-dash-card-ico" aria-hidden="true">◎</span>
                <span class="jh-dash-card-kicker">موجودی قابل تسویه</span>
              </div>
              <div class="jh-dash-card-body">
                <strong class="jh-money-settle" data-overview-balance>${money(
                  bal
                )}</strong>
                <em class="jh-money-earned-line">${
                  earned > 0
                    ? `کل درآمد فروش تا امروز: <span class="jh-money-earned">${money(
                        earned
                      )}</span>`
                    : "هنوز درآمد فروشی ثبت نشده"
                }</em>
              </div>
              <span class="jh-dash-card-cta">جزئیات درآمد <span aria-hidden="true">←</span></span>
            </a>
            <a class="jh-dash-card jh-dash-card--buy" href="account.html?tab=shop" id="btn-buy-balance">
              <div class="jh-dash-card-top">
                <span class="jh-dash-card-ico" aria-hidden="true">＋</span>
                <span class="jh-dash-card-kicker">موجودی قابل خرید</span>
              </div>
              <div class="jh-dash-card-body">
                <strong data-overview-units>${toFaDigits(buyUnits)} واحد</strong>
                <span class="jh-dash-buy-irt" data-overview-units-irt>${money(
                  buyPrepaid > 0
                    ? buyPrepaid
                    : purchasableValueIrt(wlt)
                )}</span>
                <em data-overview-units-note>فقط برای خرید جزوه — بدون تسویه شبا</em>
              </div>
              <span class="jh-dash-card-cta">برو به فروشگاه <span aria-hidden="true">←</span></span>
            </a>
          </div>
          ${
            actionMine
              ? `<div class="jh-dash-next jh-dash-next--action">
                  <div class="jh-dash-next-copy">
                    <p class="jh-dash-next-eyebrow">اقدام بعدی</p>
                    <h3>${S().esc(actionMine.title)}</h3>
                    <p class="jh-note">${S().esc(
                      STATUS_FA[actionMine.status] || actionMine.status
                    )}${
                      actionMine.next_action
                        ? ` — ${S().esc(actionMine.next_action)}`
                        : ""
                    }</p>
                  </div>
                  <a class="jh-btn" href="account.html?tab=mine">مشاهده پرونده</a>
                </div>`
              : ""
          }
          <div class="jh-card jh-overview-ref" id="jh-overview-ref">
            <header class="jh-overview-ref-head">
              <div>
                <p class="jh-wallet-kicker">سفیر بلوک</p>
                <h3>کد رفرال و لینک ثبت‌نام من</h3>
              </div>
            </header>
            ${referralInviteHtml(me.referral_code || wlt.account?.referral_code || "")}
          </div>
          ${statusTodayHtml()}`;
        bindReferralInvite(
          $("#jh-overview-ref"),
          me.referral_code || wlt.account?.referral_code || "",
          err
        );
        if (new URLSearchParams(location.search).get("buy") === "1") {
          openPurchaseBalanceSheet(wlt, syncOverviewPurchaseCards);
        }
      }
      if (tab === "shop") {
        await mountDashShopCatalog($("#panel-shop"), err);
      }
      if (tab === "library") {
        const res = await S().api("/api/site/pamphlets/library/me");
        const box = $("#panel-library");
        const items = res.data || [];
        box.innerHTML = items.length
          ? `<div class="jh-grid">${items.map(cardHtml).join("")}</div>`
          : `<div class="jh-empty">
              <strong>هنوز جزوه‌ای به کتابخانه‌ات اضافه نکردی</strong>
              <p>جزوه‌های خریداری‌شده و جزوه‌های رایگانی که ذخیره می‌کنی، اینجا نمایش داده می‌شوند.</p>
              <div class="jh-actions"><a class="jh-btn" href="account.html?tab=shop">پیدا کردن جزوه</a></div>
            </div>`;
        if (items.length) hydrateCardCovers(box);
      }
      if (tab === "mine") {
        const res = await S().api("/api/site/pamphlets/mine/list");
        const box = $("#panel-mine");
        const items = res.data || [];
        let sortKey = "updated_at";
        let sortDir = "desc";
        let filterStatus = "";
        let q = "";

        const toneClass = (t) => `jh-st jh-st--${t || "gray"}`;
        const faDate = (iso) => {
          if (!iso) return "—";
          try {
            return new Date(iso).toLocaleString("fa-IR");
          } catch (_) {
            return S().esc(String(iso).slice(0, 16));
          }
        };
        const opsHtml = (p) => {
          let ops = "";
          if (p.can_edit !== false) {
            ops += `<a class="jh-op" href="submit.html?id=${S().esc(
              p.id
            )}" title="ویرایش">✎</a>`;
          }
          if (p.can_delete) {
            ops += `<button type="button" class="jh-op jh-op-danger" data-del="${S().esc(
              p.id
            )}" title="حذف">×</button>`;
          }
          if (p.has_review_message || p.status === "needs_revision") {
            ops += `<a class="jh-op" href="account.html?tab=tickets" title="پیام داور">✉</a>`;
          }
          if (p.status === "ready_to_publish") {
            ops += `<button type="button" class="jh-op jh-op-ok" data-publish="${S().esc(
              p.id
            )}" title="انتشار">✓</button>`;
          }
          if (p.status === "awaiting_author_approval") {
            ops += `<button type="button" class="jh-op jh-op-ok" data-approve="${S().esc(
              p.id
            )}" title="تأیید نسخه">✓</button>`;
          }
          if (
            p.status === "needs_revision" ||
            p.status === "pending_payment" ||
            p.status === "in_preparation"
          ) {
            ops += `<button type="button" class="jh-op" data-orders="${S().esc(
              p.id
            )}" title="پیش‌فاکتور">﷼</button>`;
          }
          return ops || "—";
        };

        const renderMine = () => {
          let list = items.slice();
          if (filterStatus) {
            list = list.filter((p) => p.status === filterStatus);
          }
          if (q.trim()) {
            const qq = q.trim();
            list = list.filter(
              (p) =>
                String(p.content_code || "").includes(fromFaDigits(qq)) ||
                (p.title || "").includes(qq)
            );
          }
          const gradeRank = { A: 4, B: 3, C: 2, D: 1 };
          list.sort((a, b) => {
            let av;
            let bv;
            if (sortKey === "quality_grade") {
              av = gradeRank[a.quality_grade] || 0;
              bv = gradeRank[b.quality_grade] || 0;
            } else if (sortKey === "downloads") {
              av = Number(a.downloads || a.sales_count || 0);
              bv = Number(b.downloads || b.sales_count || 0);
            } else {
              av = new Date(a.updated_at || a.created_at || 0).getTime();
              bv = new Date(b.updated_at || b.created_at || 0).getTime();
            }
            return sortDir === "asc" ? av - bv : bv - av;
          });

          if (!items.length) {
            box.innerHTML = `<div class="jh-empty">
              <strong>اولین جزوه‌ات را منتشر کن</strong>
              <p>فایل آماده و استاندارد داری؟ ثبت و بررسی انتشار هزینه اولیه ندارد.</p>
              <div class="jh-actions">
                <a class="jh-btn" href="submit.html">ثبت جزوه جدید</a>
                <a class="jh-btn secondary" href="learn.html#publish-steps">شرایط و مقررات</a>
              </div>
            </div>`;
            return;
          }

          const rows = list
            .map((p, i) => {
              const checklist = (p.review_checklist || [])
                .map((x, ix) => `<li>${ix + 1}. ${S().esc(x)}</li>`)
                .join("");
              return `<tr>
                <td>${toFaDigits(i + 1)}</td>
                <td dir="ltr">${toFaDigits(p.content_code || "—")}</td>
                <td class="jh-mine-title">
                  <strong class="jh-mine-title-main">${S().esc(p.title || "بدون عنوان")}${
                    Number(p.pending_comments_count || 0) > 0
                      ? `<span class="jh-mine-cmt-badge">${toFaDigits(
                          p.pending_comments_count
                        )} نظر جدید</span>`
                      : ""
                  }</strong>
                  ${
                    p.review_note
                      ? `<span class="jh-mine-sub">${S().esc(p.review_note)}</span>`
                      : ""
                  }
                  ${checklist ? `<ul class="jh-guide-list jh-mine-check">${checklist}</ul>` : ""}
                  <div class="jh-mine-orders" data-order-box="${S().esc(p.id)}" hidden></div>
                </td>
                <td class="jh-mine-num">${p.quality_grade ? S().esc(p.quality_grade) : "—"}</td>
                <td class="jh-mine-num">${toFaDigits(p.downloads || p.sales_count || 0)}</td>
                <td class="jh-mine-date">${faDate(p.updated_at || p.created_at)}</td>
                <td class="jh-mine-status"><span class="${toneClass(p.status_tone)}">${S().esc(
                  p.status_label || STATUS_FA[p.status] || p.status
                )}</span></td>
                <td class="jh-mine-ops"><div class="jh-mine-ops-row">${opsHtml(p)}</div></td>
              </tr>`;
            })
            .join("");

          box.innerHTML = `
            <div class="jh-mine-toolbar">
              <a class="jh-btn" href="submit.html">ثبت جزوه جدید</a>
              <input id="mine-q" type="search" placeholder="جستجو عنوان یا کد…" value="${S().esc(
                q
              )}" />
              <select id="mine-status">
                <option value="">همه وضعیت‌ها</option>
                ${[
                  "draft",
                  "pending_review",
                  "needs_revision",
                  "in_preparation",
                  "pending_payment",
                  "ready_to_publish",
                  "published",
                  "suspended",
                  "rejected",
                ]
                  .map(
                    (s) =>
                      `<option value="${s}" ${
                        filterStatus === s ? "selected" : ""
                      }>${STATUS_FA[s] || s}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="jh-table-wrap">
              <table class="jh-table">
                <thead>
                  <tr>
                    <th>ردیف</th>
                    <th>کد محتوا</th>
                    <th>عنوان</th>
                    <th data-sort="quality_grade">امتیاز</th>
                    <th data-sort="downloads">دانلود</th>
                    <th data-sort="updated_at">تاریخ</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>${
                  rows ||
                  `<tr><td colspan="8" class="jh-meta">موردی با این فیلتر نیست</td></tr>`
                }</tbody>
              </table>
            </div>
            <section class="jh-mine-comments" id="jh-mine-comments">
              <header class="jh-mine-comments-head">
                <div>
                  <h3>نظرات جزوه‌های منتشرشده</h3>
                  <p class="jh-note">فقط خریداران می‌توانند نظر بدهند. نظرات تا تأیید تو منتشر نمی‌شوند؛ می‌توانی تأیید، رد، حذف یا به ادمین گزارش کنی.</p>
                </div>
              </header>
              <div id="jh-mine-comments-list" class="jh-mine-comments-list">
                <p class="jh-meta">در حال بارگذاری نظرات…</p>
              </div>
            </section>`;

          $("#mine-q")?.addEventListener("input", (e) => {
            q = e.target.value || "";
            renderMine();
          });
          $("#mine-status")?.addEventListener("change", (e) => {
            filterStatus = e.target.value || "";
            renderMine();
          });
          $$("[data-sort]", box).forEach((th) => {
            th.style.cursor = "pointer";
            th.addEventListener("click", () => {
              const k = th.getAttribute("data-sort");
              if (sortKey === k) sortDir = sortDir === "asc" ? "desc" : "asc";
              else {
                sortKey = k;
                sortDir = "desc";
              }
              renderMine();
            });
          });
          bindMineActions();
          loadMineComments();
        };

        const statusFaCmt = {
          pending: "در انتظار",
          approved: "تأییدشده",
          rejected: "ردشده",
        };

        const loadMineComments = async () => {
          const host = $("#jh-mine-comments-list");
          if (!host) return;
          const published = items.filter((p) => p.status === "published");
          if (!published.length) {
            host.innerHTML =
              `<p class="jh-note">هنوز جزوهٔ منتشرشده‌ای نداری؛ بعد از انتشار، نظرات خریداران اینجا می‌آید.</p>`;
            return;
          }
          host.innerHTML = `<p class="jh-meta">در حال بارگذاری نظرات…</p>`;
          const packs = await Promise.all(
            published.map(async (p) => {
              try {
                const r = await S().api(
                  `/api/site/pamphlets/mine/${encodeURIComponent(p.id)}/comments`
                );
                return { pamphlet: p, pack: r.data || {} };
              } catch (_) {
                return {
                  pamphlet: p,
                  pack: {
                    counts: { pending: 0, approved: 0, rejected: 0 },
                    comments: [],
                  },
                };
              }
            })
          );
          if (!host.isConnected) return;
          host.innerHTML = packs
            .map(({ pamphlet: p, pack }) => {
              const counts = pack.counts || {};
              const comments = pack.comments || [];
              const pending = Number(counts.pending || 0);
              const listHtml = comments.length
                ? comments
                    .map((c) => {
                      const st = c.status || "pending";
                      const reported =
                        (c.report_status || "") === "reported";
                      return `<article class="jh-mine-cmt jh-mine-cmt--${S().esc(
                        st
                      )}${reported ? " is-reported" : ""}" data-cmt-id="${S().esc(
                        c.id
                      )}">
                  <header>
                    <strong>${S().esc(c.author_name || "خریدار")}</strong>
                    <span class="jh-mine-cmt-st">${S().esc(
                      statusFaCmt[st] || st
                    )}</span>
                  </header>
                  <p dir="rtl">${S().esc(c.body || "")}</p>
                  <div class="jh-mine-cmt-actions">
                    ${
                      st === "pending"
                        ? `<button type="button" class="jh-chip jh-chip--ok" data-cmt-act="approve" data-pid="${S().esc(
                            p.id
                          )}" data-cid="${S().esc(c.id)}">تأیید</button>
                    <button type="button" class="jh-chip jh-chip--bad" data-cmt-act="reject" data-pid="${S().esc(
                      p.id
                    )}" data-cid="${S().esc(c.id)}">رد</button>`
                        : ""
                    }
                    <button type="button" class="jh-chip jh-chip--bad" data-cmt-act="delete" data-pid="${S().esc(
                      p.id
                    )}" data-cid="${S().esc(c.id)}">حذف</button>
                    ${
                      reported
                        ? `<span class="jh-meta">گزارش‌شده به ادمین</span>`
                        : `<button type="button" class="jh-chip" data-cmt-act="report" data-pid="${S().esc(
                            p.id
                          )}" data-cid="${S().esc(c.id)}">گزارش به ادمین</button>`
                    }
                  </div>
                </article>`;
                    })
                    .join("")
                : `<p class="jh-note">هنوز نظری برای این جزوه ثبت نشده.</p>`;
              return `<div class="jh-card jh-mine-cmt-card" data-mine-pid="${S().esc(
                p.id
              )}">
                <header class="jh-mine-cmt-card-head">
                  <div>
                    <strong>${S().esc(p.title || "جزوه")}</strong>
                    <p class="jh-meta">در انتظار ${toFaDigits(
                      pending
                    )} · تأیید ${toFaDigits(
                      counts.approved || 0
                    )} · رد ${toFaDigits(counts.rejected || 0)}</p>
                  </div>
                  <a class="jh-btn secondary" href="item.html?id=${S().esc(
                    p.id
                  )}">صفحهٔ جزوه</a>
                </header>
                <div class="jh-mine-cmt-list">${listHtml}</div>
              </div>`;
            })
            .join("");

          $$("[data-cmt-act]", host).forEach((btn) => {
            btn.addEventListener("click", async () => {
              const act = btn.getAttribute("data-cmt-act");
              const pid = btn.getAttribute("data-pid");
              const cid = btn.getAttribute("data-cid");
              if (!act || !pid || !cid) return;
              try {
                if (act === "report") {
                  const reason = window.prompt(
                    "دلیل گزارش این نظر به ادمین چیست؟",
                    "محتوای نامناسب یا توهین‌آمیز"
                  );
                  if (!reason || reason.trim().length < 2) return;
                  await S().api(
                    `/api/site/pamphlets/mine/${encodeURIComponent(
                      pid
                    )}/comments/${encodeURIComponent(cid)}/report`,
                    {
                      method: "POST",
                      body: JSON.stringify({ reason: reason.trim() }),
                    }
                  );
                  msg(err, "گزارش برای ادمین ثبت شد", true);
                } else if (act === "delete") {
                  if (!confirm("این نظر برای همیشه حذف شود؟")) return;
                  const card = btn.closest(".jh-mine-cmt");
                  const wasPending = card?.classList.contains(
                    "jh-mine-cmt--pending"
                  );
                  await S().api(
                    `/api/site/pamphlets/mine/${encodeURIComponent(
                      pid
                    )}/comments/${encodeURIComponent(cid)}`,
                    { method: "DELETE", body: "{}" }
                  );
                  msg(err, "نظر حذف شد", true);
                  const item = items.find((x) => String(x.id) === String(pid));
                  if (item && wasPending) {
                    item.pending_comments_count = Math.max(
                      0,
                      Number(item.pending_comments_count || 0) - 1
                    );
                  }
                } else {
                  await S().api(
                    `/api/site/pamphlets/mine/${encodeURIComponent(
                      pid
                    )}/comments/${encodeURIComponent(cid)}/${act}`,
                    { method: "POST", body: "{}" }
                  );
                  msg(
                    err,
                    act === "approve" ? "نظر تأیید و منتشر شد" : "نظر رد شد",
                    true
                  );
                  const item = items.find((x) => String(x.id) === String(pid));
                  if (item && (act === "approve" || act === "reject")) {
                    item.pending_comments_count = Math.max(
                      0,
                      Number(item.pending_comments_count || 0) - 1
                    );
                  }
                }
                await loadMineComments();
              } catch (e) {
                msg(err, e.message || "عملیات ناموفق");
              }
            });
          });
        };

        const bindMineActions = () => {
          $$("[data-del]", box).forEach((btn) =>
            btn.addEventListener("click", async () => {
              if (!confirm("این جزوه حذف شود؟")) return;
              try {
                await S().api(`/api/site/pamphlets/mine/${btn.dataset.del}`, {
                  method: "DELETE",
                  body: "{}",
                });
                msg(err, "حذف شد", true);
                setTimeout(() => location.reload(), 400);
              } catch (e) {
                msg(err, e.message || "حذف ناموفق");
              }
            })
          );
          $$("[data-publish]", box).forEach((btn) =>
            btn.addEventListener("click", async () => {
              try {
                await S().api(
                  `/api/site/pamphlets/mine/${btn.dataset.publish}/confirm-publish`,
                  { method: "POST", body: "{}" }
                );
                msg(err, "منتشر شد", true);
                setTimeout(() => location.reload(), 500);
              } catch (e) {
                msg(err, e.message || "خطا");
              }
            })
          );
          $$("[data-approve]", box).forEach((btn) =>
            btn.addEventListener("click", async () => {
              try {
                await S().api(
                  `/api/site/pamphlets/mine/${btn.dataset.approve}/approve-final`,
                  { method: "POST", body: "{}" }
                );
                msg(err, "تأیید شد", true);
                setTimeout(() => location.reload(), 500);
              } catch (e) {
                msg(err, e.message || "خطا");
              }
            })
          );
          $$("[data-orders]", box).forEach((btn) =>
            btn.addEventListener("click", async () => {
              const host = box.querySelector(
                `[data-order-box="${btn.dataset.orders}"]`
              );
              if (!host) return;
              try {
                const o = await S().api(
                  `/api/site/pamphlets/mine/${btn.dataset.orders}/service-orders`
                );
                const orders = o.data || [];
                host.hidden = false;
                host.innerHTML = orders.length
                  ? orders
                      .map(
                        (x) =>
                          `<div class="jh-mine-order-line">پیش‌فاکتور ${money(
                            x.quoted_amount_irt || x.amount_irt
                          )} · ${S().esc(x.status)}
                          ${
                            ["sent", "pending", "failed", "redirected"].includes(
                              x.status
                            )
                              ? `<button class="jh-btn" data-pay-order="${S().esc(
                                  x.id
                                )}" type="button">پرداخت</button>`
                              : ""
                          }</div>`
                      )
                      .join("")
                  : `<span class="jh-mine-sub">پیش‌فاکتوری نیست</span>`;
                $$("[data-pay-order]", host).forEach((b) =>
                  b.addEventListener("click", async () => {
                    try {
                      const pay = await S().api(
                        `/api/site/pamphlets/service-orders/${b.dataset.payOrder}/pay`,
                        {
                          method: "POST",
                          body: JSON.stringify({ environment: PAY_ENV }),
                        }
                      );
                      if (pay.data?.start_pay_url)
                        location.href = pay.data.start_pay_url;
                      else if (pay.data?.dev) location.reload();
                    } catch (e) {
                      msg(err, e.message || "خطای پرداخت");
                    }
                  })
                );
              } catch (e) {
                host.hidden = false;
                host.textContent = e.message || "خطا";
              }
            })
          );
        };

        renderMine();

        try {
          const reps = await S().api("/api/site/pamphlets/mine/reports");
          const list = reps.data || [];
          if (list.length) {
            const host = document.createElement("div");
            host.className = "jh-card jh-author-reports";
            host.innerHTML = `<h3>گزارش‌های فعال</h3>
              <p class="jh-note">برای گزارش‌های تأییدشده ۴۸ ساعت فرصت اصلاح فایل یا اعتراض داری.</p>
              <ul class="jh-report-list">${list
                .map((r) => {
                  const open =
                    r.status === "notified" ||
                    r.status === "author_fixing" ||
                    r.status === "author_appealed";
                  return `<li class="jh-report-row" data-report="${S().esc(r.id)}">
                    <strong>${S().esc(r.pamphlet_title || "جزوه")}</strong>
                    <span class="jh-meta">${S().esc(
                      r.reason_label || r.reason
                    )} · ${S().esc(r.status)}</span>
                    ${
                      r.author_deadline_at
                        ? `<span class="jh-meta">مهلت: ${S().esc(
                            String(r.author_deadline_at).slice(0, 16)
                          )}</span>`
                        : ""
                    }
                    ${
                      open
                        ? `<div class="jh-actions">
                      <label class="jh-btn secondary">اصلاح PDF
                        <input type="file" accept=".pdf,application/pdf" hidden data-fix-file="${S().esc(
                          r.id
                        )}" />
                      </label>
                      <button type="button" class="jh-btn secondary" data-appeal="${S().esc(
                        r.id
                      )}">اعتراض</button>
                    </div>`
                        : ""
                    }
                  </li>`;
                })
                .join("")}</ul>`;
            box.appendChild(host);
            $$("[data-fix-file]", host).forEach((inp) => {
              inp.addEventListener("change", async () => {
                const file = inp.files?.[0];
                if (!file || !inp.dataset.fixFile) return;
                const fd = new FormData();
                fd.append("file", file);
                fd.append("note", "اصلاح پس از گزارش");
                try {
                  await S().apiForm(
                    `/api/site/pamphlets/mine/reports/${inp.dataset.fixFile}/fix`,
                    fd
                  );
                  msg(err, "فایل اصلاح شد", true);
                  setTimeout(() => location.reload(), 600);
                } catch (e) {
                  msg(err, e.message || "آپلود ناموفق");
                }
              });
            });
            $$("[data-appeal]", host).forEach((btn) => {
              btn.addEventListener("click", async () => {
                const note = window.prompt("توضیح اعتراض (اختیاری)") || "";
                try {
                  await S().api(
                    `/api/site/pamphlets/mine/reports/${btn.dataset.appeal}/appeal`,
                    {
                      method: "POST",
                      body: JSON.stringify({ note }),
                    }
                  );
                  msg(err, "اعتراض ثبت شد", true);
                  setTimeout(() => location.reload(), 600);
                } catch (e) {
                  msg(err, e.message || "ثبت اعتراض ناموفق");
                }
              });
            });
          }
        } catch (_) {}
      }
      if (tab === "services") {
        const mine = await S().api("/api/site/pamphlets/mine/list");
        const pamphlets = mine.data || [];
        const chunks = await Promise.all(
          pamphlets.map(async (p) => {
            try {
              const res = await S().api(
                `/api/site/pamphlets/mine/${p.id}/service-orders`
              );
              return (res.data || []).map((o) => ({ ...o, pamphlet_title: p.title }));
            } catch (_) {
              return [];
            }
          })
        );
        const orders = chunks.flat();
        const box = $("#panel-services");
        const helpIntro = `
          <section class="jh-help-write">
            <header class="jh-help-write-head">
              <p class="jh-help-write-kicker">کمک جزوه‌نویسی</p>
              <h2>از ایده تا جزوهٔ قابل انتشار</h2>
              <p>اینجا برای نظم‌دادن به نوشتن، رفع ایراد داوری و در صورت نیاز گرفتن کمک تخصصی است — نه مسیر اجباری.</p>
            </header>
            <div class="jh-help-write-grid">
              <article class="jh-help-card">
                <span class="jh-help-card-num" aria-hidden="true">۱</span>
                <h3>ساختار را روشن کن</h3>
                <p>سرفصل، ترتیب فصل‌ها و هدف هر بخش را قبل از تایپ کامل بنویس تا داوری سریع‌تر جلو برود.</p>
              </article>
              <article class="jh-help-card">
                <span class="jh-help-card-num" aria-hidden="true">۲</span>
                <h3>استاندارد انتشار</h3>
                <p>فونت خوانا، صفحه‌بندی تمیز و منبع مشخص؛ جزئیات را در آموزش و راهنما و قوانین ببین.</p>
              </article>
              <article class="jh-help-card">
                <span class="jh-help-card-num" aria-hidden="true">۳</span>
                <h3>کمک تخصصی</h3>
                <p>اگر به ویرایش، تایپ یا آماده‌سازی فایل نیاز داری، از پشتیبانی پیش‌فاکتور بگیر؛ اختیاری است.</p>
              </article>
            </div>
            <div class="jh-help-write-actions">
              <a class="jh-btn" href="submit.html">شروع / ادامه نوشتن</a>
              <a class="jh-btn secondary" href="learn.html#publish-steps">آموزش و راهنما و قوانین</a>
              <a class="jh-btn secondary" href="account.html?tab=tickets">درخواست کمک از پشتیبانی</a>
            </div>
          </section>`;
        const ordersHtml = orders.length
          ? `<section class="jh-help-orders">
              <h3 class="jh-help-orders-title">سفارش‌های فعال کمک جزوه‌نویسی</h3>
              <div class="jh-help-orders-list">
              ${orders
                .map(
                  (o) => `<article class="jh-card jh-help-order-card">
              <h3>${S().esc(o.pamphlet_title || "")}</h3>
              <div class="jh-meta">${money(o.amount_irt)} · ${S().esc(
                    o.status
                  )} · ETA ${o.eta_days || "—"} روز</div>
              <p class="jh-note">${S().esc(o.quote_note || o.description || "")}</p>
              <div class="jh-actions">
                ${
                  ["sent", "pending", "failed", "redirected"].includes(o.status)
                    ? `<button class="jh-btn" data-pay-order="${S().esc(
                        o.id
                      )}" type="button">پرداخت پیش‌فاکتور</button>`
                    : ""
                }
                <a class="jh-btn secondary" href="account.html?tab=mine">پرونده جزوه</a>
              </div>
            </article>`
                )
                .join("")}
              </div>
            </section>`
          : `<p class="jh-help-empty">هنوز سفارش کمکی ثبت نشده. می‌توانی خودت بنویسی و منتشر کنی؛ کمک تخصصی فقط با پیش‌فاکتور پشتیبانی شروع می‌شود.</p>`;
        box.innerHTML = `${helpIntro}${ordersHtml}`;
        $$("[data-pay-order]", box).forEach((b) =>
          b.addEventListener("click", async () => {
            try {
              const pay = await S().api(
                `/api/site/pamphlets/service-orders/${b.dataset.payOrder}/pay`,
                {
                  method: "POST",
                  body: JSON.stringify({ environment: PAY_ENV }),
                }
              );
              if (pay.data?.start_pay_url) location.href = pay.data.start_pay_url;
              else if (pay.data?.dev) location.reload();
            } catch (e) {
              msg(err, e.message || "خطای پرداخت");
            }
          })
        );
      }
      if (tab === "wallet") {
        const res = await S().api("/api/site/pamphlets/wallet/me");
        const d = res.data || {};
        const acc = d.account || {};
        const refCode = (acc.referral_code || "").trim();
        const payouts = d.payouts || [];
        const affEarned = Number(d.affiliate_earned_irt || 0);
        const salesEarned = Number(d.earned_irt || 0);
        const incomeTotal = Math.max(
          0,
          Number(d.income_sources?.total_irt || salesEarned + affEarned) || 0
        );
        const salesPct =
          incomeTotal <= 0
            ? 100
            : Math.round((salesEarned / incomeTotal) * 100);
        const refPct = incomeTotal <= 0 ? 0 : Math.max(0, 100 - salesPct);
        const byPam = d.sales_by_pamphlet || [];
        const maxPam = Math.max(
          1,
          ...byPam.map((x) => Number(x.earned_irt || 0))
        );
        const pamBars = byPam.length
          ? byPam
              .slice(0, 8)
              .map((row) => {
                const w = Math.max(
                  4,
                  Math.round((Number(row.earned_irt || 0) / maxPam) * 100)
                );
                return `<div class="jh-wallet-bar-row">
                  <div class="jh-wallet-bar-meta">
                    <strong>${S().esc(row.title || "جزوه")}</strong>
                    <span>${money(row.earned_irt)} · ${toFaDigits(
                      row.sales_count || 0
                    )} فروش</span>
                  </div>
                  <div class="jh-wallet-bar-track" aria-hidden="true">
                    <i style="width:${w}%"></i>
                  </div>
                </div>`;
              })
              .join("")
          : `<p class="jh-note">هنوز فروشی ثبت نشده؛ بعد از فروش جزوه‌هایت اینجا می‌آید.</p>`;
        const recentRows = (d.recent_sales || []).length
          ? (d.recent_sales || [])
              .map((r) => {
                const when = String(r.verified_at || "").slice(0, 10);
                return `<li class="jh-wallet-sale-row">
                  <div>
                    <strong>${S().esc(r.pamphlet_title || "جزوه")}</strong>
                    <span class="jh-meta">${S().esc(when)}</span>
                  </div>
                  <em>+${money(r.author_share_irt)}</em>
                </li>`;
              })
              .join("")
          : `<li class="jh-note">فروش اخیری نیست.</li>`;
        const payoutRows = payouts.length
          ? payouts
              .map((p) => {
                const st = PAYOUT_STATUS_FA[p.status] || p.status;
                const when = String(p.created_at || "").slice(0, 10);
                let receipt = String(p.receipt_url || "").trim();
                if (receipt.startsWith("/")) {
                  receipt = `${S().API_BASE || ""}${receipt}`;
                }
                const receiptHtml = receipt
                  ? `<a class="jh-payout-receipt" href="${S().esc(
                      receipt
                    )}" target="_blank" rel="noopener noreferrer">
                      <img src="${S().esc(
                        receipt
                      )}" alt="فیش واریز" loading="lazy" />
                      <span>مشاهده فیش واریز</span>
                    </a>`
                  : "";
                return `<li class="jh-wallet-payout-row">
                  <div>
                    <strong>${money(p.amount_irt)}</strong>
                    <span class="jh-wallet-payout-status jh-wallet-payout-status--${S().esc(
                      p.status || "pending"
                    )}">${S().esc(st)}</span>
                    ${receiptHtml}
                  </div>
                  <span class="jh-meta">${S().esc(when)}</span>
                </li>`;
              })
              .join("")
          : `<li class="jh-note">هنوز درخواست تسویه‌ای ثبت نشده.</li>`;
        const topups = unitTopups(d);
        const packs = unitPacks(d);
        $("#panel-wallet").innerHTML = `
          <div class="jh-card jh-finance-hero">
            <p class="jh-wallet-kicker">پنل مالی</p>
            <h3>موجودی قابل خرید</h3>
            <a class="jh-finance-buy-link" href="account.html?tab=shop" aria-label="برو به فروشگاه جزوه‌ها">
              <p class="jh-finance-buy-bal" data-wallet-units-line>
                <strong data-wallet-units>${toFaDigits(d.wallet_units || 0)}</strong>
                <span>واحد</span>
                <em class="jh-finance-buy-irt" data-wallet-units-irt>${money(
                  purchasableValueIrt(d)
                )}</em>
              </p>
              <span class="jh-finance-buy-go">برو به فروشگاه ←</span>
            </a>
            <p class="jh-note">فقط برای خرید جزوه · تسویه شبا و نقد کردن ندارد</p>
            <div class="jh-actions jh-finance-hero-actions">
              <a class="jh-btn" href="account.html?tab=shop">خرید جزوه از فروشگاه</a>
              <button type="button" class="jh-btn secondary" id="btn-wallet-buy-open">انتقال از درآمد</button>
            </div>
          </div>
          <div class="jh-card jh-finance-charge" id="jh-unit-packages">
            <header class="jh-finance-sec-head">
              <div>
                <h3>شارژ حساب</h3>
                <p class="jh-note">مبلغ را انتخاب کن یا پکیج اشتراک بگیر — با زرین‌پال.</p>
              </div>
            </header>
            <h4 class="jh-finance-sub">شارژ سریع</h4>
            <div class="jh-topup-grid">${topups.map(topupChipHtml).join("")}</div>
            <h4 class="jh-finance-sub">پکیج اشتراک</h4>
            <div class="jh-pack-grid">${packs.map(packCardHtml).join("")}</div>
          </div>
          <div class="jh-card jh-wallet-card jh-finance-settle">
            <p class="jh-wallet-kicker">درآمد نویسنده</p>
            <h3>موجودی قابل تسویه</h3>
            <p class="jh-wallet-balance jh-money-settle" data-wallet-balance>${money(
              d.wallet_balance_irt
            )}</p>
            <div class="jh-wallet-stats" role="list">
              <div class="jh-wallet-stat" role="listitem">
                <span class="jh-wallet-stat-label">فروش</span>
                <strong class="jh-wallet-stat-value">${toFaDigits(
                  d.sales_count || 0
                )}</strong>
              </div>
              <div class="jh-wallet-stat jh-wallet-stat--earn" role="listitem">
                <span class="jh-wallet-stat-label">درآمد فروش کلی</span>
                <strong class="jh-wallet-stat-value jh-money-earned-lg">${money(
                  salesEarned
                )}</strong>
              </div>
              <div class="jh-wallet-stat" role="listitem">
                <span class="jh-wallet-stat-label">درآمد از راه سفید بودن</span>
                <strong class="jh-wallet-stat-value jh-money-earned">${money(
                  affEarned
                )}</strong>
              </div>
              <div class="jh-wallet-stat" role="listitem">
                <span class="jh-wallet-stat-label">حداقل درآمد قابل تسویه</span>
                <strong class="jh-wallet-stat-value">${money(
                  d.min_payout_irt || 500000
                )}</strong>
              </div>
            </div>
            <p class="jh-note jh-wallet-share-note">از هر فروش: ${toFaDigits(
              d.author_share_pct || 40
            )}٪ نویسنده · ${toFaDigits(40)}٪ سایت · ${toFaDigits(
              d.ambassador_share_pct || d.affiliate_share_pct || 10
            )}٪ سفیر · ${toFaDigits(
              d.prize_fund_pct || 10
            )}٪ هدیه/جوایز.</p>
            <p class="jh-note jh-wallet-sla">${S().esc(
              d.payout_sla_fa ||
                "واریز به شبا معمولاً بین ۱ تا ۳ روز کاری انجام می‌شود."
            )}</p>
          </div>
          <div class="jh-card jh-wallet-chart-card">
            <header class="jh-income-head">
              <div>
                <p class="jh-wallet-kicker">تحلیل</p>
                <h3>منبع درآمد</h3>
              </div>
              <span class="jh-income-total-chip" dir="ltr">${money(
                salesEarned + affEarned
              )}</span>
            </header>
            <p class="jh-note">سهم فروش جزوه در برابر درآمد از راه سفید بودن.</p>
            <div class="jh-income-viz">
              <div class="jh-wallet-donut" style="--sales:${salesPct};--ref:${refPct}" role="img" aria-label="نمودار دایره‌ای منبع درآمد">
                <div class="jh-wallet-donut-glow" aria-hidden="true"></div>
                <div class="jh-wallet-donut-ring" aria-hidden="true"></div>
                <div class="jh-wallet-donut-center">
                  <strong>${money(salesEarned + affEarned)}</strong>
                  <span>کل درآمد</span>
                </div>
              </div>
              <ul class="jh-wallet-legend jh-wallet-legend--cards">
                <li class="jh-income-leg jh-income-leg--sales">
                  <div class="jh-income-leg-top">
                    <i class="jh-dot jh-dot--sales" aria-hidden="true"></i>
                    <span>درآمد فروش کلی</span>
                    <em>${toFaDigits(salesPct)}٪</em>
                  </div>
                  <strong>${money(salesEarned)}</strong>
                  <div class="jh-income-meter" aria-hidden="true"><i style="width:${salesPct}%"></i></div>
                </li>
                <li class="jh-income-leg jh-income-leg--ref">
                  <div class="jh-income-leg-top">
                    <i class="jh-dot jh-dot--ref" aria-hidden="true"></i>
                    <span>درآمد از راه سفید بودن</span>
                    <em>${toFaDigits(refPct)}٪</em>
                  </div>
                  <strong>${money(affEarned)}</strong>
                  <div class="jh-income-meter" aria-hidden="true"><i style="width:${refPct}%"></i></div>
                </li>
              </ul>
            </div>
          </div>
          <div class="jh-card jh-wallet-bars-card">
            <h3>درآمد به تفکیک جزوه</h3>
            <div class="jh-wallet-bars">${pamBars}</div>
          </div>
          <div class="jh-card">
            <h3>فروش‌های اخیر</h3>
            <ul class="jh-wallet-sale-list">${recentRows}</ul>
          </div>
          ${
            refCode
              ? `<div class="jh-card jh-wallet-referral">
            <h3>کد معرف شما</h3>
            <p class="jh-note">این کد را به نویسنده‌های جدید بده؛ از فروش جزوه‌هایشان سهم رابط می‌گیری.</p>
            <div class="jh-wallet-ref-row">
              <code class="jh-wallet-ref-code" id="jh-ref-code" dir="ltr">${S().esc(
                refCode
              )}</code>
              <button type="button" class="jh-btn secondary" id="btn-copy-ref">کپی</button>
            </div>
          </div>`
              : ""
          }
          <div class="jh-card jh-wallet-payout-form${
            Number(d.wallet_balance_irt || 0) <
            Number(d.min_payout_irt || 500000)
              ? " is-gated"
              : ""
          }">
            <header class="jh-payout-head">
              <div>
                <h3>درخواست تسویه</h3>
                <p class="jh-note">موجودی قابل تسویه: <strong>${money(
                  d.wallet_balance_irt
                )}</strong></p>
              </div>
            </header>
            ${
              Number(d.wallet_balance_irt || 0) <
              Number(d.min_payout_irt || 500000)
                ? (() => {
                    const minNeed = Number(d.min_payout_irt || 500000);
                    const balNow = Math.max(
                      0,
                      Number(d.wallet_balance_irt || 0)
                    );
                    const pctGate = Math.min(
                      100,
                      Math.round((balNow / Math.max(1, minNeed)) * 100)
                    );
                    const remain = Math.max(0, minNeed - balNow);
                    return `<div class="jh-payout-gate" role="status">
              <div class="jh-payout-gate-icon" aria-hidden="true"></div>
              <strong>هنوز به حداقل درآمد قابل تسویه نرسیدی</strong>
              <p>برای باز شدن فرم شبا و کد ملی، موجودی قابل تسویه باید حداقل <b>${money(
                minNeed
              )}</b> باشد. الان <b>${money(remain)}</b> مانده.</p>
              <div class="jh-payout-gate-meter" aria-hidden="true">
                <i style="width:${pctGate}%"></i>
              </div>
              <span class="jh-payout-gate-meta">${toFaDigits(
                pctGate
              )}٪ تا آستانه · ${money(balNow)} از ${money(minNeed)}</span>
            </div>`;
                  })()
                : `${
                    acc.iban || acc.national_id
                      ? `<button type="button" class="jh-payout-saved" data-iban="${S().esc(
                          acc.iban || ""
                        )}" data-nid="${S().esc(acc.national_id || "")}">
              <span class="jh-payout-saved-kicker">حساب ذخیره‌شده</span>
              <strong dir="ltr">${S().esc(
                formatIbanDigits(normalizeIban(acc.iban || "")) ||
                  "شبا ثبت‌شده"
              )}</strong>
              <span>${
                acc.national_id
                  ? `کد ملی ${toFaDigits(onlyDigits(acc.national_id))}`
                  : "کد ملی ذخیره‌شده نیست"
              }</span>
            </button>`
                      : ""
                  }
            <div class="jh-form jh-payout-fields jh-payout-fields--compact">
              <label class="jh-payout-amount-label">مبلغ (تومان)
                <div class="jh-payout-amount-row">
                  <input id="payout_amount" class="jh-input-ltr-right" type="text" inputmode="numeric"
                    autocomplete="off" dir="ltr" placeholder="${toFaDigits(
                      (d.min_payout_irt || 500000).toLocaleString("en-US")
                    )}" />
                  <button type="button" class="jh-chip" id="btn-payout-max">حداکثر برداشت</button>
                </div>
                <span class="jh-amount-words is-muted" id="payout_amount_words">مبلغ را وارد کن</span>
                <span class="jh-field-hint" id="payout_amount_hint" hidden></span>
              </label>
              <label>شبا
                <div class="jh-iban-field" dir="ltr">
                  <span class="jh-iban-prefix" aria-hidden="true">IR</span>
                  <input id="iban_digits" type="text" inputmode="numeric"
                    autocomplete="off" spellcheck="false"
                    placeholder="12 0540 1026 8002 1234 5678 90"
                    maxlength="34" />
                </div>
                <div class="jh-iban-bank" id="iban_bank" hidden></div>
                <span class="jh-field-hint" id="iban_hint">۲۴ رقم شبا را بدون IR وارد یا بچسبان</span>
              </label>
              <label>کد ملی
                <div class="jh-nid-wrap" id="jh-nid-wrap">
                  <input id="national_id" class="jh-input-ltr-right" type="text" dir="ltr" inputmode="numeric"
                    autocomplete="off" maxlength="10"
                    placeholder="۰۰۱۲۳۴۵۶۷۸" />
                  <span class="jh-nid-check" aria-hidden="true">✓</span>
                </div>
                <span class="jh-field-hint" id="nid_hint">۱۰ رقم، صفر ابتدایی حفظ می‌شود</span>
              </label>
              <p class="jh-payout-warn">شماره شبا باید متعلق به همان کد ملی باشد؛ در غیر این صورت پایا/ساتنا برگشت می‌خورد.</p>
              <button class="jh-btn is-locked" type="button" id="btn-payout" disabled>ثبت درخواست تسویه</button>
            </div>`
            }
          </div>
          <div class="jh-card jh-wallet-closeout">
            <h3>تسویه نهایی هنگام بستن حساب</h3>
            <p class="jh-note">اگر حسابت را می‌بندی و موجودی کمتر از حداقل درآمد قابل تسویه است، می‌توانی کل موجودی را پس از کسر کارمزد بانکی (${money(
              d.payout_bank_fee_irt || 5000
            )}) درخواست کنی.</p>
            <label class="jh-check">
              <input type="checkbox" id="closeout_confirm" />
              <span>تأیید می‌کنم این درخواست برای بستن حساب و تسویه نهایی است</span>
            </label>
            <button class="jh-btn secondary" type="button" id="btn-closeout" ${
              Number(d.wallet_balance_irt || 0) > 0 ? "" : "disabled"
            }>ثبت تسویه نهایی</button>
          </div>
          <div class="jh-card jh-wallet-payouts">
            <h3>وضعیت درخواست‌ها</h3>
            <ul class="jh-wallet-payout-list">${payoutRows}</ul>
          </div>`;
        paintWalletChip(d);
        bindPurchaseBalanceOpener(
          $("#btn-wallet-buy-open"),
          d,
          syncOverviewPurchaseCards
        );
        if (new URLSearchParams(location.search).get("buy") === "1") {
          openPurchaseBalanceSheet(d, syncOverviewPurchaseCards);
        }
        $$("#panel-wallet [data-unit-sku]").forEach((btn) => {
          btn.addEventListener("click", () =>
            payUnitSku(btn.getAttribute("data-unit-sku"), btn, err)
          );
        });
        $("#btn-copy-ref")?.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(refCode);
            msg(err, "کد معرف کپی شد", true);
          } catch (_) {
            msg(err, "کپی نشد؛ دستی کپی کن");
          }
        });
        $("#btn-closeout")?.addEventListener("click", async () => {
          if (!$("#closeout_confirm")?.checked) {
            return msg(err, "ابتدا تأیید بستن حساب را بزن");
          }
          try {
            await S().api("/api/site/pamphlets/wallet/payout-closeout", {
              method: "POST",
              body: JSON.stringify({
                confirm: true,
                iban: ($("#iban_digits")?.value || "").trim()
                  ? `IR${onlyDigits($("#iban_digits").value)}`
                  : acc.iban || "",
                national_id: ($("#national_id")?.value || "").trim() || acc.national_id || "",
              }),
            });
            msg(err, "درخواست تسویه نهایی ثبت شد", true);
            location.reload();
          } catch (e) {
            msg(err, e.message || "ثبت ناموفق");
          }
        });
        if (
          Number(d.wallet_balance_irt || 0) >=
          Number(d.min_payout_irt || 500000)
        ) {
          bindPayoutForm({
            balance: d.wallet_balance_irt,
            minPayout: d.min_payout_irt || 500000,
            savedIban: acc.iban || "",
            savedNationalId: acc.national_id || "",
            errEl: err,
          });
        }
      }
      if (tab === "certs") {
        const res = await S().api("/api/site/pamphlets/certificates/me");
        $("#panel-certs").innerHTML = (res.data || [])
          .map(
            (c) => `<article class="jh-card">
            <h3>${S().esc(c.title)}</h3>
            <div class="jh-meta">سریال ${S().esc(c.serial_number)} · ${S().esc(
              (c.issued_at || "").slice(0, 10)
            )}</div>
            <div class="jh-actions"><a class="jh-btn secondary" href="verify.html?serial=${S().esc(
              c.serial_number
            )}">استعلام</a></div>
          </article>`
          )
          .join("") || '<p class="jh-note">گواهی‌ای نیست (پس از انتشار صادر می‌شود).</p>';
      }
      if (tab === "tickets") {
        const res = await S().api("/api/site/pamphlets/tickets");
        $("#panel-tickets").innerHTML =
          (res.data || [])
            .map(
              (t) => `<article class="jh-card">
            <h3>${S().esc(t.title)}</h3>
            <div class="jh-meta">${S().esc(t.category_label)} · ${S().esc(
                t.status
              )}</div>
          </article>`
            )
            .join("") +
          `<div class="jh-form" style="margin-top:1rem">
            <label>عنوان <input id="t_title" /></label>
            <label>دسته
              <select id="t_cat">
                <option value="review">بررسی و انتشار</option>
                <option value="services">کمک جزوه‌نویسی</option>
                <option value="purchase">خرید</option>
                <option value="payout">تسویه</option>
                <option value="rights">مالکیت</option>
              </select>
            </label>
            <label>پیام <textarea id="t_body"></textarea></label>
            <button class="jh-btn" type="button" id="btn-ticket">ثبت تیکت</button>
          </div>`;
        $("#btn-ticket")?.addEventListener("click", async () => {
          try {
            await S().api("/api/site/pamphlets/tickets", {
              method: "POST",
              body: JSON.stringify({
                title: ($("#t_title")?.value || "").trim(),
                body: ($("#t_body")?.value || "").trim(),
                category: $("#t_cat")?.value || "general",
              }),
            });
            location.reload();
          } catch (e) {
            msg(err, e.message || "خطا");
          }
        });
      }
      if (tab === "profile") {
        const box = $("#panel-profile");
        const majors = ["علوم آزمایشگاهی", "رادیولوژی", "رادیوتراپی"];
        const majorOpts = majors
          .map(
            (m) =>
              `<option value="${S().esc(m)}" ${
                me.field_of_study === m ? "selected" : ""
              }>${S().esc(m)}</option>`
          )
          .join("");
        box.innerHTML = `
          <div class="jh-card">
            <h3>پروفایل کاربری</h3>
            <p class="jh-note">این اطلاعات برای انتشار جزوه و تسویه استفاده می‌شود.</p>
            <div class="jh-form" style="margin-top:1rem">
              <div class="jh-profile-phone-locked" aria-label="شماره موبایل قفل‌شده">
                <span class="jh-ref-label">موبایل</span>
                <strong dir="ltr" id="pf_phone">${S().esc(
                  toFaDigitChars(me.phone || "") || "—"
                )}</strong>
                <em>شماره بعد از ثبت‌نام قابل ویرایش نیست</em>
              </div>
              <label>نام <input id="pf_first" value="${S().esc(
                me.first_name || ""
              )}" /></label>
              <label>نام خانوادگی <input id="pf_last" value="${S().esc(
                me.last_name || ""
              )}" /></label>
              <label>دانشگاه
                <input id="pf_uni" value="${S().esc(
                  me.university || "دانشگاه علوم پزشکی شهید بهشتی"
                )}" readonly />
              </label>
              <label>رشته
                <select id="pf_major">
                  <option value="">انتخاب…</option>
                  ${majorOpts}
                </select>
              </label>
              ${
                me.has_referrer
                  ? `<div class="jh-ref-ambassador">
                      <span class="jh-ref-label">سفیر بلوک شما</span>
                      <strong>${S().esc(
                        me.referrer_name ||
                          me.referrer?.full_name ||
                          "سفیر ثبت‌شده"
                      )}</strong>
                      <p class="jh-note">کد معرف قبلاً ثبت شده و تا یک سال روی حساب می‌ماند؛ قابل تغییر نیست.</p>
                    </div>`
                  : `<label>کد معرف رابط <span class="jh-optional">(اختیاری، یک‌بار)</span>
                <input id="pf_referral" dir="ltr" autocomplete="off" placeholder="کد معرف" value="${S().esc(
                  storedReferralCode()
                )}" />
              </label>`
              }
              <button class="jh-btn" type="button" id="btn-save-profile">ذخیره مشخصات</button>
            </div>
          </div>
          <div class="jh-card jh-overview-ref" id="jh-profile-ref" style="margin-top:1rem">
            <header class="jh-overview-ref-head">
              <div>
                <p class="jh-wallet-kicker">دعوت دوستان</p>
                <h3>کد و لینک ثبت‌نام رفرالی من</h3>
              </div>
            </header>
            ${referralInviteHtml(me.referral_code || "")}
          </div>
          <div class="jh-card" style="margin-top:1rem">
            <h3>${me.has_password ? "تغییر رمز" : "تنظیم رمز ورود"}</h3>
            <p class="jh-note">با رمز، مرورگر/گوگل می‌تواند ورود را ذخیره کند و هر بار پیامک لازم نیست.</p>
            <div class="jh-form" style="margin-top:1rem">
              <label>رمز جدید
                <input id="pf_pass" type="password" dir="ltr" autocomplete="new-password" />
              </label>
              <label>تکرار رمز
                <input id="pf_pass2" type="password" dir="ltr" autocomplete="new-password" />
              </label>
              <button class="jh-btn" type="button" id="btn-save-pass">ذخیره رمز</button>
            </div>
          </div>
          <div class="jh-actions" style="margin-top:1rem">
            <button class="jh-btn secondary" type="button" id="btn-logout-profile">خروج از این حساب</button>
          </div>`;
        bindReferralInvite($("#jh-profile-ref"), me.referral_code || "", err);
        $("#btn-save-profile")?.addEventListener("click", async () => {
          try {
            const refVal = ($("#pf_referral")?.value || "").trim();
            const saved = await S().api("/api/site/auth/complete-profile", {
              method: "POST",
              body: JSON.stringify({
                first_name: ($("#pf_first")?.value || "").trim(),
                last_name: ($("#pf_last")?.value || "").trim(),
                university:
                  ($("#pf_uni")?.value || "").trim() ||
                  "دانشگاه علوم پزشکی شهید بهشتی",
                field_of_study: ($("#pf_major")?.value || "").trim(),
                referral_code: refVal || storedReferralCode(),
              }),
            });
            if (saved.data?.has_referrer) clearStoredReferral();
            msg(err, "ذخیره شد", true);
            setTimeout(() => location.reload(), 500);
          } catch (e) {
            msg(err, e.message || "خطا");
          }
        });
        $("#btn-save-pass")?.addEventListener("click", async () => {
          try {
            const p1 = $("#pf_pass")?.value || "";
            const p2 = $("#pf_pass2")?.value || "";
            if (p1.length < 8) return msg(err, "رمز باید حداقل ۸ کاراکتر باشد");
            if (p1 !== p2) return msg(err, "تکرار رمز یکسان نیست");
            await S().api("/api/site/auth/set-password", {
              method: "POST",
              body: JSON.stringify({ password: p1 }),
            });
            msg(err, "رمز ذخیره شد", true);
          } catch (e) {
            msg(err, e.message || "خطا");
          }
        });
        $("#btn-logout-profile")?.addEventListener("click", async () => {
          const token = S().getSiteSession();
          try {
            await S().api("/api/site/auth/logout", {
              method: "POST",
              body: "{}",
            });
          } catch (_) {}
          if (token) S().removeFromVault?.(token);
          S().setSiteSession("");
          invalidateSessionCache();
          go("login.html");
        });
      }
    } catch (e) {
      msg(err, e.message || "خطا");
    }
  }

  async function initRead() {
    injectChrome("account");
    const id = new URLSearchParams(location.search).get("id");
    const err = $("#jh-err");
    const bar = $("#jh-read-bar");
    const back = $("#jh-read-back");
    const dlBtn = $("#jh-read-dl");
    const meta = $("#jh-read-meta");
    const boot = $("#jh-reader-boot");
    const pagesHost = $("#jh-reader-pages");
    const zoomLab = $("#jh-read-zoom-lab");
    const me = await ensureSession();
    if (!me)
      return (location.href = `login.html?next=${encodeURIComponent(
        `read.html?id=${id}`
      )}`);
    if (!id) {
      msg(err, "شناسه جزوه نامعتبر است");
      return;
    }
    if (back) back.href = `item.html?id=${encodeURIComponent(id)}`;
    if (bar) bar.hidden = false;

    let pdfDoc = null;
    let zoom = 1;
    let renderToken = 0;
    let cachedBytes = null;

    const setBoot = (title, note) => {
      if (!boot) return;
      boot.hidden = false;
      if (pagesHost) pagesHost.hidden = true;
      boot.innerHTML = `<span class="jh-reader-spin" aria-hidden="true"></span>
        <strong>${S().esc(title)}</strong>
        ${note ? `<p>${S().esc(note)}</p>` : ""}`;
    };
    const setMeta = (text) => {
      if (meta) meta.textContent = text;
    };
    const setZoomLab = () => {
      if (zoomLab) zoomLab.textContent = `${toFaDigits(Math.round(zoom * 100))}٪`;
    };

    const downloadWatermarked = async () => {
      try {
        if (dlBtn) {
          dlBtn.disabled = true;
          dlBtn.textContent = "در حال آماده‌سازی…";
        }
        const blob =
          cachedBytes != null
            ? new Blob([cachedBytes], { type: "application/pdf" })
            : await S().fetchPdfBlob(
                `/api/site/pamphlets/item/${encodeURIComponent(id)}/download`
              );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "bolok-pamphlet.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        msg(err, "دانلود شروع شد", true);
      } catch (e) {
        msg(err, e.message || "دانلود ناموفق");
      } finally {
        if (dlBtn) {
          dlBtn.disabled = false;
          dlBtn.textContent = "دانلود PDF";
        }
      }
    };
    dlBtn?.addEventListener("click", downloadWatermarked);

    const renderPages = async () => {
      if (!pdfDoc || !pagesHost) return;
      const token = ++renderToken;
      const total = pdfDoc.numPages || 0;
      setMeta(`${toFaDigits(total)} صفحه · زوم ${toFaDigits(Math.round(zoom * 100))}٪`);
      setZoomLab();
      pagesHost.hidden = false;
      if (boot) boot.hidden = true;
      pagesHost.innerHTML = "";

      const shellW = Math.max(
        280,
        ($("#jh-reader-shell")?.clientWidth || window.innerWidth) - 32
      );

      for (let n = 1; n <= total; n++) {
        if (token !== renderToken) return;
        const page = await pdfDoc.getPage(n);
        if (token !== renderToken) return;
        const base = page.getViewport({ scale: 1 });
        const fit = Math.min(2.6, (shellW * zoom) / base.width);
        const vp = page.getViewport({ scale: fit });
        const wrap = document.createElement("article");
        wrap.className = "jh-reader-page";
        wrap.dataset.page = String(n);
        const label = document.createElement("span");
        label.className = "jh-reader-page-no";
        label.textContent = `صفحه ${toFaDigits(n)}`;
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        wrap.appendChild(label);
        wrap.appendChild(canvas);
        pagesHost.appendChild(wrap);
        await page.render({
          canvasContext: canvas.getContext("2d", { alpha: false }),
          viewport: vp,
        }).promise;
        if (n === 1) setMeta(`${toFaDigits(total)} صفحه`);
      }
    };

    $("#jh-read-zoom-in")?.addEventListener("click", () => {
      zoom = Math.min(2.4, Math.round((zoom + 0.15) * 100) / 100);
      renderPages();
    });
    $("#jh-read-zoom-out")?.addEventListener("click", () => {
      zoom = Math.max(0.55, Math.round((zoom - 0.15) * 100) / 100);
      renderPages();
    });

    try {
      setBoot("در حال بارگذاری جزوه…", "نسخهٔ واترمارک‌شده برای مطالعه آنلاین");
      setMeta("دریافت فایل…");
      let bytes;
      try {
        bytes = S().fetchPdfBytes
          ? await S().fetchPdfBytes(
              `/api/site/pamphlets/item/${encodeURIComponent(id)}/read`
            )
          : await (await S().fetchPdfBlob(
              `/api/site/pamphlets/item/${encodeURIComponent(id)}/read`
            )).arrayBuffer();
      } catch (readErr) {
        // Fallback to download endpoint (same watermarked bytes)
        setBoot("تلاش مجدد…", "در حال آماده‌سازی از مسیر دانلود");
        bytes = S().fetchPdfBytes
          ? await S().fetchPdfBytes(
              `/api/site/pamphlets/item/${encodeURIComponent(id)}/download`
            )
          : await (await S().fetchPdfBlob(
              `/api/site/pamphlets/item/${encodeURIComponent(id)}/download`
            )).arrayBuffer();
        if (!bytes) throw readErr;
      }
      cachedBytes = bytes;
      setBoot("در حال رسم صفحات…", "چند لحظه صبر کن");
      const lib = await loadPdfJs();
      pdfDoc = await lib.getDocument(pdfDocumentOpts(bytes)).promise;
      await renderPages();
      msg(err, "آمادهٔ مطالعه", true);
      setTimeout(() => {
        if (err) err.hidden = true;
      }, 1200);
    } catch (e) {
      const text = e.message || "دسترسی ندارید";
      msg(err, text);
      if (boot) {
        boot.hidden = false;
        boot.innerHTML = `<strong>نمایش آنلاین ممکن نشد</strong>
          <p>${S().esc(text)}</p>`;
      }
      if (pagesHost) pagesHost.hidden = true;
      if (/تهیه|خرید|دسترسی|403|Unauthorized|Forbidden/i.test(text)) {
        setTimeout(() => {
          location.href = `item.html?id=${encodeURIComponent(id)}`;
        }, 1600);
        return;
      }
    }
  }

  async function initVerify() {
    injectChrome("guide");
    const err = $("#jh-err");
    const box = $("#jh-verify");
    const run = async (s) => {
      if (!s) return;
      try {
        const res = await S().api(
          `/api/site/pamphlets/certificates/verify/${encodeURIComponent(s)}`
        );
        if (!res.valid) return msg(err, res.message || "نامعتبر");
        const d = res.data;
        box.innerHTML = `<div class="jh-card"><h3>${S().esc(
          d.title_label
        )}</h3>
          <div class="jh-meta">سریال: ${S().esc(d.serial_number)}<br/>اثر: ${S().esc(
          d.pamphlet_title
        )}<br/>پدیدآورنده: ${S().esc(d.author_name)}<br/>دانشگاه (اظهاری): ${S().esc(
          d.university
        )}</div>
          <p class="jh-note">${S().esc(d.note)}</p></div>`;
        msg(err, "گواهی معتبر است", true);
      } catch (e) {
        msg(err, e.message || "خطا");
      }
    };
    const serial = new URLSearchParams(location.search).get("serial");
    if (serial) {
      $("#serial").value = serial;
      run(serial);
    }
    $("#btn-verify")?.addEventListener("click", () =>
      run(($("#serial")?.value || "").trim())
    );
  }

  async function initPayment() {
    injectChrome("account");
    const q = new URLSearchParams(location.search);
    let kind = q.get("kind") || "";
    let pamphlet = q.get("pamphlet") || "";
    const authority =
      (q.get("Authority") || q.get("authority") || "").trim();
    const zpStatus = (q.get("Status") || q.get("status") || "OK").trim();
    let ok = q.get("ok") === "1";

    // بازگشت مستقیم زرین‌پال روی bolokapp.ir → تأیید سمت API
    if (authority && !q.has("ok")) {
      $("#jh-pay").innerHTML = `
        <article class="jh-pay-result">
          <p class="jh-pay-result-eyebrow">در حال تأیید پرداخت…</p>
          <h1 class="jh-pay-result-title">لطفاً صبر کن</h1>
          <p class="jh-pay-result-sub">نتیجه را از زرین‌پال می‌گیریم.</p>
        </article>`;
      const confirmPath =
        kind === "units"
          ? "/api/site/pamphlets/payments/units/confirm"
          : kind === "service"
            ? "/api/site/pamphlets/payments/service/confirm"
            : "/api/site/pamphlets/payments/purchase/confirm";
      if (!kind) kind = "purchase";
      try {
        const res = await S().api(confirmPath, {
          method: "POST",
          body: JSON.stringify({ authority, status: zpStatus }),
        });
        ok = !!res?.ok;
        if (res?.data?.pamphlet_id) pamphlet = String(res.data.pamphlet_id);
        const next = new URL(location.href);
        next.searchParams.delete("Authority");
        next.searchParams.delete("authority");
        next.searchParams.delete("Status");
        next.searchParams.delete("status");
        next.searchParams.set("ok", ok ? "1" : "0");
        next.searchParams.set("kind", kind || "purchase");
        if (pamphlet) next.searchParams.set("pamphlet", pamphlet);
        history.replaceState({}, "", next.toString());
      } catch (e) {
        ok = false;
        $("#jh-pay").innerHTML = `
          <article class="jh-pay-result jh-pay-result--err">
            <p class="jh-pay-result-eyebrow">نتیجه پرداخت</p>
            <h1 class="jh-pay-result-title">تأیید ناموفق بود</h1>
            <p class="jh-pay-result-sub">${S().esc(
              e.message || "اگر مبلغ کم شده، چند دقیقه دیگر وضعیت را چک کن."
            )}</p>
            <div class="jh-pay-result-actions">
              <a class="jh-btn jh-pay-result-cta" href="account.html">بازگشت به حساب</a>
            </div>
          </article>`;
        return;
      }
    }

    const isService = kind === "service";
    const isUnits = kind === "units";
    const continueHref =
      ok && kind === "purchase" && pamphlet
        ? `read.html?id=${encodeURIComponent(pamphlet)}`
        : ok && isUnits
          ? "account.html?tab=wallet"
          : ok
            ? "account.html?tab=mine"
            : "account.html";
    const title = ok
      ? isService
        ? "پرداخت خدمات موفق بود"
        : isUnits
          ? "شارژ واحد موفق بود"
          : "خرید با موفقیت انجام شد"
      : isService
        ? "پرداخت خدمات انجام نشد"
        : isUnits
          ? "شارژ واحد انجام نشد"
          : "خرید انجام نشد";
    const sub = ok
      ? isService
        ? "مبلغ پیش‌فاکتور تأیید شد. می‌توانی پروندهٔ جزوه را در حسابت دنبال کنی."
        : isUnits
          ? "واحدها به کیف پولت اضافه شد. می‌توانی جزوه بخری یا موجودی را در بالای صفحه ببینی."
          : "جزوه به کتابخانهٔ تو اضافه شد. همین حالا مطالعه یا دانلود کن."
      : "اگر مبلغی از حسابت کم شده، تا چند دقیقه دیگر وضعیت را دوباره چک کن یا با پشتیبانی در تماس باش.";
    const cta = ok
      ? kind === "purchase" && pamphlet
        ? "شروع مطالعه"
        : isUnits
          ? "رفتن به کیف پول"
          : "رفتن به حساب من"
      : "بازگشت به حساب";
    if (ok && isUnits) {
      try {
        const w = await S().api("/api/site/pamphlets/wallet/me");
        paintWalletChip(w?.data || null);
      } catch (_) {}
    }
    $("#jh-pay").innerHTML = `
      <article class="jh-pay-result ${ok ? "jh-pay-result--ok" : "jh-pay-result--err"}">
        <div class="jh-pay-result-glow" aria-hidden="true"></div>
        <div class="jh-pay-result-icon" aria-hidden="true">
          <span class="jh-pay-result-mark">${ok ? "✓" : "!"}</span>
        </div>
        <p class="jh-pay-result-eyebrow">${ok ? "پرداخت تأیید شد" : "نتیجه پرداخت"}</p>
        <h1 class="jh-pay-result-title">${S().esc(title)}</h1>
        <p class="jh-pay-result-sub">${S().esc(sub)}</p>
        <div class="jh-pay-result-actions">
          <a class="jh-btn jh-pay-result-cta" href="${S().esc(continueHref)}">${S().esc(cta)}</a>
          ${
            ok && kind === "purchase" && pamphlet
              ? `<a class="jh-btn secondary" href="item.html?id=${encodeURIComponent(
                  pamphlet
                )}">صفحه جزوه</a>`
              : `<a class="jh-btn secondary" href="index.html">فروشگاه</a>`
          }
        </div>
      </article>`;
  }

  async function waitForSite(ms = 4000) {
    const start = Date.now();
    while (!window.BolokSite && Date.now() - start < ms) {
      await new Promise((r) => setTimeout(r, 40));
    }
    return !!window.BolokSite;
  }

  async function bootPage(fn) {
    await waitForSite();
    return fn();
  }

  captureReferralFromUrl();

  const page = document.body?.dataset?.jhPage || "";
  const map = {
    login: initLogin,
    index: initIndex,
    item: initItem,
    guide: initGuide,
    learn: initLearn,
    submit: initSubmit,
    account: initAccount,
    read: initRead,
    verify: initVerify,
    payment: initPayment,
  };
  if (map[page]) {
    const run = () => bootPage(map[page]);
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", run);
    else run();
  }
})();
