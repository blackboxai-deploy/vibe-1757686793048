const CACHE_NAME = 'chatapp-v1.0.0';
const STATIC_CACHE = 'chatapp-static-v1.0.0';
const DYNAMIC_CACHE = 'chatapp-dynamic-v1.0.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
];

// Resources to cache on demand
const CACHE_PATTERNS = [
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff2?)$/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { url, method } = request;

  // Only handle GET requests
  if (method !== 'GET') {
    return;
  }

  // Skip WebSocket and Socket.IO requests
  if (url.includes('/socket.io/') || 
      url.includes('/api/socket') ||
      url.includes('ws://') || 
      url.includes('wss://')) {
    return;
  }

  // API requests - network first, cache as fallback
  if (url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful GET responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if available
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline page for API failures
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // Static assets and pages - cache first, network as fallback
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Check if we should cache this response
            const shouldCache = CACHE_PATTERNS.some(pattern => pattern.test(url)) ||
                               url === self.location.origin + '/';

            if (shouldCache && response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // Return a placeholder for images
            if (request.destination === 'image') {
              return new Response('', { status: 204 });
            }

            throw error;
          });
      })
  );
});

// Background sync for offline messages (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-messages') {
    console.log('Background sync: messages');
    event.waitUntil(syncOfflineMessages());
  }
});

// Push notifications (if supported)
self.addEventListener('push', (event) => {
  console.log('Push message received');
  
  let notificationData = {
    title: 'New Message',
    body: 'You have a new message in ChatApp',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'chat-message',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open Chat',
        icon: '/icons/open.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss.png'
      }
    ]
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  const { action, notification } = event;
  
  event.notification.close();

  if (action === 'open' || !action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // If a window is already open, focus it
          for (const client of clientList) {
            if (client.url.includes('/') && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Otherwise open a new window
          if (self.clients.openWindow) {
            return self.clients.openWindow('/');
          }
        })
    );
  }
});

// Message handling from the main thread
self.addEventListener('message', (event) => {
  const { type, title, body } = event.data;
  
  if (type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      tag: 'app-notification'
    });
  }
});

// Utility function to sync offline messages
async function syncOfflineMessages() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const offlineMessages = await cache.match('/offline-messages');
    
    if (offlineMessages) {
      const messages = await offlineMessages.json();
      
      // Send each message to the server
      for (const message of messages) {
        try {
          await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
          });
        } catch (error) {
          console.error('Failed to sync message:', error);
        }
      }
      
      // Clear offline messages after successful sync
      await cache.delete('/offline-messages');
      console.log('Offline messages synced successfully');
    }
  } catch (error) {
    console.error('Failed to sync offline messages:', error);
  }
}

console.log('Service Worker loaded');