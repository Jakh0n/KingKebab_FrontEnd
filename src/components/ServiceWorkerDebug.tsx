'use client'

import { Button } from '@/components/ui/button'
import { clearAllCaches, unregisterServiceWorkers } from '@/lib/utils'
import { useState } from 'react'

export function ServiceWorkerDebug() {
	const [isLoading, setIsLoading] = useState(false)

	const handleUnregister = async () => {
		setIsLoading(true)
		try {
			await unregisterServiceWorkers()
			await clearAllCaches()
			alert(
				'Service workers unregistered and caches cleared. Please refresh the page.'
			)
		} catch (error) {
			console.error('Error unregistering service workers:', error)
			alert('Error unregistering service workers')
		} finally {
			setIsLoading(false)
		}
	}

	// Only show in development
	if (process.env.NODE_ENV !== 'development') {
		return null
	}

	return (
		<div className='fixed bottom-4 right-4 z-50'>
			<Button
				onClick={handleUnregister}
				disabled={isLoading}
				variant='destructive'
				size='sm'
			>
				{isLoading ? 'Clearing...' : 'Clear SW & Cache'}
			</Button>
		</div>
	)
}
