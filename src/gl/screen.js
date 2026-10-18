/*
 * The phone's screen: a small local-business site drawn with Canvas 2D.
 * One tall page that scrolls inside the screen, plus a fixed status bar.
 * Everything is laid out on a 600-unit-wide grid and drawn at SCALE.
 */

export const PAGE_W = 600;
export const PAGE_H = 2600;
export const STATUS_H = 70;
const SCALE = 1.4;

const C = {
  bg: '#f3efe7',
  ink: '#121211',
  card: '#ffffff',
  panel: '#151514',
  bone: '#efebe3',
  orange: '#ff4d00',
  wash: 'rgba(18, 18, 17, 0.12)',
  washDark: 'rgba(239, 235, 227, 0.2)',
  map: '#e3ddd1',
  road: '#fbf9f5',
};

const DISPLAY = '"Archivo Variable", "Arial Narrow", sans-serif';
const MONO = '"IBM Plex Mono", Menlo, monospace';

function setFont(ctx, weight, size, family = DISPLAY, stretch = 'extra-condensed') {
  ctx.font = `${weight} ${size}px ${family}`;
  if ('fontStretch' in ctx) ctx.fontStretch = family === DISPLAY ? stretch : 'normal';
  if ('letterSpacing' in ctx) ctx.letterSpacing = family === MONO ? '1.5px' : '0px';
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function star(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r * 0.45 : r;
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
}

function stars(ctx, x, cy, r, gap, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) star(ctx, x + r + i * (r * 2 + gap), cy, r);
}

function phoneGlyph(ctx, cx, cy, s, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s / 24, s / 24);
  ctx.fillStyle = color;
  ctx.fill(
    new Path2D(
      'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.6a1 1 0 0 1-.25 1z',
    ),
  );
  ctx.restore();
}

function bars(ctx, x, y, widths, color, h = 12, gap = 22) {
  ctx.fillStyle = color;
  widths.forEach((w, i) => {
    rr(ctx, x, y + i * gap, w, h, h / 2);
    ctx.fill();
  });
}

function sectionHead(ctx, text, y) {
  setFont(ctx, 880, 54);
  ctx.fillStyle = C.ink;
  ctx.fillText(text, 32, y);
}

export function drawPage(canvas) {
  canvas.width = PAGE_W * SCALE;
  canvas.height = PAGE_H * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  // ——— Nav ———
  let y = STATUS_H + 14;
  ctx.fillStyle = C.orange;
  rr(ctx, 32, y, 54, 54, 14);
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(48, y + 40);
  ctx.lineTo(70, y + 14);
  ctx.stroke();
  setFont(ctx, 860, 34);
  ctx.fillStyle = C.ink;
  ctx.fillText('YOUR BUSINESS', 100, y + 40);
  ctx.fillStyle = C.ink;
  rr(ctx, 440, y + 2, 128, 50, 25);
  ctx.fill();
  phoneGlyph(ctx, 458, y + 15, 24, C.orange);
  setFont(ctx, 500, 18, MONO);
  ctx.fillStyle = C.bone;
  ctx.fillText('CALL', 494, y + 34);

  // ——— Hero card ———
  y = 170;
  ctx.fillStyle = C.panel;
  rr(ctx, 20, y, 560, 600, 40);
  ctx.fill();
  // warm glow in the corner of the hero
  const glow = ctx.createRadialGradient(520, y + 560, 10, 520, y + 560, 420);
  glow.addColorStop(0, 'rgba(255, 77, 0, 0.55)');
  glow.addColorStop(1, 'rgba(255, 77, 0, 0)');
  ctx.save();
  rr(ctx, 20, y, 560, 600, 40);
  ctx.clip();
  ctx.fillStyle = glow;
  ctx.fillRect(20, y, 560, 600);
  ctx.restore();

  stars(ctx, 56, y + 62, 11, 6, C.orange);
  setFont(ctx, 500, 17, MONO);
  ctx.fillStyle = C.bone;
  ctx.fillText('5.0 ON GOOGLE', 196, y + 68);

  setFont(ctx, 900, 104);
  ctx.fillStyle = C.bone;
  ctx.fillText('THE BEST', 52, y + 190);
  ctx.fillText('IN TOWN.', 52, y + 282);
  ctx.fillStyle = C.orange;
  ctx.fillText('NOW ONLINE.', 52, y + 374);

  setFont(ctx, 450, 23, '"Archivo Variable", Arial, sans-serif', 'normal');
  ctx.fillStyle = C.bone;
  ctx.fillText('Fast, honest work from people', 54, y + 428);
  ctx.fillText('your neighbors already trust.', 54, y + 458);

  ctx.fillStyle = C.orange;
  rr(ctx, 52, y + 500, 496, 74, 37);
  ctx.fill();
  phoneGlyph(ctx, 210, y + 523, 28, C.ink);
  setFont(ctx, 880, 40);
  ctx.fillStyle = C.ink;
  ctx.fillText('CALL NOW', 254, y + 551);

  // ——— Reviews ———
  y = 830;
  sectionHead(ctx, 'WHAT NEIGHBORS SAY', y + 46);
  setFont(ctx, 900, 128);
  ctx.fillStyle = C.ink;
  ctx.fillText('5.0', 32, y + 180);
  stars(ctx, 196, y + 110, 16, 8, C.orange);
  setFont(ctx, 500, 17, MONO);
  ctx.fillStyle = C.ink;
  ctx.fillText('FROM GOOGLE REVIEWS', 198, y + 168);

  for (let i = 0; i < 2; i++) {
    const x = 20 + i * 284;
    const cy = y + 214;
    ctx.fillStyle = C.card;
    rr(ctx, x, cy, 276, 196, 26);
    ctx.fill();
    stars(ctx, x + 22, cy + 36, 9, 5, C.orange);
    bars(ctx, x + 22, cy + 66, [226, 198, 150], C.wash);
    ctx.fillStyle = i ? '#f1c9a6' : '#cfd9cf';
    ctx.beginPath();
    ctx.arc(x + 40, cy + 160, 18, 0, Math.PI * 2);
    ctx.fill();
    setFont(ctx, 500, 14, MONO);
    ctx.fillStyle = C.ink;
    ctx.fillText('VERIFIED', x + 70, cy + 166);
  }

  // ——— Services ———
  y = 1290;
  sectionHead(ctx, 'SERVICES', y + 46);
  ['REPAIRS', 'INSTALLS', 'INSPECTIONS'].forEach((name, i) => {
    const cy = y + 82 + i * 112;
    ctx.fillStyle = C.card;
    rr(ctx, 20, cy, 560, 100, 26);
    ctx.fill();
    ctx.fillStyle = i === 0 ? C.orange : C.ink;
    ctx.beginPath();
    ctx.arc(74, cy + 50, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = i === 0 ? C.ink : C.orange;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(62, cy + 50);
    ctx.lineTo(86, cy + 50);
    ctx.moveTo(74, cy + 38);
    ctx.lineTo(74, cy + 62);
    ctx.stroke();
    setFont(ctx, 880, 40);
    ctx.fillStyle = C.ink;
    ctx.fillText(name, 122, cy + 52);
    bars(ctx, 124, cy + 66, [150], C.wash, 10);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(526, cy + 50);
    ctx.lineTo(548, cy + 50);
    ctx.moveTo(538, cy + 40);
    ctx.lineTo(548, cy + 50);
    ctx.lineTo(538, cy + 60);
    ctx.stroke();
  });

  // ——— Find us ———
  y = 1700;
  sectionHead(ctx, 'FIND US', y + 46);
  const mx = 20;
  const my = y + 76;
  ctx.save();
  rr(ctx, mx, my, 560, 330, 30);
  ctx.clip();
  ctx.fillStyle = C.map;
  ctx.fillRect(mx, my, 560, 330);
  ctx.fillStyle = '#d4ddc9';
  rr(ctx, mx + 340, my + 30, 170, 110, 10);
  ctx.fill();
  ctx.strokeStyle = C.road;
  ctx.lineCap = 'round';
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(mx - 20, my + 200);
  ctx.lineTo(mx + 600, my + 150);
  ctx.moveTo(mx + 180, my - 20);
  ctx.lineTo(mx + 230, my + 360);
  ctx.stroke();
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(mx - 20, my + 80);
  ctx.lineTo(mx + 600, my + 60);
  ctx.moveTo(mx - 20, my + 290);
  ctx.lineTo(mx + 600, my + 250);
  ctx.moveTo(mx + 420, my - 20);
  ctx.lineTo(mx + 450, my + 360);
  ctx.moveTo(mx + 70, my - 20);
  ctx.lineTo(mx + 90, my + 360);
  ctx.stroke();
  ctx.restore();
  // pin
  const px = mx + 300;
  const py = my + 160;
  ctx.fillStyle = 'rgba(255, 77, 0, 0.18)';
  ctx.beginPath();
  ctx.ellipse(px, py + 6, 60, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.bezierCurveTo(px - 10, py - 30, px - 36, py - 46, px - 36, py - 76);
  ctx.arc(px, py - 76, 36, Math.PI, 0);
  ctx.bezierCurveTo(px + 36, py - 46, px + 10, py - 30, px, py);
  ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(px, py - 77, 13, 0, Math.PI * 2);
  ctx.fill();

  bars(ctx, 32, y + 440, [300, 210], C.wash, 13, 26);
  setFont(ctx, 500, 17, MONO);
  ctx.fillStyle = C.ink;
  ctx.fillText('GET DIRECTIONS →', 362, y + 452);

  // ——— Footer ———
  y = 2230;
  ctx.fillStyle = C.panel;
  ctx.fillRect(0, y, PAGE_W, PAGE_H - y);
  setFont(ctx, 900, 80);
  ctx.fillStyle = C.bone;
  ctx.fillText('READY WHEN', 32, y + 104);
  ctx.fillStyle = C.orange;
  ctx.fillText('YOU ARE.', 32, y + 180);
  ctx.fillStyle = C.orange;
  rr(ctx, 32, y + 220, 536, 70, 35);
  ctx.fill();
  phoneGlyph(ctx, 210, y + 241, 28, C.ink);
  setFont(ctx, 880, 38);
  ctx.fillStyle = C.ink;
  ctx.fillText('CALL NOW', 254, y + 268);
  setFont(ctx, 500, 15, MONO);
  ctx.fillStyle = C.bone;
  ctx.fillText('© YOUR BUSINESS', 32, y + 340);

  return canvas;
}

// Fixed chrome: status bar with the island, and the home indicator.
export function drawStatus(canvas) {
  canvas.width = PAGE_W * SCALE;
  canvas.height = STATUS_H * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, PAGE_W, STATUS_H);
  setFont(ctx, 650, 25, '"Archivo Variable", Arial, sans-serif', 'normal');
  ctx.fillStyle = C.ink;
  ctx.fillText('9:41', 56, 46);
  // island
  ctx.fillStyle = '#000';
  rr(ctx, 214, 14, 172, 46, 23);
  ctx.fill();
  // signal
  ctx.fillStyle = C.ink;
  [8, 12, 16, 20].forEach((h, i) => {
    rr(ctx, 438 + i * 8, 46 - h, 5, h, 1.5);
    ctx.fill();
  });
  // battery
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  rr(ctx, 490, 28, 44, 20, 6);
  ctx.stroke();
  rr(ctx, 494, 32, 32, 12, 3);
  ctx.fill();
  rr(ctx, 536, 34, 3, 8, 1.5);
  ctx.fill();
  return canvas;
}
