import { BOARD_ROWS, BOARD_COLS, TILE_SIZE, COLORS, toLatexStyle, STATUS_BAR_HEIGHT, TITLE_BAR_HEIGHT } from '../utils/Constants.js';
import { getTermAtPos, getValidMoves, checkForEquations, checkGameEnd, executeMove, getBoardKey } from './Rules.js';
import { makeBestMove } from './AI.js';
import { Renderer } from '../view/Renderer.js';
import { UI, UI_BUTTONS } from '../view/UI.js';
import { Input } from '../input/Input.js';
import NetworkManager from '../services/Network.js';

export default class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.hiddenInput = document.getElementById('hiddenInput');

        // Components
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.ui = new UI(this.canvas, this.ctx, this.renderer);
        this.input = new Input(this.canvas, this);
        this.network = null;

        // State
        this.gameState = "MENU"; // "MENU", "PLAYING", "HOSTING", "JOINING", "INSTRUCTIONS", "ONLINE_MENU", "GAME_OVER"

        this.gameMode = null; // "PVP", "PVC", "ONLINE"

        this.board = {};
        this.currentPlayer = 2; // Blue
        this.selectedCoin = null;
        this.validMoves = [];
        this.animationQueue = [];
        this.currentAnimation = null;
        this.isAIThinking = false;

        this.joinCodeInput = "";
        this.joinStatusMsg = "";
        this.currentStatus = { text: "", color: COLORS.WHITE };
        this.gameResult = { status: "", reason: "" };

        // Online State
        this.myPlayerColor = 2;
        this.isOnlineTurn = false;
        this.onlineId = null;

        // Start Loop
        requestAnimationFrame((ts) => this.update(ts));
    }

    // --- INITIALIZATION ---
    initBoard() {
        this.board = {};
        for (let c = 0; c < BOARD_COLS; c++) {
            this.board[`0,${c}`] = { p: 1, term: getTermAtPos(1, 1, c) };
            this.board[`1,${c}`] = { p: 1, term: getTermAtPos(1, 2, c) };
            this.board[`2,${c}`] = { p: 1, term: getTermAtPos(1, 3, c) };
        }
        for (let c = 0; c < BOARD_COLS; c++) {
            this.board[`6,${c}`] = { p: 2, term: getTermAtPos(2, 3, c) };
            this.board[`7,${c}`] = { p: 2, term: getTermAtPos(2, 2, c) };
            this.board[`8,${c}`] = { p: 2, term: getTermAtPos(2, 1, c) };
        }
    }

    startGame(mode) {
        this.gameMode = mode;
        this.gameState = "PLAYING";

        this.currentPlayer = 2; // Blue Starts

        if (mode === "ONLINE") {
            this.isOnlineTurn = false; // Will be set by Host/Join
        }

        this.selectedCoin = null;
        this.validMoves = [];
        this.animationQueue = [];
        this.currentAnimation = null;
        this.initBoard();
        this.resetStatusText();
    }

    // --- NETWORK ---
    initNetwork() {
        this.network = new NetworkManager();

        this.network.onData((data) => {
            if (data.type === 'MOVE') {
                this.applyOpponentMove(data.move);
            } else if (data.type === 'START') {
                this.startGame("ONLINE");
                this.myPlayerColor = 1; // Joiner is Red
                this.isOnlineTurn = false; // Blue (Host) starts
                this.resetStatusText();
            }
        });

        this.network.onClose(() => {
            alert("Opponent disconnected!");
            this.gameState = "MENU";
            this.gameMode = null;
            this.network = null;
        });
    }

    startOnlineGameAsHost() {
        this.initNetwork();
        this.gameState = "HOSTING";
        this.currentStatus.text = "Generating ID...";
        this.network.initHost((id) => {
            this.onlineId = id;
            this.currentStatus.text = `Waiting for Opponent... Code: ${id.split('-')[1]}`;
        });

        this.network.onConnectCallback = () => {
            this.network.send({ type: 'START' });
            this.startGame("ONLINE");
            this.myPlayerColor = 2; // Host is Blue
            this.isOnlineTurn = true;
            this.resetStatusText();
        };
    }

    joinOnlineGame(code) {
        if (!code || code.length < 4) return;
        this.initNetwork();
        const fullId = "QW-" + code.toUpperCase();
        this.joinStatusMsg = "Connecting...";

        this.network.initJoin(fullId, () => {
            this.joinStatusMsg = "Connected! Waiting for Host...";
        }, (err) => {
            this.joinStatusMsg = "Error: " + err;
        });
    }

    applyOpponentMove(move) {
        const { start, end } = move;

        const result = executeMove(this.board, move, this.currentPlayer);
        this.board = result.newBoard;

        if (result.equations.length > 0) {
            this.animationQueue.push(...result.equations);
        } else {
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.isOnlineTurn = true;
            this.resetStatusText();
        }
    }

    // --- AI ---
    triggerComputerTurn() {
        if (this.isAIThinking || this.gameState !== "PLAYING") return;
        this.isAIThinking = true;
        this.currentStatus.text = "Computer is thinking...";
        this.currentStatus.color = COLORS.RED_COIN_LIGHT;

        setTimeout(() => {
            const move = makeBestMove(this.board, 1);
            if (move) {
                const result = executeMove(this.board, move, 1);
                this.board = result.newBoard;

                if (result.equations.length > 0) {
                    this.animationQueue.push(...result.equations);
                } else {
                    this.currentPlayer = 2;
                    this.resetStatusText();
                }
            } else {
                // No move?
                this.currentPlayer = 2;
                this.resetStatusText();
            }
            this.isAIThinking = false;
        }, 800);
    }

    // --- INPUT HANDLERS ---
    onMouseMove(x, y) {
        this.ui.updateMouse(x, y);
    }

    onPointerDown(x, y) {
        if (this.gameState === "MENU") return;
        if (this.gameState === "HOSTING") {
            if (this.isClicked(UI_BUTTONS.btnCancelHost, x, y)) {
                if (this.network) this.network.close();
                this.gameState = "ONLINE_MENU";
            }
            return;
        }
        if (this.gameState === "ONLINE_MENU") {
            if (this.isClicked(UI_BUTTONS.btnHost, x, y)) this.startOnlineGameAsHost();
            else if (this.isClicked(UI_BUTTONS.btnJoin, x, y)) {
                this.gameState = "JOINING";
                this.joinCodeInput = "";
                this.hiddenInput.value = "";
                this.joinStatusMsg = "";
            }
            return;
        }
        if (this.gameState === "JOINING") {
            if (y >= 240 && y <= 300) { this.hiddenInput.focus(); return; }
            if (this.isClicked(UI_BUTTONS.btnConnect, x, y)) this.joinOnlineGame(this.joinCodeInput);
            else if (this.isClicked(UI_BUTTONS.btnCancel, x, y)) {
                this.gameState = "ONLINE_MENU";
                this.hiddenInput.blur();
            }
            return;
        }
        if (this.gameState === "INSTRUCTIONS") {
            return;
        }
        if (this.gameState === "GAME_OVER") {
            if (this.isClicked(UI_BUTTONS.btnGameOverMenu, x, y)) {
                window.location.href = '/quadraticwar/';
            }
            return;
        }

        // Close/Exit Button (Always active in PLAYING)
        if (this.isClicked(UI_BUTTONS.btnClose, x, y)) {
            if (this.network) {
                this.network.close();
            }
            if (window.parent && window.parent !== window) {
                window.parent.postMessage('closePlayPopup', '*');
            } else {
                window.location.href = '/quadraticwar/';
            }
            return;
        }

        // --- GAMEPLAY HELPERS --

        if (this.currentAnimation || this.animationQueue.length > 0 || this.isAIThinking) return;
        if (this.gameMode === "PVC" && this.currentPlayer === 1) return;
        if (this.gameMode === "ONLINE" && !this.isOnlineTurn) return;

        let visC = Math.floor(x / TILE_SIZE);
        let visR = Math.floor((y - TITLE_BAR_HEIGHT) / TILE_SIZE);

        if (visR >= 0 && visR < BOARD_ROWS && visC >= 0 && visC < BOARD_COLS) {
            // Orientation
            const rotate = (this.gameMode === "ONLINE" && this.myPlayerColor === 1);
            let r = rotate ? BOARD_ROWS - 1 - visR : visR;
            let c = rotate ? BOARD_COLS - 1 - visC : visC;
            const key = `${r},${c}`;

            if (this.selectedCoin) {
                // Try move
                const startR = this.selectedCoin.r;
                const startC = this.selectedCoin.c;
                const startKey = `${startR},${startC}`;

                if (startR === r && startC === c) {
                    this.selectedCoin = null;
                    this.validMoves = [];
                    return;
                }

                // Check basic validity from list
                const moveObj = this.validMoves.find(m => m.r === r && m.c === c);
                if (moveObj) {
                    // EXECUTE MOVE
                    if (this.gameMode === "ONLINE") {
                        this.network.send({ type: 'MOVE', move: { start: { r: startR, c: startC }, end: { r, c } } });
                        this.isOnlineTurn = false;
                    }

                    const move = { start: { r: startR, c: startC }, end: { r, c } };
                    const result = executeMove(this.board, move, this.currentPlayer);
                    this.board = result.newBoard;

                    this.selectedCoin = null;
                    this.validMoves = [];

                    if (result.equations.length > 0) {
                        this.animationQueue.push(...result.equations);
                    } else {
                        // Switch turn
                        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                        this.resetStatusText();
                    }
                } else {
                    // Invalid move target. Select new if own coin?
                    if (this.board[key] && this.board[key].p === this.currentPlayer) {
                        if (this.gameMode === "ONLINE" && this.board[key].p !== this.myPlayerColor) return;
                        this.selectedCoin = { r, c };
                        this.validMoves = getValidMoves(this.board, r, c, this.currentPlayer);
                    } else {
                        this.selectedCoin = null;
                        this.validMoves = [];
                    }
                }
            } else {
                if (this.board[key] && this.board[key].p === this.currentPlayer) {
                    if (this.gameMode === "ONLINE" && this.board[key].p !== this.myPlayerColor) return;
                    this.selectedCoin = { r, c };
                    this.validMoves = getValidMoves(this.board, r, c, this.currentPlayer);
                }
            }
        }
    }

    isClicked(btn, x, y) {
        return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
    }

    onInput(val) {
        if (this.gameState === "JOINING") {
            const char = val.slice(-1); // Get last char
            if (char.match(/[a-zA-Z0-9]/)) {
                if (this.joinCodeInput.length < 4) {
                    this.joinCodeInput += char.toUpperCase();
                }
            }
            this.hiddenInput.value = ""; // Always clear to capture next
        }
    }

    onKeyDown(key) {
        if (this.gameState === "JOINING") {
            if (key === "Backspace") {
                this.joinCodeInput = this.joinCodeInput.slice(0, -1);
            } else if (key === "Enter") {
                this.joinOnlineGame(this.joinCodeInput);
            }
        }
    }

    onGlobalKeyDown(e) {
        if (this.gameState === "JOINING") {
            if (document.activeElement !== this.hiddenInput) {
                this.hiddenInput.focus();
            }
        }
    }

    resetStatusText() {
        if (this.gameMode === "PVC") {
            if (this.currentPlayer === 1) {
                this.currentStatus.text = "Computer (Red)'s Turn";
                this.currentStatus.color = COLORS.RED_COIN_LIGHT;
            } else {
                this.currentStatus.text = "Your Turn (Blue)";
                this.currentStatus.color = COLORS.ANIM_IDENTIFY;
            }
        } else if (this.gameMode === "ONLINE") {
            if (this.isOnlineTurn) {
                const pName = this.myPlayerColor === 1 ? "Red" : "Blue";
                this.currentStatus.text = `Your Turn (${pName})`;
                this.currentStatus.color = this.myPlayerColor === 1 ? COLORS.RED_COIN_LIGHT : COLORS.ANIM_IDENTIFY;
            } else {
                this.currentStatus.text = "Opponent's Turn";
                this.currentStatus.color = this.myPlayerColor === 1 ? COLORS.ANIM_IDENTIFY : COLORS.RED_COIN_LIGHT;
            }
        } else {
            const pName = this.currentPlayer === 1 ? "Red" : "Blue";
            this.currentStatus.text = `${pName}'s Turn`;
            this.currentStatus.color = this.currentPlayer === 1 ? COLORS.RED_COIN_LIGHT : COLORS.ANIM_IDENTIFY;
        }
    }

    update(timestamp) {
        if (this.gameState === "MENU" || this.gameState === "ONLINE_MENU" || this.gameState === "HOSTING" || this.gameState === "JOINING") {
            this.ui.drawMenu(this.gameState, this.currentStatus, this.joinCodeInput, this.joinStatusMsg);
        } else if (this.gameState === "GAME_OVER") {
            this.renderer.drawBoard(this.gameState, this.gameMode, this.board, [], null, this.currentPlayer, this.isOnlineTurn, this.myPlayerColor, null);
            this.ui.drawGameOver(this.gameResult);
        } else if (this.gameState === "PLAYING") {
            // Logic update
            if (this.currentAnimation) {
                const elapsed = timestamp - this.currentAnimation.startTime;
                if (this.currentAnimation.phase === 'IDENTIFY') {
                    const visualPoly = toLatexStyle(this.currentAnimation.polyStr);
                    this.currentStatus.text = `Analyzing: ${visualPoly} = 0`;
                    this.currentStatus.color = COLORS.ANIM_IDENTIFY;
                    if (elapsed > 1500) {
                        this.currentAnimation.phase = 'RESOLVE';
                        this.currentAnimation.startTime = timestamp;
                    }
                } else if (this.currentAnimation.phase === 'RESOLVE') {
                    const isSuccess = this.currentAnimation.isSuccess;
                    this.currentStatus.text = isSuccess ? "REAL Solutions (Δ ≥ 0). Opponent Removed." : "COMPLEX Solutions (Δ < 0). Backfire!";
                    this.currentStatus.color = isSuccess ? COLORS.ANIM_SUCCESS : COLORS.ANIM_FAIL;
                    if (elapsed > 1500) {
                        this.currentAnimation.remove.forEach(pos => { delete this.board[`${pos.r},${pos.c}`]; });
                        this.currentAnimation = null;
                        if (this.animationQueue.length === 0) {
                            const endCheck = checkGameEnd(this.board);
                            if (endCheck.status !== "PLAYING") {
                                this.gameState = "GAME_OVER";
                                this.gameResult = endCheck;
                            } else {
                                this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                                if (this.gameMode === "ONLINE") {
                                    this.isOnlineTurn = (this.currentPlayer === this.myPlayerColor);
                                }
                                this.resetStatusText();
                            }
                        }
                    }
                }
            } else {
                if (this.animationQueue.length > 0) {
                    this.currentAnimation = this.animationQueue.shift();
                    this.currentAnimation.startTime = timestamp;
                } else {
                    if (this.gameMode === "PVC" && this.currentPlayer === 1 && !this.isAIThinking) {
                        this.triggerComputerTurn();
                    }
                }
            }

            // Draw
            this.renderer.drawBoard(
                this.gameState,
                this.gameMode,
                this.board,
                this.validMoves,
                this.currentAnimation,
                this.currentPlayer,
                this.isOnlineTurn,
                this.myPlayerColor,
                this.selectedCoin
            );

            this.ui.drawStatus(this.currentStatus.text, this.currentStatus.color);


        }

        requestAnimationFrame((ts) => this.update(ts));
    }
}
