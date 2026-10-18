/*
 * Poster type: scale each element's font-size so its text spans exactly
 * the width of its parent. Reads and writes are batched so a whole set
 * costs two layouts, not one per row.
 */
export function fit(els) {
  const items = els.map((el) => {
    const parent = el.parentElement;
    const style = getComputedStyle(parent);
    const target = parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    return { el, target };
  });
  for (const { el } of items) {
    el.style.fontSize = '100px';
    el.style.width = 'max-content';
  }
  for (const item of items) item.width = item.el.getBoundingClientRect().width;
  for (const { el, target, width } of items) {
    el.style.width = '';
    if (width > 0) el.style.fontSize = `${(100 * target) / width}px`;
  }
}

// Re-run `fn` after the viewport width settles (height-only changes, like a
// mobile URL bar collapsing, never reflow the poster type).
export function onWidthChange(fn) {
  let width = window.innerWidth;
  let timer = 0;
  window.addEventListener('resize', () => {
    if (window.innerWidth === width) return;
    width = window.innerWidth;
    clearTimeout(timer);
    timer = setTimeout(fn, 120);
  });
}
