import Game from './core/Game.js';

// Initialize Game once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // Check URL params for quick start
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');

    // Create Game Instance
    const game = new Game();

    if (mode) {
        if (mode === "PVP" || mode === "PVC") {
            game.startGame(mode);
        } else if (mode === "ONLINE") {
            game.gameState = "ONLINE_MENU";
        }
    } else {
        window.location.href = '/quadraticwar/';
    }

    // Expose for debugging
    window.game = game;
});
