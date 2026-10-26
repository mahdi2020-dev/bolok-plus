(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  // Nav drawer (mobile) — body lock, header state, resize close
  const drawer = document.querySelector("[data-nav-drawer]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const siteHeaderEl = document.querySelector(".site-header");
  if (toggle && drawer) {
    toggle.setAttribute("aria-expanded", "false");
    const setDrawer = (open) => {
      drawer.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
      siteHeaderEl?.classList.toggle("is-open", open);
    };
    const closeDrawer = () => setDrawer(false);
    toggle.addEventListener("click", () => {
      setDrawer(!drawer.classList.contains("open"));
    });
    drawer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", closeDrawer);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
    document.addEventListener("click", (e) => {
      if (
        drawer.classList.contains("open") &&
        !drawer.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        closeDrawer();
      }
    });
    window.addEventListener(
      "resize",
      () => {
        if (window.matchMedia("(min-width: 760px)").matches) closeDrawer();
      },
      { passive: true },
    );
  }

  // Header shadow on scroll
  const siteHeader = document.querySelector(".site-header");
  if (siteHeader) {
    let ticking = false;
    const syncHeader = () => {
      siteHeader.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    };
    syncHeader();
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(syncHeader);
        }
      },
      { passive: true },
    );
  }

  // Article TOC active state
  const tocLinks = Array.from(document.querySelectorAll(".article-toc a[href^='#']"));
  if (tocLinks.length && "IntersectionObserver" in window) {
    const byId = new Map(
      tocLinks
        .map((a) => [a.getAttribute("href").slice(1), a])
        .filter(([id]) => document.getElementById(id)),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          tocLinks.forEach((a) => a.classList.remove("is-active"));
          byId.get(entry.target.id)?.classList.add("is-active");
        });
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    byId.forEach((_, id) => observer.observe(document.getElementById(id)));
  }

  // Copy share link
  document.querySelectorAll("[data-copy-link]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const url = btn.getAttribute("data-copy-link");
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      const old = btn.textContent;
      btn.textContent = "کپی شد ✓";
      btn.classList.add("is-copied");
      setTimeout(() => {
        btn.textContent = old;
        btn.classList.remove("is-copied");
      }, 1800);
    });
  });

  // Desktop education submenu (hover/CSS + click toggle; anchor may scroll to #education)
  const eduNav = document.querySelector("[data-edu-nav]");
  const eduTrigger = eduNav?.querySelector("[data-edu-trigger]");
  const closeEduNav = () => {
    if (!eduNav || !eduTrigger) return;
    eduNav.classList.remove("is-open");
    eduTrigger.setAttribute("aria-expanded", "false");
  };
  if (eduNav && eduTrigger) {
    eduTrigger.addEventListener("click", (e) => {
      const href = eduTrigger.getAttribute("href") || "";
      const isHash = href.startsWith("#");
      const desktop = window.matchMedia("(min-width: 760px)").matches;
      // On desktop, allow hash navigation; panel opens via :hover
      if (desktop && isHash) {
        eduNav.classList.remove("is-open");
        eduTrigger.setAttribute("aria-expanded", "false");
        return;
      }
      e.preventDefault();
      const open = !eduNav.classList.contains("is-open");
      eduNav.classList.toggle("is-open", open);
      eduTrigger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", (e) => {
      if (!eduNav.contains(e.target)) closeEduNav();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeEduNav();
    });
  }

  // Mobile drawer accordion for education
  document.querySelectorAll("[data-drawer-sub]").forEach((block) => {
    const btn = block.querySelector("[data-drawer-sub-toggle]");
    btn?.addEventListener("click", () => {
      const open = !block.classList.contains("is-open");
      block.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  // Progressive reveal: only hide when GSAP is actually available
  const enableMotionReveals = () => {
    if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray(".reveal, .reveal-blur").forEach((el) => {
      const blur = el.classList.contains("reveal-blur");
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.95 && rect.bottom > 0;
      const vars = {
        opacity: 1,
        y: 0,
        filter: "none",
        duration: blur ? 0.85 : 0.65,
        ease: "power3.out",
        immediateRender: false,
      };
      if (!inView) {
        vars.scrollTrigger = {
          trigger: el,
          start: "top 95%",
          once: true,
        };
      }
      gsap.fromTo(
        el,
        {
          opacity: 0,
          y: 14,
          filter: blur ? "blur(6px)" : "none",
        },
        vars,
      );
    });

    // Safety net if a reveal tween never starts
    window.setTimeout(() => {
      document.querySelectorAll(".reveal, .reveal-blur").forEach((el) => {
        if (parseFloat(window.getComputedStyle(el).opacity) < 0.05) {
          gsap.set(el, { opacity: 1, y: 0, filter: "none", clearProps: "filter" });
        }
      });
    }, 900);
  };

  // Hero tilt
  const tiltWrap = document.querySelector("[data-tilt]");
  const tiltImg = tiltWrap?.querySelector(".hero-logo");
  if (tiltWrap && tiltImg && finePointer && !reduceMotion) {
    tiltWrap.addEventListener("pointermove", (e) => {
      const r = tiltWrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tiltImg.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 12}deg)`;
    });
    tiltWrap.addEventListener("pointerleave", () => {
      tiltImg.style.transform = "rotateY(0) rotateX(0)";
    });
  }

  // Magnetic buttons
  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${x * 0.16}px, ${y * 0.2}px)`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });
  }

  // Spotlight cards
  document.querySelectorAll("[data-spotlight]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  // Phone tilt + parallax chips (scoped to phone column)
  const phoneTilt = document.querySelector("[data-phone-tilt]");
  const phoneCol = document.querySelector(".phone-col");
  if (phoneTilt && phoneCol && finePointer && !reduceMotion) {
    phoneCol.addEventListener("pointermove", (e) => {
      const r = phoneCol.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      phoneTilt.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`;
      phoneCol.querySelectorAll("[data-parallax]").forEach((chip) => {
        const amount = Number(chip.getAttribute("data-parallax") || 0);
        chip.style.transform = `translate(${x * amount}px, ${y * amount * 0.5}px)`;
      });
    });
    phoneCol.addEventListener("pointerleave", () => {
      phoneTilt.style.transform = "";
      phoneCol.querySelectorAll("[data-parallax]").forEach((chip) => {
        chip.style.transform = "";
      });
    });
  }

  // Slider
  const root = document.querySelector("[data-slider]");
  if (root) {
    const slides = Array.from(root.querySelectorAll(".slide"));
    const dotsWrap = root.querySelector(".dots");
    const prevBtn = root.querySelector("[data-prev]");
    const nextBtn = root.querySelector("[data-next]");
    const titleEl = document.querySelector("[data-slide-title]");
    const textEl = document.querySelector("[data-slide-text]");
    const indexEl = document.querySelector("[data-slide-index]");

    const meta = [
      {
        title: "جدول روز — ۱۴ خانه",
        text: "از ۵ صبح تا ۵ صبح فردا برنامه‌ات را مثل یک جدول کاری می‌چینی؛ هر خانه یک بلوک تمرکز است.",
      },
      {
        title: "بانک منابع",
        text: "کتاب، جزوه و ویدیو را یک‌بار بساز؛ فصل و بازهٔ صفحه/تست را وصل کن تا پیشرفت دقیق بماند.",
      },
      {
        title: "ثبت و انجام",
        text: "بعد از مطالعه واقعی، زمان را با کرنومتر یا دستی ثبت کن و وضعیت خانه را به‌روز کن.",
      },
      {
        title: "اهداف و هوش بلوک",
        text: "هدف کوتاه و بلند بساز؛ هوش بلوک کمک می‌کند برنامهٔ زمانی تا آزمون را بچینی — تو تأیید می‌کنی.",
      },
      {
        title: "پرمیوم و ارز",
        text: "نسخه رایگان برای شروع کافی است؛ پرمیوم منابع نامحدود و امکانات بیشتر می‌دهد.",
      },
    ];

    const faIndex = (n) =>
      String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

    let index = 0;
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "dot" + (i === 0 ? " active" : "");
      b.setAttribute("aria-label", `اسلاید ${i + 1}`);
      b.addEventListener("click", () => go(i));
      dotsWrap?.appendChild(b);
    });

    const dots = () => Array.from(dotsWrap?.querySelectorAll(".dot") || []);

    function go(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, si) => s.classList.toggle("is-active", si === index));
      dots().forEach((d, di) => d.classList.toggle("active", di === index));
      const m = meta[index];
      if (titleEl) titleEl.textContent = m.title;
      if (textEl) textEl.textContent = m.text;
      if (indexEl) {
        indexEl.textContent = `${faIndex(index + 1)} / ${faIndex(slides.length)}`;
      }
    }

    prevBtn?.addEventListener("click", () => {
      go(index - 1);
      resetTimer();
    });
    nextBtn?.addEventListener("click", () => {
      go(index + 1);
      resetTimer();
    });

    let timer = null;
    const resetTimer = () => {
      clearInterval(timer);
      if (reduceMotion) return;
      timer = setInterval(() => go(index + 1), 5200);
    };
    resetTimer();

    let startX = 0;
    let deltaX = 0;
    let dragging = false;
    const screen = root.querySelector(".phone-screen");
    screen?.addEventListener(
      "touchstart",
      (e) => {
        dragging = true;
        startX = e.touches[0].clientX;
        deltaX = 0;
        clearInterval(timer);
      },
      { passive: true },
    );
    screen?.addEventListener(
      "touchmove",
      (e) => {
        if (!dragging) return;
        deltaX = e.touches[0].clientX - startX;
      },
      { passive: true },
    );
    screen?.addEventListener("touchend", () => {
      if (!dragging) return;
      dragging = false;
      if (Math.abs(deltaX) > 40) go(deltaX > 0 ? index - 1 : index + 1);
      resetTimer();
    });
  }

  // Portal intro media (static poster → CTA)
  const portalPlay = document.querySelector("[data-portal-play]");
  if (portalPlay) {
    portalPlay.addEventListener("click", () => {
      const note = document.querySelector(".portal-media-note");
      if (note) {
        note.textContent =
          "نسخه ویدیویی کامل در اپ بلوک است؛ از دکمه دانلود اپ در هدر استفاده کنید.";
        note.style.color = "var(--ink)";
      }
      portalPlay.setAttribute("aria-pressed", "true");
    });
  }

  // Reading progress bar
  const progressEl = document.querySelector("[data-read-progress]");
  if (progressEl) {
    const updateProgress = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progressEl.style.transform = `scaleX(${p})`;
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
  }

  // Back to top
  const backTop = document.querySelector("[data-back-top]");
  if (backTop) {
    const syncBackTop = () => {
      backTop.classList.toggle("is-visible", window.scrollY > 480);
    };
    syncBackTop();
    window.addEventListener("scroll", syncBackTop, { passive: true });
    backTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  // Site search (search.html)
  const searchForm = document.querySelector("[data-site-search]");
  if (searchForm) {
    const input = searchForm.querySelector('input[name="q"]');
    const resultsEl = document.querySelector("[data-search-results]");
    const metaEl = document.querySelector("[data-search-meta]");
    let indexCache = null;

    const normalize = (s) =>
      String(s || "")
        .toLowerCase()
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/\s+/g, " ")
        .trim();

    const render = (items, q) => {
      if (!resultsEl) return;
      if (!q) {
        resultsEl.innerHTML = "";
        if (metaEl) metaEl.textContent = "عبارت را بنویسید تا نتایج نشان داده شود.";
        return;
      }
      if (!items.length) {
        resultsEl.innerHTML = "";
        if (metaEl) metaEl.textContent = `نتیجه‌ای برای «${q}» پیدا نشد.`;
        return;
      }
      if (metaEl) metaEl.textContent = `${items.length} نتیجه برای «${q}»`;
      resultsEl.innerHTML = items
        .map(
          (it) => `<li class="feed-item">
            <a href="${it.url}">
              ${it.category ? `<em class="result-cat">${it.category}</em>` : ""}
              <strong>${it.title}</strong>
              <span>${it.desc || ""}</span>
            </a>
          </li>`,
        )
        .join("");
    };

    document.querySelectorAll("[data-search-chip]").forEach((chip) => {
      chip.addEventListener("click", () => {
        if (input) input.value = chip.getAttribute("data-search-chip") || "";
        runSearch(input?.value || "");
        input?.focus();
      });
    });

    document.addEventListener("keydown", (e) => {
      if (
        e.key === "/" &&
        input &&
        !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")
      ) {
        e.preventDefault();
        input.focus();
      }
    });

    const runSearch = async (raw) => {
      const q = normalize(raw);
      if (!indexCache) {
        try {
          const res = await fetch("search-index.json", { cache: "no-store" });
          indexCache = await res.json();
        } catch {
          if (metaEl) metaEl.textContent = "بارگذاری فهرست جستجو ناموفق بود.";
          return;
        }
      }
      if (!q) {
        render([], "");
        return;
      }
      const tokens = q.split(" ").filter(Boolean);
      const scored = [];
      for (const it of indexCache) {
        const hay = normalize(`${it.title} ${it.desc} ${it.path}`);
        let score = 0;
        for (const t of tokens) {
          if (hay.includes(t)) score += t.length >= 3 ? 3 : 1;
          if (normalize(it.title).includes(t)) score += 4;
        }
        if (score > 0) scored.push({ ...it, score });
      }
      scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "fa"));
      render(scored.slice(0, 40), raw.trim());
    };

    const params = new URLSearchParams(window.location.search);
    const initial = params.get("q") || "";
    if (input && initial) {
      input.value = initial;
      runSearch(initial);
    } else if (metaEl) {
      metaEl.textContent = "عبارت را بنویسید تا نتایج نشان داده شود.";
    }

    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input?.value || "";
      const url = new URL(window.location.href);
      if (q.trim()) url.searchParams.set("q", q.trim());
      else url.searchParams.delete("q");
      history.replaceState(null, "", url);
      runSearch(q);
    });

    let debounce;
    input?.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => runSearch(input.value), 180);
    });
  }

  const boot = () => {
    // Wait briefly for deferred CDN scripts; never leave content hidden
    let tries = 0;
    const tick = () => {
      tries += 1;
      if (window.gsap && window.ScrollTrigger) {
        enableMotionReveals();
        return;
      }
      if (tries < 20) {
        setTimeout(tick, 100);
      }
    };
    tick();
  };

  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
})();
