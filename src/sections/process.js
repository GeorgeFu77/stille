import gsap from 'gsap';
import { rise } from './problem.js';

/*
 * Sticky cards stack up as you scroll; each one that gets covered sinks
 * back and darkens so the newest card always reads as "on top".
 */
export function initProcess(ctx) {
  const section = document.querySelector('.process');
  const cards = [...section.querySelectorAll('[data-card]')];
  rise([section.querySelector('.process__quote')], ctx);
  if (ctx.reduceMotion) return;

  cards.forEach((card, i) => {
    const next = cards[i + 1];
    const num = card.querySelector('.card__num');
    const art = card.querySelector('.card__art');

    gsap.from([num, art], {
      yPercent: 30,
      opacity: 0,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: card, start: 'top 75%', toggleActions: 'play none none reverse' },
    });

    if (!next) return;
    const depth = cards.length - 1 - i;
    gsap.to(card, {
      scale: 1 - 0.035 * depth,
      '--shade': 0.5,
      ease: 'none',
      scrollTrigger: {
        trigger: next,
        start: 'top bottom',
        // done the moment the next card reaches its own sticky line
        end: () => `top ${parseFloat(getComputedStyle(next).top)}px`,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  });
}
