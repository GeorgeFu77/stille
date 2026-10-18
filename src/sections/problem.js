import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { countUp } from '../lib/count.js';

/*
 * The statement reads itself in word by word as you scroll, "dead pages"
 * gets struck through, and the serif answer rises in behind it.
 */
export function initProblem(ctx) {
  const section = document.querySelector('.problem');
  const title = section.querySelector('[data-scrub-words]');
  const strike = section.querySelector('[data-strike]');
  const alive = section.querySelector('[data-alive]');

  countUp([...section.querySelectorAll('[data-count]')], ctx);
  if (ctx.reduceMotion) return;

  const words = SplitText.create(title, { type: 'words', wordsClass: 'word' }).words;
  gsap.set(strike, { '--strike': 0 });

  gsap
    .timeline({
      scrollTrigger: { trigger: title, start: 'top 85%', end: 'bottom 35%', scrub: 0.6 },
    })
    .fromTo(words, { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: 'none' })
    .to(strike, { '--strike': 1, duration: 0.45, ease: 'power2.inOut' });

  const aliveChars = SplitText.create(alive, { type: 'words,chars', charsClass: 'char' }).chars;
  gsap.from(aliveChars, {
    yPercent: 90,
    opacity: 0,
    rotate: -8,
    duration: 1.1,
    ease: 'expo.out',
    stagger: 0.025,
    scrollTrigger: { trigger: alive, start: 'top 82%', toggleActions: 'play none none reverse' },
  });

  rise([...section.querySelectorAll('[data-rise]')], ctx);
}

// Shared "rise into place" for blocks of copy.
export function rise(els, ctx) {
  if (ctx.reduceMotion || !els.length) return;
  gsap.set(els, { opacity: 0 });
  ctx.ScrollTrigger.batch(els, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) =>
      gsap.fromTo(
        batch,
        { y: 48, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.1, overwrite: true },
      ),
  });
}
