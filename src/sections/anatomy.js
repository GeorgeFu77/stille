import gsap from 'gsap';
import { thread } from '../thread.js';

/*
 * 03 · Anatomy — the filmstrip.
 * Vertical scroll drives a horizontal strip of four component chapters:
 * a genuinely sequential story, which is what earns the horizontal move.
 * Illustrations ink themselves in as they reach center and un-ink as they
 * leave, fully reversible. Soft snap, never hijacked. Stacks on mobile.
 */
export function initAnatomy(ctx) {
  const section = document.querySelector('.s-anatomy');
  const track = section.querySelector('.film-track');
  const panels = [...section.querySelectorAll('.film-panel')];
  const currentLabel = section.querySelector('[data-film-current]');

  let activeIndex = -1;
  const setActive = (index) => {
    if (index === activeIndex) return;
    activeIndex = index;
    panels.forEach((panel, i) => panel.classList.toggle('is-current', i === index));
    if (currentLabel) currentLabel.textContent = String(index + 1).padStart(2, '0');
  };

  setActive(0);

  if (ctx.reduceMotion) {
    section.classList.add('is-static');
    const showThread = () => {
      thread.moveTo('lowThird');
      gsap.set(thread.P, { alpha: 0.5, dot: -1 });
    };
    ctx.ScrollTrigger.create({
      trigger: section,
      start: 'top 62%',
      end: 'bottom 38%',
      onEnter: showThread,
      onEnterBack: showThread,
      onLeave: () => gsap.set(thread.P, { alpha: 0 }),
      onLeaveBack: () => gsap.set(thread.P, { alpha: 0 }),
    });
    return; // static: all art already drawn in markup
  }

  const mm = gsap.matchMedia();

  mm.add('(min-width: 861px)', () => {
    const distance = () => track.scrollWidth - window.innerWidth;

    const xTween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + distance(),
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        snap: {
          snapTo: 1 / (panels.length - 1),
          duration: { min: 0.2, max: 0.5 },
          ease: 'power2.inOut',
          delay: 0.08,
        },
        onEnter: () => {
          thread.moveTo('lowThird');
          gsap.to(thread.P, { alpha: 0.5, duration: 0.4 });
        },
        onEnterBack: () => {
          thread.moveTo('lowThird');
          gsap.to(thread.P, { alpha: 0.5, duration: 0.4 });
        },
        onUpdate: (self) => {
          thread.P.dot = self.progress;
          section.style.setProperty('--film-progress', String(self.progress));
          setActive(Math.round(self.progress * (panels.length - 1)));
        },
        onLeave: () => {
          thread.P.dot = -1;
        },
        onLeaveBack: () => {
          thread.P.dot = -1;
        },
      },
    });

    for (const panel of panels) {
      const wires = panel.querySelectorAll('.wire');
      const copy = panel.querySelectorAll('.panel-title, .panel-lede, .panel-specs li, .panel-quote');
      const numeral = panel.querySelector('.panel-index');
      const art = panel.querySelector('.panel-art');

      gsap.set(wires, { drawSVG: '0%' });

      // ink in approaching center…
      gsap.to(wires, {
        drawSVG: '100%',
        stagger: 0.03,
        ease: 'none',
        scrollTrigger: {
          trigger: panel,
          containerAnimation: xTween,
          start: 'left 78%',
          end: 'center 52%',
          scrub: true,
        },
      });

      // …and un-ink leaving it (reverse the pen, reversible with scroll)
      gsap.fromTo(
        wires,
        { drawSVG: '0% 100%' },
        {
          drawSVG: '100% 100%',
          stagger: 0.03,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: {
            trigger: panel,
            containerAnimation: xTween,
            start: 'center 40%',
            end: 'right 18%',
            scrub: true,
          },
        },
      );

      gsap.from(copy, {
        autoAlpha: 0,
        y: 22,
        stagger: 0.05,
        ease: 'none',
        scrollTrigger: {
          trigger: panel,
          containerAnimation: xTween,
          start: 'left 85%',
          end: 'left 45%',
          scrub: true,
        },
      });

      // One focus curve owns opacity and scale for the panel's full crossing.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: panel,
            containerAnimation: xTween,
            start: 'left 100%',
            end: 'right 0%',
            scrub: true,
          },
        })
        .fromTo(
          panel,
          { autoAlpha: 0.3, scale: 0.965 },
          { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power2.out' },
        )
        .to(panel, { autoAlpha: 0.3, scale: 0.965, duration: 0.5, ease: 'power2.in' });

      gsap.fromTo(
        art,
        { xPercent: 5, rotation: 0.5 },
        {
          xPercent: -5,
          rotation: -0.5,
          ease: 'none',
          scrollTrigger: {
            trigger: panel,
            containerAnimation: xTween,
            start: 'left right',
            end: 'right left',
            scrub: true,
          },
        },
      );

      // oversized numeral drifts slower than the strip for depth
      gsap.fromTo(
        numeral,
        { xPercent: 14 },
        {
          xPercent: -14,
          ease: 'none',
          scrollTrigger: {
            trigger: panel,
            containerAnimation: xTween,
            start: 'left right',
            end: 'right left',
            scrub: true,
          },
        },
      );
    }

    return () => xTween.scrollTrigger?.kill();
  });

  mm.add('(max-width: 860px)', () => {
    // Stacked: each panel inks in once as it enters, no pin, native scroll.
    for (const panel of panels) {
      const wires = panel.querySelectorAll('.wire');
      const copy = panel.querySelectorAll('.panel-index, .panel-title, .panel-lede, .panel-specs li, .panel-quote');
      gsap.set(wires, { drawSVG: '0%' });
      gsap
        .timeline({ scrollTrigger: { trigger: panel, start: 'top 72%', once: true } })
        .from(copy, {
          autoAlpha: 0,
          y: 18,
          stagger: 0.045,
          duration: 0.65,
          ease: 'power3.out',
        })
        .to(
          wires,
          { drawSVG: '100%', stagger: 0.035, duration: 1, ease: 'power2.inOut' },
          0.12,
        );
    }
  });
}
