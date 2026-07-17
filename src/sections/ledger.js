import gsap from 'gsap';

/*
 * 06 · The Ledger — the spec sheet as an editorial object.
 * The one place a classic reveal is used, and it is used once. Row hover
 * answers with information (a micro-diagram of the part), not decoration.
 * The finish chips refinish the casting site-wide via design tokens.
 */

// 72×72 micro-diagrams, one hairline glyph per spec family
const GLYPHS = {
  column: '<rect x="28" y="8" width="16" height="50" rx="6"/><line x1="22" y1="62" x2="50" y2="62"/>',
  driver: '<circle cx="36" cy="36" r="20"/><circle cx="36" cy="36" r="11"/><circle cx="36" cy="36" r="3"/>',
  crossover: '<line x1="12" y1="36" x2="60" y2="36"/><circle cx="12" cy="36" r="2.5"/><circle cx="60" cy="36" r="2.5"/>',
  curve: '<path d="M10 44 C 20 44 18 30 30 30 L 62 30" fill="none"/>',
  floor: '<line x1="10" y1="36" x2="62" y2="36"/><line x1="10" y1="46" x2="62" y2="46" stroke-dasharray="2 4"/>',
  thd: '<path d="M10 36 q 6 -10 13 0 t 13 0 t 13 0 t 13 0" fill="none"/>',
  sens: '<path d="M24 28 v 16 h 8 l 10 8 V 20 l -10 8 Z" fill="none"/><path d="M48 30 a 8 8 0 0 1 0 12" fill="none"/>',
  ohm: '<circle cx="36" cy="34" r="12" fill="none"/><line x1="28" y1="52" x2="44" y2="52"/>',
  power: '<path d="M38 14 L 26 40 h 10 l -4 18 L 46 30 h -10 Z" fill="none"/>',
  shell: '<path d="M26 60 V 20 a 10 10 0 0 1 20 0 v 40" fill="none"/><line x1="30" y1="56" x2="24" y2="62"/><line x1="36" y1="52" x2="28" y2="60"/>',
  plinth: '<rect x="20" y="30" width="32" height="8"/><rect x="16" y="46" width="40" height="10"/><line x1="36" y1="38" x2="36" y2="46" stroke-dasharray="2 3"/>',
  dims: '<rect x="24" y="14" width="24" height="44"/><line x1="14" y1="14" x2="14" y2="58"/><line x1="11" y1="14" x2="17" y2="14"/><line x1="11" y1="58" x2="17" y2="58"/>',
  mass: '<path d="M24 58 h 24 l -4 -28 h -16 Z" fill="none"/><path d="M30 30 a 6 6 0 0 1 12 0" fill="none"/>',
  finish: '<rect x="14" y="22" width="20" height="28"/><rect x="38" y="22" width="20" height="28" fill-opacity="0.25" fill="currentColor"/>',
  price: '<circle cx="36" cy="36" r="16" fill="none"/><line x1="36" y1="12" x2="36" y2="20"/><line x1="36" y1="52" x2="36" y2="60"/>',
};

export function initLedger(ctx) {
  const section = document.querySelector('.s-ledger');
  const rows = [...section.querySelectorAll('.ledger-table tr')];
  const diagram = section.querySelector('[data-ledger-diagram]');
  const table = section.querySelector('.ledger-table');
  const inner = section.querySelector('.ledger-inner');
  const chips = [...section.querySelectorAll('[data-finish-pick]')];
  const finishLabels = document.querySelectorAll('[data-finish-label]');

  // A roving radio group updates every representation of the casting.
  const pickFinish = (chip) => {
    const pick = chip.dataset.finishPick;
    document.documentElement.dataset.finish = pick;
    finishLabels.forEach((label) => { label.textContent = pick.toUpperCase(); });
    document.dispatchEvent(new CustomEvent('stille:finish', { detail: pick }));
    for (const c of chips) {
      c.setAttribute('aria-checked', String(c === chip));
      c.tabIndex = c === chip ? 0 : -1;
    }
    gsap.fromTo(chip, { scale: 0.94 }, { scale: 1, duration: 0.55, ease: 'back.out(2.4)' });
    gsap.fromTo(
      section,
      { '--finish-flash': 0.8 },
      { '--finish-flash': 0, duration: 1.1, ease: 'power2.out' },
    );
  };

  for (const chip of chips) {
    chip.tabIndex = chip.getAttribute('aria-checked') === 'true' ? 0 : -1;
    chip.addEventListener('click', () => pickFinish(chip));
    chip.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      const direction = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      const next = chips[(chips.indexOf(chip) + direction + chips.length) % chips.length];
      pickFinish(next);
      next.focus();
    });
  }

  if (!ctx.reduceMotion) {
    gsap.from(rows, {
      autoAlpha: 0,
      x: -10,
      y: 8,
      duration: 0.65,
      stagger: 0.055,
      ease: 'power2.out',
      scrollTrigger: { trigger: table, start: 'top 74%', once: true },
    });
  }

  // hover diagrams: desktop, real pointers only
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let current = null;
  const moveDiagram = gsap.quickTo(diagram, 'y', { duration: 0.45, ease: 'power3.out' });
  for (const row of rows) {
    const key = row.dataset.part;
    if (!key || !GLYPHS[key]) continue;

    row.addEventListener('pointerenter', () => {
      current = key;
      diagram.innerHTML =
        `<svg viewBox="0 0 72 72" fill="none" stroke="currentColor" stroke-width="1">${GLYPHS[key]}</svg>`;
      const rowRect = row.getBoundingClientRect();
      const innerRect = inner.getBoundingClientRect();
      const top = rowRect.top - innerRect.top + rowRect.height / 2 - 36;
      moveDiagram(top);
      diagram.style.color = 'rgba(91, 108, 255, 0.85)';
      row.classList.add('is-active');
      const marks = diagram.querySelectorAll('path, line, circle, rect');
      gsap.set(marks, { drawSVG: '0%' });
      gsap.fromTo(diagram, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.28, overwrite: true });
      gsap.to(marks, { drawSVG: '100%', duration: 0.42, stagger: 0.025, ease: 'power2.out' });
    });
    row.addEventListener('pointerleave', () => {
      if (current !== key) return;
      current = null;
      row.classList.remove('is-active');
      gsap.to(diagram, { autoAlpha: 0, duration: 0.2, overwrite: true });
    });
  }
}
