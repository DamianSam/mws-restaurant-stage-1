if (typeof idb === 'undefined') {
  self.importScripts('assets/static/js/idb.js');
}

const staticCacheName = 'restaurant-app-v3';

const dbPromise = idb.open('mws-restaurant-db', 1, upgradeDB => {
  let dbStore = upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
});

/**
 * Install Service Worker and cache assets
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then( cache => {
      return cache.addAll([
        '/',
        '/restaurant.html',
        '/assets/css/styles.css',
        '/assets/static/js/main.js',
        '/assets/static/js/restaurant_info.js',
        '/assets/static/js/dbhelper.js',
        '/assets/img/1.jpg',
        '/assets/img/1-440w.jpg',
        '/assets/img/2.jpg',
        '/assets/img/2-440w.jpg',
        '/assets/img/3.jpg',
        '/assets/img/3-440w.jpg',
        '/assets/img/4.jpg',
        '/assets/img/4-440w.jpg',
        '/assets/img/5.jpg',
        '/assets/img/5-440w.jpg',
        '/assets/img/6.jpg',
        '/assets/img/6-440w.jpg',
        '/assets/img/7.jpg',
        '/assets/img/7-440w.jpg',
        '/assets/img/8.jpg',
        '/assets/img/8-440w.jpg',
        '/assets/img/9.jpg',
        '/assets/img/9-440w.jpg',
        '/assets/img/10.jpg',
        '/assets/img/10-440w.jpg'
      ])
    })
  );
});

/**
 * Activate Service Worker and refresh cache
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then( cacheNames => {
      return Promise.all(
        cacheNames.filter( cacheName => {
          return cacheName.startsWith('restaurant-app-') &&
                 cacheName != staticCacheName;
        }).map( cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});


/**
 * Fetch requests from cache after interception
 */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if ( url.origin === location.origin ) {
    if ( url.pathname === '/' ) {
      event.respondWith(caches.match('/'));
      return;
    }

    if ( url.pathname.startsWith( '/restaurant.html' ) ) {
      event.respondWith(caches.match('/restaurant.html'));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
