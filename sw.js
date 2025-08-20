// AI Terminal Tutor Service Worker
const CACHE_NAME = 'ai-terminal-tutor-v1.2.0';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Resources to cache immediately
const STATIC_RESOURCES = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/lessons.css',
    '/js/main.js',
    '/js/lesson-manager.js',
    '/js/terminal-simulator.js',
    '/lessons.json',
    '/lessons/',
    '/lessons/index.html',
    // Add lesson files
    '/lessons/01-zsh-basics.html',
    '/lessons/02-oh-my-zsh.html',
    '/lessons/03-tmux-basics.html',
    '/lessons/04-tmux-workflows.html',
    '/lessons/05-search-tools.html',
    '/lessons/06-productivity-tools.html',
    '/lessons/07-neovim-basics.html',
    '/lessons/08-neovim-ai-setup.html',
    '/lessons/09-cloud-ai-tools.html',
    '/lessons/10-ai-monitoring.html',
    '/lessons/11-automation-scripts.html',
    '/lessons/12-advanced-integration.html'
];

// Resources to cache on request
const DYNAMIC_RESOURCES = [
    // CDN resources
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching static resources...');
                // Add timestamp to track cache freshness
                cache.put('__cache_timestamp__', new Response(JSON.stringify({
                    timestamp: Date.now(),
                    version: CACHE_NAME
                })));
                return cache.addAll(STATIC_RESOURCES);
            })
            .then(() => self.skipWaiting())
            .catch(error => {
                console.error('Service Worker: Failed to cache static resources:', error);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // Handle different types of requests
    if (isStaticResource(request)) {
        event.respondWith(handleStaticResource(request));
    } else if (isDynamicResource(request)) {
        event.respondWith(handleDynamicResource(request));
    } else if (isAPIRequest(request)) {
        event.respondWith(handleAPIRequest(request));
    } else {
        // For other requests, try cache first, then network
        event.respondWith(handleGenericRequest(request));
    }
});

// Check if request is for a static resource
function isStaticResource(request) {
    const url = new URL(request.url);
    return STATIC_RESOURCES.some(resource => 
        url.pathname === resource || 
        url.pathname.startsWith(resource)
    );
}

// Check if request is for a dynamic resource (CDN)
function isDynamicResource(request) {
    const url = new URL(request.url);
    return DYNAMIC_RESOURCES.some(resource => 
        request.url.startsWith(resource)
    );
}

// Check if request is for API data
function isAPIRequest(request) {
    const url = new URL(request.url);
    return url.pathname.includes('/api/') || 
           url.pathname.endsWith('.json') ||
           url.searchParams.has('api');
}

// Handle static resources (cache first)
async function handleStaticResource(request) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse && await isCacheFresh()) {
            return cachedResponse;
        }
        
        // Fetch from network and update cache
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
        
    } catch (error) {
        console.error('Service Worker: Static resource error:', error);
        
        // Try to return cached version as fallback
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page if available
        return await getOfflineFallback(request);
    }
}

// Handle dynamic resources (network first, cache fallback)
async function handleDynamicResource(request) {
    try {
        const networkResponse = await fetch(request, {
            mode: 'cors',
            credentials: 'omit'
        });
        
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache for:', request.url);
        
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Handle API requests (network first)
async function handleAPIRequest(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful API responses for a short time
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        // Try cached version for API requests
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Handle generic requests
async function handleGenericRequest(request) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            // Return cached version while fetching updated version
            fetch(request).then(networkResponse => {
                if (networkResponse.ok) {
                    cache.put(request, networkResponse.clone());
                }
            }).catch(() => {
                // Silently fail network update
            });
            
            return cachedResponse;
        }
        
        // No cache, fetch from network
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        return await getOfflineFallback(request);
    }
}

// Check if cache is still fresh
async function isCacheFresh() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const timestampResponse = await cache.match('__cache_timestamp__');
        
        if (!timestampResponse) {
            return false;
        }
        
        const data = await timestampResponse.json();
        const age = Date.now() - data.timestamp;
        
        return age < CACHE_EXPIRY;
    } catch (error) {
        return false;
    }
}

// Get offline fallback response
async function getOfflineFallback(request) {
    const url = new URL(request.url);
    
    // For HTML pages, return a generic offline page
    if (request.headers.get('accept')?.includes('text/html')) {
        return new Response(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Offline - AI Terminal Tutor</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        background: #1a1a1a;
                        color: #e0e0e0;
                        text-align: center;
                        padding: 20px;
                    }
                    .offline-container {
                        max-width: 500px;
                    }
                    .offline-icon {
                        font-size: 4rem;
                        margin-bottom: 1rem;
                    }
                    .offline-title {
                        font-size: 1.5rem;
                        margin-bottom: 1rem;
                        color: #ffffff;
                    }
                    .offline-message {
                        margin-bottom: 2rem;
                        line-height: 1.6;
                    }
                    .retry-button {
                        background: #0d6efd;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 1rem;
                    }
                    .retry-button:hover {
                        background: #0b5ed7;
                    }
                </style>
            </head>
            <body>
                <div class="offline-container">
                    <div class="offline-icon">📡</div>
                    <h1 class="offline-title">You're offline</h1>
                    <p class="offline-message">
                        It looks like you're not connected to the internet. 
                        Some features may not be available until you reconnect.
                    </p>
                    <button class="retry-button" onclick="window.location.reload()">
                        Try Again
                    </button>
                </div>
            </body>
            </html>
        `, {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache'
            }
        });
    }
    
    // For other resources, return a basic error response
    return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache'
        }
    });
}

// Background sync for user progress
self.addEventListener('sync', event => {
    if (event.tag === 'sync-progress') {
        event.waitUntil(syncUserProgress());
    }
});

// Sync user progress when back online
async function syncUserProgress() {
    try {
        // Get pending progress updates from IndexedDB or localStorage
        const clients = await self.clients.matchAll();
        
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_PROGRESS',
                data: 'Background sync initiated'
            });
        });
        
    } catch (error) {
        console.error('Service Worker: Failed to sync progress:', error);
    }
}

// Handle push notifications (for future use)
self.addEventListener('push', event => {
    const options = {
        body: 'Check out new lessons in AI Terminal Tutor!',
        icon: '/assets/icon-192x192.png',
        badge: '/assets/badge-72x72.png',
        tag: 'ai-terminal-tutor',
        data: {
            url: '/'
        },
        actions: [
            {
                action: 'view',
                title: 'View Lessons',
                icon: '/assets/action-view.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/assets/action-dismiss.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('AI Terminal Tutor', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            self.clients.openWindow(event.notification.data.url || '/')
        );
    }
});

// Message handling from main thread
self.addEventListener('message', event => {
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
                
            case 'GET_CACHE_STATUS':
                event.ports[0].postMessage({
                    cached: true,
                    version: CACHE_NAME
                });
                break;
                
            case 'CLEAR_CACHE':
                clearAllCaches().then(() => {
                    event.ports[0].postMessage({ success: true });
                });
                break;
        }
    }
});

// Clear all caches
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(
        cacheNames.map(name => caches.delete(name))
    );
}

// Periodic cache cleanup
self.addEventListener('periodicsync', event => {
    if (event.tag === 'cache-cleanup') {
        event.waitUntil(cleanupOldCaches());
    }
});

async function cleanupOldCaches() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        
        // Remove entries older than cache expiry
        const now = Date.now();
        const promises = keys.map(async request => {
            const response = await cache.match(request);
            const date = new Date(response.headers.get('date') || 0);
            
            if (now - date.getTime() > CACHE_EXPIRY) {
                return cache.delete(request);
            }
        });
        
        await Promise.all(promises);
        console.log('Service Worker: Cache cleanup completed');
        
    } catch (error) {
        console.error('Service Worker: Cache cleanup failed:', error);
    }
}