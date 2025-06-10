export interface User {
	_id: string
	username: string
	position: string
}

export interface TimeEntry {
	_id: string
	user: User
	startTime: string
	endTime: string
	hours: number
	date: string
	position: string
	breakMinutes?: number
	overtimeReason?: 'Busy' | 'Last Order' | 'Company Request' | null
	responsiblePerson?: 'Adilcan' | 'Boss' | ''
}

export interface TimeEntryFormData {
	startTime: string
	endTime: string
	date: string
	overtimeReason?: 'Busy' | 'Last Order' | 'Company Request' | null
	responsiblePerson?: 'Adilcan' | 'Boss' | ''
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
