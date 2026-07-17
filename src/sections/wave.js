import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { thread } from '../thread.js';

/*
 * 01 · The First Wave — the flatline wakes up.
 * Scroll drives amplitude first, then frequency: scrub-linked motion that
 * explains the signal, not decoration. The copy gains font weight in sync
 * ("the text wakes up as the signal does"). Stats rewind if you scrub back.
 */
export function initWave(ctx) {
  const section = document.querySelector('.s-wave');
  const title = section.querySelector('.wave-title');
  const paras = [...section.querySelectorAll('.wave-p')];
  const stats = [...section.querySelectorAll('.stat-value')];
  const finals = stats.map((el) => el.textContent);

  if (ctx.reduceMotion) {
    const showWave = () => {
      thread.moveTo('heroLine');
      gsap.set(thread.P, { amp: 30, freq: 5.5, colorMix: 1, alpha: 0.85, spread: 1 });
    };
    ctx.ScrollTrigger.create({
      trigger: section,
      start: 'top 60%',
      end: 'bottom 40%',
      onEnter: showWave,
      onEnterBack: showWave,
      onLeave: () => gsap.set(thread.P, { amp: 0, speed: 0, colorMix: 0 }),
      onLeaveBack: () => {
        thread.moveTo('heroLine');
        gsap.set(thread.P, { amp: 0, colorMix: 0, alpha: 0.85 });
      },
    });
    return;
  }

  // Wave owns amplitude and speed through the handoff; reveal only owns alpha.
  ctx.ScrollTrigger.create({
    trigger: '.s-reveal',
    start: 'top 80%',
    onEnter: () => gsap.set(thread.P, { amp: 0, speed: 0, colorMix: 0 }),
    onLeaveBack: () => {
      thread.moveTo('heroLine');
      gsap.set(thread.P, {
        amp: window.innerWidth > 860 ? 34 : 26,
        speed: 1,
        colorMix: 1,
      });
    },
  });

  const mm = gsap.matchMedia();

  // Reveal-once: title and paragraphs arrive as masked lines / soft rises.
  const titleSplit = SplitText.create(title, { type: 'lines', mask: 'lines' });
  gsap.set(titleSplit.lines, { yPercent: 115 });
  gsap.to(titleSplit.lines, {
    yPercent: 0,
    duration: 0.9,
    stagger: 0.08,
    ease: 'power4.out',
    scrollTrigger: { trigger: section, start: 'top 60%', once: true },
  });

  mm.add('(min-width: 861px)', () => {
    const words = paras.flatMap((p) => SplitText.create(p, { type: 'words' }).words);
    // start legible: cold signal-blue at reading weight. The wake-up thickens
    // and warms each word to full white — never a fade up through grey.
    // Literal hexes only: GSAP can't interpolate a var() that resolves to
    // color-mix(), and tweens toward it collapse to black mid-flight.
    gsap.set(words, { fontVariationSettings: "'wght' 400", color: '#c9d5ff' });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=220%',
        pin: true,
        scrub: 0.4,
      },
    });

    // Phase 1 (0–40%): amplitude — the line comes alive, ice → signal
    tl.to(
      thread.P,
      { amp: 34, colorMix: 1, speed: 1.0, duration: 0.4, ease: 'power2.inOut' },
      0,
    )
      // words gain weight with the amplitude, sweeping across the copy
      .to(
        words,
        {
          fontVariationSettings: "'wght' 560",
          color: '#e9eef6',
          duration: 0.32,
          stagger: { each: 0.35 / words.length },
          ease: 'none',
        },
        0.02,
      )
      // Phase 2 (40–100%): frequency rises
      .to(thread.P, { freq: 6.5, duration: 0.6, ease: 'power1.inOut' }, 0.4)
      // Stats scramble in over the last third, tied to scroll (reversible)
      .to(
        stats,
        {
          duration: 0.25,
          stagger: 0.06,
          scrambleText: { text: (i) => finals[i], chars: '0123456789−.%', speed: 0.4 },
        },
        0.62,
      );

    return () => tl.scrollTrigger?.kill();
  });

  mm.add('(max-width: 860px)', () => {
    // No pin: each crossing reconstructs the wave or hero flatline explicitly.
    const wake = () => {
      thread.moveTo('heroLine');
      gsap.to(thread.P, {
        amp: 26,
        freq: 5.5,
        colorMix: 1,
        speed: 1,
        duration: 1.1,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };
    const sleep = () => {
      thread.moveTo('heroLine');
      gsap.to(thread.P, {
        amp: 0,
        freq: 3,
        colorMix: 0,
        speed: 0,
        duration: 0.55,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };
    const st = ctx.ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 45%',
      onEnter: wake,
      onEnterBack: wake,
      onLeaveBack: sleep,
    });
    return () => st.kill();
  });
}
