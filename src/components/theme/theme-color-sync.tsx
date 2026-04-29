'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

const LIGHT = '#f5f5f7'
const DARK = '#000000'

/**
 * Keeps <meta name="theme-color"> in sync with resolved theme for Safari / PWA status bar.
 */
export function ThemeColorSync() {
	const { resolvedTheme } = useTheme()

	useEffect(() => {
		const content = resolvedTheme === 'dark' ? DARK : LIGHT
		let meta = document.querySelector('meta[name="theme-color"]')
		if (!meta) {
			meta = document.createElement('meta')
			meta.setAttribute('name', 'theme-color')
			document.head.appendChild(meta)
		}
		meta.setAttribute('content', content)
	}, [resolvedTheme])

	return null
}
