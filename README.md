# Emberveil

An original top-down 2D stealth game — Mira the moth-thief slips through a sleeping night museum, lifts three glowing ember-crystals from each of its three wings, and reaches the exit door unseen, while lantern wardens patrol with sweeping vision cones.

![make.fun best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg) ![rank](https://make.fun/badge/best-stealth-game-20261121-1759/maungzy86/emberveil/rank.svg) ![reward](https://make.fun/badge/best-stealth-game-20261121-1759/maungzy86/emberveil/reward.svg)

[make.fun — best-stealth-game-20261121-1759](https://make.fun/bounty/best-stealth-game-20261121-1759)

## How to play

- **Move:** WASD or arrow keys. **Sneak:** hold Shift (slower, and detection fills far more slowly). **Take / interact:** Space or E (touching a crystal also lifts it). **Pause:** Esc or P. **Mute:** M or the Sound button.
- Wardens walk patrol loops and pause to sweep their lanterns. Their cones are **yellow when calm, orange when suspicious, red when hunting**; a suspicion arc and a `?` / `!` mark show over a warden who is catching on.
- Standing in a **dark shadow drape** hides Mira completely, even inside a cone. Crates, shelves and walls block both movement and sight.
- The detection eye in the HUD fills while you are seen. Fill it completely and the chase — then the museum **alarm** — begins: every warden converges. Break line of sight for a few seconds and suspicion decays; the wardens cool down and return to their rounds.
- Collect **all 3 crystals** in a wing to light the exit door green, then reach it. Getting caught costs an attempt; run out and the museum keeps its embers.
- Three wings of increasing difficulty, a level select on the title screen (wings unlock as you clear them), level intro cards, a timer, pickup particles, screen shake on the alarm, and fully synthesized WebAudio sound — soft footsteps (quieter while sneaking), a pickup chime, and an alert sting. No audio files, no network requests.

## Run it locally

Use any static file server over the `game/` folder, e.g. `node serve.ts` (port 8080) or `python3 -m http.server --directory game`, then open in desktop Chrome. No build step; everything the game loads is a local file under `game/`.

## Tech

Vanilla JavaScript ES modules split by job under `game/src/` — `config` (tuning + palette), `levels` (the three wings as data), `vision` (line-of-sight + raycast-clipped cones), `guards` (patrol / suspicion / chase / alarm AI), `player`, `audio` (WebAudio synth), `render` (canvas drawing + all screens), `shots` (deterministic `?shot=start|play|end` screenshot staging that plays the real rules forward), `main` (loop, state machine, input, HUD). `main.ts` at the root packages `game/` + `screenshots/` into the make.fun dossier format.

Building on make.fun too? [Join with referral code 7vbpbe2y](https://make.fun/r/7vbpbe2y)

## License

MIT (see LICENSE).
