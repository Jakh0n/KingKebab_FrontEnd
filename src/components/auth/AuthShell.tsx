import { ModeToggle } from '@/components/ui/mode-toggle'
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
		<main className='relative flex min-h-screen items-center justify-center px-4 py-12'>
			<div className='absolute right-4 top-4 z-20 sm:right-6 sm:top-6'>
				<ModeToggle compact />
			</div>
			<div className='w-full max-w-sm'>
				<div className='mb-10 flex flex-col items-center text-center'>
					<div className='mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-border/60 bg-card/80 p-2 shadow-sm backdrop-blur-sm'>
						<Image
							src='/image.png'
							alt='King Kebab'
							width={80}
							height={80}
							priority
							className='h-full w-full rounded-2xl object-cover object-top'
						/>
					</div>
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
