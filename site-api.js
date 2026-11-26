(() => {
  /** Brand custom domain (preferred). */
  const BRAND_API = "https://iraniplanner.ir";
  /** Same Liara `backendpy` app — used when brand TLS/SNI fails. */
  const LIARA_LEAF_API = "https://backendpy.liara.run";
  const API_BASE_STORAGE_KEY = "bolok_site_api_base_v1";
  const SITE_SESSION_KEY = "bolok_site_session";
  const VAULT_KEY = "bolok_site_account_vault";
  const VAULT_MAX = 5;
  const PROBE_MS = 3500;
  const FAILOVER_THROTTLE_MS = 8000;

  let apiBase = BRAND_API;
  let lastFailoverAt = 0;
  let ensurePromise = null;

  try {
    const cached = sessionStorage.getItem(API_BASE_STORAGE_KEY);
    if (cached === BRAND_API || cached === LIARA_LEAF_API) {
      apiBase = cached;
    }
  } catch (_) {}

  function getApiBase() {
    return apiBase;
  }

  function setApiBase(url) {
    if (url !== BRAND_API && url !== LIARA_LEAF_API) return;
    apiBase = url;
    try {
      sessionStorage.setItem(API_BASE_STORAGE_KEY, url);
    } catch (_) {}
  }

  function usingLeafFailover() {
    return apiBase === LIARA_LEAF_API;
  }

  async function probe(base) {
    if (!base) return false;
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(() => {
      try {
        ctrl?.abort();
      } catch (_) {}
    }, PROBE_MS);
    try {
      const res = await fetch(`${base}/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: ctrl?.signal,
        cache: "no-store",
        mode: "cors",
      });
      if (!res.ok) return false;
      const text = await res.text();
      return /healthy|"status"/i.test(text) || text.length > 0;
    } catch (_) {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Prefer brand host; fall back to Liara leaf when custom-domain TLS is down. */
  async function ensureReachable() {
    if (ensurePromise) return ensurePromise;
    ensurePromise = (async () => {
      if (await probe(apiBase)) return apiBase;
      if (apiBase !== BRAND_API && (await probe(BRAND_API))) {
        setApiBase(BRAND_API);
        return apiBase;
      }
      if (apiBase !== LIARA_LEAF_API && (await probe(LIARA_LEAF_API))) {
        setApiBase(LIARA_LEAF_API);
        try {
          console.info("[Bolok/site] brand host unreachable; failover =>", LIARA_LEAF_API);
        } catch (_) {}
        return apiBase;
      }
      return apiBase;
    })().finally(() => {
      ensurePromise = null;
    });
    return ensurePromise;
  }

  async function failoverAfterFailure() {
    const now = Date.now();
    if (now - lastFailoverAt < FAILOVER_THROTTLE_MS) return false;
    lastFailoverAt = now;
    const before = apiBase;
    if (before !== LIARA_LEAF_API && (await probe(LIARA_LEAF_API))) {
      setApiBase(LIARA_LEAF_API);
      try {
        console.info("[Bolok/site] request failed; failover =>", LIARA_LEAF_API);
      } catch (_) {}
      return true;
    }
    if (before !== BRAND_API && (await probe(BRAND_API))) {
      setApiBase(BRAND_API);
      return true;
    }
    return false;
  }

  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  function getSiteSession() {
    try {
      return localStorage.getItem(SITE_SESSION_KEY) || "";
    } catch (_) {
      return "";
    }
  }

  function setSiteSession(token) {
    try {
      if (token) localStorage.setItem(SITE_SESSION_KEY, token);
      else localStorage.removeItem(SITE_SESSION_KEY);
    } catch (_) {}
  }

  function listVault() {
    try {
      const raw = localStorage.getItem(VAULT_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function saveVault(list) {
    try {
      localStorage.setItem(VAULT_KEY, JSON.stringify(list.slice(0, VAULT_MAX)));
    } catch (_) {}
  }

  function upsertVaultAccount({ id, phone, label, token }) {
    if (!id || !token) return;
    const list = listVault().filter((x) => x.id !== id && x.token !== token);
    list.unshift({
      id,
      phone: phone || "",
      label: label || phone || "حساب",
      token,
      updatedAt: Date.now(),
    });
    saveVault(list);
    setSiteSession(token);
  }

  function removeFromVault(idOrToken) {
    saveVault(
      listVault().filter((x) => x.id !== idOrToken && x.token !== idOrToken)
    );
  }

  function setActiveAccount(token) {
    if (!token) return false;
    const hit = listVault().find((x) => x.token === token);
    setSiteSession(token);
    if (hit) upsertVaultAccount(hit);
    return true;
  }

  function friendlyNetworkError(err) {
    const raw = String(err?.message || err || "");
    if (/failed to fetch|networkerror|load failed|network request failed|tls|ssl|handshake/i.test(raw)) {
      return "ارتباط با سرور برقرار نشد. چند لحظه بعد دوباره امتحان کن.";
    }
    if (/abort/i.test(raw)) return "درخواست لغو شد؛ دوباره تلاش کن.";
    return raw || "خطای شبکه";
  }

  function extractApiError(data, status) {
    const detail = data && (data.detail ?? data.message);
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length) {
      const first = detail[0];
      if (typeof first === "string") return first;
      if (first && typeof first.msg === "string") return first.msg;
    }
    if (status === 401 || status === 403) return "نشست منقضی شده؛ دوباره وارد شو.";
    if (status === 413) return "حجم فایل زیاد است.";
    if (status >= 500) return "سرور موقتاً در دسترس نیست؛ کمی بعد دوباره تلاش کن.";
    return `HTTP ${status}`;
  }

  async function rawFetch(path, opts = {}) {
    const headers = {
      Accept: "application/json",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(opts.headers || {}),
    };
    const session = getSiteSession();
    if (session && !headers["X-Bolok-Site-Session"]) {
      headers["X-Bolok-Site-Session"] = session;
    }
    return fetch(`${getApiBase()}${path}`, {
      ...opts,
      headers,
    });
  }

  async function api(path, opts = {}) {
    await ensureReachable();
    let res;
    try {
      res = await rawFetch(path, opts);
    } catch (err) {
      const switched = await failoverAfterFailure();
      if (switched) {
        try {
          res = await rawFetch(path, opts);
        } catch (err2) {
          throw new Error(friendlyNetworkError(err2));
        }
      } else {
        throw new Error(friendlyNetworkError(err));
      }
    }
    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }
    if (!res.ok) {
      throw new Error(extractApiError(data, res.status));
    }
    return data;
  }

  async function apiForm(path, formData, opts = {}) {
    return apiFormProgress(path, formData, opts);
  }

  function xhrPost(path, formData, opts, onProgress) {
    let settled = false;
    let xhr = null;
    const promise = new Promise((resolve, reject) => {
      xhr = new XMLHttpRequest();
      xhr.open("POST", `${getApiBase()}${path}`, true);
      xhr.setRequestHeader("Accept", "application/json");
      const session = getSiteSession();
      if (session) xhr.setRequestHeader("X-Bolok-Site-Session", session);
      const extra = opts.headers || {};
      Object.keys(extra).forEach((k) => {
        if (k.toLowerCase() === "content-type") return;
        xhr.setRequestHeader(k, extra[k]);
      });
      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (ev) => {
          if (!ev.lengthComputable) return;
          onProgress({
            loaded: ev.loaded,
            total: ev.total,
            percent: Math.round((ev.loaded / ev.total) * 100),
          });
        };
      }
      const settleReject = (err) => {
        if (settled) return;
        settled = true;
        reject(err);
      };
      const settleResolve = (data) => {
        if (settled) return;
        settled = true;
        resolve(data);
      };
      xhr.onerror = () =>
        settleReject(
          new Error("اتصال آپلود برقرار نشد. اینترنت را چک کن و دوباره بزن.")
        );
      xhr.onabort = () => {
        const err = new Error("آپلود متوقف شد");
        err.name = "UploadAborted";
        err.code = "UPLOAD_ABORTED";
        settleReject(err);
      };
      xhr.onload = () => {
        let data = null;
        try {
          data = JSON.parse(xhr.responseText || "null");
        } catch (_) {
          data = null;
        }
        if (xhr.status < 200 || xhr.status >= 300) {
          settleReject(new Error(extractApiError(data, xhr.status)));
          return;
        }
        settleResolve(data);
      };
      xhr.send(formData);
    });
    promise.abort = () => {
      try {
        xhr?.abort();
      } catch (_) {}
    };
    return promise;
  }

  function apiFormProgress(path, formData, opts = {}) {
    const onProgress =
      typeof opts.onProgress === "function" ? opts.onProgress : null;
    let abortFn = null;
    const promise = (async () => {
      await ensureReachable();
      try {
        const first = xhrPost(path, formData, opts, onProgress);
        abortFn = first.abort;
        return await first;
      } catch (err) {
        if (err?.code === "UPLOAD_ABORTED" || err?.name === "UploadAborted") {
          throw err;
        }
        const switched = await failoverAfterFailure();
        if (!switched) throw err;
        const second = xhrPost(path, formData, opts, onProgress);
        abortFn = second.abort;
        return await second;
      }
    })();
    promise.abort = () => {
      try {
        abortFn?.();
      } catch (_) {}
    };
    return promise;
  }

  function rootPrefix() {
    const meta = document.querySelector('meta[name="bolok-root"]');
    if (meta?.content != null) return meta.content;
    const base = document.querySelector("[data-site-root]");
    if (base?.getAttribute("data-site-root") != null) {
      return base.getAttribute("data-site-root");
    }
    const scripts = Array.from(document.scripts);
    const self = scripts.find((s) => (s.src || "").includes("site-api.js"));
    if (self?.src) {
      try {
        const u = new URL(self.src);
        const parts = u.pathname.split("/").filter(Boolean);
        const depth = Math.max(0, parts.length - 1);
        return "../".repeat(depth);
      } catch (_) {}
    }
    return "";
  }

  function pdfUrl(path) {
    return `${getApiBase()}${path}`;
  }

  async function fetchPdfBlob(path) {
    await ensureReachable();
    const session = getSiteSession();
    const doFetch = () =>
      fetch(`${getApiBase()}${path}`, {
        headers: {
          Accept: "application/pdf",
          ...(session ? { "X-Bolok-Site-Session": session } : {}),
        },
      });
    let res;
    try {
      res = await doFetch();
    } catch (err) {
      const switched = await failoverAfterFailure();
      if (!switched) throw new Error(friendlyNetworkError(err));
      res = await doFetch();
    }
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const j = await res.json();
        msg = j.detail || j.message || msg;
      } catch (_) {}
      throw new Error(typeof msg === "string" ? msg : "خطای دریافت فایل");
    }
    const buf = await res.arrayBuffer();
    if (!buf || buf.byteLength < 8) {
      throw new Error("فایل PDF خالی برگشت");
    }
    const head = new Uint8Array(buf, 0, Math.min(5, buf.byteLength));
    const sig = String.fromCharCode(...head);
    if (!sig.startsWith("%PDF")) {
      throw new Error("پاسخ سرور PDF معتبر نیست");
    }
    return new Blob([buf], { type: "application/pdf" });
  }

  async function fetchPdfBytes(path) {
    const blob = await fetchPdfBlob(path);
    return await blob.arrayBuffer();
  }

  function rememberAuth(res) {
    const token = res?.session_token;
    const d = res?.data || {};
    if (!token || !d.id) return;
    const label =
      `${d.first_name || ""} ${d.last_name || ""}`.trim() || d.phone || "حساب";
    upsertVaultAccount({
      id: d.id,
      phone: d.phone,
      label,
      token,
    });
  }

  // Kick off early so first API call often finds a warm base.
  try {
    ensureReachable();
  } catch (_) {}

  window.BolokSite = {
    get API_BASE() {
      return getApiBase();
    },
    BRAND_API,
    LIARA_LEAF_API,
    usingLeafFailover,
    ensureReachable,
    api,
    apiForm,
    apiFormProgress,
    esc,
    rootPrefix,
    getSiteSession,
    setSiteSession,
    listVault,
    upsertVaultAccount,
    removeFromVault,
    setActiveAccount,
    rememberAuth,
    pdfUrl,
    fetchPdfBlob,
    fetchPdfBytes,
  };
})();
