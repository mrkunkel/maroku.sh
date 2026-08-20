# Asteroids Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a classic Asteroids arcade game as a single-file canvas game matching the existing games' patterns.

**Architecture:** Single `commands/asteroids.js` file with HTML5 Canvas rendering, `requestAnimationFrame` game loop (~60fps), keyboard input handling, and module exports matching the existing game pattern.

**Tech Stack:** Vanilla JavaScript, HTML5 Canvas, ES modules — no dependencies.

## Global Constraints

- Single file: `commands/asteroids.js`
- Canvas size: 800x600, black background, white wireframe rendering
- Ship: Triangle wireframe, ~15px from center to tip, ~10px half-width
- Asteroids: Three sizes — Large (radius ~40px), Medium (radius ~20px), Small (radius ~10px)
- Ship rotation: -3°/frame left, +3°/frame right via Left/Right arrow keys
- Ship thrust: +0.15 acceleration in facing direction via Up arrow key
- Ship friction: 0.99 per frame (inertia-based drift)
- Screen wrapping: Ship and bullets wrap around edges
- Bullets: ~8px radius, ~10px/frame speed, ~150ms cooldown, expire after ~40 frames
- Scoring: Large=20, Medium=50, Small=100
- Initial asteroids: 4 large asteroids at game start
- Level progression: 1 more asteroid per level when all destroyed
- Lives: 3 lives, game over when all lost
- Ship invincibility: Brief (2 seconds) after respawn
- Game states: `playing`, `paused`, `gameover`
- Input: ArrowLeft/ArrowRight (rotate), ArrowUp (thrust), Space (fire), P (pause), Enter (restart)
- Cleanup: Remove keydown/keyup listeners, cancel animation frame in `onExit()`
- Register in `commands/manifest.json`
- Match existing game patterns: module exports, canvas setup, game loop, pause-on-blur

---

### Task 1: Create asteroids.js with module exports and game constants

**Files:**
- Create: `commands/asteroids.js`
- Modify: `commands/manifest.json`

**Interfaces:**
- Produces: `type`, `title`, `description`, `execute(args, container, onExit)`, `onExit()`

- [ ] **Step 1: Create `commands/asteroids.js` with module exports and constants**

Create the file with the following structure:

```javascript
// Module exports
export const type = 'app';
export const title = 'Asteroids';
export const description = 'A classic space-shooting game';

// Canvas dimensions
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Colors
const COLOR_BG = '#000';
const COLOR_WHITE = '#FFF';

// Ship constants
const SHIP_SIZE = 15;           // Distance from center to tip
const SHIP_HALF_WIDTH = 10;     // Half-width of ship
const SHIP_ROTATION_SPEED = 3;  // Degrees per frame
const SHIP_THRUST = 0.15;       // Acceleration per frame
const SHIP_FRICTION = 0.99;     // Velocity friction per frame
const SHIP_INVINCIBLE_DURATION = 2000; // ms after respawn

// Bullet constants
const BULLET_RADIUS = 8;
const BULLET_SPEED = 10;
const BULLET_COOLDOWN = 150;    // ms between shots
const BULLET_LIFETIME = 40;     // frames before expiration

// Asteroid constants
const ASTEROID_LARGE_RADIUS = 40;
const ASTEROID_MEDIUM_RADIUS = 20;
const ASTEROID_SMALL_RADIUS = 10;
const ASTEROID_LARGE_SPEED = 1.5;
const ASTEROID_MEDIUM_SPEED = 2.5;
const ASTEROID_SMALL_SPEED = 3.5;
const ASTEROID_JAGGEDNESS = 0.3; // Random vertex offset factor

// Scoring
const SCORE_LARGE = 20;
const SCORE_MEDIUM = 50;
const SCORE_SMALL = 100;

// Game settings
const INITIAL_LIVES = 3;
const INITIAL_ASTEROIDS = 4;

// Game state variables
let canvas, ctx;
let animationId = null;
let gameState = 'playing'; // 'playing', 'paused', 'gameover'
let score = 0;
let lives = INITIAL_LIVES;
let level = 1;

// Ship state
let ship = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2, // Pointing up
    thrusting: false,
    invincibleUntil: 0
};

// Bullets and asteroids arrays
let bullets = [];
let asteroids = [];

// Input tracking
const keys = {};
let lastBulletTime = 0;
let onExitCallback = null;

// ... (game functions will follow)
```

- [ ] **Step 2: Update `commands/manifest.json` to register the game**

Add this entry to the manifest array:
```json
{ "name": "asteroids", "type": "app", "desc": "A classic space-shooting game" }
```

The updated manifest should have the new entry alongside the existing entries (dig, ifconfig, ls, ping, tetris, uname, whoami, pong, invaders).

- [ ] **Step 3: Verify the file structure**

Run: `head -80 commands/asteroids.js`
Expected: See the module exports and constants defined correctly.

---

### Task 2: Implement ship rendering and movement

**Files:**
- Modify: `commands/asteroids.js`

**Interfaces:**
- Consumes: `ship` state object, `canvas`, `ctx`, `keys`, constants from Task 1
- Produces: `drawShip()`, `updateShip()`, `resetShip()`, `wrapShip()`

- [ ] **Step 1: Implement `drawShip()` function**

Add this function after the constants:

```javascript
function drawShip() {
    if (ship.invincibleUntil && Date.now() < ship.invincibleUntil) {
        // Blink during invincibility
        if (Math.floor(Date.now() / 100) % 2 === 0) return;
    }
    
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    
    ctx.strokeStyle = COLOR_WHITE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Draw triangle ship (nose at right, wings at left)
    ctx.moveTo(SHIP_SIZE, 0);                          // Nose
    ctx.lineTo(-SHIP_SIZE * 0.7, -SHIP_HALF_WIDTH);    // Left wing
    ctx.lineTo(-SHIP_SIZE * 0.3, 0);                    // Engine indent
    ctx.lineTo(-SHIP_SIZE * 0.7, SHIP_HALF_WIDTH);     // Right wing
    ctx.closePath();
    ctx.stroke();
    
    // Draw thrust flame when thrusting
    if (ship.thrusting) {
        ctx.beginPath();
        ctx.moveTo(-SHIP_SIZE * 0.3, -SHIP_HALF_WIDTH * 0.5);
        ctx.lineTo(-SHIP_SIZE * 1.2, 0);
        ctx.lineTo(-SHIP_SIZE * 0.3, SHIP_HALF_WIDTH * 0.5);
        ctx.stroke();
    }
    
    ctx.restore();
}
```

- [ ] **Step 2: Implement `updateShip()` function**

Add this function:

```javascript
function updateShip() {
    // Rotation
    if (keys['ArrowLeft']) {
        ship.angle -= SHIP_ROTATION_SPEED * Math.PI / 180;
    }
    if (keys['ArrowRight']) {
        ship.angle += SHIP_ROTATION_SPEED * Math.PI / 180;
    }
    
    // Thrust
    ship.thrusting = keys['ArrowUp'];
    if (ship.thrusting) {
        ship.vx += Math.cos(ship.angle) * SHIP_THRUST;
        ship.vy += Math.sin(ship.angle) * SHIP_THRUST;
    }
    
    // Apply friction
    ship.vx *= SHIP_FRICTION;
    ship.vy *= SHIP_FRICTION;
    
    // Update position
    ship.x += ship.vx;
    ship.y += ship.vy;
    
    // Wrap around screen
    wrapShip();
}
```

- [ ] **Step 3: Implement `wrapShip()` function**

Add this function:

```javascript
function wrapShip() {
    if (ship.x < -SHIP_SIZE) ship.x = CANVAS_WIDTH + SHIP_SIZE;
    if (ship.x > CANVAS_WIDTH + SHIP_SIZE) ship.x = -SHIP_SIZE;
    if (ship.y < -SHIP_SIZE) ship.y = CANVAS_HEIGHT + SHIP_SIZE;
    if (ship.y > CANVAS_HEIGHT + SHIP_SIZE) ship.y = -SHIP_SIZE;
}
```

- [ ] **Step 4: Implement `resetShip()` function**

Add this function:

```javascript
function resetShip() {
    ship.x = CANVAS_WIDTH / 2;
    ship.y = CANVAS_HEIGHT / 2;
    ship.vx = 0;
    ship.vy = 0;
    ship.angle = -Math.PI / 2;
    ship.invincibleUntil = Date.now() + SHIP_INVINCIBLE_DURATION;
}
```

- [ ] **Step 5: Verify ship functions**

Run: `grep -n "function drawShip\|function updateShip\|function resetShip\|function wrapShip" commands/asteroids.js`
Expected: All four functions are defined.

---

### Task 3: Implement asteroid generation and rendering

**Files:**
- Modify: `commands/asteroids.js`

**Interfaces:**
- Consumes: `asteroids` array, constants from Task 1
- Produces: `createAsteroid()`, `spawnAsteroids()`, `drawAsteroids()`, `updateAsteroids()`

- [ ] **Step 1: Implement `createAsteroid()` function**

Add this function:

```javascript
function createAsteroid(x, y, size) {
    let radius, speed, speedMultiplier;
    
    if (size === 'large') {
        radius = ASTEROID_LARGE_RADIUS;
        speedMultiplier = ASTEROID_LARGE_SPEED;
    } else if (size === 'medium') {
        radius = ASTEROID_MEDIUM_RADIUS;
        speedMultiplier = ASTEROID_MEDIUM_SPEED;
    } else {
        radius = ASTEROID_SMALL_RADIUS;
        speedMultiplier = ASTEROID_SMALL_SPEED;
    }
    
    // Random velocity
    const angle = Math.random() * Math.PI * 2;
    const speed = speedMultiplier * (0.5 + Math.random() * 0.5);
    
    // Generate jagged vertices
    const numVertices = 8 + Math.floor(Math.random() * 5);
    const vertices = [];
    for (let i = 0; i < numVertices; i++) {
        const vertexAngle = (i / numVertices) * Math.PI * 2;
        const offset = 1 + (Math.random() - 0.5) * 2 * ASTEROID_JAGGEDNESS;
        vertices.push({
            x: Math.cos(vertexAngle) * radius * offset,
            y: Math.sin(vertexAngle) * radius * offset
        });
    }
    
    return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius, vertices, size };
}
```

- [ ] **Step 2: Implement `spawnAsteroids()` function**

Add this function:

```javascript
function spawnAsteroids(count) {
    for (let i = 0; i < count; i++) {
        let x, y;
        // Spawn away from the ship
        do {
            x = Math.random() * CANVAS_WIDTH;
            y = Math.random() * CANVAS_HEIGHT;
        } while (Math.hypot(x - ship.x, y - ship.y) < 150);
        
        asteroids.push(createAsteroid(x, y, 'large'));
    }
}
```

- [ ] **Step 3: Implement `drawAsteroids()` function**

Add this function:

```javascript
function drawAsteroids() {
    for (const asteroid of asteroids) {
        ctx.strokeStyle = COLOR_WHITE;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        for (let i = 0; i < asteroid.vertices.length; i++) {
            const v = asteroid.vertices[i];
            if (i === 0) {
                ctx.moveTo(asteroid.x + v.x, asteroid.y + v.y);
            } else {
                ctx.lineTo(asteroid.x + v.x, asteroid.y + v.y);
            }
        }
        
        ctx.closePath();
        ctx.stroke();
    }
}
```

- [ ] **Step 4: Implement `updateAsteroids()` function**

Add this function:

```javascript
function updateAsteroids() {
    for (const asteroid of asteroids) {
        asteroid.x += asteroid.vx;
        asteroid.y += asteroid.vy;
        
        // Wrap around screen
        if (asteroid.x < -asteroid.radius) asteroid.x = CANVAS_WIDTH + asteroid.radius;
        if (asteroid.x > CANVAS_WIDTH + asteroid.radius) asteroid.x = -asteroid.radius;
        if (asteroid.y < -asteroid.radius) asteroid.y = CANVAS_HEIGHT + asteroid.radius;
        if (asteroid.y > CANVAS_HEIGHT + asteroid.radius) asteroid.y = -asteroid.radius;
    }
}
```

- [ ] **Step 5: Verify asteroid functions**

Run: `grep -n "function createAsteroid\|function spawnAsteroids\|function drawAsteroids\|function updateAsteroids" commands/asteroids.js`
Expected: All four functions are defined.

---

### Task 4: Implement bullet firing and rendering

**Files:**
- Modify: `commands/asteroids.js`

**Interfaces:**
- Consumes: `bullets` array, `ship` state, constants from Task 1
- Produces: `fireBullet()`, `updateBullets()`, `drawBullets()`

- [ ] **Step 1: Implement `fireBullet()` function**

Add this function:

```javascript
function fireBullet() {
    const now = Date.now();
    if (now - lastBulletTime < BULLET_COOLDOWN) return;
    lastBulletTime = now;
    
    bullets.push({
        x: ship.x + Math.cos(ship.angle) * SHIP_SIZE,
        y: ship.y + Math.sin(ship.angle) * SHIP_SIZE,
        vx: Math.cos(ship.angle) * BULLET_SPEED,
        vy: Math.sin(ship.angle) * BULLET_SPEED,
        lifetime: BULLET_LIFETIME
    });
}
```

- [ ] **Step 2: Implement `updateBullets()` function**

Add this function:

```javascript
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.lifetime--;
        
        // Wrap around screen
        if (bullet.x < 0) bullet.x = CANVAS_WIDTH;
        if (bullet.x > CANVAS_WIDTH) bullet.x = 0;
        if (bullet.y < 0) bullet.y = CANVAS_HEIGHT;
        if (bullet.y > CANVAS_HEIGHT) bullet.y = 0;
        
        // Remove expired bullets
        if (bullet.lifetime <= 0) {
            bullets.splice(i, 1);
        }
    }
}
```

- [ ] **Step 3: Implement `drawBullets()` function**

Add this function:

```javascript
function drawBullets() {
    ctx.fillStyle = COLOR_WHITE;
    for (const bullet of bullets) {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, BULLET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }
}
```

- [ ] **Step 4: Verify bullet functions**

Run: `grep -n "function fireBullet\|function updateBullets\|function drawBullets" commands/asteroids.js`
Expected: All three functions are defined.

---

### Task 5: Implement collision detection and game logic

**Files:**
- Modify: `commands/asteroids.js`

**Interfaces:**
- Consumes: All game state, all functions from Tasks 2-4
- Produces: `checkCollisions()`, `handleAsteroidHit()`, `handleShipHit()`, `checkLevelComplete()`

- [ ] **Step 1: Implement `handleAsteroidHit()` function**

Add this function:

```javascript
function handleAsteroidHit(asteroidIndex) {
    const asteroid = asteroids[asteroidIndex];
    
    // Add score
    if (asteroid.size === 'large') {
        score += SCORE_LARGE;
    } else if (asteroid.size === 'medium') {
        score += SCORE_MEDIUM;
    } else {
        score += SCORE_SMALL;
    }
    
    // Split into smaller asteroids
    if (asteroid.size === 'large') {
        asteroids.push(createAsteroid(asteroid.x, asteroid.y, 'medium'));
        asteroids.push(createAsteroid(asteroid.x, asteroid.y, 'medium'));
    } else if (asteroid.size === 'medium') {
        asteroids.push(createAsteroid(asteroid.x, asteroid.y, 'small'));
        asteroids.push(createAsteroid(asteroid.x, asteroid.y, 'small'));
    }
    
    // Remove the hit asteroid
    asteroids.splice(asteroidIndex, 1);
}
```

- [ ] **Step 2: Implement `handleShipHit()` function**

Add this function:

```javascript
function handleShipHit() {
    lives--;
    if (lives <= 0) {
        gameState = 'gameover';
    } else {
        resetShip();
    }
}
```

- [ ] **Step 3: Implement `checkCollisions()` function**

Add this function:

```javascript
function checkCollisions() {
    if (gameState !== 'playing') return;
    
    // Bullet-asteroid collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const bullet = bullets[i];
            const asteroid = asteroids[j];
            const dist = Math.hypot(bullet.x - asteroid.x, bullet.y - asteroid.y);
            
            if (dist < asteroid.radius + BULLET_RADIUS) {
                bullets.splice(i, 1);
                handleAsteroidHit(j);
                break;
            }
        }
    }
    
    // Ship-asteroid collisions
    if (ship.invincibleUntil && Date.now() < ship.invincibleUntil) return;
    
    for (let j = 0; j < asteroids.length; j++) {
        const asteroid = asteroids[j];
        const dist = Math.hypot(ship.x - asteroid.x, ship.y - asteroid.y);
        
        if (dist < asteroid.radius + SHIP_SIZE * 0.5) {
            handleShipHit();
            break;
        }
    }
    
    // Check level complete
    checkLevelComplete();
}
```

- [ ] **Step 4: Implement `checkLevelComplete()` function**

Add this function:

```javascript
function checkLevelComplete() {
    if (asteroids.length === 0) {
        level++;
        spawnAsteroids(INITIAL_ASTEROIDS + level - 1);
        resetShip();
    }
}
```

- [ ] **Step 5: Verify collision functions**

Run: `grep -n "function handleAsteroidHit\|function handleShipHit\|function checkCollisions\|function checkLevelComplete" commands/asteroids.js`
Expected: All four functions are defined.

---

### Task 6: Implement HUD, game states, and game loop

**Files:**
- Modify: `commands/asteroids.js`

**Interfaces:**
- Consumes: All game state, all functions from previous tasks
- Produces: `drawHUD()`, `drawStartScreen()`, `drawGameOverScreen()`, `initGame()`, `gameLoop()`, `execute()`, `onExit()`

- [ ] **Step 1: Implement `drawHUD()` function**

Add this function:

```javascript
function drawHUD() {
    ctx.fillStyle = COLOR_WHITE;
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE: ' + score, 20, 30);
    
    ctx.textAlign = 'right';
    ctx.fillText('LEVEL: ' + level, CANVAS_WIDTH - 20, 30);
    
    // Draw lives
    ctx.textAlign = 'left';
    ctx.fillText('LIVES:', 20, CANVAS_HEIGHT - 20);
    
    for (let i = 0; i < lives; i++) {
        const lx = 110 + i * 25;
        const ly = CANVAS_HEIGHT - 25;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.strokeStyle = COLOR_WHITE;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-6, -5);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-6, 5);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
}
```

- [ ] **Step 2: Implement `drawStartScreen()` function**

Add this function:

```javascript
function drawStartScreen() {
    ctx.fillStyle = COLOR_WHITE;
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ASTEROIDS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    
    ctx.font = '20px monospace';
    ctx.fillText('Press ENTER to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    
    ctx.font = '16px monospace';
    ctx.fillText('Arrow keys: Rotate & Thrust', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    ctx.fillText('Space: Fire', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 85);
    ctx.fillText('P: Pause', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);
}
```

- [ ] **Step 3: Implement `drawGameOverScreen()` function**

Add this function:

```javascript
function drawGameOverScreen() {
    ctx.fillStyle = COLOR_WHITE;
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    
    ctx.font = '24px monospace';
    ctx.fillText('Final Score: ' + score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    
    ctx.font = '20px monospace';
    ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}
```

- [ ] **Step 4: Implement `initGame()` function**

Add this function:

```javascript
function initGame() {
    score = 0;
    lives = INITIAL_LIVES;
    level = 1;
    bullets = [];
    asteroids = [];
    resetShip();
    spawnAsteroids(INITIAL_ASTEROIDS);
    gameState = 'playing';
    lastBulletTime = 0;
}
```

- [ ] **Step 5: Implement `gameLoop()` function**

Add this function:

```javascript
function gameLoop() {
    if (gameState === 'playing') {
        updateShip();
        updateBullets();
        updateAsteroids();
        checkCollisions();
    }
    
    // Clear canvas
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw everything
    drawAsteroids();
    drawBullets();
    
    if (gameState === 'playing' || gameState === 'paused') {
        drawShip();
    }
    
    drawHUD();
    
    if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'paused') {
        ctx.fillStyle = COLOR_WHITE;
        ctx.font = '36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    } else if (gameState === 'gameover') {
        drawGameOverScreen();
    }
    
    animationId = requestAnimationFrame(gameLoop);
}
```

- [ ] **Step 6: Implement `execute()` function**

Add this function:

```javascript
export function execute(args, container, onExit) {
    onExitCallback = onExit;
    
    // Create heading
    const heading = document.createElement('h1');
    heading.style.cssText = 'color:#FFF;font-family:monospace;font-size:18px;margin:10px 0;text-align:center;';
    heading.textContent = 'ASTEROIDS';
    container.appendChild(heading);
    
    // Create canvas
    canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.cssText = 'background:' + COLOR_BG + ';border:4px solid #FFF;box-shadow:0 0 20px rgba(255,255,255,0.15);display:block;';
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');
    
    // Initialize game
    initGame();
    
    // Set up input listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    // Start game loop
    gameState = 'start';
    animationId = requestAnimationFrame(gameLoop);
}
```

- [ ] **Step 7: Implement `onExit()` function**

Add this function:

```javascript
export function onExit() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('focus', handleFocus);
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}
```

- [ ] **Step 8: Verify all functions**

Run: `grep -n "function " commands/asteroids.js`
Expected: All game functions are defined including `execute` and `onExit`.

---

### Task 7: Implement input handling and final integration

**Files:**
- Modify: `commands/asteroids.js`

**Interfaces:**
- Consumes: All game state, all functions from previous tasks
- Produces: `handleKeyDown()`, `handleKeyUp()`, `handleBlur()`, `handleFocus()`

- [ ] **Step 1: Implement `handleKeyDown()` function**

Add this function:

```javascript
function handleKeyDown(e) {
    keys[e.code] = true;
    
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'playing') {
            fireBullet();
        }
    }
    
    if (e.code === 'KeyP') {
        if (gameState === 'playing') {
            gameState = 'paused';
        } else if (gameState === 'paused') {
            gameState = 'playing';
        }
    }
    
    if (e.code === 'Enter') {
        if (gameState === 'start' || gameState === 'gameover') {
            initGame();
        }
    }
}
```

- [ ] **Step 2: Implement `handleKeyUp()` function**

Add this function:

```javascript
function handleKeyUp(e) {
    keys[e.code] = false;
}
```

- [ ] **Step 3: Implement `handleBlur()` and `handleFocus()` functions**

Add these functions:

```javascript
function handleBlur() {
    if (gameState === 'playing') {
        gameState = 'paused';
    }
}

function handleFocus() {
    if (gameState === 'paused') {
        gameState = 'playing';
    }
}
```

- [ ] **Step 4: Update `gameLoop()` to handle continuous fire**

Replace the existing `gameLoop()` function with this updated version that handles continuous fire:

```javascript
function gameLoop() {
    if (gameState === 'playing') {
        // Continuous fire when space is held
        if (keys['Space']) {
            fireBullet();
        }
        
        updateShip();
        updateBullets();
        updateAsteroids();
        checkCollisions();
    }
    
    // Clear canvas
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw everything
    drawAsteroids();
    drawBullets();
    
    if (gameState === 'playing' || gameState === 'paused') {
        drawShip();
    }
    
    drawHUD();
    
    if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'paused') {
        ctx.fillStyle = COLOR_WHITE;
        ctx.font = '36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    } else if (gameState === 'gameover') {
        drawGameOverScreen();
    }
    
    animationId = requestAnimationFrame(gameLoop);
}
```

- [ ] **Step 5: Verify input handling**

Run: `grep -n "function handleKeyDown\|function handleKeyUp\|function handleBlur\|function handleFocus" commands/asteroids.js`
Expected: All four input handling functions are defined.

---

## Self-Review

**1. Spec coverage:**
- Ship controls (rotation, thrust, inertia, wrapping) → Task 2 ✓
- Asteroids (three sizes, splitting, jagged rendering, wrapping) → Task 3 ✓
- Bullets (rapid fire, cooldown, lifetime, wrapping) → Task 4 ✓
- Scoring (large=20, medium=50, small=100) → Task 5 ✓
- Game states (playing, paused, gameover) → Task 6 ✓
- Input (arrows, space, P, Enter) → Task 7 ✓
- HUD (score, level, lives) → Task 6 ✓
- Canvas (800x600, black bg, white wireframe) → Task 1 ✓
- Cleanup (listeners, animation frame) → Task 6 ✓
- Registration in manifest → Task 1 ✓
- Module exports (type, title, description, execute, onExit) → Task 1, 6 ✓
- Invincibility on respawn → Task 2 ✓
- Level progression → Task 5 ✓
- 3 lives → Task 1, 5, 6 ✓

**2. Placeholder scan:** No TBD, TODO, or "implement later" found. All code is concrete.

**3. Type consistency:** All function names, variable names, and constants are consistent across tasks. `gameState` transitions are: start → playing (on Enter) → paused (on P) → playing (on P) → gameover (on lives=0) → playing (on Enter).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-20-asteroids.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
