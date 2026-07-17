import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/*
 * The object itself — a real-time 3D Mono One, modeled entirely in code.
 * No downloaded geometry, no textures: lathe profiles, a procedural room
 * environment for reflections, and cold-light rig. Scroll flies the camera:
 * a dark glimpse in the hero, a slow reveal-orbit while the signal wakes,
 * a hand-off into black as the technical drawing takes over, and a final
 * near-dark return for "Hear nothing else."
 */

import { stage } from './stage.js';

const GRAPHITE = 0x2c3340;
const ICE_METAL = 0xc7cedb;

export { stage };

export function initScene3d(ctx) {
  const canvas = document.getElementById('scene');
  if (!canvas || !window.WebGLRenderingContext) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return; // grain fallback already covers a WebGL-less world
  }

  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCoarse ? 1.25 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = !isCoarse;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060b, 0.34);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 40);

  // ——— the Mono One, lathed from numbers ———
  const speaker = new THREE.Group();

  const startsIce = document.documentElement.dataset.finish === 'ice';
  const shellMat = new THREE.MeshPhysicalMaterial({
    color: startsIce ? ICE_METAL : GRAPHITE,
    metalness: 0.9,
    roughness: startsIce ? 0.5 : 0.38,
    clearcoat: 0.06,
    clearcoatRoughness: 0.5,
    envMapIntensity: 0.85,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x171c27,
    metalness: 0.45,
    roughness: 0.68,
    envMapIntensity: 0.4,
  });
  const coneMat = new THREE.MeshStandardMaterial({
    color: 0x111620,
    metalness: 0.25,
    roughness: 0.82,
    envMapIntensity: 0.3,
  });
  const domeMat = new THREE.MeshPhysicalMaterial({
    color: 0x4a5363,
    metalness: 1,
    roughness: 0.22,
    envMapIntensity: 1.1,
  });

  // column: r 0.13, feet at 0.145, rounded crown at 1.12 (fillet r 0.05)
  const profile = [];
  profile.push(new THREE.Vector2(0.001, 0.145));
  profile.push(new THREE.Vector2(0.13, 0.145));
  profile.push(new THREE.Vector2(0.13, 1.07));
  for (let i = 1; i <= 10; i++) {
    const a = (i / 10) * Math.PI * 0.5;
    profile.push(new THREE.Vector2(0.08 + 0.05 * Math.cos(a), 1.07 + 0.05 * Math.sin(a)));
  }
  profile.push(new THREE.Vector2(0.001, 1.12));
  const shell = new THREE.Mesh(new THREE.LatheGeometry(profile, 96), shellMat);
  shell.castShadow = !isCoarse;
  speaker.add(shell);

  // plinth under a 25 mm shadow gap
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.122, 0.126, 0.115, 96), darkMat);
  plinth.position.y = 0.0575;
  plinth.castShadow = !isCoarse;
  speaker.add(plinth);

  // the single concentric driver, facing the camera's opening position
  const driver = new THREE.Group();
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.009, 24, 72), shellMat);
  const rim2 = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.004, 16, 64), darkMat);
  const coneProfile = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.03, 0.012),
    new THREE.Vector2(0.076, 0.05),
  ];
  const cone = new THREE.Mesh(new THREE.LatheGeometry(coneProfile, 72), coneMat);
  cone.rotation.x = Math.PI / 2;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.026, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
  dome.rotation.x = Math.PI / 2;
  dome.position.z = 0.012;
  driver.add(trim, rim2, cone, dome);
  driver.position.set(0, 0.86, 0.128);
  const recess = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.03, 72), coneMat);
  recess.rotation.x = Math.PI / 2;
  recess.position.set(0, 0.86, 0.115);
  speaker.add(recess, driver);

  scene.add(speaker);

  // floor that swallows light
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(7, 48),
    new THREE.MeshStandardMaterial({ color: 0x070912, roughness: 1, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = !isCoarse;
  scene.add(ground);

  // ——— light: cold key, electric rim, a trace of aurora in the shadow ———
  const key = new THREE.SpotLight(0xdce4f2, stage.P.keyI, 0, 0.55, 1, 1.6);
  key.position.set(-1.7, 2.3, 1.5);
  key.target = speaker;
  key.castShadow = !isCoarse;
  if (key.shadow) {
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0004;
  }
  const rim = new THREE.DirectionalLight(0x5b6cff, stage.P.rimI);
  rim.position.set(1.9, 1.1, -1.7);
  const auroraRim = new THREE.DirectionalLight(0x9d7bff, stage.P.rimI * 0.3);
  auroraRim.position.set(-1.4, 0.8, -2.1);
  const fill = new THREE.AmbientLight(0x1a2030, 0.6);
  scene.add(key, rim, auroraRim, fill);

  // ——— sizing ———
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // ——— the camera rig ———
  const P = stage.P;
  let mx = 0;
  let my = 0;
  let smx = 0;
  let smy = 0;
  if (!isCoarse) {
    window.addEventListener(
      'pointermove',
      (e) => {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
      },
      { passive: true },
    );
  }

  let autoPhase = 0;
  let breathPhase = 0;

  function render(dt) {
    if (P.fade <= 0.012) {
      canvas.style.opacity = '0';
      return; // nothing to see: skip the GPU entirely
    }
    canvas.style.opacity = String(P.fade);

    autoPhase += P.drift * dt;
    breathPhase += dt;
    smx += (mx - smx) * Math.min(1, dt * 3);
    smy += (my - smy) * Math.min(1, dt * 3);

    const orbit = P.orbit + autoPhase + (P.spinOffset || 0) + smx * 0.05;
    const height = P.height + smy * -0.06;
    camera.position.set(Math.sin(orbit) * P.radius, height, Math.cos(orbit) * P.radius);
    camera.lookAt(P.lookX, P.targetY, 0);

    // Barely perceptible movement keeps the object from reading as a render.
    speaker.position.y = Math.sin(breathPhase * 0.45) * 0.004;
    speaker.rotation.z = Math.sin(breathPhase * 0.31) * 0.0015;
    key.position.x = -1.7 + Math.sin(breathPhase * 0.27) * 0.08;

    key.intensity = P.keyI;
    rim.intensity = P.rimI;
    auroraRim.intensity = P.rimI * 0.3;
    renderer.toneMappingExposure = P.exposure;

    renderer.render(scene, camera);
  }

  // ——— the finish configurator reaches the real object too ———
  document.addEventListener('stille:finish', (e) => {
    const ice = e.detail === 'ice';
    if (ctx.reduceMotion) {
      shellMat.color.setHex(ice ? ICE_METAL : GRAPHITE);
      shellMat.roughness = ice ? 0.5 : 0.38;
      shellMat.needsUpdate = true;
      render(0);
      return;
    }
    gsap.to(shellMat.color, {
      r: ((ice ? ICE_METAL : GRAPHITE) >> 16 & 255) / 255,
      g: ((ice ? ICE_METAL : GRAPHITE) >> 8 & 255) / 255,
      b: ((ice ? ICE_METAL : GRAPHITE) & 255) / 255,
      duration: 0.9,
      ease: 'power2.inOut',
    });
    gsap.to(shellMat, { roughness: ice ? 0.5 : 0.38, duration: 0.9 });
  });

  if (ctx.reduceMotion) {
    P.drift = 0;
    render(0); // one considered still frame
    window.addEventListener('resize', () => render(0));
    return stage;
  }

  let last = 0;
  gsap.ticker.add((time) => {
    const dt = last ? Math.min(time - last, 0.1) : 0;
    last = time;
    if (!document.hidden) render(dt);
  });

  // ——— scroll choreography: the igloo move, scoped to our story ———

  // 01 · while the signal wakes, the camera slowly circles into the light
  gsap.to(P, {
    orbit: 0.45,
    radius: 1.5,
    height: 0.88,
    keyI: 10,
    exposure: 0.88,
    ease: 'none',
    scrollTrigger: {
      trigger: '.s-wave',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.6,
    },
  });

  // 02 · hand the stage to the technical drawing: the object sinks into black
  gsap.fromTo(
    P,
    { fade: 1 },
    {
      fade: 0,
      ease: 'none',
      immediateRender: false,
      scrollTrigger: {
        trigger: '.s-reveal',
        start: 'top 80%',
        end: 'top 25%',
        scrub: 0.5,
        onLeave: () => {
          P.fade = 0;
          canvas.style.opacity = '0';
        },
        onLeaveBack: () => {
          P.fade = 1;
          canvas.style.opacity = '1';
        },
      },
    },
  );

  // 07 · the return: near-dark, centered, the light dying with the sine
  const finaleIn = gsap.timeline({
    scrollTrigger: {
      trigger: '.s-finale',
      start: 'top 90%',
      end: 'bottom bottom',
      scrub: 0.6,
    },
  });
  finaleIn
    .set(P, { orbit: 2.75, radius: 2.3, height: 0.58, targetY: 0.6, lookX: 0, drift: 0.008 }, 0)
    .to(P, { fade: 0.85, keyI: 3.2, rimI: 2.4, exposure: 0.7, duration: 0.35, ease: 'none' }, 0)
    .to(P, { keyI: 1.1, rimI: 0.5, exposure: 0.58, duration: 0.65, ease: 'power1.in' }, 0.35);

  return stage;
}
