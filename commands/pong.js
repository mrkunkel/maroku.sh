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

function startGameLoop() {
    // Will be filled in by subsequent tasks
}
