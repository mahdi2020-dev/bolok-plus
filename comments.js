(() => {
  const API_BASE = "https://backendpy.liara.run";
  const DISCLAIMER =
    "(نظرات حاوی توهین، الفاظ رکیک و تبلیغات سایر موسسات تایید نخواهند شد.) نظر خود را بنویسید…";

  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const pagePath = () => {
    let p = window.location.pathname || "/";
    if (!p.startsWith("/")) p = "/" + p;
    p = p.split("?")[0].split("#")[0].replace(/\/+/g, "/");
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p || "/";
  };

  const pageTitle = () => {
    const h1 = document.querySelector(".edu-hero h1, main h1, h1");
    return (h1?.textContent || document.title || "").trim().slice(0, 180);
  };

  async function api(path, opts = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: {
        Accept: "application/json",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
        ...(opts.headers || {}),
      },
    });
    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }
    if (!res.ok) {
      let msg = data && (data.detail || data.message || data.error);
      if (Array.isArray(msg)) {
        msg = msg.map((x) => x?.msg || x).filter(Boolean).join(" · ");
      }
      if (!msg || typeof msg !== "string") msg = `خطا (${res.status})`;
      throw new Error(msg);
    }
    return data;
  }

  function ensureMount() {
    let root = document.querySelector("[data-site-comments]");
    if (root) return root;
    if (!document.querySelector(".article-body")) return null;
    root = document.createElement("section");
    root.className = "site-comments";
    root.setAttribute("data-site-comments", "");
    root.setAttribute("aria-label", "نظرات کاربران");
    const main = document.querySelector("main.container, main");
    if (main) {
      main.appendChild(root);
    } else {
      const footer = document.querySelector("footer");
      if (footer) footer.parentNode.insertBefore(root, footer);
      else document.body.appendChild(root);
    }
    return root;
  }

  function renderShell(root) {
    root.innerHTML = `
      <div class="sc-inner">
        <h2 class="sc-title">نظرات کاربران</h2>
        <form class="sc-form" data-sc-form novalidate>
          <div class="sc-row sc-row--name">
            <div class="sc-avatar" aria-hidden="true">
              <svg viewBox="0 0 48 48" width="44" height="44" fill="none">
                <circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2"/>
                <circle cx="24" cy="18" r="7" stroke="currentColor" stroke-width="2"/>
                <path d="M10 38c3.5-7 10-10 14-10s10.5 3 14 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M33 31l3 3 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <label class="sc-field sc-field--grow">
              <span class="visually-hidden">نام شما</span>
              <input type="text" name="author_name" maxlength="64" autocomplete="nickname" placeholder="نام شما" required />
            </label>
          </div>
          <label class="sc-field">
            <span class="visually-hidden">متن نظر</span>
            <textarea name="body" rows="4" maxlength="2000" placeholder="${esc(DISCLAIMER)}" required></textarea>
          </label>
          <div class="sc-captcha">
            <button type="button" class="sc-captcha-img" data-sc-refresh title="تغییر کد">
              <img data-sc-captcha-img alt="کد امنیتی" width="150" height="48" />
            </button>
            <label class="sc-field">
              <span class="visually-hidden">کد امنیتی</span>
              <input type="text" name="captcha_code" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="کد امنیتی" required />
            </label>
          </div>
          <input type="hidden" name="captcha_id" value="" />
          <p class="sc-msg" data-sc-msg hidden></p>
          <button type="submit" class="sc-submit">ارسال نظر</button>
        </form>
        <div class="sc-count" data-sc-count>تعداد کل نظرات: ۰</div>
        <div class="sc-list" data-sc-list></div>
      </div>
    `;
  }

  function toFaDigits(n) {
    return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
  }

  function renderList(listEl, items) {
    if (!items.length) {
      listEl.innerHTML =
        '<p class="sc-empty">هنوز نظری ثبت نشده؛ اولین نفر باشید.</p>';
      return;
    }
    listEl.innerHTML = items
      .map((item) => {
        const reply = (item.admin_reply || "").trim();
        const label = item.admin_reply_label || "پاسخ مشاور بلوک:";
        return `
          <article class="sc-item">
            <header class="sc-item-head">
              <span class="sc-name">${esc(item.author_name)}</span>
              <time class="sc-date" datetime="${esc(item.created_at || "")}">${esc(item.date_fa || "")}</time>
            </header>
            <p class="sc-body">${esc(item.body)}</p>
            ${
              reply
                ? `<div class="sc-reply"><strong>${esc(label)}</strong> ${esc(reply)}</div>`
                : ""
            }
          </article>`;
      })
      .join("");
  }

  async function loadCaptcha(root) {
    const form = root.querySelector("[data-sc-form]");
    const img = root.querySelector("[data-sc-captcha-img]");
    const idInput = form.querySelector('input[name="captcha_id"]');
    const codeInput = form.querySelector('input[name="captcha_code"]');
    const data = await api("/api/site/comments/captcha");
    const payload = data?.data || {};
    idInput.value = payload.captcha_id || "";
    if (img && payload.image) {
      img.src = payload.image;
      img.hidden = false;
    }
    codeInput.value = "";
  }

  async function loadComments(root) {
    const listEl = root.querySelector("[data-sc-list]");
    const countEl = root.querySelector("[data-sc-count]");
    const path = encodeURIComponent(pagePath());
    const data = await api(`/api/site/comments?page_path=${path}&limit=40`);
    const payload = data?.data || {};
    const total = payload.total ?? (payload.items || []).length;
    countEl.textContent = `تعداد کل نظرات: ${toFaDigits(total)}`;
    renderList(listEl, payload.items || []);
  }

  function showMsg(root, text, kind) {
    const el = root.querySelector("[data-sc-msg]");
    if (!text) {
      el.hidden = true;
      el.textContent = "";
      el.className = "sc-msg";
      return;
    }
    el.hidden = false;
    el.textContent = text;
    el.className = `sc-msg sc-msg--${kind || "info"}`;
  }

  async function boot() {
    const root = ensureMount();
    if (!root || root.dataset.scReady === "1") return;
    root.dataset.scReady = "1";
    renderShell(root);

    const form = root.querySelector("[data-sc-form]");
    const refreshBtn = root.querySelector("[data-sc-refresh]");

    refreshBtn.addEventListener("click", async () => {
      try {
        await loadCaptcha(root);
      } catch (e) {
        showMsg(root, e.message || "کپچا در دسترس نیست", "error");
      }
    });

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const author_name = String(fd.get("author_name") || "").trim();
      const body = String(fd.get("body") || "").trim();
      const captcha_id = String(fd.get("captcha_id") || "").trim();
      const captcha_code = String(fd.get("captcha_code") || "").trim();
      if (author_name.length < 2) {
        showMsg(root, "نام معتبر وارد کنید", "error");
        return;
      }
      if (body.length < 5) {
        showMsg(root, "متن نظر خیلی کوتاه است", "error");
        return;
      }
      if (!captcha_code) {
        showMsg(root, "کد امنیتی را وارد کنید", "error");
        return;
      }
      const btn = form.querySelector(".sc-submit");
      btn.disabled = true;
      showMsg(root, "");
      try {
        const res = await api("/api/site/comments", {
          method: "POST",
          body: JSON.stringify({
            page_path: pagePath(),
            page_title: pageTitle(),
            author_name,
            body,
            captcha_id,
            captcha_code,
          }),
        });
        const msg =
          res?.data?.message ||
          "نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود.";
        showMsg(root, msg, "ok");
        form.querySelector('textarea[name="body"]').value = "";
        form.querySelector('input[name="captcha_code"]').value = "";
        await loadCaptcha(root);
        await loadComments(root);
      } catch (e) {
        showMsg(root, e.message || "ثبت نظر ممکن نشد", "error");
        try {
          await loadCaptcha(root);
        } catch (_) {}
      } finally {
        btn.disabled = false;
      }
    });

    try {
      await Promise.all([loadCaptcha(root), loadComments(root)]);
    } catch (e) {
      showMsg(
        root,
        e.message || "بارگذاری نظرات ممکن نیست؛ کمی بعد دوباره تلاش کنید.",
        "error",
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
