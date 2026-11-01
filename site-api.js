(() => {
  const API_BASE = "https://iraniplanner.ir";

  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

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
      const msg = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
      throw new Error(typeof msg === "string" ? msg : "خطای سرور");
    }
    return data;
  }

  function rootPrefix() {
    const meta = document.querySelector('meta[name="bolok-root"]');
    if (meta?.content != null) return meta.content;
    const base = document.querySelector("[data-site-root]");
    if (base?.getAttribute("data-site-root") != null) {
      return base.getAttribute("data-site-root");
    }
    // Infer from script src
    const scripts = Array.from(document.scripts);
    const self = scripts.find((s) => (s.src || "").includes("site-api.js"));
    if (self?.src) {
      try {
        const u = new URL(self.src);
        const parts = u.pathname.split("/").filter(Boolean);
        // site-api.js at root → 0; at /resources/ → depth 1 for pages under resources
        const depth = Math.max(0, parts.length - 1);
        return "../".repeat(depth);
      } catch (_) {}
    }
    return "";
  }

  window.BolokSite = {
    API_BASE,
    api,
    esc,
    rootPrefix,
  };
})();
