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
	title: 'King Kebab | South Korea',
	description:
		'Best kebab restaurant in South Korea. Order delicious kebabs, shawarma, and other Turkish dishes.',
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
		title: 'King Kebab | South Korea',
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
		locale: 'ko_KR',
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
				<Toaster />
			</body>
		</html>
	)
}
