(() => {
  const drawer = document.querySelector("[data-nav-drawer]");
  const toggle = document.querySelector("[data-nav-toggle]");
  if (toggle && drawer) {
    toggle.addEventListener("click", () => {
      drawer.classList.toggle("open");
    });
    drawer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => drawer.classList.remove("open"));
    });
  }

  const root = document.querySelector("[data-slider]");
  if (!root) return;

  const track = root.querySelector(".slides");
  const slides = Array.from(root.querySelectorAll(".slide"));
  const dotsWrap = root.querySelector(".dots");
  const prevBtn = root.querySelector("[data-prev]");
  const nextBtn = root.querySelector("[data-next]");
  let index = 0;
  let startX = 0;
  let deltaX = 0;
  let dragging = false;

  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "dot" + (i === 0 ? " active" : "");
    b.setAttribute("aria-label", `اسلاید ${i + 1}`);
    b.addEventListener("click", () => go(i));
    dotsWrap.appendChild(b);
  });

  const dots = () => Array.from(dotsWrap.querySelectorAll(".dot"));

  function go(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(${-index * 100}%)`;
    dots().forEach((d, di) => d.classList.toggle("active", di === index));
  }

  prevBtn?.addEventListener("click", () => go(index - 1));
  nextBtn?.addEventListener("click", () => go(index + 1));

  let timer = setInterval(() => go(index + 1), 5200);
  const resetTimer = () => {
    clearInterval(timer);
    timer = setInterval(() => go(index + 1), 5200);
  };

  const onStart = (x) => {
    dragging = true;
    startX = x;
    deltaX = 0;
    clearInterval(timer);
  };
  const onMove = (x) => {
    if (!dragging) return;
    deltaX = x - startX;
  };
  const onEnd = () => {
    if (!dragging) return;
    dragging = false;
    if (Math.abs(deltaX) > 48) {
      go(deltaX > 0 ? index - 1 : index + 1);
    }
    resetTimer();
  };

  track.addEventListener(
    "touchstart",
    (e) => onStart(e.touches[0].clientX),
    { passive: true },
  );
  track.addEventListener(
    "touchmove",
    (e) => onMove(e.touches[0].clientX),
    { passive: true },
  );
  track.addEventListener("touchend", onEnd);

  track.addEventListener("mousedown", (e) => onStart(e.clientX));
  window.addEventListener("mousemove", (e) => onMove(e.clientX));
  window.addEventListener("mouseup", onEnd);

  // RTL: first slide is on the right; translateX positive moves content visually left in LTR coords.
  // With dir=rtl on html, flex order starts from right; we still use % of track width.
  go(0);
})();
