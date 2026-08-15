const CACHE_NAME = 'minh-marcom-v33-half-tape';
const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './modern.css',
    './app-redesign.css',
    './script.js',
    './manifest.webmanifest',
    './assets/vendor/lucide.min.js',
    './assets/avatar.png',
    './assets/avatar-clean.png',
    './assets/background.jpg',
    './assets/icon facebook.png',
    './assets/icon zalo.png',
    './assets/icon threads.png',
    './assets/chatbot/minh-chatbot.png',
    './assets/QR-MINH BIO.png',
    './assets/projects/nabaden-app.png',
    './assets/projects/tayninh-app.png',
    './assets/projects/nuibaden-app.png',
    './assets/projects/natus-clean.png',
    './assets/projects/vicatra.jpg',
    './assets/projects/the-gioi-chay.webp',
    './assets/projects/riviu-asia.jpg',
    './assets/certificates/marketing-with-canva.png',
    './assets/certificates/canva-for-work.png',
    './assets/certificates/human-centered-design.png',
    './assets/certificates/ai-in-the-classroom.png',
    './assets/certificates/accredible-certificate.png',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/screenshots/home.png',
    './assets/screenshots/services.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);
    if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
                    return response;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return response;
        }))
    );
});
