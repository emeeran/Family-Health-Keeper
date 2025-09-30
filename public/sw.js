/**
 * Service Worker for Family Health Keeper
 *
 * This service worker provides offline capabilities by caching static assets
 * and handling network requests for offline functionality.
 */

const CACHE_NAME = 'family-health-keeper-v1';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DATA_CACHE = `${CACHE_NAME}-data`;
const IMAGE_CACHE = `${CACHE_NAME}-images`;

// Cache URLs for static assets
const STATIC_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/', // Vite assets
];

// Cache URLs for API endpoints (if any)
const API_URLS = [
  // Add API endpoints here when implemented
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  CACHE_ONLY: 'cache-only',
  NETWORK_ONLY: 'network-only'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_URLS);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('family-health-keeper-') && cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle different request types
  if (url.origin === self.location.origin) {
    // Handle static assets
    if (STATIC_URLS.some(staticUrl => url.pathname.startsWith(staticUrl))) {
      event.respondWith(handleStaticRequest(event.request));
    }
    // Handle image requests
    else if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      event.respondWith(handleImageRequest(event.request));
    }
    // Handle other requests
    else {
      event.respondWith(handleFetchRequest(event.request));
    }
  }
});

// Handle static asset requests (Cache First strategy)
async function handleStaticRequest(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    const network = await fetch(request);
    if (network.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, network.clone());
    }
    return network;
  } catch (error) {
    console.error('Static request failed:', error);
    throw error;
  }
}

// Handle image requests (Cache First with expiration)
async function handleImageRequest(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      // Check if cached image is still valid (within 7 days)
      const dateHeader = cached.headers.get('date');
      if (dateHeader) {
        const cachedDate = new Date(dateHeader);
        const expirationDate = new Date(cachedDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        if (new Date() < expirationDate) {
          return cached;
        }
      }
    }

    const network = await fetch(request);
    if (network.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, network.clone());
    }
    return network;
  } catch (error) {
    console.error('Image request failed:', error);
    // Return a fallback image if available
    return new Response('', { status: 404 });
  }
}

// Handle general fetch requests (Network First strategy)
async function handleFetchRequest(request) {
  try {
    // Try network first
    const network = await fetch(request);
    if (network.ok) {
      // Cache successful responses
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, network.clone());
      return network;
    }

    // Fallback to cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Return offline response
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'No network connection available' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Fetch request failed:', error);

    // Try cache as fallback
    try {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }
    } catch (cacheError) {
      console.error('Cache fallback failed:', cacheError);
    }

    // Return offline response
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'No network connection available' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_URLS':
      cacheUrls(data.urls);
      break;

    case 'CLEAR_CACHE':
      clearCache(data.cacheName);
      break;

    case 'SYNC_COMPLETE':
      // Notify clients about sync completion
      notifyClients('SYNC_COMPLETE', data);
      break;

    case 'OFFLINE_STATUS':
      // Handle offline status updates
      break;

    default:
      console.warn('Service Worker: Unknown message type:', type);
  }
});

// Cache specific URLs
async function cacheUrls(urls) {
  try {
    const cache = await caches.open(DATA_CACHE);
    await cache.addAll(urls);
    console.log('Service Worker: Cached URLs:', urls);
  } catch (error) {
    console.error('Service Worker: Failed to cache URLs:', error);
  }
}

// Clear specific cache
async function clearCache(cacheName) {
  try {
    if (cacheName) {
      await caches.delete(cacheName);
      console.log('Service Worker: Cleared cache:', cacheName);
    } else {
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('Service Worker: Cleared all caches');
    }
  } catch (error) {
    console.error('Service Worker: Failed to clear cache:', error);
  }
}

// Notify all clients about events
function notifyClients(type, data) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      if (client.url.includes(self.location.origin)) {
        client.postMessage({ type, data });
      }
    });
  });
}

// Handle push notifications (if implemented later)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body || 'New notification',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Family Health Keeper', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    // Handle specific action clicks
    console.log('Notification action clicked:', event.action);
  } else {
    // Handle notification body click
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle background sync (if implemented)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      performBackgroundSync()
    );
  }
});

// Perform background sync operations
async function performBackgroundSync() {
  try {
    // Sync queued operations
    console.log('Service Worker: Performing background sync');

    // Get sync operations from IndexedDB
    // This would be implemented with actual sync logic

    console.log('Service Worker: Background sync completed');
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

// Unhandled promise rejection handling
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker: Script loaded');