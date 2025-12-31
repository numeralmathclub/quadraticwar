export const BOARD_ROWS = 9;
export const BOARD_COLS = 8;
export const TILE_SIZE = 70;
export const STATUS_BAR_HEIGHT = 50;
export const TITLE_BAR_HEIGHT = 50;

export const COLORS = {
    WHITE: "#1E293B",
    BG_DARK: "#E2E8F0",
    BOARD_LIGHT: "#E2E8F0",
    BOARD_DARK: "#CBD5E1",
    RED_COIN_BASE: "#DC2626",
    RED_COIN_LIGHT: "#EF4444",
    BLUE_COIN_BASE: "#2563EB",
    BLUE_COIN_LIGHT: "#3B82F6",
    HIGHLIGHT_SELECT: "#F59E0B",
    HIGHLIGHT_VALID: "#10B981",
    ANIM_IDENTIFY: "#0EA5E9",
    ANIM_SUCCESS: "#16A34A",
    ANIM_FAIL: "#DC2626",
    MENU_BTN: "#FFFFFF",
    MENU_BTN_HOVER: "#F8FAFC",
    MENU_TEXT: "#0F172A",
    MENU_ACCENT: "#4F46E5"
};

export const COIN_TERMS = {
    1: ["-4x^2", "-3x^2", "-2x^2", "-x^2", "x^2", "2x^2", "3x^2", "4x^2"],
    2: ["-4x", "-3x", "-2x", "-x", "x", "2x", "3x", "4x"],
    3: ["-4", "-3", "-2", "-1", "1", "2", "3", "4"]
};

// Also moving helper functions that are purely utility
export function toLatexStyle(str) {
    let latexStr = str.replace(/-/g, "−");
    latexStr = latexStr.replace(/\^2/g, "²");
    return latexStr;
}

export function parseTerm(termStr) {
    termStr = termStr.replace(/\s/g, '');
    let coeff = 0, degree = 0;
    if (termStr.includes("x^2")) {
        degree = 2;
        let cStr = termStr.replace("x^2", "");
        if (cStr === "" || cStr === "+") coeff = 1;
        else if (cStr === "-") coeff = -1;
        else coeff = parseInt(cStr);
    } else if (termStr.includes("x")) {
        degree = 1;
        let cStr = termStr.replace("x", "");
        if (cStr === "" || cStr === "+") coeff = 1;
        else if (cStr === "-") coeff = -1;
        else coeff = parseInt(cStr);
    } else {
        degree = 0; coeff = parseInt(termStr);
    }
    return { coeff, degree };
}
