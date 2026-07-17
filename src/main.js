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
import { initScrambleIn } from './fx/scramblein.js';
import { initCursor } from './fx/cursor.js';
import { initFilmdrag } from './fx/filmdrag.js';
import { initParticles } from './fx/particles.js';
import { initVelocity } from './fx/velocity.js';
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

// One broken module costs its own feature, never the page.
const safe = (name, fn, arg) => {
  try {
    return fn(arg);
  } catch (err) {
    console.error(`[stille] ${name} failed:`, err);
    return undefined;
  }
};

// Never boot into a zero-sized viewport (collapsed/background windows):
// media queries and ScrollTrigger math both need real dimensions.
const viewportReady = () =>
  window.innerWidth > 0 && window.innerHeight > 0
    ? Promise.resolve()
    : new Promise((resolve) => {
        const iv = setInterval(() => {
          if (window.innerWidth > 0 && window.innerHeight > 0) {
            clearInterval(iv);
            resolve();
          }
        }, 200);
      });

Promise.all([document.fonts.ready, viewportReady()]).then(() => {
  const grain = safe('grain', initGrain, ctx);
  const thread = initThread(ctx);
  window.__stille = { thread, grain, lenis }; // debug/verification handle

  const loader = safe('loader', initLoader, ctx) || { introDelay: 0.2 };
  const appCtx = { ...ctx, introDelay: loader.introDelay };

  safe('interface', initInterface, appCtx);
  safe('motion', initMotion, appCtx);

  safe('hero', initHero, appCtx);
  safe('wave', initWave, appCtx);
  safe('reveal', initReveal, appCtx);
  safe('anatomy', initAnatomy, appCtx);
  safe('sweep', initSweep, appCtx);
  safe('material', initMaterial, appCtx);
  safe('ledger', initLedger, appCtx);
  safe('finale', initFinale, appCtx);
  safe('scramblein', initScrambleIn, appCtx);
  safe('cursor', initCursor, appCtx);
  safe('filmdrag', initFilmdrag, appCtx);
  safe('particles', initParticles, appCtx);
  safe('velocity', initVelocity, appCtx);
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
