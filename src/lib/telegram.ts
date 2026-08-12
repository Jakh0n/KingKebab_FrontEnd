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
