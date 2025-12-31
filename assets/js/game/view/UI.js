import { COLORS, STATUS_BAR_HEIGHT, BOARD_ROWS, TILE_SIZE, TITLE_BAR_HEIGHT } from '../utils/Constants.js';

const BOARD_HEIGHT = BOARD_ROWS * TILE_SIZE;

export const UI_BUTTONS = {

    btnHost: { x: 130, y: 250, w: 300, h: 60, text: "Host Game" },
    btnCancelHost: { x: 130, y: 550, w: 300, h: 50, text: "Cancel" },
    btnJoin: { x: 130, y: 340, w: 300, h: 60, text: "Join Game" },
    btnGameOverMenu: { x: 180, y: 400, w: 200, h: 50, text: "Main Menu" },
    btnConnect: { x: 130, y: 400, w: 300, h: 50, text: "CONNECT" },
    btnCancel: { x: 130, y: 470, w: 300, h: 50, text: "CANCEL" },
    btnClose: { x: 505, y: 5, w: 40, h: 40, text: "✕" }
};

export class UI {
    constructor(canvas, ctx, renderer) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.renderer = renderer; // To reuse drawing primitives
        this.mouse = { x: 0, y: 0 };
    }

    updateMouse(x, y) {
        this.mouse.x = x;
        this.mouse.y = y;
    }

    isHovered(btn) {
        return this.mouse.x >= btn.x && this.mouse.x <= btn.x + btn.w &&
            this.mouse.y >= btn.y && this.mouse.y <= btn.y + btn.h;
    }



    drawGameOver(gameResult) {
        // Overlay
        this.ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        this.ctx.font = "700 48px 'Cinzel', serif";

        let title = "";
        let color = COLORS.WHITE;

        if (gameResult.status === "WIN_RED") {
            title = "RED WINS!";
            color = COLORS.RED_COIN_LIGHT;
        } else if (gameResult.status === "WIN_BLUE") {
            title = "BLUE WINS!";
            color = COLORS.BLUE_COIN_LIGHT;
        } else {
            title = "DRAW";
            color = COLORS.HIGHLIGHT_SELECT;
        }

        this.ctx.fillStyle = color;
        this.ctx.fillText(title, this.canvas.width / 2, 250);

        this.ctx.font = "400 18px 'Lato', sans-serif";
        this.ctx.fillStyle = COLORS.WHITE;
        this.ctx.fillText(gameResult.reason, this.canvas.width / 2, 310);

        // Menu Button
        const btn = UI_BUTTONS.btnGameOverMenu;
        const hovered = this.isHovered(btn);
        this.ctx.fillStyle = hovered ? COLORS.MENU_BTN_HOVER : COLORS.MENU_BTN;
        this.renderer.drawSharpRect(btn.x, btn.y, btn.w, btn.h);
        this.ctx.fill();

        this.ctx.strokeStyle = hovered ? COLORS.MENU_ACCENT : COLORS.BOARD_LIGHT;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        this.ctx.fillStyle = hovered ? COLORS.WHITE : COLORS.MENU_TEXT;
        this.ctx.font = "400 16px 'Lato', sans-serif";
        this.ctx.fillText(btn.text.toUpperCase(), btn.x + btn.w / 2, btn.y + btn.h / 2);
    }

    drawMenu(gameState, currentStatus, joinCodeInput, joinStatusMsg) {
        // Background
        const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGrad.addColorStop(0, "#E2E8F0");
        bgGrad.addColorStop(1, "#CBD5E1");
        this.ctx.fillStyle = bgGrad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Title
        this.ctx.shadowColor = "rgba(79, 70, 229, 0.4)";
        this.ctx.shadowBlur = 15;
        this.ctx.font = "700 52px 'Cinzel', serif";
        this.ctx.fillStyle = COLORS.MENU_ACCENT;
        this.ctx.textAlign = "center";
        this.ctx.fillText("QUADRATIC WAR", this.canvas.width / 2, 100);

        // Buttons
        let buttons = [];
        let title = "";

        if (gameState === "ONLINE_MENU") {
            title = "ONLINE MODE";
            buttons = [UI_BUTTONS.btnHost, UI_BUTTONS.btnJoin];
        }

        if (title) {
            this.ctx.fillStyle = COLORS.MENU_ACCENT;
            this.ctx.font = "700 24px 'Cinzel', serif";
            this.ctx.fillText(title, this.canvas.width / 2, 215);
        }

        buttons.forEach(btn => {
            const hovered = this.isHovered(btn);
            this.ctx.shadowColor = "rgba(0,0,0,0.3)";
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetY = 4;

            if (hovered) {
                this.ctx.fillStyle = COLORS.MENU_BTN_HOVER;
                this.ctx.shadowColor = "rgba(79, 70, 229, 0.3)";
                this.ctx.shadowBlur = 15;
            } else {
                this.ctx.fillStyle = COLORS.MENU_BTN;
            }

            this.renderer.drawRoundedRect(btn.x, btn.y, btn.w, btn.h, 10);
            this.ctx.fill();

            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetY = 0;

            this.ctx.strokeStyle = hovered ? COLORS.MENU_ACCENT : "#334155";
            this.ctx.lineWidth = hovered ? 2 : 1;
            this.ctx.stroke();

            this.ctx.fillStyle = hovered ? COLORS.WHITE : COLORS.MENU_TEXT;
            this.ctx.font = "700 16px 'Cinzel', serif";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(btn.text.toUpperCase(), btn.x + btn.w / 2, btn.y + btn.h / 2);
        });

        if (gameState === "HOSTING") {
            this.ctx.fillStyle = COLORS.MENU_TEXT;
            this.ctx.font = "400 22px 'Lato', sans-serif";
            this.ctx.fillText(currentStatus.text, this.canvas.width / 2, 480);

            const dots = ".".repeat(Math.floor(Date.now() / 500) % 4);
            this.ctx.fillText(dots, this.canvas.width / 2, 510);

            const btn = UI_BUTTONS.btnCancelHost;
            const hovered = this.isHovered(btn);

            this.ctx.shadowColor = "rgba(0,0,0,0.3)";
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetY = 4;

            if (hovered) this.ctx.fillStyle = COLORS.MENU_BTN_HOVER;
            else this.ctx.fillStyle = COLORS.MENU_BTN;

            this.renderer.drawRoundedRect(btn.x, btn.y, btn.w, btn.h, 10);
            this.ctx.fill();

            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetY = 0;

            this.ctx.strokeStyle = hovered ? COLORS.MENU_ACCENT : "#334155";
            this.ctx.lineWidth = hovered ? 2 : 1;
            this.ctx.stroke();

            this.ctx.fillStyle = hovered ? COLORS.WHITE : COLORS.MENU_TEXT;
            this.ctx.font = "700 16px 'Cinzel', serif";
            this.ctx.fillText(btn.text.toUpperCase(), btn.x + btn.w / 2, btn.y + btn.h / 2);
        }

        if (gameState === "JOINING") {
            // Overlay for Input
            this.ctx.fillStyle = "rgba(241, 245, 249, 0.9)";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = COLORS.MENU_ACCENT;
            this.ctx.font = "700 36px 'Cinzel', serif";
            this.ctx.fillText("ENTER CODE", this.canvas.width / 2, 180);

            // Input Box
            const w = 240;
            const h = 60;
            const x = (this.canvas.width - w) / 2;
            const y = 240;

            this.ctx.fillStyle = "#FFFFFF";
            this.renderer.drawRoundedRect(x, y, w, h, 8);
            this.ctx.fill();
            this.ctx.strokeStyle = COLORS.MENU_ACCENT;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            this.ctx.fillStyle = "#1e293b";
            this.ctx.font = "700 32px 'Lato', sans-serif";
            this.ctx.letterSpacing = "4px";
            const displayCode = joinCodeInput || "";
            this.ctx.fillText(displayCode + (Date.now() % 1000 < 500 ? "|" : ""), this.canvas.width / 2, y + h / 2 + 2);

            this.ctx.fillStyle = "#94a3b8";
            this.ctx.font = "italic 16px 'Lato', sans-serif";
            this.ctx.letterSpacing = "0px";
            this.ctx.fillText("Type the 4-character host code", this.canvas.width / 2, y + 90);

            if (joinStatusMsg) {
                this.ctx.fillStyle = joinStatusMsg.startsWith("Error") ? COLORS.ANIM_FAIL : COLORS.ANIM_IDENTIFY;
                this.ctx.font = "600 16px 'Lato', sans-serif";
                this.ctx.fillText(joinStatusMsg, this.canvas.width / 2, y + 130);
            }

            [UI_BUTTONS.btnConnect, UI_BUTTONS.btnCancel].forEach(btn => {
                const hovered = this.isHovered(btn);
                this.ctx.shadowColor = "rgba(0,0,0,0.3)";
                this.ctx.shadowBlur = 10;
                this.ctx.shadowOffsetY = 4;

                if (hovered) this.ctx.fillStyle = COLORS.MENU_BTN_HOVER;
                else this.ctx.fillStyle = COLORS.MENU_BTN;

                this.renderer.drawRoundedRect(btn.x, btn.y, btn.w, btn.h, 10);
                this.ctx.fill();

                this.ctx.shadowBlur = 0;
                this.ctx.shadowOffsetY = 0;

                this.ctx.strokeStyle = hovered ? COLORS.MENU_ACCENT : "#334155";
                this.ctx.stroke();

                this.ctx.fillStyle = hovered ? COLORS.WHITE : COLORS.MENU_TEXT;
                this.ctx.font = "700 16px 'Cinzel', serif";
                this.ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2);
            });
        }
    }

    drawStatus(text, color) {
        // Draw Title Bar
        this.ctx.fillStyle = "#0f172a"; // Darker background for title
        this.ctx.fillRect(0, 0, this.canvas.width, TITLE_BAR_HEIGHT);

        this.ctx.fillStyle = COLORS.MENU_ACCENT;
        this.ctx.font = "700 24px 'Cinzel', serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.letterSpacing = "2px";
        this.ctx.fillText("QUADRATIC WAR", this.canvas.width / 2, TITLE_BAR_HEIGHT / 2 + 2);
        this.ctx.letterSpacing = "0px";

        // Draw Status Bar Background
        this.ctx.fillStyle = "#1e293b"; // Dark Slate
        this.ctx.fillRect(0, TITLE_BAR_HEIGHT + BOARD_HEIGHT, this.canvas.width, STATUS_BAR_HEIGHT);

        this.ctx.fillStyle = color;
        const fontSize = text.length > 30 ? 14 : 16;
        this.ctx.font = `500 ${fontSize}px 'Lato', sans-serif`;
        this.ctx.letterSpacing = "1px";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(text.toUpperCase(), this.canvas.width / 2, TITLE_BAR_HEIGHT + BOARD_HEIGHT + STATUS_BAR_HEIGHT / 2);
        this.ctx.letterSpacing = "0px";

        // Draw Close Button (Icon Style)
        const btn = UI_BUTTONS.btnClose;
        const hovered = this.isHovered(btn);

        if (hovered) {
            this.renderer.drawRoundedRect(btn.x, btn.y, btn.w, btn.h, 8);
            this.ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            this.ctx.fill();
        }

        this.ctx.fillStyle = hovered ? "#ef4444" : "rgba(255, 255, 255, 0.5)";
        this.ctx.font = "700 24px 'Lato', sans-serif";
        this.ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
    }
}
