export const type = 'app';
export const title = 'Pong';
export const description = 'A classic Pong game';

// Game constants
const COURT_WIDTH = 800;
const COURT_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_RADIUS = 10;
const BASE_SPEED = 5;
const PADDLE_SPEED = 3.5;
const BALL_SPEED_INCREMENT = 0.2;
const AI_DEAD_ZONE = 10;

// Colors
const COLOR_BG = '#222';
const COLOR_COURT = '#000';
const COLOR_BORDER = '#FFF';
const COLOR_PLAYER = '#00FF00';
const COLOR_AI = '#FF0000';
const COLOR_BALL = '#FFF';
const COLOR_TEXT = '#FFF';
const COLOR_INSTRUCTIONS = '#aaa';

// Game state
let canvas, ctx;
let animationId = null;
let isPaused = false;
let playerY, aiY, ballX, ballY, ballVX, ballVY, ballSpeed;
let playerScore, aiScore;
let onExitCallback = null;

export function execute(container, onExit) {
    onExitCallback = onExit;

    // Page background
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:' + COLOR_BG + ';display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;font-family:sans-serif;';

    // Heading
    const heading = document.createElement('h1');
    heading.id = 'pong-heading';
    heading.style.cssText = 'color:' + COLOR_TEXT + ';font-size:32px;margin:0 0 10px 0;';
    heading.textContent = 'PONG';
    container.appendChild(heading);

    // Canvas wrapper (for cursor hiding)
    const canvasWrapper = document.createElement('div');
    canvasWrapper.style.cssText = 'position:relative;';

    // Canvas
    canvas = document.createElement('canvas');
    canvas.width = COURT_WIDTH;
    canvas.height = COURT_HEIGHT;
    canvas.style.cssText = 'background:' + COLOR_COURT + ';border:4px solid ' + COLOR_BORDER + ';box-shadow:0 0 20px rgba(255,255,255,0.15);display:block;';
    canvasWrapper.appendChild(canvas);

    // Hide cursor over canvas
    canvas.addEventListener('mouseenter', () => { canvas.style.cursor = 'none'; });
    canvas.addEventListener('mouseleave', () => { canvas.style.cursor = ''; });

    container.appendChild(canvasWrapper);

    // Mouse wheel control — listen on window, not just canvas
    window.addEventListener('wheel', (e) => {
        if (isPaused) return;
        e.preventDefault();
        playerY += e.deltaY * 0.15;
        // Clamp to court
        if (playerY < 0) playerY = 0;
        if (playerY + PADDLE_HEIGHT > COURT_HEIGHT) playerY = COURT_HEIGHT - PADDLE_HEIGHT;
    }, { passive: false });

    // Instructions
    const instructions = document.createElement('p');
    instructions.style.cssText = 'color:' + COLOR_INSTRUCTIONS + ';font-size:14px;margin:10px 0 0 0;';
    instructions.innerHTML = 'Use <b>Mouse Wheel</b> to move your paddle';
    container.appendChild(instructions);

    ctx = canvas.getContext('2d');

    initGame();
    startGameLoop();
}

export function onExit() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (onExitCallback) onExitCallback();
}

function initGame() {
    // Paddles vertically centered
    playerY = (COURT_HEIGHT - PADDLE_HEIGHT) / 2;
    aiY = (COURT_HEIGHT - PADDLE_HEIGHT) / 2;

    // Ball centered, moving bottom-right at 45 degrees
    ballX = COURT_WIDTH / 2;
    ballY = COURT_HEIGHT / 2;
    ballSpeed = BASE_SPEED;
    ballVX = BASE_SPEED / Math.SQRT2;  // ~3.536
    ballVY = BASE_SPEED / Math.SQRT2;  // ~3.536

    // Scores
    playerScore = 0;
    aiScore = 0;

    // Not paused
    isPaused = false;
    document.getElementById('pong-heading').textContent = 'PONG';
}

function draw() {
    // Clear court
    ctx.fillStyle = COLOR_COURT;
    ctx.fillRect(0, 0, COURT_WIDTH, COURT_HEIGHT);

    // Player paddle (left, green)
    ctx.fillStyle = COLOR_PLAYER;
    ctx.fillRect(0, playerY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // AI paddle (right, red)
    ctx.fillStyle = COLOR_AI;
    ctx.fillRect(COURT_WIDTH - PADDLE_WIDTH, aiY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Ball (white circle)
    ctx.fillStyle = COLOR_BALL;
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Player score
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = '35px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(playerScore.toString(), COURT_WIDTH / 4, COURT_HEIGHT / 5);

    // AI score
    ctx.fillText(aiScore.toString(), COURT_WIDTH * 3 / 4, COURT_HEIGHT / 5);
}

function startGameLoop() {
    function loop() {
        draw();
        animationId = requestAnimationFrame(loop);
    }
    loop();
}
