const CACHE_NAME = 'quadratic-war-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './game.html',
  './embed.html',
  './manifest.json',
  './assets/css/game.css',
  './assets/css/landing.css',
  './assets/css/embed.css',
  './assets/css/mobile.css',
  './assets/js/landing/landing.js',
  './assets/js/game/core/AI.js',
  './assets/js/game/core/Game.js',
  './assets/js/game/core/Rules.js',
  './assets/js/game/input/Input.js',
  './assets/js/game/utils/Constants.js',
  './assets/js/game/main.js',
  './assets/js/game/view/Renderer.js',
  './assets/js/game/view/UI.js',
  './assets/js/game/services/Network.js',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
