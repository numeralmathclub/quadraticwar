import { BOARD_ROWS, BOARD_COLS, TILE_SIZE, COLORS, toLatexStyle, STATUS_BAR_HEIGHT, TITLE_BAR_HEIGHT } from '../utils/Constants.js';

export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    drawSharpRect(x, y, w, h) {
        this.ctx.beginPath();
        this.ctx.rect(x, y, w, h);
        this.ctx.closePath();
    }

    drawRoundedRect(x, y, w, h, r) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h - r);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.ctx.lineTo(x + r, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.closePath();
    }

    // Determine if board should be rotated (Red at bottom)
    shouldRotateBoard(gameMode, myPlayerColor) {
        return gameMode === "ONLINE" && myPlayerColor === 1;
    }

    drawBoard(gameState, gameMode, board, validMoves, currentAnimation, currentPlayer, isOnlineTurn, myPlayerColor, selectedCoin) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw Tiles
        const rotate = this.shouldRotateBoard(gameMode, myPlayerColor);
        for (let r = 0; r < BOARD_ROWS; r++) {
            for (let c = 0; c < BOARD_COLS; c++) {
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE + TITLE_BAR_HEIGHT;
                this.ctx.fillStyle = (r + c) % 2 === 0 ? COLORS.BOARD_LIGHT : COLORS.BOARD_DARK;
                this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

                // Show valid moves if it's human's turn
                const isHumanTurn = (gameMode === 'PVP') ||
                    (gameMode === 'PVC' && currentPlayer === 2) ||
                    (gameMode === 'ONLINE' && isOnlineTurn);

                if (!currentAnimation && isHumanTurn) {
                    // visual (r,c) -> logical
                    const logR = rotate ? BOARD_ROWS - 1 - r : r;
                    const logC = rotate ? BOARD_COLS - 1 - c : c;

                    const isValid = validMoves.some(m => m.r === logR && m.c === logC);
                    if (isValid) {
                        this.ctx.strokeStyle = COLORS.HIGHLIGHT_VALID;
                        this.ctx.lineWidth = 3;
                        this.ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    }
                }
            }
        }

        // 2. Animations
        if (currentAnimation) {
            const anim = currentAnimation;
            let color = (anim.phase === 'IDENTIFY') ? COLORS.ANIM_IDENTIFY : (anim.isSuccess ? COLORS.ANIM_SUCCESS : COLORS.ANIM_FAIL);
            this.ctx.globalAlpha = 0.5; this.ctx.fillStyle = color;

            anim.coords.forEach(pos => {
                let visR = rotate ? BOARD_ROWS - 1 - pos.r : pos.r;
                let visC = rotate ? BOARD_COLS - 1 - pos.c : pos.c;
                this.ctx.fillRect(visC * TILE_SIZE, visR * TILE_SIZE + TITLE_BAR_HEIGHT, TILE_SIZE, TILE_SIZE);
            });

            this.ctx.globalAlpha = 1.0; this.ctx.strokeStyle = color; this.ctx.lineWidth = 4;
            anim.coords.forEach(pos => {
                let visR = rotate ? BOARD_ROWS - 1 - pos.r : pos.r;
                let visC = rotate ? BOARD_COLS - 1 - pos.c : pos.c;
                this.ctx.strokeRect(visC * TILE_SIZE + 2, visR * TILE_SIZE + 2 + TITLE_BAR_HEIGHT, TILE_SIZE - 4, TILE_SIZE - 4);
            });
        }

        // 3. Coins
        for (let key in board) {
            const piece = board[key];
            const [r, c] = key.split(',').map(Number);

            let visR = rotate ? BOARD_ROWS - 1 - r : r;
            let visC = rotate ? BOARD_COLS - 1 - c : c;

            const x = visC * TILE_SIZE + TILE_SIZE / 2;
            const y = visR * TILE_SIZE + TILE_SIZE / 2 + TITLE_BAR_HEIGHT;
            const radius = TILE_SIZE / 2 - 6;

            if (selectedCoin && selectedCoin.r === r && selectedCoin.c === c) {
                this.ctx.beginPath();
                this.ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
                this.ctx.fillStyle = COLORS.HIGHLIGHT_SELECT;
                this.ctx.fill();
            }

            const gradient = this.ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius);
            if (piece.p === 1) {
                gradient.addColorStop(0, COLORS.RED_COIN_LIGHT);
                gradient.addColorStop(1, COLORS.RED_COIN_BASE);
            } else {
                gradient.addColorStop(0, COLORS.BLUE_COIN_LIGHT);
                gradient.addColorStop(1, COLORS.BLUE_COIN_BASE);
            }

            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            this.ctx.fill();
            this.ctx.shadowColor = 'transparent';

            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.font = "700 20px 'Lato', sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(toLatexStyle(piece.term), x, y);
        }
    }
}
