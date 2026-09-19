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

  // Lenis
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    });
    if (!window.gsap) {
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
  }

  // GSAP reveals
  const runReveals = () => {
    const els = document.querySelectorAll(".reveal, .reveal-blur");
    if (!els.length) return;

    if (reduceMotion || !window.gsap) {
      els.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
        el.style.filter = "none";
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    gsap.utils.toArray(".reveal").forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
        },
      });
    });

    gsap.utils.toArray(".reveal-blur").forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
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
      tiltImg.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 14}deg)`;
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
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
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

  // Phone tilt + parallax chips
  const phoneTilt = document.querySelector("[data-phone-tilt]");
  const phone = phoneTilt?.querySelector(".phone");
  const stage = document.querySelector(".showcase-stage");
  if (phoneTilt && stage && finePointer && !reduceMotion) {
    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      phoneTilt.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 10}deg)`;
      stage.querySelectorAll("[data-parallax]").forEach((chip) => {
        const amount = Number(chip.getAttribute("data-parallax") || 0);
        chip.style.transform = `translate(${x * amount}px, ${y * amount * 0.6}px)`;
      });
    });
    stage.addEventListener("pointerleave", () => {
      phoneTilt.style.transform = "";
      stage.querySelectorAll("[data-parallax]").forEach((chip) => {
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

  const boot = () => runReveals();
  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
})();
