import gsap from 'gsap';

// Count [data-count] numbers up from zero the first time they scroll in.
export function countUp(els, ctx) {
  if (ctx.reduceMotion) return;
  for (const el of els) {
    const end = Number(el.dataset.count);
    const state = { n: 0 };
    el.textContent = '0';
    gsap.to(state, {
      n: end,
      duration: 1.6,
      ease: 'power3.out',
      onUpdate: () => {
        el.textContent = Math.round(state.n);
      },
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  }
}
