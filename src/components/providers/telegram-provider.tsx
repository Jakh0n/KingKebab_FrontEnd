'use client'

import {
	getTelegramWebApp,
	isTelegramMiniApp,
	type TelegramWebApp,
} from '@/lib/telegram'
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react'

interface TelegramContextValue {
	webApp: TelegramWebApp | null
	isTelegram: boolean
	isReady: boolean
}

const TelegramContext = createContext<TelegramContextValue>({
	webApp: null,
	isTelegram: false,
	isReady: false,
})

export function TelegramProvider({ children }: { children: ReactNode }) {
	const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
	const [isReady, setIsReady] = useState(false)

	useEffect(() => {
		const tg = getTelegramWebApp()
		if (!tg) {
			setIsReady(true)
			return
		}

		tg.ready()
		tg.expand()

		const syncViewport = () => {
			document.documentElement.style.setProperty(
				'--tg-viewport-stable-height',
				`${tg.viewportStableHeight || tg.viewportHeight || window.innerHeight}px`,
			)
		}
		syncViewport()

		try {
			tg.setHeaderColor(tg.themeParams.header_bg_color || '#0f0f0f')
			tg.setBackgroundColor(tg.themeParams.bg_color || '#0f0f0f')
		} catch {
			// Older clients may not support color setters
		}

		try {
			tg.disableVerticalSwipes?.()
		} catch {
			// Optional API
		}

		document.documentElement.classList.add('telegram-mini-app')
		setWebApp(tg)
		setIsReady(true)

		return () => {
			document.documentElement.classList.remove('telegram-mini-app')
		}
	}, [])

	const value = useMemo(
		() => ({
			webApp,
			isTelegram: Boolean(webApp && isTelegramMiniApp()),
			isReady,
		}),
		[webApp, isReady],
	)

	return (
		<TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>
	)
}

export function useTelegram(): TelegramContextValue {
	return useContext(TelegramContext)
}
