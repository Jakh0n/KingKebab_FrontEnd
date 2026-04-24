const AUTH_ERROR = 'Not authenticated'

/**
 * Returns the stored auth token. Throws if missing (e.g. user not logged in).
 * Single place to change token source (localStorage vs cookie vs store) later.
 */
export function getToken(): string {
	if (typeof window === 'undefined') {
		throw new Error(AUTH_ERROR)
	}
	const token = localStorage.getItem('token')
	if (!token) {
		throw new Error(AUTH_ERROR)
	}
	return token
}

/**
 * Returns the stored auth token or null if not present (for redirect checks, etc.).
 */
export function getTokenOrNull(): string | null {
	if (typeof window === 'undefined') return null
	return localStorage.getItem('token')
}

/**
 * Returns headers object with Bearer token for API requests. Throws if no token.
 */
export function getAuthHeaders(): Record<string, string> {
	return {
		Authorization: `Bearer ${getToken()}`,
	}
}
