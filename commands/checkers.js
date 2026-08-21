// VERSION: 2026-08-20-18-30
// VERSION: 2026-08-20-18-30
// VERSION: 2026-08-20-18-30
// VERSION: 2026-08-20-18-30
// VERSION: 2026-08-20-18-30
// VERSION: 2026-08-20-18-30
// VERSION: 2026-08-20-18-30
// VERSION: 2026-08-20-18-30
// VERSION: 2026-08-20-18-30
// VERSION: 2026-08-20-18-30
import { EightByEightBoard } from './board.js';

export const type = 'app';
export const title = 'Checkers';
export const description = 'Two-player checkers';

const EMPTY = 0;
const RED = 1;
const RED_KING = 2;
const BLACK = 3;
const BLACK_KING = 4;

let board = [];
let currentTurn = 'red';
let mustContinueJump = false;
let jumpSource = null;
let boardView;
let turnIndicator;

const RED_COLOR = '#CC0000';
const RED_BORDER = '#880000';
const BLACK_COLOR = '#222';
const BLACK_BORDER = '#000';

export function execute(args, container, onExit) {
    board = Array.from({ length: 8 }, () => Array(8).fill(EMPTY));

    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) {
                board[row][col] = BLACK;
            }
        }
    }
    for (let row = 5; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) {
                board[row][col] = RED;
            }
        }
    }

    const canvasSize = 480;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;width:100%;';

    const heading = document.createElement('h1');
    heading.style.cssText = 'color:#FFF;font-family:monospace;font-size:32px;margin:0 0 10px 0;';
    heading.textContent = 'CHECKERS';
    wrapper.appendChild(heading);

    boardView = new EightByEightBoard({
        width: canvasSize,
        height: canvasSize,
        initBoard: () => {},
        getPiece: (row, col) => board[row][col],
        drawPiece: (ctx, piece, col, row, cs) => drawPiece(ctx, piece, col, row, cs),
        getValidMoves: getValidMovesForUI,
        executeMove: (from, to) => executeMove(from, to),
        onExit: onExit,
    });

    turnIndicator = document.createElement('div');
    turnIndicator.style.cssText = 'color:#CC0000;font-size:22px;font-weight:bold;margin:10px 0 0 0;font-family:monospace;';
    turnIndicator.textContent = "Red's turn";

    wrapper.appendChild(turnIndicator);

    const canvasWrapper = document.createElement('div');
    canvasWrapper.style.cssText = 'position:relative;';

    boardView.setup(canvasWrapper);
    wrapper.appendChild(canvasWrapper);
    container.appendChild(wrapper);
}

function drawPiece(ctx, piece, col, row, cs) {
    const cx = col * cs + cs / 2;
    const cy = row * cs + cs / 2;
    const radius = cs * 0.38;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);

    if (piece === RED || piece === RED_KING) {
        ctx.fillStyle = RED_COLOR;
        ctx.fill();
        ctx.strokeStyle = RED_BORDER;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
    } else {
        ctx.fillStyle = BLACK_COLOR;
        ctx.fill();
        ctx.strokeStyle = BLACK_BORDER;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    if (piece === RED_KING || piece === BLACK_KING) {
        ctx.fillStyle = '#FFD700';
        ctx.font = `bold ${cs * 0.3}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u265A', cx, cy + 1);
    }
}

function getValidMovesForUI(row, col) {
    const piece = board[row][col];
    if (piece === EMPTY) return [];

    const isRed = piece === RED || piece === RED_KING;
    const isKing = piece === RED_KING || piece === BLACK_KING;

    if (currentTurn === 'red' && !isRed) return [];
    if (currentTurn === 'black' && isRed) return [];

    if (!mustContinueJump) {
        const allMoves = getAllMoves(row, col, piece, isRed, isKing);
        const captureMoves = allMoves.filter((m) => m.capture);
        if (hasAnyCapture(currentTurn)) {
            return captureMoves;
        }
        return allMoves;
    }

    return getJumpMoves(row, col, piece, isRed, isKing);
}

function hasAnyCapture(player) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p === EMPTY) continue;
            const pIsRed = p === RED || p === RED_KING;
            if (player === 'red' && !pIsRed) continue;
            if (player === 'black' && pIsRed) continue;
            const moves = getAllMoves(r, c, p, pIsRed, p === RED_KING || p === BLACK_KING);
            if (moves.some((m) => m.capture)) return true;
        }
    }
    return false;
}

function getAllMoves(row, col, piece, isRed, isKing) {
    const moves = [];
    const jumps = getJumpMoves(row, col, piece, isRed, isKing);
    if (jumps.length > 0) return jumps;

    const dirs = isKing
        ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
        : isRed
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]];

    for (const [dr, dc] of dirs) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === EMPTY) {
            moves.push({ row: nr, col: nc, capture: false });
        }
    }
    return moves;
}

function getJumpMoves(row, col, piece, isRed, isKing) {
    const moves = [];
    const dirs = isKing
        ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
        : isRed
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]];

    for (const [dr, dc] of dirs) {
        const midR = row + dr;
        const midC = col + dc;
        const endR = row + dr * 2;
        const endC = col + dc * 2;

        if (endR < 0 || endR >= 8 || endC < 0 || endC >= 8) continue;
        if (board[endR][endC] !== EMPTY) continue;

        const midPiece = board[midR][midC];
        if (midPiece === EMPTY) continue;

        const midIsRed = midPiece === RED || midPiece === RED_KING;
        const isOpponent = isRed ? !midIsRed : midIsRed;
        if (!isOpponent) continue;

        moves.push({ row: endR, col: endC, capture: true, jumpRow: midR, jumpCol: midC });
    }
    return moves;
}

function executeMove(from, to) {
    let piece = board[from.row][from.col];
    board[to.row][to.col] = piece;
    board[from.row][from.col] = EMPTY;

    let captured = false;
    if (to.capture) {
        board[to.jumpRow][to.jumpCol] = EMPTY;
        captured = true;
    }

    let promoted = false;
    if (piece === RED && to.row === 0) {
        board[to.row][to.col] = RED_KING;
        piece = RED_KING;
        promoted = true;
    } else if (piece === BLACK && to.row === 7) {
        board[to.row][to.col] = BLACK_KING;
        piece = BLACK_KING;
        promoted = true;
    }

    if (captured && !promoted) {
        const isRed = piece === RED || piece === RED_KING;
        const moreJumps = getJumpMoves(to.row, to.col, piece, isRed, piece === RED_KING || piece === BLACK_KING);
        if (moreJumps.length > 0) {
            mustContinueJump = true;
            jumpSource = { row: to.row, col: to.col };
            updateTurnIndicator();
            boardView.render();
            return jumpSource;
        }
    } else if (promoted) {
        mustContinueJump = false;
        jumpSource = null;
        currentTurn = currentTurn === 'red' ? 'black' : 'red';
        updateTurnIndicator();
        boardView.render();
        checkWin();
        return null;
    }

    mustContinueJump = false;
    jumpSource = null;
    currentTurn = currentTurn === 'red' ? 'black' : 'red';
    updateTurnIndicator();
    boardView.render();
    checkWin();
    return null;
}

function updateTurnIndicator() {
    if (mustContinueJump) {
        turnIndicator.textContent = "Red must continue jumping!";
        turnIndicator.style.color = RED_COLOR;
    } else if (currentTurn === 'red') {
        turnIndicator.textContent = "Red's turn";
        turnIndicator.style.color = RED_COLOR;
    } else {
        turnIndicator.textContent = "Black's turn";
        turnIndicator.style.color = '#888';
    }
}

function checkWin() {
    let redCount = 0;
    let blackCount = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p === RED || p === RED_KING) redCount++;
            if (p === BLACK || p === BLACK_KING) blackCount++;
        }
    }

    if (redCount === 0) {
        turnIndicator.textContent = 'Black wins!';
        turnIndicator.style.color = '#888';
    } else if (blackCount === 0) {
        turnIndicator.textContent = 'Red wins!';
        turnIndicator.style.color = RED_COLOR;
    }
}

export function onExit() {
    if (boardView) boardView.destroy();
}
