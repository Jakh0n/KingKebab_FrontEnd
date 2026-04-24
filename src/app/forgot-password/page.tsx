'use client'

import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset, resetPassword } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'

type Step = 'employeeId' | 'newPassword'

const MIN_PASSWORD_LENGTH = 6

export default function ForgotPasswordPage() {
	const router = useRouter()
	const [step, setStep] = useState<Step>('employeeId')
	const [employeeId, setEmployeeId] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	async function handleVerify(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setIsLoading(true)
		setError('')

		try {
			await requestPasswordReset(employeeId)
			setStep('newPassword')
			toast.success('Employee ID verified')
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Verification failed'
			setError(message)
			toast.error(message)
		} finally {
			setIsLoading(false)
		}
	}

	async function handleReset(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError('')

		if (newPassword !== confirmPassword) {
			setError('Passwords do not match')
			return
		}
		if (newPassword.length < MIN_PASSWORD_LENGTH) {
			setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
			return
		}

		setIsLoading(true)
		try {
			await resetPassword(employeeId, newPassword)
			toast.success('Password updated')
			router.push('/login')
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Update failed'
			setError(message)
			toast.error(message)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<AuthShell
			title={step === 'employeeId' ? 'Reset password' : 'New password'}
			subtitle={
				step === 'employeeId'
					? 'Enter your Employee ID to continue.'
					: 'Choose a strong password you’ll remember.'
			}
			footer={
				<Link href='/login' className='font-medium text-primary hover:underline'>
					Back to sign in
				</Link>
			}
		>
			{step === 'employeeId' ? (
				<form onSubmit={handleVerify} className='space-y-5'>
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
						{isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Continue'}
					</Button>
				</form>
			) : (
				<form onSubmit={handleReset} className='space-y-5'>
					<div className='space-y-2'>
						<Label htmlFor='newPassword'>New password</Label>
						<Input
							id='newPassword'
							type='password'
							autoComplete='new-password'
							placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
							value={newPassword}
							onChange={e => setNewPassword(e.target.value)}
							disabled={isLoading}
							required
							minLength={MIN_PASSWORD_LENGTH}
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='confirmPassword'>Confirm password</Label>
						<Input
							id='confirmPassword'
							type='password'
							autoComplete='new-password'
							placeholder='Re-enter password'
							value={confirmPassword}
							onChange={e => setConfirmPassword(e.target.value)}
							disabled={isLoading}
							required
							minLength={MIN_PASSWORD_LENGTH}
						/>
					</div>

					{error && (
						<p className='text-sm text-destructive' role='alert'>
							{error}
						</p>
					)}

					<div className='space-y-2'>
						<Button
							type='submit'
							className='w-full rounded-full'
							size='lg'
							disabled={isLoading}
						>
							{isLoading ? (
								<Loader2 className='h-4 w-4 animate-spin' />
							) : (
								'Update password'
							)}
						</Button>
						<Button
							type='button'
							variant='ghost'
							className='w-full rounded-full'
							disabled={isLoading}
							onClick={() => setStep('employeeId')}
						>
							Back
						</Button>
					</div>
				</form>
			)}
		</AuthShell>
	)
}
