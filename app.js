(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // RTL phones can open on the wrong edge when anything is wider than the screen.
  const pinScrollX = () => {
    const se = document.scrollingElement || document.documentElement;
    const brand = document.querySelector(".brand");
    const vw = document.documentElement.clientWidth;
    const max = Math.max(0, se.scrollWidth - se.clientWidth);
    const candidates = [0, -max, max];
    const brandFits = () => {
      if (!brand) return true;
      const r = brand.getBoundingClientRect();
      return r.width > 0 && r.left >= -1 && r.right <= vw + 1;
    };
    for (const left of candidates) {
      se.scrollLeft = left;
      if (brandFits()) return;
    }
    se.scrollLeft = 0;
  };
  pinScrollX();
  window.addEventListener("load", pinScrollX, { once: true });
  window.addEventListener("resize", pinScrollX);
  document.fonts?.ready?.then(pinScrollX);
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  // جزوه‌سرا in desktop header + drawer (relative to data-site-root)
  const ensureJomhehsaraNav = () => {
    const headerEl = document.querySelector(".site-header[data-site-root], .site-header");
    const rootAttr =
      headerEl?.getAttribute("data-site-root") ??
      document.querySelector("[data-site-root]")?.getAttribute("data-site-root") ??
      "";
    const root = rootAttr || "";
    const href = `${root}jomhehsara/`;
    const mainNav = document.querySelector(".header-links--main");
    if (mainNav && !mainNav.querySelector("a.nav-jomhehsara, a[href*='jomhehsara']")) {
      const a = document.createElement("a");
      a.className = "nav-jomhehsara";
      a.href = href;
      a.textContent = "جزوه‌سرا";
      const consult = mainNav.querySelector(".header-consult");
      if (consult?.nextSibling) {
        mainNav.insertBefore(a, consult.nextSibling);
      } else if (consult) {
        consult.after(a);
      } else {
        mainNav.prepend(a);
      }
    }
    const drawerNav = document.querySelector(".drawer-nav");
    if (
      drawerNav &&
      !drawerNav.querySelector("a[href*='jomhehsara']")
    ) {
      const item = document.createElement("a");
      item.className = "drawer-nav-item";
      item.href = href;
      item.innerHTML = `
        <span class="drawer-nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 19.5V6a2 2 0 0 1 2-2h11v16H6a2 2 0 0 0-2 2z"/><path d="M17 4v16"/><path d="M8 8h5M8 12h5"/></svg>
        </span>
        <span class="drawer-nav-label">جزوه‌سرا</span>`;
      const about = Array.from(drawerNav.querySelectorAll("a.drawer-nav-item")).find(
        (el) => (el.textContent || "").includes("درباره"),
      );
      if (about) drawerNav.insertBefore(item, about);
      else drawerNav.appendChild(item);
    }
  };
  ensureJomhehsaraNav();

  // Site account (جزوه‌سرا OTP) — profile icon in header + drawer
  const siteRoot = () => {
    const headerEl = document.querySelector(".site-header[data-site-root], .site-header");
    return (
      headerEl?.getAttribute("data-site-root") ??
      document.querySelector("[data-site-root]")?.getAttribute("data-site-root") ??
      ""
    );
  };
  const ensureSiteAccountHeader = () => {
    const root = siteRoot();
    const loginHref = `${root}jomhehsara/login.html`;
    const accountHref = `${root}jomhehsara/account.html?tab=overview`;
    const personSvg =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="8" r="3.4"/><path d="M5.2 19.2c1.6-3.2 4-4.7 6.8-4.7s5.2 1.5 6.8 4.7"/></svg>';

    let btn =
      document.querySelector("[data-site-account]") ||
      document.querySelector(".header-about-compact");
    if (!btn) {
      const actions = document.querySelector(".header-top-actions");
      if (actions) {
        btn = document.createElement("a");
        btn.className = "header-icon-btn header-account";
        btn.setAttribute("data-site-account", "");
        btn.innerHTML = personSvg;
        const search = actions.querySelector(".header-search-compact");
        if (search?.nextSibling) actions.insertBefore(btn, search.nextSibling);
        else actions.appendChild(btn);
      }
    }
    if (btn) {
      btn.classList.remove("header-about-compact");
      btn.classList.add("header-account");
      btn.setAttribute("data-site-account", "");
      btn.href = loginHref;
      btn.setAttribute("aria-label", "ورود یا ثبت‌نام");
      btn.title = "ورود / ثبت‌نام";
      if (!btn.querySelector("svg")) btn.innerHTML = personSvg;
    }

    const drawerNav = document.querySelector(".drawer-nav");
    if (drawerNav && !drawerNav.querySelector("[data-site-account-drawer]")) {
      const item = document.createElement("a");
      item.className = "drawer-nav-item";
      item.setAttribute("data-site-account-drawer", "");
      item.href = loginHref;
      item.innerHTML = `
        <span class="drawer-nav-icon" aria-hidden="true">${personSvg}</span>
        <span class="drawer-nav-label">ورود / حساب من</span>`;
      drawerNav.prepend(item);
    }

    const applyAccount = (account) => {
      const label = account
        ? `${account.first_name || ""} ${account.last_name || ""}`.trim() || "حساب من"
        : "ورود / ثبت‌نام";
      const href = account ? accountHref : loginHref;
      if (btn) {
        btn.href = href;
        btn.title = label;
        btn.setAttribute("aria-label", label);
        btn.classList.toggle("is-logged-in", false);
      }
      const drawerItem = document.querySelector("[data-site-account-drawer]");
      if (drawerItem) {
        drawerItem.href = href;
        const lab = drawerItem.querySelector(".drawer-nav-label");
        if (lab) lab.textContent = account ? label : "ورود / حساب من";
      }
    };

    const BS = window.BolokSite;
    if (!BS?.getSiteSession?.() || !BS.api) {
      applyAccount(null);
      return;
    }
    BS.api("/api/site/auth/restore-session", { method: "POST", body: "{}" })
      .then((res) => {
        if (!res?.ok) {
          BS.setSiteSession("");
          applyAccount(null);
          return;
        }
        applyAccount(res.data || null);
      })
      .catch(() => applyAccount(null));
  };
  ensureSiteAccountHeader();

  // Nav drawer (mobile) — portal to body so header transform/filter can't trap fixed
  const drawer = document.querySelector("[data-nav-drawer]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const backdrop = document.querySelector("[data-nav-backdrop]");
  const siteHeaderEl = document.querySelector(".site-header");
  let navLockY = 0;
  if (toggle && drawer) {
    // Move drawer + backdrop to <body> for true viewport-fixed positioning
    if (drawer.parentElement !== document.body) {
      drawer.classList.add("nav-drawer--portal");
      document.body.appendChild(drawer);
    }
    if (backdrop && backdrop.parentElement !== document.body) {
      backdrop.classList.add("nav-drawer-backdrop--portal");
      document.body.appendChild(backdrop);
    }

    const syncDrawerOffset = () => {
      const header = siteHeaderEl || document.querySelector(".site-header");
      if (!header) return;
      const rect = header.getBoundingClientRect();
      const offset = Math.max(48, Math.ceil(rect.bottom));
      document.documentElement.style.setProperty(
        "--site-header-offset",
        `${offset}px`,
      );
      document.documentElement.style.setProperty(
        "--header-h-v36",
        `${Math.ceil(rect.height)}px`,
      );
    };

    const lockScroll = () => {
      navLockY = Math.max(0, window.scrollY || window.pageYOffset || 0);
      document.body.classList.add("is-nav-scroll-locked");
      document.body.style.top = `-${navLockY}px`;
    };
    const unlockScroll = () => {
      document.body.classList.remove("is-nav-scroll-locked");
      document.body.style.top = "";
      window.scrollTo(0, navLockY);
    };

    toggle.setAttribute("aria-expanded", "false");
    const setDrawer = (open) => {
      if (open) {
        siteHeaderEl?.classList.remove("is-header-hidden");
        document.documentElement.classList.remove("header-is-hidden");
        syncDrawerOffset();
        lockScroll();
      } else {
        unlockScroll();
      }
      drawer.classList.toggle("open", open);
      backdrop?.classList.toggle("is-on", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
      document.documentElement.classList.toggle("nav-open", open);
      siteHeaderEl?.classList.toggle("is-open", open);
      requestAnimationFrame(syncDrawerOffset);
    };
    const closeDrawer = () => setDrawer(false);
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      setDrawer(!drawer.classList.contains("open"));
    });
    backdrop?.addEventListener("click", closeDrawer);
    drawer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", closeDrawer);
    });
    drawer.querySelectorAll("[data-catalog-open]").forEach((btn) => {
      btn.addEventListener("click", closeDrawer);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
    document.addEventListener("click", (e) => {
      if (
        drawer.classList.contains("open") &&
        !drawer.contains(e.target) &&
        !toggle.contains(e.target) &&
        !backdrop?.contains(e.target)
      ) {
        closeDrawer();
      }
    });
    window.addEventListener(
      "resize",
      () => {
        // Match CSS: desktop inline nav from 901px up
        if (window.matchMedia("(min-width: 901px)").matches) closeDrawer();
        else if (drawer.classList.contains("open")) syncDrawerOffset();
      },
      { passive: true },
    );
  }

  // Smart Sticky header: hide on scroll down, show on scroll up + compact glass
  const siteHeader = document.querySelector(".site-header");
  if (siteHeader) {
    let ticking = false;
    let lastY = Math.max(0, window.scrollY || 0);
    let hidden = false;
    const hideAfter = 72;
    const deltaMin = 6;
    const prefersReduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isMobileNav = () =>
      window.matchMedia("(max-width: 900px)").matches;
    const drawerOpen = () =>
      document.body.classList.contains("nav-open") ||
      siteHeader.classList.contains("is-open");

    const syncHeaderHeight = () => {
      const rect = siteHeader.getBoundingClientRect();
      const shell = siteHeader.querySelector(".header-shell") || siteHeader;
      const h = Math.ceil(shell.getBoundingClientRect().height);
      const full = Math.ceil(rect.height);
      const bottom = Math.ceil(rect.bottom);
      if (h > 0) {
        document.documentElement.style.setProperty("--header-h-v36", `${h}px`);
      }
      // While mobile drawer is open, pin offset to header bottom in the viewport
      if (drawerOpen() && isMobileNav()) {
        document.documentElement.style.setProperty(
          "--site-header-offset",
          `${Math.max(48, bottom)}px`,
        );
        return;
      }
      if (full > 0) {
        document.documentElement.style.setProperty(
          "--site-header-offset",
          `${hidden && !isMobileNav() ? 0 : Math.max(full, bottom)}px`,
        );
      }
    };

    const setHidden = (next) => {
      if (hidden === next) return;
      hidden = next;
      siteHeader.classList.toggle("is-header-hidden", hidden);
      document.documentElement.classList.toggle("header-is-hidden", hidden);
      syncHeaderHeight();
    };

    const syncHeader = () => {
      const y = Math.max(0, window.scrollY || 0);
      const scrolled = y > 8;
      siteHeader.classList.toggle("is-scrolled", scrolled);
      siteHeader.classList.toggle("is-compact", scrolled);

      if (drawerOpen() || prefersReduce) {
        setHidden(false);
      } else if (isMobileNav()) {
        // Mobile: keep header available (search/profile); only compact
        setHidden(false);
      } else if (y <= hideAfter) {
        setHidden(false);
      } else if (y - lastY > deltaMin) {
        setHidden(true);
      } else if (lastY - y > deltaMin) {
        setHidden(false);
      }

      lastY = y;
      syncHeaderHeight();
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
    window.addEventListener(
      "resize",
      () => {
        setHidden(false);
        syncHeaderHeight();
      },
      { passive: true },
    );
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(syncHeaderHeight);
      ro.observe(siteHeader.querySelector(".header-shell") || siteHeader);
    }
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

  // Desktop/mobile consult dropdown (and any [data-nav-item])
  const navItems = Array.from(document.querySelectorAll("[data-nav-item]"));
  const closeAllNav = () => {
    navItems.forEach((item) => {
      item.classList.remove("is-open");
      item.querySelector("[data-nav-trigger]")?.setAttribute("aria-expanded", "false");
    });
  };
  navItems.forEach((item) => {
    const trigger = item.querySelector("[data-nav-trigger]");
    if (!trigger) return;
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const open = !item.classList.contains("is-open");
      closeAllNav();
      item.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    if (item.hasAttribute("data-consult") && finePointer) {
      let leaveTimer = 0;
      item.addEventListener("mouseenter", () => {
        window.clearTimeout(leaveTimer);
        closeAllNav();
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      });
      item.addEventListener("mouseleave", () => {
        leaveTimer = window.setTimeout(() => {
          item.classList.remove("is-open");
          trigger.setAttribute("aria-expanded", "false");
        }, 160);
      });
    }
  });
  document.addEventListener("click", (e) => {
    if (!navItems.some((item) => item.contains(e.target))) closeAllNav();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllNav();
  });

  // Mobile drawer accordion for education
  document.querySelectorAll("[data-drawer-sub]").forEach((block) => {
    const btn = block.querySelector("[data-drawer-sub-toggle]");
    btn?.addEventListener("click", () => {
      const open = !block.classList.contains("is-open");
      block.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  // Paytakht-style announcements dropdown
  document.querySelectorAll("[data-announce]").forEach((wrap) => {
    const btn = wrap.querySelector("[data-announce-toggle]");
    const panel = wrap.querySelector("[data-announce-panel]");
    if (!btn || !panel) return;
    const setOpen = (open) => {
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    };
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(panel.hidden);
    });
    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
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

    document.querySelectorAll(".edu-grid, .faq").forEach((group) => {
      const kids = group.querySelectorAll(":scope > .edu-card, :scope > details");
      if (!kids.length) return;
      gsap.fromTo(
        kids,
        { opacity: 0, y: 28, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.75,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: group, start: "top 88%", once: true },
        },
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
        title: "منوی برنامه‌ریزی",
        text: "همه‌چیز یک‌جا: منابع، اهداف، برنامه‌سازی، ثبت انجام، آمار و فروشگاه — بلوک با برنامه بچین.",
      },
      {
        title: "برنامه‌سازی پیشرفته و مدرن",
        text: "عنوان، منبع، صفحات و بازهٔ ساعت را دقیق می‌چینی؛ پیش‌نمایش زنده قبل از ثبت بلوک.",
      },
      {
        title: "همیشه در حال پیشرفت",
        text: "از Day Off و دستاورد تا هوش بلوک، مشاوره، چالش و ترکر رفتار — بلوک خسته نمی‌شود.",
      },
      {
        title: "مینی بلوک‌ساز",
        text: "سریع و سبک: نام منبع، حجم صفحه و تست، ساعت مطالعه و رنگ بلوک — دیگه از این راحت‌تر؟",
      },
      {
        title: "جبران هوشمند شکست‌ها",
        text: "ثبت‌های ناقص را هوشمند منتقل کن؛ انعطاف‌پذیر بمون و ناامید نشو.",
      },
      {
        title: "آمار پیشرفته و کاربردی",
        text: "بازه‌ها، میانگین روزانه، یادآور استراحت و گرید فعالیت — آمار و همه‌نوع نمودار.",
      },
      {
        title: "ثبت و انجام",
        text: "با کرنومتر یا ثبت دستی، زمان واقعی مطالعه را دقیق ثبت کن.",
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
    const screen =
      root.querySelector(".phone-screen") ||
      root.querySelector(".shot-frame") ||
      root.querySelector(".slides--shots");
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

  // In-page anchors (معرفی ما / #showcase) — offset for tall v36 header
  const scrollToHash = () => {
    const hash = (location.hash || "").replace(/^#/, "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    const header = document.querySelector(".site-header");
    const offset = (header?.getBoundingClientRect().height || 0) + 16;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };
  window.addEventListener("hashchange", scrollToHash);
  window.addEventListener(
    "load",
    () => {
      if (location.hash) {
        requestAnimationFrame(() => requestAnimationFrame(scrollToHash));
      }
    },
    { once: true }
  );
  document.addEventListener("click", (e) => {
    const a = e.target instanceof Element ? e.target.closest('a[href="#showcase"]') : null;
    if (!a) return;
    const el = document.getElementById("showcase");
    if (!el) return;
    e.preventDefault();
    history.pushState(null, "", "#showcase");
    scrollToHash();
  });

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


  // Animate charts, timelines, and table polish on scroll
  const motionIO =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-inview");
              motionIO.unobserve(entry.target);
            });
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.2 },
        )
      : null;

  document.querySelectorAll(".chart-bars").forEach((box) => {
    box.querySelectorAll(".chart-fill").forEach((fill) => {
      const inline = fill.getAttribute("style") || "";
      const m = inline.match(/width\s*:\s*([\d.]+)%/i);
      if (m) {
        fill.style.setProperty("--w", `${m[1]}%`);
        fill.style.width = reduceMotion ? `${m[1]}%` : "0%";
      }
    });
    if (reduceMotion) box.classList.add("is-inview");
    else if (motionIO) motionIO.observe(box);
    else box.classList.add("is-inview");
  });

  document.querySelectorAll(".timeline").forEach((tl) => {
    if (reduceMotion) tl.classList.add("is-inview");
    else if (motionIO) motionIO.observe(tl);
    else tl.classList.add("is-inview");
  });

  document
    .querySelectorAll(".edu-card, .feat-card, .feed-card, .callout, .faq details, .related-chip")
    .forEach((el, i) => {
      if (el.closest(".edu-grid") && window.gsap) return;
      el.classList.add("motion-rise");
      el.style.setProperty("--d", `${Math.min(i % 8, 7) * 70}ms`);
      if (reduceMotion) {
        el.classList.add("is-inview");
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) el.classList.add("is-inview");
      else if (motionIO) motionIO.observe(el);
      else el.classList.add("is-inview");
    });

  const watchComments = () => {
    document.querySelectorAll(".sc-item:not(.motion-rise)").forEach((el, i) => {
      el.classList.add("motion-rise");
      el.style.setProperty("--d", `${Math.min(i, 6) * 80}ms`);
      el.classList.add("is-inview");
    });
  };
  const armComments = () => {
    const root = document.querySelector("[data-site-comments]");
    if (!root || root.dataset.motionArmed === "1") return Boolean(root);
    root.dataset.motionArmed = "1";
    watchComments();
    if (window.MutationObserver) {
      new MutationObserver(watchComments).observe(root, { childList: true, subtree: true });
    }
    return true;
  };
  if (!armComments()) {
    const timer = window.setInterval(() => {
      if (armComments()) window.clearInterval(timer);
    }, 200);
    window.setTimeout(() => window.clearInterval(timer), 8000);
  }

  window.setTimeout(() => {
    document.querySelectorAll(".motion-rise:not(.is-inview)").forEach((el) => {
      el.classList.add("is-inview");
    });
  }, 1400);

  // Wrap naked steps-tables for mobile scroll polish
  document.querySelectorAll("table.steps-table").forEach((table) => {
    if (table.parentElement?.classList.contains("table-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });

  // Public article comments (bolokapp.ir → iraniplanner.ir)
  if (document.querySelector(".article-body")) {
    const src = document.querySelector('script[src*="app.js"]')?.getAttribute("src") || "";
    const ver = (src.match(/[?&]v=([^&]+)/) || [])[1] || "28";
    const base = src.replace(/[^/]*$/, "") || "";
    const s = document.createElement("script");
    s.src = `${base}comments.js?v=${ver}`;
    s.defer = true;
    document.head.appendChild(s);
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
