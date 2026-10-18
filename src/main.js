import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/fraunces/full-italic.css';
import '@fontsource/ibm-plex-mono/500.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

import { initVelocity } from './lib/velocity.js';
import { initLoader } from './loader.js';
import { initChrome } from './chrome.js';
import { initHero } from './sections/hero.js';
import { initTapes } from './sections/tapes.js';
import { initProblem } from './sections/problem.js';
import { initSite } from './sections/site.js';
import { initProcess } from './sections/process.js';
import { initBuilds } from './sections/builds.js';
import { initDeal } from './sections/deal.js';
import { initFinale } from './sections/finale.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ——— Smooth scroll (skipped for reduced motion) ———
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.1, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

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

const unhide = () => {
  document.documentElement.classList.remove('has-loader', 'js');
  document.querySelector('.loader')?.remove();
};

// Boot after fonts so text fitting and SplitText measure real glyphs.
Promise.all([document.fonts.ready, viewportReady()])
  .then(() => {
    const loader = safe('loader', initLoader, ctx) || { introDelay: 0 };
    const appCtx = { ...ctx, introDelay: loader.introDelay };
    window.__stille = { lenis }; // debug/verification handle

    safe('velocity', initVelocity, appCtx);
    safe('chrome', initChrome, appCtx);
    if (safe('hero', initHero, appCtx) === undefined) unhide();
    safe('tapes', initTapes, appCtx);
    safe('problem', initProblem, appCtx);
    safe('site', initSite, appCtx);
    safe('process', initProcess, appCtx);
    safe('builds', initBuilds, appCtx);
    safe('deal', initDeal, appCtx);
    safe('finale', initFinale, appCtx);
    ScrollTrigger.refresh();
  })
  .catch((err) => {
    // A failed boot must never leave the page dark.
    console.error('[stille] boot failed:', err);
    unhide();
  });
