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
	keywords: [
		'King Kebab',
		'kebab restaurant',
		'Turkish food',
		'Uzbek cuisine',
		'best kebab in Korea',
		'halal food',
		'Middle Eastern food',
		'kebab delivery',
		'kebab takeout',
		'restaurant in Korea',
		'Turkish restaurant',
		'Uzbek restaurant',
		'kebab menu',
		'fresh kebab',
		'quality food',
		'affordable dining',
		'fast food',
		'ethnic cuisine',
	],
	authors: [
		{
			name: 'Jakhon Yokubov',
			url: 'https://flami.org',
		},
	],
	creator: 'King Kebab',
	publisher: 'King Kebab',
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	icons: {
		icon: '/workinghours.jpg',
		apple: '/workinghours.jpg',
		shortcut: '/workinghours.jpg',
	},
	manifest: '/manifest.json',
	openGraph: {
		title: 'King Kebab - The best and most delicious kebab restaurant in Korea',
		description:
			'King Kebab - The best and most delicious kebab restaurant in Korea. We serve you the finest dishes from Turkish and Uzbek cuisine. Fast and quality service, affordable prices, and amazing taste.',
		type: 'website',
		url: 'https://www.kingkebab.co.kr',
		locale: 'ko-KR',
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
	twitter: {
		card: 'summary_large_image',
		title: 'King Kebab - The best and most delicious kebab restaurant in Korea',
		description:
			'King Kebab - The best and most delicious kebab restaurant in Korea. We serve you the finest dishes from Turkish and Uzbek cuisine.',
		images: ['/workinghours.jpg'],
	},
	alternates: {
		canonical: 'https://www.kingkebab.co.kr',
	},
	category: 'restaurant',
	classification: 'food',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='ko'>
			<head>
				<link rel='preconnect' href='https://fonts.googleapis.com' />
				<link
					rel='preconnect'
					href='https://fonts.gstatic.com'
					crossOrigin='anonymous'
				/>
				<meta name='theme-color' content='#1f2937' />
				<meta name='color-scheme' content='dark light' />
				<meta
					name='viewport'
					content='width=device-width, initial-scale=1, maximum-scale=5'
				/>
				<meta name='format-detection' content='telephone=no' />
				<meta name='apple-mobile-web-app-capable' content='yes' />
				<meta name='apple-mobile-web-app-status-bar-style' content='default' />
				<meta name='apple-mobile-web-app-title' content='King Kebab' />
				<meta name='application-name' content='King Kebab' />
				<meta name='msapplication-TileColor' content='#1f2937' />
				<meta name='msapplication-config' content='/browserconfig.xml' />
				<link
					rel='icon'
					type='image/jpeg'
					sizes='32x32'
					href='/workinghours.jpg'
				/>
				<link
					rel='icon'
					type='image/jpeg'
					sizes='16x16'
					href='/workinghours.jpg'
				/>
				<link rel='apple-touch-icon' href='/workinghours.jpg' />
				<link rel='mask-icon' href='/workinghours.jpg' color='#1f2937' />
				<script
					type='application/ld+json'
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							'@context': 'https://schema.org',
							'@type': 'Restaurant',
							name: 'King Kebab',
							description:
								'The best and most delicious kebab restaurant in Korea',
							url: 'https://www.kingkebab.co.kr',
							logo: 'https://www.kingkebab.co.kr/workinghours.jpg',
							image: 'https://www.kingkebab.co.kr/workinghours.jpg',
							address: {
								'@type': 'PostalAddress',
								addressCountry: 'KR',
								addressRegion: 'South Korea',
							},
							servesCuisine: ['Turkish', 'Uzbek', 'Middle Eastern'],
							priceRange: '$$',
							telephone: '+82-XXX-XXXX-XXXX',
							email: 'info@kingkebab.co.kr',
							openingHours: 'Mo-Su 11:00-22:00',
							menu: 'https://www.kingkebab.co.kr/menu',
							acceptsReservations: true,
							deliveryAvailable: true,
							takeoutAvailable: true,
							paymentAccepted: ['Cash', 'Credit Card', 'Mobile Payment'],
							currenciesAccepted: 'KRW',
						}),
					}}
				/>
			</head>
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
