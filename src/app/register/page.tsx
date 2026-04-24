'use client'

import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { register } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'

type Position = 'worker' | 'rider' | 'monthly'

const POSITIONS: { value: Position; label: string }[] = [
	{ value: 'worker', label: 'Worker' },
	{ value: 'rider', label: 'Rider' },
	{ value: 'monthly', label: 'Monthly' },
]

export default function RegisterPage() {
	const router = useRouter()
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [employeeId, setEmployeeId] = useState('')
	const [position, setPosition] = useState<Position>('worker')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setIsLoading(true)
		setError('')

		try {
			const response = await register(username, password, position, employeeId)
			localStorage.setItem('token', response.token)
			localStorage.setItem('position', response.position)
			localStorage.setItem('employeeId', response.employeeId)

			toast.success('Account created', {
				description: `Welcome, ${username}`,
			})
			router.push('/dashboard')
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Registration failed'
			setError(message)
			toast.error('Registration failed', { description: message })
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<AuthShell
			title='Create account'
			subtitle='Join the King Kebab team portal.'
			footer={
				<>
					Already have an account?{' '}
					<Link href='/login' className='font-medium text-primary hover:underline'>
						Sign in
					</Link>
				</>
			}
		>
			<form onSubmit={handleSubmit} className='space-y-5'>
				<div className='space-y-2'>
					<Label htmlFor='username'>Username</Label>
					<Input
						id='username'
						autoComplete='username'
						placeholder='Choose a username'
						value={username}
						onChange={e => setUsername(e.target.value)}
						disabled={isLoading}
						required
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='password'>Password</Label>
					<Input
						id='password'
						type='password'
						autoComplete='new-password'
						placeholder='At least 6 characters'
						value={password}
						onChange={e => setPassword(e.target.value)}
						disabled={isLoading}
						required
						minLength={6}
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='employeeId'>Employee ID</Label>
					<Input
						id='employeeId'
						placeholder='Your employee ID'
						value={employeeId}
						onChange={e => setEmployeeId(e.target.value)}
						disabled={isLoading}
						required
					/>
				</div>

				<div className='space-y-2'>
					<Label>Position</Label>
					<div
						role='radiogroup'
						className='grid grid-cols-3 gap-2 rounded-xl bg-muted p-1'
					>
						{POSITIONS.map(option => {
							const selected = position === option.value
							return (
								<button
									key={option.value}
									type='button'
									role='radio'
									aria-checked={selected}
									onClick={() => setPosition(option.value)}
									disabled={isLoading}
									className={cn(
										'h-9 rounded-lg text-sm font-medium transition-colors',
										selected
											? 'bg-card text-foreground shadow-card'
											: 'text-muted-foreground hover:text-foreground'
									)}
								>
									{option.label}
								</button>
							)
						})}
					</div>
				</div>

				{error && (
					<p className='text-sm text-destructive' role='alert'>
						{error}
					</p>
				)}

				<Button
					type='submit'
					className='w-full rounded-full'
					size='lg'
					disabled={isLoading}
				>
					{isLoading ? (
						<>
							<Loader2 className='h-4 w-4 animate-spin' />
							Creating…
						</>
					) : (
						'Create account'
					)}
				</Button>
			</form>
		</AuthShell>
	)
}
