// landing.js
// Handles opening/closing the play modal and loading the iframe
(function () {
    function init() {
        var openBtn = document.getElementById('open-play');
        var overlay = document.getElementById('playModal');
        var iframe = document.getElementById('playFrame');

        if (!openBtn || !overlay || !iframe) return;

        function openPopup() {
            // on mobile, open a dedicated mobile page (now at game.html) instead of a popup
            var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.matchMedia('(max-width:640px)').matches;
            if (isMobile) {
                window.location.href = 'game.html';
                return;
            }
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
            // load the compact embed page (only the canvas)
            iframe.src = 'embed.html';
            // compute and apply scale so the canvas fits on small viewports
            applyScale();
            // Some mobile browsers change viewport after opening (address bar hide/show)
            // recalc after a short delay to ensure scale is correct
            setTimeout(applyScale, 200);
            // recalc after orientation change (iPhone Safari hides address bar differently)
            window.addEventListener('orientationchange', applyScale);
            // update scale on resize while open
            window.addEventListener('resize', applyScale);
            document.body.style.overflow = 'hidden';
        }

        function closePopup() {
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
            iframe.src = 'about:blank';
            document.body.style.overflow = '';
            window.removeEventListener('resize', applyScale);
            window.removeEventListener('orientationchange', applyScale);
            document.documentElement.style.setProperty('--play-popup-scale', 1);
        }

        function applyScale() {
            // desired canvas size
            var cw = 560, ch = 700;
            var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            // read overlay padding to avoid touching edges
            var style = window.getComputedStyle(overlay);
            var padX = (parseFloat(style.paddingLeft) || 16) + (parseFloat(style.paddingRight) || 16);
            var padY = (parseFloat(style.paddingTop) || 16) + (parseFloat(style.paddingBottom) || 16);
            var availableW = Math.max(0, vw - padX);
            var availableH = Math.max(0, vh - padY);

            // prefer width-fitting on narrow/portrait viewports
            var isPortrait = vh >= vw;
            var scale;
            if (isPortrait || vw < cw) {
                scale = Math.min(1, availableW / cw);
            } else {
                scale = Math.min(1, availableW / cw, availableH / ch);
            }

            if (!isFinite(scale) || scale <= 0) scale = 1;
            document.documentElement.style.setProperty('--play-popup-scale', scale);
        }

        openBtn.addEventListener('click', function (e) { e.preventDefault(); openPopup(); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) closePopup(); });

        // allow the play iframe to request closing via postMessage
        window.addEventListener('message', function (ev) { if (ev.data === 'closePlayPopup') closePopup(); });

        // Animation logic moved to assets/js/landing/animation.js
        // Conflicting setInterval removed.
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
