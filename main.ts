// Emberveil — the hand-in program (Node 22, standard library only).
// Copies game/ and screenshots/ from beside this file into the output folder
// (MAKEFUN_OUTPUT_DIR, or /output inside the grader) and writes dossier.json
// there with the vendored make.fun library, byte for byte as the gate expects.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(root, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's caps: text capped at 160 KiB, at most 4 screenshots of at most
// 256 KiB each, at most 993 game files totalling at most 48 MiB, paths at most
// 1000 bytes — refuse here anything the scorer would refuse there.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log('Emberveil handed in to ' + outputDir);
