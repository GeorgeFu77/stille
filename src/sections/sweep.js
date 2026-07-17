import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/Draggable';
import { thread, responseShape } from '../thread.js';
import { grain } from '../grain.js';
import { audioState, soundOn, soundSet, soundOff } from '../audio.js';

/*
 * 04 · The Sweep — the site audibly proves its subject.
 * The Thread becomes the measured response curve. A draggable handle rides
 * it with a live readout; opt in to sound and the handle plays the actual
 * sine underneath it while the whole page drops into listening mode.
 * Silent visitors still get the full instrument: readout, curve, reacting
 * grain — sound is the reward, not the requirement.
 */

const F_LO = 20;
const DECADES = 3; // 20 Hz → 20 kHz

const tToFreq = (t) => F_LO * Math.pow(10, DECADES * t);
const freqLabel = (f) => (f < 1000 ? `${Math.round(f)} Hz` : `${(f / 1000).toFixed(1)} kHz`);
const dbLabel = (db) => {
  if (Math.abs(db) < 0.05) return '0.0 dB';
  return `${db > 0 ? '+' : '−'}${Math.abs(db).toFixed(1)} dB`;
};

export function initSweep(ctx) {
  const section = document.querySelector('.s-sweep');
  const plot = section.querySelector('.sweep-plot');
  const handle = section.querySelector('.sweep-handle');
  const handleValue = section.querySelector('.sweep-handle-value');
  const readout = section.querySelector('.sweep-readout');
  const toggle = section.querySelector('.sound-toggle');
  const toggleLabel = section.querySelector('[data-label]');

  thread.registerElement('sweepPlot', plot);

  // ——— the measurement grid (drawn, not decorated) ———
  const GRID_T = [0, 0.2330, 0.5663, 0.8997, 1];
  const GRID_F = ['20 Hz', '100', '1k', '10k', '20 kHz'];
  const GRID_DB = [6, 0, -6];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.classList.add('sweep-grid');
  svg.setAttribute('aria-hidden', 'true');
  let gridLines = '';
  for (const t of GRID_T) {
    gridLines += `<line class="grid-v" x1="${t * 100}" y1="0" x2="${t * 100}" y2="100" />`;
  }
  for (const db of GRID_DB) {
    const y = 42 - db * 6.25;
    gridLines += `<line class="grid-h" x1="0" y1="${y}" x2="100" y2="${y}" />`;
  }
  svg.innerHTML = gridLines;
  plot.prepend(svg);

  const cursor = document.createElement('span');
  cursor.className = 'sweep-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  plot.appendChild(cursor);

  for (let i = 0; i < GRID_T.length; i++) {
    const lab = document.createElement('span');
    lab.className = 'sweep-lab u-mono';
    if (i === 0) lab.classList.add('sweep-lab--first');
    if (i === GRID_T.length - 1) lab.classList.add('sweep-lab--last');
    lab.textContent = GRID_F[i];
    lab.style.left = `${GRID_T[i] * 100}%`;
    lab.setAttribute('aria-hidden', 'true');
    plot.appendChild(lab);
  }

  // ——— handle state ———
  let plotW = 0;
  let plotH = 0;
  let t = 0.4477; // 440 Hz
  let interacted = false;
  let nudgeCall = null;
  let seekTween = null;

  const curveY = (u) => 0.42 * plotH - responseShape(u) * (plotH / 16);

  function placeHandle() {
    const y = curveY(t);
    gsap.set(handle, { x: t * plotW, y });
    plot.style.setProperty('--signal-x', `${t * 100}%`);
    plot.style.setProperty('--signal-y', `${y}px`);
  }

  function measure() {
    plotW = plot.clientWidth;
    plotH = plot.clientHeight;
    plot.style.setProperty('--plot-height', `${plotH}px`);
    placeHandle();
    if (drag) drag[0].applyBounds({ minX: 0, maxX: plotW });
  }

  function update() {
    const f = tToFreq(t);
    const db = responseShape(t);
    readout.textContent = `${freqLabel(f)} · ${dbLabel(db)}`;
    handleValue.textContent = freqLabel(f).toUpperCase();
    handle.setAttribute('aria-valuenow', String(Math.round(f)));
    handle.setAttribute('aria-valuetext', `${freqLabel(f)}, ${dbLabel(db)}`);
    placeHandle();
    soundSet(f, db);
    thread.audio.freq = t;
    thread.audio.level = audioState.enabled ? 0.9 : 0;
    grain.setAudio(t, audioState.enabled ? 0.8 : 0.22);
  }

  function stopHints() {
    interacted = true;
    nudgeCall?.kill();
    seekTween?.kill();
    handle.classList.remove('is-active');
  }

  function seekTo(next, { duration = 0.5, yoyo = false } = {}) {
    seekTween?.kill();
    const state = { value: t };
    handle.classList.add('is-active');
    seekTween = gsap.to(state, {
      value: gsap.utils.clamp(0, 1, next),
      duration,
      repeat: yoyo ? 1 : 0,
      yoyo,
      ease: 'power3.out',
      onUpdate() {
        t = state.value;
        update();
      },
      onComplete() {
        handle.classList.remove('is-active');
      },
    });
  }

  // ——— dragging (with inertia: fling it and it sweeps) ———
  const drag = Draggable.create(handle, {
    type: 'x',
    bounds: { minX: 0, maxX: 0 },
    edgeResistance: 0.86,
    inertia: true,
    onPress() {
      stopHints();
      handle.classList.add('is-active');
    },
    onDrag() {
      t = gsap.utils.clamp(0, 1, this.x / plotW);
      update();
    },
    onThrowUpdate() {
      t = gsap.utils.clamp(0, 1, this.x / plotW);
      update();
    },
    onRelease() {
      handle.classList.remove('is-active');
    },
    onThrowComplete() {
      handle.classList.remove('is-active');
    },
  });

  // The whole plot is an input surface, not just the 11 px center dot.
  plot.addEventListener('click', (e) => {
    if (e.target.closest('.sweep-handle')) return;
    stopHints();
    const rect = plot.getBoundingClientRect();
    const next = (e.clientX - rect.left) / rect.width;
    seekTo(next);
  });

  // keyboard: the handle is a button — arrows walk the spectrum
  handle.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    let nt = t;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') nt = Math.min(1, t + step);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') nt = Math.max(0, t - step);
    else if (e.key === 'Home') nt = 0;
    else if (e.key === 'End') nt = 1;
    else return;
    e.preventDefault();
    stopHints();
    t = nt;
    update();
  });

  // ——— sound: strictly opt-in, and the page listens with you ———
  toggle.addEventListener('click', () => {
    stopHints();
    const on = toggle.getAttribute('aria-pressed') !== 'true';
    toggle.setAttribute('aria-pressed', String(on));
    toggleLabel.textContent = on ? 'DISABLE SOUND' : 'ENABLE SOUND';
    if (on) soundOn(tToFreq(t), responseShape(t));
    else soundOff();
    update();
  });

  document.addEventListener('stille:sound', (e) => {
    document.documentElement.classList.toggle('listening', e.detail.on);
    if (!e.detail.on) {
      toggle.setAttribute('aria-pressed', 'false');
      toggleLabel.textContent = 'ENABLE SOUND';
      thread.audio.level = 0;
      grain.setAudio(t, 0);
    }
  });

  // ——— entrance + thread anchoring ———
  const wires = () => svg.querySelectorAll('line');

  if (!ctx.reduceMotion) {
    gsap.set(wires(), { drawSVG: '0%' });

    gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 55%', once: true },
    })
      .to(wires(), { drawSVG: '100%', duration: 0.7, stagger: 0.05, ease: 'power2.inOut' })
      .add(() => {
        gsap.set(thread.P, { mixResponse: 1, drawProgress: 0 });
        gsap.to(thread.P, { alpha: 0.9, duration: 0.2 });
        gsap.to(thread.P, { drawProgress: 1, duration: 1.2, ease: 'expo.inOut' });
      }, '-=0.25')
      .from('.sweep-lab', { autoAlpha: 0, duration: 0.5, stagger: 0.04 }, '-=0.8');
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top 55%',
    end: 'bottom 30%',
    onToggle(self) {
      if (self.isActive) {
        thread.morph('lowThird', 'sweepPlot');
        if (ctx.reduceMotion) {
          gsap.set(thread.P, { blend: 1, alpha: 0.9, mixResponse: 1, drawProgress: 1 });
        } else {
          gsap.set(thread.P, { blend: 0, mixResponse: 1 });
          gsap.to(thread.P, { blend: 1, duration: 0.75, ease: 'power2.inOut', overwrite: 'auto' });
          gsap.to(thread.P, { alpha: 0.9, duration: 0.3 });
        }
        // one soft twitch after 6 idle seconds, so the instrument gets found
        if (!interacted && !ctx.reduceMotion) {
          nudgeCall = gsap.delayedCall(6, () => {
            interacted = true;
            seekTo(Math.min(1, t + 0.025), { duration: 0.3, yoyo: true });
            toggle.classList.add('sound-toggle--wink');
            setTimeout(() => toggle.classList.remove('sound-toggle--wink'), 1400);
          });
        }
      } else {
        nudgeCall?.kill();
        seekTween?.kill();
        handle.classList.remove('is-active');
        if (self.direction < 0) {
          gsap.set(thread.P, { blend: 0, mixResponse: 0, drawProgress: 1 });
        }
        if (ctx.reduceMotion) gsap.set(thread.P, { alpha: 0 });
        else gsap.to(thread.P, { alpha: 0, duration: 0.3 });
        if (audioState.enabled) soundOff(); // leaving the lab silences the tone
        else grain.setAudio(t, 0);
      }
    },
  });

  window.addEventListener('resize', measure);
  // fonts/layout settle before first measure
  measure();
  requestAnimationFrame(measure);
  update();
}
