import gsap from 'gsap';

/*
 * Instrument labels calibrate themselves: every mono label scrambles
 * into place once, the first time it enters view. Same glyph alphabet
 * as the loader, so the whole site speaks one signal language.
 */
const TARGETS = '.eyebrow, .hero-label, .panel-specs li, .finale-note, .foot-links a';
const GLYPHS = '=−+≡·';

export function initScrambleIn(ctx) {
  if (ctx.reduceMotion) return;

  for (const el of document.querySelectorAll(TARGETS)) {
    const original = el.textContent;
    if (!original.trim()) continue;
    gsap.to(el, {
      duration: 0.6,
      scrambleText: { text: original, chars: GLYPHS, speed: 0.9 },
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  }
}
