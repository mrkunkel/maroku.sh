import { createGameUI } from './game-ui.js';

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
const COLOR_COURT = '#000';
const COLOR_PLAYER = '#00FF00';
const COLOR_AI = '#FF0000';
const COLOR_BALL = '#FFF';
const COLOR_INSTRUCTIONS = '#aaa';

// Game state
let canvas, ctx;
let scoreDisplay;
let removeCleanupFn;
let animationId = null;
let isPaused = false;
let playerY, aiY, ballX, ballY, ballVX, ballVY, ballSpeed;
let playerScore, aiScore;

export function execute(args, container, onExit) {

    const { wrapper, heading, addCleanup, removeCleanup } = createGameUI({
        title: 'PONG',
        width: COURT_WIDTH,
        height: COURT_HEIGHT,
    });
    removeCleanupFn = removeCleanup;

    // Rebuild wrapper: heading + score + canvas
    wrapper.innerHTML = '';
    wrapper.style.fontFamily = 'sans-serif';

    // Score display above canvas
    scoreDisplay = document.createElement('div');
    scoreDisplay.style.cssText = 'color:#FFF;font-size:32px;font-weight:bold;margin:0 0 10px 0;letter-spacing:20px;';
    scoreDisplay.textContent = '0 - 0';
    wrapper.appendChild(scoreDisplay);

    // Canvas
    canvas = document.createElement('canvas');
    canvas.width = COURT_WIDTH;
    canvas.height = COURT_HEIGHT;
    canvas.style.cssText = 'background:' + COLOR_COURT + ';border:4px solid ' + '#FFF' + ';box-shadow:0 0 20px rgba(255,255,255,0.15);display:block;';

    // Canvas wrapper (for cursor hiding)
    const canvasWrapper = document.createElement('div');
    canvasWrapper.style.cssText = 'position:relative;';
    canvasWrapper.appendChild(canvas);
    wrapper.appendChild(heading);
    wrapper.appendChild(scoreDisplay);
    wrapper.appendChild(canvasWrapper);

    // Hide cursor over canvas
    const mouseEnter = () => { canvas.style.cursor = 'none'; };
    const mouseLeave = () => { canvas.style.cursor = ''; };
    canvas.addEventListener('mouseenter', mouseEnter);
    canvas.addEventListener('mouseleave', mouseLeave);
    addCleanup(() => {
        canvas.removeEventListener('mouseenter', mouseEnter);
        canvas.removeEventListener('mouseleave', mouseLeave);
    });

    // Mouse wheel control
    const wheelHandler = (e) => {
        if (isPaused) return;
        e.preventDefault();
        playerY += e.deltaY * 0.15;
        if (playerY < 0) playerY = 0;
        if (playerY + PADDLE_HEIGHT > COURT_HEIGHT) playerY = COURT_HEIGHT - PADDLE_HEIGHT;
    };
    window.addEventListener('wheel', wheelHandler, { passive: false });
    addCleanup(() => window.removeEventListener('wheel', wheelHandler));

    // Auto-pause on blur, resume on focus
    const blurHandler = () => {
        isPaused = true;
        heading.textContent = 'PAUSED';
    };
    const focusHandler = () => {
        isPaused = false;
        heading.textContent = 'PONG';
    };
    window.addEventListener('blur', blurHandler);
    window.addEventListener('focus', focusHandler);
    addCleanup(() => {
        window.removeEventListener('blur', blurHandler);
        window.removeEventListener('focus', focusHandler);
    });

    // Instructions
    const instructions = document.createElement('p');
    instructions.style.cssText = 'color:' + COLOR_INSTRUCTIONS + ';font-size:14px;margin:10px 0 0 0;';
    instructions.innerHTML = 'Use <b>Mouse Wheel</b> to move your paddle';
    wrapper.appendChild(instructions);

    container.appendChild(wrapper);

    ctx = canvas.getContext('2d');

    initGame();
    startGameLoop();
}

function initGame() {
    playerY = (COURT_HEIGHT - PADDLE_HEIGHT) / 2;
    aiY = (COURT_HEIGHT - PADDLE_HEIGHT) / 2;
    ballX = COURT_WIDTH / 2;
    ballY = COURT_HEIGHT / 2;
    ballSpeed = BASE_SPEED;
    ballVX = BASE_SPEED / Math.SQRT2;
    ballVY = BASE_SPEED / Math.SQRT2;
    playerScore = 0;
    aiScore = 0;
    isPaused = false;
    scoreDisplay.textContent = '0 - 0';
}

function update() {
    if (isPaused) return;

    ballX += ballVX;
    ballY += ballVY;

    if (ballVX < 0 && ballX - BALL_RADIUS <= PADDLE_WIDTH &&
        ballX + BALL_RADIUS >= 0 &&
        ballY >= playerY && ballY <= playerY + PADDLE_HEIGHT) {
        handlePaddleHit(1, playerY);
    }

    if (ballVX > 0 && ballX + BALL_RADIUS >= COURT_WIDTH - PADDLE_WIDTH &&
        ballX - BALL_RADIUS <= COURT_WIDTH &&
        ballY >= aiY && ballY <= aiY + PADDLE_HEIGHT) {
        handlePaddleHit(-1, aiY);
    }

    const aiCenter = aiY + PADDLE_HEIGHT / 2;
    const diff = ballY - aiCenter;

    if (Math.abs(diff) > AI_DEAD_ZONE) {
        const move = Math.sign(diff) * Math.min(PADDLE_SPEED, Math.abs(diff));
        aiY += move;
        if (aiY < 0) aiY = 0;
        if (aiY + PADDLE_HEIGHT > COURT_HEIGHT) aiY = COURT_HEIGHT - PADDLE_HEIGHT;
    }

    if (ballX + BALL_RADIUS < 0) {
        aiScore++;
        scoreDisplay.textContent = playerScore + ' - ' + aiScore;
        resetBall(-1);
    } else if (ballX - BALL_RADIUS > COURT_WIDTH) {
        playerScore++;
        scoreDisplay.textContent = playerScore + ' - ' + aiScore;
        resetBall(1);
    }

    if (ballY - BALL_RADIUS <= 0) {
        ballY = BALL_RADIUS;
        ballVY = -ballVY;
    }

    if (ballY + BALL_RADIUS >= COURT_HEIGHT) {
        ballY = COURT_HEIGHT - BALL_RADIUS;
        ballVY = -ballVY;
    }
}

function handlePaddleHit(direction, paddleY) {
    const relativeY = ((paddleY + PADDLE_HEIGHT / 2) - ballY) / (PADDLE_HEIGHT / 2);
    const clampedY = Math.max(-1, Math.min(1, relativeY));
    const angle = clampedY * (Math.PI / 4);
    ballVX = direction * ballSpeed * Math.cos(angle);
    ballVY = -ballSpeed * Math.sin(angle);
    ballSpeed += BALL_SPEED_INCREMENT;
}

function resetBall(serveDirection) {
    ballX = COURT_WIDTH / 2;
    ballY = COURT_HEIGHT / 2;
    ballSpeed = BASE_SPEED;
    ballVX = serveDirection * BASE_SPEED / Math.SQRT2;
    const vySign = ballVY >= 0 ? 1 : -1;
    ballVY = vySign * BASE_SPEED / Math.SQRT2;
}

function draw() {
    ctx.fillStyle = COLOR_COURT;
    ctx.fillRect(0, 0, COURT_WIDTH, COURT_HEIGHT);

    ctx.fillStyle = COLOR_PLAYER;
    ctx.fillRect(0, playerY, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.fillStyle = COLOR_AI;
    ctx.fillRect(COURT_WIDTH - PADDLE_WIDTH, aiY, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.fillStyle = COLOR_BALL;
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
}

function startGameLoop() {
    function loop() {
        update();
        draw();
        animationId = requestAnimationFrame(loop);
    }
    loop();
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
