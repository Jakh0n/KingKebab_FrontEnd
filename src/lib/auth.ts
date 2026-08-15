import Cookies from 'js-cookie'

export const ACCESS_TOKEN_KEY = 'token'
export const REFRESH_TOKEN_KEY = 'refreshToken'
export const AUTH_ERROR = 'Not authenticated'
const ACCESS_COOKIE_DAYS = 1
const REFRESH_COOKIE_DAYS = 30

export interface JwtPayload {
	exp?: number
	iat?: number
	userId?: string
	isAdmin?: boolean
	username?: string
	position?: string
	employeeId?: string
	tokenVersion?: number
	type?: string
}

export function decodeToken(token: string): JwtPayload {
	const payload = token.split('.')[1]
	if (!payload) {
		throw new Error('Invalid token')
	}
	const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
	return JSON.parse(atob(normalized)) as JwtPayload
}

export function isAccessTokenValid(
	token: string | null | undefined,
	skewMs = 0,
): boolean {
	if (!token) return false
	try {
		const payload = decodeToken(token)
		if (payload.type === 'refresh') return false
		return Boolean(payload.exp && Date.now() + skewMs < payload.exp * 1000)
	} catch {
		return false
	}
}

export function getToken(): string {
	if (typeof window === 'undefined') {
		throw new Error(AUTH_ERROR)
	}
	const token = localStorage.getItem(ACCESS_TOKEN_KEY)
	if (!token) {
		throw new Error(AUTH_ERROR)
	}
	return token
}

export function getTokenOrNull(): string | null {
	if (typeof window === 'undefined') return null
	return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
	if (typeof window === 'undefined') return null
	return (
		localStorage.getItem(REFRESH_TOKEN_KEY) ||
		Cookies.get(REFRESH_TOKEN_KEY) ||
		null
	)
}

export function getAuthHeaders(): Record<string, string> {
	return {
		Authorization: `Bearer ${getToken()}`,
	}
}

export function persistAuthStorage(data: {
	token?: string
	refreshToken?: string
	position?: string
	employeeId?: string
}): void {
	if (data.token) {
		localStorage.setItem(ACCESS_TOKEN_KEY, data.token)
		Cookies.set(ACCESS_TOKEN_KEY, data.token, {
			expires: ACCESS_COOKIE_DAYS,
			sameSite: 'lax',
			path: '/',
		})
	}

	if (data.refreshToken) {
		localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
		Cookies.set(REFRESH_TOKEN_KEY, data.refreshToken, {
			expires: REFRESH_COOKIE_DAYS,
			sameSite: 'lax',
			path: '/',
		})
	}

	if (data.position) {
		localStorage.setItem('position', data.position)
	}
	if (data.employeeId) {
		localStorage.setItem('employeeId', data.employeeId)
	}
}

export function clearAuthStorage(): void {
	localStorage.removeItem(ACCESS_TOKEN_KEY)
	localStorage.removeItem(REFRESH_TOKEN_KEY)
	localStorage.removeItem('position')
	localStorage.removeItem('employeeId')
	Cookies.remove(ACCESS_TOKEN_KEY, { path: '/' })
	Cookies.remove(REFRESH_TOKEN_KEY, { path: '/' })
}
