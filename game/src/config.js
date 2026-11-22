// Emberveil — every tuning number and colour in one place.
// The museum is a fixed 960x600 logical floor; the renderer scales it to the window.

export const FIELD = { width: 960, height: 600 };
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 11,
  walkSpeed: 148,
  sneakSpeed: 74,
  startLives: 3,
};

export const GUARD = {
  radius: 12,
  patrolSpeed: 62,
  chaseSpeed: 158,
  returnSpeed: 96,
  coneRange: 168,
  coneHalfAngle: 0.62, // radians, ~35.5 degrees each side
  pauseSeconds: 1.1,
  catchDistance: 24,
};

export const SIGHT = {
  fillPerSecond: 0.85,   // close and loud fills fast
  fillFar: 0.32,         // at the cone's edge it fills slowly
  sneakFactor: 0.45,     // sneaking more than halves the fill rate
  decayPerSecond: 0.28,  // suspicion drains when unseen
  chaseMemory: 3.0,      // seconds of lost sight before a chase gives up
  alarmSeconds: 6,       // escape window once the alarm is sounding
};

export const PALETTE = {
  night: '#0b0e1a',
  floorLit: '#2c3350',
  floorTile: '#333b5c',
  floorShadow: '#171b2e',
  wall: '#4a3f63',
  wallTop: '#6a5a8f',
  crate: '#7a5a34',
  crateTop: '#9a7443',
  shelf: '#3d5a52',
  shelfTop: '#54806f',
  shadowPatch: '#10131f',
  exitClosed: '#5c4a2e',
  exitOpen: '#39d98a',
  crystal: '#ffb347',
  crystalCore: '#ffe9b0',
  player: '#e8e4ff',
  playerCloak: '#7c5cd6',
  guard: '#d9534f',
  guardDark: '#8f2f2c',
  coneCalm: 'rgba(250, 220, 90, 0.20)',
  coneSuspicious: 'rgba(250, 150, 50, 0.30)',
  coneAlert: 'rgba(250, 70, 60, 0.36)',
  text: '#eef1ff',
  muted: '#9aa3c7',
  panel: 'rgba(13, 16, 30, 0.88)',
  accent: '#ffb347',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const GAME_TITLE = 'EMBERVEIL';
export const GAME_SUBTITLE = "Mira the moth-thief and the museum of sleeping light";
