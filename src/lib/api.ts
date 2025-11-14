import {
	Announcement,
	ApiError,
	AuthResponse,
	Branch,
	BranchFormData,
	Schedule,
	ScheduleConflict,
	ScheduleFormData,
	TimeEntry,
	TimeEntryFormData,
	User,
	WeeklyScheduleData,
} from '@/types'
import Cookies from 'js-cookie'

// Determine API URL based on environment
const getApiUrl = () => {
	// For development, always use local backend
	if (typeof window !== 'undefined') {
		const hostname = window.location.hostname
		if (hostname === 'localhost' || hostname === '127.0.0.1') {
			return 'http://localhost:5000/api'
		}
	}

	// If environment variable is set, use it (for production)
	if (process.env.NEXT_PUBLIC_API_URL) {
		return process.env.NEXT_PUBLIC_API_URL
	}

	// Fallback to local for development
	return 'http://localhost:5000/api'
}

const API_URL = getApiUrl()

async function handleResponse<T>(response: Response): Promise<T> {
	// Check if response has content
	const contentType = response.headers.get('content-type')
	const hasJsonContent = contentType && contentType.includes('application/json')

	let data
	try {
		data = hasJsonContent
			? await response.json()
			: { message: response.statusText }
	} catch {
		// If JSON parsing fails, create a generic error object
		data = { message: `HTTP ${response.status}: ${response.statusText}` }
	}

	if (!response.ok) {
		const errorMessage =
			(data as ApiError).message ||
			`HTTP ${response.status}: ${response.statusText}`
		throw new Error(errorMessage)
	}
	return data as T
}

export async function login(
	username: string,
	password: string
): Promise<AuthResponse> {
	// Avval barcha storage'larni tozalash
	logout()

	const response = await fetch(`${API_URL}/auth/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ username, password }),
	})
	const data = await handleResponse<AuthResponse>(response)

	// Token va position ni localStorage va cookie ga saqlash
	localStorage.setItem('token', data.token)
	localStorage.setItem('position', data.position)
	Cookies.set('token', data.token, { expires: 1 }) // 1 kunlik cookie

	return data
}

export async function register(
	username: string,
	password: string,
	position: string,
	employeeId: string
): Promise<AuthResponse> {
	// Avval barcha storage'larni tozalash
	logout()

	const response = await fetch(`${API_URL}/auth/register`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			username,
			password,
			position,
			employeeId,
		}),
	})
	const data = await handleResponse<AuthResponse>(response)

	// Token va position ni localStorage va cookie ga saqlash
	localStorage.setItem('token', data.token)
	localStorage.setItem('position', data.position)
	localStorage.setItem('employeeId', data.employeeId)
	Cookies.set('token', data.token, { expires: 1 }) // 1 kunlik cookie

	return data
}

export async function addTimeEntry(
	data: TimeEntryFormData
): Promise<TimeEntry> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	// Ma'lumotlarni tekshirish
	if (!data.startTime || !data.endTime || !data.date) {
		throw new Error('Please fill in all fields')
	}

	// Vaqtlarni to'g'ri formatga o'tkazish
	const formattedData = {
		...data,
		startTime: data.startTime,
		endTime: data.endTime,
		date: data.date,
		...(data.employeeId ? { employeeId: data.employeeId } : {}),
	}

	console.log('Sending data:', formattedData)

	const response = await fetch(`${API_URL}/time`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(formattedData),
	})

	return handleResponse<TimeEntry>(response)
}

export async function getMyTimeEntries(): Promise<TimeEntry[]> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/time/my-entries`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
	return handleResponse<TimeEntry[]>(response)
}

export async function getAllTimeEntries(): Promise<TimeEntry[]> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/time/all`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
	return handleResponse<TimeEntry[]>(response)
}

export async function downloadWorkerPDF(
	userId: string,
	month: number,
	year: number
) {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('No token found')

	const response = await fetch(
		`${API_URL}/time/worker-pdf/${userId}/${month}/${year}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	)

	if (!response.ok) {
		throw new Error('Failed to download PDF')
	}

	const blob = await response.blob()
	const url = window.URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url

	// Get filename from Content-Disposition header
	const contentDisposition = response.headers.get('Content-Disposition')
	let filename = `worker-time-${userId}-${month}-${year}.pdf`

	if (contentDisposition) {
		const filenameMatch = contentDisposition.match(/filename="(.+)"/)
		if (filenameMatch) {
			filename = filenameMatch[1]
		}
	}

	a.download = filename
	document.body.appendChild(a)
	a.click()
	window.URL.revokeObjectURL(url)
	document.body.removeChild(a)
}

export async function downloadMyPDF(month: number, year: number) {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('No token found')

	const response = await fetch(`${API_URL}/time/my-pdf/${month}/${year}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})

	if (!response.ok) {
		throw new Error('Failed to download PDF')
	}

	const blob = await response.blob()
	const url = window.URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url

	// Get filename from Content-Disposition header
	const contentDisposition = response.headers.get('Content-Disposition')
	let filename = `my-time-${month}-${year}.pdf`

	if (contentDisposition) {
		const filenameMatch = contentDisposition.match(/filename="(.+)"/)
		if (filenameMatch) {
			filename = filenameMatch[1]
		}
	}

	a.download = filename
	document.body.appendChild(a)
	a.click()
	window.URL.revokeObjectURL(url)
	document.body.removeChild(a)
}

export async function deleteTimeEntry(entryId: string): Promise<void> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('No token found')

	const response = await fetch(`${API_URL}/time/${entryId}`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})

	if (!response.ok) {
		throw new Error('Error deleting entry')
	}
}

export async function updateTimeEntry(
	id: string,
	data: TimeEntryFormData
): Promise<TimeEntry> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	// Ma'lumotlarni tekshirish
	if (!data.startTime || !data.endTime || !data.date) {
		throw new Error('Please fill in all fields')
	}

	// Vaqtlarni to'g'ri formatga o'tkazish
	const formattedData = {
		...data,
		startTime: data.startTime,
		endTime: data.endTime,
		date: data.date,
	}

	const response = await fetch(`${API_URL}/time/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(formattedData),
	})

	return handleResponse<TimeEntry>(response)
}

// Logout funksiyasini qo'shamiz
export function logout() {
	localStorage.clear() // Barcha localStorage ma'lumotlarini tozalash
	Cookies.remove('token')
	sessionStorage.clear() // SessionStorage'ni ham tozalash
}

export async function registerWorker(data: {
	username: string
	password: string
	position: string
	isAdmin: boolean
	employeeId: string
}) {
	// Avval barcha storage'larni tozalash
	logout()

	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/auth/register`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(data),
	})

	return handleResponse(response)
}

// Announcements
export async function getAnnouncements(): Promise<Announcement[]> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/announcements`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})

	if (!response.ok) {
		throw new Error('Failed to fetch announcements')
	}

	return response.json()
}

export async function createAnnouncement(data: {
	title: string
	content: string
	type: 'info' | 'warning' | 'success'
}): Promise<Announcement> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/announcements`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(data),
	})

	if (!response.ok) {
		throw new Error('Failed to create announcement')
	}

	return response.json()
}

export async function updateAnnouncement(
	id: string,
	data: {
		title: string
		content: string
		type: 'info' | 'warning' | 'success'
		isActive: boolean
	}
): Promise<Announcement> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/announcements/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(data),
	})

	if (!response.ok) {
		throw new Error('Failed to update announcement')
	}

	return response.json()
}

export async function deleteAnnouncement(id: string): Promise<void> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/announcements/${id}`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})

	if (!response.ok) {
		const errorData = await response.json()
		throw new Error(errorData.message || 'Failed to delete announcement')
	}
}

// Profile API functions
export async function getUserProfile(): Promise<User> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/profile`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})

	const user = await handleResponse<User>(response)

	// Convert relative URL to absolute URL for images
	if (
		user.photoUrl &&
		!user.photoUrl.startsWith('http') &&
		!user.photoUrl.startsWith('data:')
	) {
		const baseUrl = API_URL.replace('/api', '')
		user.photoUrl = `${baseUrl}${user.photoUrl}`
	}

	return user
}

export async function updateUserProfile(data: {
	name?: string
	email?: string
	phone?: string
	bio?: string
	department?: string
	photoUrl?: string
	hireDate?: string
	hourlyWage?: number
	skills?: string[]
	emergencyContact?: {
		name: string
		phone: string
		relationship: string
	}
}): Promise<User> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/profile`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(data),
	})
	return handleResponse<User>(response)
}

export async function uploadProfileImage(file: File): Promise<{
	message: string
	imageUrl: string
	user: User
}> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const formData = new FormData()
	formData.append('image', file)

	const response = await fetch(`${API_URL}/profile/upload-image`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: formData,
	})

	const result = await handleResponse<{
		message: string
		imageUrl: string
		user: User
	}>(response)

	// Convert relative URL to absolute URL
	const baseUrl = API_URL.replace('/api', '')
	result.user.photoUrl = result.user.photoUrl
		? `${baseUrl}${result.user.photoUrl}`
		: ''
	result.imageUrl = `${baseUrl}${result.imageUrl}`

	return result
}

// ================================
// Branch Management API Functions
// ================================

export async function getAllBranches(
	includeInactive = false
): Promise<Branch[]> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const params = new URLSearchParams()
	if (includeInactive) params.append('includeInactive', 'true')

	const response = await fetch(`${API_URL}/branches?${params}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
	return handleResponse<Branch[]>(response)
}

export async function getBranch(id: string): Promise<Branch> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/branches/${id}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
	return handleResponse<Branch>(response)
}

export async function createBranch(
	data: BranchFormData
): Promise<{ message: string; branch: Branch }> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	if (
		!data.name ||
		!data.code ||
		!data.location.address ||
		!data.location.city
	) {
		throw new Error('Name, code, address, and city are required')
	}

	const response = await fetch(`${API_URL}/branches`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(data),
	})
	return handleResponse<{ message: string; branch: Branch }>(response)
}

export async function updateBranch(
	id: string,
	data: BranchFormData
): Promise<{ message: string; branch: Branch }> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/branches/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(data),
	})
	return handleResponse<{ message: string; branch: Branch }>(response)
}

export async function deleteBranch(id: string): Promise<{ message: string }> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/branches/${id}`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
	return handleResponse<{ message: string }>(response)
}

export async function getActiveBranches(): Promise<Branch[]> {
	const response = await fetch(`${API_URL}/branches/public/active`, {
		method: 'GET',
	})
	return handleResponse<Branch[]>(response)
}

export async function getAllUsers(): Promise<User[]> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/users`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
	return handleResponse<User[]>(response)
}

// =================================
// Schedule Management API Functions
// =================================

export async function getSchedules(params: {
	startDate?: string
	endDate?: string
	branchId?: string
	workerId?: string
	status?: string
	shiftType?: string
	page?: number
	limit?: number
}): Promise<{
	schedules: Schedule[]
	pagination: {
		page: number
		limit: number
		total: number
		pages: number
	}
}> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const searchParams = new URLSearchParams()
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined) {
			searchParams.append(key, value.toString())
		}
	})

	const response = await fetch(`${API_URL}/schedules?${searchParams}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
	return handleResponse<{
		schedules: Schedule[]
		pagination: {
			page: number
			limit: number
			total: number
			pages: number
		}
	}>(response)
}

export async function getSchedule(id: string): Promise<Schedule> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/schedules/${id}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
	return handleResponse<Schedule>(response)
}

export async function createSchedule(
	data: ScheduleFormData
): Promise<{ message: string; schedule: Schedule; recurringCount?: number }> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	if (
		!data.branchId ||
		!data.workerId ||
		!data.startTime ||
		!data.endTime ||
		!data.shiftType ||
		!data.role ||
		!data.duration ||
		!data.workingDays ||
		data.workingDays.length === 0
	) {
		throw new Error(
			'Branch, worker, start time, end time, shift type, role, duration, and working days are required'
		)
	}

	const response = await fetch(`${API_URL}/schedules`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(data),
	})
	return handleResponse<{
		message: string
		schedule: Schedule
		recurringCount?: number
	}>(response)
}

export async function updateSchedule(
	id: string,
	data: Partial<ScheduleFormData>
): Promise<{ message: string; schedule: Schedule }> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/schedules/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(data),
	})
	return handleResponse<{ message: string; schedule: Schedule }>(response)
}

export async function deleteSchedule(id: string): Promise<{ message: string }> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/schedules/${id}`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
	return handleResponse<{ message: string }>(response)
}

export async function confirmSchedule(
	id: string
): Promise<{ message: string; schedule: Schedule }> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/schedules/${id}/confirm`, {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
	return handleResponse<{ message: string; schedule: Schedule }>(response)
}

export async function checkScheduleConflicts(params: {
	workerId: string
	startDate: string
	endDate?: string
	startTime: string
	endTime: string
}): Promise<{
	hasConflicts: boolean
	conflicts: ScheduleConflict[]
}> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const searchParams = new URLSearchParams()
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined) {
			searchParams.append(key, value.toString())
		}
	})

	const response = await fetch(
		`${API_URL}/schedules/conflicts/check?${searchParams}`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	)
	return handleResponse<{
		hasConflicts: boolean
		conflicts: ScheduleConflict[]
	}>(response)
}

export async function getWeeklySchedule(
	year: number,
	week: number,
	branchId?: string,
	shiftType?: string
): Promise<WeeklyScheduleData> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const params = new URLSearchParams()
	if (branchId) params.append('branchId', branchId)
	if (shiftType) params.append('shiftType', shiftType)

	const response = await fetch(
		`${API_URL}/schedules/weekly/${year}/${week}?${params}`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	)
	return handleResponse<WeeklyScheduleData>(response)
}
