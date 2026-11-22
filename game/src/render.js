// Emberveil — everything drawn: the night-museum floor, lit tiles and shadow
// drapes, crates and shelves, lantern cones, crystals, Mira, the wardens, and
// every screen (title, intro card, pause, caught, wing clear, victory, game over).

import { FIELD, PALETTE, FONT, GAME_TITLE, GAME_SUBTITLE } from './config.js';
import { conePolygon } from './vision.js';
import { GUARD } from './config.js';

export const SCREEN = { TITLE: 'title', INTRO: 'intro', PLAY: 'play', PAUSE: 'pause', CAUGHT: 'caught', CLEAR: 'clear', VICTORY: 'victory', OVER: 'over' };

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function button(ctx, state, id, x, y, w, h, label, accent = false) {
  ctx.fillStyle = accent ? PALETTE.accent : 'rgba(70,80,130,0.9)';
  rr(ctx, x, y, w, h, 10); ctx.fill();
  ctx.fillStyle = accent ? '#23180a' : PALETTE.text;
  ctx.font = '600 17px ' + FONT;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  state.buttons.push({ id, x, y, w, h });
}

function drawWorld(ctx, state) {
  const { level } = state;
  ctx.fillStyle = PALETTE.night; ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // lit floor with a tile grid
  ctx.fillStyle = PALETTE.floorLit; ctx.fillRect(14, 14, FIELD.width - 28, FIELD.height - 28);
  ctx.strokeStyle = PALETTE.floorTile; ctx.lineWidth = 1;
  for (let x = 14; x < FIELD.width - 14; x += 48) { ctx.beginPath(); ctx.moveTo(x, 14); ctx.lineTo(x, FIELD.height - 14); ctx.stroke(); }
  for (let y = 14; y < FIELD.height - 14; y += 48) { ctx.beginPath(); ctx.moveTo(14, y); ctx.lineTo(FIELD.width - 14, y); ctx.stroke(); }
  // shadow drapes — the safe dark
  for (const s of level.shadows) {
    ctx.fillStyle = PALETTE.floorShadow; rr(ctx, s.x, s.y, s.w, s.h, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(120,130,190,0.35)'; ctx.setLineDash([5, 5]); rr(ctx, s.x, s.y, s.w, s.h, 8); ctx.stroke(); ctx.setLineDash([]);
  }
  // exit door
  const e = level.exit;
  const open = state.crystalsGot >= state.crystalsTotal;
  ctx.fillStyle = open ? PALETTE.exitOpen : PALETTE.exitClosed;
  rr(ctx, e.x, e.y, e.w, e.h, 6); ctx.fill();
  if (open) { ctx.fillStyle = 'rgba(57,217,138,0.25)'; rr(ctx, e.x - 8, e.y - 8, e.w + 16, e.h + 16, 10); ctx.fill(); }
  ctx.fillStyle = '#0b0e1a'; ctx.font = '700 11px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2);
  // vision cones under the furniture line
  for (const g of state.guards) {
    const poly = conePolygon(g, GUARD.coneRange, GUARD.coneHalfAngle, state.solids);
    ctx.fillStyle = g.mode === 'chase' ? PALETTE.coneAlert : g.suspicion > 0.45 ? PALETTE.coneSuspicious : PALETTE.coneCalm;
    ctx.beginPath(); ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath(); ctx.fill();
  }
  // solids: walls, crates, shelves
  for (const s of state.solids) {
    ctx.fillStyle = s.kind === 'crate' ? PALETTE.crate : s.kind === 'shelf' ? PALETTE.shelf : PALETTE.wall;
    rr(ctx, s.x, s.y, s.w, s.h, 4); ctx.fill();
    ctx.fillStyle = s.kind === 'crate' ? PALETTE.crateTop : s.kind === 'shelf' ? PALETTE.shelfTop : PALETTE.wallTop;
    rr(ctx, s.x, s.y, s.w, 7, 4); ctx.fill();
    if (s.kind === 'shelf') { ctx.fillStyle = 'rgba(255,255,255,0.13)'; for (let bx = s.x + 8; bx < s.x + s.w - 8; bx += 13) ctx.fillRect(bx, s.y + 13, 7, Math.max(4, s.h - 20)); }
    if (s.kind === 'crate') { ctx.strokeStyle = 'rgba(0,0,0,0.3)'; rr(ctx, s.x + 4, s.y + 4, s.w - 8, s.h - 8, 3); ctx.stroke(); }
  }
  // crystals
  for (const c of state.crystals) {
    if (c.taken) continue;
    const pulse = 1 + Math.sin(state.time * 3.4 + c.x) * 0.15;
    ctx.save(); ctx.translate(c.x, c.y); ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(255,179,71,0.28)'; ctx.beginPath(); ctx.arc(0, 0, 17, 0, 7); ctx.fill();
    ctx.fillStyle = PALETTE.crystal; ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, 0); ctx.lineTo(0, 11); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = PALETTE.crystalCore; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(4, 0); ctx.lineTo(0, 5); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // pickup particles
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = PALETTE.crystal; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  drawGuards(ctx, state);
  drawPlayer(ctx, state);
}

function drawPlayer(ctx, state) {
  const p = state.player;
  ctx.save(); ctx.translate(p.x, p.y);
  if (p.hidden) ctx.globalAlpha = 0.55;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 5, 11, 5, 0, 0, 7); ctx.fill();
  ctx.rotate(p.angle);
  ctx.fillStyle = PALETTE.playerCloak; ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-9, -10); ctx.lineTo(-5, 0); ctx.lineTo(-9, 10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = PALETTE.player; ctx.beginPath(); ctx.arc(2, 0, 6.5, 0, 7); ctx.fill();
  ctx.restore();
  if (p.sneaking) { ctx.fillStyle = PALETTE.muted; ctx.font = '600 10px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('sneaking', p.x, p.y - 20); }
}

function drawGuards(ctx, state) {
  for (const g of state.guards) {
    ctx.save(); ctx.translate(g.x, g.y);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 6, 12, 5, 0, 0, 7); ctx.fill();
    ctx.rotate(g.angle);
    ctx.fillStyle = PALETTE.guardDark; ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fill();
    ctx.fillStyle = PALETTE.guard; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe9b0'; ctx.beginPath(); ctx.arc(9, 0, 4, 0, 7); ctx.fill(); // the lantern
    ctx.restore();
    // mood marks + per-warden suspicion arc
    if (g.mode === 'chase') mark(ctx, g, '!', '#ff5a4f');
    else if (g.suspicion > 0.45) mark(ctx, g, '?', '#ffb347');
    if (g.suspicion > 0.03 && g.mode !== 'chase') {
      ctx.strokeStyle = g.suspicion > 0.45 ? '#ffb347' : '#fadc5a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(g.x, g.y, 18, -Math.PI / 2, -Math.PI / 2 + g.suspicion * Math.PI * 2); ctx.stroke();
    }
  }
}

function mark(ctx, g, ch, color) {
  ctx.fillStyle = color; ctx.font = '800 20px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(ch, g.x, g.y - 26);
}

function panel(ctx, w, h) {
  ctx.fillStyle = 'rgba(5,6,14,0.62)'; ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.panel; rr(ctx, (FIELD.width - w) / 2, (FIELD.height - h) / 2, w, h, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(255,179,71,0.5)'; rr(ctx, (FIELD.width - w) / 2, (FIELD.height - h) / 2, w, h, 16); ctx.stroke();
  return { x: (FIELD.width - w) / 2, y: (FIELD.height - h) / 2 };
}

function heading(ctx, text, y, size = 44) {
  ctx.fillStyle = PALETTE.text; ctx.font = '800 ' + size + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, FIELD.width / 2, y);
}
function line(ctx, text, y, size = 16, color = PALETTE.muted) {
  ctx.fillStyle = color; ctx.font = size + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, FIELD.width / 2, y);
}

export function draw(ctx, state) {
  state.buttons = [];
  const sx = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
  const sy = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
  ctx.save(); ctx.translate(sx, sy);
  drawWorld(ctx, state);
  ctx.restore();

  if (state.screen === SCREEN.TITLE) {
    ctx.fillStyle = 'rgba(5,6,14,0.55)'; ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    heading(ctx, GAME_TITLE, 120, 64);
    line(ctx, GAME_SUBTITLE, 168, 17, PALETTE.accent);
    line(ctx, 'Mira slips through the sleeping museum to lift three ember-crystals per wing', 226);
    line(ctx, 'and slip out the exit door — unseen. Wardens sweep lantern cones: yellow calm,', 250);
    line(ctx, 'orange suspicious, red hunting. Hide in the dark drapes, sneak with Shift.', 274);
    line(ctx, 'Move WASD / arrows · Sneak Shift · Take crystal Space / E · Pause Esc / P · Mute M', 306, PALETTE.text);
    button(ctx, state, 'play', 380, 340, 200, 48, 'Begin the heist', true);
    ctx.fillStyle = PALETTE.muted; ctx.font = '600 14px ' + FONT; ctx.textAlign = 'center';
    ctx.fillText('Choose a wing:', FIELD.width / 2, 428);
    state.levelNames.forEach((n, i) => button(ctx, state, 'level:' + i, 250 + i * 165, 448, 155, 38, 'Wing ' + (i + 1) + (i <= state.unlocked ? '' : ' · locked'), false));
    line(ctx, state.message || '', 530, 14, PALETTE.accent);
  } else if (state.screen === SCREEN.INTRO) {
    const p = panel(ctx, 560, 250);
    heading(ctx, state.level.name, p.y + 52, 25);
    ctx.fillStyle = PALETTE.muted; ctx.font = '15px ' + FONT; ctx.textAlign = 'center';
    wrap(ctx, state.level.intro, FIELD.width / 2, p.y + 98, 480, 22);
    line(ctx, 'Crystals: ' + state.crystalsTotal + ' · Wardens: ' + state.guards.length + ' · Attempts left: ' + state.lives, p.y + 168, 15, PALETTE.text);
    button(ctx, state, 'start', p.x + 180, p.y + 188, 200, 42, 'Slip inside', true);
  } else if (state.screen === SCREEN.PAUSE) {
    panel(ctx, 380, 240);
    heading(ctx, 'Paused', 240, 32);
    button(ctx, state, 'resume', 390, 280, 180, 44, 'Keep sneaking', true);
    button(ctx, state, 'restart', 390, 336, 180, 44, 'Restart wing');
    button(ctx, state, 'title', 390, 392, 180, 44, 'Title screen');
  } else if (state.screen === SCREEN.CAUGHT) {
    panel(ctx, 440, 230);
    heading(ctx, 'Caught!', 248, 34);
    line(ctx, 'A warden claps a hand on the little moth\'s cloak.', 292);
    line(ctx, 'Attempts left: ' + state.lives, 320, 16, PALETTE.text);
    button(ctx, state, 'retry', 390, 348, 180, 44, state.lives > 0 ? 'Try the wing again' : 'See the end', true);
  } else if (state.screen === SCREEN.CLEAR) {
    panel(ctx, 460, 240);
    heading(ctx, 'Wing cleared!', 238, 32);
    line(ctx, 'All crystals lifted in ' + state.timeText + ' — the museum never knew.', 282);
    button(ctx, state, 'next', 390, 322, 180, 44, state.levelIndex + 1 < state.levelNames.length ? 'Next wing' : 'Finale', true);
    button(ctx, state, 'title2', 390, 378, 180, 44, 'Title screen');
  } else if (state.screen === SCREEN.VICTORY) {
    ctx.fillStyle = 'rgba(5,6,14,0.5)'; ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    heading(ctx, 'THE EMBER HOARD IS HERS', 210, 36);
    line(ctx, 'Every wing robbed, every warden none the wiser.', 262, 17, PALETTE.text);
    line(ctx, 'Total time ' + state.timeText + ' · Caught ' + state.timesCaught + ' time(s)', 292);
    button(ctx, state, 'again', 390, 340, 180, 46, 'Steal it all again', true);
  } else if (state.screen === SCREEN.OVER) {
    panel(ctx, 440, 230);
    heading(ctx, 'The museum keeps its embers', 248, 28);
    line(ctx, 'Out of attempts. The wardens sweep up, smug as cats.', 296);
    button(ctx, state, 'again', 390, 348, 180, 44, 'Start over', true);
  }
  if (state.alarm && state.screen === SCREEN.PLAY) {
    ctx.fillStyle = 'rgba(255,60,50,' + (0.10 + 0.06 * Math.sin(state.time * 10)) + ')';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#ff6a5f'; ctx.font = '800 20px ' + FONT; ctx.textAlign = 'center';
    ctx.fillText('ALARM — break their sight!', FIELD.width / 2, 30);
  }
}

function wrap(ctx, text, cx, y, maxW, lh) {
  const words = text.split(' ');
  let cur = ''; let yy = y;
  for (const w of words) {
    if (ctx.measureText(cur + ' ' + w).width > maxW && cur) { ctx.fillText(cur, cx, yy); yy += lh; cur = w; }
    else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) ctx.fillText(cur, cx, yy);
}
