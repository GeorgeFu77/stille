import gsap from 'gsap';

/*
 * Page chrome: the header that recolors itself for whatever section sits
 * under it, the scroll progress bar, the full-screen index menu and the
 * custom cursor.
 */
export function initChrome(ctx) {
  initHeader(ctx);
  initMenu(ctx);
  if (!ctx.reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    initCursor();
  }
}

function initHeader(ctx) {
  const head = document.querySelector('[data-head]');
  const bar = document.querySelector('[data-progress]');
  if (!head) return;

  // The hero is sticky (its rect never leaves the top), so it is the fallback,
  // not a candidate.
  const zones = [...document.querySelectorAll('main > section[data-theme]:not(.hero), .foot[data-theme]')];
  const probe = () => head.offsetHeight / 2;
  let current = '';

  const update = () => {
    const y = probe();
    let theme = 'dark';
    for (const zone of zones) {
      const r = zone.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) {
        theme = zone.dataset.theme;
        break;
      }
    }
    if (theme !== current) {
      current = theme;
      head.dataset.on = theme;
    }
  };

  const setBar = bar ? gsap.quickSetter(bar, 'scaleX') : null;
  ctx.ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      setBar?.(self.progress);
      update();
    },
    onRefresh: update,
  });
  update();
}

function initMenu(ctx) {
  const root = document.documentElement;
  const menu = document.getElementById('menu');
  const openButton = document.querySelector('[data-menu-open]');
  const closeButton = document.querySelector('[data-menu-close]');
  if (!menu || !openButton || !closeButton) return;

  const links = [...menu.querySelectorAll('[data-menu-link]')];
  const names = links.map((link) => link.querySelector('.menu__name'));
  const extras = [...menu.querySelectorAll('.menu__top > *, .menu__foot > *')];
  const page = [document.querySelector('main'), document.querySelector('.foot'), document.querySelector('[data-head]')];
  let isOpen = false;
  let busy = false;
  let returnFocus = null;

  const setPageInert = (inert) => {
    for (const el of page) if (el) el.inert = inert;
  };

  const finishClose = (target) => {
    isOpen = false;
    busy = false;
    menu.hidden = true;
    root.classList.remove('menu-open');
    openButton.setAttribute('aria-expanded', 'false');
    setPageInert(false);
    ctx.lenis?.start();

    const destination = target ? document.querySelector(target) : null;
    if (destination) {
      // keep keyboard focus travelling WITH the navigation, not reset to body
      destination.setAttribute('tabindex', '-1');
      destination.focus({ preventScroll: true });
      if (ctx.lenis) ctx.lenis.scrollTo(destination, { duration: 1.4 });
      else destination.scrollIntoView({ behavior: ctx.reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', target);
    } else {
      returnFocus?.focus({ preventScroll: true });
    }
  };

  const open = () => {
    if (isOpen || busy) return;
    isOpen = true;
    returnFocus = document.activeElement;
    menu.hidden = false;
    root.classList.add('menu-open');
    openButton.setAttribute('aria-expanded', 'true');
    ctx.lenis?.stop();
    setPageInert(true);
    closeButton.focus({ preventScroll: true });

    gsap.killTweensOf([menu, ...names, ...extras]);
    if (ctx.reduceMotion) {
      gsap.set(menu, { clipPath: 'none' });
      return;
    }
    gsap
      .timeline()
      .fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.inOut' })
      .fromTo(names, { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.05, ease: 'expo.out' }, 0.32)
      .fromTo(extras, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.04 }, 0.5);
  };

  const close = (target = null) => {
    if (!isOpen || busy) return;
    busy = true;
    if (ctx.reduceMotion) {
      finishClose(target);
      return;
    }
    gsap.killTweensOf([menu, ...names, ...extras]);
    gsap
      .timeline({ onComplete: () => finishClose(target) })
      .to(names, { yPercent: -110, duration: 0.4, stagger: 0.02, ease: 'power3.in' })
      .to(extras, { autoAlpha: 0, duration: 0.25 }, 0)
      .to(menu, { clipPath: 'inset(100% 0 0% 0)', duration: 0.7, ease: 'expo.inOut' }, 0.2);
  };

  openButton.addEventListener('click', open);
  closeButton.addEventListener('click', () => close());
  for (const link of links) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      close(link.getAttribute('href'));
    });
  }

  document.addEventListener('keydown', (event) => {
    if (!isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [closeButton, ...links, ...menu.querySelectorAll('.menu__foot a')];
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

function initCursor() {
  const head = document.querySelector('[data-head]');
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span class="cursor__dot"><span class="cursor__label"></span></span>';
  document.body.appendChild(cursor);
  document.documentElement.classList.add('has-cursor');

  const label = cursor.querySelector('.cursor__label');
  const moveX = gsap.quickTo(cursor, 'x', { duration: 0.22, ease: 'power3.out' });
  const moveY = gsap.quickTo(cursor, 'y', { duration: 0.22, ease: 'power3.out' });
  let seen = false;

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'touch') return;
      if (!seen) {
        seen = true;
        gsap.set(cursor, { x: event.clientX, y: event.clientY });
      }
      moveX(event.clientX);
      moveY(event.clientY);
      cursor.classList.add('is-visible');

      const target = event.target instanceof Element ? event.target : null;
      const hot = target?.closest('a, button, [data-cursor]');
      const text = hot?.dataset.cursor || '';
      cursor.classList.toggle('is-hot', Boolean(hot));
      cursor.classList.toggle('has-label', Boolean(text));
      if (text && label.textContent !== text) label.textContent = text;

      const onOrange =
        target?.closest('[data-theme="orange"], .menu, .builds__outro-link, .card--orange') ||
        (target?.closest('.head__cta') && head?.dataset.on !== 'orange');
      cursor.classList.toggle('on-orange', Boolean(onOrange));
    },
    { passive: true },
  );

  const hide = () => cursor.classList.remove('is-visible');
  window.addEventListener('blur', hide);
  document.documentElement.addEventListener('mouseleave', hide);
}
