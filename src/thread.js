import gsap from 'gsap';

/*
 * The Thread — one 1px waveform line that travels the whole page.
 * A fixed canvas draws a single polyline whose shape, position and color
 * are plain tweenable numbers on `thread.P`. Section modules scrub these
 * with their own ScrollTriggers; this file only resolves anchors and draws.
 */

const ICE = [233, 238, 246];
const SIGNAL = [91, 108, 255];

// Frequency-response silhouette: gentle bass shelf, flat mids, soft top rise.
// t: 0..1 across the span → offset in "dB" (positive = up on screen).
// Shared with the Sweep section — one curve, drawn and measured alike.
export function responseShape(t) {
  const rollOff = -6 * Math.exp(-Math.pow(t / 0.055, 1.6)); // low-end shelf
  const ripple = 0.35 * Math.sin(t * 19) * Math.exp(-t * 2.2); // bass ripple
  const top = 0.6 * Math.exp(-Math.pow((t - 0.97) / 0.05, 2)); // treble lift
  return rollOff + ripple + top;
}

export const thread = {
  P: {
    spread: 0,        // 0..1 draw from center outward (hero entrance)
    drawProgress: 1,  // 0..1 draw left → right (sweep curve)
    amp: 0,           // sine amplitude, px
    freq: 3,          // cycles across the span
    phase: 0,
    speed: 0,         // phase drift, rad/s — the line is "alive" when > 0
    mixResponse: 0,   // 0..1 morph sine → response curve
    colorMix: 0,      // 0 ice → 1 signal
    alpha: 0.85,
    width: 1,
    blend: 0,         // 0 = anchor `from`, 1 = anchor `to`
    dot: -1,          // 0..1 filmstrip progress dot; < 0 hidden
  },
  from: 'viewportCenter',
  to: 'viewportCenter',
  audio: { level: 0, freq: 0.5 },
  _els: {},
  redraw() {},

  registerElement(name, el) {
    this._els[name] = el;
  },

  // Anchors resolve to { x0, x1, y, h } in canvas px every frame.
  _resolve(name, w, h) {
    const margin = Math.min(w * 0.12, 160);
    switch (name) {
      case 'viewportCenter':
        return { x0: margin, x1: w - margin, y: h * 0.5, h: 0 };
      case 'heroLine': {
        const el = this._els.heroLine;
        if (!el) return { x0: margin, x1: w - margin, y: h * 0.6, h: 0 };
        const slotRect = el.getBoundingClientRect();
        const sectionRect = el.closest('.s-hero')?.getBoundingClientRect() || { top: 0 };
        return {
          x0: margin,
          x1: w - margin,
          y: slotRect.top - sectionRect.top + slotRect.height * 0.5,
          h: 0,
        };
      }
      case 'lowThird':
        return { x0: margin, x1: w - margin, y: h * 0.86, h: 0 };
      case 'offBottom':
        return { x0: margin, x1: w - margin, y: h * 1.12, h: 0 };
      case 'sweepPlot':
      case 'ctaUnderline': {
        const el = this._els[name];
        if (!el) return { x0: margin, x1: w - margin, y: h * 0.5, h: 0 };
        const r = el.getBoundingClientRect();
        if (name === 'ctaUnderline') {
          return { x0: r.left, x1: r.right, y: r.bottom + 4, h: 0 };
        }
        return { x0: r.left, x1: r.right, y: r.top + r.height * 0.42, h: r.height };
      }
      default:
        return { x0: margin, x1: w - margin, y: h * 0.5, h: 0 };
    }
  },

  moveTo(anchor) {
    this.from = anchor;
    this.to = anchor;
    this.P.blend = 0;
  },

  morph(fromAnchor, toAnchor) {
    this.from = fromAnchor;
    this.to = toAnchor;
    this.P.blend = 0;
  },
};

export function initThread(ctx) {
  const canvas = document.getElementById('thread');
  const c = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const P = thread.P;
  const N = 180;

  function draw(dt) {
    c.clearRect(0, 0, w, h);
    if (P.alpha < 0.01 || P.spread <= 0.001) return;

    P.phase += P.speed * dt;

    const A = thread._resolve(thread.from, w, h);
    const B = thread._resolve(thread.to, w, h);
    const t = P.blend;
    const x0 = A.x0 + (B.x0 - A.x0) * t;
    const x1 = A.x1 + (B.x1 - A.x1) * t;
    const y = A.y + (B.y - A.y) * t;
    const plotH = A.h + (B.h - A.h) * t;

    const cx = (x0 + x1) / 2;
    const half = ((x1 - x0) / 2) * P.spread;
    const lo = cx - half;
    const span = half * 2;
    const pxPerDb = plotH > 0 ? plotH / 16 : Math.min(h * 0.02, 14);

    const liveMix = thread.audio.level > 0.05 ? 1 : P.colorMix;
    const r = Math.round(ICE[0] + (SIGNAL[0] - ICE[0]) * liveMix);
    const g = Math.round(ICE[1] + (SIGNAL[1] - ICE[1]) * liveMix);
    const b = Math.round(ICE[2] + (SIGNAL[2] - ICE[2]) * liveMix);

    c.beginPath();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    const nDraw = Math.max(2, Math.floor(N * P.drawProgress));
    for (let i = 0; i < nDraw; i++) {
      const u = i / (N - 1);
      const x = lo + span * u;
      // taper the sine toward the endpoints, like a held string
      const win = Math.pow(Math.sin(Math.PI * u), 0.75);
      const audioJitter =
        thread.audio.level *
        3 *
        Math.sin(u * (8 + thread.audio.freq * 60) * Math.PI + P.phase * 7);
      const ySine =
        (P.amp * Math.sin(u * P.freq * Math.PI * 2 + P.phase) + audioJitter) * win;
      const yResp = -responseShape(u) * pxPerDb;
      const yy = y + ySine * (1 - P.mixResponse) + yResp * P.mixResponse;
      if (i === 0) c.moveTo(x, yy);
      else c.lineTo(x, yy);
    }
    if (liveMix > 0.05) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = `rgba(${SIGNAL[0]},${SIGNAL[1]},${SIGNAL[2]},${P.alpha * (0.08 + liveMix * 0.12)})`;
      c.lineWidth = P.width + 2.5 + thread.audio.level * 2;
      c.stroke();
      c.restore();
    }

    c.strokeStyle = `rgba(${r},${g},${b},${P.alpha})`;
    c.lineWidth = P.width;
    c.stroke();

    // filmstrip progress dot
    if (P.dot >= 0) {
      const dx = lo + span * P.dot;
      c.beginPath();
      c.arc(dx, y, 7, 0, Math.PI * 2);
      c.strokeStyle = `rgba(${SIGNAL[0]},${SIGNAL[1]},${SIGNAL[2]},${P.alpha * 0.18})`;
      c.lineWidth = 1;
      c.stroke();
      c.beginPath();
      c.arc(dx, y, 2.5, 0, Math.PI * 2);
      c.fillStyle = `rgba(${SIGNAL[0]},${SIGNAL[1]},${SIGNAL[2]},${Math.min(1, P.alpha + 0.15)})`;
      c.fill();
    }
  }

  thread.redraw = () => draw(0);

  if (ctx.reduceMotion) {
    // Static render, refreshed on scroll settle — no phase drift.
    P.spread = 1;
    P.speed = 0;
    draw(0);
    let raf = 0;
    window.addEventListener(
      'scroll',
      () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => draw(0));
      },
      { passive: true },
    );
  } else {
    let last = 0;
    gsap.ticker.add((time) => {
      const dt = last ? time - last : 0;
      last = time;
      if (!document.hidden) draw(dt);
    });
  }

  return thread;
}
