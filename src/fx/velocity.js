import gsap from 'gsap';
import './velocity.css';

/*
 * Velocity physics — the page has mass. Scroll speed skews the content
 * wrappers a hair, splits the display type chromatically (violet one way,
 * cyan the other), and broadcasts itself so other layers can streak with it.
 * Everything springs back to rest the moment you stop.
 */

const SKEW_TARGETS =
  '.wave-inner, .reveal-inner, .sweep-inner, .material-inner, .ledger-inner, .finale-inner';
const CHROMA_TARGETS =
  '.hero-title, .wave-title, .reveal-title, .sweep-title, .material-title, .ledger-title, .finale-title';

export function initVelocity(ctx) {
  if (ctx.reduceMotion) return;

  const skewEls = [...document.querySelectorAll(SKEW_TARGETS)];
  const chromaEls = [...document.querySelectorAll(CHROMA_TARGETS)];
  const skews = skewEls.map((el) => {
    gsap.set(el, { transformOrigin: 'center center' });
    return gsap.quickTo(el, 'skewY', { duration: 0.5, ease: 'power3.out' });
  });

  let lastY = window.scrollY;
  let v = 0; // smoothed, px/frame-ish
  let lastChroma = -1;

  gsap.ticker.add(() => {
    if (document.hidden) return;
    const raw = ctx.lenis ? ctx.lenis.velocity : window.scrollY - lastY;
    lastY = window.scrollY;
    v += (raw - v) * 0.12;

    const av = Math.abs(v);
    if (av > 0.2) {
      document.dispatchEvent(new CustomEvent('stille:velocity', { detail: { v } }));
    }

    const skew = gsap.utils.clamp(-2.2, 2.2, v * 0.045);
    for (const to of skews) to(skew);

    const chroma = Math.min(6, av * 0.09);
    if (Math.abs(chroma - lastChroma) > 0.04) {
      lastChroma = chroma;
      const value = chroma.toFixed(2);
      for (const el of chromaEls) el.style.setProperty('--chroma', value);
    }
  });
}
