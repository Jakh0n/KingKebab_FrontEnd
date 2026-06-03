'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
	useEffect(() => {
		if (!('serviceWorker' in navigator)) return
		if (process.env.NODE_ENV !== 'production') return

		const register = () => {
			navigator.serviceWorker
				.register('/sw.js', { scope: '/' })
				.catch(() => {
					// Swallow registration errors; PWA install will fall back to manual instructions.
				})
		}

		if (document.readyState === 'complete') {
			register()
		} else {
			window.addEventListener('load', register, { once: true })
		}
	}, [])

	return null
}
