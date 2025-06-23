export interface User {
	_id: string
	username: string
	name?: string
	email?: string
	phone?: string
	bio?: string
	position: string
	employeeId: string
	department?: string
	salary?: number
	hireDate?: string
	photoUrl?: string
	isAdmin?: boolean
	isActive?: boolean
	lastLogin?: string
	skills?: string[]
	emergencyContact?: {
		name?: string
		phone?: string
		relationship?: string
	}
	createdAt?: string
	updatedAt?: string
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
	employeeId?: string
}

export interface TimeEntryFormData {
	startTime: string
	endTime: string
	date: string
	overtimeReason?: 'Busy' | 'Last Order' | 'Company Request' | null
	responsiblePerson?: 'Adilcan' | 'Boss' | ''
	employeeId?: string
}

export interface AuthResponse {
	token: string
	position: string
	isAdmin: boolean
	username: string
	employeeId: string
}

export interface ApiError {
	message: string
}

export interface Announcement {
	_id: string
	title: string
	content: string
	type: 'info' | 'warning' | 'success'
	isActive: boolean
	createdAt: string
	updatedAt: string
}
