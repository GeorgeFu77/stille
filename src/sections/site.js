import gsap from 'gsap';

/*
 * Pinned stage: the phone spins in, then holds one pose per feature while
 * its screen scrolls to the part being described. The feature windows here
 * line up with the pose keys in gl/phone.js.
 */
const WINDOWS = [
  [0.16, 0.35],
  [0.35, 0.55],
  [0.55, 0.76],
  [0.76, 1.01],
];

export function initSite(ctx) {
  const section = document.querySelector('.site');
  if (ctx.reduceMotion) return; // stays a plain, readable list
  section.classList.add('is-pinned');

  // three.js is the heaviest thing on the page: it streams in after first
  // paint while the stage is already pinned and waiting for it.
  let phone = null;
  import('../gl/phone.js')
    .then(({ createPhone }) => {
      phone = createPhone(section.querySelector('[data-phone-gl]'), ctx);
      phone.setProgress(tl.progress());
    })
    .catch((err) => console.warn('[stille] phone scene unavailable:', err));

  const pin = section.querySelector('[data-site-pin]');
  const intro = section.querySelector('[data-site-intro]');
  const features = [...section.querySelectorAll('[data-feature]')];
  const rail = section.querySelector('[data-site-progress]');
  const setRail = gsap.quickSetter(rail, 'scaleY');

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    onUpdate() {
      phone?.setProgress(tl.progress());
      setRail(tl.progress());
    },
  });

  tl.fromTo(intro, { yPercent: 0, autoAlpha: 1 }, { yPercent: -25, autoAlpha: 0, duration: 0.06 }, 0.1);
  features.forEach((feature, i) => {
    const [from, to] = WINDOWS[i];
    tl.fromTo(feature, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, from);
    tl.fromTo(
      feature.children,
      { y: 56, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.05, stagger: 0.007, ease: 'power3.out' },
      from,
    );
    if (to <= 1) {
      tl.to(feature.children, { y: -44, opacity: 0, duration: 0.035, stagger: 0.004, ease: 'power2.in' }, to - 0.045);
      tl.set(feature, { autoAlpha: 0 }, to);
    }
  });
  tl.set({}, {}, 1);

  ctx.ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=420%',
    pin,
    scrub: 0.7,
    anticipatePin: 1,
    animation: tl,
  });

  section.addEventListener('pointermove', (event) => {
    phone?.pointer((event.clientX / window.innerWidth - 0.5) * 2, (event.clientY / window.innerHeight - 0.5) * 2);
  });
  section.addEventListener('pointerleave', () => phone?.pointer(0, 0));
}
