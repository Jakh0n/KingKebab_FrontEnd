// Clean Telegram notification utility for frontend

const BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
// Note: Direct Telegram calls removed due to CORS - using backend proxy instead

interface TimeEntryData {
	user: {
		username: string
		employeeId?: string
	}
	date: string
	startTime: string
	endTime: string
	hours: number
	overtimeReason?: string | null
	responsiblePerson?: string
}

// Direct Telegram messaging removed due to CORS issues
// All notifications now go through backend proxy at /api/notify/telegram

/**
 * Send time entry notification to all admins
 */
export async function notifyTimeEntry(
	data: TimeEntryData,
	action: 'added' | 'updated' = 'added'
): Promise<void> {
	// Create simple message
	const message = `🔔 Time Entry ${action}

Employee: ${data.user.username}
Date: ${new Date(data.date).toLocaleDateString()}
Start: ${new Date(data.startTime).toLocaleTimeString().slice(0, 5)}
End: ${new Date(data.endTime).toLocaleTimeString().slice(0, 5)}
Hours: ${data.hours}h${
		data.overtimeReason ? `\nOvertime: ${data.overtimeReason}` : ''
	}`

	// Use backend proxy to avoid CORS issues
	try {
		console.log('📤 Sending via backend proxy...')

		const token = localStorage.getItem('token')
		if (!token) {
			console.warn('❌ No auth token found')
			return
		}

		const response = await fetch(
			`${
				process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
			}/notify/telegram`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					message,
					user: data.user,
				}),
			}
		)

		const result = await response.json()

		if (result.success) {
			console.log('✅ Telegram notifications sent via backend:', result.message)
		} else {
			console.error('❌ Backend notification failed:', result.message)
		}
	} catch (error) {
		console.error('❌ Failed to send via backend:', error)
	}
}

/**
 * Test Telegram connection
 */
export async function testTelegram(): Promise<boolean> {
	if (!BOT_TOKEN) {
		console.error('❌ Telegram bot token not configured')
		return false
	}

	try {
		const response = await fetch(
			`https://api.telegram.org/bot${BOT_TOKEN}/getMe`
		)
		const result = await response.json()

		if (result.ok) {
			console.log('✅ Telegram bot connected:', result.result.username)
			return true
		} else {
			console.error('❌ Telegram bot connection failed:', result)
			return false
		}
	} catch (error) {
		console.error('❌ Telegram connection error:', error)
		return false
	}
}
