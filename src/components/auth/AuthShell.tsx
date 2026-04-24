import Image from 'next/image'
import type { ReactNode } from 'react'

interface AuthShellProps {
	title: string
	subtitle?: string
	children: ReactNode
	footer?: ReactNode
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
	return (
		<main className='flex min-h-screen items-center justify-center px-4 py-12'>
			<div className='w-full max-w-sm'>
				<div className='mb-10 flex flex-col items-center text-center'>
					<Image
						src='/image.png'
						alt='King Kebab'
						width={64}
						height={64}
						priority
						className='mb-6 h-16 w-16 rounded-2xl object-contain shadow-card'
					/>
					<h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
						{title}
					</h1>
					{subtitle && (
						<p className='mt-2 text-sm text-muted-foreground'>{subtitle}</p>
					)}
				</div>

				<div className='rounded-2xl border bg-card p-6 shadow-card sm:p-8'>
					{children}
				</div>

				{footer && (
					<p className='mt-6 text-center text-sm text-muted-foreground'>
						{footer}
					</p>
				)}
			</div>
		</main>
	)
}
