'use client'

import {
	getTelegramWebApp,
	isTelegramMiniApp,
	waitForTelegramInitData,
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
	initData: string | null
}

const TelegramContext = createContext<TelegramContextValue>({
	webApp: null,
	isTelegram: false,
	isReady: false,
	initData: null,
})

export function TelegramProvider({ children }: { children: ReactNode }) {
	const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
	const [initData, setInitData] = useState<string | null>(null)
	const [isReady, setIsReady] = useState(false)

	useEffect(() => {
		let cancelled = false

		async function boot() {
			// Script may load a tick later on cold start
			let tg = getTelegramWebApp()
			if (!tg) {
				await new Promise(r => setTimeout(r, 150))
				tg = getTelegramWebApp()
			}

			if (!tg) {
				if (!cancelled) setIsReady(true)
				return
			}

			tg.ready()
			tg.expand()

			const syncViewport = () => {
				document.documentElement.style.setProperty(
					'--tg-viewport-stable-height',
					`${tg!.viewportStableHeight || tg!.viewportHeight || window.innerHeight}px`,
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

			const resolvedInitData = tg.initData || (await waitForTelegramInitData(3500))

			if (cancelled) return

			setWebApp(tg)
			setInitData(resolvedInitData)
			setIsReady(true)
		}

		void boot()

		return () => {
			cancelled = true
			document.documentElement.classList.remove('telegram-mini-app')
		}
	}, [])

	const value = useMemo(
		() => ({
			webApp,
			initData,
			isTelegram: Boolean(initData) || Boolean(webApp && isTelegramMiniApp()),
			isReady,
		}),
		[webApp, initData, isReady],
	)

	return (
		<TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>
	)
}

export function useTelegram(): TelegramContextValue {
	return useContext(TelegramContext)
}
