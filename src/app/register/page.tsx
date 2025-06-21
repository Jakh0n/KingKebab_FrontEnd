'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { register } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChangeEvent, FormEvent, useState } from 'react'

export default function RegisterPage() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [employeeId, setEmployeeId] = useState('')
	const [position, setPosition] = useState<'worker' | 'rider'>('worker')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setIsLoading(true)
		try {
			const response = await register(username, password, position, employeeId)
			localStorage.setItem('token', response.token)
			localStorage.setItem('position', response.position)
			localStorage.setItem('employeeId', response.employeeId)
			router.push('/dashboard')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Registration failed')
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
					<CardTitle className='text-2xl text-center'>Register</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='username'>Username</Label>
							<Input
								id='username'
								placeholder='Enter username'
								value={username}
								onChange={(e: ChangeEvent<HTMLInputElement>) =>
									setUsername(e.target.value)
								}
								required
								disabled={isLoading}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='password'>Password</Label>
							<Input
								id='password'
								type='password'
								placeholder='Enter password'
								value={password}
								onChange={(e: ChangeEvent<HTMLInputElement>) =>
									setPassword(e.target.value)
								}
								required
								disabled={isLoading}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='employeeId'>Employee ID</Label>
							<Input
								id='employeeId'
								placeholder='Enter employee ID'
								value={employeeId}
								onChange={(e: ChangeEvent<HTMLInputElement>) =>
									setEmployeeId(e.target.value)
								}
								required
								disabled={isLoading}
							/>
						</div>
						<div className='space-y-2'>
							<Label>Position</Label>
							<div className='flex space-x-4'>
								<label className='flex items-center space-x-2'>
									<input
										type='radio'
										name='position'
										value='worker'
										checked={position === 'worker'}
										onChange={e =>
											setPosition(e.target.value as 'worker' | 'rider')
										}
										className='form-radio'
										disabled={isLoading}
									/>
									<span>Worker</span>
								</label>
								<label className='flex items-center space-x-2'>
									<input
										type='radio'
										name='position'
										value='rider'
										checked={position === 'rider'}
										onChange={e =>
											setPosition(e.target.value as 'worker' | 'rider')
										}
										className='form-radio'
										disabled={isLoading}
									/>
									<span>Rider</span>
								</label>
							</div>
						</div>
						{error && <p className='text-red-500 text-sm'>{error}</p>}
						<Button type='submit' className='w-full' disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									Registering...
								</>
							) : (
								'Register'
							)}
						</Button>
						<p className='text-center text-sm text-gray-500'>
							Already have an account?{' '}
							<Link href='/login' className='text-blue-600 hover:underline'>
								Login
							</Link>
						</p>
					</form>
				</CardContent>
			</Card>
		</main>
	)
}
