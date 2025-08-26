import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import Footer from '@/components/shared/footer'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
})

export const metadata: Metadata = {
	metadataBase: new URL('https://www.kingkebab.co.kr/'),
	title: 'King Kebab - Time Management System',
	description:
		"King Kebab Time Management System - Streamline your restaurant's supply chain with our comprehensive management solution. Track inventory, manage orders, and analyze data across multiple branches.",
	authors: [
		{
			name: 'Jakhon Yokubov',
			url: 'https://www.kingkebab.co.kr',
		},
	],
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
		title: 'King Kebab - Time Management System',
		description:
			'King Kebab - The best and most delicious kebab restaurant in Korea. We serve you the finest dishes from Turkish and Uzbek cuisine. Fast and quality service, affordable prices, and amazing taste.',
		type: 'website',
		url: 'https://www.kingkebab.co.kr',
		locale: 'kr-KR',
		images: '/crown.jpg',
		countryName: 'Korea',
		siteName: 'King Kebab - Time Management System',
		emails: 'info@kingkebab.co.kr',
	},
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='en'>
			<head>
				<link rel='icon' type='image/jpeg' href='/crown.jpg' />
				<link rel='icon' type='image/x-icon' href='/favicon.ico' />
				<link rel='icon' type='image/png' href='/crown.jpg' />
				<link rel='apple-touch-icon' href='/apple-touch-icon.png' />
				<link rel='apple-touch-icon' sizes='180x180' href='/crown.jpg' />
				<link rel='shortcut icon' href='/favicon.ico' />
				<link rel='manifest' href='/manifest.json' />
				<meta name='theme-color' content='#1f2937' />
				<meta name='apple-mobile-web-app-capable' content='yes' />
				<meta name='apple-mobile-web-app-status-bar-style' content='default' />
				<meta name='apple-mobile-web-app-title' content='King Kebab' />
				<meta name='msapplication-TileColor' content='#1f2937' />
				<meta name='msapplication-TileImage' content='/crown.jpg' />
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ServiceWorkerRegistration />
				{children}
				<Footer />
				<Toaster />
			</body>
		</html>
	)
}
