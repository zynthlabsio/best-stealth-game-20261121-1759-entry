// Emberveil — the three museum wings Mira robs, as plain data.
// walls: solid blocks that also block sight. kind 'wall' | 'crate' | 'shelf'.
// shadows: floor patches (hedges, drapes, dark alcoves) — standing in one hides Mira.
// guards: patrol loops of waypoints; pause is seconds spent looking around at a point.

function wall(x, y, w, h, kind = 'wall') { return { x, y, w, h, kind }; }
function shadow(x, y, w, h) { return { x, y, w, h }; }
function guardPath(points, pause = 1.1) { return { points, pause }; }

export const LEVELS = [
  {
    name: 'Wing One — The Quiet Gallery',
    intro: 'Two wardens, wide halls. Learn their lanterns: yellow is calm, orange is doubt, red is run.',
    playerStart: { x: 60, y: 540 },
    exit: { x: 884, y: 40, w: 44, h: 52 },
    crystals: [ { x: 300, y: 150 }, { x: 640, y: 470 }, { x: 830, y: 300 } ],
    walls: [
      wall(180, 90, 26, 220), wall(180, 380, 26, 140),
      wall(430, 0, 26, 190), wall(430, 300, 26, 200),
      wall(700, 120, 26, 230),
      wall(330, 250, 90, 44, 'crate'), wall(560, 330, 90, 44, 'crate'),
      wall(90, 250, 70, 40, 'shelf'), wall(760, 430, 90, 44, 'shelf'),
    ],
    shadows: [ shadow(230, 430, 110, 70), shadow(500, 90, 110, 66), shadow(740, 180, 90, 90), shadow(60, 90, 80, 70) ],
    guards: [
      guardPath([{ x: 300, y: 90 }, { x: 620, y: 90 }, { x: 620, y: 220 }, { x: 300, y: 220 }]),
      guardPath([{ x: 820, y: 520 }, { x: 480, y: 520 }, { x: 480, y: 400 }, { x: 820, y: 400 }]),
    ],
  },
  {
    name: 'Wing Two — The Ember Vault',
    intro: 'Three wardens cross the vault floor. The shadow drapes are your only friends here.',
    playerStart: { x: 55, y: 60 },
    exit: { x: 884, y: 500, w: 44, h: 52 },
    crystals: [ { x: 480, y: 110 }, { x: 210, y: 330 }, { x: 760, y: 330 } ],
    walls: [
      wall(150, 140, 200, 24), wall(150, 140, 24, 180),
      wall(610, 140, 200, 24), wall(786, 140, 24, 180),
      wall(300, 430, 360, 24), wall(468, 250, 24, 180),
      wall(230, 230, 80, 40, 'crate'), wall(650, 230, 80, 40, 'crate'),
      wall(420, 480, 120, 44, 'shelf'), wall(80, 430, 90, 44, 'shelf'), wall(790, 480, 90, 44, 'shelf'),
    ],
    shadows: [ shadow(380, 60, 200, 60), shadow(60, 240, 90, 90), shadow(810, 240, 90, 90), shadow(560, 470, 120, 70), shadow(250, 500, 110, 60) ],
    guards: [
      guardPath([{ x: 120, y: 540 }, { x: 840, y: 540 }, { x: 840, y: 470 }, { x: 120, y: 470 }], 0.8),
      guardPath([{ x: 480, y: 60 }, { x: 480, y: 210 }, { x: 330, y: 210 }, { x: 330, y: 60 }], 0.8),
      guardPath([{ x: 880, y: 110 }, { x: 640, y: 110 }, { x: 640, y: 380 }, { x: 880, y: 380 }], 0.8),
    ],
  },
  {
    name: 'Wing Three — The Lantern Court',
    intro: 'Four wardens, tight lanes, one long run to the door. Patience, little moth.',
    playerStart: { x: 480, y: 556 },
    exit: { x: 458, y: 16, w: 44, h: 48 },
    crystals: [ { x: 110, y: 110 }, { x: 850, y: 110 }, { x: 480, y: 320 } ],
    walls: [
      wall(220, 60, 24, 260), wall(716, 60, 24, 260),
      wall(220, 330, 24, 210), wall(716, 330, 24, 210),
      wall(340, 180, 280, 24), wall(340, 420, 280, 24),
      wall(430, 250, 100, 40, 'crate'), wall(120, 300, 80, 40, 'crate'), wall(760, 300, 80, 40, 'crate'),
      wall(400, 500, 160, 40, 'shelf'), wall(60, 470, 90, 44, 'shelf'), wall(810, 470, 90, 44, 'shelf'),
    ],
    shadows: [ shadow(270, 240, 100, 80), shadow(590, 240, 100, 80), shadow(60, 160, 100, 80), shadow(800, 160, 100, 80), shadow(420, 350, 120, 55) ],
    guards: [
      guardPath([{ x: 110, y: 60 }, { x: 850, y: 60 }], 0.7),
      guardPath([{ x: 480, y: 150 }, { x: 480, y: 470 }, { x: 380, y: 470 }, { x: 380, y: 150 }], 0.7),
      guardPath([{ x: 90, y: 380 }, { x: 90, y: 160 }, { x: 270, y: 160 }, { x: 270, y: 380 }], 0.7),
      guardPath([{ x: 870, y: 380 }, { x: 870, y: 160 }, { x: 690, y: 160 }, { x: 690, y: 380 }], 0.7),
    ],
  },
];

export function solidsOf(level) { return level.walls; }
export function playerHiddenIn(level, x, y) {
  for (const s of level.shadows) if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return true;
  return false;
}
