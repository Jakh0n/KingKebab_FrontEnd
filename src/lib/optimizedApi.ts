import {
	Announcement,
	ApiError,
	AuthResponse,
	TimeEntry,
	TimeEntryFormData,
	User,
} from '@/types'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Simple cache interface without external dependencies
interface CacheItem<T> {
	data: T
	timestamp: number
	ttl: number
}

class OptimizedDataService {
	private readonly CACHE_PREFIX = 'kingkebab_cache_'
	private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

	// Critical data that should stay in localStorage
	private readonly CRITICAL_LOCAL_DATA = [
		'token',
		'position',
		'employeeId',
		'lastLoginAttempt',
	]

	// Data that should always be fresh from MongoDB
	private readonly ALWAYS_FRESH_DATA = [
		'announcements',
		'allTimeEntries',
		'userProfile',
	]

	// Data that can be cached temporarily
	private readonly CACHEABLE_DATA = ['myTimeEntries']

	private async handleResponse<T>(response: Response): Promise<T> {
		const contentType = response.headers.get('content-type')
		const hasJsonContent =
			contentType && contentType.includes('application/json')

		let data
		try {
			data = hasJsonContent
				? await response.json()
				: { message: response.statusText }
		} catch {
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

	private setCache<T>(key: string, data: T, ttl?: number): void {
		const cacheItem: CacheItem<T> = {
			data,
			timestamp: Date.now(),
			ttl: ttl || this.DEFAULT_TTL,
		}

		try {
			localStorage.setItem(
				`${this.CACHE_PREFIX}${key}`,
				JSON.stringify(cacheItem)
			)
		} catch (error) {
			console.warn(`Failed to cache ${key}:`, error)
		}
	}

	private getCache<T>(key: string): T | null {
		try {
			const cached = localStorage.getItem(`${this.CACHE_PREFIX}${key}`)
			if (!cached) return null

			const cacheItem: CacheItem<T> = JSON.parse(cached)
			const isExpired = Date.now() - cacheItem.timestamp > cacheItem.ttl

			if (isExpired) {
				localStorage.removeItem(`${this.CACHE_PREFIX}${key}`)
				return null
			}

			return cacheItem.data
		} catch (error) {
			console.warn(`Failed to get cached ${key}:`, error)
			return null
		}
	}

	// Authentication methods (keep localStorage for critical data)
	async login(username: string, password: string): Promise<AuthResponse> {
		this.logout() // Clear previous session

		const response = await fetch(`${API_URL}/auth/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ username, password }),
		})
		const data = await this.handleResponse<AuthResponse>(response)

		// Store critical authentication data in localStorage
		localStorage.setItem('token', data.token)
		localStorage.setItem('position', data.position)
		Cookies.set('token', data.token, { expires: 1 })

		return data
	}

	logout(): void {
		// Only clear non-critical data, keep essential auth info until new login
		const keysToKeep = ['lastLoginAttempt']
		const allKeys: string[] = []

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i)
			if (key) allKeys.push(key)
		}

		allKeys.forEach(key => {
			if (!keysToKeep.includes(key)) {
				localStorage.removeItem(key)
			}
		})

		Cookies.remove('token')
		sessionStorage.clear()
	}

	// Time entries - optimized approach
	async getMyTimeEntries(): Promise<TimeEntry[]> {
		const token = localStorage.getItem('token')
		if (!token) throw new Error('Not authenticated')

		// Check cache first (5 minute TTL)
		const cached = this.getCache<TimeEntry[]>('myTimeEntries')
		if (cached) {
			console.log('Using cached time entries')
			return cached
		}

		// Fetch fresh data from MongoDB
		const response = await fetch(`${API_URL}/time/my-entries`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		const data = await this.handleResponse<TimeEntry[]>(response)

		// Cache the result
		this.setCache('myTimeEntries', data)

		return data
	}

	// Admin entries - always fresh from MongoDB
	async getAllTimeEntries(): Promise<TimeEntry[]> {
		const token = localStorage.getItem('token')
		if (!token) throw new Error('Not authenticated')

		// Always fetch fresh data for admin accuracy
		const response = await fetch(`${API_URL}/time/all`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		return this.handleResponse<TimeEntry[]>(response)
	}

	// User profile - always fresh from MongoDB
	async getUserProfile(): Promise<User> {
		const token = localStorage.getItem('token')
		if (!token) throw new Error('Not authenticated')

		// Always fetch fresh profile data to avoid sync issues
		const response = await fetch(`${API_URL}/profile`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		const user = await this.handleResponse<User>(response)

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

	async updateUserProfile(data: Partial<User>): Promise<User> {
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

		return this.handleResponse<User>(response)
	}

	// Announcements - always fresh from MongoDB
	async getAnnouncements(): Promise<Announcement[]> {
		const token = localStorage.getItem('token')
		if (!token) throw new Error('Not authenticated')

		// Always fetch fresh announcements
		const response = await fetch(`${API_URL}/announcements`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		return this.handleResponse<Announcement[]>(response)
	}

	// Time entry operations
	async addTimeEntry(data: TimeEntryFormData): Promise<TimeEntry> {
		const token = localStorage.getItem('token')
		if (!token) throw new Error('Not authenticated')

		if (!data.startTime || !data.endTime || !data.date) {
			throw new Error('Please fill in all fields')
		}

		const formattedData = {
			...data,
			startTime: data.startTime,
			endTime: data.endTime,
			date: data.date,
			...(data.employeeId ? { employeeId: data.employeeId } : {}),
		}

		const response = await fetch(`${API_URL}/time`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(formattedData),
		})

		const result = await this.handleResponse<TimeEntry>(response)

		// Clear cache to force fresh data on next request
		localStorage.removeItem(`${this.CACHE_PREFIX}myTimeEntries`)

		return result
	}

	async updateTimeEntry(
		id: string,
		data: TimeEntryFormData
	): Promise<TimeEntry> {
		const token = localStorage.getItem('token')
		if (!token) throw new Error('Not authenticated')

		if (!data.startTime || !data.endTime || !data.date) {
			throw new Error('Please fill in all fields')
		}

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

		const result = await this.handleResponse<TimeEntry>(response)

		// Clear cache to force fresh data on next request
		localStorage.removeItem(`${this.CACHE_PREFIX}myTimeEntries`)

		return result
	}

	async deleteTimeEntry(entryId: string): Promise<void> {
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

		// Clear cache to force fresh data on next request
		localStorage.removeItem(`${this.CACHE_PREFIX}myTimeEntries`)
	}

	// PDF downloads
	async downloadMyPDF(month: number, year: number): Promise<void> {
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

	// Cleanup methods
	cleanupExpiredCache(): void {
		const keysToRemove: string[] = []

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i)
			if (key?.startsWith(this.CACHE_PREFIX)) {
				try {
					const cached = localStorage.getItem(key)
					if (cached) {
						const cacheItem: CacheItem<unknown> = JSON.parse(cached)
						const isExpired = Date.now() - cacheItem.timestamp > cacheItem.ttl

						if (isExpired) {
							keysToRemove.push(key)
						}
					}
				} catch {
					keysToRemove.push(key)
				}
			}
		}

		keysToRemove.forEach(key => localStorage.removeItem(key))
	}

	// Migration helper
	migrateOldLocalStorage(): void {
		const oldPatterns = ['timeEntries_', 'userProfile_', 'userImage_']
		const keysToRemove: string[] = []

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i)
			if (key && oldPatterns.some(pattern => key.startsWith(pattern))) {
				keysToRemove.push(key)
			}
		}

		keysToRemove.forEach(key => {
			console.log(`Migrating old localStorage key: ${key}`)
			localStorage.removeItem(key)
		})
	}
}

// Export singleton instance
export const optimizedApi = new OptimizedDataService()

// Export individual methods for backward compatibility
export const {
	login,
	logout,
	getMyTimeEntries,
	getAllTimeEntries,
	getUserProfile,
	updateUserProfile,
	getAnnouncements,
	addTimeEntry,
	updateTimeEntry,
	deleteTimeEntry,
	downloadMyPDF,
	cleanupExpiredCache,
	migrateOldLocalStorage,
} = optimizedApi
