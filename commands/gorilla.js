import { createGameUI } from './game-ui.js';

export const type = 'app';
export const title = 'Gorilla';
export const description = 'Throw bananas at gorillas on city buildings';

// Canvas
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

// Physics
const GRAVITY = 0.15;
const WIND_MAX = 3;

// Player
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 30;
let PLAYER_X = 40;
let PLAYER_Y = CANVAS_HEIGHT - 10;

// Buildings
const MIN_BUILDING_WIDTH = 50;
const MAX_BUILDING_WIDTH = 120;
const MIN_BUILDING_HEIGHT = 80;
const MAX_BUILDING_HEIGHT = 200;
const FLOOR_SPACING = 30;

// Bananas
const BANANA_RADIUS = 3;
const BANANA_COLOR = '#FFFF00';

// Colors
const COLOR_BG = '#000';
const COLOR_BUILDING = '#FFF';
const COLOR_PLAYER = '#00FF00';
const COLOR_GORILLA = '#FF8800';
const COLOR_BANANA = '#FFFF00';
const COLOR_TEXT = '#FFF';
const COLOR_HUD = '#aaa';
const COLOR_TRAIL = '#FFFF00';

// Game state
let canvas, ctx;
let animationId = null;
let gameState = 'start'; // 'start', 'playing', 'gameover', 'win', 'throwing', 'gorilla-throwing'
let buildings = [];
let gorillas = [];
let craters = []; // {x, y, radius} holes blown into buildings
let lastAngle = 45;
let lastPower = 500;
let bananas = [];
let playerHP = 5;
let turn = 1;
let turnMax = 5;
let bananasUsed = 0;
let bananasThisTurn = 0;
let wind = 0;
let inputState = 'angle'; // 'angle', 'power', 'done'
let angleInput = '';
let powerInput = '';
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragEndX = 0;
let dragEndY = 0;
let currentBanana = null;
let lastMove = null;
let isMobile = false;

// Input elements (desktop)
let angleInputEl = null;
let powerInputEl = null;
let turnInfoEl = null;
let windEl = null;
let remainingEl = null;

export function execute(args, container, onExit) {
    isMobile = !window.matchMedia('(hover: hover)').matches;

    const { wrapper, heading, addCleanup, removeCleanup } = createGameUI({
        title: 'GORILLA',
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
    });

    container.appendChild(wrapper);
    canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.cssText = 'background:' + COLOR_BG + ';border:4px solid #FFF;box-shadow:0 0 20px rgba(255,255,255,0.15);display:block;';
    wrapper.appendChild(canvas);
    ctx = canvas.getContext('2d');

    if (isMobile) {
        setupMobileInput(wrapper, addCleanup);
    } else {
        setupDesktopInput(wrapper, addCleanup);
    }

    initGame();
    gameLoop();
}

function setupDesktopInput(wrapper, addCleanup) {
    const controls = document.createElement('div');
    controls.style.cssText = 'color:#FFF;font-family:monospace;font-size:14px;margin:10px 0 0 0;display:flex;flex-direction:column;gap:8px;';

    const infoLine = document.createElement('div');
    infoLine.style.cssText = 'display:flex;gap:20px;align-items:center;';

    const turnInfo = document.createElement('span');
    turnInfo.id = 'gorilla-turn-info';
    turnInfo.style.color = COLOR_TEXT;
    infoLine.appendChild(turnInfo);

    const windInfo = document.createElement('span');
    windInfo.id = 'gorilla-wind';
    windInfo.style.color = COLOR_HUD;
    infoLine.appendChild(windInfo);

    const remaining = document.createElement('span');
    remaining.id = 'gorilla-remaining';
    remaining.style.color = COLOR_HUD;
    infoLine.appendChild(remaining);

    controls.appendChild(infoLine);

    const promptDiv = document.createElement('div');
    promptDiv.style.cssText = 'display:flex;gap:10px;align-items:center;margin-left:auto;';

    const angleLabel = document.createElement('span');
    angleLabel.textContent = 'ANGLE? ';
    angleLabel.style.color = COLOR_HUD;
    promptDiv.appendChild(angleLabel);

    angleInputEl = document.createElement('input');
    angleInputEl.type = 'number';
    angleInputEl.min = '1';
    angleInputEl.max = '160';
    angleInputEl.placeholder = '1-160';
    angleInputEl.style.cssText = 'width:110px;background:#111;color:#00FF00;border:1px solid #FFF;font-family:monospace;font-size:14px;padding:2px 4px;';
    promptDiv.appendChild(angleInputEl);

    const powerLabel = document.createElement('span');
    powerLabel.textContent = 'POWER? ';
    powerLabel.style.color = COLOR_HUD;
    promptDiv.appendChild(powerLabel);

    powerInputEl = document.createElement('input');
    powerInputEl.type = 'number';
    powerInputEl.min = '10';
    powerInputEl.max = '1000';
    powerInputEl.placeholder = '10-1000';
    powerInputEl.style.cssText = 'width:130px;background:#111;color:#00FF00;border:1px solid #FFF;font-family:monospace;font-size:14px;padding:2px 4px;';
    promptDiv.appendChild(powerInputEl);

    const throwBtn = document.createElement('button');
    throwBtn.textContent = 'THROW';
    throwBtn.style.cssText = 'background:#00FF00;color:#000;border:none;border-radius:3px;font-family:monospace;font-size:14px;font-weight:bold;padding:3px 12px;cursor:pointer;';
    throwBtn.addEventListener('click', () => {
        throwFromInputs();
    });
    promptDiv.appendChild(throwBtn);

    controls.appendChild(promptDiv);
    wrapper.appendChild(controls);

    angleInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            powerInputEl.focus();
        }
    });

    powerInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            throwFromInputs();
        }
    });

    addCleanup(() => {
        throwBtn.removeEventListener('click', null);
    });
}

function throwFromInputs() {
    if (gameState !== 'playing') return;
    let angle = parseInt(angleInputEl.value);
    let power = parseInt(powerInputEl.value);
    if (isNaN(angle) || angle < 1 || angle > 160) {
        angle = lastAngle;
        angleInputEl.value = angle;
    }
    if (isNaN(power) || power < 10 || power > 1000) {
        power = lastPower;
        powerInputEl.value = power;
    }
    lastAngle = angle;
    lastPower = power;
    throwBanana(power, angle);
    angleInputEl.value = angle;
    powerInputEl.value = power;
    angleInputEl.focus();
}

function setupMobileInput(wrapper, addCleanup) {
    const infoBar = document.createElement('div');
    infoBar.style.cssText = 'color:#FFF;font-family:monospace;font-size:14px;margin:10px 0 0 0;display:flex;flex-direction:column;gap:8px;';

    const infoLine = document.createElement('div');
    infoLine.style.cssText = 'display:flex;justify-content:space-between;';

    const turnInfo = document.createElement('span');
    turnInfo.id = 'gorilla-turn-info';
    turnInfo.style.color = COLOR_TEXT;
    infoLine.appendChild(turnInfo);

    const windInfo = document.createElement('span');
    windInfo.id = 'gorilla-wind';
    windInfo.style.color = COLOR_HUD;
    infoLine.appendChild(windInfo);

    infoBar.appendChild(infoLine);

    const remainingLine = document.createElement('div');
    remainingLine.style.cssText = 'display:flex;justify-content:space-between;';

    const remaining = document.createElement('span');
    remaining.id = 'gorilla-remaining';
    remaining.style.color = COLOR_HUD;
    remainingLine.appendChild(remaining);

    const anglePower = document.createElement('span');
    anglePower.id = 'gorilla-angle-power';
    anglePower.style.color = COLOR_HUD;
    remainingLine.appendChild(anglePower);

    infoBar.appendChild(remainingLine);

    wrapper.appendChild(infoBar);

    canvas.addEventListener('mousedown', handleDragStart);
    canvas.addEventListener('mousemove', handleDragMove);
    canvas.addEventListener('mouseup', handleDragEnd);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleDragStart({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleDragMove({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });
    canvas.addEventListener('touchend', handleDragEnd);

    addCleanup(() => {
        canvas.removeEventListener('mousedown', handleDragStart);
        canvas.removeEventListener('mousemove', handleDragMove);
        canvas.removeEventListener('mouseup', handleDragEnd);
        canvas.removeEventListener('touchstart', null);
        canvas.removeEventListener('touchmove', null);
        canvas.removeEventListener('touchend', null);
    });
}

function handleDragStart(e) {
    if (gameState !== 'playing' || isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    dragStartX = (e.clientX - rect.left) * scaleX;
    dragStartY = (e.clientY - rect.top) * scaleY;
    isDragging = true;
}

function handleDragMove(e) {
    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    dragEndX = (e.clientX - rect.left) * scaleX;
    dragEndY = (e.clientY - rect.top) * scaleY;

    if (isMobile) {
        const dx = dragStartX - dragEndX;
        const dy = dragStartY - dragEndY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= 20) {
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            angle = Math.max(1, Math.min(160, Math.round(angle)));
            let power = Math.min(1000, Math.max(10, Math.round(dist * 5)));
            const el = document.getElementById('gorilla-angle-power');
            if (el) {
                el.textContent = 'Angle: ' + angle + '°  Power: ' + power;
            }
        }
    }
}

function handleDragEnd() {
    if (!isDragging) return;
    isDragging = false;

    const dx = dragStartX - dragEndX;
    const dy = dragStartY - dragEndY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 20) return;

    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = Math.max(1, Math.min(160, Math.round(angle)));
    let power = Math.min(1000, Math.max(10, Math.round(dist * 5)));

    lastAngle = angle;
    lastPower = power;

    throwBanana(power, angle);

    const el = document.getElementById('gorilla-angle-power');
    if (el) {
        el.textContent = 'Angle: ' + angle + '°  Power: ' + power;
    }
}

function initGame() {
    gameState = 'start';
    turn = 1;
    playerHP = 5;
    craters = [];
    if (!angleInputEl) {
        lastAngle = 45;
        lastPower = 500;
    }
    generateCity();
    updateHUD();
}

function generateCity() {
    buildings = [];
    gorillas = [];
    let x = 50;
    const gap = 10;

    while (x + MIN_BUILDING_WIDTH < CANVAS_WIDTH - 20) {
        const maxW = Math.min(MAX_BUILDING_WIDTH, CANVAS_WIDTH - 20 - x);
        const w = MIN_BUILDING_WIDTH + Math.random() * (maxW - MIN_BUILDING_WIDTH);
        const h = MIN_BUILDING_HEIGHT + Math.random() * (MAX_BUILDING_HEIGHT - MIN_BUILDING_HEIGHT);
        const y = CANVAS_HEIGHT - 10 - h;
        buildings.push({ x: x, y: y, w: w, h: h });
        x += w + gap;
    }

    // Player on top of first building
    PLAYER_X = buildings[0].x + buildings[0].w / 2 - PLAYER_WIDTH / 2;
    PLAYER_Y = buildings[0].y;

    // Place exactly 5 gorillas on buildings (skip first 3)
    const eligibleBuildings = buildings.slice(3);
    const shuffled = eligibleBuildings.sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, 5);

    for (const building of chosen) {
        const floors = Math.floor(building.h / FLOOR_SPACING);
        const floor = 1 + Math.floor(Math.random() * Math.max(1, floors - 1));
        const gorillaX = building.x + building.w / 2;
        const gorillaY = building.y - 12;
        gorillas.push({ x: gorillaX, y: gorillaY, alive: true, building: building, floor: floor });
    }
}

function updateHUD() {
    if (!document.getElementById('gorilla-turn-info')) return;

    const aliveCount = gorillas.filter(g => g.alive).length;
    document.getElementById('gorilla-turn-info').textContent = 'Turn: ' + turn + '/' + turnMax + '  Gorillas: ' + aliveCount + ' left';
    document.getElementById('gorilla-wind').textContent = 'Wind: ' + (wind > 0 ? '---->' : '<----') + ' ' + Math.abs(wind).toFixed(1);
    document.getElementById('gorilla-remaining').textContent = 'Bananas: ' + bananasUsed;
}

function randomizeWind() {
    wind = (Math.random() - 0.5) * 2 * WIND_MAX;
}

function throwBanana(power, angle) {
    if (gameState !== 'playing' && gameState !== 'throwing') return;

    gameState = 'throwing';
    bananasUsed++;
    bananasThisTurn++;
    updateHUD();

    const rad = (angle * Math.PI) / 180;
    const speed = power * 0.08;

    currentBanana = {
        x: PLAYER_X + PLAYER_WIDTH / 2,
        y: PLAYER_Y - PLAYER_HEIGHT,
        vx: speed * Math.cos(rad),
        vy: -speed * Math.sin(rad),
        trail: [],
        isGorilla: false
    };

    bananas.push(currentBanana);
}

function updateBananas() {
    for (let i = bananas.length - 1; i >= 0; i--) {
        const b = bananas[i];
        if (!bananas[i]) continue;
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 20) b.trail.shift();

        b.vx += wind * 0.01;
        b.vy += GRAVITY;
        b.x += b.vx;
        b.y += b.vy;

        let removed = false;

        if (b.y >= CANVAS_HEIGHT - 10) {
            bananas.splice(i, 1);
            removed = true;
            if (!b.isGorilla) {
                onBananaMiss();
            }
        }

        if (!removed && (b.x < 0 || b.x > CANVAS_WIDTH)) {
            bananas.splice(i, 1);
            removed = true;
            if (!b.isGorilla) {
                onBananaMiss();
            }
        }

        if (!removed && !b.isGorilla) {
            for (const gorilla of gorillas) {
                if (!gorilla.alive) continue;
                const dx = b.x - gorilla.x;
                const dy = b.y - gorilla.y;
                if (Math.sqrt(dx * dx + dy * dy) < 12) {
                    gorilla.alive = false;
                    bananas.splice(i, 1);
                    removed = true;
                    if (gorillas.every(g => !g.alive)) {
                        gameState = 'win';
                    } else {
                        onBananaHit();
                    }
                    break;
                }
            }
        }

        if (!removed && b.isGorilla) {
            const dx = b.x - (PLAYER_X + PLAYER_WIDTH / 2);
            const dy = b.y - (PLAYER_Y - PLAYER_HEIGHT / 2);
            if (Math.sqrt(dx * dx + dy * dy) < 15) {
                playerHP--;
                bananas.splice(i, 1);
                removed = true;
                if (playerHP <= 0) {
                    gameState = 'gameover';
                } else {
                    onPlayerHit();
                }
            }
        }

        if (!removed) {
            for (const building of buildings) {
                if (b.x >= building.x && b.x <= building.x + building.w &&
                    b.y >= building.y && b.y <= building.y + building.h) {
                    bananas.splice(i, 1);
                    removed = true;
                    craters.push({ x: b.x, y: b.y, radius: 8 + Math.random() * 4 });
                    if (!b.isGorilla) {
                        onBananaMiss();
                    }
                    break;
                }
            }
        }
    }
}

function onBananaMiss() {
    if (gorillas.every(g => !g.alive)) return;

    if (bananasThisTurn >= turnMax) {
        turn++;
        if (turn > turnMax) {
            gameState = 'gameover';
            return;
        }
        bananasThisTurn = 0;
        randomizeWind();
        updateHUD();
        gameState = 'playing';
        return;
    }

    const closestGorilla = findClosestGorilla();
    if (closestGorilla) {
        gameState = 'gorilla-throwing';
        setTimeout(() => {
            gorillaThrow(closestGorilla);
        }, 500);
    } else {
        if (bananasThisTurn >= turnMax) {
            turn++;
            if (turn > turnMax) {
                gameState = 'gameover';
                return;
            }
            bananasThisTurn = 0;
            randomizeWind();
            updateHUD();
            gameState = 'playing';
        } else {
            gameState = 'playing';
        }
    }
}

function onBananaHit() {
    if (bananasThisTurn >= turnMax) {
        turn++;
        if (turn > turnMax) {
            gameState = 'gameover';
            return;
        }
        bananasThisTurn = 0;
        randomizeWind();
        updateHUD();
        gameState = 'playing';
    } else {
        gameState = 'playing';
    }
}

function onPlayerHit() {
    updateHUD();
    if (playerHP <= 0) {
        gameState = 'gameover';
    } else {
        gameState = 'playing';
    }
}

function findClosestGorilla() {
    let closest = null;
    let minDist = Infinity;
    for (const gorilla of gorillas) {
        if (!gorilla.alive) continue;
        const dx = gorilla.x - PLAYER_X;
        const dy = gorilla.y - (PLAYER_Y - PLAYER_HEIGHT);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
            minDist = dist;
            closest = gorilla;
        }
    }
    return closest;
}

function gorillaThrow(gorilla) {
    const dx = PLAYER_X + PLAYER_WIDTH / 2 - gorilla.x;
    const dy = (PLAYER_Y - PLAYER_HEIGHT / 2) - gorilla.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const baseSpeed = dist * 0.025;
    const accuracy = 0.7;
    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * (1 - accuracy);
    const speed = baseSpeed * (0.8 + Math.random() * 0.4);

    const banana = {
        x: gorilla.x,
        y: gorilla.y,
        vx: speed * Math.cos(angle),
        vy: -speed * Math.sin(angle),
        trail: [],
        isGorilla: true
    };

    bananas.push(banana);
    currentBanana = banana;
    gameState = 'playing';
    updateHUD();
}

function draw() {
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawGround();
    drawBuildings();
    drawGorillas();
    drawPlayer();
    drawBananas();

    if (isDragging && !isMobile) {
        drawAimLine();
    }

    if (gameState === 'start') {
        drawStartScreen();
    }

    if (gameState === 'gameover') {
        drawGameOver();
    }

    if (gameState === 'win') {
        drawWinScreen();
    }
}

function drawGround() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 10);
}

function drawBuildings() {
    ctx.fillStyle = '#111';
    ctx.strokeStyle = COLOR_BUILDING;
    ctx.lineWidth = 1;

    for (const b of buildings) {
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        // Draw floors
        ctx.beginPath();
        for (let floor = 1; floor < b.h / FLOOR_SPACING; floor++) {
            const y = b.y + floor * FLOOR_SPACING;
            ctx.moveTo(b.x, y);
            ctx.lineTo(b.x + b.w, y);
        }
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.strokeStyle = COLOR_BUILDING;
        ctx.lineWidth = 1;

        // Draw craters (holes blown out) on top
        for (const crater of craters) {
            if (crater.x >= b.x - crater.radius && crater.x <= b.x + b.w + crater.radius &&
                crater.y >= b.y - crater.radius && crater.y <= b.y + b.h + crater.radius) {
                ctx.fillStyle = COLOR_BG;
                ctx.beginPath();
                ctx.arc(crater.x, crater.y, crater.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

function drawPlayer() {
    ctx.fillStyle = COLOR_PLAYER;
    // Body
    ctx.fillRect(PLAYER_X + 5, PLAYER_Y - 20, 10, 15);
    // Head
    ctx.beginPath();
    ctx.arc(PLAYER_X + 10, PLAYER_Y - 25, 5, 0, Math.PI * 2);
    ctx.fill();
    // Legs
    ctx.fillRect(PLAYER_X + 5, PLAYER_Y - 5, 4, 5);
    ctx.fillRect(PLAYER_X + 11, PLAYER_Y - 5, 4, 5);
}

function drawGorillas() {
    for (const g of gorillas) {
        if (!g.alive) continue;

        ctx.fillStyle = COLOR_GORILLA;

        // Body
        ctx.fillRect(g.x - 6, g.y - 4, 12, 10);
        // Head
        ctx.beginPath();
        ctx.arc(g.x, g.y - 8, 5, 0, Math.PI * 2);
        ctx.fill();
        // Arms
        ctx.fillRect(g.x - 10, g.y - 2, 4, 6);
        ctx.fillRect(g.x + 6, g.y - 2, 4, 6);
    }
}

function drawBananas() {
    for (const b of bananas) {
        // Trail
        ctx.strokeStyle = COLOR_TRAIL;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        for (let i = 1; i < b.trail.length; i++) {
            const t = b.trail[i];
            const prev = b.trail[i - 1];
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(t.x, t.y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Banana
        ctx.fillStyle = b.isGorilla ? '#FF4444' : COLOR_BANANA;
        ctx.beginPath();
        ctx.arc(b.x, b.y, BANANA_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawAimLine() {
    const dx = dragStartX - dragEndX;
    const dy = dragStartY - dragEndY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 20) return;

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const power = Math.min(1000, Math.max(10, Math.round(dist * 5)));

    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(PLAYER_X + PLAYER_WIDTH / 2, PLAYER_Y - PLAYER_HEIGHT);
    ctx.lineTo(PLAYER_X + PLAYER_WIDTH / 2 + dx, PLAYER_Y - PLAYER_HEIGHT + dy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Show angle and power
    ctx.fillStyle = '#00FF00';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Angle: ' + Math.round(angle) + '°', PLAYER_X + PLAYER_WIDTH / 2 + 10, PLAYER_Y - PLAYER_HEIGHT - 10);
    ctx.fillText('Power: ' + power, PLAYER_X + PLAYER_WIDTH / 2 + 10, PLAYER_Y - PLAYER_HEIGHT + 5);
}

function drawStartScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = COLOR_TEXT;
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GORILLA', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

    ctx.font = '16px monospace';
    ctx.fillText('Throw bananas at gorillas on buildings', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    ctx.fillText('Use wind and gravity to hit your target', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);

    ctx.font = '14px monospace';
    ctx.fillStyle = COLOR_HUD;
    ctx.fillText('Desktop: Type angle (1-160°) and power (10-1000)', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    ctx.fillText('Mobile: Click and drag from player to aim', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 75);

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = COLOR_TEXT;
    ctx.fillText('Click to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);

    if (isMobile) {
        canvas.addEventListener('click', startGameClick, { once: true });
    } else {
        canvas.addEventListener('click', startGameClick, { once: true });
    }
}

function startGameClick() {
    if (gameState !== 'start') return;
    gameState = 'playing';
    turn = 1;
    bananasUsed = 0;
    bananasThisTurn = 0;
    playerHP = 5;
    randomizeWind();
    updateHUD();
    if (angleInputEl) {
        angleInputEl.value = lastAngle;
        powerInputEl.value = lastPower;
    }
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.fillStyle = COLOR_TEXT;
    ctx.font = '18px monospace';
    ctx.fillText('You were hit by a gorilla!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    ctx.font = '16px monospace';
    ctx.fillStyle = COLOR_HUD;
    ctx.fillText('Bananas used: ' + bananasUsed, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    ctx.fillText('Click to Play Again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 75);

    canvas.addEventListener('click', restartGame, { once: true });
}

function drawWinScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.fillStyle = COLOR_TEXT;
    ctx.font = '18px monospace';
    ctx.fillText('All gorillas eliminated!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    ctx.font = '16px monospace';
    ctx.fillStyle = COLOR_HUD;
    ctx.fillText('Bananas used: ' + bananasUsed, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    ctx.fillText('Click to Play Again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 75);

    canvas.addEventListener('click', restartGame, { once: true });
}

function restartGame() {
    bananas = [];
    craters = [];
    playerHP = 5;
    turn = 1;
    bananasUsed = 0;
    bananasThisTurn = 0;
    generateCity();
    randomizeWind();
    updateHUD();
    gameState = 'playing';
    if (angleInputEl) {
        angleInputEl.value = lastAngle;
        powerInputEl.value = lastPower;
    }
}

function gameLoop() {
    if (gameState === 'playing' || gameState === 'throwing' || gameState === 'gorilla-throwing') {
        updateBananas();
    }

    draw();
    animationId = requestAnimationFrame(gameLoop);
}

export function onExit() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}
