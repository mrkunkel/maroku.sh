# WebPong Port Design

## Goal

Port the WebPong game (requirements in `webpong.md`, FR-1..FR-42) into maroku.sh as a first-class app so that typing `pong` in the shell launches it full-screen, matching the existing app model (`tetris`).

## Approach

Single self-contained `commands/pong.js` ES module following the established app module contract (same shape as `commands/tetris.js`). One entry added to `commands/manifest.json`. No changes to `index.html`, `styles.css`, or any other existing file.

Rejected alternatives:

- Splitting game logic into a separate engine module — no test infrastructure exists in this repo and `tetris.js` is monolithic; YAGNI.
- Serving a separate `pong.html` page — breaks the app model (X button, terminal state preservation, full-screen container).

## Porting Decisions (webpong.md Section 10)

- **FR-40 (AI paddle clamping): CHANGED.** The AI paddle is clamped to the court, same restriction as the player paddle. Both paddles stay fully inside the playfield.
- **FR-41 (wall tunneling): PRESERVED.** Wall bounces invert velocity without repositioning the ball; at very high ball speeds the ball can visually tunnel through the top/bottom wall.
- **FR-42 (no speed cap): PRESERVED.** Ball speed is uncapped; long rallies produce very fast balls.

## Files

```
commands/
  pong.js         # App: Pong game (new)
  manifest.json   # Add: { "name": "pong", "type": "app", "desc": "Classic Pong — mouse wheel to move" }
```

## Module Contract

```js
export const type = 'app';
export const title = 'Pong';
export const description = 'Classic Pong — mouse wheel to move';

export function execute(args, container, onExit) { /* build UI, start loop */ }
export function onExit() { /* cancel loop, remove all window listeners */ }
```

Typing `pong` or `./pong` launches full-screen; the X button or `onExit` callback restores the terminal.

## Layout (FR-1..9, FR-36)

`execute()` sets the app container background to `#222` and builds a flex column, centered vertically and horizontally, no scrollbars, white sans-serif text:

1. `<h1>` status heading — "PONG" during play, "PAUSED" while paused (toggled from pause state).
2. `<canvas>` 800×400 — black (`#000`) background, 4px solid white border, soft outer shadow, `cursor: none`.
3. Instructions line in light gray (`#aaa`): "Use **Mouse Wheel** to move your paddle".

The X close button is provided by the shell's app container (no change needed).

## Rendering (every frame, FR-8)

Clear canvas to black, then draw:

- Player paddle: 10×80 px green (`#00FF00`) rect at x = 0, y = `playerY`
- AI paddle: 10×80 px red (`#FF0000`) rect at x = 790, y = `aiY`
- Ball: white circle, radius 10, at (ballX, ballY)
- Player score: white, 35px Arial, centered at (200, 80)
- AI score: white, 35px Arial, centered at (600, 80)

No net, no decorations, no effects (FR-35). The only on-screen text is the heading and the two scores (FR-36).

## Controls (FR-10..14)

- `wheel` listener on **window** (global, not just the canvas).
- When not paused: `playerY += e.deltaY * 0.15`, clamped to `[0, 320]` (FR-12).
- Ignored while paused (FR-13).
- No keyboard, click, or touch controls (FR-14).

## Pause (FR-15..17)

- `window` `blur` → `paused = true`, heading → "PAUSED"
- `window` `focus` → `paused = false`, heading → "PONG"
- While paused the update step is skipped but the scene is still rendered each frame (frozen, not blank).
- No manual pause control.

## Game Loop (FR-18)

`requestAnimationFrame` loop (~60 fps target). Each frame: if not paused, run update (ball, AI, collisions, scoring); always render.

## Physics & Rules (FR-19..30)

Initial state (FR-39): `playerY = 160`, `aiY = 160` (both centered), ball at exact center (400, 200), speed 5, direction bottom-right 45° (dx = 5/√2, dy = 5/√2), scores 0–0, not paused.

Per-frame update:

1. **Move ball**: `ballX += dx`, `ballY += dy`.
2. **Wall bounce (FR-20)**: if `ballY - 10 <= 0` → `dy = -dy`; if `ballY + 10 >= 400` → `dy = -dy`. No repositioning (FR-41 preserved).
3. **Paddle collision (FR-21..24)** — axis-aligned bounding-box overlap between the ball and the paddle facing the half of the court the ball is in:
   - If the ball is in the left half (`ballX < 400`), test overlap with the player paddle (rect x ∈ [0, 10], y ∈ [playerY, playerY + 80]); on overlap the ball must travel right, so `dx > 0`.
   - If the ball is in the right half (`ballX >= 400`), test overlap with the AI paddle (rect x ∈ [790, 800], y ∈ [aiY, aiY + 80]); on overlap the ball must travel left, so `dx < 0`.
   - On overlap: `relative = (paddleCenterY - ballY) / 40` clamped to [-1, 1], `angle = (π/4) * relative`, `dx = speed * cos(angle) * dir`, `dy = speed * sin(angle)` where `dir` is `+1` (player paddle) or `-1` (AI paddle). The ball always leaves away from the paddle hit (FR-23); a center hit returns it horizontally.
   - After any paddle hit: `speed += 0.2` (FR-24).
4. **AI (FR-31..33)**: if `|ballY - aiCenterY| > 10`, move `aiY` toward the ball by 3.5 px/frame (constant, never increases). Then clamp `aiY` to `[0, 320]` (porting decision).
5. **Scoring (FR-25)**: ball fully past the left edge (`ballX + 10 < 0`) → AI scores; fully past the right edge (`ballX - 10 > 800`) → player scores. Then serve reset.

### Serve Reset (FR-26..30)

- Ball position → exact center (400, 200).
- `speed` → 5.
- Horizontal direction → opposite of the direction the scoring ball was traveling, i.e. the new serve goes toward the side that just scored ("send to the winner"): `dx` sign flips.
- `dy` is preserved from before the score; to stay consistent with the speed reset to 5, `dy` is clamped to ±5 and `dx = dir * sqrt(25 - dy²)`.
- Paddle positions are not reset (FR-30).

## State & Cleanup

Module-level state (one instance at a time): `playerY`, `aiY`, `ballX`, `ballY`, `dx`, `dy`, `speed`, `playerScore`, `aiScore`, `paused`, `rafId`, and references to the three window listeners (`wheel`, `blur`, `focus`).

- `execute()` initializes state to FR-39, builds the DOM, registers window listeners, starts the rAF loop.
- `onExit()` cancels the rAF and removes all window listeners, so re-launching `pong` always starts fresh and no listeners leak into the terminal. DOM elements are removed with the app container by the shell.
- No sound, no music (FR-34). Server is stateless; all state is client-side (FR-38).

## Verification

The repo has no test infrastructure. Verification is manual:

1. `node --check commands/pong.js` — syntax check.
2. Serve the repo (`python3 -m http.server`), open in a browser, type `pong`.
3. Check: layout matches FR-1..9; wheel moves paddle and clamps; alt-tab pauses/resumes with heading change; ball physics, scoring, serve direction, and speed-up behave per FR-19..30; AI tracks with dead zone and 3.5 px/frame and stays clamped in court; X button returns to shell with no leaked wheel/blur/focus listeners; typing `pong` again launches a fresh 0–0 game.
