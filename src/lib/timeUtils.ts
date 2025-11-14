// Time utility functions for the King Kebab application

export function formatDuration(startTime: string, endTime: string): string {
	const start = new Date(`2000-01-01T${startTime}:00`)
	const end = new Date(`2000-01-01T${endTime}:00`)

	// Handle overnight shifts
	let diff = end.getTime() - start.getTime()
	if (diff < 0) {
		diff += 24 * 60 * 60 * 1000 // Add 24 hours
	}

	const hours = Math.floor(diff / (1000 * 60 * 60))
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

	if (minutes === 0) {
		return `${hours}h`
	}
	return `${hours}h ${minutes}m`
}

export function formatTimeDisplay(time: string): string {
	const [hours, minutes] = time.split(':')
	const hour = parseInt(hours)
	const min = parseInt(minutes)

	const period = hour >= 12 ? 'PM' : 'AM'
	const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour

	if (min === 0) {
		return `${displayHour} ${period}`
	}
	return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`
}

export function getShiftTimeSuggestions() {
	return {
		morning: { start: '08:00', end: '16:00' },
		afternoon: { start: '12:00', end: '20:00' },
		evening: { start: '16:00', end: '23:00' },
		night: { start: '22:00', end: '06:00' },
		'full-day': { start: '08:00', end: '22:00' },
	}
}

export function validateTimeRange(startTime: string, endTime: string) {
	const start = new Date(`2000-01-01T${startTime}:00`)
	const end = new Date(`2000-01-01T${endTime}:00`)

	// Handle overnight shifts
	let diff = end.getTime() - start.getTime()
	if (diff < 0) {
		diff += 24 * 60 * 60 * 1000 // Add 24 hours
	}

	const hours = diff / (1000 * 60 * 60)

	return {
		isValid: hours > 0 && hours <= 24,
		hours: Math.round(hours * 10) / 10,
		message:
			hours <= 0
				? 'End time must be after start time'
				: hours > 24
				? 'Shift cannot exceed 24 hours'
				: 'Valid time range',
	}
}

export function calculateDuration(startTime: string, endTime: string): number {
	const start = new Date(`2000-01-01T${startTime}:00`)
	const end = new Date(`2000-01-01T${endTime}:00`)

	// Handle overnight shifts
	let diff = end.getTime() - start.getTime()
	if (diff < 0) {
		diff += 24 * 60 * 60 * 1000 // Add 24 hours
	}

	return Math.round((diff / (1000 * 60 * 60)) * 10) / 10
}
