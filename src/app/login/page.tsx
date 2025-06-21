'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login, logout } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChangeEvent, FormEvent, useState } from 'react'

export default function LoginPage() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setIsLoading(true)
		setError('')

		// Avvalgi barcha ma'lumotlarni tozalash
		logout()

		try {
			if (!username || !password) {
				throw new Error('Username and password are required')
			}

			// Rate limiting
			const lastAttempt = localStorage.getItem('lastLoginAttempt')
			if (lastAttempt) {
				const timeDiff = Date.now() - parseInt(lastAttempt)
				if (timeDiff < 2000) {
					// 2 sekund kutish
					throw new Error('Please wait before trying again')
				}
			}
			localStorage.setItem('lastLoginAttempt', Date.now().toString())

			const response = await login(username, password)

			if (!response || !response.token) {
				throw new Error('Invalid response from server')
			}

			// Token validatsiyasi
			try {
				const payload = JSON.parse(atob(response.token.split('.')[1]))
				if (!payload.exp || Date.now() >= payload.exp * 1000) {
					throw new Error('Token has expired')
				}
			} catch {
				throw new Error('Invalid token format')
			}

			localStorage.setItem('token', response.token)
			localStorage.setItem('position', response.position)

			// Decode JWT token and check isAdmin
			const token = response.token
			const payload = JSON.parse(atob(token.split('.')[1]))

			if (payload.isAdmin) {
				router.push('/admin')
			} else {
				router.push('/dashboard')
			}
		} catch (err) {
			console.error('Login error:', err)
			setError(err instanceof Error ? err.message : 'Login failed')
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
					<CardTitle className='text-2xl text-center'>Welcome Back</CardTitle>
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
						{error && <p className='text-red-500 text-sm'>{error}</p>}
						<Button type='submit' className='w-full' disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									Logging in...
								</>
							) : (
								'Login'
							)}
						</Button>
						<p className='text-center text-sm text-gray-500'>
							Don&apos;t have an account?{' '}
							<Link href='/register' className='text-blue-600 hover:underline'>
								Register
							</Link>
						</p>
					</form>
				</CardContent>
			</Card>
		</main>
	)
}
