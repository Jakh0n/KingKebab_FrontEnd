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
import { Announcement } from '@/types'
import { useState } from 'react'
import { toast } from 'sonner'

interface AnnouncementModalProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (data: {
		title: string
		content: string
		type: 'info' | 'warning' | 'success'
		isActive?: boolean
	}) => void
	announcement?: Announcement
}

export default function AnnouncementModal({
	isOpen,
	onClose,
	onSubmit,
	announcement,
}: AnnouncementModalProps) {
	const [formData, setFormData] = useState({
		title: announcement?.title || '',
		content: announcement?.content || '',
		type: announcement?.type || 'info',
		isActive: announcement?.isActive ?? true,
	})

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!formData.title.trim() || !formData.content.trim()) {
			toast.error('Please fill in all fields')
			return
		}
		onSubmit(formData)
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='bg-[#1A1F2E] border-[#2A3447] text-white sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>
						{announcement ? 'Edit Announcement' : 'Add New Announcement'}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='title'>Title</Label>
						<Input
							id='title'
							value={formData.title}
							onChange={e =>
								setFormData({ ...formData, title: e.target.value })
							}
							className='bg-[#0E1422] border-[#2A3447] focus:border-[#4E7BEE] focus:ring-1 focus:ring-[#4E7BEE]'
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='content'>Content</Label>
						<textarea
							id='content'
							value={formData.content}
							onChange={e =>
								setFormData({ ...formData, content: e.target.value })
							}
							className='w-full h-24 bg-[#0E1422] border border-[#2A3447] rounded-md p-2 text-white focus:border-[#4E7BEE] focus:ring-1 focus:ring-[#4E7BEE] outline-none'
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='type'>Type</Label>
						<select
							id='type'
							value={formData.type}
							onChange={e =>
								setFormData({
									...formData,
									type: e.target.value as 'info' | 'warning' | 'success',
								})
							}
							className='w-full bg-[#0E1422] border border-[#2A3447] rounded-md p-2 text-white focus:border-[#4E7BEE] focus:ring-1 focus:ring-[#4E7BEE] outline-none'
						>
							<option value='info'>Information</option>
							<option value='warning'>Warning</option>
							<option value='success'>Success</option>
						</select>
					</div>
					{announcement && (
						<div className='flex items-center gap-2'>
							<input
								type='checkbox'
								id='isActive'
								checked={formData.isActive}
								onChange={e =>
									setFormData({
										...formData,
										isActive: e.target.checked,
									})
								}
								className='w-4 h-4 rounded border-gray-300 text-[#4E7BEE] focus:ring-[#4E7BEE]'
							/>
							<Label htmlFor='isActive'>Active</Label>
						</div>
					)}
					<div className='flex justify-end gap-2 pt-4'>
						<Button
							type='button'
							variant='outline'
							onClick={onClose}
							className='border-[#2A3447] hover:bg-[#2A3447] text-white'
						>
							Cancel
						</Button>
						<Button
							type='submit'
							className='bg-[#4E7BEE] hover:bg-[#4E7BEE]/90'
						>
							{announcement ? 'Update' : 'Create'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
