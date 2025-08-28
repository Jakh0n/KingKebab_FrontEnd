'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
	useEffect(() => {
		// Completely disable service worker to fix routing issues
		if ('serviceWorker' in navigator) {
			// Unregister ALL existing service workers
			navigator.serviceWorker.getRegistrations().then(registrations => {
				registrations.forEach(registration => {
					registration.unregister()
				})
			})
		}
	}, [])

	return null
}
