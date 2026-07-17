import gsap from 'gsap';
import { setWave, audioState } from '../audio.js';
import './waveforms.css';

/*
 * Waveform selector + live handle ring — the Sweep's tone gets a shape.
 * SINE / TRI / SQR set the oscillator wave; a thin second ring on the
 * handle marks the moments the instrument is actually sounding.
 */

const WAVES = [
  { id: 'sine', label: 'SINE' },
  { id: 'triangle', label: 'TRI' },
  { id: 'square', label: 'SQR' },
];

export function initWaveforms(ctx) {
  const meta = document.querySelector('.sweep-meta');
  const toggle = meta?.querySelector('.sound-toggle');
  const handle = document.querySelector('.sweep-handle');
  if (!meta || !toggle || !handle) return;

  // ——— selector: a radiogroup with roving tabindex ———
  const group = document.createElement('div');
  group.className = 'waveform-group u-mono';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', 'Waveform');

  const buttons = WAVES.map(({ id, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'waveform-btn';
    btn.setAttribute('role', 'radio');
    btn.dataset.wave = id;
    btn.textContent = label;
    group.appendChild(btn);
    return btn;
  });

  function select(index, focus = false) {
    buttons.forEach((btn, i) => {
      btn.setAttribute('aria-checked', String(i === index));
      btn.tabIndex = i === index ? 0 : -1;
    });
    setWave(WAVES[index].id);
    if (focus) buttons[index].focus();
  }

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => select(i));
    btn.addEventListener('keydown', (e) => {
      let next;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % WAVES.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + WAVES.length) % WAVES.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = WAVES.length - 1;
      else return;
      e.preventDefault();
      select(next, true);
    });
  });

  select(Math.max(0, WAVES.findIndex((w) => w.id === (audioState.wave || 'sine'))));
  meta.insertBefore(group, toggle);

  // ——— live ring: state-driven, one tween per sound toggle ———
  const ring = document.createElement('span');
  ring.className = 'sweep-live-ring';
  ring.setAttribute('aria-hidden', 'true');
  handle.appendChild(ring);
  gsap.set(ring, { opacity: 0, scale: ctx.reduceMotion ? 1 : 0.6 });

  document.addEventListener('stille:sound', (e) => {
    if (ctx.reduceMotion) {
      gsap.set(ring, { opacity: e.detail.on ? 0.55 : 0 });
      return;
    }
    if (e.detail.on) {
      gsap.to(ring, { opacity: 0.55, scale: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
    } else {
      // exit softer than the enter: mostly fade, barely any travel
      gsap.to(ring, {
        opacity: 0,
        scale: 0.92,
        duration: 0.45,
        ease: 'power1.inOut',
        overwrite: 'auto',
        onComplete: () => gsap.set(ring, { scale: 0.6 }),
      });
    }
  });
}
