/*
 * The Sweep's voice — one oscillator, born from a user gesture, never before.
 * Soft attack/release envelopes so it can't click. Everything else on the
 * page listens in: the Thread jitters, the grain shimmers, the UI dims.
 */

const MASTER_LEVEL = 0.09; // quiet by design: a measurement tone, not music

let ac = null;
let osc = null;
let gain = null;

export const audioState = {
  enabled: false,
  freq: 440,
  // normalized helpers for the visual layers
  get freqNorm() {
    return Math.min(1, Math.max(0, Math.log10(this.freq / 20) / 3));
  },
};

function ensureContext() {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
}

let waveType = 'sine';

// Waveform selector contract: 'sine' | 'triangle' | 'square' — quiet types only.
export function setWave(type) {
  if (!['sine', 'triangle', 'square'].includes(type)) return;
  waveType = type;
  audioState.wave = type;
  if (osc) osc.type = type;
}

export function soundOn(freq, dbOffset = 0) {
  ensureContext();
  soundOff(true); // silence any straggler instantly

  osc = ac.createOscillator();
  gain = ac.createGain();
  osc.type = waveType;
  osc.frequency.value = freq;
  gain.gain.value = 0.0001;
  osc.connect(gain).connect(ac.destination);
  osc.start();

  const level = MASTER_LEVEL * Math.pow(10, dbOffset / 20);
  gain.gain.setTargetAtTime(level, ac.currentTime, 0.045); // soft attack
  audioState.enabled = true;
  audioState.freq = freq;
  document.dispatchEvent(new CustomEvent('stille:sound', { detail: { on: true } }));
}

export function soundSet(freq, dbOffset = 0) {
  audioState.freq = freq;
  if (!audioState.enabled || !osc) return;
  osc.frequency.setTargetAtTime(freq, ac.currentTime, 0.016);
  const level = MASTER_LEVEL * Math.pow(10, dbOffset / 20);
  gain.gain.setTargetAtTime(level, ac.currentTime, 0.03);
}

export function soundOff(hard = false) {
  if (!osc) {
    audioState.enabled = false;
    return;
  }
  const deadOsc = osc;
  const deadGain = gain;
  osc = null;
  gain = null;
  if (hard) {
    deadOsc.stop();
    deadOsc.disconnect();
    deadGain.disconnect();
  } else {
    deadGain.gain.setTargetAtTime(0.0001, ac.currentTime, 0.06); // soft release
    deadOsc.stop(ac.currentTime + 0.4);
    setTimeout(() => {
      deadOsc.disconnect();
      deadGain.disconnect();
    }, 500);
  }
  if (audioState.enabled) {
    audioState.enabled = false;
    document.dispatchEvent(new CustomEvent('stille:sound', { detail: { on: false } }));
  }
}

// A final exhale for the finale: fade the tone out over `seconds`.
export function soundFade(seconds) {
  if (!audioState.enabled || !gain) return;
  gain.gain.setTargetAtTime(0.0001, ac.currentTime, seconds / 3);
  setTimeout(() => soundOff(), seconds * 1000 + 200);
}
