// Emberveil — the game loop and state machine. Owns the run state, keyboard and
// mouse input, the fixed-step simulation (player, wardens, crystals, exit, alarm),
// HUD updates, and the ?shot= staging hook used for screenshots.

import { FIELD, STEP, PLAYER } from './config.js';
import { LEVELS, solidsOf } from './levels.js';
import { createPlayer, updatePlayer } from './player.js';
import { createGuards, updateGuards } from './guards.js';
import { SoundBank } from './audio.js';
import { draw, SCREEN } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = {
  level: document.getElementById('hud-level'),
  crystals: document.getElementById('hud-crystals'),
  eye: document.getElementById('hud-eye'),
  time: document.getElementById('hud-time'),
  lives: document.getElementById('hud-lives'),
  mute: document.getElementById('mute'),
  status: document.getElementById('status'),
};
const sound = new SoundBank();

function formatTime(t) {
  const m = Math.floor(t / 60); const s = Math.floor(t % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function createGame() {
  const state = {
    screen: SCREEN.TITLE, levelIndex: 0, level: LEVELS[0], solids: solidsOf(LEVELS[0]),
    player: createPlayer(LEVELS[0].playerStart), guards: [], crystals: [],
    crystalsGot: 0, crystalsTotal: 3, lives: PLAYER.startLives, time: 0, totalTime: 0, timeText: '00:00',
    detection: 0, alarm: false, alarmTimer: 0, particles: [], shake: 0, buttons: [],
    levelNames: LEVELS.map((l) => l.name), unlocked: 0, timesCaught: 0, message: '',
  };

  function resetLevel(index) {
    state.levelIndex = index;
    state.level = LEVELS[index];
    state.solids = solidsOf(state.level);
    state.player = createPlayer(state.level.playerStart);
    state.guards = createGuards(state.level);
    state.crystals = state.level.crystals.map((c) => ({ x: c.x, y: c.y, taken: false }));
    state.crystalsGot = 0;
    state.crystalsTotal = state.crystals.length;
    state.detection = 0; state.alarm = false; state.alarmTimer = 0;
    state.particles = []; state.shake = 0; state.time = 0;
  }

  function burst(x, y) {
    for (let i = 0; i < 14; i += 1) {
      const a = (i / 14) * Math.PI * 2;
      state.particles.push({ x, y, vx: Math.cos(a) * (30 + (i % 5) * 9), vy: Math.sin(a) * (30 + (i % 5) * 9), life: 0.55, maxLife: 0.55 });
    }
  }

  function stepPlay(dt, input) {
    state.time += dt;
    state.timeText = formatTime(state.totalTime + state.time);
    updatePlayer(state.player, input, dt, state.solids, (sneaking) => sound.step(sneaking));
    const events = [];
    updateGuards(state, dt, events);
    for (const ev of events) {
      if (ev === 'suspicious') sound.suspicious();
      if (ev === 'spotted') { sound.spotted(); state.shake = 9; }
      if (ev === 'caught') {
        sound.caught();
        state.timesCaught += 1;
        state.lives -= 1;
        state.screen = state.lives > 0 ? SCREEN.CAUGHT : SCREEN.OVER;
      }
    }
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 26);
    // crystals: touch (or Space/E beside one) lifts them
    for (const c of state.crystals) {
      if (c.taken) continue;
      const d = Math.hypot(c.x - state.player.x, c.y - state.player.y);
      if (d < 24 || (input.interact && d < 40)) {
        c.taken = true; state.crystalsGot += 1; burst(c.x, c.y); sound.pickup();
        if (state.crystalsGot >= state.crystalsTotal) sound.doorOpen();
      }
    }
    for (const p of state.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    state.particles = state.particles.filter((p) => p.life > 0);
    // exit
    const e = state.level.exit;
    if (state.crystalsGot >= state.crystalsTotal
      && state.player.x > e.x - 6 && state.player.x < e.x + e.w + 6
      && state.player.y > e.y - 6 && state.player.y < e.y + e.h + 6) {
      sound.win();
      state.totalTime += state.time;
      state.unlocked = Math.max(state.unlocked, Math.min(LEVELS.length - 1, state.levelIndex + 1));
      state.screen = state.levelIndex + 1 >= LEVELS.length ? SCREEN.VICTORY : SCREEN.CLEAR;
    }
  }

  resetLevel(0);
  return { state, resetLevel, stepPlay };
}

const game = createGame();
const state = game.state;

// ---- input -------------------------------------------------------------
const keys = new Set();
window.addEventListener('keydown', (ev) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(ev.key)) ev.preventDefault();
  sound.ensure();
  if (ev.key === 'Escape' || ev.key === 'p' || ev.key === 'P') {
    if (state.screen === SCREEN.PLAY) state.screen = SCREEN.PAUSE;
    else if (state.screen === SCREEN.PAUSE) state.screen = SCREEN.PLAY;
  }
  if (ev.key === 'm' || ev.key === 'M') setMute(sound.toggleMute());
  if (ev.key === 'Enter') {
    if (state.screen === SCREEN.TITLE) startLevel(0);
    else if (state.screen === SCREEN.INTRO) state.screen = SCREEN.PLAY;
  }
  keys.add(ev.key.toLowerCase());
});
window.addEventListener('keyup', (ev) => keys.delete(ev.key.toLowerCase()));

function currentInput() {
  const x = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
  const y = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
  return { x, y, sneak: keys.has('shift'), interact: keys.has(' ') || keys.has('e') };
}

function startLevel(index) {
  game.resetLevel(index);
  state.lives = state.lives > 0 ? state.lives : PLAYER.startLives;
  state.screen = SCREEN.INTRO;
  sound.click();
}

function handleButton(id) {
  sound.ensure(); sound.click();
  if (id === 'play') startLevel(Math.min(state.unlocked, LEVELS.length - 1));
  else if (id.startsWith('level:')) {
    const i = Number(id.slice(6));
    if (i <= state.unlocked) startLevel(i);
    else state.message = 'That wing is still locked — clear the earlier wing first.';
  }
  else if (id === 'start') state.screen = SCREEN.PLAY;
  else if (id === 'resume') state.screen = SCREEN.PLAY;
  else if (id === 'restart') { game.resetLevel(state.levelIndex); state.screen = SCREEN.INTRO; }
  else if (id === 'retry') { game.resetLevel(state.levelIndex); state.screen = SCREEN.PLAY; }
  else if (id === 'next') startLevel(state.levelIndex + 1);
  else if (id === 'title' || id === 'title2') { game.resetLevel(0); state.screen = SCREEN.TITLE; }
  else if (id === 'again') { state.lives = PLAYER.startLives; state.totalTime = 0; state.timesCaught = 0; state.unlocked = 0; startLevel(0); }
}

canvas.addEventListener('pointerdown', (ev) => {
  const rect = canvas.getBoundingClientRect();
  const lx = ((ev.clientX - rect.left) / rect.width) * FIELD.width;
  const ly = ((ev.clientY - rect.top) / rect.height) * FIELD.height;
  for (const b of state.buttons) if (lx >= b.x && lx <= b.x + b.w && ly >= b.y && ly <= b.y + b.h) { handleButton(b.id); break; }
});

function setMute(muted) { hud.mute.textContent = muted ? 'Sound: off' : 'Sound: on'; }
hud.mute.addEventListener('click', () => { sound.ensure(); setMute(sound.toggleMute()); });

// ---- staging + loop ------------------------------------------------------
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) stageShot(shot, game);

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
}
window.addEventListener('resize', resize);
resize();

function updateHud() {
  hud.level.textContent = 'Wing ' + (state.levelIndex + 1) + ' — ' + state.level.name.split('—')[1]?.trim() || '';
  hud.crystals.textContent = state.crystalsGot + '/' + state.crystalsTotal;
  hud.eye.textContent = state.alarm ? 'ALARM!' : state.detection > 0.66 ? 'seen!' : state.detection > 0.3 ? 'suspected' : state.player.hidden ? 'hidden' : 'calm';
  hud.eye.style.color = state.alarm || state.detection > 0.66 ? '#ff6a5f' : state.detection > 0.3 ? '#ffb347' : '#ffb347';
  hud.time.textContent = state.timeText;
  hud.lives.textContent = String(Math.max(0, state.lives));
  hud.status.textContent = state.screen + ', wing ' + (state.levelIndex + 1) + ', crystals ' + state.crystalsGot + ' of ' + state.crystalsTotal;
}

let last = performance.now();
let acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (state.screen === SCREEN.PLAY && !shot) {
    acc += dt;
    while (acc >= STEP) { game.stepPlay(STEP, currentInput()); acc -= STEP; if (state.screen !== SCREEN.PLAY) { acc = 0; break; } }
  }
  // fit the 960x600 floor into the window, letterboxed
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#05060e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
  ctx.translate((canvas.width - FIELD.width * scale) / 2, (canvas.height - FIELD.height * scale) / 2);
  ctx.scale(scale, scale);
  draw(ctx, state);
  updateHud();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
