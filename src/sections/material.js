import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

/*
 * 05 · Material — the Daylight Passage.
 * The calmest section on the page: a glacial theme crossing, slow parallax,
 * swatches whose sheen angle tracks the cursor like real brushed metal,
 * and one word-by-word quote. A page that knows when not to move.
 */
export function initMaterial(ctx) {
  const root = document.documentElement;
  const section = document.querySelector('.s-material');
  const swatches = [...section.querySelectorAll('.swatch')];
  const numeral = section.querySelector('.material-numeral');
  const quote = section.querySelector('.material-quote p');

  const setDaylight = (on) => {
    gsap.set(root, { '--daylight': on ? 1 : 0, '--grain-opacity': on ? 0.04 : 1 });
  };

  if (ctx.reduceMotion) {
    ctx.ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onEnter: () => setDaylight(true),
      onEnterBack: () => setDaylight(true),
      onLeave: () => setDaylight(false),
      onLeaveBack: () => setDaylight(false),
    });
    return;
  }

  gsap.fromTo(
    root,
    { '--daylight': 0 },
    {
      '--daylight': 1,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 30%', scrub: 0.5 },
    },
  );

  // grain dies early in the ramp — speckle over a half-pale ground is what
  // makes the crossing read as noise
  gsap.fromTo(
    root,
    { '--grain-opacity': 1 },
    {
      '--grain-opacity': 0.04,
      ease: 'power2.out',
      scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 30%', scrub: 0.5 },
    },
  );

  gsap.fromTo(
    root,
    { '--daylight': 1 },
    {
      '--daylight': 0,
      ease: 'none',
      immediateRender: false,
      scrollTrigger: { trigger: section, start: 'bottom 70%', end: 'bottom 20%', scrub: 0.5 },
    },
  );

  gsap.fromTo(
    root,
    { '--grain-opacity': 0.04 },
    {
      '--grain-opacity': 1,
      ease: 'power2.in',
      immediateRender: false,
      scrollTrigger: { trigger: section, start: 'bottom 70%', end: 'bottom 20%', scrub: 0.5 },
    },
  );

  // three layers, restrained: swatches drift slow, numeral drifts against them
  gsap.fromTo(
    section.querySelector('.swatches'),
    { y: 36 },
    {
      y: -36,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
    },
  );

  gsap.fromTo(
    section.querySelector('.material-title'),
    { y: 16 },
    {
      y: -16,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
    },
  );

  gsap.from(swatches, {
    autoAlpha: 0,
    y: 42,
    duration: 1.05,
    stagger: 0.14,
    ease: 'power3.out',
    scrollTrigger: { trigger: section.querySelector('.swatches'), start: 'top 82%', once: true },
  });
  gsap.fromTo(
    numeral,
    { yPercent: 10 },
    {
      yPercent: -10,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
    },
  );

  // quote arrives word by word, once
  const split = SplitText.create(quote, { type: 'words', mask: 'words' });
  gsap.set(split.words, { yPercent: 115 });
  gsap.to(split.words, {
    yPercent: 0,
    duration: 0.7,
    stagger: 0.028,
    ease: 'power3.out',
    scrollTrigger: { trigger: quote, start: 'top 78%', once: true },
  });

  // brushed metal answers the light: sheen angle recomputed from the cursor
  for (const swatch of swatches) {
    swatch.addEventListener('pointerdown', () => {
      const face = swatch.querySelector('.swatch-face');
      gsap.fromTo(face, { scale: 0.985 }, { scale: 1, duration: 0.5, ease: 'back.out(2)' });
    });
  }

  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (!finePointer) return;

  for (const swatch of swatches) {
    const face = swatch.querySelector('.swatch-face');
    const rx = gsap.quickTo(face, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(face, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    gsap.set(face, { transformPerspective: 700 });

    swatch.addEventListener('pointerenter', () => {
      gsap.to(swatch, { y: -7, duration: 0.55, ease: 'power3.out', overwrite: 'auto' });
      swatch.classList.add('is-lit');
    });

    swatch.addEventListener('pointermove', (e) => {
      const r = face.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      ry(nx * 6);
      rx(-ny * 6);
      face.style.setProperty('--sheen-x', `${50 + nx * 70}%`);
      face.style.setProperty('--sheen-y', `${50 + ny * 55}%`);
    });
    swatch.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
      swatch.classList.remove('is-lit');
      gsap.to(swatch, { y: 0, duration: 0.8, ease: 'elastic.out(1, 0.55)', overwrite: 'auto' });
      gsap.to(face, {
        '--sheen-x': '50%',
        '--sheen-y': '50%',
        duration: 0.9,
        ease: 'power2.out',
      });
    });
  }
}
