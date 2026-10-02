import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create("osmo", "0.625, 0.05, 0, 1");
CustomEase.create("energy", "M0,0 C0.32,0.72 0,1 1,1");

const motion = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T & Element>(sel)) as T[];

let lenis: Lenis | null = null;

/* ---------- Smooth scroll ---------- */

function initLenis() {
  lenis = new Lenis({ lerp: 0.11, anchors: { offset: -90 }, autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- Intro + hero ---------- */

function initIntro(hero: gsap.core.Timeline) {
  const intro = document.querySelector<HTMLElement>("[data-intro]");
  if (!intro) return hero.play();

  lenis?.stop();
  const word = intro.querySelector("[data-intro-word]")!;
  const split = SplitText.create(word, { type: "chars", mask: "chars" });

  gsap
    .timeline({
      defaults: { ease: "osmo" },
      onComplete: () => {
        intro.remove();
        lenis?.start();
      },
    })
    .from("[data-intro-bar]", { scaleX: 0, duration: 0.7 })
    .from(split.chars, { yPercent: 110, duration: 0.8, stagger: 0.04 }, "<0.1")
    .from("[data-intro-tag]", { autoAlpha: 0, y: 10, duration: 0.5 }, "-=0.4")
    .to(intro, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.9, ease: "osmo" }, "+=0.25")
    .add(() => {
      hero.play();
    }, "-=0.55");
}

function heroTimeline() {
  const tl = gsap.timeline({ paused: true, defaults: { ease: "osmo" } });
  tl.from("[data-hero-card]", {
    y: () => window.innerHeight * 0.6,
    rotate: (i) => [-25, 20, -10][i] ?? 0,
    duration: 1.3,
    stagger: 0.1,
  });
  tl.from("[data-hero-fade]", { autoAlpha: 0, y: 24, duration: 0.9, stagger: 0.08 }, 0.35);
  return tl;
}

/* ---------- Text ---------- */

function initSplits(hero: gsap.core.Timeline) {
  $$("[data-split]").forEach((el) => {
    const isHero = el.dataset.splitDelay === "intro";
    let played = false;
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line",
      autoSplit: true,
      // Re-splits on resize; only animate the first time.
      onSplit(self) {
        gsap.set(el, { visibility: "visible" });
        if (played) return;
        const vars: gsap.TweenVars = {
          yPercent: 110,
          duration: 1.1,
          stagger: 0.09,
          ease: "osmo",
          onComplete: () => void (played = true),
        };
        if (isHero) {
          const tween = gsap.from(self.lines, vars);
          hero.add(tween, 0.1);
          return tween;
        }
        return gsap.from(self.lines, { ...vars, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      },
    });
  });
}

function initReveals() {
  $$("[data-reveal]").forEach((el) => {
    gsap.set(el, { visibility: "visible" });
    gsap.from(el, {
      autoAlpha: 0,
      y: 28,
      duration: 0.9,
      ease: "osmo",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });

  $$("[data-stagger]").forEach((group) => {
    gsap.from($$("[data-stagger-item]", group), {
      autoAlpha: 0,
      y: 40,
      duration: 0.9,
      ease: "osmo",
      stagger: 0.08,
      scrollTrigger: { trigger: group, start: "top 85%", once: true },
    });
  });
}

function initFill() {
  $$("[data-fill]").forEach((el) => {
    const split = SplitText.create(el, { type: "chars" });
    gsap.fromTo(
      split.chars,
      { color: "#3a3936" },
      {
        color: "#ffffff",
        stagger: 0.08,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 45%", scrub: true },
      },
    );
  });
}

/* ---------- Playful bits ---------- */

function initPlop(hero: gsap.core.Timeline) {
  $$("[data-plop]").forEach((el) => {
    const tween = gsap.from(el, {
      scale: 0,
      rotate: -25,
      y: "-3em",
      duration: 1,
      ease: "elastic.out(1, 0.72)",
      paused: true,
    });
    if (el.dataset.plopDelay === "intro") hero.add(() => tween.play(), 0.9);
    else ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => tween.play() });
  });
}

function initButtons() {
  if (!finePointer) return;
  $$("[data-button]").forEach((btn) => {
    const text = btn.querySelector("[data-button-text]");
    if (!text) return;
    const split = SplitText.create(text, { type: "chars", charsClass: "split-char" });
    gsap.set(split.chars, { display: "inline-block", transformOrigin: "center" });
    const tl = gsap.timeline({ paused: true }).to(split.chars, {
      keyframes: {
        "0%": { yPercent: 0, scaleY: 1, rotate: 0 },
        "20%": { yPercent: 55, scaleY: 0.3, rotate: 17, ease: "power2.in" },
        "100%": { yPercent: 0, scaleY: 1, rotate: 0, ease: "elastic.out(1,0.4)" },
      },
      duration: 0.725,
      stagger: { amount: 0.225 },
    });
    btn.addEventListener("mouseenter", () => tl.restart());
  });
}

function initMomentum() {
  if (!finePointer) return;
  $$("[data-momentum]").forEach((root) => {
    let prevX = 0;
    let prevY = 0;
    let velX = 0;
    let velY = 0;
    root.addEventListener("pointermove", (e) => {
      velX = e.clientX - prevX;
      velY = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
    });

    $$("[data-momentum-el]", root).forEach((el) => {
      const target = el.querySelector("[data-momentum-target]");
      if (!target) return;
      el.addEventListener("pointerenter", (e) => {
        const r = target.getBoundingClientRect();
        const offX = e.clientX - (r.left + r.width / 2);
        const offY = e.clientY - (r.top + r.height / 2);
        const torque = gsap.utils.clamp(-25, 25, (offX * velY - offY * velX) * 0.004);
        gsap
          .timeline({ overwrite: true })
          .to(target, {
            x: gsap.utils.clamp(-40, 40, velX * 2.2),
            y: gsap.utils.clamp(-40, 40, velY * 2.2),
            rotate: torque,
            duration: 0.35,
            ease: "power2.out",
          })
          .to(target, { x: 0, y: 0, rotate: 0, duration: 1.1, ease: "elastic.out(1, 0.45)" });
      });
    });
  });
}

function initMarquees() {
  $$("[data-marquee]").forEach((el, i) => {
    const track = el.querySelector("[data-marquee-track]");
    if (!track) return;
    const dir = i % 2 === 0 ? -1 : 1;
    const tween = gsap.fromTo(
      track,
      { xPercent: dir === -1 ? 0 : -50 },
      { xPercent: dir === -1 ? -50 : 0, duration: 28, ease: "none", repeat: -1 },
    );
    if (!motion) return tween.pause();

    // Speed up with scroll velocity, flip with direction
    let base = 1;
    lenis?.on("scroll", ({ velocity, direction }: Lenis) => {
      if (direction) base = direction;
      const boost = gsap.utils.clamp(-6, 6, velocity * 0.15);
      gsap.to(tween, { timeScale: base * (1 + Math.abs(boost)), duration: 0.3, overwrite: true });
    });
  });
}

/* ---------- Header + menu ---------- */

function initHeader() {
  const header = document.querySelector<HTMLElement>("[data-header]");
  if (!header) return;

  $$("[data-theme]").forEach((section) => {
    if (section === header) return;
    ScrollTrigger.create({
      trigger: section,
      start: "top 40px",
      end: "bottom 40px",
      onToggle: (self) => {
        if (self.isActive) header.dataset.headerTheme = section.dataset.theme;
      },
    });
  });

  let last = 0;
  const onScroll = (y: number) => {
    header.classList.toggle("is-hidden", y > 400 && y > last && !document.documentElement.classList.contains("menu-open"));
    last = y;
  };
  if (lenis) lenis.on("scroll", ({ scroll }: Lenis) => onScroll(scroll));
  else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
}

function initMenu() {
  const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const menu = document.querySelector<HTMLElement>("[data-menu]");
  if (!toggle || !menu) return;

  const set = (open: boolean) => {
    toggle.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    document.documentElement.classList.toggle("menu-open", open);
    if (open && motion) {
      gsap.from(menu, { y: -16, autoAlpha: 0, duration: 0.5, ease: "osmo" });
      gsap.from($$("a", menu), { yPercent: 60, autoAlpha: 0, stagger: 0.05, duration: 0.6, ease: "osmo" });
    }
  };
  toggle.addEventListener("click", () => set(menu.hasAttribute("hidden")));
  $$("[data-menu-link]", menu).forEach((a) => a.addEventListener("click", () => set(false)));
  window.addEventListener("keydown", (e) => e.key === "Escape" && !menu.hasAttribute("hidden") && set(false));
}

/* ---------- Sections ---------- */

function initToday() {
  const items = $$("[data-today-item]");
  if (!items.length) return;
  const tl = gsap.timeline({
    scrollTrigger: { trigger: "[data-today]", start: "top 70%", end: "bottom 35%", scrub: 0.6 },
  });
  items.forEach((li) => {
    tl.to(li.querySelector(".today-strike"), { scaleX: 1, ease: "none", duration: 1 });
    tl.to(li.querySelector(".today-text"), { color: "#a6a29b", duration: 0.3 }, "<0.7");
  });
}

function initJoin() {
  const buttons = $$<HTMLButtonElement>("[data-join]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.join;
      const on = btn.getAttribute("aria-pressed") !== "true";
      buttons
        .filter((b) => b.dataset.join === id)
        .forEach((b) => {
          b.setAttribute("aria-pressed", String(on));
          b.textContent = on ? "✓ JE DOET MEE" : "JOIN →";
        });
      if (!on || !motion) return;

      gsap.fromTo(btn, { scale: 0.8 }, { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      const r = btn.getBoundingClientRect();
      const plus = Object.assign(document.createElement("span"), { textContent: "+1", className: "plus-one" });
      Object.assign(plus.style, {
        position: "fixed",
        left: `${r.left + r.width / 2}px`,
        top: `${r.top}px`,
        zIndex: "60",
        color: "#e8461e",
        fontWeight: "900",
        pointerEvents: "none",
      });
      document.body.append(plus);
      gsap.fromTo(
        plus,
        { xPercent: -50, y: 0, scale: 0.5, autoAlpha: 1 },
        { y: -48, scale: 1.4, autoAlpha: 0, duration: 1, ease: "energy", onComplete: () => plus.remove() },
      );
    });
  });
}

function initMap() {
  const map = document.querySelector<HTMLElement>("[data-map]");
  if (!map) return;
  const spots = $$("[data-spot]", map);
  const inners = $$("[data-spot-inner]", map);
  const rows = $$("[data-spot-row]", map);
  const filters = $$<HTMLButtonElement>("[data-map-filter]", map);

  if (motion) {
    gsap.set(inners, { scale: 0 });
    ScrollTrigger.create({
      trigger: map,
      start: "top 70%",
      once: true,
      onEnter: () =>
        gsap.to(inners, { scale: 1, duration: 0.9, ease: "elastic.out(1, 0.6)", stagger: { each: 0.09, from: "random" } }),
    });
  }

  filters.forEach((btn) =>
    btn.addEventListener("click", () => {
      const value = btn.dataset.mapFilter!;
      filters.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      const match = (el: HTMLElement) => value === "alles" || el.dataset.when === value;

      spots.forEach((s, i) => {
        const show = match(s);
        s.classList.toggle("is-hidden", !show);
        gsap.to(inners[i], {
          scale: show ? 1 : 0,
          autoAlpha: show ? 1 : 0,
          duration: show ? 0.8 : 0.3,
          ease: show ? "elastic.out(1, 0.6)" : "power2.in",
          delay: show ? Math.random() * 0.15 : 0,
          overwrite: true,
        });
      });
      rows.forEach((r) => (r.hidden = !match(r)));
    }),
  );
}

function cycleActive(container: string, item: string, interval = 700) {
  const root = document.querySelector(container);
  if (!root) return;
  const items = $$(item, root);
  let i = 0;
  let timer: number | undefined;
  const tick = () => {
    items.forEach((el, j) => el.classList.toggle("is-active", j === i));
    i = (i + 1) % items.length;
  };
  ScrollTrigger.create({
    trigger: root,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      clearInterval(timer);
      if (self.isActive && motion) timer = window.setInterval(tick, interval);
    },
  });
  tick();
}

function initDeal() {
  const items = $$("[data-deal-item]");
  if (!items.length) return;
  gsap.from(items, {
    y: 160,
    rotate: (i) => [-8, 5, -4, 7][i % 4],
    autoAlpha: 0,
    duration: 1.1,
    ease: "elastic.out(1, 0.75)",
    stagger: 0.1,
    scrollTrigger: { trigger: "[data-deal]", start: "top 80%", once: true },
  });
}

function initRoute() {
  const card = document.querySelector("[data-route]");
  if (!card) return;
  const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: "top 75%", once: true } });
  tl.from($$("[data-route-row]", card), { x: 40, autoAlpha: 0, duration: 0.8, ease: "osmo", stagger: 0.08 });
  tl.from("[data-route-bar]", { scaleX: 0, duration: 1.4, ease: "osmo" }, 0.2);
  const count = card.querySelector<HTMLElement>("[data-count-to]");
  if (count) {
    const obj = { v: 0 };
    tl.to(obj, { v: Number(count.dataset.countTo), duration: 1.4, ease: "osmo", onUpdate: () => (count.textContent = String(Math.round(obj.v))) }, 0.2);
  }
}

function initFollow() {
  if (!finePointer) return;
  const list = document.querySelector<HTMLElement>("[data-follow]");
  const visual = list?.querySelector<HTMLElement>("[data-follow-visual]");
  if (!list || !visual) return;
  const imgs = $$("[data-follow-img]", visual);
  const xTo = gsap.quickTo(visual, "x", { duration: 0.6, ease: "power3" });
  const yTo = gsap.quickTo(visual, "y", { duration: 0.6, ease: "power3" });
  const rTo = gsap.quickTo(visual, "rotate", { duration: 0.8, ease: "power3" });
  let lastX = 0;

  list.addEventListener("pointermove", (e) => {
    const r = list.getBoundingClientRect();
    const x = e.clientX - r.left - visual.offsetWidth / 2;
    xTo(x);
    yTo(e.clientY - r.top - visual.offsetHeight / 2);
    rTo(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.8));
    lastX = e.clientX;
  });
  $$("[data-follow-item]", list).forEach((item) =>
    item.addEventListener("pointerenter", () => {
      imgs.forEach((img) => img.classList.toggle("is-active", img.dataset.followImg === item.dataset.followItem));
    }),
  );
  list.addEventListener("pointerenter", () => gsap.to(visual, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }));
  list.addEventListener("pointerleave", () => gsap.to(visual, { autoAlpha: 0, scale: 0.6, duration: 0.3 }));
}

function initTilt() {
  const stage = document.querySelector<HTMLElement>("[data-tilt]");
  const card = stage?.querySelector<HTMLElement>("[data-tilt-target]");
  if (!stage || !card) return;

  if (motion) {
    gsap.from(card, {
      rotationY: -50,
      rotationX: 20,
      y: 120,
      autoAlpha: 0,
      duration: 1.4,
      ease: "osmo",
      scrollTrigger: { trigger: stage, start: "top 80%", once: true },
    });
  }
  if (!finePointer) return;
  const rx = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power3" });
  const ry = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power3" });
  const section = stage.closest("section")!;
  section.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    const nx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
    const ny = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
    ry(nx * 30);
    rx(-ny * 25);
  });
  section.addEventListener("pointerleave", () => {
    rx(0);
    ry(0);
  });
}

function initWheel() {
  const wheel = document.querySelector("[data-wheel]");
  const progress = wheel?.querySelector<SVGCircleElement>("[data-wheel-progress]");
  if (!wheel || !progress) return;
  const len = progress.getTotalLength();
  gsap.set(progress, { strokeDasharray: len, strokeDashoffset: len });

  const tl = gsap.timeline({ scrollTrigger: { trigger: wheel, start: "top 75%", end: "bottom 45%", scrub: 0.6 } });
  tl.to(progress, { strokeDashoffset: 0, ease: "none" });

  if (motion) {
    gsap.from($$("[data-wheel-label]", wheel), {
      scale: 0,
      duration: 0.9,
      ease: "elastic.out(1, 0.6)",
      stagger: 0.12,
      scrollTrigger: { trigger: wheel, start: "top 75%", once: true },
    });
  }
}

function initFooterParallax() {
  const footer = document.querySelector("[data-footer-parallax]");
  if (!footer) return;
  const tl = gsap.timeline({
    scrollTrigger: { trigger: footer, start: "top bottom", end: "top top", scrub: 0.2 },
  });
  tl.fromTo("[data-footer-visual]", { yPercent: -35, scale: 1.15, rotate: 4 }, { yPercent: 0, scale: 1, rotate: 0, ease: "none" });
  tl.fromTo("[data-footer-inner]", { yPercent: -20 }, { yPercent: 0, ease: "none" }, 0);
}

/* ---------- Boot ---------- */

function boot() {
  initMenu();
  initJoin();
  initMap();

  if (!motion) {
    initHeader();
    initMarquees();
    initWheel();
    return;
  }

  initLenis();
  const hero = heroTimeline();
  initSplits(hero);
  initReveals();
  initFill();
  initPlop(hero);
  initButtons();
  initMomentum();
  initMarquees();
  initHeader();
  initToday();
  cycleActive("[data-steps]", "[data-step]", 800);
  cycleActive("[data-flow]", "[data-flow-item]", 650);
  initDeal();
  initRoute();
  initFollow();
  initTilt();
  initWheel();
  initFooterParallax();
  initIntro(hero);
}

document.fonts.ready.then(boot);
