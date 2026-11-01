(() => {
  const SITE = window.BolokSite;
  if (!SITE) return;
  const esc = SITE.esc;

  function renderBlocks(blocks, depth = 0) {
    if (!Array.isArray(blocks)) return "";
    return blocks
      .filter((b) => b && b.type !== "article_hero")
      .map((b) => renderBlock(b, depth))
      .join("");
  }

  function renderBlock(b, depth) {
    if (!b || typeof b !== "object") return "";
    const type = b.type || "";
    const props = b.props || {};
    const children = b.children || [];
    switch (type) {
      case "article_hero":
        return "";
      case "section":
        return `<section class="cms-block cms-block-section">${renderBlocks(children, depth + 1)}</section>`;
      case "heading": {
        const level = Math.min(3, Math.max(1, Number(props.level) || 2));
        const tag = `h${level}`;
        return `<div class="cms-block cms-block-heading"><${tag}>${esc(props.text || "")}</${tag}></div>`;
      }
      case "text":
        return `<div class="cms-block cms-block-text"><p>${esc(props.text || "").replace(/\n/g, "<br/>")}</p></div>`;
      case "image":
        return props.src
          ? `<div class="cms-block cms-block-image"><img src="${esc(props.src)}" alt="${esc(props.alt || "")}" loading="lazy" /></div>`
          : "";
      case "button":
        return `<div class="cms-block cms-block-button"><a href="${esc(props.href || "#")}">${esc(props.label || "دکمه")}</a></div>`;
      case "columns": {
        const cols = Math.min(3, Math.max(2, Number(props.columns) || 2));
        return `<div class="cms-block cms-block-columns" style="--cols:${cols}">${renderBlocks(children, depth + 1)}</div>`;
      }
      case "spacer":
        return `<div class="cms-block cms-block-spacer" style="--space:${Number(props.height) || 24}px"></div>`;
      case "divider":
        return `<hr class="cms-block cms-block-divider" />`;
      case "list": {
        const items = Array.isArray(props.items) ? props.items : String(props.text || "").split("\n");
        const lis = items
          .map((t) => String(t).trim())
          .filter(Boolean)
          .map((t) => `<li>${esc(t)}</li>`)
          .join("");
        return `<div class="cms-block"><ul>${lis}</ul></div>`;
      }
      case "html":
        return `<div class="cms-block cms-block-html">${props.html || ""}</div>`;
      case "catalog_grid":
        return `<div class="cms-block resource-grid" data-cms-catalog kind="${esc(props.kind || "")}" limit="${esc(String(props.limit || 8))}"></div>`;
      default:
        return "";
    }
  }

  function extractHero(blocks) {
    const list = Array.isArray(blocks) ? blocks : [];
    const hero = list.find((b) => b && b.type === "article_hero");
    const props = (hero && hero.props) || {};
    return {
      kicker: props.kicker || "",
      lead: props.lead || "",
      backLabel: props.back_label || "بازگشت",
      backHref: props.back_href || "index.html",
      meta: props.meta || "",
    };
  }

  function renderArticleChrome(page, blocksHtml) {
    const hero = extractHero(page.blocks || []);
    const title = esc(page.title || "");
    const kicker = hero.kicker ? `<p class="edu-kicker">${esc(hero.kicker)}</p>` : "";
    const lead = hero.lead ? `<p class="edu-lead">${esc(hero.lead)}</p>` : "";
    const meta = hero.meta
      ? `<p class="article-meta"><span>${esc(hero.meta)}</span></p>`
      : "";
    const slug = esc(page.slug || "");
    const shareUrl = `https://bolokapp.ir/page.html?slug=${encodeURIComponent(page.slug || "")}`;
    return `<div class="cms-article">
      <div class="edu-hero">
        <a class="back-home" href="${esc(hero.backHref)}">→ ${esc(hero.backLabel)}</a>
        ${kicker}
        <h1>${title}</h1>
        ${lead}
        ${meta}
        <div class="share-row" data-share-row aria-label="اشتراک‌گذاری">
          <span>اشتراک‌گذاری:</span>
          <button type="button" class="share-btn" data-copy-link="${esc(shareUrl)}">کپی لینک</button>
          <a class="share-btn" href="https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(page.title || "")}" target="_blank" rel="noopener noreferrer">تلگرام</a>
          <a class="share-btn" href="https://wa.me/?text=${encodeURIComponent((page.title || "") + " " + shareUrl)}" target="_blank" rel="noopener noreferrer">واتساپ</a>
        </div>
      </div>
      <div class="article-layout">
        <article class="article-body" data-cms-slug="${slug}">
          ${blocksHtml}
        </article>
      </div>
    </div>`;
  }

  async function hydrateCatalogGrids(root) {
    const grids = root.querySelectorAll("[data-cms-catalog]");
    for (const el of grids) {
      const kind = el.getAttribute("kind") || "";
      const limit = el.getAttribute("limit") || "8";
      const qs = new URLSearchParams({ limit });
      if (kind) qs.set("kind", kind);
      try {
        const data = await SITE.api(`/api/site/catalog/search?${qs}`);
        const items = data.items || [];
        const p = SITE.rootPrefix() || "";
        el.innerHTML = items
          .map((item) => {
            const meta = [item.publisher, item.lesson].filter(Boolean).join(" · ");
            const cover = (item.cover_url || item.icon_url || "").trim();
            const tint = esc((item.color || "").trim() || "#dbeafe");
            const coverInner = cover
              ? `<img class="resource-cover-img" src="${esc(cover)}" alt="" loading="lazy" decoding="async" data-cover-tint="${tint}" onerror="this.onerror=null;var d=document.createElement('div');d.className='resource-card-placeholder';d.style.setProperty('--cover-tint',this.getAttribute('data-cover-tint')||'#dbeafe');d.setAttribute('aria-hidden','true');this.replaceWith(d);" />`
              : `<div class="resource-card-placeholder" style="--cover-tint:${tint}" aria-hidden="true"></div>`;
            return `<a class="resource-card resource-card--book" href="${p}resources/item.html?id=${encodeURIComponent(item.id)}">
              <div class="resource-card-cover">${coverInner}</div>
              <div class="resource-card-body">
                <h3>${esc(item.name || "منبع")}</h3>
                <p class="meta">${esc(meta)}</p>
              </div>
            </a>`;
          })
          .join("") || '<p class="cat-empty">منبعی نیست</p>';
      } catch (e) {
        el.innerHTML = `<p class="cat-empty">${esc(e.message || "خطا")}</p>`;
      }
    }
  }

  window.BolokPageRender = {
    renderBlocks,
    hydrateCatalogGrids,
    async loadAndRender(slug, mount) {
      const data = await SITE.api(`/api/site/pages/${encodeURIComponent(slug)}`);
      const page = data.page || {};
      if (page.seo_title) document.title = page.seo_title;
      else if (page.title) document.title = `${page.title} | بلوک`;
      const desc = document.querySelector('meta[name="description"]');
      if (desc && page.seo_description) desc.setAttribute("content", page.seo_description);
      const blocksHtml = renderBlocks(page.blocks || []);
      mount.innerHTML = renderArticleChrome(page, blocksHtml);
      await hydrateCatalogGrids(mount);
      return page;
    },
  };
})();
