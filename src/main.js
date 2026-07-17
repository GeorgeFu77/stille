import '@fontsource-variable/fraunces';
import '@fontsource-variable/archivo';
import '@fontsource/ibm-plex-mono';
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import Lenis from 'lenis';

import { initGrain } from './grain.js';
import { initThread } from './thread.js';
import { initSpin } from './fx/spin.js';
import { initScrambleIn } from './fx/scramblein.js';
import { initCursor } from './fx/cursor.js';
import { initFilmdrag } from './fx/filmdrag.js';
import { initWaveforms } from './fx/waveforms.js';
import { initLoader } from './loader.js';
import { initInterface } from './interface.js';
import { initMotion } from './motion.js';
import { initHero } from './sections/hero.js';
import { initWave } from './sections/wave.js';
import { initReveal } from './sections/reveal.js';
import { initAnatomy } from './sections/anatomy.js';
import { initSweep } from './sections/sweep.js';
import { initMaterial } from './sections/material.js';
import { initLedger } from './sections/ledger.js';
import { initFinale } from './sections/finale.js';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, Draggable, InertiaPlugin);

const root = document.documentElement;
root.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ——— Smooth scroll (skipped for reduced motion) ———
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.1, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// ——— Boot after fonts so SplitText measures real glyphs ———
const ctx = { gsap, ScrollTrigger, lenis, reduceMotion };

document.fonts.ready.then(() => {
  const grain = initGrain(ctx);
  const thread = initThread(ctx);
  window.__stille = { thread, grain }; // debug/verification handle

  const loader = initLoader(ctx);
  const appCtx = { ...ctx, introDelay: loader.introDelay };

  initInterface(appCtx);
  initMotion(appCtx);

  // The 3D object rides in on its own chunk — the page never waits for it.
  import('./scene3d.js').then(({ initScene3d, stage }) => {
    window.__stille.stage = initScene3d(appCtx) || stage;
  });
  initHero(appCtx);
  initWave(appCtx);
  initReveal(appCtx);
  initAnatomy(appCtx);
  initSweep(appCtx);
  initMaterial(appCtx);
  initLedger(appCtx);
  initFinale(appCtx);
  initSpin(appCtx);
  initScrambleIn(appCtx);
  initCursor(appCtx);
  initFilmdrag(appCtx);
  initWaveforms(appCtx);
  ScrollTrigger.refresh();
  if (reduceMotion) thread.redraw();
}).catch((err) => {
  // A failed module must never leave the page dark.
  console.error('[stille] boot failed:', err);
  document.documentElement.classList.remove('has-loader');
  document.querySelector('.boot-loader')?.remove();
  document.querySelectorAll('.hero-title, .hero-label, .hero-sub, .scroll-cue, .hero-aperture, .hero-axis').forEach((el) => {
    el.style.visibility = 'visible';
  });
});
