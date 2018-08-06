const staticCacheName = 'restaurant-app-v2';

/**
 * Install Service Worker and cache assets
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then( cache => {
      return cache.addAll([
        '/',
        '/restaurant.html',
        '/css/styles.css',
        '/data/restaurants.json',
        '/js/main.js',
        '/js/restaurant_info.js',
        '/js/dbhelper.js',
        '/img/1.jpg',
        '/img/1-440w.jpg',
        '/img/2.jpg',
        '/img/2-440w.jpg',
        '/img/3.jpg',
        '/img/3-440w.jpg',
        '/img/4.jpg',
        '/img/4-440w.jpg',
        '/img/5.jpg',
        '/img/5-440w.jpg',
        '/img/6.jpg',
        '/img/6-440w.jpg',
        '/img/7.jpg',
        '/img/7-440w.jpg',
        '/img/8.jpg',
        '/img/8-440w.jpg',
        '/img/9.jpg',
        '/img/9-440w.jpg',
        '/img/10.jpg',
        '/img/10-440w.jpg'
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