'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface ModeToggleProps {
	/** Slightly smaller trigger for dense toolbars */
	compact?: boolean
	className?: string
}

/**
 * shadcn/ui-style theme control (next-themes + DropdownMenu).
 * @see https://ui.shadcn.com/docs/dark-mode/next
 */
export function ModeToggle({ compact = false, className }: ModeToggleProps) {
	const { setTheme, theme, resolvedTheme } = useTheme()
	const [mounted, setMounted] = React.useState(false)

	React.useEffect(() => {
		setMounted(true)
	}, [])

	React.useEffect(() => {
		if (!mounted || theme !== 'system') return
		setTheme(resolvedTheme === 'dark' ? 'dark' : 'light')
	}, [mounted, theme, resolvedTheme, setTheme])

	if (!mounted) {
		return (
			<Button
				variant='outline'
				size='icon'
				className={cn(compact ? 'h-9 w-9' : 'h-10 w-10', className)}
				disabled
				aria-hidden
			>
				<Sun className='h-[1.125rem] w-[1.125rem]' />
			</Button>
		)
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant='outline'
					size='icon'
					className={cn(
						'relative overflow-hidden rounded-md',
						compact ? 'h-9 w-9' : 'h-10 w-10',
						className,
					)}
				>
					<Sun className='h-[1.125rem] w-[1.125rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
					<Moon className='absolute h-[1.125rem] w-[1.125rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
					<span className='sr-only'>Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
