import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/*
 * The signal field — thousands of spectral points with one shared mind.
 * They assemble as the STILLE wordmark in the hero, detonate into a free
 * field on the first scroll, regroup into a phone outline at the reveal,
 * and settle into a calm horizontal band for the finale. The cursor pushes
 * them like a hand in water; scroll velocity streaks them into light.
 */

const VERT = `
attribute vec2 a_pos;
attribute vec2 a_seed;
uniform vec2 u_res;
uniform float u_dpr;
uniform float u_stretch;
varying float v_ramp;
varying float v_glow;
void main() {
  vec2 clip = (a_pos / u_res) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = (1.4 + a_seed.y * 2.6) * u_dpr * (1.0 + u_stretch * 0.5);
  v_ramp = a_seed.x;
  v_glow = a_seed.y;
}
`;

const FRAG = `
precision mediump float;
uniform float u_alpha;
varying float v_ramp;
varying float v_glow;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float disc = smoothstep(0.5, 0.1, d);
  vec3 violet = vec3(0.6157, 0.4824, 1.0);
  vec3 blue   = vec3(0.3569, 0.4235, 1.0);
  vec3 cyan   = vec3(0.3098, 0.8471, 1.0);
  vec3 col = mix(violet, blue, smoothstep(0.0, 0.55, v_ramp));
  col = mix(col, cyan, smoothstep(0.55, 1.0, v_ramp));
  gl_FragColor = vec4(col * disc * u_alpha * (0.35 + v_glow * 0.65), 1.0);
}
`;

export function initParticles(ctx) {
  if (ctx.reduceMotion) return;

  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const N = isCoarse ? 3500 : 12000;
  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'layer';
  canvas.style.zIndex = '1';
  document.getElementById('grain').after(canvas);

  const gl = canvas.getContext('webgl', { antialias: false, depth: false, alpha: true, premultipliedAlpha: true });
  if (!gl) {
    canvas.remove();
    return;
  }

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  gl.blendFunc(gl.ONE, gl.ONE); // additive: overlapping points become light
  gl.enable(gl.BLEND);

  // static seeds: x = spectral ramp position, y = size/brightness
  const seeds = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    seeds[i * 2] = Math.random();
    seeds[i * 2 + 1] = Math.random();
  }
  const seedBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
  gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
  const aSeed = gl.getAttribLocation(prog, 'a_seed');
  gl.enableVertexAttribArray(aSeed);
  gl.vertexAttribPointer(aSeed, 2, gl.FLOAT, false, 0, 0);

  const posBuf = gl.createBuffer();
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  const U = {
    res: gl.getUniformLocation(prog, 'u_res'),
    dpr: gl.getUniformLocation(prog, 'u_dpr'),
    stretch: gl.getUniformLocation(prog, 'u_stretch'),
    alpha: gl.getUniformLocation(prog, 'u_alpha'),
  };

  let w = 0;
  let h = 0;
  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    gl.viewport(0, 0, canvas.width, canvas.height);
    buildState(state); // re-aim every formation at the new geometry
  }

  // --- simulation state ---
  const pos = new Float32Array(N * 2);
  const vel = new Float32Array(N * 2);
  const tgt = new Float32Array(N * 2);
  const pending = new Float32Array(N * 2);
  const switchAt = new Float32Array(N); // 0 = settled on tgt
  const depth = new Float32Array(N);
  const phase = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 2] = Math.random() * window.innerWidth;
    pos[i * 2 + 1] = Math.random() * window.innerHeight;
    depth[i] = 0.25 + Math.random() * 0.75;
    phase[i] = Math.random() * Math.PI * 2;
  }

  let state = 'word';
  let now = 0;

  function sampleWord(out) {
    const c = document.createElement('canvas');
    const cw = 1000;
    const ch = 260;
    c.width = cw;
    c.height = ch;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#fff';
    g.font = '600 190px "Fraunces Variable", Georgia, serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('STILLE', cw / 2, ch / 2);
    const img = g.getImageData(0, 0, cw, ch).data;
    const pts = [];
    for (let y = 0; y < ch; y += 3) {
      for (let x = 0; x < cw; x += 3) {
        if (img[(y * cw + x) * 4 + 3] > 128) pts.push(x, y);
      }
    }
    const scale = Math.min((w * 0.72) / cw, 0.9);
    const ox = w / 2 - (cw * scale) / 2;
    const oy = h * 0.3 - (ch * scale) / 2;
    for (let i = 0; i < N; i++) {
      const p = (i * 2) % pts.length;
      out[i * 2] = ox + pts[p] * scale + (Math.random() - 0.5) * 3;
      out[i * 2 + 1] = oy + pts[p + 1] * scale + (Math.random() - 0.5) * 3;
    }
  }

  function samplePhone(out) {
    const pw = Math.min(w * 0.2, 280);
    const ph = pw * 1.95;
    const cx = w * 0.68;
    const cy = h * 0.5;
    for (let i = 0; i < N; i++) {
      const r = Math.random();
      let x;
      let y;
      if (r < 0.62) {
        // perimeter of the rounded frame
        const t = Math.random() * (pw + ph) * 2;
        if (t < pw) { x = cx - pw / 2 + t; y = cy - ph / 2; }
        else if (t < pw + ph) { x = cx + pw / 2; y = cy - ph / 2 + (t - pw); }
        else if (t < pw * 2 + ph) { x = cx + pw / 2 - (t - pw - ph); y = cy + ph / 2; }
        else { x = cx - pw / 2; y = cy + ph / 2 - (t - pw * 2 - ph); }
      } else if (r < 0.8) {
        // header call-bar
        x = cx - pw * 0.32 + Math.random() * pw * 0.64;
        y = cy - ph * 0.34 + (Math.random() - 0.5) * 5;
      } else {
        // the call button
        const a = Math.random() * Math.PI * 2;
        const rad = pw * 0.16 * (0.85 + Math.random() * 0.15);
        x = cx + Math.cos(a) * rad;
        y = cy + ph * 0.3 + Math.sin(a) * rad * 0.45;
      }
      out[i * 2] = x + (Math.random() - 0.5) * 4;
      out[i * 2 + 1] = y + (Math.random() - 0.5) * 4;
    }
  }

  function sampleField(out) {
    for (let i = 0; i < N; i++) {
      out[i * 2] = Math.random() * w;
      out[i * 2 + 1] = Math.random() * h;
    }
  }

  function sampleBand(out) {
    for (let i = 0; i < N; i++) {
      out[i * 2] = Math.random() * w;
      out[i * 2 + 1] = h * 0.52 + (Math.random() - 0.5) * 14 * (0.4 + depth[i]);
    }
  }

  const BUILDERS = { word: sampleWord, field: sampleField, phone: samplePhone, band: sampleBand };

  function buildState(next) {
    state = next;
    BUILDERS[next](pending);
    for (let i = 0; i < N; i++) switchAt[i] = now + Math.random() * 0.7;
  }

  // first formation waits for real glyphs
  document.fonts.ready.then(() => {
    resize();
    // the word assembles out of the initial scatter
    for (let i = 0; i < N; i++) switchAt[i] = now + Math.random() * 0.9;
  });
  window.addEventListener('resize', resize);
  resize();

  // --- inputs ---
  let mx = -9999;
  let my = -9999;
  if (!isCoarse) {
    window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  }
  let streak = 0;
  document.addEventListener('stille:velocity', (e) => {
    streak = Math.min(1, Math.abs(e.detail.v) * 0.02);
  });

  // --- choreography ---
  ScrollTrigger.create({
    trigger: '.s-hero',
    start: 'top top',
    end: 'bottom 55%',
    onLeave: () => buildState('field'),
    onEnterBack: () => buildState('word'),
  });
  ScrollTrigger.create({
    trigger: '.s-reveal',
    start: 'top 65%',
    end: 'bottom 40%',
    onEnter: () => buildState('phone'),
    onLeave: () => buildState('field'),
    onEnterBack: () => buildState('phone'),
    onLeaveBack: () => buildState('field'),
  });
  ScrollTrigger.create({
    trigger: '.s-finale',
    start: 'top 70%',
    onEnter: () => buildState('band'),
    onLeaveBack: () => buildState('field'),
  });

  // --- the loop ---
  const K = 0.055;
  const DAMP = 0.86;
  let lastScroll = window.scrollY;
  let frame = -1;
  let daylight = 0;

  gsap.ticker.add((time, dt) => {
    if (document.hidden) return;
    now = time;
    const dts = Math.min(dt / 16.7, 2); // normalize to ~60fps steps
    const scrollDelta = window.scrollY - lastScroll;
    lastScroll = window.scrollY;
    streak *= 0.92;

    const drift = state === 'field' ? 1 : 0;
    for (let i = 0; i < N; i++) {
      const ix = i * 2;
      const iy = ix + 1;
      if (switchAt[i] > 0 && now >= switchAt[i]) {
        tgt[ix] = pending[ix];
        tgt[iy] = pending[iy];
        switchAt[i] = 0;
      }

      // free field scrolls past with parallax; formations hold their ground
      if (drift) {
        tgt[iy] -= scrollDelta * depth[i] * 0.35;
        if (tgt[iy] < -20) tgt[iy] += h + 40;
        else if (tgt[iy] > h + 20) tgt[iy] -= h + 40;
      }

      const wob = Math.sin(time * (0.6 + depth[i]) + phase[i]) * (drift ? 14 : 2.2);
      let ax = (tgt[ix] + wob - pos[ix]) * K;
      let ay = (tgt[iy] + Math.cos(time * 0.9 + phase[i]) * (drift ? 10 : 1.8) - pos[iy]) * K;

      const dx = pos[ix] - mx;
      const dy = pos[iy] - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < 19600 && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const push = (1 - d / 140) * 4.2;
        ax += (dx / d) * push;
        ay += (dy / d) * push;
      }

      vel[ix] = (vel[ix] + ax * dts) * DAMP;
      vel[iy] = (vel[iy] + ay * dts) * DAMP;
      pos[ix] += vel[ix] * dts;
      pos[iy] += vel[iy] * dts + streak * scrollDelta * depth[i] * 0.3;
    }

    // the daylight passage dims the field so the pale ground stays clean
    // (style read sampled, not per-frame — getComputedStyle isn't free)
    if ((frame = (frame + 1) % 8) === 0) {
      daylight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--daylight')) || 0;
    }

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(U.res, w, h);
    gl.uniform1f(U.dpr, DPR);
    gl.uniform1f(U.stretch, streak);
    gl.uniform1f(U.alpha, 0.5 * (1 - daylight * 0.88));
    gl.drawArrays(gl.POINTS, 0, N);
  });
}
