export interface User {
	_id: string
	username: string
	position: string
	isAdmin: boolean
}

export interface TimeEntry {
	_id: string
	user: User
	startTime: string
	endTime: string
	hours: number
	date: string
	description: string
	position: string
	breakMinutes: number
}

export interface TimeEntryFormData {
	startTime: string
	endTime: string
	date: string
	description: string
	breakMinutes: number
}

export interface AuthResponse {
	token: string
	position: string
	isAdmin: boolean
	username: string
}

export interface ApiError {
	message: string
}
