// Emberveil — Mira herself: movement with wall sliding, sneak state, and the
// little footstep timer the sound bank listens to.

import { FIELD, PLAYER } from './config.js';

export function createPlayer(start) {
  return {
    x: start.x, y: start.y, radius: PLAYER.radius,
    angle: -Math.PI / 2, sneaking: false, moving: false,
    stepTimer: 0, hidden: false,
  };
}

function circleHitsSolid(x, y, r, solids) {
  for (const s of solids) {
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
  }
  return false;
}

/** Move Mira one step. input: {x, y} unit-ish direction, sneak flag. Returns true if a footstep fell. */
export function updatePlayer(player, input, dt, solids, onStep) {
  player.sneaking = !!input.sneak;
  const speed = player.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  let dx = input.x; let dy = input.y;
  const len = Math.hypot(dx, dy);
  player.moving = len > 0.01;
  if (!player.moving) return false;
  dx /= len; dy /= len;
  player.angle = Math.atan2(dy, dx);
  const nx = player.x + dx * speed * dt;
  if (!circleHitsSolid(nx, player.y, player.radius, solids)) player.x = nx;
  const ny = player.y + dy * speed * dt;
  if (!circleHitsSolid(player.x, ny, player.radius, solids)) player.y = ny;
  player.x = Math.max(player.radius, Math.min(FIELD.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(FIELD.height - player.radius, player.y));
  player.stepTimer -= dt;
  if (player.stepTimer <= 0) {
    player.stepTimer = player.sneaking ? 0.42 : 0.27;
    if (onStep) onStep(player.sneaking);
    return true;
  }
  return false;
}
