import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { thread } from '../thread.js';
import { grain } from '../grain.js';

/*
 * 00 · Threshold — the inhale.
 * Black, then the flatline draws in from center; the headline arrives as
 * masked lines after the signal loader hands off. The page hears first scroll.
 */
export function initHero(ctx) {
  const section = document.querySelector('.s-hero');
  const title = document.querySelector('.hero-title');
  const label = document.querySelector('.hero-label');
  const sub = document.querySelector('.hero-sub');
  const cue = document.querySelector('.scroll-cue');
  const threadSlot = document.querySelector('[data-thread-slot]');
  const aperture = section.querySelector('.hero-aperture');
  const apertureField = section.querySelector('[data-hero-aperture]');
  const apertureScan = section.querySelector('.hero-aperture__scan');
  const apertureOuter = section.querySelector('.hero-aperture__ring--outer');
  const apertureInner = section.querySelector('.hero-aperture__ring--inner');
  const axes = section.querySelectorAll('.hero-axis');

  thread.registerElement('heroLine', threadSlot);
  thread.moveTo('heroLine');

  if (ctx.reduceMotion) {
    gsap.set([title, label, sub, cue, aperture, axes], { visibility: 'visible' });
    gsap.set(apertureField, { autoAlpha: 0.62 });
    gsap.set(apertureScan, { scaleX: 1 });
    thread.moveTo('heroLine');
    gsap.set(thread.P, { amp: 0, colorMix: 0, alpha: 0.85, spread: 1, drawProgress: 1 });
    return;
  }

  // words, not lines: line-splitting bakes in whatever wrap existed at split
  // time — word masks let the browser re-wrap freely at any viewport
  const split = SplitText.create(title, { type: 'words,chars', mask: 'words' });

  const tl = gsap.timeline({ delay: ctx.introDelay || 0.2 });
  tl.set([title, label, sub, cue, aperture, axes], { visibility: 'visible' })
    .set(split.words, { yPercent: 115 })
    .set(split.chars, { autoAlpha: 0.16, fontVariationSettings: "'opsz' 144, 'wght' 220" })
    .set([label, sub, cue], { autoAlpha: 0, y: 10 })
    .set(axes, { autoAlpha: 0, y: 10 })
    // the flatline draws in from center — one breath in
    .to(thread.P, { spread: 1, duration: 1.15, ease: 'expo.out' }, 0)
    .fromTo(
      apertureField,
      { autoAlpha: 0, scale: 0.72, rotation: -8 },
      { autoAlpha: 0.72, scale: 1, rotation: 0, duration: 2.1, ease: 'power3.out' },
      0.02,
    )
    .to(apertureScan, { scaleX: 1, duration: 1.15, ease: 'expo.inOut' }, 0.12)
    .to(
      split.words,
      {
        yPercent: 0,
        duration: 1.0,
        stagger: 0.055,
        ease: 'power4.out',
      },
      0.1,
    )
    .to(
      split.chars,
      {
        autoAlpha: 1,
        fontVariationSettings: "'opsz' 144, 'wght' 380",
        duration: 0.72,
        stagger: 0.018,
        ease: 'power2.out',
      },
      0.14,
    )
    .to(label, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.65)
    .to(sub, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.82)
    .to(cue, { autoAlpha: 0.8, y: 0, duration: 0.6 }, 1.0)
    .to(axes, { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.08, ease: 'power2.out' }, 0.9);

  gsap.to(apertureOuter, {
    rotation: 48,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: 0.8 },
  });
  gsap.to(apertureInner, {
    rotation: -28,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: 0.8 },
  });

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const lineX = split.words.map((word) => gsap.quickTo(word, 'x', { duration: 0.9, ease: 'power3.out' }));
    const apertureX = gsap.quickTo(apertureField, 'x', { duration: 1.15, ease: 'power3.out' });
    const apertureY = gsap.quickTo(apertureField, 'y', { duration: 1.15, ease: 'power3.out' });

    section.addEventListener('pointermove', (event) => {
      const rect = section.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      lineX.forEach((setX, index) => setX(nx * (index % 2 ? -18 : 18)));
      apertureX(nx * -24);
      apertureY(ny * -18);
    }, { passive: true });
    section.addEventListener('pointerleave', () => {
      lineX.forEach((setX) => setX(0));
      apertureX(0);
      apertureY(0);
    });
  }

  // The page hears you: first scroll sends one pressure ripple down the grain.
  let pulsed = false;
  window.addEventListener(
    'scroll',
    () => {
      if (pulsed) return;
      pulsed = true;
      grain.pulse();
    },
    { passive: true, once: true },
  );

  // A hand pressed into still air.
  section.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button, input, select, textarea')) return;
    grain.ripple(e.clientX, e.clientY, 1);
  });
}
