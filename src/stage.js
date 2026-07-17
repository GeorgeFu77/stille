/*
 * The 3D camera rig's tweenable state — kept dependency-free so sections
 * can choreograph it while the heavy renderer (three.js) loads lazily.
 */
export const stage = {
  P: {
    orbit: -0.35,
    spinOffset: 0, // user-imparted spin (drag the speaker in the hero)
    radius: 1.9,
    height: 0.72,
    targetY: 0.62,
    lookX: -0.42,
    drift: 0.022,
    keyI: 4.0,
    rimI: 2.2,
    exposure: 0.72,
    fade: 1,
  },
};
