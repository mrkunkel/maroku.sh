import { createGameUI } from './game-ui.js';

export const type = 'app';
export const title = 'Tic Tac Toe';
export const description = 'A classic two-player tic-tac-toe game';

const GRID_SIZE = 3;
const CELL_PADDING = 20;
const X_COLOR = '#00FF00';
const O_COLOR = '#FF0000';
const LINE_COLOR = '#FFF';
const MARK_SIZE = 0.6;

let canvas, ctx;
let animationId = null;
let board = [];
let currentPlayer = 'X';
let gameOver = false;
let winner = null;
let cellSize;
let gridX, gridY;
let lastMove = null;
let hoverCell = null;

export function execute(args, container, onExit) {
    const isMobile = !window.matchMedia('(hover: hover)').matches;
    const { wrapper, heading, addCleanup, hideHeading, getAvailableSize } = createGameUI({
        title: 'TIC TAC TOE',
        width: 450,
        height: 450,
    });

    if (isMobile) {
        hideHeading();
    }

    container.appendChild(wrapper);
    const avail = getAvailableSize(container);
    const turnIndicatorHeight = 40;
    const canvasSize = Math.min(avail.width - 20, avail.height - 20 - turnIndicatorHeight);

    canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.style.cssText = 'background:#000;border:4px solid #FFF;box-shadow:0 0 20px rgba(255,255,255,0.15);display:block;cursor:pointer;width:' + canvasSize + 'px;height:' + canvasSize + 'px;';
    wrapper.appendChild(canvas);

    // Turn indicator
    const turnIndicator = document.createElement('div');
    turnIndicator.id = 'ttt-turn';
    turnIndicator.style.cssText = 'color:#00FF00;font-size:20px;font-weight:bold;margin:10px 0 0 0;font-family:monospace;';
    turnIndicator.textContent = "X's turn";
    wrapper.appendChild(turnIndicator);

    ctx = canvas.getContext('2d');
    cellSize = (canvasSize - CELL_PADDING * 2) / GRID_SIZE;
    gridX = CELL_PADDING;
    gridY = CELL_PADDING;

    initGame();

    const clickHandler = (e) => handleClick(e);
    const mouseMoveHandler = (e) => handleMouseMove(e);
    canvas.addEventListener('click', clickHandler);
    canvas.addEventListener('mousemove', mouseMoveHandler);
    addCleanup(() => {
        canvas.removeEventListener('click', clickHandler);
        canvas.removeEventListener('mousemove', mouseMoveHandler);
    });
}

function initGame() {
    board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    currentPlayer = 'X';
    gameOver = false;
    winner = null;
    lastMove = null;
    hoverCell = null;
    updateTurnIndicator();
    draw();
}

function handleMouseMove(e) {
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const col = Math.floor((x - gridX) / cellSize);
    const row = Math.floor((y - gridY) / cellSize);

    if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE && !board[row][col]) {
        hoverCell = { row, col };
    } else {
        hoverCell = null;
    }

    draw();
}

function handleClick(e) {
    if (gameOver) {
        initGame();
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const col = Math.floor((x - gridX) / cellSize);
    const row = Math.floor((y - gridY) / cellSize);

    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return;
    if (board[row][col]) return;

    board[row][col] = currentPlayer;
    lastMove = { row, col };
    hoverCell = null;
    draw();

    const result = checkWin();
    if (result) {
        gameOver = true;
        winner = result;
        draw();
    } else if (board.every(row => row.every(cell => cell))) {
        gameOver = true;
        draw();
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateTurnIndicator();
    }
}

function updateTurnIndicator() {
    const indicator = document.getElementById('ttt-turn');
    if (indicator) {
        const color = currentPlayer === 'X' ? X_COLOR : O_COLOR;
        indicator.style.color = color;
        indicator.textContent = currentPlayer + "'s turn";
    }
}

function checkWin() {
    const lines = [
        // Rows
        [[0,0],[0,1],[0,2]],
        [[1,0],[1,1],[1,2]],
        [[2,0],[2,1],[2,2]],
        // Columns
        [[0,0],[1,0],[2,0]],
        [[0,1],[1,1],[2,1]],
        [[0,2],[1,2],[2,2]],
        // Diagonals
        [[0,0],[1,1],[2,2]],
        [[0,2],[1,1],[2,0]],
    ];

    for (const line of lines) {
        const [a, b, c] = line;
        if (board[a[0]][a[1]] &&
            board[a[0]][a[1]] === board[b[0]][b[1]] &&
            board[a[0]][a[1]] === board[c[0]][c[1]]) {
            return { winner: board[a[0]][a[1]], line };
        }
    }
    return null;
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawMarks();

    if (winner) {
        if (winner.winner === 'X') {
            drawWinLine(winner.line, X_COLOR);
        } else {
            drawWinLine(winner.line, O_COLOR);
        }
    }

    if (gameOver) {
        drawGameOver();
    }
}

function drawGrid() {
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = 2;

    for (let i = 1; i < GRID_SIZE; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(gridX + i * cellSize, gridY);
        ctx.lineTo(gridX + i * cellSize, gridY + GRID_SIZE * cellSize);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(gridX, gridY + i * cellSize);
        ctx.lineTo(gridX + GRID_SIZE * cellSize, gridY + i * cellSize);
        ctx.stroke();
    }
}

function drawMarks() {
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (board[row][col]) {
                const cx = gridX + col * cellSize + cellSize / 2;
                const cy = gridY + row * cellSize + cellSize / 2;
                const size = cellSize * MARK_SIZE / 2;

                if (lastMove && lastMove.row === row && lastMove.col === col) {
                    ctx.shadowColor = board[row][col] === 'X' ? X_COLOR : O_COLOR;
                    ctx.shadowBlur = 15;
                }

                if (board[row][col] === 'X') {
                    drawX(cx, cy, size);
                } else {
                    drawO(cx, cy, size);
                }

                ctx.shadowBlur = 0;
            }
        }
    }

    // Draw ghost mark on hover
    if (hoverCell && !gameOver) {
        const { row, col } = hoverCell;
        const cx = gridX + col * cellSize + cellSize / 2;
        const cy = gridY + row * cellSize + cellSize / 2;
        const size = cellSize * MARK_SIZE / 2;

        ctx.globalAlpha = 0.3;
        if (currentPlayer === 'X') {
            drawX(cx, cy, size);
        } else {
            drawO(cx, cy, size);
        }
        ctx.globalAlpha = 1;
    }
}

function drawX(cx, cy, size) {
    ctx.strokeStyle = X_COLOR;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - size, cy - size);
    ctx.lineTo(cx + size, cy + size);
    ctx.moveTo(cx + size, cy - size);
    ctx.lineTo(cx - size, cy + size);
    ctx.stroke();
}

function drawO(cx, cy, size) {
    ctx.strokeStyle = O_COLOR;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.stroke();
}

function drawWinLine(line, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;

    const [a, b, c] = line;
    const ax = gridX + a[1] * cellSize + cellSize / 2;
    const ay = gridY + a[0] * cellSize + cellSize / 2;
    const cx = gridX + c[1] * cellSize + cellSize / 2;
    const cy = gridY + c[0] * cellSize + cellSize / 2;

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    ctx.shadowBlur = 0;
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';

    if (winner) {
        ctx.fillText(winner.winner + ' WINS!', canvas.width / 2, canvas.height / 2 - 20);
    } else {
        ctx.fillText('DRAW!', canvas.width / 2, canvas.height / 2 - 20);
    }

    ctx.font = '18px monospace';
    ctx.fillText('Click to play again', canvas.width / 2, canvas.height / 2 + 30);
    ctx.textAlign = 'start';
}

export function onExit() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}
