import { BOARD_ROWS, BOARD_COLS, COIN_TERMS, parseTerm } from '../utils/Constants.js';

export function getTermAtPos(player, termType, col) {
    const terms = COIN_TERMS[termType];
    if (player === 1) return terms[terms.length - 1 - col];
    else return terms[col];
}

export function isValidMove(board, startR, startC, endR, endC, player) {
    if (startR === endR && startC === endC) return false;
    const startKey = `${startR},${startC}`;
    const endKey = `${endR},${endC}`;
    if (!board[startKey]) return false;
    if (board[endKey]) return false;

    const term = board[startKey].term;
    const isQuad = term.includes("x^2");
    const isLin = term.includes("x") && !isQuad;
    const isConst = !isQuad && !isLin;

    const maxRange = isQuad ? 3 : (isLin ? 2 : 1);
    const rowDiff = endR - startR;
    const colDiff = endC - startC;
    const absRow = Math.abs(rowDiff);
    const absCol = Math.abs(colDiff);
    const maxStep = Math.max(absRow, absCol);

    if (maxStep > maxRange) return false;

    if (isConst) {
        if (absCol !== 0) return false;
        if (player === 1 && rowDiff !== 1) return false;
        if (player === 2 && rowDiff !== -1) return false;
    } else if (isLin) {
        if (absRow > 0 && absCol > 0) return false;
    } else if (isQuad) {
        const isCardinal = (absRow === 0 || absCol === 0);
        const isDiagonal = (absRow === absCol);
        if (!isCardinal && !isDiagonal) return false;
    }

    const stepR = rowDiff === 0 ? 0 : (rowDiff > 0 ? 1 : -1);
    const stepC = colDiff === 0 ? 0 : (colDiff > 0 ? 1 : -1);
    let curR = startR + stepR;
    let curC = startC + stepC;
    while (curR !== endR || curC !== endC) {
        if (board[`${curR},${curC}`]) return false;
        curR += stepR;
        curC += stepC;
    }
    return true;
}

export function getValidMoves(board, r, c, player) {
    let moves = [];
    for (let i = 0; i < BOARD_ROWS; i++) {
        for (let j = 0; j < BOARD_COLS; j++) {
            if (isValidMove(board, r, c, i, j, player)) {
                moves.push({ r: i, c: j });
            }
        }
    }
    return moves;
}

function getContiguousChain(board, startR, startC, deltaR, deltaC) {
    let chain = [];
    let currR = startR + deltaR;
    let currC = startC + deltaC;
    while (currR >= 0 && currR < BOARD_ROWS && currC >= 0 && currC < BOARD_COLS) {
        if (board[`${currR},${currC}`]) {
            chain.push({ r: currR, c: currC });
            currR += deltaR;
            currC += deltaC;
        } else { break; }
    }
    return chain;
}

export function checkForEquations(board, r, c, activePlayer) {
    const detected = [];
    const opponent = activePlayer === 1 ? 2 : 1;
    const axes = [
        { neg: [0, -1], pos: [0, 1] }, { neg: [-1, 0], pos: [1, 0] },
        { neg: [-1, -1], pos: [1, 1] }, { neg: [-1, 1], pos: [1, -1] }
    ];

    axes.forEach(axis => {
        const negChain = getContiguousChain(board, r, c, axis.neg[0], axis.neg[1]);
        const posChain = getContiguousChain(board, r, c, axis.pos[0], axis.pos[1]);
        const fullChain = [...negChain.reverse(), { r, c }, ...posChain];

        if (fullChain.length < 2) return;
        const players = new Set();
        const terms = [];
        fullChain.forEach(pos => {
            const piece = board[`${pos.r},${pos.c}`];
            players.add(piece.p);
            terms.push(piece.term);
        });

        if (players.size < 2) return;

        let a = 0, b = 0, constant = 0;
        terms.forEach(t => {
            const p = parseTerm(t);
            if (p.degree === 2) a += p.coeff;
            else if (p.degree === 1) b += p.coeff;
            else constant += p.coeff;
        });

        if (a === 0) return;
        const discriminant = (b * b) - (4 * a * constant);
        const hasRealSolutions = discriminant >= 0;
        const targetColor = hasRealSolutions ? opponent : activePlayer;
        const removeList = [];
        fullChain.forEach(pos => {
            if (board[`${pos.r},${pos.c}`].p === targetColor) removeList.push(pos);
        });

        detected.push({
            coords: fullChain,
            remove: removeList,
            isSuccess: hasRealSolutions,
            polyStr: `${a}x^2 + ${b}x + ${constant}`,
            phase: 'IDENTIFY',
            startTime: performance.now()
        });
    });
    return detected;
}

export function checkGameEnd(board) {
    let redPieces = 0;
    let bluePieces = 0;
    let hasQuad = false;
    let hasLinear = false;
    for (let key in board) {
        const p = board[key];
        const parsed = parseTerm(p.term);

        if (p.p === 1) {
            redPieces++;
            if (parsed.degree === 2) { hasQuad = true; }
            else if (parsed.degree === 1) { hasLinear = true; }
        } else {
            bluePieces++;
            if (parsed.degree === 2) { hasQuad = true; }
            else if (parsed.degree === 1) { hasLinear = true; }
        }
    }

    // 1. WIN CONDITIONS
    if (redPieces === 0 && bluePieces === 0) return { status: "DRAW", reason: "Mutual Destruction! Both armies eliminated simultaneously." };
    if (redPieces === 0) return { status: "WIN_BLUE", reason: "All Red pieces eliminated!" };
    if (bluePieces === 0) return { status: "WIN_RED", reason: "All Blue pieces eliminated!" };

    // 2. DRAW CONDITIONS
    if (!hasQuad) return { status: "DRAW", reason: "No Quadratic terms left. Impossible to form equations." };

    // B. Impossible Solution (Only x^2 and Constants with same sign)
    if (!hasLinear) {
        let allQuadsPos = true;
        let allQuadsNeg = true;
        let allConstPos = true;
        let allConstNeg = true;

        for (let key in board) {
            const p = board[key];
            const parsed = parseTerm(p.term);
            const sign = Math.sign(parsed.coeff);

            if (parsed.degree === 2) {
                if (sign < 0) allQuadsPos = false;
                if (sign > 0) allQuadsNeg = false;
            } else if (parsed.degree === 0) {
                if (sign < 0) allConstPos = false;
                if (sign > 0) allConstNeg = false;
            }
        }

        if ((allQuadsPos && allConstPos) || (allQuadsNeg && allConstNeg)) {
            return { status: "DRAW", reason: "Analysis: Only same-sign terms left. Real solutions impossible." };
        }
    }

    return { status: "PLAYING", reason: "" };
}
