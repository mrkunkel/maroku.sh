import { createGameUI } from './game-ui.js';

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
const SHIP_SIZE = 15;
const SHIP_HALF_WIDTH = 10;
const SHIP_ROTATION_SPEED = 3;
const SHIP_THRUST = 0.15;
const SHIP_FRICTION = 0.99;
const SHIP_INVINCIBLE_DURATION = 2000;

// Bullet constants
const BULLET_RADIUS = 8;
const BULLET_SPEED = 10;
const BULLET_COOLDOWN = 150;
const BULLET_LIFETIME = 40;

// Asteroid constants
const ASTEROID_LARGE_RADIUS = 40;
const ASTEROID_MEDIUM_RADIUS = 20;
const ASTEROID_SMALL_RADIUS = 10;
const ASTEROID_LARGE_SPEED = 1.5;
const ASTEROID_MEDIUM_SPEED = 2.5;
const ASTEROID_SMALL_SPEED = 3.5;
const ASTEROID_JAGGEDNESS = 0.3;

// Scoring
const SCORE_LARGE = 20;
const SCORE_MEDIUM = 50;
const SCORE_SMALL = 100;

// Game settings
const INITIAL_LIVES = 3;
const INITIAL_ASTEROIDS = 4;

// Game state variables
let canvas, ctx;
let removeCleanupFn;
let animationId = null;
let gameState = 'playing';
let score = 0;
let lives = INITIAL_LIVES;
let level = 1;

// Ship state
let ship = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    thrusting: false,
    invincibleUntil: 0
};

// Bullets and asteroids arrays
let bullets = [];
let asteroids = [];

// Input tracking
const keys = {};
let lastBulletTime = 0;

// ===== INPUT HANDLING =====

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

function handleKeyUp(e) {
    keys[e.code] = false;
}

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

// ===== SHIP FUNCTIONS =====

function drawShip() {
    if (ship.invincibleUntil && Date.now() < ship.invincibleUntil) {
        if (Math.floor(Date.now() / 100) % 2 === 0) return;
    }

    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    ctx.strokeStyle = COLOR_WHITE;
    ctx.lineWidth = 2;
    ctx.beginPath();

    ctx.moveTo(SHIP_SIZE, 0);
    ctx.lineTo(-SHIP_SIZE * 0.7, -SHIP_HALF_WIDTH);
    ctx.lineTo(-SHIP_SIZE * 0.3, 0);
    ctx.lineTo(-SHIP_SIZE * 0.7, SHIP_HALF_WIDTH);
    ctx.closePath();
    ctx.stroke();

    if (ship.thrusting) {
        ctx.beginPath();
        ctx.moveTo(-SHIP_SIZE * 0.3, -SHIP_HALF_WIDTH * 0.5);
        ctx.lineTo(-SHIP_SIZE * 1.2, 0);
        ctx.lineTo(-SHIP_SIZE * 0.3, SHIP_HALF_WIDTH * 0.5);
        ctx.stroke();
    }

    ctx.restore();
}

function updateShip() {
    if (keys['ArrowLeft']) {
        ship.angle -= SHIP_ROTATION_SPEED * Math.PI / 180;
    }
    if (keys['ArrowRight']) {
        ship.angle += SHIP_ROTATION_SPEED * Math.PI / 180;
    }

    ship.thrusting = keys['ArrowUp'];
    if (ship.thrusting) {
        ship.vx += Math.cos(ship.angle) * SHIP_THRUST;
        ship.vy += Math.sin(ship.angle) * SHIP_THRUST;
    }

    ship.vx *= SHIP_FRICTION;
    ship.vy *= SHIP_FRICTION;

    ship.x += ship.vx;
    ship.y += ship.vy;

    wrapShip();
}

function wrapShip() {
    if (ship.x < -SHIP_SIZE) ship.x = CANVAS_WIDTH + SHIP_SIZE;
    if (ship.x > CANVAS_WIDTH + SHIP_SIZE) ship.x = -SHIP_SIZE;
    if (ship.y < -SHIP_SIZE) ship.y = CANVAS_HEIGHT + SHIP_SIZE;
    if (ship.y > CANVAS_HEIGHT + SHIP_SIZE) ship.y = -SHIP_SIZE;
}

function resetShip() {
    ship.x = CANVAS_WIDTH / 2;
    ship.y = CANVAS_HEIGHT / 2;
    ship.vx = 0;
    ship.vy = 0;
    ship.angle = -Math.PI / 2;
    ship.invincibleUntil = Date.now() + SHIP_INVINCIBLE_DURATION;
}

// ===== ASTEROID FUNCTIONS =====

function createAsteroid(x, y, size) {
    let radius, speedMultiplier;

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

    const angle = Math.random() * Math.PI * 2;
    const speed = speedMultiplier * (0.5 + Math.random() * 0.5);

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

function spawnAsteroids(count) {
    for (let i = 0; i < count; i++) {
        let x, y;
        do {
            x = Math.random() * CANVAS_WIDTH;
            y = Math.random() * CANVAS_HEIGHT;
        } while (Math.hypot(x - ship.x, y - ship.y) < 150);

        asteroids.push(createAsteroid(x, y, 'large'));
    }
}

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

function updateAsteroids() {
    for (const asteroid of asteroids) {
        asteroid.x += asteroid.vx;
        asteroid.y += asteroid.vy;

        if (asteroid.x < -asteroid.radius) asteroid.x = CANVAS_WIDTH + asteroid.radius;
        if (asteroid.x > CANVAS_WIDTH + asteroid.radius) asteroid.x = -asteroid.radius;
        if (asteroid.y < -asteroid.radius) asteroid.y = CANVAS_HEIGHT + asteroid.radius;
        if (asteroid.y > CANVAS_HEIGHT + asteroid.radius) asteroid.y = -asteroid.radius;
    }
}

// ===== BULLET FUNCTIONS =====

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

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.lifetime--;

        if (bullet.x < 0) bullet.x = CANVAS_WIDTH;
        if (bullet.x > CANVAS_WIDTH) bullet.x = 0;
        if (bullet.y < 0) bullet.y = CANVAS_HEIGHT;
        if (bullet.y > CANVAS_HEIGHT) bullet.y = 0;

        if (bullet.lifetime <= 0) {
            bullets.splice(i, 1);
        }
    }
}

function drawBullets() {
    ctx.fillStyle = COLOR_WHITE;
    for (const bullet of bullets) {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, BULLET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ===== COLLISION & GAME LOGIC =====

function handleAsteroidHit(asteroidIndex) {
    const asteroid = asteroids[asteroidIndex];

    if (asteroid.size === 'large') {
        score += SCORE_LARGE;
    } else if (asteroid.size === 'medium') {
        score += SCORE_MEDIUM;
    } else {
        score += SCORE_SMALL;
    }

    if (asteroid.size === 'large') {
        asteroids.push(createAsteroid(asteroid.x, asteroid.y, 'medium'));
        asteroids.push(createAsteroid(asteroid.x, asteroid.y, 'medium'));
    } else if (asteroid.size === 'medium') {
        asteroids.push(createAsteroid(asteroid.x, asteroid.y, 'small'));
        asteroids.push(createAsteroid(asteroid.x, asteroid.y, 'small'));
    }

    asteroids.splice(asteroidIndex, 1);
}

function handleShipHit() {
    lives--;
    if (lives <= 0) {
        gameState = 'gameover';
    } else {
        resetShip();
    }
}

function checkCollisions() {
    if (gameState !== 'playing') return;

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

    if (ship.invincibleUntil && Date.now() < ship.invincibleUntil) return;

    for (let j = 0; j < asteroids.length; j++) {
        const asteroid = asteroids[j];
        const dist = Math.hypot(ship.x - asteroid.x, ship.y - asteroid.y);

        if (dist < asteroid.radius + SHIP_SIZE * 0.5) {
            handleShipHit();
            break;
        }
    }

    checkLevelComplete();
}

function checkLevelComplete() {
    if (asteroids.length === 0) {
        level++;
        spawnAsteroids(INITIAL_ASTEROIDS + level - 1);
        resetShip();
    }
}

// ===== HUD & SCREENS =====

function drawHUD() {
    ctx.fillStyle = COLOR_WHITE;
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE: ' + score, 20, 30);

    ctx.textAlign = 'right';
    ctx.fillText('LEVEL: ' + level, CANVAS_WIDTH - 20, 30);

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

// ===== GAME INITIALIZATION =====

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

// ===== GAME LOOP =====

function gameLoop() {
    if (gameState === 'playing') {
        if (keys['Space']) {
            fireBullet();
        }

        updateShip();
        updateBullets();
        updateAsteroids();
        checkCollisions();
    }

    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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

// ===== MODULE EXPORTS =====

export function execute(args, container, onExit) {
    const { wrapper, heading, addCleanup, removeCleanup } = createGameUI({
        title: 'ASTEROIDS',
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
    });
    removeCleanupFn = removeCleanup;

    // Canvas
    canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.cssText = 'background:' + COLOR_BG + ';border:4px solid #FFF;box-shadow:0 0 20px rgba(255,255,255,0.15);display:block;';
    wrapper.appendChild(canvas);

    container.appendChild(wrapper);

    ctx = canvas.getContext('2d');

    initGame();

    const keyDownHandler = (e) => handleKeyDown(e);
    const keyUpHandler = (e) => handleKeyUp(e);
    const blurHandler = () => handleBlur();
    const focusHandler = () => handleFocus();

    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);
    window.addEventListener('blur', blurHandler);
    window.addEventListener('focus', focusHandler);

    addCleanup(() => {
        window.removeEventListener('keydown', keyDownHandler);
        window.removeEventListener('keyup', keyUpHandler);
        window.removeEventListener('blur', blurHandler);
        window.removeEventListener('focus', focusHandler);
    });

    gameState = 'start';
    animationId = requestAnimationFrame(gameLoop);
}

export function onExit() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (removeCleanupFn) {
        removeCleanupFn();
    }
}
