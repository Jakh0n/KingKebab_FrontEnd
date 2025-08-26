import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
	return (
		<main className='flex min-h-screen flex-col items-center justify-center p-6 md:p-12 lg:p-24'>
			<div className='text-center max-w-md mx-auto w-full'>
				<Image
					src='/workinghours.jpg'
					alt='King Kebab - The best and most delicious kebab restaurant in Korea'
					className='w-32 h-32 object-cover rounded-full mb-6 mx-auto shadow-lg'
					width={128}
					height={128}
					priority
				/>
				<h1 className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 lg:mb-8 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent'>
					King Kebab
				</h1>
				<p className='text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 md:mb-8'>
					The best and most delicious kebab restaurant in Korea
				</p>
				<p className='text-sm md:text-base text-gray-500 dark:text-gray-400 mb-8'>
					Serving authentic Turkish and Uzbek cuisine with quality ingredients and amazing taste
				</p>
				<div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center'>
					<Button
						asChild
						className='text-sm md:text-base w-full sm:w-auto px-8 py-6 sm:py-4 rounded-xl hover:scale-105 transition-transform bg-gradient-to-r from-amber-600 to-orange-600'
					>
						<Link href='/login'>Employee Login</Link>
					</Button>
					<Button
						asChild
						variant='outline'
						className='text-sm md:text-base w-full sm:w-auto px-8 py-6 sm:py-4 rounded-xl hover:scale-105 transition-transform border-2'
					>
						<Link href='/register'>Register</Link>
					</Button>
				</div>
				<div className='mt-8 text-sm text-gray-500 dark:text-gray-400'>
					<p>📍 South Korea</p>
					<p>🕒 Open Daily 11:00 AM - 10:00 PM</p>
					<p>📞 Call us for orders and reservations</p>
				</div>
			</div>
		</main>
	)
}
