import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { fit, onWidthChange } from '../lib/fit.js';
import { createEmber } from '../gl/ember.js';

const narrow = window.matchMedia('(max-width: 759px)');

export function initHero(ctx) {
  const hero = document.querySelector('.hero');
  const stage = hero.querySelector('[data-hero-stage]');
  const inner = hero.querySelector('.hero__inner');
  const title = hero.querySelector('[data-hero-title]');
  // queried live: SplitText rebuilds the title's children
  const rows = () => [...title.querySelectorAll('[data-fit-row]')];
  const chunks = () => [...title.querySelectorAll('[data-fit-chunk]')];
  const top = hero.querySelector('.hero__top');
  const foot = hero.querySelector('.hero__foot');

  // Desktop fits whole rows; phones break row one in two and fit every chunk.
  // Either way the block is capped so it never crowds the header or footer.
  const layout = () => {
    const units = narrow.matches ? chunks() : rows();
    for (const el of narrow.matches ? rows() : chunks()) el.style.fontSize = '';
    fit(units);
    const style = getComputedStyle(inner);
    const room =
      inner.clientHeight -
      parseFloat(style.paddingTop) -
      parseFloat(style.paddingBottom) -
      top.offsetHeight -
      foot.offsetHeight -
      Math.min(window.innerHeight * 0.06, 56);
    const height = title.offsetHeight;
    if (height > room && room > 0) {
      const k = room / height;
      for (const el of units) el.style.fontSize = `${parseFloat(el.style.fontSize) * k}px`;
    }
  };
  layout();
  onWidthChange(() => {
    layout();
    ctx.ScrollTrigger.refresh();
  });

  // words + chars: splitting chars alone clones empty copies of nested <em>s
  const split = SplitText.create(title, { type: 'words,chars', charsClass: 'char' });
  layout();
  gsap.set(title, { visibility: 'visible' });

  // ——— Heat field ———
  let ember = null;
  try {
    ember = createEmber(hero.querySelector('[data-hero-gl]'), ctx);
  } catch (err) {
    console.warn('[stille] hero shader unavailable:', err);
  }

  if (ctx.reduceMotion) return true;

  // ——— Intro ———
  const at = ctx.introDelay;
  gsap
    .timeline({ delay: at })
    .from(split.chars, {
      yPercent: 120,
      rotate: 7,
      opacity: 0,
      duration: 1.25,
      ease: 'expo.out',
      stagger: 0.028,
    })
    .from(top.children, { y: -12, opacity: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out' }, 0.35)
    .from(foot.children, { y: 26, opacity: 0, duration: 0.9, stagger: 0.09, ease: 'expo.out' }, 0.55);
  gsap.from(hero.querySelector('[data-hero-gl]'), { opacity: 0, duration: 2, ease: 'power2.out', delay: Math.max(0, at - 0.4) });

  // ——— Pointer: heat source + a little parallax on the type ———
  const titleX = gsap.quickTo(title, 'x', { duration: 1.2, ease: 'power3.out' });
  const titleY = gsap.quickTo(title, 'y', { duration: 1.2, ease: 'power3.out' });
  hero.addEventListener('pointermove', (event) => {
    ember?.pointer(event.clientX, event.clientY);
    if (event.pointerType !== 'mouse') return;
    titleX((event.clientX / window.innerWidth - 0.5) * -18);
    titleY((event.clientY / window.innerHeight - 0.5) * -10);
  });
  hero.addEventListener('pointerleave', () => {
    ember?.leave();
    titleX(0);
    titleY(0);
  });

  // ——— The next section slides over: hero sinks back and dims ———
  gsap
    .timeline({
      scrollTrigger: {
        trigger: '.problem',
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        onUpdate: (self) => ember?.setFade(self.progress),
        // fully covered: stop paying for the shader
        onLeave: () => ember?.setActive(false),
        onEnterBack: () => ember?.setActive(true),
      },
    })
    .to(stage, { scale: 0.86, borderRadius: '2.5rem', ease: 'none' }, 0)
    .to(rows()[0], { xPercent: -7, ease: 'none' }, 0)
    .to(rows()[1], { xPercent: 9, ease: 'none' }, 0)
    .to(rows()[2], { xPercent: -12, ease: 'none' }, 0)
    .to([top, foot], { opacity: 0, ease: 'none' }, 0);

  return true;
}
