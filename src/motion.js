import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/*
 * Shared motion grammar: page chrome, orientation, and the quieter reveals
 * that sit between the section-specific set pieces.
 */
export function initMotion(ctx) {
  const root = document.documentElement;
  const head = document.querySelector('.site-head');
  const progress = document.querySelector('.site-progress__bar');
  const hero = document.querySelector('.s-hero');
  const cue = hero?.querySelector('.scroll-cue');
  const sections = [...document.querySelectorAll('main > section')];

  const setProgress = (value) => {
    root.style.setProperty('--page-progress', String(value));
    progress?.style.setProperty('transform', `scaleX(${value})`);
  };

  ScrollTrigger.create({
    trigger: document.body,
    start: 0,
    end: () => ScrollTrigger.maxScroll(window),
    invalidateOnRefresh: true,
    onUpdate: (self) => setProgress(self.progress),
  });

  for (const section of sections) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 52%',
      end: 'bottom 48%',
      toggleClass: { targets: section, className: 'is-current' },
    });
  }

  if (ctx.reduceMotion) {
    gsap.set(head, { autoAlpha: 1 });
    return;
  }

  gsap.fromTo(
    head,
    { autoAlpha: 0, y: -18 },
    { autoAlpha: 1, y: 0, duration: 1, delay: 0.35 + (ctx.introDelay || 0), ease: 'power3.out' },
  );

  // The chrome gets out of the way while reading, then returns on an upward gesture.
  let headerHidden = false;
  ScrollTrigger.create({
    start: 80,
    end: () => ScrollTrigger.maxScroll(window),
    onUpdate(self) {
      const shouldHide = self.direction > 0 && self.scroll() > window.innerHeight * 0.45;
      if (shouldHide === headerHidden) return;
      headerHidden = shouldHide;
      gsap.to(head, {
        yPercent: shouldHide ? -120 : 0,
        duration: shouldHide ? 0.45 : 0.65,
        ease: shouldHide ? 'power2.in' : 'power3.out',
        overwrite: 'auto',
      });
    },
  });

  if (hero) {
    const heroCopy = hero.querySelectorAll('.hero-title, .hero-label');
    const heroSub = hero.querySelector('.hero-sub');
    gsap
      .timeline({
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.7,
        },
      })
      .to(heroCopy, { autoAlpha: 0, yPercent: -16, duration: 0.72, ease: 'none' }, 0.12)
      .to(heroSub, { autoAlpha: 0, yPercent: 32, duration: 0.55, ease: 'none' }, 0.2);

    const cueTween = gsap.to('.scroll-cue-tick', {
      backgroundPositionX: '12px',
      duration: 1.25,
      repeat: -1,
      ease: 'none',
    });

    window.addEventListener(
      'scroll',
      () => {
        cueTween.kill();
        gsap.killTweensOf(cue);
        gsap.to(cue, { autoAlpha: 0, y: 12, duration: 0.4, ease: 'power2.out' });
      },
      { passive: true, once: true },
    );
  }

  const wordmark = document.querySelector('[data-wordmark]');
  if (wordmark && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    wordmark.closest('.wordmark').addEventListener('pointerenter', () => {
      gsap.to(wordmark, {
        duration: 0.35,
        scrambleText: { text: 'STILLE', chars: '=−+≡', speed: 0.55 },
        ease: 'none',
        overwrite: true,
      });
    });
  }

  for (const eyebrow of document.querySelectorAll('.eyebrow')) {
    gsap.fromTo(
      eyebrow,
      { autoAlpha: 0, x: -14, '--rule-scale': 0 },
      {
        autoAlpha: 1,
        x: 0,
        '--rule-scale': 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: eyebrow, start: 'top 84%', once: true },
      },
    );
  }

  const quietTitles = document.querySelectorAll('.sweep-title, .material-title, .ledger-title');
  for (const title of quietTitles) {
    const split = SplitText.create(title, { type: 'lines', mask: 'lines' });
    gsap.from(split.lines, {
      yPercent: 112,
      rotate: 1.5,
      duration: 1,
      stagger: 0.07,
      ease: 'power4.out',
      scrollTrigger: { trigger: title, start: 'top 82%', once: true },
    });
  }

  gsap.from('.sweep-sub', {
    autoAlpha: 0,
    y: 20,
    duration: 0.8,
    stagger: 0.1,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.sweep-sub', start: 'top 84%', once: true },
  });

  gsap.from('.material-body > p', {
    autoAlpha: 0,
    y: 20,
    duration: 0.8,
    stagger: 0.12,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.material-body', start: 'top 82%', once: true },
  });
}
