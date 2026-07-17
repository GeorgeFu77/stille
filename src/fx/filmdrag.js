import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/Draggable';

/*
 * FX · Filmdrag — grab-and-fling for the anatomy strip.
 * A proxy Draggable on the viewport converts horizontal drag into real page
 * scroll, so the pin, snap, per-panel scrubs and thread stay one system.
 */
export function initFilmdrag(ctx) {
  const section = document.querySelector('.s-anatomy');
  if (!section) return;
  const viewport = section.querySelector('.film-viewport');
  const track = section.querySelector('.film-track');

  const pin = () => ScrollTrigger.getAll().find((t) => t.trigger === section && t.pin);

  const mm = gsap.matchMedia();

  mm.add('(min-width: 861px) and (pointer: fine)', () => {
    if (!pin()) return; // static layout (reduced motion): nothing to grab

    const proxy = document.createElement('div');
    let st = null;
    let ratio = 0;
    let startScroll = 0;

    const seek = (value) => {
      const v = gsap.utils.clamp(st.start, st.end, value);
      if (ctx.lenis) ctx.lenis.scrollTo(v, { immediate: true });
      else window.scrollTo(0, v);
    };

    const drag = Draggable.create(proxy, {
      type: 'x',
      trigger: viewport,
      inertia: !ctx.reduceMotion,
      onPress() {
        st = pin();
        if (!st) return;
        // pin geometry can shift on refresh — remap on every grab
        ratio = (st.end - st.start) / (track.scrollWidth - window.innerWidth);
        startScroll = st.scroll();
        gsap.set(proxy, { x: 0 });
        this.update();
        viewport.style.cursor = 'grabbing';
      },
      onDrag() {
        if (st) seek(startScroll - this.x * ratio);
      },
      onThrowUpdate() {
        if (st) seek(startScroll - this.x * ratio);
      },
      onRelease() {
        viewport.style.cursor = 'grab';
      },
    })[0];

    viewport.style.cursor = 'grab';

    return () => {
      drag.kill();
      viewport.style.cursor = '';
    };
  });
}
