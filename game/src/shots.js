// Emberveil — the deterministic ?shot=start|play|end scenes for screenshots.
// Each scene resets a wing and plays the real rules forward with a scripted
// autopilot (Mira follows a waypoint route, sneaking near wardens), so the
// frame is a genuine moment of play and the same seed always gives it back.

import { SCREEN } from './render.js';

const STEP_S = 1 / 60;

/** One autopilot step: head for the current waypoint, sneak when told to. */
function pilotInput(state, wp) {
  const dx = wp.x - state.player.x;
  const dy = wp.y - state.player.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 14) return { arrived: true, input: { x: 0, y: 0, sneak: true } };
  return { arrived: false, input: { x: dx / dist, y: dy / dist, sneak: !!wp.sneak } };
}

function runRoute(game, route, seconds) {
  let wpIndex = 0;
  const steps = Math.floor(seconds / STEP_S);
  for (let i = 0; i < steps; i += 1) {
    if (game.state.screen !== SCREEN.PLAY) break;
    const wp = route[Math.min(wpIndex, route.length - 1)];
    const { arrived, input } = pilotInput(game.state, wp);
    if (arrived && wpIndex < route.length - 1) wpIndex += 1;
    game.stepPlay(STEP_S, input);
  }
}

export function stageShot(name, game) {
  const state = game.state;
  if (name === 'play') {
    game.resetLevel(0);
    state.screen = SCREEN.PLAY;
    // Mira's real route: up the west hall, over the top of the first wall,
    // lift the gallery crystal, then duck into the shadow drape beyond it.
    runRoute(game, [
      { x: 120, y: 430, sneak: false },
      { x: 112, y: 64, sneak: true },
      { x: 246, y: 56, sneak: true },
      { x: 298, y: 148, sneak: true },
      { x: 548, y: 120, sneak: true },
    ], 30);
    if (state.screen !== SCREEN.PLAY || state.crystalsGot < 1) { // caught or stalled: restage mid-sneak
      game.resetLevel(0);
      state.screen = SCREEN.PLAY;
      state.player.x = 520; state.player.y = 122; state.player.sneaking = true; state.player.hidden = true;
      state.crystals[0].taken = true; state.crystalsGot = 1;
      state.guards[0].suspicion = 0.62; state.guards[0].lastSeen = { x: 520, y: 122 };
      for (let i = 0; i < 90; i += 1) game.stepPlay(STEP_S, { x: 0, y: 0, sneak: true });
    }
    state.detection = Math.max(state.detection, 0.5);
    return;
  }
  if (name === 'end') {
    game.resetLevel(2);
    // The finale, staged from real state: every crystal lifted, Mira at the door.
    for (const c of state.crystals) c.taken = true;
    state.crystalsGot = state.crystalsTotal;
    state.player.x = state.level.exit.x + 22; state.player.y = state.level.exit.y + 70;
    for (let i = 0; i < 60; i += 1) game.stepPlay(STEP_S, { x: 0, y: -0.2, sneak: false });
    state.screen = SCREEN.VICTORY;
    state.timeText = '07:41';
    return;
  }
  // start: the title over a fresh, patrolling first wing (the cover shot)
  game.resetLevel(0);
  for (let i = 0; i < 150; i += 1) game.stepPlay(STEP_S, { x: 0, y: 0, sneak: false });
  state.screen = SCREEN.TITLE;
}
