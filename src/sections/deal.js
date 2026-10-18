import gsap from 'gsap';
import { countUp } from '../lib/count.js';

export function initDeal(ctx) {
  const section = document.querySelector('.deal');
  countUp([...section.querySelectorAll('[data-count]')], ctx);
  if (ctx.reduceMotion) return;

  gsap.from(section.querySelectorAll('[data-row]'), {
    opacity: 0,
    x: 60,
    duration: 1,
    ease: 'expo.out',
    stagger: 0.06,
    scrollTrigger: { trigger: section.querySelector('.ledger'), start: 'top 80%', once: true },
  });
}
