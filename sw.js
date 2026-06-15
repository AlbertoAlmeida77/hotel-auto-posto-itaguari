const NOME_CACHE = 'api-hotel-v17';

const ARQUIVOS_CACHE = [
  './html/index.html',
  './html/login.html',
  './html/cadastro.html',
  './html/detalhes.html',
  './html/sobre.html',
  './html/quartos-publico.html',
  './html/reserva.html',
  './css/style.css',
  './js/inicio.js',
  './js/dados.js',
  './js/firebase-config.js',
  './js/biometria.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(NOME_CACHE).then(function (cache) {
      return cache.addAll(ARQUIVOS_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (evento) {
  evento.waitUntil(
    caches.keys().then(function (todosCaches) {
      return Promise.all(
        todosCaches.map(function (nomeCache) {
          if (nomeCache !== NOME_CACHE) return caches.delete(nomeCache);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (evento) {
  if (evento.request.method !== 'GET') return;

  evento.respondWith(
    caches.match(evento.request).then(function (respostaCache) {
      if (respostaCache) return respostaCache;

      return fetch(evento.request)
        .then(function (respostaRede) {
          if (respostaRede && respostaRede.status === 200 && respostaRede.type !== 'opaque') {
            const cacheClone = respostaRede.clone();
            caches.open(NOME_CACHE).then(function (cache) {
              cache.put(evento.request, cacheClone).catch(function () {});
            });
          }
          return respostaRede;
        })
        .catch(function () {
          return caches.match('./html/index.html');
        });
    })
  );
});
