(() => {
  const API_BASE = "https://iraniplanner.ir";
  const SITE_SESSION_KEY = "bolok_site_session";
  const VAULT_KEY = "bolok_site_account_vault";
  const VAULT_MAX = 5;

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

  async function api(path, opts = {}) {
    const headers = {
      Accept: "application/json",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(opts.headers || {}),
    };
    const session = getSiteSession();
    if (session && !headers["X-Bolok-Site-Session"]) {
      headers["X-Bolok-Site-Session"] = session;
    }
    const res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers,
    });
    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }
    if (!res.ok) {
      const msg = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
      throw new Error(typeof msg === "string" ? msg : "خطای سرور");
    }
    return data;
  }

  async function apiForm(path, formData, opts = {}) {
    return apiFormProgress(path, formData, opts);
  }

  function apiFormProgress(path, formData, opts = {}) {
    const onProgress =
      typeof opts.onProgress === "function" ? opts.onProgress : null;
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}${path}`, true);
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
      xhr.onerror = () => reject(new Error("خطای شبکه در آپلود"));
      xhr.onload = () => {
        let data = null;
        try {
          data = JSON.parse(xhr.responseText || "null");
        } catch (_) {
          data = null;
        }
        if (xhr.status < 200 || xhr.status >= 300) {
          const msg =
            (data && (data.detail || data.message)) || `HTTP ${xhr.status}`;
          reject(new Error(typeof msg === "string" ? msg : "خطای سرور"));
          return;
        }
        resolve(data);
      };
      xhr.send(formData);
    });
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
    return `${API_BASE}${path}`;
  }

  async function fetchPdfBlob(path) {
    const session = getSiteSession();
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        Accept: "application/pdf",
        ...(session ? { "X-Bolok-Site-Session": session } : {}),
      },
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const j = await res.json();
        msg = j.detail || j.message || msg;
      } catch (_) {}
      throw new Error(typeof msg === "string" ? msg : "خطای دریافت فایل");
    }
    return await res.blob();
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

  window.BolokSite = {
    API_BASE,
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
  };
})();
