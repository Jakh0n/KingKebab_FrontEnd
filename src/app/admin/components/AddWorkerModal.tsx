'use client'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'

interface AddWorkerModalProps {
	isOpen: boolean
	onClose: () => void
	onAdd: (workerData: {
		username: string
		password: string
		position: string
		isAdmin: boolean
		employeeId: string
	}) => void
}

export default function AddWorkerModal({
	isOpen,
	onClose,
	onAdd,
}: AddWorkerModalProps) {
	const [formData, setFormData] = useState({
		username: '',
		password: '',
		position: 'worker',
		isAdmin: false,
		employeeId: '',
	})
	const [error, setError] = useState('')

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		setError('')

		if (!formData.username || !formData.password || !formData.employeeId) {
			setError('Please fill in all fields')
			return
		}

		onAdd(formData)
		setFormData({
			username: '',
			password: '',
			position: 'worker',
			isAdmin: false,
			employeeId: '',
		})
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='bg-[#0E1422] text-white border-none sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle className='text-xl font-semibold text-white'>
						Add New Worker
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='space-y-4 mt-4'>
					<div className='space-y-2'>
						<Label htmlFor='employeeId'>Employee ID</Label>
						<Input
							id='employeeId'
							value={formData.employeeId}
							onChange={e =>
								setFormData({ ...formData, employeeId: e.target.value })
							}
							className='bg-[#1A1F2E] border-none text-white'
							placeholder='Enter employee ID'
						/>
					</div>
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
						/>
					</div>
					<div className='space-y-2'>
						<Label>Position</Label>
						<Select
							value={formData.position}
							onValueChange={value =>
								setFormData({ ...formData, position: value })
							}
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
					{/* <div className='flex items-center space-x-2'>
						<Checkbox
							id='isAdmin'
							checked={formData.isAdmin}
							onCheckedChange={(checked: boolean | 'indeterminate') =>
								setFormData({ ...formData, isAdmin: checked as boolean })
							}
							className='border-white data-[state=checked]:bg-[#4E7BEE] data-[state=checked]:border-[#4E7BEE]'
						/>
						<Label htmlFor='isAdmin' className='text-sm font-normal'>
							Make admin
						</Label>
					</div> */}
					{error && <p className='text-red-500 text-sm'>{error}</p>}
					<div className='flex justify-end gap-3 pt-4'>
						<Button
							type='button'
							onClick={onClose}
							variant='outline'
							className='bg-transparent text-white hover:bg-[#1A1F2E] hover:text-white'
						>
							Cancel
						</Button>
						<Button
							type='submit'
							className='bg-[#4E7BEE] hover:bg-[#4E7BEE]/90'
						>
							Add Worker
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
