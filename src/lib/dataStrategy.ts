// Data that should ALWAYS be stored in localStorage (critical for app functionality)
const CRITICAL_LOCAL_DATA = [
	'token',
	'position',
	'employeeId',
	'lastLoginAttempt',
] as const

// Data that should be fetched fresh from MongoDB on each request
const ALWAYS_FRESH_DATA = [
	'announcements',
	'allTimeEntries', // Admin view - always fresh for accuracy
	'userProfile', // Profile data should be fresh to avoid sync issues
] as const

// Data that can be cached temporarily (with TTL)
const CACHEABLE_DATA = [
	'myTimeEntries', // User's own entries can be cached for 5 minutes
] as const

interface CacheItem<T> {
	data: T
	timestamp: number
	ttl: number // Time to live in milliseconds
}

type CriticalDataType = (typeof CRITICAL_LOCAL_DATA)[number]
type FreshDataType = (typeof ALWAYS_FRESH_DATA)[number]
type CacheableDataType = (typeof CACHEABLE_DATA)[number]

class DataStrategy {
	private readonly CACHE_PREFIX = 'kingkebab_cache_'
	private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

	// Check if data should be cached
	private shouldCache(dataType: string): dataType is CacheableDataType {
		return CACHEABLE_DATA.includes(dataType as CacheableDataType)
	}

	// Check if data should always be fresh
	private shouldAlwaysBeFresh(dataType: string): dataType is FreshDataType {
		return ALWAYS_FRESH_DATA.includes(dataType as FreshDataType)
	}

	// Get cache key
	private getCacheKey(
		dataType: string,
		userId?: string,
		params?: string
	): string {
		const key = userId ? `${dataType}_${userId}` : dataType
		return `${this.CACHE_PREFIX}${key}${params ? `_${params}` : ''}`
	}

	// Set cached data with TTL
	setCache<T>(
		dataType: string,
		data: T,
		userId?: string,
		params?: string,
		customTTL?: number
	): void {
		if (!this.shouldCache(dataType)) return

		const cacheKey = this.getCacheKey(dataType, userId, params)
		const cacheItem: CacheItem<T> = {
			data,
			timestamp: Date.now(),
			ttl: customTTL || this.DEFAULT_TTL,
		}

		try {
			localStorage.setItem(cacheKey, JSON.stringify(cacheItem))
		} catch (error) {
			console.warn(`Failed to cache ${dataType}:`, error)
		}
	}

	// Get cached data if still valid
	getCache<T>(dataType: string, userId?: string, params?: string): T | null {
		if (!this.shouldCache(dataType)) return null

		const cacheKey = this.getCacheKey(dataType, userId, params)

		try {
			const cached = localStorage.getItem(cacheKey)
			if (!cached) return null

			const cacheItem: CacheItem<T> = JSON.parse(cached)
			const isExpired = Date.now() - cacheItem.timestamp > cacheItem.ttl

			if (isExpired) {
				localStorage.removeItem(cacheKey)
				return null
			}

			return cacheItem.data
		} catch (error) {
			console.warn(`Failed to get cached ${dataType}:`, error)
			return null
		}
	}

	// Clear specific cache
	clearCache(dataType: string, userId?: string, params?: string): void {
		const cacheKey = this.getCacheKey(dataType, userId, params)
		localStorage.removeItem(cacheKey)
	}

	// Clear all cache except critical data
	clearAllCache(): void {
		const keysToRemove: string[] = []

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i)
			if (key?.startsWith(this.CACHE_PREFIX)) {
				keysToRemove.push(key)
			}
		}

		keysToRemove.forEach(key => localStorage.removeItem(key))
	}

	// Clean up expired cache entries
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
					// If parsing fails, remove the corrupted entry
					keysToRemove.push(key)
				}
			}
		}

		keysToRemove.forEach(key => localStorage.removeItem(key))
	}

	// Get data strategy recommendation
	getDataStrategy(dataType: string): 'localStorage' | 'cache' | 'fresh' {
		if (CRITICAL_LOCAL_DATA.includes(dataType as CriticalDataType)) {
			return 'localStorage'
		}

		if (this.shouldAlwaysBeFresh(dataType)) {
			return 'fresh'
		}

		if (this.shouldCache(dataType)) {
			return 'cache'
		}

		return 'fresh' // Default to fresh data
	}

	// Remove old localStorage patterns (for migration)
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
export const dataStrategy = new DataStrategy()

// Export types for use in components
export type DataStrategyType = 'localStorage' | 'cache' | 'fresh'
export type { CacheableDataType, CriticalDataType, FreshDataType }
