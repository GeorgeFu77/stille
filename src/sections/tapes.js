import gsap from 'gsap';
import { velocity } from '../lib/velocity.js';

/*
 * Two marquee straps. Each idles at its own pace, speeds up with scroll
 * velocity, and both reverse when you scroll back up.
 */
export function initTapes(ctx) {
  const tapes = [...document.querySelectorAll('[data-tape]')];
  if (!tapes.length || ctx.reduceMotion) return;

  const strips = tapes.map((tape) => {
    const track = tape.querySelector('.tape__track');
    const unit = track.firstElementChild;
    // enough copies to cover the strap twice over, so the wrap is seamless
    const copies = Math.max(2, Math.ceil((tape.offsetWidth * 2) / unit.offsetWidth));
    for (let i = 1; i < copies; i++) track.appendChild(unit.cloneNode(true));
    return { track, unit, dir: Number(tape.dataset.tape), x: 0, set: gsap.quickSetter(track, 'x', 'px') };
  });

  let visible = true;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }, { rootMargin: '200px 0px' }).observe(document.querySelector('.tapes').parentElement.querySelector('.problem'));

  gsap.ticker.add((_, delta) => {
    if (!visible) return;
    const boost = 1 + Math.min(Math.abs(velocity.v) * 0.18, 9);
    for (const s of strips) {
      const w = s.unit.offsetWidth;
      s.x -= s.dir * velocity.dir * boost * delta * 0.06;
      s.x = ((s.x % w) - w) % w;
      s.set(s.x);
    }
  });
}
