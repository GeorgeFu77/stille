import gsap from 'gsap';
import { velocity } from '../lib/velocity.js';
import { rise } from './problem.js';

/*
 * Wide screens: the section pins and the builds slide past sideways, each
 * one tilting up into place and leaning into the scroll speed.
 * Narrow screens and reduced motion: a plain vertical stack.
 */
export function initBuilds(ctx) {
  const section = document.querySelector('.builds');
  const pin = section.querySelector('[data-builds-pin]');
  const track = section.querySelector('[data-builds-track]');
  const builds = [...section.querySelectorAll('.build')];
  const mm = gsap.matchMedia();

  mm.add('(min-width: 800px) and (prefers-reduced-motion: no-preference)', () => {
    section.classList.add('is-horizontal');
    const distance = () => track.scrollWidth - window.innerWidth;

    const slide = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    for (const build of builds) {
      gsap.fromTo(
        build.querySelector('.build__screen'),
        { rotate: 6, yPercent: 10 },
        {
          rotate: 0,
          yPercent: 0,
          ease: 'none',
          scrollTrigger: { trigger: build, containerAnimation: slide, start: 'left right', end: 'center 55%', scrub: true },
        },
      );
      gsap.fromTo(
        build.querySelector('.mock__hero'),
        { xPercent: 8 },
        {
          xPercent: -4,
          ease: 'none',
          scrollTrigger: { trigger: build, containerAnimation: slide, start: 'left right', end: 'right left', scrub: true },
        },
      );
    }

    const skews = builds.map((build) => gsap.quickTo(build, 'skewX', { duration: 0.5, ease: 'power3.out' }));
    const lean = () => {
      const s = gsap.utils.clamp(-7, 7, -velocity.v * 0.14);
      for (const to of skews) to(s);
    };
    gsap.ticker.add(lean);

    return () => {
      gsap.ticker.remove(lean);
      section.classList.remove('is-horizontal');
      gsap.set(builds, { clearProps: 'transform' });
    };
  });

  mm.add('(max-width: 799px), (prefers-reduced-motion: reduce)', () => {
    rise(builds, ctx);
  });
}
