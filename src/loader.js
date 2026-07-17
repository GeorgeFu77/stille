import gsap from 'gsap';
import { thread } from './thread.js';

const INTRO_HANDOFF = 0.66;

export function initLoader(ctx) {
  const root = document.documentElement;
  const loader = document.querySelector('.boot-loader');

  if (!loader || ctx.reduceMotion || !root.classList.contains('has-loader')) {
    root.classList.remove('has-loader');
    return { active: false, introDelay: 0 };
  }

  const glyphs = loader.querySelector('.boot-loader__glyphs');
  const line = loader.querySelector('.boot-loader__line');
  const slot = document.querySelector('[data-thread-slot]');

  try {
    sessionStorage.setItem('stille-seen', '1');
  } catch {
    // Storage can be unavailable in strict privacy modes; the loader still completes.
  }

  thread.registerElement('heroLine', slot);
  thread.moveTo('heroLine');
  gsap.set(thread.P, { spread: 0 });

  const syncPosition = () => {
    const slotRect = slot.getBoundingClientRect();
    const sectionRect = slot.closest('.s-hero').getBoundingClientRect();
    loader.style.setProperty('--loader-y', `${slotRect.top - sectionRect.top + slotRect.height * 0.5}px`);
  };
  syncPosition();
  requestAnimationFrame(syncPosition);

  gsap.set(line, { scaleX: 0 });
  gsap.set(glyphs, { transformOrigin: 'center' });

  gsap
    .timeline({
      onComplete() {
        root.classList.remove('has-loader');
        loader.remove();
        ctx.ScrollTrigger.refresh();
      },
    })
    .to(glyphs, {
      duration: 0.62,
      scrambleText: { text: '− = + ≡ − = + ≡', chars: '−=+≡', speed: 0.55 },
      ease: 'none',
    })
    .to(glyphs, { scaleX: 0.45, scaleY: 0.02, duration: 0.14, ease: 'power2.in' }, 0.52)
    .to(line, { scaleX: 1, duration: 0.16, ease: 'power2.out' }, 0.52)
    .to(line, { backgroundColor: 'var(--ice)', boxShadow: 'none', duration: 0.08, ease: 'none' }, 0.58)
    .add(() => {
      const margin = Math.min(window.innerWidth * 0.12, 160);
      const fullWidth = Math.max(1, window.innerWidth - margin * 2);
      gsap.set(thread.P, { spread: Math.min(1, 220 / fullWidth) });
    }, INTRO_HANDOFF)
    .to(glyphs, { autoAlpha: 0, duration: 0.08 }, 0.63)
    .to(loader, { autoAlpha: 0, duration: 0.22, ease: 'power1.out' }, INTRO_HANDOFF);

  return { active: true, introDelay: INTRO_HANDOFF };
}
