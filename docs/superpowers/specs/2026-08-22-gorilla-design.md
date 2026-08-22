# GORILLA.BAS Clone — Design Spec

## Overview

Faithful recreation of the classic GORILLA.BAS game: throw bananas at gorillas perched on a procedurally generated city skyline, accounting for wind and projectile physics. 5 turns, 5 bananas per turn, one gorilla counter-attacks when you miss.

## Game Elements

### Skyline

Procedurally generated buildings of varying widths and heights. Buildings rendered as white-filled rectangles on black background (retro terminal aesthetic). Each building has floors (horizontal lines), gorillas placed on random floors.

### Player

Positioned at the bottom-left of the screen. Rendered as a simple white silhouette (standing figure).

### Gorillas

One per building, placed on a random floor. Rendered as small pixel-art gorilla sprites (similar to how invaders.js does pixel sprites). Always visible on their buildings.

### Bananas

Yellow projectiles that follow realistic arc trajectories with gravity and wind. Player bananas start from player position; gorilla bananas start from the gorilla's position.

## Physics

- **Gravity**: Constant downward acceleration on all bananas
- **Wind**: Random each turn (direction + speed), affects horizontal banana velocity
- **Trajectory**: Pixel-accurate — `x += vx * dt`, `y += vy * dt`, `vy += gravity * dt`, `vx += wind * dt`
- **Collision**: Banana hits a gorilla (gorilla removed), hits a building (banana stops), hits the ground (banana stops), hits the player (game over)

## Game Flow

1. **Start screen** — Title + instructions
2. **Each turn**:
   - Wind displayed (direction arrow + speed)
   - Player inputs angle (1-160°) and power (10-1000)
   - Player has 5 bananas per turn (after each throw, remaining count shown)
   - If banana misses all gorillas: closest gorilla throws back (arc animation, collision check)
   - If gorilla hits player → GAME OVER
3. **Win condition**: All gorillas killed
4. **Lose condition**: Gorilla hits player

## Input

### Desktop (keyboard)

- Prompt: `ANGLE?` → type 1-160, press Enter
- Prompt: `POWER?` → type 10-1000, press Enter to throw banana
- After each banana: prompt repeats until 5 thrown or all gorillas dead

### Mobile (mouse/touch)

- Click and drag from player position to aim
- Direction = angle, drag distance = power
- Release to throw
- Angle and power values displayed in a small overlay box
- Shows remaining bananas

### Mobile Detection

Use `!window.matchMedia('(hover: hover)').matches` (same pattern as tictactoe.js).

## UI Layout

```
+--------------------------------------------------+
| GORILLA                                          |
| Wind: ---> 5  |  Turn: 2/5  |  Gorillas: 3 left  |
|                                                  |
|  [skyline with buildings, gorillas, player]      |
|                                                  |
|  Banana trail visible during animation           |
|                                                  |
|  ANGLE? [___]  POWER? [___]  (desktop)           |
|  or drag to aim (mobile)                         |
+--------------------------------------------------+
```

- Heading: "GORILLA" (via createGameUI)
- Wind indicator with arrow + speed number
- Turn counter + gorillas remaining
- Input fields for angle/power (desktop) or drag hint (mobile)
- Canvas shows the game world

## Canvas Size

800×500 — tall enough for skyline + player, wide enough for buildings.

## Files

- `commands/gorilla.js` — Single file implementing the full game
- Add to `commands/manifest.json`

## Module Contract

Follow the existing app pattern (pong.js, invaders.js):

```javascript
import { createGameUI } from './game-ui.js';

export const type = 'app';
export const title = 'Gorilla';
export const description = 'Throw bananas at gorillas on city buildings';

export function execute(args, container, onExit) { /* ... */ }
export function onExit() { /* cancelAnimationFrame, remove listeners */ }
```

## Constraints

- ES modules only, no semicolons, 4-space indentation
- Canvas games use `#000` background, `#FFF` borders, monospace fonts
- Retro terminal aesthetic — white on black, pixel-art sprites
- All cleanup via `addCleanup()` and `onExit()`
- Mobile detection: `!window.matchMedia('(hover: hover)').matches`
- No external dependencies — everything in one file
