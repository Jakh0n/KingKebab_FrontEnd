export interface TelegramWebAppUser {
	id: number
	first_name?: string
	last_name?: string
	username?: string
	language_code?: string
	photo_url?: string
}

export interface TelegramThemeParams {
	bg_color?: string
	text_color?: string
	hint_color?: string
	link_color?: string
	button_color?: string
	button_text_color?: string
	secondary_bg_color?: string
	header_bg_color?: string
	accent_text_color?: string
	section_bg_color?: string
	section_header_text_color?: string
	subtitle_text_color?: string
	destructive_text_color?: string
}

export interface TelegramCloudStorage {
	setItem: (
		key: string,
		value: string,
		callback?: (error: string | null, stored?: boolean) => void,
	) => void
	getItem: (
		key: string,
		callback: (error: string | null, value?: string) => void,
	) => void
	removeItem: (
		key: string,
		callback?: (error: string | null, removed?: boolean) => void,
	) => void
}

export interface TelegramWebApp {
	initData: string
	initDataUnsafe: {
		user?: TelegramWebAppUser
		auth_date?: number
		hash?: string
		query_id?: string
		start_param?: string
	}
	version: string
	platform: string
	colorScheme: 'light' | 'dark'
	themeParams: TelegramThemeParams
	isExpanded: boolean
	viewportHeight: number
	viewportStableHeight: number
	headerColor: string
	backgroundColor: string
	ready: () => void
	expand: () => void
	close: () => void
	setHeaderColor: (color: string) => void
	setBackgroundColor: (color: string) => void
	enableClosingConfirmation?: () => void
	disableVerticalSwipes?: () => void
	CloudStorage?: TelegramCloudStorage
	HapticFeedback?: {
		impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
		notificationOccurred: (type: 'error' | 'success' | 'warning') => void
		selectionChanged: () => void
	}
	BackButton: {
		isVisible: boolean
		show: () => void
		hide: () => void
		onClick: (cb: () => void) => void
		offClick: (cb: () => void) => void
	}
	MainButton: {
		text: string
		color: string
		textColor: string
		isVisible: boolean
		isActive: boolean
		isProgressVisible: boolean
		setText: (text: string) => void
		show: () => void
		hide: () => void
		enable: () => void
		disable: () => void
		showProgress: (leaveActive?: boolean) => void
		hideProgress: () => void
		onClick: (cb: () => void) => void
		offClick: (cb: () => void) => void
	}
}

declare global {
	interface Window {
		Telegram?: {
			WebApp?: TelegramWebApp
		}
	}
}

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_POSITION_KEY = 'auth_position'
const SIGNED_OUT_KEY = 'signed_out'
const LOCAL_SIGNED_OUT_KEY = 'kk_telegram_signed_out'

export function getTelegramWebApp(): TelegramWebApp | null {
	if (typeof window === 'undefined') return null
	return window.Telegram?.WebApp ?? null
}

export function isTelegramMiniApp(): boolean {
	const tg = getTelegramWebApp()
	return Boolean(tg?.initData)
}

export function getTelegramInitData(): string | null {
	const initData = getTelegramWebApp()?.initData
	return initData ? initData : null
}

/** Wait until Telegram injects initData (cold start can be delayed). */
export function waitForTelegramInitData(
	timeoutMs = 3000,
	intervalMs = 100,
): Promise<string | null> {
	return new Promise(resolve => {
		const started = Date.now()

		const tick = () => {
			const initData = getTelegramInitData()
			if (initData) {
				resolve(initData)
				return
			}
			if (Date.now() - started >= timeoutMs) {
				resolve(getTelegramInitData())
				return
			}
			window.setTimeout(tick, intervalMs)
		}

		tick()
	})
}

export function markTelegramSignedOut(): void {
	try {
		localStorage.setItem(LOCAL_SIGNED_OUT_KEY, '1')
	} catch {
		// ignore
	}

	const storage = getTelegramWebApp()?.CloudStorage
	if (!storage) return
	try {
		storage.setItem(SIGNED_OUT_KEY, '1')
	} catch {
		// ignore
	}
}

export function clearTelegramSignedOut(): void {
	try {
		localStorage.removeItem(LOCAL_SIGNED_OUT_KEY)
	} catch {
		// ignore
	}

	const storage = getTelegramWebApp()?.CloudStorage
	if (!storage) return
	try {
		storage.removeItem(SIGNED_OUT_KEY)
	} catch {
		// ignore
	}
}

export function isTelegramSignedOut(): Promise<boolean> {
	try {
		if (localStorage.getItem(LOCAL_SIGNED_OUT_KEY) === '1') {
			return Promise.resolve(true)
		}
	} catch {
		// ignore
	}

	const storage = getTelegramWebApp()?.CloudStorage
	if (!storage) return Promise.resolve(false)

	return new Promise(resolve => {
		try {
			storage.getItem(SIGNED_OUT_KEY, (error, value) => {
				resolve(!error && value === '1')
			})
		} catch {
			resolve(false)
		}
	})
}

export function saveTelegramSession(token: string, position?: string): void {
	const storage = getTelegramWebApp()?.CloudStorage
	clearTelegramSignedOut()
	if (!storage) return

	try {
		storage.setItem(AUTH_TOKEN_KEY, token)
		if (position) {
			storage.setItem(AUTH_POSITION_KEY, position)
		}
	} catch {
		// CloudStorage may be unavailable on older clients
	}
}

export function clearTelegramSession(): void {
	const storage = getTelegramWebApp()?.CloudStorage
	if (!storage) return

	try {
		storage.removeItem(AUTH_TOKEN_KEY)
		storage.removeItem(AUTH_POSITION_KEY)
	} catch {
		// ignore
	}
}

export function loadTelegramSession(): Promise<{
	token: string
	position?: string
} | null> {
	const storage = getTelegramWebApp()?.CloudStorage
	if (!storage) return Promise.resolve(null)

	return new Promise(resolve => {
		try {
			storage.getItem(AUTH_TOKEN_KEY, (error, token) => {
				if (error || !token) {
					resolve(null)
					return
				}
				storage.getItem(AUTH_POSITION_KEY, (_posErr, position) => {
					resolve({ token, position: position || undefined })
				})
			})
		} catch {
			resolve(null)
		}
	})
}
