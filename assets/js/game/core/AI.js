import { getValidMoves, executeMove } from './Rules.js';

export function makeBestMove(board, player) {
    let allMoves = [];
    for (let key in board) {
        if (board[key].p === player) {
            const [r, c] = key.split(',').map(Number);
            const moves = getValidMoves(board, r, c, player);
            moves.forEach(m => {
                allMoves.push({ start: { r, c }, end: { r: m.r, c: m.c } });
            });
        }
    }

    if (allMoves.length === 0) {
        return null; // No moves available
    }

    let bestScore = -Infinity;
    let candidates = [];

    // Create a shallow copy of board for simulation.
    // Since board uses string keys and we treat values as immutable during move or replace them, shallow copy suffices.

    allMoves.forEach(move => {
        let score = 0;
        // Simulation
        const result = executeMove(board, move, player);
        if (!result.success) return; // Should not happen with valid moves

        const equations = result.equations;

        // Score Calculation
        if (equations.length > 0) {
            equations.forEach(eq => {
                if (eq.isSuccess) score += 100 + (eq.remove.length * 10);
                else score -= 1000;
            });
        } else {
            // Heuristic: Advance forward, prefer center
            // Player 1 (Red) moves 'down' (increasing Row index).
            score += (move.end.r - move.start.r) * 2;
            if (move.end.c > 2 && move.end.c < 5) score += 1;
            score += Math.random();
        }

        if (score > bestScore) {
            bestScore = score; candidates = [move];
        } else if (score === bestScore) {
            candidates.push(move);
        }
    });

    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
}
