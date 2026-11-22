// Emberveil — the museum wardens. Each patrols a loop of waypoints, pausing to
// look around; suspicion fills while Mira is in a lit cone, and a full meter turns
// a patrol into a chase — and a chase into a museum-wide alarm. Lose sight of her
// long enough and the wardens cool down and walk back to their rounds.

import { GUARD, SIGHT } from './config.js';
import { guardSees, angleDifference } from './vision.js';
import { playerHiddenIn } from './levels.js';

export function createGuards(level) {
  return level.guards.map((patrol, i) => ({
    x: patrol.points[0].x, y: patrol.points[0].y, radius: GUARD.radius,
    angle: i % 2 === 0 ? 0 : Math.PI,
    patrol, target: 1 % patrol.points.length, pauseTimer: 0,
    mode: 'patrol', // patrol | chase | return
    suspicion: 0, loseTimer: 0, lastSeen: null, scanPhase: i * 1.7,
  }));
}

function moveToward(g, tx, ty, speed, dt, solids) {
  const dx = tx - g.x; const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const want = Math.atan2(dy, dx);
  let turn = angleDifference(want, g.angle);
  g.angle += Math.max(-3.4 * dt, Math.min(3.4 * dt, turn));
  const nx = g.x + Math.cos(g.angle) * speed * dt;
  const ny = g.y + Math.sin(g.angle) * speed * dt;
  let blocked = false;
  for (const s of solids) {
    const cx = Math.max(s.x, Math.min(nx, s.x + s.w));
    const cy = Math.max(s.y, Math.min(ny, s.y + s.h));
    if ((nx - cx) * (nx - cx) + (ny - cy) * (ny - cy) < g.radius * g.radius) { blocked = true; break; }
  }
  if (!blocked) { g.x = nx; g.y = ny; }
  else g.angle += dt * 2.2; // sidestep around the furniture
  return dist < 10;
}

export function updateGuards(state, dt, events) {
  const { level, player, solids } = state;
  const hidden = playerHiddenIn(level, player.x, player.y);
  player.hidden = hidden;
  let worst = 0;

  for (const g of state.guards) {
    const view = hidden ? { seen: false, dist: 999 } : guardSees(g, player.x, player.y, GUARD.coneRange, GUARD.coneHalfAngle, solids);
    if (view.seen) {
      const closeness = 1 - view.dist / GUARD.coneRange;
      let rate = SIGHT.fillFar + (SIGHT.fillPerSecond - SIGHT.fillFar) * closeness;
      if (player.sneaking) rate *= SIGHT.sneakFactor;
      const before = g.suspicion;
      g.suspicion = Math.min(1, g.suspicion + rate * dt);
      g.lastSeen = { x: player.x, y: player.y };
      g.loseTimer = 0;
      if (before < 0.45 && g.suspicion >= 0.45 && g.mode === 'patrol') events.push('suspicious');
      if (g.suspicion >= 1 && g.mode !== 'chase') {
        g.mode = 'chase';
        events.push('spotted');
        if (!state.alarm) { state.alarm = true; state.alarmTimer = SIGHT.alarmSeconds; events.push('alarm'); }
      }
    } else {
      g.suspicion = Math.max(0, g.suspicion - SIGHT.decayPerSecond * dt);
      if (g.mode === 'chase') {
        g.loseTimer += dt;
        if (g.loseTimer > SIGHT.chaseMemory) { g.mode = 'return'; g.suspicion = 0.4; }
      }
    }
    worst = Math.max(worst, g.suspicion);

    if (state.alarm && g.mode !== 'chase') { g.mode = 'chase'; if (!g.lastSeen) g.lastSeen = { x: player.x, y: player.y }; }

    if (g.mode === 'chase') {
      const goal = (view.seen || g.loseTimer < 0.4) ? player : (g.lastSeen || player);
      moveToward(g, goal.x, goal.y, GUARD.chaseSpeed, dt, solids);
      const d = Math.hypot(player.x - g.x, player.y - g.y);
      if (d < GUARD.catchDistance) events.push('caught');
    } else if (g.mode === 'return') {
      const p = g.patrol.points[g.target];
      if (moveToward(g, p.x, p.y, GUARD.returnSpeed, dt, solids)) g.mode = 'patrol';
    } else {
      // patrol: walk the loop, pause and sweep the lantern at each waypoint
      if (g.pauseTimer > 0) {
        g.pauseTimer -= dt;
        g.angle += Math.sin(state.time * 1.6 + g.scanPhase) * dt * 0.9;
      } else {
        const p = g.patrol.points[g.target];
        if (moveToward(g, p.x, p.y, GUARD.patrolSpeed, dt, solids)) {
          g.target = (g.target + 1) % g.patrol.points.length;
          g.pauseTimer = g.patrol.pause;
        }
      }
      // a half-full meter makes a warden drift toward the last glimpse
      if (g.suspicion > 0.45 && g.lastSeen) moveToward(g, g.lastSeen.x, g.lastSeen.y, GUARD.patrolSpeed * 0.8, dt, solids);
    }
  }

  if (state.alarm) {
    state.alarmTimer -= dt;
    const anySee = state.guards.some((g) => g.mode === 'chase' && g.loseTimer < 0.4);
    if (!anySee && state.alarmTimer <= 0) { state.alarm = false; for (const g of state.guards) if (g.mode === 'chase') g.mode = 'return'; }
    if (state.alarmTimer < -4) state.alarm = false;
  }
  state.detection = worst;
  return worst;
}
