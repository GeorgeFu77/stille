/*
 * Hero background: a slow, domain-warped heat field rendered as a thermal
 * map — dark ember ground, molten orange pooling along the bottom edge, thin
 * contour lines riding the isotherms. The pointer is a heat source.
 * Plain WebGL2 (one triangle, one shader) so the hero never waits on three.js.
 */

const vertexShader = /* glsl */ `#version 300 es
  in vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `#version 300 es
  precision highp float;
  out vec4 outColor;

  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform float uHeat;
  uniform float uFade;

  // Ashima simplex noise
  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      s += a * snoise(p);
      p = p * 2.02 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return s;
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  vec3 ramp(float h) {
    vec3 c0 = vec3(0.043, 0.043, 0.039);
    vec3 c1 = vec3(0.20, 0.045, 0.012);
    vec3 c2 = vec3(1.0, 0.30, 0.0);
    vec3 c3 = vec3(1.0, 0.75, 0.52);
    vec3 col = mix(c0, c1, smoothstep(0.3, 0.66, h));
    col = mix(col, c2, smoothstep(0.66, 0.98, h));
    col = mix(col, c3, smoothstep(1.0, 1.2, h));
    return col;
  }

  void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    float t = uTime * 0.035;

    // big, slow forms: low frequency, gentle warp
    vec2 q = vec2(fbm(p * 0.62 + vec2(0.0, t)), fbm(p * 0.62 + vec2(5.2, -t)));
    vec2 r = vec2(
      fbm(p * 0.7 + 1.9 * q + vec2(1.7, 9.2) + 0.6 * t),
      fbm(p * 0.7 + 1.9 * q + vec2(8.3, 2.8) - 0.4 * t)
    );
    float f = fbm(p * 0.55 + 1.6 * r - vec2(0.0, t * 1.6));

    vec2 m = (uMouse - 0.5 * uRes) / uRes.y;
    float heat = smoothstep(0.7, 0.0, length(p - m)) * uHeat;

    // heat pools along the bottom edge and around the pointer
    float bottom = smoothstep(0.25, -0.75, p.y);
    float h = 0.5 + 0.55 * f + 0.22 * length(r) - 0.06;
    h = h * (0.36 + 0.92 * bottom) + heat * 0.36;

    vec3 col = ramp(h);

    // isotherms: a few thin anti-aliased contour lines
    float bands = h * 8.0;
    float line = abs(fract(bands) - 0.5) / max(fwidth(bands), 1e-4);
    float contour = 1.0 - smoothstep(0.0, 1.0, line);
    col += contour * vec3(1.0, 0.36, 0.06) * smoothstep(0.2, 0.62, h) * 0.5;

    // vignette, scroll fade, grain
    col *= smoothstep(1.45, 0.25, length(p * vec2(0.72, 1.0)));
    col *= 1.0 - uFade * 0.8;
    col += (hash(gl_FragCoord.xy + fract(uTime * 7.0) * 61.0) - 0.5) * 0.03;

    outColor = vec4(col, 1.0);
  }
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

export function createEmber(canvas, { reduceMotion }) {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('WebGL2 unavailable');

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexShader));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentShader));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);

  // one oversized triangle covers the whole viewport
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const u = Object.fromEntries(['uTime', 'uRes', 'uMouse', 'uHeat', 'uFade'].map((n) => [n, gl.getUniformLocation(program, n)]));

  // The field is soft, so it renders under native resolution and lets the
  // browser upscale: a fraction of the fragment cost for the same look.
  const scale = Math.min(window.devicePixelRatio || 1, 1.25) * 0.72;
  const state = { time: 12, fade: 0, heat: 0, heatTarget: 0, mx: -9999, my: -9999, x: -9999, y: -9999 };

  const resize = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth * scale));
    const h = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    if (!raf) draw();
  };

  const draw = () => {
    gl.uniform1f(u.uTime, state.time);
    gl.uniform2f(u.uRes, canvas.width, canvas.height);
    gl.uniform2f(u.uMouse, state.x, state.y);
    gl.uniform1f(u.uHeat, state.heat);
    gl.uniform1f(u.uFade, state.fade);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  let active = true;
  let raf = 0;
  let last = 0;

  const frame = (now) => {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    state.time += dt;
    state.heat += (state.heatTarget - state.heat) * 0.05;
    state.x += (state.mx - state.x) * 0.08;
    state.y += (state.my - state.y) * 0.08;
    draw();
    if (active && !reduceMotion) raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (raf || !active) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  resize();
  new ResizeObserver(resize).observe(canvas);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    active = false;
  });
  start();

  return {
    pointer(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const s = canvas.width / rect.width;
      state.mx = (clientX - rect.left) * s;
      state.my = (rect.bottom - clientY) * s;
      if (state.x < -999) {
        state.x = state.mx;
        state.y = state.my;
      }
      state.heatTarget = 1;
    },
    leave() {
      state.heatTarget = 0;
    },
    setFade(v) {
      state.fade = v;
      if (reduceMotion) draw();
    },
    setActive(on) {
      active = on;
      if (on) start();
    },
  };
}
