import gsap from 'gsap';

/*
 * First visit per session: a giant counter runs 0 → 100, the orange bar
 * fills, then the whole black sheet lifts off the hero like a shutter.
 * Returns when (in seconds from now) the hero should start its intro.
 */
const LIFT_AT = 1.75;

export function initLoader(ctx) {
  const root = document.documentElement;
  const loader = document.querySelector('.loader');

  if (!loader || ctx.reduceMotion || !root.classList.contains('has-loader')) {
    root.classList.remove('has-loader');
    loader?.remove();
    return { introDelay: 0.1 };
  }

  try {
    sessionStorage.setItem('stille-seen', '1');
  } catch {
    // Storage can be unavailable in strict privacy modes; the loader still completes.
  }

  ctx.lenis?.stop();
  const count = loader.querySelector('[data-loader-count]');
  const bar = loader.querySelector('[data-loader-bar]');
  const state = { n: 0 };

  gsap
    .timeline({
      onComplete() {
        root.classList.remove('has-loader');
        loader.remove();
        ctx.lenis?.start();
        ctx.ScrollTrigger.refresh();
      },
    })
    .to(state, {
      n: 100,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        count.textContent = Math.round(state.n);
      },
    })
    .to(bar, { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
    .to(loader, { yPercent: -100, duration: 1.05, ease: 'expo.inOut' }, LIFT_AT - 0.2)
    .to(loader.children, { yPercent: 60, duration: 1.05, ease: 'expo.inOut' }, LIFT_AT - 0.2);

  return { introDelay: LIFT_AT + 0.25 };
}
