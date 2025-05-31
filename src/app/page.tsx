import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
	return (
		<main className='flex min-h-screen flex-col items-center justify-center p-24'>
			<div className='text-center'>
				<h1 className='text-4xl font-bold mb-8'>Vaqt Kuzatish Tizimi</h1>
				<div className='space-x-4'>
					<Button asChild>
						<Link href='/login'>Kirish</Link>
					</Button>
					<Button asChild variant='outline'>
						<Link href='/register'>Ro&apos;yxatdan o&apos;tish</Link>
					</Button>
				</div>
			</div>
		</main>
	)
}
