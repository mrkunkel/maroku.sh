# Pong App — Design Spec

**Date:** 2026-08-20

**Goal:** Implement a single-player Pong game as a maroku.sh app, following the existing Tetris app pattern.

## 1. Overview

A classic endless Pong game where the player controls the left paddle via mouse wheel and a computer AI controls the right paddle. Runs full-screen inside maroku.sh's app container with an X button to return to the terminal.

## 2. Architecture

Single file `commands/pong.js` module with `execute()` and `onExit()` exports, matching the Tetris app contract. All game logic is client-side JavaScript on a single HTML5 canvas. No external dependencies.

## 3. File Changes

| File | Action | Responsibility |
|------|--------|----------------|
| `commands/pong.js` | Create | Game app module |
| `commands/manifest.json` | Modify | Register `"pong"` app entry |

## 4. UI/UX

- **Background:** Dark gray (`#222`), centered content, no scrollbars
- **Heading:** "PONG" during play, "PAUSED" when window loses focus
- **Canvas:** 800×400 px, black background, 4 px white border, soft outer shadow
- **Cursor:** Hidden over canvas
- **Instructions:** Below canvas, light gray text — "Use **Mouse Wheel** to move your paddle"
- **Font:** Sans-serif, white text

## 5. Game Elements

| Element | Details |
|---------|---------|
| Player paddle | 10×80 px, green (#00FF00), x=0, clamped to field |
| AI paddle | 10×80 px, red (#FF0000), x=790, clamped to field |
| Ball | White circle, 10 px radius |
| Player score | White, 35 px Arial, at x=200, y=80 |
| AI score | White, 35 px Arial, at x=600, y=80 |

No center net line, no decorations.

## 6. Controls

- Mouse wheel (scroll) on window — moves player paddle by `scrollDeltaY × 0.15` px
- Wheel input ignored while paused
- No keyboard, click, or touch controls

## 7. Pause Behavior

- Auto-pause when window loses focus (`window.onblur`)
- Auto-resume when focus returns (`window.onfocus`)
- Ball and AI freeze while paused; scene still rendered

## 8. Ball Physics

- **Loop:** `requestAnimationFrame` target ~60 fps
- **Initial speed:** 5 px/frame, launching from center moving bottom-right (45°)
- **Wall bounce:** Invert vertical velocity; clamp ball inside walls to prevent tunneling
- **Paddle collision:** AABB overlap with paddle facing that half of court
- **Bounce angle:** `(-1 to +1) × π/4` based on where ball hits paddle relative to center
- **After paddle hit:** Ball always travels away from the hitting paddle
- **Speed increase:** +0.2 px/frame per paddle hit, no upper cap
- **Scoring:** Ball crosses left edge → AI scores; crosses right edge → player scores

## 9. Post-Score Reset

- Ball resets to court center
- Speed resets to base 5 px/frame
- Serve direction toward the side that just scored
- Vertical velocity preserved from before the score
- Paddle positions unchanged

## 10. AI Behavior

- Tracks ball's y position
- Dead zone: ±10 px — AI does not move when within this range
- Constant speed: 3.5 px/frame (slower than ball's base speed)
- Clamped to field edges (decision: changed from unclamped)

## 11. Edge Cases Decisions

| FR | Behavior | Decision |
|----|----------|----------|
| FR-40 | AI paddle unclamped | **Clamp AI paddle** to field |
| FR-41 | Ball tunnels through walls at high speed | **Add position correction** — clamp ball inside walls before bounce |
| FR-42 | No ball speed cap | **Preserve no cap** |

## 12. Constraints

- No sound, no music
- No visual effects (flashes, particles, transient effects)
- No game-over screen, no win/loss condition
- Page refresh resets game to initial state
- Single dependency: none (vanilla JS + HTML5 canvas)
