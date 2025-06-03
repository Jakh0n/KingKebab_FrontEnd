import Footer from '@/components/shared/footer'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
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
	title: 'King Kebab | Tashkent',
	description:
		'Best kebab restaurant in Tashkent. Order delicious kebabs, shawarma, and other Turkish dishes.',
	keywords: [
		'kebab',
		'turkish food',
		'restaurant',
		'seoul',
		'delivery',
		'shawarma',
	],
	authors: [{ name: 'Jakhon Yokubov' }],
	creator: 'Jakhon Yokubov',
	publisher: 'King Kebab',
	robots: 'index, follow',
	icons: {
		icon: '/cropped-kinglogo.avif',
	},
	openGraph: {
		title: 'King Kebab | Seoul',
		images: [
			{
				url: '/cropped-kinglogo.avif',
				width: 800,
				height: 600,
			},
		],
		description:
			'Best kebab restaurant in South Korea. Order delicious kebabs, shawarma, and other Turkish dishes.',
		url: 'https://www.kingkebab.co.kr',
		siteName: 'King Kebab',
		locale: 'en_US',
		type: 'website',
	},
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='en'>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				{children}
				<Footer />
			</body>
		</html>
	)
}
