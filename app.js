(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  // Nav drawer
  const drawer = document.querySelector("[data-nav-drawer]");
  const toggle = document.querySelector("[data-nav-toggle]");
  if (toggle && drawer) {
    toggle.addEventListener("click", () => drawer.classList.toggle("open"));
    drawer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => drawer.classList.remove("open"));
    });
  }

  // Progressive reveal: only hide when GSAP is actually available
  const enableMotionReveals = () => {
    if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray(".reveal, .reveal-blur").forEach((el) => {
      const blur = el.classList.contains("reveal-blur");
      gsap.from(el, {
        opacity: 0,
        y: 14,
        filter: blur ? "blur(6px)" : "none",
        duration: blur ? 0.85 : 0.65,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 92%",
          once: true,
        },
      });
    });
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
