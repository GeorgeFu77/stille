import gsap from 'gsap';
import './cursor.css';

/*
 * FX · Custom cursor — a hard 6px dot that IS the pointer, and a hairline
 * ring that remembers where it was (~0.35s behind). Difference blending
 * keeps both legible over the void and the daylight passage.
 * Fine pointers only; under reduced motion the native cursor stays.
 */

const HOT = 'a, button, [data-cursor], .sweep-handle, .chip';

export function initCursor(ctx) {
  if (ctx.reduceMotion) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const root = document.createElement('div');
  root.className = 'fx-cursor';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="fx-cursor__trail">
      <span class="fx-cursor__ring"></span>
      <span class="fx-cursor__glyph fx-cursor__glyph--l">&lsaquo;</span>
      <span class="fx-cursor__glyph fx-cursor__glyph--r">&rsaquo;</span>
    </div>
    <span class="fx-cursor__dot"></span>
  `;
  document.body.appendChild(root);
  document.documentElement.classList.add('has-fx-cursor');

  const trail = root.querySelector('.fx-cursor__trail');
  const dot = root.querySelector('.fx-cursor__dot');

  gsap.set(dot, { xPercent: -50, yPercent: -50 });

  const dotX = gsap.quickSetter(dot, 'x', 'px');
  const dotY = gsap.quickSetter(dot, 'y', 'px');
  const trailX = gsap.quickTo(trail, 'x', { duration: 0.35, ease: 'power3' });
  const trailY = gsap.quickTo(trail, 'y', { duration: 0.35, ease: 'power3' });

  let seen = false;

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      dotX(e.clientX);
      dotY(e.clientY);
      if (!seen) {
        // first sighting: the ring wakes where the pointer is, not at 0,0
        seen = true;
        gsap.set(trail, { x: e.clientX, y: e.clientY });
      }
      trailX(e.clientX);
      trailY(e.clientY);
      root.classList.add('is-visible');

      const target = e.target instanceof Element ? e.target : null;
      root.classList.toggle('is-hot', Boolean(target?.closest(HOT)));
      root.classList.toggle('is-drag', Boolean(target?.closest('[data-cursor="drag"]')));
    },
    { passive: true },
  );

  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    gsap.fromTo(
      dot,
      { scale: 0.7 },
      { scale: 1, duration: 0.45, ease: 'back.out(2.4)', overwrite: 'auto' },
    );
  });

  const hide = () => root.classList.remove('is-visible');
  window.addEventListener('blur', hide);
  document.documentElement.addEventListener('mouseleave', hide);
}
