import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import Footer from '@/components/shared/footer'
import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
	metadataBase: new URL('https://www.kingkebab.co.kr/'),
	title: 'King Kebab — Time Management',
	description:
		'King Kebab Time Management System — track shifts, manage overtime and analyze work across branches with a calm, modern interface.',
	authors: [{ name: 'Jakhon Yokubov', url: 'https://www.kingkebab.co.kr' }],
	icons: {
		icon: [
			{ url: '/crown.jpg', sizes: '32x32', type: 'image/jpg' },
			{ url: '/crown.jpg', sizes: '16x16', type: 'image/jpg' },
			{ url: '/crown.jpg', sizes: '48x48', type: 'image/jpg' },
		],
		apple: [{ url: '/crown.jpg', sizes: '180x180', type: 'image/jpg' }],
		shortcut: '/crown.jpg',
	},
	manifest: '/manifest.json',
	openGraph: {
		title: 'King Kebab — Time Management',
		description:
			'King Kebab — Turkish and Uzbek cuisine in Korea. Time Management System for our team.',
		type: 'website',
		url: 'https://www.kingkebab.co.kr',
		locale: 'ko_KR',
		images: '/crown.jpg',
		siteName: 'King Kebab',
		emails: 'info@kingkebab.co.kr',
	},
	appleWebApp: {
		capable: true,
		title: 'King Kebab',
		statusBarStyle: 'black-translucent',
	},
}

export const viewport: Viewport = {
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#f5f5f7' },
		{ media: '(prefers-color-scheme: dark)', color: '#000000' },
	],
}

interface RootLayoutProps {
	children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
	return (
		<html lang='en' suppressHydrationWarning>
			<body className='min-h-screen bg-background font-sans text-foreground'>
				<ServiceWorkerRegistration />
				{children}
				<Footer />
				<Toaster richColors position='top-center' />
			</body>
		</html>
	)
}
