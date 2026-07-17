import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { thread } from '../thread.js';
import { grain } from '../grain.js';
import { audioState, soundFade } from '../audio.js';

/*
 * 07 · Return to Silence — the bookend.
 * The whole site was one breath of sound: the sine that woke in section 01
 * decays back to the hero's flatline under scroll, and the flatline's final
 * identity is the CTA underline. One magnetic button on the entire page.
 * If sound is still on, the last tone fades with the wave.
 */
export function initFinale(ctx) {
  const section = document.querySelector('.s-finale');
  const title = section.querySelector('.finale-title');
  const cta = section.querySelector('.finale-cta');
  const note = section.querySelector('.finale-note');

  thread.registerElement('ctaUnderline', cta);

  if (ctx.reduceMotion) {
    const showUnderline = () => {
      thread.moveTo('ctaUnderline');
      gsap.set(thread.P, { amp: 0, mixResponse: 0, colorMix: 0, alpha: 0.85, spread: 1, drawProgress: 1 });
    };
    ctx.ScrollTrigger.create({
      trigger: section,
      start: 'top 62%',
      end: 'bottom 38%',
      onEnter: showUnderline,
      onEnterBack: showUnderline,
      onLeaveBack: () => gsap.set(thread.P, { alpha: 0 }),
    });
    return;
  }

  const split = SplitText.create(title, { type: 'lines', mask: 'lines' });
  const ctaSplit = SplitText.create(cta, { type: 'chars' });
  gsap.set(split.lines, { yPercent: 115 });
  gsap.set([cta, note], { autoAlpha: 0, y: 14 });

  let faded = false;

  const build = (pin) =>
    gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: pin ? 'top top' : 'top 60%',
        end: pin ? '+=220%' : 'bottom bottom',
        pin,
        scrub: pin ? 0.5 : false,
        onEnter: () => {
          // the wave returns, alive, one last time
          thread.morph('viewportCenter', 'ctaUnderline');
          gsap.set(thread.P, {
            alpha: 0.85,
            amp: 26,
            freq: 6,
            colorMix: 1,
            mixResponse: 0,
            spread: 1,
            drawProgress: 1,
          });
          grain.pulse();
          if (audioState.enabled && !faded) {
            faded = true;
            soundFade(2.2); // the tone settles as the line does
          }
        },
        onLeaveBack: () => {
          gsap.set(thread.P, { alpha: 0, dot: -1 });
          faded = false;
        },
      },
    })
      .to(split.lines, { yPercent: 0, duration: 0.16, stagger: 0.03, ease: 'power3.out' }, 0.02)
      // the decay: amplitude first, then the last slow cycles flatten out
      .to(thread.P, { amp: 0, duration: 0.45, ease: 'power2.out' }, 0.1)
      .to(thread.P, { freq: 3, colorMix: 0, speed: 0.25, duration: 0.45, ease: 'power1.inOut' }, 0.1)
      // flatline settles under the CTA — its final identity
      .to(thread.P, { blend: 1, duration: 0.28, ease: 'power2.inOut' }, 0.56)
      .to(cta, { autoAlpha: 1, y: 0, duration: 0.18, ease: 'power2.out' }, 0.68)
      .to(note, { autoAlpha: 0.8, y: 0, duration: 0.16, ease: 'power2.out' }, 0.78);

  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const tl = build(true);
    return () => tl.scrollTrigger?.kill();
  });
  mm.add('(max-width: 860px)', () => {
    // no pin: the decay plays once, as a slow 3-second passage, on enter
    const tl = build(false);
    tl.duration(3.2);
    return () => tl.scrollTrigger?.kill();
  });

  // the one magnetic button on the site: 6px of gravity, spring release
  if (window.matchMedia('(pointer: fine)').matches) {
    const mx = gsap.quickTo(cta, 'x', { duration: 0.4, ease: 'power3.out' });
    const my = gsap.quickTo(cta, 'y', { duration: 0.4, ease: 'power3.out' });
    cta.addEventListener('pointermove', (e) => {
      const r = cta.getBoundingClientRect();
      mx(((e.clientX - r.left) / r.width - 0.5) * 12);
      my(((e.clientY - r.top) / r.height - 0.5) * 12);
    });
    cta.addEventListener('pointerleave', () => {
      gsap.to(cta, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
    });

    cta.addEventListener('pointerenter', () => {
      gsap.fromTo(
        ctaSplit.chars,
        { y: 0 },
        {
          y: (i) => (i % 2 ? -3 : -6),
          duration: 0.34,
          stagger: 0.018,
          yoyo: true,
          repeat: 1,
          ease: 'power2.out',
          overwrite: true,
        },
      );
    });
  }
}
