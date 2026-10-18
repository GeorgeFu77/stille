import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { fit, onWidthChange } from '../lib/fit.js';

/*
 * The close: poster-fitted "Let's build yours.", a magnetic call button,
 * and a footer wordmark whose letters lift toward the pointer.
 */
export function initFinale(ctx) {
  const title = document.querySelector('[data-finale-title]');
  const rows = [...title.querySelectorAll('[data-fit-row]')];
  const mark = document.querySelector('[data-foot-mark]');
  const markRow = mark.querySelector('[data-fit-row]');

  const layout = () => fit([...rows, markRow]);
  layout();
  onWidthChange(() => {
    layout();
    ctx.ScrollTrigger.refresh();
  });

  if (ctx.reduceMotion) return;

  const chars = SplitText.create(title, { type: 'words,chars', charsClass: 'char' }).chars;
  gsap.from(chars, {
    yPercent: 110,
    rotate: 6,
    opacity: 0,
    duration: 1.2,
    ease: 'expo.out',
    stagger: 0.035,
    scrollTrigger: { trigger: title, start: 'top 80%', toggleActions: 'play none none reverse' },
  });

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!finePointer) return;

  for (const el of document.querySelectorAll('[data-magnetic]')) {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.45)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.45)' });
    el.addEventListener('pointermove', (event) => {
      const r = el.getBoundingClientRect();
      xTo((event.clientX - (r.left + r.width / 2)) * 0.22);
      yTo((event.clientY - (r.top + r.height / 2)) * 0.4);
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  }

  const letters = SplitText.create(markRow, { type: 'chars', charsClass: 'char' }).chars;
  const lifts = letters.map((char) => gsap.quickTo(char, 'yPercent', { duration: 0.6, ease: 'power3.out' }));
  const foot = mark.closest('.foot');
  foot.addEventListener('pointermove', (event) => {
    letters.forEach((char, i) => {
      const r = char.getBoundingClientRect();
      const d = Math.abs(event.clientX - (r.left + r.width / 2)) / (r.width * 1.4);
      const lift = Math.max(0, 1 - d);
      lifts[i](-lift * 16);
      char.classList.toggle('is-lit', lift > 0.45);
    });
  });
  foot.addEventListener('pointerleave', () => {
    letters.forEach((char, i) => {
      lifts[i](0);
      char.classList.remove('is-lit');
    });
  });
}
