import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { drawPage, drawStatus, PAGE_W, PAGE_H, STATUS_H } from './screen.js';

/*
 * A hi-vis orange phone, built from extruded rounded rectangles and lit by
 * a studio environment. Scroll progress drives the choreography (spin in,
 * then one pose per feature while the screen scrolls); the pointer adds a
 * little tilt on top.
 */

const W = 1;
const H = 2.06;
const R = 0.17;
const D = 0.07;
const BEVEL = 0.028;
const OUTER_W = W + BEVEL * 2;
const OUTER_H = H + BEVEL * 2;
const Z_FRONT = D / 2 + BEVEL;
const INSET = 0.045;
const SCREEN_W = W - INSET * 2;
const SCREEN_H = H - INSET * 2;
const VIEW_H = PAGE_W * (SCREEN_H / SCREEN_W); // page units visible at once
const MAX_SCROLL = PAGE_H - VIEW_H;
const TAU = Math.PI * 2;

// progress → pose. ry/rx/rz in radians, y as a fraction of view height,
// scr = how far the screen page has scrolled (0..1 of its range).
const KEYS = [
  [0.0, { ry: -2.75, rx: 0.34, rz: -0.14, y: -0.06, s: 0.8, scr: 0 }],
  [0.17, { ry: -0.44, rx: 0.1, rz: 0.03, y: 0, s: 1, scr: 0 }],
  [0.3, { ry: -0.3, rx: 0.06, rz: 0, y: 0, s: 1, scr: 0 }],
  [0.4, { ry: 0.3, rx: 0.04, rz: -0.02, y: 0, s: 1, scr: 0.49 }],
  [0.5, { ry: 0.38, rx: 0.07, rz: -0.03, y: 0, s: 1, scr: 0.49 }],
  [0.6, { ry: -0.26, rx: 0.1, rz: 0.02, y: 0, s: 1, scr: 1 }],
  [0.7, { ry: -0.34, rx: 0.08, rz: 0.02, y: 0, s: 1, scr: 1 }],
  [0.82, { ry: TAU - 0.3, rx: 0.02, rz: 0, y: 0, s: 1, scr: 0 }],
  [1.0, { ry: TAU - 0.18, rx: 0.05, rz: 0, y: 0, s: 1, scr: 0 }],
];

const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

function pose(p) {
  const out = {};
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
  const [p0, a] = KEYS[i];
  const [p1, b] = KEYS[i + 1];
  const t = smooth(Math.min(1, Math.max(0, (p - p0) / (p1 - p0))));
  for (const k in a) out[k] = lerp(a[k], b[k], t);
  return out;
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

// ShapeGeometry UVs come out in shape units; map them onto 0..1.
function flat(w, h, r, segments = 48) {
  const geo = new THREE.ShapeGeometry(roundedRect(w, h, r), segments);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  return geo;
}

function textTexture(text, renderer) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.font = '800 64px "Archivo Variable", sans-serif';
  if ('fontStretch' in ctx) ctx.fontStretch = 'expanded';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '14px';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 52);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function buildPhone(renderer) {
  const phone = new THREE.Group();
  const aniso = renderer.capabilities.getMaxAnisotropy();

  const metal = new THREE.MeshPhysicalMaterial({
    color: 0xff5a14,
    metalness: 1,
    roughness: 0.3,
    clearcoat: 0.5,
    clearcoatRoughness: 0.18,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x050505,
    metalness: 0,
    roughness: 0.06,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
  });
  const frost = new THREE.MeshPhysicalMaterial({
    color: 0xff4d00,
    metalness: 0,
    roughness: 0.48,
    clearcoat: 1,
    clearcoatRoughness: 0.4,
  });

  // body: caps are glass, sides + bevel are the anodized band
  const body = new THREE.ExtrudeGeometry(roundedRect(W, H, R), {
    depth: D,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 10,
    curveSegments: 40,
  });
  body.center();
  phone.add(new THREE.Mesh(body, [glass, metal]));

  // frosted back plate
  const back = new THREE.Mesh(flat(W - 0.012, H - 0.012, R - 0.006), frost);
  back.position.z = -Z_FRONT - 0.0008;
  back.rotation.y = Math.PI;
  phone.add(back);

  // camera plateau, top-left when you look at the back
  const bump = new THREE.Group();
  bump.position.set(W / 2 - 0.29, H / 2 - 0.29, -Z_FRONT);
  const plateau = new THREE.ExtrudeGeometry(roundedRect(0.44, 0.44, 0.12), {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 5,
    curveSegments: 24,
  });
  const plateauMesh = new THREE.Mesh(plateau, new THREE.MeshPhysicalMaterial({ color: 0xff5a14, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08 }));
  plateauMesh.rotation.y = Math.PI;
  bump.add(plateauMesh);
  const ring = new THREE.MeshPhysicalMaterial({ color: 0x2a2a28, metalness: 1, roughness: 0.25 });
  const lensGlass = new THREE.MeshPhysicalMaterial({ color: 0x06070a, roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0, iridescence: 0.6, iridescenceIOR: 1.6 });
  for (const [lx, ly] of [
    [0.095, 0.095],
    [0.095, -0.095],
    [-0.095, 0],
  ]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.082, 0.03, 48), ring);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(lx, ly, -0.035);
    bump.add(barrel);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.056, 48), lensGlass);
    lens.rotation.y = Math.PI;
    lens.position.set(lx, ly, -0.0505);
    bump.add(lens);
  }
  const flash = new THREE.Mesh(new THREE.CircleGeometry(0.022, 24), new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0x6b5a40, roughness: 0.3 }));
  flash.rotation.y = Math.PI;
  flash.position.set(-0.1, 0.13, -0.0235);
  bump.add(flash);
  phone.add(bump);

  // wordmark on the back
  const mark = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.094),
    new THREE.MeshBasicMaterial({ map: textTexture('STILLE', renderer), color: 0x0b0b0a, transparent: true, opacity: 0.82 }),
  );
  mark.rotation.y = Math.PI;
  mark.position.set(0, -0.32, -Z_FRONT - 0.0016);
  phone.add(mark);

  // buttons
  const button = (h, x, y) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(0.03, h, 0.042, 3, 0.012), metal);
    m.position.set(x, y, 0);
    phone.add(m);
  };
  const side = OUTER_W / 2 + 0.004;
  button(0.1, -side, 0.62);
  button(0.17, -side, 0.38);
  button(0.17, -side, 0.16);
  button(0.26, side, 0.36);

  // screen: emissive page under a glossy coat, so the studio lights glance off it
  const pageCanvas = drawPage(document.createElement('canvas'));
  const pageTex = new THREE.CanvasTexture(pageCanvas);
  pageTex.colorSpace = THREE.SRGBColorSpace;
  pageTex.anisotropy = aniso;
  pageTex.repeat.set(1, VIEW_H / PAGE_H);
  const screenMat = new THREE.MeshPhysicalMaterial({
    color: 0x000000,
    emissive: 0xffffff,
    emissiveMap: pageTex,
    roughness: 0.1,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 0.4,
    toneMapped: false,
  });
  const screen = new THREE.Mesh(flat(SCREEN_W, SCREEN_H, R - INSET), screenMat);
  screen.position.z = Z_FRONT + 0.001;
  phone.add(screen);

  const statusTex = new THREE.CanvasTexture(drawStatus(document.createElement('canvas')));
  statusTex.colorSpace = THREE.SRGBColorSpace;
  statusTex.anisotropy = aniso;
  const statusH = SCREEN_H * (STATUS_H / VIEW_H);
  // clip the bar's top corners to the screen's radius by drawing it as a
  // slice of the same rounded shape
  const statusGeo = flat(SCREEN_W, SCREEN_H, R - INSET);
  const sp = statusGeo.attributes.position;
  const suv = statusGeo.attributes.uv;
  for (let i = 0; i < sp.count; i++) {
    const yTop = SCREEN_H / 2 - sp.getY(i);
    if (yTop > statusH) sp.setY(i, SCREEN_H / 2 - statusH);
    suv.setY(i, 1 - Math.min(yTop, statusH) / statusH);
  }
  const status = new THREE.Mesh(statusGeo, new THREE.MeshBasicMaterial({ map: statusTex, toneMapped: false }));
  status.position.z = Z_FRONT + 0.0016;
  phone.add(status);

  const home = new THREE.Mesh(flat(0.3, 0.014, 0.007, 8), new THREE.MeshBasicMaterial({ color: 0x121211, toneMapped: false }));
  home.position.set(0, -SCREEN_H / 2 + 0.03, Z_FRONT + 0.0016);
  phone.add(home);

  return {
    phone,
    setScroll(t) {
      // canvas row 0 is the top of the page; UV v=1 is the top of the texture
      pageTex.offset.y = 1 - (VIEW_H + t * MAX_SCROLL) / PAGE_H;
    },
  };
}

function haloTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255, 77, 0, 0.55)');
  g.addColorStop(0.45, 'rgba(255, 77, 0, 0.16)');
  g.addColorStop(1, 'rgba(255, 77, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createPhone(canvas, { reduceMotion }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.95;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff8a3d, 2.2);
  rim.position.set(4, 1, -3);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 5);

  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: haloTexture(), transparent: true, depthWrite: false, toneMapped: false }),
  );
  halo.position.z = -1.6;
  scene.add(halo);

  const rig = new THREE.Group(); // layout position + scale
  const spin = new THREE.Group(); // choreography + pointer tilt
  const { phone, setScroll } = buildPhone(renderer);
  spin.add(phone);
  rig.add(spin);
  scene.add(rig);

  const layout = { x: 0, yIntro: 0, yFeat: 0, scale: 1, visH: 1 };
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const visW = visH * camera.aspect;
    layout.visH = visH;
    if (camera.aspect >= 1) {
      layout.scale = Math.min((0.76 * visH) / OUTER_H, (0.3 * visW) / OUTER_W);
      layout.x = visW * 0.2;
      layout.yIntro = layout.yFeat = -0.01 * visH;
    } else {
      layout.scale = Math.min((0.46 * visH) / OUTER_H, (0.62 * visW) / OUTER_W);
      layout.x = 0;
      layout.yIntro = -0.2 * visH;
      layout.yFeat = 0.11 * visH;
    }
    halo.scale.setScalar(OUTER_H * layout.scale * 2.2);
    needsRender = true;
  };

  const state = { progress: 0, px: 0, py: 0, tx: 0, ty: 0 };
  let needsRender = true;
  let visible = false;
  let clock = 0;

  const render = (dt) => {
    clock += dt;
    state.tx += (state.px - state.tx) * Math.min(1, dt * 4);
    state.ty += (state.py - state.ty) * Math.min(1, dt * 4);
    const p = pose(state.progress);
    const feat = smooth(Math.min(1, Math.max(0, (state.progress - 0.1) / 0.12)));
    const bob = reduceMotion ? 0 : Math.sin(clock * 1.3) * 0.02;

    rig.position.set(layout.x, lerp(layout.yIntro, layout.yFeat, feat) + p.y * layout.visH + bob, 0);
    rig.scale.setScalar(layout.scale * p.s);
    spin.rotation.set(p.rx + state.ty * 0.18, p.ry + state.tx * 0.32, p.rz + (reduceMotion ? 0 : Math.sin(clock * 0.8) * 0.012));
    halo.position.x = rig.position.x;
    halo.position.y = rig.position.y;
    setScroll(p.scr);
    renderer.render(scene, camera);
    needsRender = false;
  };

  resize();
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }).observe(canvas);

  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (visible && (needsRender || !reduceMotion)) render(dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  return {
    setProgress(p) {
      state.progress = p;
      needsRender = true;
    },
    pointer(nx, ny) {
      state.px = nx;
      state.py = ny;
    },
  };
}
