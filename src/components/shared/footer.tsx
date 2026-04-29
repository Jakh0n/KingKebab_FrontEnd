import { ModeToggle } from '@/components/ui/mode-toggle'
import Link from 'next/link'

export default function Footer() {
	return (
		<footer className='border-t border-border/80 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80'>
			<div className='mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:gap-3'>
				<p className='order-2 sm:order-1'>© {new Date().getFullYear()} King Kebab</p>
				<div className='order-1 flex flex-col items-center gap-3 sm:order-2 sm:flex-row sm:gap-4'>
					<ModeToggle compact className='shrink-0' />
					<Link
						href='https://www.linkedin.com/in/jakhon-yokubov/'
						target='_blank'
						rel='noopener noreferrer'
						className='rounded-md transition-colors hover:text-foreground'
					>
						Crafted by Jakhon Yokubov
					</Link>
				</div>
			</div>
		</footer>
	)
}
