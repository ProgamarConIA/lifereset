const CACHE_NAME = 'life-reset-v1'
const STATIC_CACHE = [
  '/',
  '/tasks',
  '/habits',
  '/calendar',
  '/notes',
  '/stats',
  '/settings',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE).catch(() => {
        // Ignore errors for individual URLs
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and Supabase API calls
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('supabase.co')
  ) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Return cached version on network failure
        return caches.match(event.request).then((cached) => {
          if (cached) return cached
          return new Response('Offline - Please reconnect', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          })
        })
      })
  )
})
