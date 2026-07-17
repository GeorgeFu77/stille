import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { thread } from '../thread.js';

/*
 * 02 · Mono One — the set piece.
 * The speaker begins as an exploded technical drawing that inks itself in,
 * then the parts collapse into assembly under scroll while the wireframe
 * crossfades to the gradient-shaded solid: a launch-film hero shot, scrubbed.
 * Heavier parts land later; the camera fakes a slow push-in.
 */

// Each piece arrives on a slightly different axis so assembly has weight,
// while preserving the authored vertical exploded study.
const EXPLODE = {
  'g-driver': { x: 18, y: -246, rotation: -4 },
  'g-internals': { x: -12, y: 120, rotation: 1.4 },
  'g-shell': { x: 0, y: -50, rotation: -0.7 },
  'g-plinth': { x: 12, y: 170, rotation: 2.2 },
};

export function initReveal(ctx) {
  const section = document.querySelector('.s-reveal');
  const svg = section.querySelector('.speaker-stage svg');
  const aura = section.querySelector('.speaker-aura');
  const head = section.querySelector('.reveal-head');
  const title = section.querySelector('.reveal-title');

  // Head copy reveals once on approach regardless of the SVG's presence.
  if (!ctx.reduceMotion) {
    const split = SplitText.create(title, { type: 'lines', mask: 'lines' });
    gsap.set(split.lines, { yPercent: 115 });
    gsap.to(split.lines, {
      yPercent: 0,
      duration: 0.9,
      stagger: 0.08,
      ease: 'power4.out',
      scrollTrigger: { trigger: section, start: 'top 65%', once: true },
    });
  }

  if (!svg) return; // the drawing hasn't been cast yet

  const parts = Object.keys(EXPLODE)
    .map((id) => svg.querySelector('#' + id))
    .filter(Boolean);
  const wires = svg.querySelectorAll('.wire');
  const solids = svg.querySelectorAll('.solid');
  const labels = svg.querySelector('#g-labels');

  if (ctx.reduceMotion) {
    // Assembled, shaded, readable. The drawing stays as a ghost.
    gsap.set(wires, { opacity: 0.15 });
    gsap.set(solids, { opacity: 1 });
    if (labels) gsap.set(labels, { opacity: 0.3 });
    const hideThread = () => gsap.set(thread.P, { alpha: 0 });
    ctx.ScrollTrigger.create({
      trigger: section,
      start: 'top 62%',
      end: 'bottom 38%',
      onEnter: hideThread,
      onEnterBack: hideThread,
    });
    return;
  }

  gsap.set(solids, { opacity: 0 });
  gsap.set(wires, { drawSVG: '0%' });
  gsap.set(aura, { autoAlpha: 0, scale: 0.72 });
  if (labels) gsap.set(labels.querySelectorAll(':scope > *'), { opacity: 0 });
  for (const part of parts) {
    gsap.set(part, { ...EXPLODE[part.id], transformOrigin: '50% 50%' });
  }

  const mm = gsap.matchMedia();

  function buildTimeline(config) {
    const tl = gsap.timeline(config);

    // the Thread hands off: its line dims out as the leader lines ink in
    tl.to(thread.P, { alpha: 0, duration: 0.05, ease: 'none' }, 0)
      .to(aura, { autoAlpha: 0.72, scale: 1, duration: 0.42, ease: 'power2.out' }, 0.08)
      // wireframe draws itself — exploded view first
      .to(wires, { drawSVG: '100%', stagger: 0.012, duration: 0.28, ease: 'none' }, 0.02)
      .to(
        labels ? labels.querySelectorAll(':scope > *') : [],
        { opacity: 1, stagger: 0.015, duration: 0.1, ease: 'none' },
        0.16,
      )
      // collapse into assembly: light parts first, mass lands late
      .to(svg.querySelector('#g-driver'), { x: 0, y: 0, rotation: 0, duration: 0.34, ease: 'power2.inOut' }, 0.38)
      .to(svg.querySelector('#g-internals'), { x: 0, y: 0, rotation: 0, duration: 0.3, ease: 'power2.inOut' }, 0.42)
      .to(svg.querySelector('#g-shell'), { x: 0, y: 0, rotation: 0, duration: 0.38, ease: 'power3.inOut' }, 0.44)
      .to(svg.querySelector('#g-plinth'), { x: 0, y: 0, rotation: 0, duration: 0.4, ease: 'power3.inOut' }, 0.48)
      // wireframe becomes matter: gradients up, ink down to a ghost.
      // Labels leave entirely — their leaders are drawn for the exploded pose.
      .to(solids, { opacity: 1, duration: 0.3, ease: 'power1.inOut' }, 0.58)
      .to(wires, { opacity: 0.14, duration: 0.3, ease: 'power1.inOut' }, 0.6)
      .to(
        labels ? labels.querySelectorAll(':scope > *') : [],
        { opacity: 0, duration: 0.16, ease: 'none' },
        0.5,
      )
      .to(aura, { autoAlpha: 0.3, scale: 1.12, duration: 0.34, ease: 'power2.inOut' }, 0.64)
      // fake camera push-in across the whole pin
      .fromTo(
        svg,
        { scale: 0.86, rotation: -0.35 },
        { scale: 1, rotation: 0, duration: 1, ease: 'power1.inOut' },
        0,
      )
      .fromTo(head, { y: 32 }, { y: -34, duration: 1, ease: 'none' }, 0);

    return tl;
  }

  mm.add('(min-width: 861px)', () => {
    const tl = buildTimeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=260%',
        pin: true,
        scrub: 0.5,
      },
    });
    return () => tl.scrollTrigger?.kill();
  });

  mm.add('(max-width: 860px)', () => {
    // No pin: the assembly plays once, slowly, as the stage enters.
    const tl = buildTimeline({ paused: true }).duration(3.2);
    const st = gsap.timeline({
      scrollTrigger: {
        trigger: section.querySelector('.speaker-stage'),
        start: 'top 70%',
        once: true,
        onEnter: () => tl.play(),
      },
    });
    const threadBoundary = ctx.ScrollTrigger.create({
      trigger: section,
      start: 'top 80%',
      onEnter: () => gsap.to(thread.P, { alpha: 0, duration: 0.25, overwrite: 'auto' }),
      onEnterBack: () => gsap.set(thread.P, { alpha: 0 }),
      onLeaveBack: () => {
        thread.moveTo('heroLine');
        gsap.set(thread.P, { mixResponse: 0, drawProgress: 1, dot: -1 });
        gsap.to(thread.P, { alpha: 0.85, duration: 0.35, overwrite: 'auto' });
      },
    });
    return () => {
      st.scrollTrigger?.kill();
      threadBoundary.kill();
    };
  });
}
