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
    in_preparation: "در حال آماده‌سازی",
    awaiting_author_approval: "تأیید نسخه نهایی",
    ready_to_publish: "آماده انتشار",
    published: "منتشرشده",
    suspended: "معلق",
    stopped: "متوقف",
  };

  function msg(el, text, ok = false) {
    if (!el) return;
    const kind = ok ? "ok" : "err";
    const mark = ok ? "✓" : "!";
    el.className = `jh-msg ${kind}`;
    el.innerHTML = `<span class="jh-msg-mark" aria-hidden="true">${mark}</span><span class="jh-msg-text">${S().esc(
      text || ""
    )}</span>`;
    el.hidden = false;
    el.setAttribute("role", "status");
  }

  function money(n) {
    return Number(n || 0).toLocaleString("fa-IR") + " تومان";
  }

  let _pdfjsLoading = null;
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

  async function mountPreviewFlipper(host, pamphletId, fallbackHtml) {
    if (!host || !pamphletId) return;
    const maxPages = 4;
    host.innerHTML = `
      <div class="jh-flip" data-flip>
        <div class="jh-flip-stage">
          <canvas class="jh-flip-canvas" hidden></canvas>
          <div class="jh-flip-fallback">${fallbackHtml || ""}</div>
          <div class="jh-flip-loading">
            <span class="jh-flip-spinner" aria-hidden="true"></span>
            <strong>در حال آماده‌سازی پیش‌نمایش</strong>
            <span>صفحات ۱ تا ۴ فایل آپلودشده</span>
          </div>
          <div class="jh-flip-error" hidden>
            <strong>پیش‌نمایش فعلاً در دسترس نیست</strong>
            <button type="button" class="jh-btn secondary" data-flip-retry>تلاش دوباره</button>
          </div>
        </div>
        <div class="jh-flip-bar">
          <button type="button" class="jh-flip-btn" data-flip-prev aria-label="صفحه قبل">‹</button>
          <div class="jh-flip-meta">
            <span class="jh-flip-hint">پیش‌نمایش رایگان · صفحه <b data-flip-cur>۱</b> از <b data-flip-max>۴</b></span>
            <div class="jh-flip-dots" data-flip-dots aria-hidden="true"></div>
          </div>
          <button type="button" class="jh-flip-btn" data-flip-next aria-label="صفحه بعد">›</button>
        </div>
      </div>`;
    const canvas = host.querySelector(".jh-flip-canvas");
    const fallback = host.querySelector(".jh-flip-fallback");
    const loading = host.querySelector(".jh-flip-loading");
    const errBox = host.querySelector(".jh-flip-error");
    const curEl = host.querySelector("[data-flip-cur]");
    const maxEl = host.querySelector("[data-flip-max]");
    const dotsEl = host.querySelector("[data-flip-dots]");
    const prevBtn = host.querySelector("[data-flip-prev]");
    const nextBtn = host.querySelector("[data-flip-next]");
    const retryBtn = host.querySelector("[data-flip-retry]");
    let pdf = null;
    let pageNo = 1;
    let total = maxPages;
    let busy = false;

    const paintDots = () => {
      if (!dotsEl) return;
      dotsEl.innerHTML = Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        return `<button type="button" class="jh-flip-dot${
          n === pageNo ? " on" : ""
        }" data-flip-goto="${n}" aria-label="صفحه ${toFaDigits(n)}"></button>`;
      }).join("");
      dotsEl.querySelectorAll("[data-flip-goto]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const n = Number(btn.getAttribute("data-flip-goto") || 0);
          if (n >= 1 && n <= total) renderPage(n);
        });
      });
    };

    const setUi = () => {
      if (curEl) curEl.textContent = toFaDigits(pageNo);
      if (maxEl) maxEl.textContent = toFaDigits(total);
      if (prevBtn) prevBtn.disabled = !pdf || pageNo <= 1 || busy;
      if (nextBtn) nextBtn.disabled = !pdf || pageNo >= total || busy;
      paintDots();
    };

    const showState = (mode) => {
      if (loading) loading.hidden = mode !== "loading";
      if (errBox) errBox.hidden = mode !== "error";
      if (fallback) fallback.hidden = mode !== "fallback" && mode !== "error";
      if (canvas) canvas.hidden = mode !== "ready";
    };

    const renderPage = async (n) => {
      if (!pdf || !canvas || busy) return;
      busy = true;
      setUi();
      try {
        const page = await pdf.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const stage = host.querySelector(".jh-flip-stage");
        const wrapW = Math.max(
          240,
          (stage?.clientWidth || host.clientWidth || 280) - 16
        );
        const wrapH = Math.max(280, (stage?.clientHeight || 360) - 16);
        const scale = Math.min(2.6, wrapW / base.width, wrapH / base.height);
        const vp = page.getViewport({ scale: Math.max(0.8, scale) });
        const ctx = canvas.getContext("2d", { alpha: false });
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        pageNo = n;
        showState("ready");
      } catch (_) {
        showState(pdf ? "ready" : "fallback");
      } finally {
        busy = false;
        setUi();
      }
    };

    const loadPreview = async () => {
      showState("loading");
      pdf = null;
      pageNo = 1;
      total = maxPages;
      setUi();
      try {
        const lib = await loadPdfJs();
        const path = `/api/site/pamphlets/item/${encodeURIComponent(
          pamphletId
        )}/preview`;
        let buf;
        if (typeof S().fetchPdfBlob === "function") {
          const blob = await S().fetchPdfBlob(path);
          buf = await blob.arrayBuffer();
        } else {
          const url = `${S().API_BASE}${path}`;
          const res = await fetch(url, {
            headers: { Accept: "application/pdf" },
            mode: "cors",
            credentials: "omit",
          });
          if (!res.ok) throw new Error(`preview_${res.status}`);
          buf = await res.arrayBuffer();
        }
        if (!buf || buf.byteLength < 8) throw new Error("empty");
        pdf = await lib.getDocument({ data: buf }).promise;
        total = Math.min(maxPages, Math.max(1, pdf.numPages || 1));
        setUi();
        await renderPage(1);
      } catch (_) {
        pdf = null;
        showState("error");
        setUi();
      }
    };

    prevBtn?.addEventListener("click", () => {
      if (pageNo > 1) renderPage(pageNo - 1);
    });
    nextBtn?.addEventListener("click", () => {
      if (pageNo < total) renderPage(pageNo + 1);
    });
    retryBtn?.addEventListener("click", () => loadPreview());

    host.tabIndex = 0;
    host.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" && pageNo < total) {
        e.preventDefault();
        renderPage(pageNo + 1);
      }
      if (e.key === "ArrowRight" && pageNo > 1) {
        e.preventDefault();
        renderPage(pageNo - 1);
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
        // RTL: swipe right → previous page visually feels natural as next content on left
        if (dx > 0 && pageNo > 1) renderPage(pageNo - 1);
        if (dx < 0 && pageNo < total) renderPage(pageNo + 1);
      },
      { passive: true }
    );

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
        <nav class="jh-top-nav" aria-label="جزوات">
          <a href="index.html" data-nav="index">فروشگاه</a>
          <a href="learn.html" data-nav="learn">آموزش</a>
          <a href="guide.html" data-nav="guide">راهنمای انتشار</a>
          <a href="submit.html" data-nav="submit">انتشار جزوه</a>
          <a class="jh-account-chip" href="login.html" data-nav="login" data-jh-account aria-busy="true">…</a>
        </nav>
      </div>
      <nav class="jh-mobile-nav" aria-label="موبایل">
        <a href="index.html">فروشگاه</a>
        <a href="learn.html">آموزش</a>
        <a href="guide.html">راهنما</a>
        <a href="submit.html">انتشار</a>
        <a href="login.html" data-jh-account aria-busy="true">…</a>
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
    refreshAccountChip();
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

  async function refreshAccountChip() {
    const chips = $$("[data-jh-account]");
    if (!chips.length) return;
    chips.forEach((el) => {
      el.setAttribute("aria-busy", "true");
      el.style.pointerEvents = "none";
    });
    let me = null;
    try {
      me = await ensureSession();
    } catch (_) {
      me = null;
    }
    chips.forEach((el) => {
      el.removeAttribute("aria-busy");
      el.style.pointerEvents = "";
      if (me) {
        const name =
          `${me.first_name || ""} ${me.last_name || ""}`.trim() || "حساب من";
        el.textContent = name;
        el.href = "account.html?tab=overview";
        el.classList.add("is-on");
        if (el.hasAttribute("data-nav")) el.setAttribute("data-nav", "account");
      } else {
        el.textContent = "ورود";
        el.href = "login.html";
        el.classList.remove("is-on");
      }
    });
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

  function revealBoot(boot, ui, text) {
    if (boot) {
      boot.classList.remove("jh-boot--success");
      if (text) boot.textContent = text;
      boot.hidden = false;
    }
    if (ui) ui.hidden = true;
  }

  function revealUi(boot, ui) {
    if (boot) {
      boot.classList.remove("jh-boot--success");
      boot.hidden = true;
    }
    if (ui) ui.hidden = false;
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

  function renderVault(host, { onPick } = {}) {
    if (!host) return;
    const vault = S().listVault?.() || [];
    if (!vault.length) {
      host.hidden = true;
      host.innerHTML = "";
      return;
    }
    host.hidden = false;
    host.innerHTML =
      `<p class="jh-auth-step">حساب‌های ذخیره‌شده</p>` +
      vault
        .map(
          (v) => `<button type="button" class="jh-vault-item" data-token="${S().esc(
            v.token
          )}">
          <strong>${S().esc(v.label || v.phone)}</strong>
          <span dir="ltr">${S().esc(v.phone || "")}</span>
        </button>`
        )
        .join("");
    host.querySelectorAll("[data-token]").forEach((btn) => {
      btn.addEventListener("click", () => onPick?.(btn.dataset.token));
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
      const pdf = await lib.getDocument({ data: buf }).promise;
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

  function cardHtml(p) {
    const kind = p.content_kind === "handwritten" ? "دست‌نویس" : "تایپی";
    const major = p.major || p.field_of_study || "پیراپزشکی";
    const author = (p.authors_text || "").trim() || "نویسنده";
    const pages = toFaDigits(p.pages_count || "—");
    const free = Number(p.price_irt || 0) <= 0;
    const price = free
      ? '<span class="jh-badge free">رایگان</span>'
      : `<span class="jh-badge">${money(p.price_irt)}</span>`;
    const cta = free ? "دریافت" : "مشاهده";
    return `<article class="jh-card jh-card-tall span-4">
      <a class="jh-tall-media" href="item.html?id=${S().esc(p.id)}">
        ${pamphletCoverInner(p)}
        <span class="jh-tall-avatar" aria-hidden="true">${S().esc(
          authorInitial(author)
        )}</span>
        <span class="jh-pages-badge">${pages} صفحه</span>
      </a>
      <div class="jh-tall-body">
        <h3><a class="title-link" href="item.html?id=${S().esc(p.id)}">${S().esc(
      p.title
    )}</a></h3>
        <p class="jh-meta">${S().esc(major)} · ${kind}</p>
        <div class="jh-product-foot">
          ${price}
          <a class="jh-card-cta" href="item.html?id=${S().esc(p.id)}">${cta}</a>
        </div>
      </div>
    </article>`;
  }

  function similarHtml(p) {
    const pages = toFaDigits(p.pages_count || "—");
    const date = (p.published_at || p.updated_at || "").slice(0, 10) || "—";
    const author = (p.authors_text || "").trim() || "نویسنده";
    return `<a class="jh-similar-item" href="item.html?id=${S().esc(p.id)}">
      <div class="jh-similar-thumb">${pamphletCoverInner(p)}
        <span class="jh-tall-avatar jh-tall-avatar--sm" aria-hidden="true">${S().esc(
          authorInitial(author)
        )}</span>
      </div>
      <div class="jh-similar-text">
        <strong>${S().esc(p.title || "جزوه")}</strong>
        <span class="jh-similar-meta">
          <em>${pages} صفحه</em>
          <span>${S().esc(date)}</span>
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
          const saved = await S().api("/api/site/auth/complete-profile", {
            method: "POST",
            body: JSON.stringify({
              first_name: first,
              last_name: last,
              university:
                ($("#profile_uni")?.value || "").trim() ||
                "دانشگاه علوم پزشکی شهید بهشتی",
              field_of_study: major,
            }),
          });
          invalidateSessionCache();
          showLoginSuccess(boot, ui, saved.data || {}, dest());
        } catch (e) {
          msg(err, e.message || "خطا");
        }
      });
    };

    const openProfileStep = (data) => {
      revealUi(boot, ui);
      showStep("step-profile");
      bindProfileStep();
      if ($("#profile_first") && data?.first_name)
        $("#profile_first").value = data.first_name;
      if ($("#profile_last") && data?.last_name)
        $("#profile_last").value = data.last_name;
      if ($("#profile_uni") && data?.university)
        $("#profile_uni").value = data.university;
      if ($("#profile_major") && data?.field_of_study)
        $("#profile_major").value = data.field_of_study;
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
      if (res.needs_password) {
        revealUi(boot, ui);
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

  async function initIndex() {
    injectChrome("index");
    const list = $("#jh-list");
    const err = $("#jh-err");
    const metaEl = $("#jh-results-meta");
    const qInput = $("#filter-q");
    const params0 = new URLSearchParams(location.search);
    const urlMajor = (params0.get("major") || "").trim();
    const urlQ = (params0.get("q") || "").trim();
    const urlKind = (params0.get("kind") || "").trim();
    const urlPriced = (params0.get("priced") || "").trim();
    let loadSeq = 0;
    let debounceTimer = 0;

    try {
      const meta = await S().api("/api/site/pamphlets/meta");
      const majorSel = $("#filter-major");
      (meta.data?.taxonomy?.majors || []).forEach((m) => {
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
              <a class="jh-btn secondary" href="guide.html">راهنمای انتشار</a>
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
      load({ immediate: true });
    }

    $("#btn-filter")?.addEventListener("click", () => load({ immediate: true }));
    $("#btn-clear-filters")?.addEventListener("click", clearFilters);
    qInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        window.clearTimeout(debounceTimer);
        load({ immediate: true });
      }
    });
    qInput?.addEventListener("input", scheduleLoad);
    qInput?.addEventListener("search", () => load({ immediate: true }));
    ["filter-major", "filter-kind", "filter-priced"].forEach((id) => {
      $(`#${id}`)?.addEventListener("change", () => load({ immediate: true }));
    });
    await load({ immediate: true });
  }

  function formatBytesFa(n) {
    const v = Number(n) || 0;
    if (v < 1024) return `${toFaDigits(v)} بایت`;
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
      const priceNum = Number(p.price_irt || 0);
      const priceLabel = priceNum <= 0 ? "رایگان" : money(priceNum);
      const owned = !!(p.purchase || p.is_author);
      const authorName =
        (p.authors_text || "").trim() || "نویسنده جزوه‌سرا";
      const initial = authorInitial(authorName);
      const kindFa = p.content_kind === "handwritten" ? "دست‌نویس" : "تایپی";
      const covFa = p.coverage === "full" ? "پوشش کامل" : "بخشی از درس";
      const topics = Array.isArray(p.topics) ? p.topics : [];
      const tags = [p.faculty || "پیراپزشکی", p.major, p.course_name, kindFa]
        .filter(Boolean)
        .map((t) => `<span class="jh-tag">${S().esc(t)}</span>`)
        .join("");
      const sizeFa = formatBytesFa(p.file_size_bytes || 0);
      const pagesFa = toFaDigits(p.pages_count || "—");
      const viewsFa = toFaDigits(p.downloads || p.sales_count || 0);
      const updatedFa =
        (p.updated_at || p.published_at || "").slice(0, 10) || "—";
      const comments = commentsRes.data || [];
      const majorQ = encodeURIComponent(p.major || p.field_of_study || "");
      const courseQ = encodeURIComponent(p.course_name || "");

      const relatedPromise = S()
        .api(
          `/api/site/pamphlets?major=${majorQ}&course=${courseQ}&limit=12`
        )
        .catch(() => ({ data: [] }));

      const fallbackCover = `<div class="jh-hero-fallback">
            <span>${S().esc(p.major || "پیراپزشکی")}</span>
            <strong>${S().esc(p.course_name || "جزوه")}</strong>
            <span>${S().esc(kindFa)}</span>
          </div>`;

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

        <div class="jh-item-layout">
          <div class="jh-item-main">
            <div class="jh-hero-preview" id="jh-hero-preview">
              ${fallbackCover}
              <span class="jh-page-pill">${pagesFa} صفحه</span>
            </div>

            <h1 class="jh-item-title">${S().esc(p.title)}</h1>

            <div class="jh-item-toolbar">
              <div class="jh-author-row">
                <span class="jh-avatar" aria-hidden="true">${S().esc(
                  initial
                )}</span>
                <strong>${S().esc(authorName)}</strong>
              </div>
              <div class="jh-item-tools">
                <span class="jh-tool" title="بازدید / دریافت">${viewsFa}</span>
                <button type="button" class="jh-tool" id="btn-share" title="اشتراک">↗</button>
                <button type="button" class="jh-tool jh-tool--warn" id="btn-report" title="گزارش">!</button>
              </div>
            </div>

            <div class="jh-item-detail">
              <div class="jh-item-detail-copy">
                <div class="jh-tabs" role="tablist">
                  <button type="button" class="jh-tab on" data-ptab="desc">توضیحات</button>
                  <button type="button" class="jh-tab" data-ptab="topics">مباحث</button>
                </div>
                <div class="jh-ptab on" data-ptab-panel="desc">
                  <div class="jh-budget">${S().esc(covFa)} · ${S().esc(
        p.degree_level || "مقطع—"
      )} · استاد ${S().esc(p.professor_name || "—")}</div>
                  <p class="jh-note">${S().esc(p.summary || "بدون توضیح")}</p>
                  <p class="jh-note"><strong>خارج از پوشش:</strong> ${S().esc(
                    p.out_of_scope_text || "—"
                  )}</p>
                  <p class="jh-note jh-note--soft">${S().esc(
                    metaRes.data?.health_disclaimer || ""
                  )}</p>
                  <div class="jh-tags">${tags}</div>
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
              </div>
              <aside class="jh-product-cover">
                <div class="jh-book-3d" aria-hidden="true">
                  <span>${S().esc((p.course_name || "جزوه").slice(0, 18))}</span>
                  <em>${S().esc(kindFa)}</em>
                </div>
                <p class="jh-meta">تاریخ به‌روزرسانی ${S().esc(updatedFa)}</p>
              </aside>
            </div>

            ${
              !me && !owned
                ? `<div class="jh-login-hint">برای دریافت جزوه وارد حساب خود شوید.
                    <a href="login.html?next=${encodeURIComponent(
                      `item.html?id=${id}`
                    )}">ورود</a></div>`
                : ""
            }
          </div>

          <aside class="jh-similar" id="jh-similar">
            <header class="jh-similar-head">
              <strong>موارد مشابه</strong>
            </header>
            <div class="jh-similar-list" id="jh-similar-list">
              <p class="jh-meta">در حال بارگذاری…</p>
            </div>
          </aside>
        </div>

        <section class="jh-comments" id="jh-comments">
          <header>
            <strong>نظرات کاربران</strong>
            <span id="jh-comments-count">${toFaDigits(comments.length)} نظر</span>
          </header>
          <div class="jh-comment-compose">
            <input id="jh-comment-input" type="text" maxlength="500"
              placeholder="…اولین نفر نظرتو بنویس" ${me ? "" : "disabled"} />
            <button type="button" class="jh-comment-send" id="jh-comment-send" ${
              me ? "" : "disabled"
            } aria-label="ارسال">➤</button>
          </div>
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
        const pill = heroHost.querySelector(".jh-page-pill");
        await mountPreviewFlipper(heroHost, id, fallbackCover);
        if (pill) heroHost.appendChild(pill);
      }

      const renderComments = (list) => {
        const host = $("#jh-comments-list");
        const count = $("#jh-comments-count");
        if (count) count.textContent = `${toFaDigits(list.length)} نظر`;
        if (!host) return;
        host.innerHTML = list.length
          ? list
              .map(
                (c) => `<article class="jh-comment">
              <strong>${S().esc(c.author_name || "کاربر")}</strong>
              <p>${S().esc(c.body || "")}</p>
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
        const btn = $("#btn-dl") || $("#btn-buy");
        if (!btn) return;
        btn.disabled = !!busy;
        btn.classList.toggle("is-busy", !!busy);
        const lab = btn.querySelector(".jh-dl-label");
        if (lab && label) lab.textContent = label;
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
          msg(err, "دانلود شروع شد", true);
        } catch (e) {
          msg(err, e.message || "دانلود ناموفق");
        } finally {
          setCtaBusy(false, "دانلود PDF");
        }
      };
      const doBuy = async () => {
        const sess = await ensureSession();
        if (!sess)
          return (location.href = `login.html?next=${encodeURIComponent(
            `item.html?id=${id}`
          )}`);
        setCtaBusy(true, priceNum <= 0 ? "در حال دریافت…" : "انتقال به پرداخت…");
        try {
          const pay = await S().api(
            `/api/site/pamphlets/item/${encodeURIComponent(id)}/purchase`,
            { method: "POST", body: JSON.stringify({ environment: "live" }) }
          );
          if (pay.data?.already_owned || pay.data?.free) {
            setCtaBusy(false, "دانلود PDF");
            buy.innerHTML = `
              <button type="button" class="jh-dl-cta" id="btn-dl">
                <span class="jh-dl-price">${S().esc(priceLabel)}</span>
                <span class="jh-dl-label">دانلود PDF</span>
                <span class="jh-dl-file"><span class="jh-dl-file-ico">PDF</span><span>${S().esc(
                  sizeFa
                )}</span></span>
              </button>
              <a class="jh-dock-read" href="read.html?id=${S().esc(
                id
              )}">مطالعه</a>`;
            $("#btn-dl")?.addEventListener("click", doDownload);
            await doDownload();
            return;
          }
          if (pay.data?.start_pay_url)
            return (location.href = pay.data.start_pay_url);
          msg(err, "پاسخ درگاه نامعتبر");
        } catch (e) {
          msg(err, e.message || "خطای خرید");
        } finally {
          const stillBuy = $("#btn-buy");
          if (stillBuy) {
            setCtaBusy(
              false,
              priceNum <= 0 ? "دریافت رایگان" : "دانلود PDF"
            );
          }
        }
      };

      if (owned) {
        buy.innerHTML = `
          <button type="button" class="jh-dl-cta" id="btn-dl">
            <span class="jh-dl-price">${S().esc(priceLabel)}</span>
            <span class="jh-dl-label">دانلود PDF</span>
            <span class="jh-dl-file"><span class="jh-dl-file-ico">PDF</span><span>${S().esc(
              sizeFa
            )}</span></span>
          </button>
          <a class="jh-dock-read" href="read.html?id=${S().esc(
            id
          )}">مطالعه</a>`;
        $("#btn-dl")?.addEventListener("click", doDownload);
      } else {
        buy.innerHTML = `
          <button type="button" class="jh-dl-cta" id="btn-buy">
            <span class="jh-dl-price">${S().esc(priceLabel)}</span>
            <span class="jh-dl-label">${
              priceNum <= 0 ? "دریافت رایگان" : "دانلود PDF"
            }</span>
            <span class="jh-dl-file"><span class="jh-dl-file-ico">PDF</span><span>${S().esc(
              sizeFa
            )}</span></span>
          </button>`;
        $("#btn-buy")?.addEventListener("click", doBuy);
      }

      $("#btn-share")?.addEventListener("click", async () => {
        const shareUrl = location.href;
        try {
          if (navigator.share) {
            await navigator.share({ title: p.title || "جزوه", url: shareUrl });
            return;
          }
        } catch (_) {
          /* fall through */
        }
        try {
          await navigator.clipboard.writeText(shareUrl);
          msg(err, "لینک کپی شد", true);
        } catch (_) {
          prompt("لینک را کپی کنید:", shareUrl);
        }
      });

      $("#btn-report")?.addEventListener("click", async () => {
        if (!(await ensureSession())) return (location.href = "login.html");
        const reason = prompt("دلیل گزارش:");
        if (!reason) return;
        try {
          await S().api(
            `/api/site/pamphlets/item/${encodeURIComponent(id)}/report`,
            { method: "POST", body: JSON.stringify({ reason, details: "" }) }
          );
          msg(err, "گزارش ثبت شد", true);
        } catch (e) {
          msg(err, e.message || "خطا");
        }
      });

      const postComment = async () => {
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
          msg(err, "نظر ثبت شد", true);
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
      const related = (relatedRes.data || []).filter(
        (x) => String(x.id) !== String(id)
      );
      const similarHost = $("#jh-similar-list");
      if (similarHost) {
        similarHost.innerHTML = related.length
          ? related.slice(0, 8).map(similarHtml).join("")
          : `<p class="jh-meta">جزوه مشابهی پیدا نشد.</p>`;
        if (related.length) hydrateCardCovers(similarHost);
      }
      if (related.length) {
        const rail = $("#jh-rail");
        const track = $("#jh-rail-track");
        if (rail && track) {
          rail.hidden = false;
          track.innerHTML = related.map(cardHtml).join("");
          hydrateCardCovers(track);
          $$("[data-rail]").forEach((btn) =>
            btn.addEventListener("click", () => {
              const dir = btn.getAttribute("data-rail") === "next" ? 1 : -1;
              track.scrollBy({ left: dir * -280, behavior: "smooth" });
            })
          );
        }
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
      const learn = meta.data?.taxonomy?.learn_curriculum || {};
      const types = meta.data?.taxonomy?.content_type_table || [];
      const toc = (learn.toc || [])
        .map(
          (t) =>
            `<li><a href="#${S().esc(t.id)}">${S().esc(t.label)}</a></li>`
        )
        .join("");
      // Only ship images that exist under guide/learn/ (skip stale API paths like mathtype/visio).
      const LEARN_FIGS = new Set([
        "guide/learn/word-page-size.webp",
        "guide/learn/word-margins.webp",
        "guide/learn/word-line-spacing.webp",
        "guide/learn/word-table.webp",
        "guide/learn/word-save-pdf.webp",
        "guide/learn/nitro-delete-page.webp",
        "guide/learn/nitro-watermark.webp",
        "guide/learn/nitro-header.webp",
        "guide/learn/nitro-edit-text.webp",
      ]);
      const fig = (block) => {
        if (!block.image || !LEARN_FIGS.has(block.image)) return "";
        return `<figure class="jh-learn-fig">
          <img src="${S().esc(block.image)}" alt="${S().esc(
          block.image_alt || ""
        )}" loading="lazy"
            onerror="this.closest('figure').classList.add('is-missing'); this.remove();" />
          <figcaption>${S().esc(
            block.image_alt || "اسکرین آموزشی — پس از آپلود تصویر نمایش داده می‌شود"
          )}</figcaption>
        </figure>`;
      };
      const sections = (learn.sections || [])
        .map((sec) => {
          const blocks = (sec.blocks || [])
            .map((b) => {
              const steps = (b.steps || [])
                .map((s, i) => `<li>${toFaDigits(i + 1)}. ${S().esc(s)}</li>`)
                .join("");
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
              return `<div class="jh-learn-block">
                ${b.heading ? `<h3>${S().esc(b.heading)}</h3>` : ""}
                ${b.body ? `<p class="jh-note">${S().esc(b.body)}</p>` : ""}
                ${steps ? `<ol class="jh-guide-list">${steps}</ol>` : ""}
                ${table}
                ${fig(b)}
              </div>`;
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
          <h1>${S().esc(learn.title || "آموزش")}</h1>
          <p class="jh-note">${S().esc(learn.intro || "")}</p>
        </header>
        <aside class="jh-learn-toc">
          <strong>آنچه در این بخش خواهید خواند</strong>
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
    } catch (e) {
      msg(err, e.message || "خطا");
    }
  }

  async function initGuide() {
    injectChrome("guide");
    const box = $("#jh-guide");
    try {
      const meta = await S().api("/api/site/pamphlets/meta");
      const tax = meta.data?.taxonomy || {};
      const g = tax.guide || {};
      const rules = tax.publish_rules || {};
      const flow = tax.publish_flow || [];
      const tips = tax.standards_tips || [];
      const types = tax.content_type_table || [];
      const ruleBlocks = Object.values(rules)
        .map(
          (r) => `<div class="jh-rules-block">
            <h3>${S().esc(r.title || "")}</h3>
            <ul class="jh-guide-list">${(r.items || [])
              .map((x) => `<li>${S().esc(x)}</li>`)
              .join("")}</ul>
          </div>`
        )
        .join("");
      box.innerHTML = `
        <header class="jh-shop-head">
          <h1>راهنمای انتشار جزوه</h1>
          <p class="jh-note">پایلوت دانشکده پیراپزشکی دانشگاه علوم پزشکی شهید بهشتی — برای دانشجوهایی که می‌خواهند جزوهٔ خودشان را تمیز، قانونی و قابل‌فروش منتشر کنند.</p>
          <div class="jh-actions">
            <a class="jh-btn" href="submit.html">ثبت جزوه جدید</a>
            <a class="jh-btn secondary" href="guide/template-typed.rtf" download>قالب Word</a>
            <a class="jh-btn secondary" href="guide/sample-outline.pdf" download>نمونه ساختار</a>
            <a class="jh-btn secondary" href="learn.html">آموزش صفحه‌آرایی</a>
          </div>
        </header>
        <section class="jh-guide-section">
          <h2>قبل از شروع</h2>
          <p class="jh-note">${S().esc(meta.data?.publish_policy || "")}</p>
          <p class="jh-note">این صفحه خلاصهٔ همان چیزهایی است که داور هنگام بررسی می‌بیند. اگر از همین‌جا شروع کنی، احتمال برگشت فایل برای اصلاح کمتر می‌شود.</p>
        </section>

        <section class="jh-guide-section">
          <h2>از ثبت تا انتشار</h2>
          <p class="jh-note">مسیر معمول انتشار این‌طور پیش می‌رود:</p>
          <ol class="jh-guide-list">${flow
            .map((x) => `<li>${S().esc(x)}</li>`)
            .join("")}</ol>
        </section>

        <section class="jh-guide-section">
          <h2>چه چیزهایی باعث تأیید یا رد می‌شود؟</h2>
          <p class="jh-note">این‌ها معیارهای اصلی داوری‌اند. همه را یک‌بار بخوان؛ بعد فایل را بفرست.</p>
          ${ruleBlocks}
        </section>

        <section class="jh-guide-section">
          <h2>چطور جزوهٔ استاندارد بسازی؟</h2>
          <p class="jh-note">این نکات برای کیفیت علمی و تجربهٔ مطالعهٔ دانشجوست؛ فقط ظاهر فایل کافی نیست.</p>
          <ul class="jh-guide-list">${tips
            .map((x) => `<li>${S().esc(x)}</li>`)
            .join("")}</ul>
          <div class="jh-grid" style="margin-top:1rem">
            <article class="jh-card span-6">
              <h3>چک‌لیست جزوه تایپی</h3>
              <ul class="jh-guide-list">${(g.typed || [])
                .map((x) => `<li>${S().esc(x)}</li>`)
                .join("")}</ul>
            </article>
            <article class="jh-card span-6">
              <h3>چک‌لیست دست‌نویس / اسکن</h3>
              <ul class="jh-guide-list">${(g.handwritten || [])
                .map((x) => `<li>${S().esc(x)}</li>`)
                .join("")}</ul>
            </article>
          </div>
        </section>

        <section class="jh-guide-section">
          <h2>انواع محتوایی که می‌توانی ثبت کنی</h2>
          <table class="jh-type-table">
            <thead><tr><th>نوع</th><th>توضیح</th></tr></thead>
            <tbody>
              ${types
                .map(
                  (r) =>
                    `<tr><td><strong>${S().esc(
                      r.title || ""
                    )}</strong></td><td>${S().esc(r.desc || "")}</td></tr>`
                )
                .join("")}
            </tbody>
          </table>
        </section>

        <section class="jh-guide-section">
          <h2>نکات مهم حوزه سلامت و خدمات آماده‌سازی</h2>
          <div class="jh-rules-block">
            <h3>مسئولیت محتوای آموزشی</h3>
            <p class="jh-note">${S().esc(meta.data?.health_disclaimer || "")}</p>
            <h3>خدمات آماده‌سازی</h3>
            <p class="jh-note">${S().esc(meta.data?.service_scope || "")}</p>
          </div>
        </section>`;
    } catch (e) {
      msg($("#jh-err"), e.message || "خطا");
    }
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
    const meta = await S().api("/api/site/pamphlets/meta");
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
    const priceDisplay = $("#price_irt_display");
    const priceBlock = $("#jh-price-block");
    const priceNote = $("#jh-price-note");
    const syncPriceUi = () => {
      const free = !!freeToggle?.checked;
      priceBlock?.classList.toggle("is-free", free);
      if (priceDisplay) priceDisplay.disabled = free;
      if (free) {
        if (priceHidden) priceHidden.value = "0";
        if (priceDisplay) {
          priceDisplay.value = "";
          priceDisplay.placeholder = "رایگان";
        }
        if (priceNote)
          priceNote.textContent = "این جزوه بدون پرداخت در اختیار خریدار قرار می‌گیرد.";
      } else if (priceDisplay && priceHidden) {
        priceDisplay.placeholder = "مثلاً ۱۵٬۰۰۰";
        const current = Number(priceHidden.value || 0);
        priceDisplay.value = current > 0 ? formatFaMoney(current) : "";
        if (priceNote)
          priceNote.textContent = "مبلغی که برای خرید این جزوه در نظر داری، به تومان بنویس.";
      }
    };
    freeToggle?.addEventListener("change", () => {
      syncPriceUi();
      if (!freeToggle.checked) priceDisplay?.focus();
    });
    priceDisplay?.addEventListener("input", () => {
      const n = fromFaDigits(priceDisplay.value) || "0";
      if (priceHidden) priceHidden.value = String(Number(n) || 0);
      priceDisplay.value = formatFaMoney(priceHidden?.value || 0);
    });
    syncPriceUi();

    const refreshSuggest = () => {
      const host = $("#jh-suggest");
      if (!host) return;
      const kind = $("#content_kind")?.value || "typed";
      const cov = $("#coverage")?.value || "partial";
      const course = $("#course_name")?.value || "";
      const major = $("#major")?.value || "";
      syncTermYearField();
      const term = $("#term_year")?.value || "";
      const kindFa = kind === "typed" ? "تایپی" : "دست‌نویس";
      const covFa = cov === "full" ? "کامل" : "بخشی";
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
    let uploaded = { pdf: null, docx: null, answer: null };

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
        content_kind: ($("#content_kind")?.value || "typed").trim(),
        coverage: ($("#coverage")?.value || "partial").trim(),
        difficulty: ($("#difficulty")?.value || "medium").trim(),
        topics: topicLines,
        wants_services: false,
        price_irt: Number($("#price_irt")?.value || 0),
        access_mode: "downloadable",
        author_rights_accepted: !!$("#rights")?.checked,
        health_disclaimer_accepted: !!$("#health")?.checked,
      };
    };

    const saveMeta = async () => {
      const body = collect();
      if (!body.major) throw new Error("رشته را انتخاب کن");
      if (!body.course_name) throw new Error("درس را انتخاب کن");
      if (body.outline_text.length < 15)
        throw new Error("توضیح کوتاه محتویات فایل را بنویس (حداقل ۱۵ کاراکتر)");
      if (!body.title && step >= 2) throw new Error("عنوان را وارد کن");
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

    const showPdfPreview = async (file, canvas, wrap) => {
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
        const pdf = await lib.getDocument({ data }).promise;
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
      const fallback = ui.preview?.querySelector(".jh-doc-fallback");
      if (ui.canvas) ui.canvas.hidden = !isPdf;
      if (fallback) fallback.hidden = isPdf;
      if (ui.preview) {
        if (isPdf) {
          ui.preview.classList.remove("jh-page-preview--doc");
          showPdfPreview(file, ui.canvas, ui.preview);
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
        btn.addEventListener("click", () => input.click());
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
    [pdfUi, docxUi, answerUi].forEach(wireSlot);

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
        if (ui._token === token) msg(err, e.message || "آپلود ناموفق");
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
      fd.append("file_role", role);
      ui._halt = false;
      ui._shown = 0;
      ui._target = 4;
      ui.slot?.classList.remove("is-done", "is-err");
      ui.slot?.classList.add("is-uploading");
      if (ui.progress) ui.progress.hidden = false;
      if (ui.state) ui.state.textContent = "در حال آپلود…";
      paintPct(ui, 0);
      ui._target = 4;
      runMeter(ui);
      try {
        await S().apiFormProgress(
          `/api/site/pamphlets/mine/${currentId}/upload`,
          fd,
          {
            onProgress: ({ percent }) => {
              ui._target = Math.min(92, Math.max(ui._target || 0, percent));
            },
          }
        );
        ui._target = 100;
        await untilFull(ui);
        if (token != null && ui._token !== token) return null;
        ui.slot?.classList.remove("is-uploading");
        ui.slot?.classList.add("is-done");
        if (ui.state) ui.state.textContent = "آپلود شد";
        paintPct(ui, 100);
        return { name: file.name, size: file.size };
      } catch (e) {
        ui._halt = true;
        cancelAnimationFrame(ui._raf);
        ui.slot?.classList.remove("is-uploading");
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
        if (!body.title) return msg(err, "عنوان را وارد کن");
        if (body.summary.length < 70)
          return msg(err, "توضیحات باید حداقل ۷۰ کاراکتر باشد");
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
        await ensureUploaded(pdfUi);
        if (!uploaded.pdf) return msg(err, "فایل PDF هنوز آپلود نشده");
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
          if ($("#coverage")) $("#coverage").value = p.coverage || "partial";
          if ($("#difficulty")) $("#difficulty").value = p.difficulty || "medium";
          refreshCombo($("#content_kind"));
          refreshCombo($("#coverage"));
          refreshCombo($("#difficulty"));
          if ($("#authors_text")) $("#authors_text").value = p.authors_text || "";
          if ($("#professor_name"))
            $("#professor_name").value = p.professor_name || "";
          fillTermYearSelects(p.term_year || "");
          if ($("#degree_level")) $("#degree_level").value = p.degree_level || "";
          const price = Number(p.price_irt || 0);
          if (priceHidden) priceHidden.value = String(price);
          if (freeToggle) freeToggle.checked = price <= 0;
          syncPriceUi();
          syncSummaryCount();
          refreshSuggest();
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

  async function initAccount() {
    injectChrome("account");
    const boot = $("#jh-dash-boot");
    const dash = $("#jh-dash");
    let me = null;
    try {
      me = await ensureSession();
      if (!me) {
        if (boot) boot.textContent = "در حال رفتن به ورود…";
        go(
          "login.html?next=" +
            encodeURIComponent("account.html" + location.search)
        );
        return;
      }
    } catch (_) {
      if (boot) boot.textContent = "در حال رفتن به ورود…";
      go(
        "login.html?next=" +
          encodeURIComponent("account.html" + location.search)
      );
      return;
    } finally {
      if (me) {
        if (boot) boot.hidden = true;
        if (dash) dash.hidden = false;
      }
    }

    const err = $("#jh-err");
    const tab = new URLSearchParams(location.search).get("tab") || "overview";
    const displayName =
      `${me.first_name || ""} ${me.last_name || ""}`.trim() || "کاربر";
    const hello = $("#jh-hello");
    if (hello) hello.textContent = `سلام، ${displayName}`;
    const walletHint = $("#jh-hello-sub");
    if (walletHint) walletHint.textContent = "مدیریت کتابخانه، انتشار و پشتیبانی";
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
        const [lib, mine, wallet, ticks] = await Promise.all([
          S().api("/api/site/pamphlets/library/me").catch(() => ({ data: [] })),
          S().api("/api/site/pamphlets/mine/list").catch(() => ({ data: [] })),
          S().api("/api/site/pamphlets/wallet/me").catch(() => ({ data: {} })),
          S().api("/api/site/pamphlets/tickets").catch(() => ({ data: [] })),
        ]);
        const libN = (lib.data || []).length;
        const mineList = mine.data || [];
        const actionMine = mineList.find((p) =>
          ["needs_revision", "ready_to_publish", "awaiting_author_approval", "pending_payment"].includes(
            p.status
          )
        );
        const openTickets = (ticks.data || []).filter((t) =>
          ["open", "pending"].includes(t.status)
        ).length;
        const bal = wallet.data?.wallet_balance_irt || 0;
        if (walletHint) {
          walletHint.textContent = `موجودی قابل تسویه: ${money(bal)}`;
        }
        $("#panel-overview").innerHTML = `
          <div class="jh-dash-cards">
            <a class="jh-dash-card" href="account.html?tab=library">
              <span class="jh-dash-card-kicker">کتابخانه</span>
              <strong>${libN.toLocaleString("fa-IR")}</strong>
              <em>جزوه ذخیره‌شده</em>
            </a>
            <a class="jh-dash-card" href="account.html?tab=mine">
              <span class="jh-dash-card-kicker">ارسالی‌ها</span>
              <strong>${mineList.length.toLocaleString("fa-IR")}</strong>
              <em>${actionMine ? STATUS_FA[actionMine.status] || "اقدام لازم" : "بدون اقدام فوری"}</em>
            </a>
            <a class="jh-dash-card" href="account.html?tab=wallet">
              <span class="jh-dash-card-kicker">موجودی</span>
              <strong>${money(bal)}</strong>
              <em>قابل تسویه</em>
            </a>
            <a class="jh-dash-card" href="account.html?tab=tickets">
              <span class="jh-dash-card-kicker">تیکت باز</span>
              <strong>${openTickets.toLocaleString("fa-IR")}</strong>
              <em>پشتیبانی جزوات</em>
            </a>
          </div>
          ${
            actionMine
              ? `<div class="jh-card jh-dash-next">
                  <h3>اقدام بعدی</h3>
                  <p class="jh-note">${S().esc(actionMine.title)} — ${
                    STATUS_FA[actionMine.status] || actionMine.status
                  }</p>
                  <p class="jh-meta">${S().esc(actionMine.next_action || "")}</p>
                  <div class="jh-actions">
                    <a class="jh-btn" href="account.html?tab=mine">مشاهده پرونده‌ها</a>
                  </div>
                </div>`
              : `<div class="jh-empty jh-dash-next">
                  <strong>همه‌چیز به‌روز است</strong>
                  <p>از فروشگاه جزوه پیدا کن یا جزوه جدید منتشر کن.</p>
                  <div class="jh-actions">
                    <a class="jh-btn secondary" href="index.html">فروشگاه</a>
                    <a class="jh-btn" href="submit.html">انتشار جزوه</a>
                  </div>
                </div>`
          }`;
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
              <div class="jh-actions"><a class="jh-btn" href="index.html">پیدا کردن جزوه</a></div>
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
                <a class="jh-btn secondary" href="guide.html">شرایط و مقررات</a>
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
                  <strong>${S().esc(p.title || "بدون عنوان")}</strong>
                  ${
                    p.review_note
                      ? `<span class="jh-meta">${S().esc(p.review_note)}</span>`
                      : ""
                  }
                  ${checklist ? `<ul class="jh-guide-list">${checklist}</ul>` : ""}
                  <div class="jh-meta" data-order-box="${S().esc(p.id)}"></div>
                </td>
                <td>${p.quality_grade ? S().esc(p.quality_grade) : "—"}</td>
                <td>${toFaDigits(p.downloads || p.sales_count || 0)}</td>
                <td>${faDate(p.updated_at || p.created_at)}</td>
                <td><span class="${toneClass(p.status_tone)}">${S().esc(
                  p.status_label || STATUS_FA[p.status] || p.status
                )}</span></td>
                <td class="jh-mine-ops">${opsHtml(p)}</td>
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
            </div>`;

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
              try {
                const o = await S().api(
                  `/api/site/pamphlets/mine/${btn.dataset.orders}/service-orders`
                );
                const orders = o.data || [];
                host.innerHTML = orders.length
                  ? orders
                      .map(
                        (x) =>
                          `<div style="margin-top:.5rem">پیش‌فاکتور ${money(
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
                  : "پیش‌فاکتوری نیست";
                $$("[data-pay-order]", host).forEach((b) =>
                  b.addEventListener("click", async () => {
                    try {
                      const pay = await S().api(
                        `/api/site/pamphlets/service-orders/${b.dataset.payOrder}/pay`,
                        {
                          method: "POST",
                          body: JSON.stringify({ environment: "live" }),
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
                host.textContent = e.message || "خطا";
              }
            })
          );
        };

        renderMine();
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
        box.innerHTML = orders.length
          ? orders
              .map(
                (o) => `<article class="jh-card">
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
                <a class="jh-btn secondary" href="account.html?tab=mine">پرونده</a>
              </div>
            </article>`
              )
              .join("")
          : '<p class="jh-note">سفارش خدماتی ندارید. خدمات آماده‌سازی اختیاری است و فقط با پیش‌فاکتور پشتیبان شروع می‌شود.</p>';
        $$("[data-pay-order]").forEach((b) =>
          b.addEventListener("click", async () => {
            try {
              const pay = await S().api(
                `/api/site/pamphlets/service-orders/${b.dataset.payOrder}/pay`,
                {
                  method: "POST",
                  body: JSON.stringify({ environment: "live" }),
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
        const d = res.data;
        $("#panel-wallet").innerHTML = `
          <div class="jh-card jh-wallet-card">
            <h3>موجودی قابل تسویه</h3>
            <p class="jh-wallet-balance">${money(d.wallet_balance_irt)}</p>
            <div class="jh-wallet-stats" role="list">
              <div class="jh-wallet-stat" role="listitem">
                <span class="jh-wallet-stat-label">فروش تأییدشده</span>
                <strong class="jh-wallet-stat-value">${toFaDigits(
                  d.sales_count || 0
                )}</strong>
              </div>
              <div class="jh-wallet-stat" role="listitem">
                <span class="jh-wallet-stat-label">سهم شما</span>
                <strong class="jh-wallet-stat-value">${money(
                  d.earned_irt
                )}</strong>
              </div>
              <div class="jh-wallet-stat" role="listitem">
                <span class="jh-wallet-stat-label">حداقل تسویه</span>
                <strong class="jh-wallet-stat-value">${money(
                  d.min_payout_irt
                )}</strong>
              </div>
            </div>
          </div>
          <div class="jh-form" style="margin-top:1rem">
            <label>مبلغ <input id="payout_amount" type="number" min="200000" /></label>
            <label>شبا <input id="iban" /></label>
            <label>کد ملی <input id="national_id" /></label>
            <button class="jh-btn" type="button" id="btn-payout">درخواست تسویه</button>
          </div>`;
        $("#btn-payout")?.addEventListener("click", async () => {
          try {
            await S().api("/api/site/pamphlets/wallet/payout", {
              method: "POST",
              body: JSON.stringify({
                amount_irt: Number($("#payout_amount")?.value || 0),
                iban: ($("#iban")?.value || "").trim(),
                national_id: ($("#national_id")?.value || "").trim(),
              }),
            });
            msg(err, "درخواست ثبت شد", true);
            location.reload();
          } catch (e) {
            msg(err, e.message || "خطا");
          }
        });
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
                <option value="services">خدمات</option>
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
            <h3>مشخصات ثبت‌نام</h3>
            <p class="jh-note">این اطلاعات برای انتشار جزوه و تسویه استفاده می‌شود.</p>
            <div class="jh-form" style="margin-top:1rem">
              <label>موبایل
                <input id="pf_phone" dir="ltr" value="${S().esc(
                  me.phone || ""
                )}" readonly />
              </label>
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
              <button class="jh-btn" type="button" id="btn-save-profile">ذخیره مشخصات</button>
            </div>
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
        $("#btn-save-profile")?.addEventListener("click", async () => {
          try {
            await S().api("/api/site/auth/complete-profile", {
              method: "POST",
              body: JSON.stringify({
                first_name: ($("#pf_first")?.value || "").trim(),
                last_name: ($("#pf_last")?.value || "").trim(),
                university:
                  ($("#pf_uni")?.value || "").trim() ||
                  "دانشگاه علوم پزشکی شهید بهشتی",
                field_of_study: ($("#pf_major")?.value || "").trim(),
              }),
            });
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
    const me = await ensureSession();
    if (!me)
      return (location.href = `login.html?next=${encodeURIComponent(
        `read.html?id=${id}`
      )}`);
    $("#jh-wm") &&
      ($("#jh-wm").textContent = `نسخه اختصاصی · ${me.first_name || ""} ${
        me.last_name || ""
      }`);
    try {
      const blob = await S().fetchPdfBlob(
        `/api/site/pamphlets/item/${encodeURIComponent(id)}/read`
      );
      $("#jh-reader").src = URL.createObjectURL(blob);
    } catch (e) {
      msg(err, e.message || "دسترسی ندارید");
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
    const ok = q.get("ok") === "1";
    const kind = q.get("kind") || "";
    const pamphlet = q.get("pamphlet") || "";
    $("#jh-pay").innerHTML = ok
      ? `<div class="jh-msg ok">پرداخت ${
          kind === "service" ? "خدمات" : "خرید"
        } ثبت شد.</div>
         <div class="jh-actions">
           <a class="jh-btn" href="${
             kind === "purchase" && pamphlet
               ? `read.html?id=${encodeURIComponent(pamphlet)}`
               : "account.html?tab=mine"
           }">ادامه</a>
         </div>`
      : `<div class="jh-msg err">پرداخت انجام نشد.</div>
         <div class="jh-actions"><a class="jh-btn secondary" href="account.html">بازگشت</a></div>`;
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
