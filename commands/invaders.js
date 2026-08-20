export const type = 'app';
export const title = 'Space Invaders';
export const description = 'A classic Space Invaders game';

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 20;
const PLAYER_Y = 560;
const PLAYER_SPEED = 5;
const PLAYER_MIN_Y = CANVAS_HEIGHT * 0.5;
const BULLET_SPEED = 4;
const INVADER_BULLET_SPEED = 2;
const MAX_PLAYER_BULLETS = 5;
const MAX_INVADER_BULLETS = 5;
const FIRE_COOLDOWN = 100;
const INVADER_COLS = 11;
const INVADER_ROWS = 5;
const INVADER_SPACING = 48;
const INVADER_STEP_DOWN = 16;
const INVADER_BASE_SPEED = 1.5;
const INVADER_SPEED_MULTIPLIER = 0.04;
const INVADER_BULLET_INTERVAL = 2000;
const BOTTOM_Y = 520;
const START_INVADER_Y = 60;

// Colors
const COLOR_BG = '#000';
const COLOR_BORDER = '#FFF';
const COLOR_PLAYER = '#FFF';
const COLOR_BULLET = '#FFF';
const COLOR_TEXT = '#FFF';
const COLOR_TOP_LEADER = '#00FFFF';

// Invader sprite pixel art (4x6 grid, each cell 8x8 when scaled)
// Frame 0: walking left, Frame 1: walking right
const SPRITES = {
    squid: [
        // Frame 0
        [
            [0,0,0,1,1,0,0,0],
            [0,0,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,0,1,1,0,1,1],
            [1,1,1,1,1,1,1,1],
            [0,0,1,0,0,1,0,0],
        ],
        // Frame 1
        [
            [0,0,0,1,1,0,0,0],
            [0,0,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,0,1,1,0,1,1],
            [1,1,1,1,1,1,1,1],
            [1,0,1,0,0,1,0,1],
        ]
    ],
    crab: [
        // Frame 0
        [
            [1,0,1,0,0,1,0,1],
            [1,1,1,0,0,1,1,1],
            [1,1,1,1,1,1,1,1],
            [1,1,0,1,1,0,1,1],
            [0,1,1,1,1,1,1,0],
            [1,1,0,0,0,0,1,1],
        ],
        // Frame 1
        [
            [0,1,1,0,0,1,1,0],
            [1,1,1,0,0,1,1,1],
            [1,1,1,1,1,1,1,1],
            [1,1,1,0,0,1,1,1],
            [0,1,1,1,1,1,1,0],
            [1,1,0,1,1,0,0,0],
        ]
    ],
    commander: [
        // Frame 0
        [
            [0,0,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1],
            [1,1,1,0,0,1,1,1],
            [1,1,1,1,1,1,1,1],
            [0,1,0,1,1,0,1,0],
        ],
        // Frame 1
        [
            [0,0,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1],
            [1,1,1,0,0,1,1,1],
            [1,1,1,1,1,1,1,1],
            [1,0,1,0,0,1,0,1],
        ]
    ]
};

// Game state
let canvas, ctx;
let animationId = null;
let gameState = 'start'; // 'start', 'playing', 'gameover'
let score = 0;
let lives = 3;
let wave = 1;
let playerX = CANVAS_WIDTH / 2;
let playerY = PLAYER_Y;
let playerBullets = [];
let invaderBullets = [];
let invaders = [];
let lastFireTime = 0;
let lastInvaderBulletTime = 0;
let invaderDirection = 1;
let invaderAnimationFrame = 0;
let baseSpeed = INVADER_BASE_SPEED;
let isMouseDown = false;
let handleMouseDown, handleMouseUp;

export function execute(args, container) {
    // Centering wrapper
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;width:100%;';

    // Heading
    const heading = document.createElement('h1');
    heading.id = 'invaders-heading';
    heading.style.cssText = 'color:' + COLOR_TEXT + ';font-size:32px;margin:0 0 10px 0;font-family:monospace;';
    heading.textContent = 'SPACE INVADERS';
    wrapper.appendChild(heading);

    // Canvas
    canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.cssText = 'background:' + COLOR_BG + ';border:4px solid ' + COLOR_BORDER + ';box-shadow:0 0 20px rgba(255,255,255,0.15);display:block;';
    wrapper.appendChild(canvas);

    container.appendChild(wrapper);

    ctx = canvas.getContext('2d');

    // Mouse tracking
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;
        playerX = Math.max(PLAYER_WIDTH / 2, Math.min(CANVAS_WIDTH - PLAYER_WIDTH / 2, rawX));
        playerY = Math.max(PLAYER_MIN_Y, Math.min(CANVAS_HEIGHT - 10, rawY));
    });

    // Mouse button for hold-to-fire
    const handleMouseDown = (e) => {
        e.preventDefault();
        isMouseDown = true;
        if (gameState === 'start') {
            gameState = 'playing';
            initGame();
        } else if (gameState === 'gameover') {
            score = 0;
            lives = 3;
            wave = 1;
            baseSpeed = INVADER_BASE_SPEED;
            initGame();
            gameState = 'playing';
            document.getElementById('invaders-heading').textContent = 'SPACE INVADERS';
        }
    };

    const handleMouseUp = () => {
        isMouseDown = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    canvas.addEventListener('click', handleClick);

    // Auto-pause on window blur
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    initInvaders();
    gameLoop();
}

function handleBlur() {
    if (gameState === 'playing') {
        gameState = 'paused';
        document.getElementById('invaders-heading').textContent = 'PAUSED';
    }
}

function handleFocus() {
    if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('invaders-heading').textContent = 'SPACE INVADERS';
        lastInvaderBulletTime = performance.now();
    }
}

function handleClick() {
    // Only used for start/restart via click (mousedown already handles these)
    // During gameplay, fire is handled by mousedown hold
}

function initGame() {
    playerX = CANVAS_WIDTH / 2;
    playerY = PLAYER_Y;
    playerBullets = [];
    invaderBullets = [];
    lastFireTime = 0;
    lastInvaderBulletTime = performance.now();
    invaderDirection = 1;
    invaderAnimationFrame = 0;
    initInvaders();
}

function initInvaders() {
    invaders = [];
    const totalWidth = (INVADER_COLS - 1) * INVADER_SPACING;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;

    for (let row = 0; row < INVADER_ROWS; row++) {
        for (let col = 0; col < INVADER_COLS; col++) {
            let type, color, points;
            if (row === 0) {
                type = 'commander';
                color = COLOR_TOP_LEADER;
                points = 30;
            } else if (row <= 2) {
                type = 'crab';
                color = COLOR_TEXT;
                points = 20;
            } else {
                type = 'squid';
                color = COLOR_TEXT;
                points = 10;
            }
            invaders.push({
                x: startX + col * INVADER_SPACING,
                y: START_INVADER_Y + row * INVADER_SPACING,
                type: type,
                color: color,
                points: points,
                alive: true,
                frame: 0
            });
        }
    }
}

function fireBullet() {
    const now = performance.now();
    if (now - lastFireTime < FIRE_COOLDOWN) return;
    if (playerBullets.length >= MAX_PLAYER_BULLETS) return;

    lastFireTime = now;
    playerBullets.push({
        x: playerX,
        y: playerY - 20
    });
}

function fireInvaderBullet() {
    if (invaderBullets.length >= MAX_INVADER_BULLETS) return;

    // Find bottom-most alive invader in each column
    const columns = {};
    for (const invader of invaders) {
        if (!invader.alive) continue;
        const col = Math.round((invader.x - (CANVAS_WIDTH - (INVADER_COLS - 1) * INVADER_SPACING) / 2) / INVADER_SPACING);
        if (!columns[col] || invader.y > columns[col].y) {
            columns[col] = invader;
        }
    }

    // Pick 1-2 columns randomly
    const colKeys = Object.keys(columns);
    if (colKeys.length === 0) return;

    const count = Math.random() < 0.5 ? 1 : 2;
    const shuffled = colKeys.sort(() => Math.random() - 0.5).slice(0, count);

    for (const key of shuffled) {
        const invader = columns[key];
        invaderBullets.push({
            x: invader.x,
            y: invader.y + 12
        });
    }
}

function updateInvaders() {
    const aliveCount = invaders.filter(i => i.alive).length;
    if (aliveCount === 0) {
        // All invaders destroyed, new wave
        wave++;
        baseSpeed = INVADER_BASE_SPEED + (wave - 1) * 0.5;
        initGame();
        return;
    }

    const speed = INVADER_BASE_SPEED * (1 + (INVADER_ROWS * INVADER_COLS - aliveCount) * INVADER_SPEED_MULTIPLIER) + (wave - 1) * 0.3;

    let hitEdge = false;
    for (const invader of invaders) {
        if (!invader.alive) continue;
        invader.x += speed * invaderDirection;
        if (invader.x <= 4 || invader.x + 32 >= CANVAS_WIDTH - 4) {
            hitEdge = true;
        }
    }

    if (hitEdge) {
        invaderDirection *= -1;
        for (const invader of invaders) {
            if (!invader.alive) continue;
            invader.y += INVADER_STEP_DOWN;
        }
        invaderAnimationFrame = 1 - invaderAnimationFrame;
    }

    // Check if invaders reached bottom
    for (const invader of invaders) {
        if (!invader.alive) continue;
        if (invader.y + 24 >= BOTTOM_Y) {
            gameState = 'gameover';
            document.getElementById('invaders-heading').textContent = 'GAME OVER';
            return;
        }
    }
}

function updateBullets() {
    // Update player bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        playerBullets[i].y -= BULLET_SPEED;
        if (playerBullets[i].y < 0) {
            playerBullets.splice(i, 1);
        }
    }

    // Update invader bullets
    for (let i = invaderBullets.length - 1; i >= 0; i--) {
        invaderBullets[i].y += INVADER_BULLET_SPEED;
        if (invaderBullets[i].y > CANVAS_HEIGHT) {
            invaderBullets.splice(i, 1);
        }
    }
}

function checkCollisions() {
    // Player bullets vs invaders
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        for (const invader of invaders) {
            if (!invader.alive) continue;
            if (bullet.x >= invader.x && bullet.x <= invader.x + 32 &&
                bullet.y >= invader.y && bullet.y <= invader.y + 24) {
                invader.alive = false;
                score += invader.points;
                playerBullets.splice(i, 1);
                break;
            }
        }
    }

    // Player bullets vs invader bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const pBullet = playerBullets[i];
        for (let j = invaderBullets.length - 1; j >= 0; j--) {
            const iBullet = invaderBullets[j];
            if (pBullet.x === iBullet.x && Math.abs(pBullet.y - iBullet.y) < 12) {
                playerBullets.splice(i, 1);
                invaderBullets.splice(j, 1);
                break;
            }
        }
    }

    // Invader bullets vs player
    for (let i = invaderBullets.length - 1; i >= 0; i--) {
        const bullet = invaderBullets[i];
        if (bullet.x >= playerX - PLAYER_WIDTH / 2 && bullet.x <= playerX + PLAYER_WIDTH / 2 &&
            bullet.y >= playerY - PLAYER_HEIGHT && bullet.y <= playerY) {
            invaderBullets.splice(i, 1);
            lives--;
            if (lives <= 0) {
                lives = 0;
                gameState = 'gameover';
                document.getElementById('invaders-heading').textContent = 'GAME OVER';
            }
        }
    }
}

function drawPlayer() {
    ctx.fillStyle = COLOR_PLAYER;
    // Cannon shape: wide base + pointed top
    ctx.fillRect(playerX - PLAYER_WIDTH / 2, playerY - 6, PLAYER_WIDTH, 6);
    ctx.fillRect(playerX - PLAYER_WIDTH / 4, playerY - 14, PLAYER_WIDTH / 2, 8);
    ctx.fillRect(playerX - 4, playerY - 20, 8, 6);
}

function drawInvaders() {
    for (const invader of invaders) {
        if (!invader.alive) continue;
        const sprite = SPRITES[invader.type][invader.frame];
        const pixelSize = 4;
        ctx.fillStyle = invader.color;
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                if (sprite[row][col]) {
                    ctx.fillRect(
                        invader.x + col * pixelSize,
                        invader.y + row * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
    }
}

function drawBullets() {
    ctx.fillStyle = COLOR_BULLET;
    for (const bullet of playerBullets) {
        ctx.fillRect(bullet.x - 0.5, bullet.y - 6, 1, 12);
    }
    for (const bullet of invaderBullets) {
        ctx.fillRect(bullet.x - 0.5, bullet.y - 6, 1, 12);
    }
}

function drawHUD() {
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE: ' + score, 10, 20);

    ctx.textAlign = 'center';
    // Draw lives as ship icons
    for (let i = 0; i < lives; i++) {
        const lx = 400 + i * 25 - 10;
        const ly = 14;
        ctx.fillRect(lx - 5, ly, 10, 3);
        ctx.fillRect(lx - 2.5, ly - 4, 5, 3);
    }

    ctx.textAlign = 'right';
    ctx.fillText('WAVE ' + wave, CANVAS_WIDTH - 10, 20);
}

function drawStartScreen() {
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Click to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

function drawGameOver() {
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    ctx.font = '20px monospace';
    ctx.fillText('Score: ' + score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    ctx.font = '16px monospace';
    ctx.fillText('Click to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

function drawPaused() {
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (gameState === 'start') {
        drawStartScreen();
        return;
    }

    drawInvaders();
    drawBullets();
    drawPlayer();
    drawHUD();

    if (gameState === 'paused') {
        drawPaused();
    }

    if (gameState === 'gameover') {
        drawGameOver();
    }
}

function gameLoop() {
    if (gameState === 'playing') {
        const now = performance.now();
        if (now - lastInvaderBulletTime >= INVADER_BULLET_INTERVAL) {
            fireInvaderBullet();
            lastInvaderBulletTime = now;
        }
        if (isMouseDown) {
            fireBullet();
        }
        updateInvaders();
        updateBullets();
        checkCollisions();
    }

    draw();
    animationId = requestAnimationFrame(gameLoop);
}

export function onExit() {
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('focus', handleFocus);
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mouseup', handleMouseUp);
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}
