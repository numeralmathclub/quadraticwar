export class Input {
    constructor(canvas, listener) {
        this.canvas = canvas;
        this.listener = listener; // The Game instance or an object with onPointerDown, onKeyDown methods

        this.setupListeners();
    }

    setupListeners() {
        this.canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            if (this.listener.onPointerDown) {
                this.listener.onPointerDown(x, y);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            if (this.listener.onMouseMove) {
                this.listener.onMouseMove(x, y);
            }
        });

        // Determine hiddenInput element if passed, otherwise try to find it
        const hiddenInput = document.getElementById('hiddenInput');
        if (hiddenInput) {
            hiddenInput.addEventListener('input', (e) => {
                if (this.listener.onInput) {
                    this.listener.onInput(e.target.value);
                }
            });

            hiddenInput.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace') {
                    if (this.listener.onKeyDown) {
                        this.listener.onKeyDown(e.key);
                    }
                } else if (e.key === 'Enter') {
                    if (this.listener.onKeyDown) {
                        this.listener.onKeyDown(e.key);
                    }
                }
            });
        }

        window.addEventListener('keydown', (e) => {
            if (this.listener.onGlobalKeyDown) {
                this.listener.onGlobalKeyDown(e);
            }
        });
    }
}
