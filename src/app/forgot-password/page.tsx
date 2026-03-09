'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset, resetPassword } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'

type Step = 'employeeId' | 'newPassword'

export default function ForgotPasswordPage() {
	const [step, setStep] = useState<Step>('employeeId')
	const [employeeId, setEmployeeId] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	async function handleVerifyEmployeeId(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setIsLoading(true)
		setError('')
		try {
			await requestPasswordReset(employeeId)
			setStep('newPassword')
			toast.success('Employee ID verified')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error')
			toast.error(err instanceof Error ? err.message : 'Error')
		} finally {
			setIsLoading(false)
		}
	}

	async function handleResetPassword(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setError('')
		if (newPassword !== confirmPassword) {
			setError('Passwords do not match')
			return
		}
		if (newPassword.length < 6) {
			setError('Password must be at least 6 characters')
			return
		}
		setIsLoading(true)
		try {
			await resetPassword(employeeId, newPassword)
			toast.success('Password updated')
			router.push('/login')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error')
			toast.error(err instanceof Error ? err.message : 'Error')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<main className='flex min-h-screen items-center justify-center p-4 bg-gray-50'>
			<Card className='w-full max-w-md'>
				<CardHeader>
					<Image
						src='/image.png'
						alt='King Kebab Logo'
						className='w-24 h-24 object-contain mb-4 mx-auto'
						width={100}
						height={100}
					/>
					<CardTitle className='text-xl text-center'>
						{step === 'employeeId' ? 'Reset password' : 'New password'}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{step === 'employeeId' ? (
						<form onSubmit={handleVerifyEmployeeId} className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='employeeId'>Employee ID</Label>
								<Input
									id='employeeId'
									placeholder='Enter your Employee ID'
									value={employeeId}
									onChange={(e) => setEmployeeId(e.target.value)}
									required
									disabled={isLoading}
								/>
							</div>
							{error && <p className='text-red-500 text-sm'>{error}</p>}
							<Button type='submit' className='w-full' disabled={isLoading}>
								{isLoading ? <Loader2 className='h-4 w-4 animate-spin mx-auto' /> : 'Continue'}
							</Button>
						</form>
					) : (
						<form onSubmit={handleResetPassword} className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='newPassword'>New password</Label>
								<Input
									id='newPassword'
									type='password'
									placeholder='At least 6 characters'
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									required
									minLength={6}
									disabled={isLoading}
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='confirmPassword'>Confirm password</Label>
								<Input
									id='confirmPassword'
									type='password'
									placeholder='Re-enter password'
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									required
									minLength={6}
									disabled={isLoading}
								/>
							</div>
							{error && <p className='text-red-500 text-sm'>{error}</p>}
							<Button type='submit' className='w-full' disabled={isLoading}>
								{isLoading ? <Loader2 className='h-4 w-4 animate-spin mx-auto' /> : 'Update password'}
							</Button>
							<Button
								type='button'
								variant='ghost'
								className='w-full'
								disabled={isLoading}
								onClick={() => setStep('employeeId')}
							>
								Back
							</Button>
						</form>
					)}
					<p className='text-center text-sm text-gray-500 mt-4'>
						<Link href='/login' className='text-blue-600 hover:underline'>
							Back to login
						</Link>
					</p>
				</CardContent>
			</Card>
		</main>
	)
}
