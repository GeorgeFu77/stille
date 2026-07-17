import gsap from 'gsap';

const SECTION_META = {
  hero: ['00', 'THE HOOK'],
  wave: ['01', 'DEAD PAGES'],
  reveal: ['02', 'YOUR SITE'],
  anatomy: ['03', 'WHAT YOU GET'],
  sweep: ['04', 'CRAFT'],
  material: ['05', 'RECENT BUILDS'],
  ledger: ['06', 'THE DEAL'],
  finale: ['07', 'LET’S BUILD YOURS'],
};

export function initInterface(ctx) {
  const root = document.documentElement;
  const index = document.getElementById('site-index');
  const openButton = document.querySelector('[data-index-open]');
  const closeButton = document.querySelector('[data-index-close]');
  const indexLinks = [...document.querySelectorAll('[data-index-link]')];
  const main = document.querySelector('main');
  const footer = document.querySelector('.site-foot');
  const head = document.querySelector('.site-head');
  const indexHeadItems = index ? [...index.querySelectorAll('.site-index__head > *')] : [];
  const indexFootItems = index ? [...index.querySelectorAll('.site-index__foot > *')] : [];
  const indexItems = [...indexLinks, ...indexHeadItems, ...indexFootItems];

  initStoryHud(ctx);

  if (index && openButton && closeButton) {
    let isOpen = false;
    let isClosing = false;
    let returnFocus = null;

    const setPageInert = (inert) => {
      if (main) main.inert = inert;
      if (footer) footer.inert = inert;
      if (head) head.inert = inert;
    };

    const finishClose = (target) => {
      isOpen = false;
      isClosing = false;
      index.hidden = true;
      root.classList.remove('index-open');
      openButton.setAttribute('aria-expanded', 'false');
      setPageInert(false);
      ctx.lenis?.start();

      if (target) {
        const destination = document.querySelector(target);
        if (destination) {
          if (ctx.lenis) ctx.lenis.scrollTo(destination, { duration: 1.25 });
          else destination.scrollIntoView({ behavior: ctx.reduceMotion ? 'auto' : 'smooth' });
          history.replaceState(null, '', target);
        }
      } else {
        returnFocus?.focus({ preventScroll: true });
      }
    };

    const openIndex = () => {
      if (isOpen || isClosing) return;
      isOpen = true;
      returnFocus = document.activeElement;
      index.hidden = false;
      root.classList.add('index-open');
      openButton.setAttribute('aria-expanded', 'true');
      ctx.lenis?.stop();
      setPageInert(true);
      closeButton.focus({ preventScroll: true });

      gsap.killTweensOf([index, ...indexItems]);
      if (ctx.reduceMotion) {
        gsap.set(index, { autoAlpha: 1, clipPath: 'none' });
        gsap.set(indexItems, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.set(index, { autoAlpha: 1, clipPath: 'inset(0 0 100% 0)' });
      gsap.set(indexHeadItems, { autoAlpha: 0, y: 18 });
      gsap.set(indexLinks, { autoAlpha: 0, y: 34 });
      gsap.set(indexFootItems, { autoAlpha: 0, y: 10 });
      gsap
        .timeline()
        .to(index, { clipPath: 'inset(0 0 0% 0)', duration: 0.72, ease: 'power4.inOut' })
        .to(indexHeadItems, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.055, ease: 'power3.out' }, 0.34)
        .to(indexLinks, { autoAlpha: 1, y: 0, duration: 0.62, stagger: 0.045, ease: 'power4.out' }, 0.38)
        .to(indexFootItems, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.05 }, 0.62);
    };

    const closeIndex = (target = null) => {
      if (!isOpen || isClosing) return;
      isClosing = true;
      if (ctx.reduceMotion) {
        finishClose(target);
        return;
      }

      gsap.killTweensOf([index, ...indexItems]);
      gsap
        .timeline({ onComplete: () => finishClose(target) })
        .to(indexLinks, { autoAlpha: 0, y: -16, duration: 0.24, stagger: 0.018, ease: 'power2.in' })
        .to([...indexHeadItems, ...indexFootItems], { autoAlpha: 0, duration: 0.2 }, 0.08)
        .to(index, { clipPath: 'inset(100% 0 0 0)', duration: 0.58, ease: 'power4.inOut' }, 0.14);
    };

    openButton.addEventListener('click', openIndex);
    closeButton.addEventListener('click', () => closeIndex());
    for (const link of indexLinks) {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        closeIndex(link.getAttribute('href'));
      });
    }

    document.addEventListener('keydown', (event) => {
      if (!isOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeIndex();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = [closeButton, ...indexLinks];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  if (!ctx.reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    initSignalCursor(root);
  }
}

function initStoryHud(ctx) {
  const indexNode = document.querySelector('[data-story-index]');
  const nameNode = document.querySelector('[data-story-name]');
  if (!indexNode || !nameNode) return;

  let current = 'hero';
  const update = (key) => {
    if (key === current) return;
    current = key;
    const [number, name] = SECTION_META[key] || SECTION_META.hero;
    if (ctx.reduceMotion) {
      indexNode.textContent = number;
      nameNode.textContent = name;
      return;
    }
    gsap.to(indexNode, {
      duration: 0.28,
      scrambleText: { text: number, chars: '0123456789', speed: 0.45 },
      ease: 'none',
      overwrite: true,
    });
    gsap.to(nameNode, {
      duration: 0.36,
      scrambleText: { text: name, chars: '=−+≡ABCDEFGHIJKLMNOPQRSTUVWXYZ', speed: 0.5 },
      ease: 'none',
      overwrite: true,
    });
  };

  for (const section of document.querySelectorAll('main > section[data-section]')) {
    const key = section.dataset.section;
    ctx.ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 45%',
      onEnter: () => update(key),
      onEnterBack: () => update(key),
    });
  }

  // load-order races (scroll restoration, late pins) can leave the HUD lying —
  // resync to whatever section actually sits at viewport center
  const syncNow = () => {
    const mid = window.innerHeight * 0.5;
    for (const section of document.querySelectorAll('main > section[data-section]')) {
      const r = section.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) {
        update(section.dataset.section);
        break;
      }
    }
  };
  ctx.ScrollTrigger.addEventListener('refresh', syncNow);
  requestAnimationFrame(syncNow);
}

function initSignalCursor(root) {
  const cursor = document.querySelector('.signal-cursor');
  if (!cursor) return;

  root.classList.add('has-signal-cursor');
  gsap.set(cursor, { xPercent: -50, yPercent: -50 });
  const moveX = gsap.quickTo(cursor, 'x', { duration: 0.28, ease: 'power3.out' });
  const moveY = gsap.quickTo(cursor, 'y', { duration: 0.28, ease: 'power3.out' });

  window.addEventListener(
    'pointermove',
    (event) => {
      moveX(event.clientX);
      moveY(event.clientY);
      cursor.classList.add('is-visible');
      const target = event.target instanceof Element ? event.target : null;
      cursor.classList.toggle(
        'is-interactive',
        Boolean(target?.closest('a, button, [role="slider"], .swatch, .film-panel')),
      );
    },
    { passive: true },
  );
  window.addEventListener('pointerdown', () => cursor.classList.add('is-pressed'));
  window.addEventListener('pointerup', () => cursor.classList.remove('is-pressed'));
  window.addEventListener('blur', () => cursor.classList.remove('is-visible'));
  window.addEventListener('mouseout', (event) => {
    if (!event.relatedTarget) cursor.classList.remove('is-visible');
  });
}
