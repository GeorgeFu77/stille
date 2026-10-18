import gsap from 'gsap';

/*
 * One smoothed scroll velocity for the whole page (px per frame-ish).
 * Tapes speed up with it, big type leans into it, and everything
 * springs back to rest the moment scrolling stops.
 */
export const velocity = { v: 0, dir: 1 };

const SKEW_TARGETS = '.problem__title, .process__title, .deal__big, .finale__title, .builds__title';

export function initVelocity(ctx) {
  let lastY = window.scrollY;

  gsap.ticker.add(() => {
    const raw = ctx.lenis ? ctx.lenis.velocity : window.scrollY - lastY;
    lastY = window.scrollY;
    velocity.v += (raw - velocity.v) * 0.12;
    if (Math.abs(raw) > 0.5) velocity.dir = Math.sign(raw);
  });

  if (ctx.reduceMotion) return;

  const skews = [...document.querySelectorAll(SKEW_TARGETS)].map((el) =>
    gsap.quickTo(el, 'skewY', { duration: 0.5, ease: 'power3.out' }),
  );
  gsap.ticker.add(() => {
    const skew = gsap.utils.clamp(-4, 4, velocity.v * 0.07);
    for (const to of skews) to(skew);
  });
}
