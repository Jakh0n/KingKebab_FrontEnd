import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

// Utility function to unregister service workers (useful for debugging)
export async function unregisterServiceWorkers() {
	if ('serviceWorker' in navigator) {
		const registrations = await navigator.serviceWorker.getRegistrations()
		for (const registration of registrations) {
			await registration.unregister()
		}
		console.log('All service workers unregistered')
	}
}

// Utility function to clear all caches
export async function clearAllCaches() {
	if ('caches' in window) {
		const cacheNames = await caches.keys()
		await Promise.all(cacheNames.map(name => caches.delete(name)))
		console.log('All caches cleared')
	}
}
