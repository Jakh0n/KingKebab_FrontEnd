import Link from 'next/link'

export default function Footer() {
	return (
		<footer className='border-t bg-background'>
			<div className='mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row'>
				<p>© {new Date().getFullYear()} King Kebab</p>
				<Link
					href='https://www.linkedin.com/in/jakhon-yokubov/'
					target='_blank'
					rel='noopener noreferrer'
					className='transition-colors hover:text-foreground'
				>
					Crafted by Jakhon Yokubov
				</Link>
			</div>
		</footer>
	)
}
