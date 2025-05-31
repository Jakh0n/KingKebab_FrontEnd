'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { register } from '@/lib/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChangeEvent, FormEvent, useState } from 'react'

export default function RegisterPage() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [position, setPosition] = useState<'worker' | 'rider'>('worker')
	const [error, setError] = useState('')
	const router = useRouter()

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		try {
			const response = await register(username, password, position)
			localStorage.setItem('token', response.token)
			localStorage.setItem('position', response.position)
			router.push('/dashboard')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Registration failed')
		}
	}

	return (
		<main className='flex min-h-screen items-center justify-center p-4 bg-gray-50'>
			<Card className='w-full max-w-md'>
				<CardHeader>
					<CardTitle className='text-2xl text-center'>
						Ro&apos;yxatdan o&apos;tish
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='username'>Foydalanuvchi nomi</Label>
							<Input
								id='username'
								placeholder='Foydalanuvchi nomini kiriting'
								value={username}
								onChange={(e: ChangeEvent<HTMLInputElement>) =>
									setUsername(e.target.value)
								}
								required
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='password'>Parol</Label>
							<Input
								id='password'
								type='password'
								placeholder='Parolni kiriting'
								value={password}
								onChange={(e: ChangeEvent<HTMLInputElement>) =>
									setPassword(e.target.value)
								}
								required
							/>
						</div>
						<div className='space-y-2'>
							<Label>Lavozim</Label>
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
									/>
									<span>Ishchi</span>
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
									/>
									<span>Rider</span>
								</label>
							</div>
						</div>
						{error && <p className='text-red-500 text-sm'>{error}</p>}
						<Button type='submit' className='w-full'>
							Ro&apos;yxatdan o&apos;tish
						</Button>
						<p className='text-center text-sm text-gray-500'>
							Akkountingiz bormi?{' '}
							<Link href='/login' className='text-blue-600 hover:underline'>
								Kirish
							</Link>
						</p>
					</form>
				</CardContent>
			</Card>
		</main>
	)
}
