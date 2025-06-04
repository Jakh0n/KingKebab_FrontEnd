'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { registerWorker } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function RegisterWorker() {
	const [formData, setFormData] = useState({
		username: '',
		password: '',
		position: 'worker',
		isAdmin: false,
	})
	const [isLoading, setIsLoading] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setIsLoading(true)

		try {
			if (!formData.username || !formData.password) {
				throw new Error('Please fill in all fields')
			}

			await registerWorker(formData)
			toast.success('Worker registered successfully')

			// Reset form
			setFormData({
				username: '',
				password: '',
				position: 'worker',
				isAdmin: false,
			})
		} catch (error) {
			console.error('Registration error:', error)
			toast.error(
				error instanceof Error ? error.message : 'Failed to register worker'
			)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Card className='w-full max-w-md bg-[#0E1422] text-white border-none'>
			<CardHeader>
				<CardTitle className='text-xl font-semibold'>
					Register New Worker
				</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='username'>Username</Label>
						<Input
							id='username'
							value={formData.username}
							onChange={e =>
								setFormData({ ...formData, username: e.target.value })
							}
							className='bg-[#1A1F2E] border-none text-white'
							placeholder='Enter username'
							disabled={isLoading}
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='password'>Password</Label>
						<Input
							id='password'
							type='password'
							value={formData.password}
							onChange={e =>
								setFormData({ ...formData, password: e.target.value })
							}
							className='bg-[#1A1F2E] border-none text-white'
							placeholder='Enter password'
							disabled={isLoading}
						/>
					</div>
					<div className='space-y-2'>
						<Label>Position</Label>
						<Select
							value={formData.position}
							onValueChange={value =>
								setFormData({ ...formData, position: value })
							}
							disabled={isLoading}
						>
							<SelectTrigger className='bg-[#1A1F2E] border-none text-white'>
								<SelectValue placeholder='Select position' />
							</SelectTrigger>
							<SelectContent className='bg-[#1A1F2E] text-white border-none'>
								<SelectItem value='worker'>Worker</SelectItem>
								<SelectItem value='rider'>Rider</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className='flex items-center space-x-2'>
						<Checkbox
							id='isAdmin'
							checked={formData.isAdmin}
							onCheckedChange={checked =>
								setFormData({ ...formData, isAdmin: checked as boolean })
							}
							className='border-white data-[state=checked]:bg-[#4E7BEE] data-[state=checked]:border-[#4E7BEE]'
							disabled={isLoading}
						/>
						<Label htmlFor='isAdmin' className='text-sm font-normal'>
							Make admin
						</Label>
					</div>
					<Button
						type='submit'
						className='w-full bg-[#4E7BEE] hover:bg-[#4E7BEE]/90'
						disabled={isLoading}
					>
						{isLoading ? (
							<>
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								Registering...
							</>
						) : (
							'Register Worker'
						)}
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
