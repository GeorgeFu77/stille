import gsap from 'gsap';
import { stage } from '../stage.js';

/*
 * Spin the Mono One — drag horizontally anywhere in the hero and the
 * 3D speaker turns with your hand, then coasts to rest on release.
 * The camera's own drift keeps breathing underneath.
 */
export function initSpin(ctx) {
  if (ctx.reduceMotion) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const hero = document.querySelector('.s-hero');
  if (!hero) return;

  const RAD_PER_PX = 0.006;
  let dragging = false;
  let lastX = 0;
  let velocity = 0;
  let coast = null;

  hero.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('a, button')) return;
    dragging = true;
    lastX = e.clientX;
    velocity = 0;
    coast?.kill();
    hero.setPointerCapture(e.pointerId);
  });

  hero.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    stage.P.spinOffset += dx * RAD_PER_PX;
    velocity = dx * RAD_PER_PX;
  });

  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    if (hero.hasPointerCapture?.(e.pointerId)) hero.releasePointerCapture(e.pointerId);
    // coast: carry the fling, settle like a real mass
    coast = gsap.to(stage.P, {
      spinOffset: stage.P.spinOffset + velocity * 22,
      duration: 1.4,
      ease: 'power3.out',
    });
  };
  hero.addEventListener('pointerup', release);
  hero.addEventListener('pointercancel', release);
}
