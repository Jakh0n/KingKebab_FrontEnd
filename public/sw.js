const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'

const urlsToCache = [
	'/',
	'/login',
	'/register',
	'/crown.jpg',
	'/favicon.ico',
	'/apple-touch-icon.png',
	'/manifest.json',
]

// Install event
self.addEventListener('install', event => {
	event.waitUntil(
		Promise.all([
			caches.open(STATIC_CACHE).then(cache => cache.addAll(urlsToCache)),
			caches.open(DYNAMIC_CACHE),
		])
	)
})

// Fetch event
self.addEventListener('fetch', event => {
	const { request } = event
	const url = new URL(request.url)

	// Skip service worker for navigation requests to avoid routing issues
	if (request.mode === 'navigate') {
		// For navigation requests, let the browser handle them normally
		return
	}

	// Handle API requests
	if (url.pathname.startsWith('/api/')) {
		event.respondWith(
			fetch(request).catch(() => {
				return new Response(JSON.stringify({ error: 'Network error' }), {
					status: 503,
					headers: { 'Content-Type': 'application/json' },
				})
			})
		)
		return
	}

	// Handle static assets
	if (
		request.destination === 'image' ||
		request.destination === 'style' ||
		request.destination === 'script'
	) {
		event.respondWith(
			caches.match(request).then(response => {
				return (
					response ||
					fetch(request)
						.then(fetchResponse => {
							// Cache successful responses
							if (fetchResponse.status === 200) {
								const responseToCache = fetchResponse.clone()
								caches.open(STATIC_CACHE).then(cache => {
									cache.put(request, responseToCache)
								})
							}
							return fetchResponse
						})
						.catch(() => {
							// Return fallback for images
							if (request.destination === 'image') {
								return caches.match('/crown.jpg')
							}
							return new Response('Asset not available', { status: 404 })
						})
				)
			})
		)
		return
	}

	// For other requests, try network first, then cache
	event.respondWith(
		fetch(request)
			.then(response => {
				// Cache successful responses
				if (response.status === 200) {
					const responseToCache = response.clone()
					caches.open(DYNAMIC_CACHE).then(cache => {
						cache.put(request, responseToCache)
					})
				}
				return response
			})
			.catch(() => {
				// Fallback to cache
				return caches.match(request)
			})
	)
})

// Activate event
self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames.map(cacheName => {
					if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
						return caches.delete(cacheName)
					}
				})
			)
		})
	)
})
