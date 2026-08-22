import { createGameUI } from './game-ui.js';

export const type = 'app';
export const title = 'Connect 4';
export const description = 'Two-player Connect 4 game';

const ROWS = 6;
const COLS = 7;
const STATUS_HEIGHT = 60;
let CELL_SIZE, BOARD_PADDING, CANVAS_WIDTH, CANVAS_HEIGHT;

const COLOR_BOARD = '#0044AA';
const COLOR_BOARD_DOT = '#000';
const COLOR_YELLOW = '#FFD700';
const COLOR_RED = '#FF2222';
const COLOR_WHITE = '#FFF';
const COLOR_HOVER = 'rgba(255,255,255,0.15)';

const EMPTY = 0;
const YELLOW = 1;
const RED = 2;

let canvas, ctx;
let removeCleanupFn;
let animationId = null;
let board = [];
let currentPlayer = YELLOW;
let gameOver = false;
let winner = 0;
let hoverCol = -1;
let dropAnim = null;
let winLine = null;

export function execute(args, container, onExit) {
    const isMobile = !window.matchMedia('(hover: hover)').matches;
    const { wrapper, heading, addCleanup, removeCleanup, hideHeading, getAvailableSize } = createGameUI({
        title: 'CONNECT 4',
        width: 700,
        height: 600,
    });
    removeCleanupFn = removeCleanup;

    // heading always shown

    container.appendChild(wrapper);

    const avail = getAvailableSize(container);
    const margin = 40;
    CELL_SIZE = Math.min(
        Math.floor((avail.width - margin * 2) / (COLS + 1)),
        Math.floor((avail.height - margin * 2 - STATUS_HEIGHT) / (ROWS + 1))
    );
    BOARD_PADDING = Math.round(CELL_SIZE * 0.5);
    CANVAS_WIDTH = COLS * CELL_SIZE + BOARD_PADDING * 2;
    CANVAS_HEIGHT = ROWS * CELL_SIZE + BOARD_PADDING * 2 + STATUS_HEIGHT;

    canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.cssText = 'background:' + COLOR_BOARD + ';border:4px solid #FFF;box-shadow:0 0 20px rgba(255,255,255,0.15);display:block;cursor:pointer;width:' + CANVAS_WIDTH + 'px;height:' + CANVAS_HEIGHT + 'px;box-sizing:border-box;';
    wrapper.appendChild(canvas);

    ctx = canvas.getContext('2d');

    initGame();

    const clickHandler = (e) => handleClick(e);
    canvas.addEventListener('click', clickHandler);

    if (window.matchMedia('(hover: hover)').matches) {
        const mouseMoveHandler = (e) => handleMouseMove(e);
        canvas.addEventListener('mousemove', mouseMoveHandler);
        addCleanup(() => {
            canvas.removeEventListener('mousemove', mouseMoveHandler);
        });
    }

    addCleanup(() => {
        canvas.removeEventListener('click', clickHandler);
    });

    gameLoop();
}

function initGame() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
    currentPlayer = YELLOW;
    gameOver = false;
    winner = 0;
    hoverCol = -1;
    dropAnim = null;
    winLine = null;
    draw();
}

function handleMouseMove(e) {
    if (gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const col = Math.floor((x - BOARD_PADDING) / CELL_SIZE);
    if (col >= 0 && col < COLS) {
        hoverCol = col;
    } else {
        hoverCol = -1;
    }
    draw();
}

function handleClick(e) {
    if (gameOver) {
        initGame();
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const col = Math.floor((x - BOARD_PADDING) / CELL_SIZE);
    if (col < 0 || col >= COLS) return;
    dropPiece(col);
}

function getEmptyRow(col) {
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === EMPTY) return r;
    }
    return -1;
}

function dropPiece(col) {
    const row = getEmptyRow(col);
    if (row === -1) return;

    board[row][col] = currentPlayer;
    dropAnim = {
        row: row,
        col: col,
        color: currentPlayer,
        startY: BOARD_PADDING - CELL_SIZE,
        targetY: BOARD_PADDING + row * CELL_SIZE + CELL_SIZE / 2,
        progress: 0,
    };

    if (checkWin(row, col, currentPlayer)) {
        gameOver = true;
        winner = currentPlayer;
    } else if (checkDraw()) {
        gameOver = true;
    } else {
        currentPlayer = currentPlayer === YELLOW ? RED : YELLOW;
    }
}

function checkWin(row, col, player) {
    const directions = [
        [0, 1],   // horizontal
        [1, 0],   // vertical
        [1, 1],   // diagonal down-right
        [1, -1],  // diagonal down-left
    ];

    for (const [dr, dc] of directions) {
        let count = 1;
        let line = [{ r: row, c: col }];

        for (let dir = -1; dir <= 1; dir += 2) {
            for (let i = 1; i < 4; i++) {
                const nr = row + dr * i * dir;
                const nc = col + dc * i * dir;
                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
                if (board[nr][nc] !== player) break;
                count++;
                line.push({ r: nr, c: nc });
            }
        }

        if (count >= 4) {
            winLine = line;
            return true;
        }
    }
    return false;
}

function checkDraw() {
    for (let c = 0; c < COLS; c++) {
        if (board[0][c] === EMPTY) return false;
    }
    return true;
}

function draw() {
    ctx.fillStyle = COLOR_BOARD;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw board dots (empty slots only)
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] !== EMPTY) continue;
            if (dropAnim && dropAnim.row === r && dropAnim.col === c) continue;
            const cx = BOARD_PADDING + c * CELL_SIZE + CELL_SIZE / 2;
            const cy = BOARD_PADDING + r * CELL_SIZE + CELL_SIZE / 2;
            ctx.fillStyle = COLOR_BOARD_DOT;
            ctx.beginPath();
            ctx.arc(cx, cy, CELL_SIZE * 0.38, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw hover preview
    if (!gameOver && hoverCol >= 0) {
        const row = getEmptyRow(hoverCol);
        if (row >= 0 && board[row][hoverCol] === EMPTY) {
            const cx = BOARD_PADDING + hoverCol * CELL_SIZE + CELL_SIZE / 2;
            const cy = BOARD_PADDING + row * CELL_SIZE + CELL_SIZE / 2;
            ctx.fillStyle = currentPlayer === YELLOW ? 'rgba(255,215,0,0.35)' : 'rgba(255,34,34,0.35)';
            ctx.beginPath();
            ctx.arc(cx, cy, CELL_SIZE * 0.38, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw animated drop
    if (dropAnim) {
        dropAnim.progress += 0.15;
        const t = easeOutBounce(Math.min(dropAnim.progress, 1));
        const cy = dropAnim.startY + (dropAnim.targetY - dropAnim.startY) * t;
        const cx = BOARD_PADDING + dropAnim.col * CELL_SIZE + CELL_SIZE / 2;
        const radius = CELL_SIZE * 0.38;

        ctx.fillStyle = dropAnim.color === YELLOW ? COLOR_YELLOW : COLOR_RED;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Shine effect
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(cx - radius * 0.25, cy - radius * 0.25, radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        if (dropAnim.progress >= 1) {
            dropAnim = null;
        }
    }

    // Draw pieces
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (dropAnim && dropAnim.row === r && dropAnim.col === c) continue;
            if (board[r][c] === EMPTY) continue;
            const cx = BOARD_PADDING + c * CELL_SIZE + CELL_SIZE / 2;
            const cy = BOARD_PADDING + r * CELL_SIZE + CELL_SIZE / 2;
            const radius = CELL_SIZE * 0.38;
            const isWinPiece = winLine && winLine.some(p => p.r === r && p.c === c);

            if (isWinPiece) {
                ctx.shadowColor = '#FFF';
                ctx.shadowBlur = 15;
            }

            ctx.fillStyle = board[r][c] === YELLOW ? COLOR_YELLOW : COLOR_RED;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            // Shine effect
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(cx - radius * 0.25, cy - radius * 0.25, radius * 0.35, 0, Math.PI * 2);
            ctx.fill();

            // Win piece border
            if (isWinPiece) {
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    // Draw status text
    ctx.fillStyle = COLOR_WHITE;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';

    if (gameOver) {
        if (winner === YELLOW) {
            ctx.fillStyle = COLOR_YELLOW;
            ctx.fillText('YELLOW WINS!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
        } else if (winner === RED) {
            ctx.fillStyle = COLOR_RED;
            ctx.fillText('RED WINS!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
        } else {
            ctx.fillStyle = COLOR_WHITE;
            ctx.fillText('DRAW!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
        }
        ctx.font = '14px monospace';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Click to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
    } else {
        ctx.fillStyle = currentPlayer === YELLOW ? COLOR_YELLOW : COLOR_RED;
        ctx.fillText(currentPlayer === YELLOW ? "YELLOW's TURN" : "RED's TURN", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 25);
    }
}

function easeOutBounce(t) {
    if (t < 1 / 2.75) {
        return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
}

function gameLoop() {
    draw();
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
