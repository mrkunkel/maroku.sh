import { EightByEightBoard } from './board.js';

export const type = 'app';
export const title = 'Chess';
export const description = 'Two-player chess';

const EMPTY = 0;
const PAWN = 1;
const KNIGHT = 2;
const BISHOP = 3;
const ROOK = 4;
const QUEEN = 5;
const KING = 6;

const PIECES = {
    [KING]: { white: '\u2654', black: '\u265A' },
    [QUEEN]: { white: '\u2655', black: '\u265B' },
    [ROOK]: { white: '\u2656', black: '\u265C' },
    [BISHOP]: { white: '\u2657', black: '\u265D' },
    [KNIGHT]: { white: '\u2658', black: '\u265E' },
    [PAWN]: { white: '\u2659', black: '\u265F' },
};

let board = [];
let currentTurn = 'white';
let boardView;
let turnIndicator;
let gameOver = false;
let kingInCheckRow = -1;
let kingInCheckCol = -1;
let kingInCheckColor = '';
let enPassantTarget = null;
let whiteKingMoved = false;
let blackKingMoved = false;
let whiteRookKingSideMoved = false;
let whiteRookQueenSideMoved = false;
let blackRookKingSideMoved = false;
let blackRookQueenSideMoved = false;

export function execute(args, container, onExit) {
    board = Array.from({ length: 8 }, () => Array(8).fill(EMPTY));

    board[0] = [-ROOK, -KNIGHT, -BISHOP, -QUEEN, -KING, -BISHOP, -KNIGHT, -ROOK];
    board[1] = Array(8).fill(-PAWN);
    board[6] = Array(8).fill(PAWN);
    board[7] = [ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK];

    gameOver = false;
    kingInCheckRow = -1;
    kingInCheckCol = -1;
    kingInCheckColor = '';
    enPassantTarget = null;
    whiteKingMoved = false;
    blackKingMoved = false;
    whiteRookKingSideMoved = false;
    whiteRookQueenSideMoved = false;
    blackRookKingSideMoved = false;
    blackRookQueenSideMoved = false;
    currentTurn = 'white';

    const isMobile = !window.matchMedia('(hover: hover)').matches;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;width:100%;';

    const heading = document.createElement('h1');
    heading.style.cssText = 'color:#FFF;font-family:monospace;font-size:32px;margin:0 0 10px 0;';
    heading.textContent = 'CHESS';
    if (isMobile) heading.style.display = 'none';
    wrapper.appendChild(heading);

    const avail = { width: window.innerWidth, height: window.innerHeight };
    const headingHeight = isMobile ? 0 : 52;
    const turnHeight = 40;
    const canvasSize = Math.min(avail.width - 20, avail.height - headingHeight - turnHeight - 20);

    boardView = new EightByEightBoard({
        width: canvasSize,
        height: canvasSize,
        initBoard: () => {},
        getPiece: (row, col) => board[row][col],
        drawPiece: (ctx, piece, col, row, cs) => drawPiece(ctx, piece, col, row, cs),
        getValidMoves: getValidMovesForUI,
        executeMove: (from, to) => executeMove(from, to),
        getHighlightSquare: () => {
            if (kingInCheckRow >= 0) {
                return {
                    row: kingInCheckRow,
                    col: kingInCheckCol,
                    color: gameOver ? '#FF0000' : '#FFD700',
                };
            }
            return null;
        },
        onExit: onExit,
    });

    turnIndicator = document.createElement('div');
    turnIndicator.style.cssText = 'color:#FFF;font-size:22px;font-weight:bold;margin:10px 0 0 0;font-family:monospace;';
    turnIndicator.textContent = "White's turn";

    wrapper.appendChild(turnIndicator);

    const canvasWrapper = document.createElement('div');
    canvasWrapper.style.cssText = 'position:relative;';

    boardView.setup(canvasWrapper);
    boardView.resize(canvasSize, canvasSize);
    wrapper.appendChild(canvasWrapper);
    container.appendChild(wrapper);
}

function drawPiece(ctx, piece, col, row, cs) {
    const cx = col * cs + cs / 2;
    const cy = row * cs + cs / 2;
    const fontSize = cs * 0.65;

    ctx.font = `${fontSize}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const isWhite = piece > 0;
    const type = Math.abs(piece);
    const symbol = PIECES[type][isWhite ? 'white' : 'black'];

    ctx.fillStyle = isWhite ? '#FFF' : '#111';
    ctx.strokeStyle = isWhite ? '#333' : '#FFF';
    ctx.lineWidth = 1.5;

    if (isWhite) {
        ctx.strokeText(symbol, cx, cy + 1);
        ctx.fillText(symbol, cx, cy + 1);
    } else {
        ctx.fillText(symbol, cx, cy + 1);
    }
}

function isWhitePiece(piece) {
    return piece > 0;
}

function getPieceType(piece) {
    return Math.abs(piece);
}

function isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    if (piece === EMPTY) return false;

    const target = board[toRow][toCol];
    const pieceIsWhite = isWhitePiece(piece);
    const targetIsWhite = isWhitePiece(target);

    if (target !== EMPTY && pieceIsWhite === targetIsWhite) return false;

    const type = getPieceType(piece);
    const dr = toRow - fromRow;
    const dc = toCol - fromCol;

    switch (type) {
        case PAWN:
            return isValidPawnMove(fromRow, fromCol, toRow, toCol, piece, pieceIsWhite);
        case KNIGHT:
            return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
        case BISHOP:
            if (Math.abs(dr) !== Math.abs(dc) || dr === 0) return false;
            return isPathClear(fromRow, fromCol, toRow, toCol);
        case ROOK:
            if (dr !== 0 && dc !== 0) return false;
            return isPathClear(fromRow, fromCol, toRow, toCol);
        case QUEEN:
            if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return false;
            return isPathClear(fromRow, fromCol, toRow, toCol);
        case KING:
            if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1 && (dr !== 0 || dc !== 0)) return true;
            if (dr === 0 && Math.abs(dc) === 2 && !isKingInCheck(pieceIsWhite ? 'white' : 'black')) {
                const kingColor = pieceIsWhite ? 'white' : 'black';
                const kingMoved = kingColor === 'white' ? whiteKingMoved : blackKingMoved;
                if (kingMoved) return false;
                if (dc === 2) {
                    const rookKingSideMoved = kingColor === 'white' ? whiteRookKingSideMoved : blackRookKingSideMoved;
                    if (rookKingSideMoved) return false;
                    if (board[fromRow][5] !== EMPTY || board[fromRow][6] !== EMPTY) return false;
                    const rook = board[fromRow][7];
                    if (rook === EMPTY || isWhitePiece(rook) !== pieceIsWhite || getPieceType(rook) !== ROOK) return false;
                    if (!isPathClear(fromRow, fromCol, fromRow, 7)) return false;
                    if (isSquareAttacked(fromRow, 5, kingColor) || isSquareAttacked(fromRow, 6, kingColor)) return false;
                    return true;
                }
                if (dc === -2) {
                    const rookQueenSideMoved = kingColor === 'white' ? whiteRookQueenSideMoved : blackRookQueenSideMoved;
                    if (rookQueenSideMoved) return false;
                    if (board[fromRow][1] !== EMPTY || board[fromRow][2] !== EMPTY || board[fromRow][3] !== EMPTY) return false;
                    const rook = board[fromRow][0];
                    if (rook === EMPTY || isWhitePiece(rook) !== pieceIsWhite || getPieceType(rook) !== ROOK) return false;
                    if (!isPathClear(fromRow, fromCol, fromRow, 0)) return false;
                    if (isSquareAttacked(fromRow, 3, kingColor) || isSquareAttacked(fromRow, 2, kingColor)) return false;
                    return true;
                }
            }
            return false;
        default:
            return false;
    }
}

function isValidPawnMove(fromRow, fromCol, toRow, toCol, piece, pieceIsWhite) {
    const direction = pieceIsWhite ? -1 : 1;
    const startRow = pieceIsWhite ? 6 : 1;
    const dr = toRow - fromRow;
    const dc = toCol - fromCol;
    const target = board[toRow][toCol];

    if (dc === 0) {
        if (dr === direction && target === EMPTY) return true;
        if (dr === direction * 2 && fromRow === startRow && target === EMPTY && board[fromRow + direction][fromCol] === EMPTY) return true;
        return false;
    }

    if (Math.abs(dc) === 1 && dr === direction) {
        if (target !== EMPTY && isWhitePiece(target) !== pieceIsWhite) return true;
        if (target === EMPTY && enPassantTarget && enPassantTarget.row === toRow && enPassantTarget.col === toCol) return true;
        return false;
    }
    return false;
}

function isPathClear(fromRow, fromCol, toRow, toCol) {
    const dr = Math.sign(toRow - fromRow);
    const dc = Math.sign(toCol - fromCol);
    let r = fromRow + dr;
    let c = fromCol + dc;

    while (r !== toRow || c !== toCol) {
        if (board[r][c] !== EMPTY) return false;
        r += dr;
        c += dc;
    }
    return true;
}

function findKing(color) {
    const kingVal = color === 'white' ? KING : -KING;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === kingVal) return { row: r, col: c };
        }
    }
    return null;
}

function isKingInCheck(color) {
    const king = findKing(color);
    if (!king) return false;
    return isSquareAttacked(king.row, king.col, color);
}

function isSquareAttacked(targetRow, targetCol, defendingColor) {
    const attackingColor = defendingColor === 'white' ? 'black' : 'white';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p === EMPTY) continue;
            const pColor = isWhitePiece(p) ? 'white' : 'black';
            if (pColor !== attackingColor) continue;
            if (canPieceAttack(r, c, targetRow, targetCol, p)) return true;
        }
    }
    return false;
}

function canPieceAttack(fromRow, fromCol, toRow, toCol, piece) {
    const type = getPieceType(piece);
    const pieceIsWhite = isWhitePiece(piece);
    const dr = toRow - fromRow;
    const dc = toCol - fromCol;

    switch (type) {
        case PAWN: {
            const direction = pieceIsWhite ? -1 : 1;
            return dr === direction && Math.abs(dc) === 1;
        }
        case KNIGHT:
            return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
        case BISHOP:
            if (Math.abs(dr) !== Math.abs(dc) || dr === 0) return false;
            return isPathClear(fromRow, fromCol, toRow, toCol);
        case ROOK:
            if (dr !== 0 && dc !== 0) return false;
            return isPathClear(fromRow, fromCol, toRow, toCol);
        case QUEEN:
            if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return false;
            return isPathClear(fromRow, fromCol, toRow, toCol);
        case KING:
            return Math.abs(dr) <= 1 && Math.abs(dc) <= 1 && (dr !== 0 || dc !== 0);
        default:
            return false;
    }
}

function hasAnyLegalMove(color) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p === EMPTY) continue;
            const pColor = isWhitePiece(p) ? 'white' : 'black';
            if (pColor !== color) continue;
            for (let tr = 0; tr < 8; tr++) {
                for (let tc = 0; tc < 8; tc++) {
                    if (isValidMove(r, c, tr, tc)) {
                        const savedFrom = board[r][c];
                        const savedTo = board[tr][tc];
                        let enPassantCapturedRow = -1;
                        let enPassantCapturedPiece = EMPTY;
                        const type = getPieceType(savedFrom);
                        const isPawnCaptureEnPassant = type === PAWN && enPassantTarget && tr === enPassantTarget.row && tc === enPassantTarget.col;
                        if (isPawnCaptureEnPassant) {
                            const pawnIsWhite = isWhitePiece(savedFrom);
                            enPassantCapturedRow = pawnIsWhite ? tr + 1 : tr - 1;
                            enPassantCapturedPiece = board[enPassantCapturedRow][tc];
                            board[enPassantCapturedRow][tc] = EMPTY;
                        }
                        board[tr][tc] = savedFrom;
                        board[r][c] = EMPTY;
                        const stillInCheck = isKingInCheck(color);
                        board[r][c] = savedFrom;
                        board[tr][tc] = savedTo;
                        if (isPawnCaptureEnPassant) {
                            board[enPassantCapturedRow][tc] = enPassantCapturedPiece;
                        }
                        if (!stillInCheck) return true;
                    }
                }
            }
        }
    }
    return false;
}

function getValidMovesForUI(row, col) {
    if (gameOver) return [];

    const piece = board[row][col];
    if (piece === EMPTY) return [];

    const pieceIsWhite = isWhitePiece(piece);
    if ((currentTurn === 'white' && !pieceIsWhite) || (currentTurn === 'black' && pieceIsWhite)) return [];

    const moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (isValidMove(row, col, r, c)) {
                const savedFrom = board[row][col];
                const savedTo = board[r][c];
                let enPassantCapturedRow = -1;
                let enPassantCapturedPiece = EMPTY;
                const type = getPieceType(savedFrom);
                const isPawnCaptureEnPassant = type === PAWN && enPassantTarget && r === enPassantTarget.row && c === enPassantTarget.col;
                if (isPawnCaptureEnPassant) {
                    const pawnIsWhite = isWhitePiece(savedFrom);
                    enPassantCapturedRow = pawnIsWhite ? r + 1 : r - 1;
                    enPassantCapturedPiece = board[enPassantCapturedRow][c];
                    board[enPassantCapturedRow][c] = EMPTY;
                }
                board[r][c] = savedFrom;
                board[row][col] = EMPTY;
                const stillInCheck = isKingInCheck(currentTurn);
                board[row][col] = savedFrom;
                board[r][c] = savedTo;
                if (isPawnCaptureEnPassant) {
                    board[enPassantCapturedRow][c] = enPassantCapturedPiece;
                }
                if (!stillInCheck) {
                    moves.push({ row: r, col: c });
                }
            }
        }
    }
    return moves;
}

function executeMove(from, to) {
    const piece = board[from.row][from.col];
    const target = board[to.row][to.col];
    const captured = target !== EMPTY;
    const pieceIsWhite = isWhitePiece(piece);
    const type = getPieceType(piece);

    board[to.row][to.col] = piece;
    board[from.row][from.col] = EMPTY;

    if (type === PAWN && enPassantTarget && to.row === enPassantTarget.row && to.col === enPassantTarget.col) {
        const direction = pieceIsWhite ? -1 : 1;
        board[enPassantTarget.row - direction][enPassantTarget.col] = EMPTY;
    }

    enPassantTarget = null;
    if (type === PAWN && Math.abs(to.row - from.row) === 2) {
        const direction = pieceIsWhite ? -1 : 1;
        enPassantTarget = { row: from.row + direction, col: from.col };
    }

    if (type === KING && Math.abs(to.col - from.col) === 2) {
        if (to.col === 6) {
            board[from.row][5] = board[from.row][7];
            board[from.row][7] = EMPTY;
        } else if (to.col === 2) {
            board[from.row][3] = board[from.row][0];
            board[from.row][0] = EMPTY;
        }
    }

    if (type === PAWN) {
        const isWhite = isWhitePiece(piece);
        if ((isWhite && to.row === 0) || (!isWhite && to.row === 7)) {
            board[to.row][to.col] = isWhite ? QUEEN : -QUEEN;
        }
    }

    if (type === KING) {
        if (pieceIsWhite) whiteKingMoved = true;
        else blackKingMoved = true;
    }
    if (type === ROOK) {
        if (pieceIsWhite) {
            if (from.row === 7 && from.col === 7) whiteRookKingSideMoved = true;
            if (from.row === 7 && from.col === 0) whiteRookQueenSideMoved = true;
        } else {
            if (from.row === 0 && from.col === 7) blackRookKingSideMoved = true;
            if (from.row === 0 && from.col === 0) blackRookQueenSideMoved = true;
        }
    }

    currentTurn = currentTurn === 'white' ? 'black' : 'white';
    updateTurnIndicator();
    boardView.render();
    checkWin();
}

function updateTurnIndicator() {
    turnIndicator.textContent = currentTurn === 'white' ? "White's turn" : "Black's turn";
}

function checkWin() {
    let whiteKing = false;
    let blackKing = false;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p === EMPTY) continue;
            if (getPieceType(p) === KING) {
                if (isWhitePiece(p)) whiteKing = true;
                else blackKing = true;
            }
        }
    }

    const nextColor = currentTurn;
    const nextInCheck = isKingInCheck(nextColor);
    const nextHasMoves = hasAnyLegalMove(nextColor);

    kingInCheckRow = -1;
    kingInCheckCol = -1;
    kingInCheckColor = '';

    if (!whiteKing) {
        gameOver = true;
        turnIndicator.textContent = 'Black wins!';
        turnIndicator.style.color = '#888';
    } else if (!blackKing) {
        gameOver = true;
        turnIndicator.textContent = 'White wins!';
        turnIndicator.style.color = '#FFF';
    } else if (!nextHasMoves) {
        if (nextInCheck) {
            gameOver = true;
            const winner = nextColor === 'white' ? 'Black' : 'White';
            turnIndicator.textContent = `Checkmate! ${winner} wins!`;
            turnIndicator.style.color = winner === 'White' ? '#FFF' : '#888';
        } else {
            turnIndicator.textContent = 'Stalemate!';
            turnIndicator.style.color = '#FFD700';
        }
    } else if (nextInCheck) {
        const king = findKing(nextColor);
        kingInCheckRow = king.row;
        kingInCheckCol = king.col;
        kingInCheckColor = nextColor;
        turnIndicator.textContent = `${nextColor.charAt(0).toUpperCase() + nextColor.slice(1)} is in check!`;
    }
}

export function onExit() {
    if (boardView) boardView.destroy();
}
