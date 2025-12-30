/**
 * Quadratic War - Landing Page Animation Controller
 * 
 * Manages the 4-step turn-based animation on the landing page hero section.
 * Handles the "Rewind Glitch" by temporarily disabling transitions when looping back to start.
 */

class QuadraticAnimation {
    constructor() {
        this.card = document.getElementById('demo-card');
        this.currentStep = 1;
        this.timer = null;

        // Timing Configuration (ms)
        this.timing = {
            STEP_1: 1500, // Ready Position
            STEP_2: 1500, // Blue Moves
            STEP_3: 3000, // Red Moves & Equation Read Time
            STEP_4: 2000, // Resolution Fade Out
            RESET_DELAY: 50 // Time to wait for DOM reflow during reset
        };

        if (this.card) {
            this.init();
        }
    }

    init() {
        console.log("QuadraticAnimation: Initialized");
        this.startLoop();
    }

    startLoop() {
        // Start the cycle
        this.queueNextStep(this.timing.STEP_1);
    }

    queueNextStep(delay) {
        this.timer = setTimeout(() => this.advance(), delay);
    }

    advance() {
        const nextStep = this.currentStep + 1;

        if (nextStep > 4) {
            // Loop finished (4 -> 1)
            this.handleLoopReset();
        } else {
            // Normal Step Progression (1 -> 2 -> 3 -> 4)
            this.setStep(nextStep);

            // Determine delay for the *next* move based on the *new* step
            let delay;
            switch (nextStep) {
                case 2: delay = this.timing.STEP_2; break;
                case 3:
                    // IMPACT: Trigger shake when Red slams
                    this.triggerShake();
                    delay = this.timing.STEP_3;
                    break;
                case 4: delay = this.timing.STEP_4; break;
            }
            this.queueNextStep(delay);
        }
    }

    triggerShake() {
        this.card.classList.add('shake');
        setTimeout(() => this.card.classList.remove('shake'), 400); // 400ms duration matches CSS
    }

    setStep(step) {
        this.currentStep = step;
        this.card.setAttribute('data-step', step);
    }

    /**
     * seamlessly resets the animation from Step 4 to Step 1
     * prevents visual "rewinding" by disabling CSS transitions momentarily
     */
    handleLoopReset() {
        // 1. Add class to disable transitions
        this.card.classList.add('anim-reset');

        // 2. Snap back to Step 1 positions instantly (because transition is off)
        this.setStep(1);

        // 3. Force a Reflow/Repaint so the browser registers the position change *without* transition
        void this.card.offsetWidth;

        // 4. Remove the disable-transition class
        // We use a tiny timeout to ensure the "Snap" has processed
        setTimeout(() => {
            this.card.classList.remove('anim-reset');

            // 5. Restart the loop timer
            this.queueNextStep(this.timing.STEP_1);
        }, this.timing.RESET_DELAY);
    }
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new QuadraticAnimation();
});
