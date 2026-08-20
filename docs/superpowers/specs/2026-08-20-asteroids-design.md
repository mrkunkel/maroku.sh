# Asteroids Game Design

## Overview
A classic Asteroids arcade game rendered on an HTML5 Canvas, matching the style of existing games (Tetris, Pong, Space Invaders) in the maroku.sh terminal-based game shell.

## Architecture
- Single file: `commands/asteroids.js`
- HTML5 Canvas rendering with `requestAnimationFrame` game loop (~60fps)
- No build system, no dependencies — vanilla JS
- Module exports: `type`, `title`, `description`, `execute()`, `onExit()`
- Registered in `commands/manifest.json`

## Ship
- **Controls:** Left/Right arrows rotate the ship. Up arrow applies thrust in the facing direction.
- **Physics:** Inertia-based movement — ship drifts after releasing thrust. Friction coefficient of 0.99 per frame.
- **Screen wrapping:** Ship wraps off edges.
- **Rendering:** Triangle wireframe drawn with white lines on black background, points in the direction it's facing.
- **Dimensions:** ~15px from center to tip, ~10px half-width.

## Asteroids
- **Three sizes:** Large (radius ~40px), Medium (radius ~20px), Small (radius ~10px).
- **Behavior:** All wrap around screen edges. Random initial positions and velocities.
- **Splitting:** Large asteroid split into 2 medium on destruction. Medium split into 2 small. Small destroyed completely.
- **Rendering:** Jagged polygon wireframe edges (randomized vertex offsets from circle), white lines on black background.
- **Initial spawn:** 4 large asteroids at start of game.
- **Level progression:** When all asteroids destroyed, new level with 1 more asteroid than previous.

## Bullets
- **Firing:** Hold spacebar for rapid fire, ~150ms cooldown between shots.
- **Behavior:** Straight line in ship's facing direction. ~8px radius. ~10px/frame speed.
- **Lifetime:** Bullets expire after ~40 frames to prevent spam.
- **Screen wrapping:** Bullets wrap around screen edges.

## Scoring
- Large asteroid = 20 points
- Medium asteroid = 50 points
- Small asteroid = 100 points

## Game States
- `playing` — Normal gameplay. Press P to pause.
- `paused` — Game loop continues but no updates. Shows "PAUSED" text.
- `gameover` — All asteroids destroyed. Shows final score and "Press ENTER to restart".

## Collision Detection
- Ship-asteroid: Circle-circle distance check. Ship destroyed on contact.
- Bullet-asteroid: Circle-circle distance check. Asteroid destroyed, bullet removed.

## Input
- `ArrowLeft` / `ArrowRight` — Rotate ship (-3°/frame left, +3°/frame right)
- `ArrowUp` — Thrust (+0.15 acceleration)
- `Space` — Fire (hold for rapid fire)
- `P` — Pause/unpause
- `Enter` — Restart after game over

## Canvas
- Fixed size: 800x600
- Black background, white wireframe rendering
- HUD: Score (top-left), Level (top-right), Lives remaining (bottom-left, ship icons)

## Cleanup (`onExit`)
- Remove keydown/keyup listeners
- Cancel animation frame
- Clear any intervals
