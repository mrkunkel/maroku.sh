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
    // Will be filled in by subsequent tasks
}

function draw() {
    ctx.clearRect(0, 0, COURT_WIDTH, COURT_HEIGHT);
}

function startGameLoop() {
    function loop() {
        draw();
        animationId = requestAnimationFrame(loop);
    }
    loop();
}
