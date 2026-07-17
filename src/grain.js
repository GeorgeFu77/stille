import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/*
 * The grain — a near-threshold WebGL field of "air pressure" behind everything.
 * Cursor disturbs it like a hand through still air; a scroll pulse sweeps down
 * on first scroll; total page progress blooms into aurora mid-page
 * and cools it back to still black at the finale. Audio makes it shimmer.
 */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;

uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;      // smoothed, px
uniform vec4  u_ripple[3];  // x, y (px), age (s), strength
uniform float u_pulse;      // 0..1 scroll pulse, decaying
uniform float u_aurora;     // 0..1 page-progress aurora bloom
uniform vec2  u_audio;      // freq 0..1, level 0..1

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 asp = vec2(u_res.x / u_res.y, 1.0);

  // --- displacement from cursor + ripples + scroll pulse ---
  vec2 disp = vec2(0.0);

  vec2 dm = (gl_FragCoord.xy - u_mouse) / u_res.y;
  float md = length(dm);
  disp += normalize(dm + 1e-5) * exp(-md * 6.0) * 0.012;

  for (int i = 0; i < 3; i++) {
    vec2 rp = (gl_FragCoord.xy - u_ripple[i].xy) / u_res.y;
    float rd = length(rp);
    float age = u_ripple[i].z;
    float wave = sin(rd * 40.0 - age * 5.0) * exp(-rd * 5.0) * exp(-age * 1.4);
    disp += normalize(rp + 1e-5) * wave * 0.015 * u_ripple[i].w;
  }

  // scroll pulse: a soft pressure band sweeping down the screen
  float band = exp(-pow((1.0 - uv.y) - u_pulse, 2.0) * 60.0) * (1.0 - u_pulse);
  disp.y += band * 0.02;

  // --- the air: slow large-scale pressure + fine grain ---
  vec2 p = uv * asp;
  float air = noise(p * 2.4 + disp * 14.0 + vec2(u_time * 0.016, u_time * 0.009));
  air += 0.5 * noise(p * 5.1 - disp * 9.0 - vec2(u_time * 0.011, 0.0));
  air /= 1.5;

  float shimmerFreq = mix(24.0, 160.0, u_audio.x);
  float shimmer = noise(p * shimmerFreq + u_time * mix(0.2, 2.0, u_audio.x)) * u_audio.y * 0.05;

  float grain = hash(gl_FragCoord.xy + fract(u_time) * 61.7) * 0.021;

  // --- color: blue-black air, ice dust, and a restrained aurora bloom ---
  vec3 ink = vec3(0.0431, 0.0549, 0.0863);           // #0b0e16
  vec3 deep = vec3(0.0196, 0.0235, 0.0431);          // #05060b
  vec3 iceDust = vec3(0.9137, 0.9333, 0.9647);       // #e9eef6
  vec3 signal = vec3(0.3569, 0.4235, 1.0);           // #5b6cff
  vec3 aurora = vec3(0.6157, 0.4824, 1.0);           // #9d7bff

  float vig = smoothstep(1.25, 0.45, distance(uv, vec2(0.5, 0.46)));
  vec3 col = mix(deep, ink, vig);

  float peaks = smoothstep(0.55, 0.95, air);
  col += iceDust * peaks * (0.012 + band * 0.05);
  col += mix(signal, aurora, 0.5) * peaks * u_aurora * 0.028;
  col += signal * shimmer;
  col += grain;

  gl_FragColor = vec4(col, 1.0);
}
`;

export const grain = {
  setAudio(freqNorm, level) {
    this._audio[0] = freqNorm;
    this._audio[1] = level;
  },
  pulse() {
    this._pulse = 0.001; // starts the downward sweep
  },
  ripple(x, y, strength = 1) {
    this._ripples[this._ri] = { x, y, age: 0, s: strength };
    this._ri = (this._ri + 1) % 3;
  },
  _audio: [0.5, 0],
  _pulse: -1,
  _ripples: [
    { x: -9999, y: -9999, age: 99, s: 0 },
    { x: -9999, y: -9999, age: 99, s: 0 },
    { x: -9999, y: -9999, age: 99, s: 0 },
  ],
  _ri: 0,
};

export function initGrain(ctx) {
  const canvas = document.getElementById('grain');
  const gl = canvas.getContext('webgl', { antialias: false, depth: false });

  if (!gl) {
    document.documentElement.classList.add('no-webgl');
    return grain;
  }

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s));
    }
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  for (const name of ['u_res', 'u_time', 'u_mouse', 'u_ripple', 'u_pulse', 'u_aurora', 'u_audio']) {
    U[name] = gl.getUniformLocation(prog, name);
  }

  // The site is showcase-first: render the shader at a gentle resolution —
  // it is a soft field, extra pixels buy nothing.
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, isCoarse ? 1.25 : 1.5);

  let w = 0;
  let h = 0;
  function resize() {
    w = Math.round(window.innerWidth * DPR);
    h = Math.round(window.innerHeight * DPR);
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }
  resize();
  window.addEventListener('resize', resize);

  // Smoothed cursor (GL coords: y up)
  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let smx = mx;
  let smy = my;
  if (!isCoarse) {
    window.addEventListener(
      'pointermove',
      (e) => {
        mx = e.clientX;
        my = e.clientY;
      },
      { passive: true },
    );
  } else if (!ctx.reduceMotion) {
    // touch devices: the field drifts on its own instead of tracking a cursor
    gsap.to(
      { t: 0 },
      {
        t: Math.PI * 2,
        repeat: -1,
        duration: 26,
        ease: 'none',
        onUpdate() {
          const t = this.targets()[0].t;
          mx = window.innerWidth * (0.5 + 0.3 * Math.cos(t));
          my = window.innerHeight * (0.45 + 0.28 * Math.sin(t * 0.8));
        },
      },
    );
  }

  // Aurora follows total page progress: cool → bloom mid-page → cool again.
  let aurora = 0;
  ScrollTrigger.create({
    trigger: document.body,
    start: 0,
    end: () => ScrollTrigger.maxScroll(window),
    onUpdate(self) {
      aurora = Math.pow(Math.sin(Math.PI * self.progress), 1.5);
    },
  });

  const rippleFlat = new Float32Array(12);

  function render(time, dt) {
    smx += (mx - smx) * Math.min(1, dt * 4);
    smy += (my - smy) * Math.min(1, dt * 4);

    for (let i = 0; i < 3; i++) {
      const rp = grain._ripples[i];
      rp.age += dt;
      rippleFlat[i * 4] = rp.x * DPR;
      rippleFlat[i * 4 + 1] = h - rp.y * DPR;
      rippleFlat[i * 4 + 2] = rp.age;
      rippleFlat[i * 4 + 3] = rp.s;
    }

    if (grain._pulse >= 0) {
      grain._pulse += dt * 0.55;
      if (grain._pulse > 1.4) grain._pulse = -1;
    }

    gl.uniform2f(U.u_res, w, h);
    gl.uniform1f(U.u_time, time);
    gl.uniform2f(U.u_mouse, smx * DPR, h - smy * DPR);
    gl.uniform4fv(U.u_ripple, rippleFlat);
    gl.uniform1f(U.u_pulse, grain._pulse < 0 ? 2.0 : grain._pulse);
    gl.uniform1f(U.u_aurora, aurora);
    gl.uniform2f(U.u_audio, grain._audio[0], grain._audio[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  if (ctx.reduceMotion) {
    render(0.5, 0); // one still frame of texture, then nothing moves
    return grain;
  }

  let last = 0;
  gsap.ticker.add((time) => {
    if (document.hidden) return;
    const dt = last ? Math.min(time - last, 0.1) : 0;
    last = time;
    render(time, dt);
  });

  return grain;
}
