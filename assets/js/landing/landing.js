// landing.js
// Handles opening/closing the play modal and loading the iframe
(function () {
    function init() {
        var dropdown = document.querySelector('.dropdown');
        var dropdownToggle = document.querySelector('.dropdown-toggle');
        var dropdownItems = document.querySelectorAll('.dropdown-item');

        var overlay = document.getElementById('playModal');
        var iframe = document.getElementById('playFrame');

        // Rules UI
        var rulesBtn = document.getElementById('open-rules');
        var rulesModal = document.getElementById('rulesModal');
        var closeRulesBtn = document.getElementById('closeRules');

        if (!overlay || !iframe) return;

        // Toggle Dropdown
        dropdownToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });

        function openGamePopup(mode) {
            // on mobile, open dedicated page with params
            var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.matchMedia('(max-width:640px)').matches;
            var targetUrl = 'game.html';
            var embedUrl = 'embed.html';

            if (mode) {
                targetUrl += '?mode=' + mode;
                embedUrl += '?mode=' + mode;
            }

            if (isMobile) {
                window.location.href = targetUrl;
                return;
            }

            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');

            iframe.src = embedUrl;

            applyScale();
            setTimeout(applyScale, 200);
            window.addEventListener('orientationchange', applyScale);
            window.addEventListener('resize', applyScale);
            document.body.style.overflow = 'hidden';

            // Close dropdown if open
            dropdown.classList.remove('open');
        }

        function applyScale() {
            if (!overlay.classList.contains('open')) return;

            // Base dimensions of the game board
            var baseWidth = 560;
            var baseHeight = 750;

            // Available space (with some padding)
            var availableWidth = window.innerWidth * 0.95;
            var availableHeight = window.innerHeight * 0.95;

            var scaleX = availableWidth / baseWidth;
            var scaleY = availableHeight / baseHeight;

            // Use the smaller scale to ensure it fits both dimensions
            var scale = Math.min(scaleX, scaleY, 1); // max scale 1

            document.documentElement.style.setProperty('--play-popup-scale', scale);
        }

        // Handle Dropdown Items
        dropdownItems.forEach(function (item) {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                var mode = this.getAttribute('data-mode');
                openGamePopup(mode);
            });
        });

        function closePopup() {
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
            iframe.src = 'about:blank';
            document.body.style.overflow = '';
            window.removeEventListener('resize', applyScale);
            window.removeEventListener('orientationchange', applyScale);
            document.documentElement.style.setProperty('--play-popup-scale', 1);
        }

        // --- Rules Modal Logic ---
        function openRules() {
            rulesModal.classList.add('open');
            rulesModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        function closeRules() {
            rulesModal.classList.remove('open');
            rulesModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        if (rulesBtn) rulesBtn.addEventListener('click', function (e) { e.preventDefault(); openRules(); });
        if (closeRulesBtn) closeRulesBtn.addEventListener('click', closeRules);

        // General modal close on background click
        overlay.addEventListener('click', function (e) { if (e.target === overlay) closePopup(); });
        rulesModal.addEventListener('click', function (e) { if (e.target === rulesModal) closeRules(); });

        // allow the play iframe to request closing via postMessage
        window.addEventListener('message', function (ev) { if (ev.data === 'closePlayPopup') closePopup(); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
