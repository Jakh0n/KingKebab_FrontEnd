import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
	return (
		<main className='flex min-h-screen flex-col items-center justify-center p-6 md:p-12 lg:p-24'>
			<div className='text-center max-w-md mx-auto w-full'>
				<h1 className='text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 lg:mb-8 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'>
					Vaqt Kuzatish Tizimi
				</h1>
				<div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center'>
					<Button
						asChild
						className='text-sm md:text-base w-full sm:w-auto px-8 py-6 sm:py-4 rounded-xl hover:scale-105 transition-transform'
					>
						<Link href='/login'>Kirish</Link>
					</Button>
					<Button
						asChild
						variant='outline'
						className='text-sm md:text-base w-full sm:w-auto px-8 py-6 sm:py-4 rounded-xl hover:scale-105 transition-transform border-2'
					>
						<Link href='/register'>Ro&apos;yxatdan o&apos;tish</Link>
					</Button>
				</div>
			</div>
		</main>
	)
}
