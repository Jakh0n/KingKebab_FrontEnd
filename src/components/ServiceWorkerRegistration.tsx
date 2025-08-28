'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
	useEffect(() => {
		if ('serviceWorker' in navigator) {
			// Unregister existing service workers in development
			if (process.env.NODE_ENV === 'development') {
				navigator.serviceWorker.getRegistrations().then(registrations => {
					registrations.forEach(registration => {
						registration.unregister()
					})
				})
			}

			window.addEventListener('load', () => {
				navigator.serviceWorker
					.register('/sw.js', {
						updateViaCache: 'none',
					})
					.then(registration => {
						console.log('SW registered: ', registration)

						// Handle service worker updates
						registration.addEventListener('updatefound', () => {
							const newWorker = registration.installing
							if (newWorker) {
								newWorker.addEventListener('statechange', () => {
									if (
										newWorker.state === 'installed' &&
										navigator.serviceWorker.controller
									) {
										// New service worker available
										console.log('New service worker available')
									}
								})
							}
						})

						// Handle service worker errors
						registration.addEventListener('error', error => {
							console.error('Service worker error:', error)
						})
					})
					.catch(registrationError => {
						console.log('SW registration failed: ', registrationError)
					})
			})
		}
	}, [])

	return null
}
