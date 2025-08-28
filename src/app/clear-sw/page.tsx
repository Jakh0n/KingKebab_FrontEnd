'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { clearAllCaches, unregisterServiceWorkers } from '@/lib/utils'
import { useState } from 'react'

export default function ClearSWPage() {
	const [isLoading, setIsLoading] = useState(false)
	const [message, setMessage] = useState('')

	const handleClear = async () => {
		setIsLoading(true)
		setMessage('')

		try {
			await unregisterServiceWorkers()
			await clearAllCaches()
			setMessage(
				'Service workers unregistered and caches cleared successfully! Please refresh the page.'
			)
		} catch (error) {
			console.error('Error:', error)
			setMessage('Error clearing service workers and caches.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='min-h-screen bg-gray-900 flex items-center justify-center p-4'>
			<Card className='w-full max-w-md p-6 bg-gray-800 border-gray-700'>
				<div className='text-center space-y-4'>
					<h1 className='text-2xl font-bold text-white'>
						Service Worker Debug
					</h1>
					<p className='text-gray-400'>
						This page helps clear service workers and caches if you're
						experiencing issues.
					</p>

					<Button
						onClick={handleClear}
						disabled={isLoading}
						variant='destructive'
						className='w-full'
					>
						{isLoading ? 'Clearing...' : 'Clear Service Workers & Cache'}
					</Button>

					{message && (
						<div
							className={`p-3 rounded-lg text-sm ${
								message.includes('Error')
									? 'bg-red-500/10 text-red-400 border border-red-500/20'
									: 'bg-green-500/10 text-green-400 border border-green-500/20'
							}`}
						>
							{message}
						</div>
					)}

					<div className='text-xs text-gray-500 space-y-1'>
						<p>After clearing, refresh the page to see changes.</p>
						<p>This will remove all cached data and service workers.</p>
					</div>
				</div>
			</Card>
		</div>
	)
}
