const DISMISS_STORAGE_KEY = 'pwa-install-dismissed-at'
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000

export type DevicePlatform = 'ios' | 'android' | 'desktop'

export interface BeforeInstallPromptEvent extends Event {
	readonly platforms: ReadonlyArray<string>
	readonly userChoice: Promise<{
		outcome: 'accepted' | 'dismissed'
		platform: string
	}>
	prompt: () => Promise<void>
}

export function isPwaInstalled(): boolean {
	if (typeof window === 'undefined') return false

	const displayModeStandalone =
		window.matchMedia('(display-mode: standalone)').matches ||
		window.matchMedia('(display-mode: fullscreen)').matches ||
		window.matchMedia('(display-mode: minimal-ui)').matches

	const iosStandalone =
		'standalone' in window.navigator &&
		(window.navigator as Navigator & { standalone?: boolean }).standalone ===
			true

	return displayModeStandalone || iosStandalone
}

export function detectPlatform(): DevicePlatform {
	if (typeof window === 'undefined') return 'desktop'

	const ua = window.navigator.userAgent.toLowerCase()
	const isIOS =
		/iphone|ipad|ipod/.test(ua) &&
		!(window as Window & { MSStream?: unknown }).MSStream

	if (isIOS) return 'ios'
	if (/android/.test(ua)) return 'android'
	return 'desktop'
}

export function isInstallDismissed(): boolean {
	if (typeof window === 'undefined') return false

	const raw = window.localStorage.getItem(DISMISS_STORAGE_KEY)
	if (!raw) return false

	const dismissedAt = Number(raw)
	if (Number.isNaN(dismissedAt)) return false

	return Date.now() - dismissedAt < DISMISS_DURATION_MS
}

export function markInstallDismissed(): void {
	if (typeof window === 'undefined') return
	window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()))
}

export function clearInstallDismissed(): void {
	if (typeof window === 'undefined') return
	window.localStorage.removeItem(DISMISS_STORAGE_KEY)
}
