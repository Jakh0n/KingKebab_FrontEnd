'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Branch, BranchFormData } from '@/types'
import { useEffect, useState } from 'react'

interface BranchModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (branchData: BranchFormData) => void
	branch?: Branch | null
	isEditing?: boolean
}

export default function BranchModal({
	isOpen,
	onClose,
	onSave,
	branch,
	isEditing = false,
}: BranchModalProps) {
	const [formData, setFormData] = useState<BranchFormData>({
		name: '',
		code: '',
		location: {
			address: '',
			city: '',
			district: '',
		},
		contact: {
			phone: '',
			email: '',
			manager: '',
		},
		operatingHours: {
			monday: { isOpen: true, open: '08:00', close: '22:00' },
			tuesday: { isOpen: true, open: '08:00', close: '22:00' },
			wednesday: { isOpen: true, open: '08:00', close: '22:00' },
			thursday: { isOpen: true, open: '08:00', close: '22:00' },
			friday: { isOpen: true, open: '08:00', close: '22:00' },
			saturday: { isOpen: true, open: '08:00', close: '22:00' },
			sunday: { isOpen: true, open: '08:00', close: '22:00' },
		},
		capacity: {
			maxWorkers: 5,
			maxRiders: 2,
		},
		requirements: {
			minimumStaff: 2,
			skillsRequired: [],
		},
		notes: '',
	})
	const [error, setError] = useState('')

	// Populate form when editing
	useEffect(() => {
		if (isEditing && branch) {
			setFormData({
				name: branch.name,
				code: branch.code,
				location: {
					address: branch.location.address,
					city: branch.location.city,
					district: branch.location.district || '',
				},
				contact: {
					phone: branch.contact?.phone || '',
					email: branch.contact?.email || '',
					manager: branch.contact?.manager || '',
				},
				operatingHours: branch.operatingHours,
				capacity: {
					maxWorkers: branch.capacity.maxWorkers,
					maxRiders: branch.capacity.maxRiders,
				},
				requirements: {
					minimumStaff: branch.requirements.minimumStaff,
					skillsRequired: branch.requirements.skillsRequired || [],
				},
				notes: branch.notes || '',
			})
		} else {
			// Reset form for new branch
			setFormData({
				name: '',
				code: '',
				location: {
					address: '',
					city: '',
					district: '',
				},
				contact: {
					phone: '',
					email: '',
					manager: '',
				},
				operatingHours: {
					monday: { isOpen: true, open: '08:00', close: '22:00' },
					tuesday: { isOpen: true, open: '08:00', close: '22:00' },
					wednesday: { isOpen: true, open: '08:00', close: '22:00' },
					thursday: { isOpen: true, open: '08:00', close: '22:00' },
					friday: { isOpen: true, open: '08:00', close: '22:00' },
					saturday: { isOpen: true, open: '08:00', close: '22:00' },
					sunday: { isOpen: true, open: '08:00', close: '22:00' },
				},
				capacity: {
					maxWorkers: 5,
					maxRiders: 2,
				},
				requirements: {
					minimumStaff: 2,
					skillsRequired: [],
				},
				notes: '',
			})
		}
	}, [isEditing, branch, isOpen])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		setError('')

		if (
			!formData.name ||
			!formData.code ||
			!formData.location.address ||
			!formData.location.city
		) {
			setError('Please fill in all required fields (name, code, address, city)')
			return
		}

		// Validate time format
		const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
		const days = [
			'monday',
			'tuesday',
			'wednesday',
			'thursday',
			'friday',
			'saturday',
			'sunday',
		]

		for (const day of days) {
			const daySchedule =
				formData.operatingHours?.[day as keyof typeof formData.operatingHours]
			if (daySchedule?.isOpen) {
				if (
					!timeRegex.test(daySchedule.open) ||
					!timeRegex.test(daySchedule.close)
				) {
					setError('Please use HH:MM format for operating hours')
					return
				}
			}
		}

		onSave(formData)
	}

	const updateDaySchedule = (
		day: string,
		field: string,
		value: boolean | string
	) => {
		setFormData(prev => {
			if (!prev.operatingHours) return prev

			const currentDay =
				prev.operatingHours[day as keyof typeof prev.operatingHours]
			if (!currentDay) return prev

			const updatedDay = {
				isOpen: field === 'isOpen' ? (value as boolean) : currentDay.isOpen,
				open: field === 'open' ? (value as string) : currentDay.open,
				close: field === 'close' ? (value as string) : currentDay.close,
			}

			return {
				...prev,
				operatingHours: {
					...prev.operatingHours,
					[day]: updatedDay,
				},
			}
		})
	}

	const toggleSkill = (skill: string) => {
		setFormData(prev => {
			const currentSkills = prev.requirements?.skillsRequired || []
			const typedSkill = skill as
				| 'cooking'
				| 'cashier'
				| 'cleaning'
				| 'management'
				| 'delivery'
			const skillExists = currentSkills.includes(typedSkill)

			return {
				...prev,
				requirements: {
					...prev.requirements!,
					skillsRequired: skillExists
						? currentSkills.filter(s => s !== skill)
						: [...currentSkills, typedSkill],
				},
			}
		})
	}

	const days = [
		{ key: 'monday', label: 'Monday' },
		{ key: 'tuesday', label: 'Tuesday' },
		{ key: 'wednesday', label: 'Wednesday' },
		{ key: 'thursday', label: 'Thursday' },
		{ key: 'friday', label: 'Friday' },
		{ key: 'saturday', label: 'Saturday' },
		{ key: 'sunday', label: 'Sunday' },
	]

	const skills = ['cooking', 'cashier', 'cleaning', 'management', 'delivery']

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='bg-[#0E1422] text-white border-none sm:max-w-[800px] max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='text-xl font-semibold text-white'>
						{isEditing ? 'Edit Branch' : 'Add New Branch'}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='space-y-6 mt-4'>
					{/* Basic Information */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='name'>Branch Name *</Label>
							<Input
								id='name'
								value={formData.name}
								onChange={e =>
									setFormData({ ...formData, name: e.target.value })
								}
								className='bg-[#1A1F2E] border-none text-white'
								placeholder='Enter branch name'
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='code'>Branch Code *</Label>
							<Input
								id='code'
								value={formData.code}
								onChange={e =>
									setFormData({
										...formData,
										code: e.target.value.toUpperCase(),
									})
								}
								className='bg-[#1A1F2E] border-none text-white'
								placeholder='Enter branch code (e.g., BR01)'
							/>
						</div>
					</div>

					{/* Location */}
					<div className='space-y-4'>
						<h3 className='text-lg font-semibold'>Location Information</h3>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='address'>Address *</Label>
								<Input
									id='address'
									value={formData.location.address}
									onChange={e =>
										setFormData({
											...formData,
											location: {
												...formData.location,
												address: e.target.value,
											},
										})
									}
									className='bg-[#1A1F2E] border-none text-white'
									placeholder='Enter full address'
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='city'>City *</Label>
								<Input
									id='city'
									value={formData.location.city}
									onChange={e =>
										setFormData({
											...formData,
											location: { ...formData.location, city: e.target.value },
										})
									}
									className='bg-[#1A1F2E] border-none text-white'
									placeholder='Enter city'
								/>
							</div>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='district'>District</Label>
							<Input
								id='district'
								value={formData.location.district}
								onChange={e =>
									setFormData({
										...formData,
										location: {
											...formData.location,
											district: e.target.value,
										},
									})
								}
								className='bg-[#1A1F2E] border-none text-white'
								placeholder='Enter district (optional)'
							/>
						</div>
					</div>

					{/* Contact Information */}
					<div className='space-y-4'>
						<h3 className='text-lg font-semibold'>Contact Information</h3>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='phone'>Phone</Label>
								<Input
									id='phone'
									value={formData.contact?.phone}
									onChange={e =>
										setFormData({
											...formData,
											contact: { ...formData.contact!, phone: e.target.value },
										})
									}
									className='bg-[#1A1F2E] border-none text-white'
									placeholder='Enter phone number'
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='email'>Email</Label>
								<Input
									id='email'
									type='email'
									value={formData.contact?.email}
									onChange={e =>
										setFormData({
											...formData,
											contact: { ...formData.contact!, email: e.target.value },
										})
									}
									className='bg-[#1A1F2E] border-none text-white'
									placeholder='Enter email address'
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='manager'>Manager</Label>
								<Input
									id='manager'
									value={formData.contact?.manager}
									onChange={e =>
										setFormData({
											...formData,
											contact: {
												...formData.contact!,
												manager: e.target.value,
											},
										})
									}
									className='bg-[#1A1F2E] border-none text-white'
									placeholder='Enter manager name'
								/>
							</div>
						</div>
					</div>

					{/* Capacity */}
					<div className='space-y-4'>
						<h3 className='text-lg font-semibold'>Capacity</h3>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='maxWorkers'>Max Workers</Label>
								<Input
									id='maxWorkers'
									type='number'
									min='1'
									max='20'
									value={formData.capacity?.maxWorkers}
									onChange={e =>
										setFormData({
											...formData,
											capacity: {
												...formData.capacity!,
												maxWorkers: parseInt(e.target.value) || 5,
											},
										})
									}
									className='bg-[#1A1F2E] border-none text-white'
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='maxRiders'>Max Riders</Label>
								<Input
									id='maxRiders'
									type='number'
									min='0'
									max='10'
									value={formData.capacity?.maxRiders}
									onChange={e =>
										setFormData({
											...formData,
											capacity: {
												...formData.capacity!,
												maxRiders: parseInt(e.target.value) || 2,
											},
										})
									}
									className='bg-[#1A1F2E] border-none text-white'
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='minimumStaff'>Minimum Staff</Label>
								<Input
									id='minimumStaff'
									type='number'
									min='1'
									value={formData.requirements?.minimumStaff}
									onChange={e =>
										setFormData({
											...formData,
											requirements: {
												...formData.requirements!,
												minimumStaff: parseInt(e.target.value) || 2,
											},
										})
									}
									className='bg-[#1A1F2E] border-none text-white'
								/>
							</div>
						</div>
					</div>

					{/* Required Skills */}
					<div className='space-y-4'>
						<h3 className='text-lg font-semibold'>Required Skills</h3>
						<div className='flex flex-wrap gap-3'>
							{skills.map(skill => (
								<div key={skill} className='flex items-center space-x-2'>
									<Checkbox
										id={skill}
										checked={
											formData.requirements?.skillsRequired?.includes(
												skill as
													| 'cooking'
													| 'cashier'
													| 'cleaning'
													| 'management'
													| 'delivery'
											) || false
										}
										onCheckedChange={() => toggleSkill(skill)}
										className='border-white data-[state=checked]:bg-[#4E7BEE] data-[state=checked]:border-[#4E7BEE]'
									/>
									<Label
										htmlFor={skill}
										className='text-sm font-normal capitalize'
									>
										{skill}
									</Label>
								</div>
							))}
						</div>
					</div>

					{/* Operating Hours */}
					<div className='space-y-4'>
						<h3 className='text-lg font-semibold'>Operating Hours</h3>
						<div className='space-y-3'>
							{days.map(({ key, label }) => {
								const daySchedule =
									formData.operatingHours?.[
										key as keyof typeof formData.operatingHours
									]
								return (
									<div
										key={key}
										className='flex items-center gap-4 p-3 bg-[#1A1F2E] rounded-lg'
									>
										<div className='w-20'>
											<Checkbox
												id={`${key}-open`}
												checked={daySchedule?.isOpen || false}
												onCheckedChange={checked =>
													updateDaySchedule(key, 'isOpen', checked)
												}
												className='border-white data-[state=checked]:bg-[#4E7BEE] data-[state=checked]:border-[#4E7BEE] mr-2'
											/>
											<Label htmlFor={`${key}-open`} className='text-sm'>
												{label}
											</Label>
										</div>
										{daySchedule?.isOpen && (
											<>
												<div className='space-y-1'>
													<Label className='text-xs'>Open</Label>
													<Input
														type='time'
														value={daySchedule.open}
														onChange={e =>
															updateDaySchedule(key, 'open', e.target.value)
														}
														className='bg-[#0E1422] border-none text-white w-32'
													/>
												</div>
												<div className='space-y-1'>
													<Label className='text-xs'>Close</Label>
													<Input
														type='time'
														value={daySchedule.close}
														onChange={e =>
															updateDaySchedule(key, 'close', e.target.value)
														}
														className='bg-[#0E1422] border-none text-white w-32'
													/>
												</div>
											</>
										)}
									</div>
								)
							})}
						</div>
					</div>

					{/* Notes */}
					<div className='space-y-2'>
						<Label htmlFor='notes'>Notes</Label>
						<Textarea
							id='notes'
							value={formData.notes}
							onChange={e =>
								setFormData({ ...formData, notes: e.target.value })
							}
							className='bg-[#1A1F2E] border-none text-white'
							placeholder='Additional notes about the branch...'
							rows={3}
						/>
					</div>

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
							{isEditing ? 'Update Branch' : 'Create Branch'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
