export class EightByEightBoard {
    constructor(config) {
        this.config = config;
        this.selectedSquare = null;
        this.validMoves = [];
        this.canvas = null;
        this.ctx = null;
        this.cellSize = null;
        this.handleClick = null;
    }

    setup(container) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;
        this.canvas.style.cssText = 'display:block;cursor:pointer;width:' + this.config.width + 'px;height:' + this.config.height + 'px;';
        container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.cellSize = this.config.width / 8;
        this.onExit = this.config.onExit;

        this.handleClick = this.handleCanvasClick.bind(this);
        this.canvas.addEventListener('click', this.handleClick);

        this.config.initBoard();
        this.render();
    }

    destroy() {
        if (this.handleClick && this.canvas) {
            this.canvas.removeEventListener('click', this.handleClick);
        }
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);

        if (col < 0 || col >= 8 || row < 0 || row >= 8) return;

        const piece = this.config.getPiece(row, col);

        if (this.selectedSquare) {
            const move = this.validMoves.find(
                (m) => m.row === row && m.col === col
            );
            if (move) {
                const keepSelection = this.config.executeMove(this.selectedSquare, move);
                if (keepSelection) {
                    this.selectedSquare = keepSelection;
                    this.validMoves = this.config.getValidMoves(keepSelection.row, keepSelection.col);
                } else {
                    this.selectedSquare = null;
                    this.validMoves = [];
                }
                this.render();
                return;
            }
        }

        if (piece) {
            const moves = this.config.getValidMoves(row, col);
            if (moves.length > 0) {
                this.selectedSquare = { row, col };
                this.validMoves = moves;
            } else {
                this.selectedSquare = null;
                this.validMoves = [];
            }
        } else {
            this.selectedSquare = null;
            this.validMoves = [];
        }
        this.render();
    }

    render() {
        const ctx = this.ctx;
        const cs = this.cellSize;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const isLight = (row + col) % 2 === 0;
                ctx.fillStyle = isLight ? '#F0D9B5' : '#B58863';
                ctx.fillRect(col * cs, row * cs, cs, cs);
            }
        }

        if (this.selectedSquare) {
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 4;
            ctx.strokeRect(
                this.selectedSquare.col * cs + 2,
                this.selectedSquare.row * cs + 2,
                cs - 4,
                cs - 4
            );
        }

        if (this.config.getHighlightSquare) {
            const highlight = this.config.getHighlightSquare();
            if (highlight) {
                ctx.strokeStyle = highlight.color;
                ctx.lineWidth = 4;
                ctx.strokeRect(
                    highlight.col * cs + 2,
                    highlight.row * cs + 2,
                    cs - 4,
                    cs - 4
                );
            }
        }

        for (const move of this.validMoves) {
            const isCapture =
                this.config.getPiece(move.row, move.col) !== null;
            if (isCapture) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
                ctx.fillRect(move.col * cs, move.row * cs, cs, cs);
            }
            ctx.beginPath();
            ctx.arc(
                move.col * cs + cs / 2,
                move.row * cs + cs / 2,
                cs * 0.12,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = isCapture ? 'rgba(255, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)';
            ctx.fill();
        }

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.config.getPiece(row, col);
                if (piece) {
                    this.config.drawPiece(ctx, piece, col, row, cs);
                }
            }
        }
    }
}
