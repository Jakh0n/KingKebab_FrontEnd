'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/api'
import { Loader2 } from 'lucide-react'
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
		try {
			const response = await login(username, password)
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
			setError(err instanceof Error ? err.message : 'Login failed')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<main className='flex min-h-screen items-center justify-center p-4 bg-gray-50'>
			<Card className='w-full max-w-md'>
				<CardHeader>
					<CardTitle className='text-2xl text-center'>Login</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='username'>Username</Label>
							<Input
								id='username'
								placeholder='Enter your username'
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
								placeholder='Enter your password'
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
					</form>
				</CardContent>
			</Card>
		</main>
	)
}
