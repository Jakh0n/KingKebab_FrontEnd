'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
	useEffect(() => {
		if ('serviceWorker' in navigator) {
			// Unregister any existing service workers first
			navigator.serviceWorker
				.getRegistrations()
				.then(registrations => {
					registrations.forEach(registration => {
						registration.unregister()
					})
				})
				.then(() => {
					// Register the improved service worker
					window.addEventListener('load', () => {
						navigator.serviceWorker
							.register('/sw.js', {
								updateViaCache: 'none',
							})
							.then(registration => {
								console.log('SW registered: ', registration)
							})
							.catch(registrationError => {
								console.log('SW registration failed: ', registrationError)
							})
					})
				})
		}
	}, [])

	return null
}
