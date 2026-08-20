# Space Invaders App — Design Spec

**Date:** 2026-08-20

**Goal:** Implement a Space Invaders clone as a maroku.sh app, following the existing Pong/Tetris app pattern.

## 1. Overview

A classic Space Invaders game where the player controls a cannon-shaped ship at the bottom of the screen, shooting at descending rows of pixel-art aliens. The aliens move side-to-side as a group, stepping down when hitting edges, with increasing speed as fewer remain.

## 2. Architecture

Single file `commands/invaders.js` module with `execute(args, container, onExit)` exports, matching the Tetris/Pong app contract. All game logic is client-side JavaScript on a single HTML5 canvas. No external dependencies.

## 3. File Changes

| File | Action | Responsibility |
|------|--------|----------------|
| `commands/invaders.js` | Create | Game app module |
| `commands/manifest.json` | Modify | Register `"invaders"` app entry |

## 4. Canvas & Layout

- **Canvas:** 800×600 px, black background, 4 px white border, soft outer shadow
- **Layout:** Centered in app container with heading, matching Pong's layout approach
- **Heading:** "SPACE INVADERS" during play, "GAME OVER" / "PAUSED" as appropriate
- **Cursor:** visible over canvas (direct tracking model)
- **Font:** monospace, white text

## 5. Player Ship

- **Shape:** Classic cannon — wide rectangular base with pointed top triangle
- **Color:** White (#FFF)
- **Size:** 40 px wide × 20 px tall
- **Position:** Bottom of screen (y = 560)
- **Movement:** Direct mouse tracking — ship x-coordinate follows cursor horizontal position
- **Range:** Full canvas width (no horizontal constraints)
- **Firing:** Left mouse click, rapid fire with 200ms cooldown, multiple bullets on screen

## 6. Invaders

### 6.1 Formation
- **Grid:** 5 rows × 11 columns = 55 invaders total
- **Spacing:** 48 px between invaders (center-to-center)
- **Starting position:** Top portion of screen, centered horizontally

### 6.2 Sprite Types (pixel art, 32×24 px each)
| Row | Type | Color | Points |
|-----|------|-------|--------|
| 1 | Top leader (commander) | cyan (#00FFFF) | 30 |
| 2 | Crabs | white (#FFF) | 20 |
| 3 | Crabs | white (#FFF) | 20 |
| 4 | Squids | white (#FFF) | 10 |
| 5 | Squids | white (#FFF) | 10 |

### 6.3 Animation
- Each invader has 2 frames (walking left / walking right)
- Frames alternate each step (not each frame)
- Drawn via pixel arrays (4×6 grid per invader, scaled 8× to 32×24)

### 6.4 Movement (classic arcade)
- Move as a group horizontally at constant speed
- When any invader hits canvas edge, entire group steps down (16 px) and reverses direction
- Speed increases as invaders are destroyed: `baseSpeed * (1 + (55 - aliveCount) * 0.04)`
  - Starts at ~3 px/frame, maxes at ~8 px/frame
- If any invader reaches the bottom (y >= 520), game over

## 7. Bullets

### 7.1 Player Bullets
- **Shape:** Single pixel-wide white line, 12 px tall
- **Speed:** 8 px/frame upward
- **Cooldown:** 200ms between shots
- **Limit:** Max 3 bullets on screen simultaneously
- **Fire trigger:** Left mouse click

### 7.2 Invader Bullets
- **Shape:** Single pixel-wide white line, 12 px tall (inverted)
- **Speed:** 4 px/frame downward
- **Firing behavior:** Classic — each second, 1-2 random invaders from the bottom-most alive row in each column fire
- **Limit:** Max 5 invader bullets on screen simultaneously

## 8. Collision Detection

| Collision | Result |
|-----------|--------|
| Player bullet vs invader | Invader destroyed, player scores points |
| Player bullet vs invader bullet | Both destroyed |
| Invader bullet vs player ship | Player loses a life; if 0 lives, game over |
| Invader reaches bottom | Game over |

## 9. Game Flow

### 9.1 Start Screen
- "SPACE INVADERS" title centered
- "Click to Start" prompt
- No invaders or bullets on screen

### 9.2 Gameplay
- Invaders start at top, move side-to-side
- Player can move and fire freely
- Score, lives, and wave displayed at top

### 9.3 Game Over
- Triggered when: player runs out of lives OR invaders reach bottom
- Display: "GAME OVER", final score, "Click to Restart"
- Clicking restarts the game (reset all state)

### 9.4 Wave Progression
- When all 55 invaders are destroyed, a new wave begins
- New wave starts with full formation, slightly faster base speed
- Score carries over between waves

## 10. HUD

| Element | Position | Content |
|---------|----------|---------|
| Score | Top-left (x=10, y=20) | "SCORE: 0" in monospace |
| Lives | Top-center (x=400, y=20) | 3 ship icons |
| Wave | Top-right (x=790, y=20) | "WAVE 1" |
| Ship | Bottom | Follows mouse cursor |

## 11. Constraints

- No sound, no music (consistent with Pong and maroku.sh)
- No visual effects (flashes, particles) — plain redraw each frame
- Page refresh resets to start screen
- Auto-pause on window blur (matching Pong behavior)
- All game state lives client-side

## 12. Edge Cases

- Player ship at canvas edges: no constraints, ship follows cursor fully
- Multiple bullets: rapid fire with cooldown, max 3 player bullets, max 5 invader bullets
- Speed ramp: gradual increase as invaders are destroyed, no sudden jumps
- Wave transition: instant reset of formation, no intermediate screen
