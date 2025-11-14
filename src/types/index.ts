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
	hourlyWage?: number
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
	overtimeReason?:
		| 'Busy'
		| 'Last Order'
		| 'Company Request'
		| 'Late Arrival'
		| null
	responsiblePerson?: 'Adilcan' | 'Boss' | ''
	latePerson?: string
	employeeId?: string
}

export interface TimeEntryFormData {
	startTime: string
	endTime: string
	date: string
	overtimeReason?:
		| 'Busy'
		| 'Last Order'
		| 'Company Request'
		| 'Late Arrival'
		| null
	responsiblePerson?: 'Adilcan' | 'Boss' | ''
	latePerson?: string
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

export interface Branch {
	_id: string
	name: string
	code: string
	location: {
		address: string
		city: string
		district?: string
		coordinates?: {
			latitude: number
			longitude: number
		}
	}
	contact: {
		phone?: string
		email?: string
		manager?: string
	}
	operatingHours: {
		monday: DaySchedule
		tuesday: DaySchedule
		wednesday: DaySchedule
		thursday: DaySchedule
		friday: DaySchedule
		saturday: DaySchedule
		sunday: DaySchedule
	}
	capacity: {
		maxWorkers: number
		maxRiders: number
	}
	requirements: {
		minimumStaff: number
		skillsRequired: Array<
			'cooking' | 'cashier' | 'cleaning' | 'management' | 'delivery'
		>
	}
	isActive: boolean
	notes?: string
	createdAt: string
	updatedAt: string
}

export interface DaySchedule {
	isOpen: boolean
	open: string
	close: string
}

export interface Schedule {
	_id: string
	branch: Branch | string
	worker: User | string
	date: string
	startTime: string
	endTime: string
	shiftType: 'day' | 'night'
	role: 'worker' | 'rider' | 'manager' | 'cashier' | 'cook'
	status: 'scheduled' | 'confirmed' | 'completed' | 'no-show' | 'cancelled'
	notes?: string
	createdBy: User | string
	confirmedBy?: User | string
	confirmedAt?: string
	isRecurring: boolean
	recurringPattern: 'daily' | 'weekly' | 'monthly' | 'none'
	recurringEndDate?: string
	originalScheduleId?: string
	duration?: number
	createdAt: string
	updatedAt: string
}

export interface ScheduleFormData {
	branchId: string
	workerId: string
	startTime: string
	endTime: string
	shiftType: 'day' | 'night'
	role: 'worker' | 'rider' | 'manager' | 'cashier' | 'cook'
	notes?: string
	duration: '6months' | '1year'
	workingDays: string[]
}

export interface BranchFormData {
	name: string
	code: string
	location: {
		address: string
		city: string
		district?: string
		coordinates?: {
			latitude: number
			longitude: number
		}
	}
	contact?: {
		phone?: string
		email?: string
		manager?: string
	}
	operatingHours?: {
		monday?: DaySchedule
		tuesday?: DaySchedule
		wednesday?: DaySchedule
		thursday?: DaySchedule
		friday?: DaySchedule
		saturday?: DaySchedule
		sunday?: DaySchedule
	}
	capacity?: {
		maxWorkers?: number
		maxRiders?: number
	}
	requirements?: {
		minimumStaff?: number
		skillsRequired?: Array<
			'cooking' | 'cashier' | 'cleaning' | 'management' | 'delivery'
		>
	}
	notes?: string
}

export interface ScheduleConflict {
	id: string
	date: string
	startTime: string
	endTime: string
	branch: string
	shiftType: string
}

export interface WeeklyScheduleData {
	year: number
	week: number
	startDate: string
	endDate: string
	schedules: {
		[date: string]: {
			[branchCode: string]: Schedule[]
		}
	}
}

export interface SchedulePagination {
	page: number
	limit: number
	total: number
	pages: number
}
