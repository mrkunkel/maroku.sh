import { createGameUI } from './game-ui.js';

export const type = 'app';
export const title = 'Tetris';
export const description = 'A classic block-stacking game';

// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const PANEL_WIDTH = 140;
const CELL_SIZE = 20;

// Tetromino definitions
const SHAPES = [
    [[1,1,1,1]],
    [[1,1],[1,1]],
    [[0,1,0],[1,1,1]],
    [[1,0,0],[1,1,1]],
    [[0,0,1],[1,1,1]],
    [[0,1,1],[1,1,0]],
    [[1,1,0],[0,1,1]]
];

const COLORS = ['#00f0f0', '#f0f000', '#a000f0', '#f0a000', '#0000f0', '#00f000', '#f00000'];

// Game state
let canvas, ctx;
let bgCanvas, bgCtx;
let board, currentX, currentY, currentShape, currentColor;
let nextShape, nextColor, nextIndex;
let score, gameOver, showPreview, paused, gameInterval, animationId;

export function execute(args, container, onExit) {
    const boardWidth = COLS * BLOCK_SIZE;
    const boardHeight = ROWS * BLOCK_SIZE;

    const { wrapper, heading, addCleanup } = createGameUI({
        title: 'TETRIS',
        width: boardWidth + PANEL_WIDTH,
        height: boardHeight,
    });

    // Background canvas for static elements
    bgCanvas = document.createElement('canvas');
    bgCanvas.width = boardWidth + PANEL_WIDTH;
    bgCanvas.height = boardHeight;
    bgCtx = bgCanvas.getContext('2d');
    drawStaticBoard();

    // Main canvas for dynamic elements
    canvas = document.createElement('canvas');
    canvas.width = boardWidth + PANEL_WIDTH;
    canvas.height = boardHeight;
    canvas.style.cssText = 'display:block;';

    wrapper.appendChild(canvas);

    container.appendChild(wrapper);

    ctx = canvas.getContext('2d');
    showPreview = true;
    window._tetrisOnExit = onExit;

    initGame();

    const keyDownHandler = (e) => handleKeyDown(e);
    document.addEventListener('keydown', keyDownHandler);

    window._tetrisCleanup = () => {
        document.removeEventListener('keydown', keyDownHandler);
        if (gameInterval) { clearInterval(gameInterval); gameInterval = null; }
        if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
        if (bgCanvas && bgCanvas.parentNode) bgCanvas.parentNode.removeChild(bgCanvas);
    };
    addCleanup(() => {
        if (window._tetrisCleanup) {
            window._tetrisCleanup();
            delete window._tetrisCleanup;
        }
    });
}

export function onExit() {
    if (window._tetrisCleanup) {
        window._tetrisCleanup();
        delete window._tetrisCleanup;
    }
    window._tetrisExitedByX = true;
}

function initGame() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0;
    gameOver = false;
    showPreview = true;
    paused = false;
    nextIndex = undefined;
    spawnPiece();
    gameLoop();
}

function spawnPiece() {
    let currentIndex;
    if (nextIndex !== undefined) {
        currentIndex = nextIndex;
        nextIndex = undefined;
    } else {
        currentIndex = Math.floor(Math.random() * SHAPES.length);
    }
    currentShape = SHAPES[currentIndex];
    currentColor = COLORS[currentIndex];

    nextIndex = Math.floor(Math.random() * SHAPES.length);
    nextShape = SHAPES[nextIndex];
    nextColor = COLORS[nextIndex];

    currentX = Math.floor((COLS - currentShape[0].length) / 2);
    currentY = 0;

    if (collides(currentShape, currentX, currentY)) {
        gameOver = true;
    }
}

function collides(shape, offsetX, offsetY) {
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const newX = offsetX + x;
                const newY = offsetY + y;
                if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
                if (newY >= 0 && board[newY][newX]) return true;
            }
        }
    }
    return false;
}

function rotate(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            rotated[x][rows - 1 - y] = shape[y][x];
        }
    }
    return rotated;
}

function merge() {
    for (let y = 0; y < currentShape.length; y++) {
        for (let x = 0; x < currentShape[y].length; x++) {
            if (currentShape[y][x]) {
                board[currentY + y][currentX + x] = currentColor;
            }
        }
    }
}

function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100;
    }
}

function drop() {
    if (!collides(currentShape, currentX, currentY + 1)) {
        currentY++;
    } else {
        merge();
        clearLines();
        spawnPiece();
    }
}

function hardDrop() {
    while (!collides(currentShape, currentX, currentY + 1)) {
        currentY++;
    }
    merge();
    clearLines();
    spawnPiece();
}

function handleKeyDown(e) {
    if (gameOver) return;

    switch (e.key.toLowerCase()) {
        case 'j':
            if (!collides(currentShape, currentX - 1, currentY)) currentX--;
            break;
        case 'l':
            if (!collides(currentShape, currentX + 1, currentY)) currentX++;
            break;
        case 'k':
            drop();
            break;
        case 'i':
            const rotated = rotate(currentShape);
            if (!collides(rotated, currentX, currentY)) {
                currentShape = rotated;
            }
            break;
        case ' ':
            hardDrop();
            break;
        case 'o':
            showPreview = !showPreview;
            break;
        case 'p':
            paused = !paused;
            break;
        case 'x':
            if (gameOver) {
                if (window._tetrisCleanup) {
                    window._tetrisCleanup();
                    delete window._tetrisCleanup;
                }
                if (window._tetrisOnExit) window._tetrisOnExit();
                window._tetrisOnExit = null;
            }
            break;
    }
}

function drawStaticBoard() {
    const boardWidth = COLS * BLOCK_SIZE;
    const boardHeight = ROWS * BLOCK_SIZE;

    // Board background
    bgCtx.fillStyle = '#111';
    bgCtx.fillRect(0, 0, boardWidth, boardHeight);

    // Grid lines
    bgCtx.strokeStyle = '#1a1a1a';
    bgCtx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
        bgCtx.beginPath();
        bgCtx.moveTo(x * BLOCK_SIZE, 0);
        bgCtx.lineTo(x * BLOCK_SIZE, boardHeight);
        bgCtx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        bgCtx.beginPath();
        bgCtx.moveTo(0, y * BLOCK_SIZE);
        bgCtx.lineTo(boardWidth, y * BLOCK_SIZE);
        bgCtx.stroke();
    }

    // Board border
    bgCtx.strokeStyle = '#444';
    bgCtx.lineWidth = 3;
    bgCtx.strokeRect(1, 1, boardWidth - 2, boardHeight - 2);

    // Panel background
    bgCtx.fillStyle = '#0a0a0a';
    bgCtx.fillRect(boardWidth, 0, PANEL_WIDTH, boardHeight);

    // Panel border
    bgCtx.strokeStyle = '#444';
    bgCtx.lineWidth = 3;
    bgCtx.beginPath();
    bgCtx.moveTo(boardWidth, 0);
    bgCtx.lineTo(boardWidth, boardHeight);
    bgCtx.stroke();

    // Title
    bgCtx.fillStyle = '#fff';
    bgCtx.font = 'bold 18px monospace';
    bgCtx.textAlign = 'center';
    bgCtx.fillText('TETRIS', boardWidth + PANEL_WIDTH / 2, 30);

    // Score label
    bgCtx.font = '14px monospace';
    bgCtx.fillStyle = '#aaa';
    bgCtx.fillText('SCORE', boardWidth + PANEL_WIDTH / 2, 70);

    // Next piece label
    bgCtx.fillText('NEXT', boardWidth + PANEL_WIDTH / 2, 160);

    // Controls
    bgCtx.font = '11px monospace';
    bgCtx.fillStyle = '#666';
    bgCtx.textAlign = 'left';
    const controls = [
        'J = left',
        'L = right',
        'I = rotate',
        'K = down',
        'Space = drop',
        'P = pause',
        'O = preview'
    ];
    controls.forEach((text, i) => {
        bgCtx.fillText(text, boardWidth + 10, 300 + i * 20);
    });

    bgCtx.textAlign = 'left';
}

function drawDynamicBoard() {
    const boardWidth = COLS * BLOCK_SIZE;

    // Clear main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background canvas first
    ctx.drawImage(bgCanvas, 0, 0);

    // Draw placed blocks
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                ctx.fillStyle = board[y][x];
                ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, 4);
                ctx.fillStyle = board[y][x];
            }
        }
    }

    // Draw ghost piece
    if (currentShape && !gameOver) {
        let ghostY = currentY;
        while (!collides(currentShape, currentX, ghostY + 1)) {
            ghostY++;
        }
        if (ghostY !== currentY) {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = currentColor;
            for (let y = 0; y < currentShape.length; y++) {
                for (let x = 0; x < currentShape[y].length; x++) {
                    if (currentShape[y][x]) {
                        ctx.fillRect((currentX + x) * BLOCK_SIZE + 1, (ghostY + y) * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
                    }
                }
            }
            ctx.globalAlpha = 1;
        }
    }

    // Draw current piece
    if (currentShape && !gameOver) {
        ctx.fillStyle = currentColor;
        for (let y = 0; y < currentShape.length; y++) {
            for (let x = 0; x < currentShape[y].length; x++) {
                if (currentShape[y][x]) {
                    ctx.fillRect((currentX + x) * BLOCK_SIZE + 1, (currentY + y) * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.fillRect((currentX + x) * BLOCK_SIZE + 1, (currentY + y) * BLOCK_SIZE + 1, BLOCK_SIZE - 2, 4);
                    ctx.fillStyle = currentColor;
                }
            }
        }
    }

    // Draw score on main canvas
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(score.toString(), COLS * BLOCK_SIZE + PANEL_WIDTH / 2, 100);

    // Draw next piece preview
    if (showPreview) {
        const pieceX = COLS * BLOCK_SIZE + PANEL_WIDTH / 2 - (nextShape[0].length * CELL_SIZE) / 2;
        const pieceY = 180;

        for (let y = 0; y < nextShape.length; y++) {
            for (let x = 0; x < nextShape[y].length; x++) {
                if (nextShape[y][x]) {
                    ctx.fillStyle = nextColor;
                    ctx.fillRect(pieceX + x * CELL_SIZE, pieceY + y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
                }
            }
        }

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(pieceX - 2, pieceY - 2, nextShape[0].length * CELL_SIZE + 4, nextShape.length * CELL_SIZE + 4);
    }

    // Draw pause overlay
    if (paused && !gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', COLS * BLOCK_SIZE / 2, ROWS * BLOCK_SIZE / 2);
    }

    // Draw game over overlay
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', COLS * BLOCK_SIZE / 2, ROWS * BLOCK_SIZE / 2 - 20);
        ctx.font = '20px monospace';
        ctx.fillText(`Score: ${score}`, COLS * BLOCK_SIZE / 2, ROWS * BLOCK_SIZE / 2 + 20);
        ctx.font = '14px monospace';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Press X to quit', COLS * BLOCK_SIZE / 2, ROWS * BLOCK_SIZE / 2 + 55);
    }
}

function gameLoop() {
    drawDynamicBoard();

    if (gameOver) return;

    if (!gameInterval) {
        gameInterval = setInterval(() => {
            if (!gameOver && !paused) drop();
        }, 500);
    }

    animationId = requestAnimationFrame(gameLoop);
}
