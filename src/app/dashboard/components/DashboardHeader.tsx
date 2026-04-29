'use client'

import { ModeToggle } from '@/components/ui/mode-toggle'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CalendarDays, LogOut, MoreHorizontal, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export interface DashboardUserData {
	id: string
	username: string
	position: string
	employeeId?: string
}

interface DashboardHeaderProps {
	userData: DashboardUserData | null
	onLogout: () => void
	logoutLoading: boolean
}

const SCHEDULE_URL = 'https://kingschadule.netlify.app'

function positionLabel(position?: string): string {
	switch (position) {
		case 'worker':
			return 'Worker'
		case 'rider':
			return 'Rider'
		default:
			return 'Monthly'
	}
}

export function DashboardHeader({
	userData,
	onLogout,
	logoutLoading,
}: DashboardHeaderProps) {
	const router = useRouter()

	return (
		<header className='sticky top-0 z-30 -mx-2 border-b bg-background/80 px-2 backdrop-blur-xl sm:-mx-4 sm:px-4'>
			<div className='flex items-center justify-between gap-3 py-3'>
				<div className='flex min-w-0 items-center gap-3'>
					<Image
						src='/cropped-kinglogo.avif'
						alt='King Kebab'
						width={40}
						height={40}
						className='h-10 w-10 rounded-xl object-contain'
					/>
					<div className='min-w-0'>
						<h1 className='truncate text-lg font-semibold tracking-tight sm:text-xl'>
							Dashboard
						</h1>
						{userData && (
							<p className='flex items-center gap-2 truncate text-xs text-muted-foreground sm:text-sm'>
								<span className='truncate'>{userData.username}</span>
								<span className='rounded-full border bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground'>
									{userData.employeeId ?? 'N/A'}
								</span>
								<span className='hidden sm:inline'>· {positionLabel(userData.position)}</span>
							</p>
						)}
					</div>
				</div>

				<nav className='hidden items-center gap-2 sm:flex'>
					<ModeToggle compact className='mr-1' />
					<Button asChild variant='ghost' size='sm' className='rounded-full'>
						<Link
							href={SCHEDULE_URL}
							target='_blank'
							rel='noopener noreferrer'
							className='inline-flex items-center'
						>
							<CalendarDays className='h-4 w-4' />
							Schedule
						</Link>
					</Button>
					<Button
						variant='ghost'
						size='sm'
						className='rounded-full'
						onClick={() => router.push('/dashboard/profile')}
						disabled={logoutLoading}
					>
						<User className='h-4 w-4' />
						Profile
					</Button>
					<Button
						variant='destructive'
						size='sm'
						className='rounded-full'
						onClick={onLogout}
						disabled={logoutLoading}
					>
						{logoutLoading ? (
							<span className='inline-flex items-center gap-2'>
								<span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white' />
								Signing out…
							</span>
						) : (
							<>
								<LogOut className='h-4 w-4' />
								Sign out
							</>
						)}
					</Button>
				</nav>

				<div className='flex items-center gap-2 sm:hidden'>
					<ModeToggle compact />
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='ghost' size='icon' aria-label='Open menu'>
								<MoreHorizontal className='h-5 w-5' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end' className='w-56'>
							<DropdownMenuItem asChild>
								<Link
									href={SCHEDULE_URL}
									target='_blank'
									rel='noopener noreferrer'
									className='flex items-center'
								>
									<CalendarDays className='mr-2 h-4 w-4' />
									Schedule
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
								<User className='mr-2 h-4 w-4' />
								Profile
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={onLogout}
								disabled={logoutLoading}
								className='text-destructive focus:text-destructive'
							>
								<LogOut className='mr-2 h-4 w-4' />
								{logoutLoading ? 'Signing out…' : 'Sign out'}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	)
}
