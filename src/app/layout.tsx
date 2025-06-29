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
	title: 'King Kebab - The best and most delicious kebab restaurant in Korea',
	description:
		'King Kebab - The best and most delicious kebab restaurant in Korea. We serve you the finest dishes from Turkish and Uzbek cuisine. Fast and quality service, affordable prices, and amazing taste.',
	authors: [
		{
			name: 'Jakhon Yokubov',
			url: 'https://flami.org',
		},
	],
	icons: { icon: '/cropped-kinglogo.avif' },
	openGraph: {
		title: 'King Kebab - The best and most delicious kebab restaurant in Korea',
		description:
			'King Kebab - The best and most delicious kebab restaurant in Korea. We serve you the finest dishes from Turkish and Uzbek cuisine. Fast and quality service, affordable prices, and amazing taste.',
		type: 'website',
		url: 'https://www.kingkebab.co.kr',
		locale: 'kr-KR',
		images: [
			{
				url: '/workinghours.jpg',
				width: 1200,
				height: 630,
				alt: 'King Kebab - The best and most delicious kebab restaurant in Korea',
			},
		],
		countryName: 'Korea',
		siteName: 'King Kebab',
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
