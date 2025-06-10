import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateTimeEntry } from '@/lib/api'
import { TimeEntry, TimeEntryFormData } from '@/types'
import {
	AlertTriangle,
	Calendar,
	Clock,
	Pencil,
	User,
	XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { TimePicker } from './ui/time-picker'

interface EditTimeEntryModalProps {
	isOpen: boolean
	onClose: () => void
	entry: TimeEntry | null
	onUpdate: (updatedEntry: TimeEntry) => void
}

export function EditTimeEntryModal({
	isOpen,
	onClose,
	entry,
	onUpdate,
}: EditTimeEntryModalProps) {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [selectedDate, setSelectedDate] = useState(new Date())
	const [formData, setFormData] = useState<TimeEntryFormData>({
		startTime: '',
		endTime: '',
		date: new Date().toISOString().split('T')[0],
		overtimeReason: null,
		responsiblePerson: '',
	})

	// Ish vaqtidan tashqari ishlash tekshiruvi
	const isOvertime = useCallback(() => {
		if (!formData.startTime || !formData.endTime) return false

		const [startHours, startMinutes] = formData.startTime.split(':').map(Number)
		const [endHours, endMinutes] = formData.endTime.split(':').map(Number)

		let hours = endHours - startHours
		const minutes = (endMinutes - startMinutes) / 60

		if (hours < 0) {
			hours = 24 + hours
		}

		return hours + minutes > 12
	}, [formData.startTime, formData.endTime])

	// Modal ochilganda ma'lumotlarni to'ldirish
	const handleOpen = useCallback(() => {
		if (entry) {
			const startTime = new Date(entry.startTime).toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
				hour12: false,
			})
			const endTime = new Date(entry.endTime).toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
				hour12: false,
			})

			setFormData({
				startTime,
				endTime,
				date: new Date(entry.date).toISOString().split('T')[0],
				overtimeReason: entry.overtimeReason,
				responsiblePerson: entry.responsiblePerson || '',
			})

			setSelectedDate(new Date(entry.date))
		}
	}, [entry])

	// Modal yopilganda formani tozalash
	const handleClose = useCallback(() => {
		setFormData({
			startTime: '',
			endTime: '',
			date: new Date().toISOString().split('T')[0],
			overtimeReason: null,
			responsiblePerson: '',
		})
		setSelectedDate(new Date())
		setError('')
		onClose()
	}, [onClose])

	// Submit funksiyasi
	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()
			if (!entry) return

			setError('')
			setLoading(true)

			try {
				const startDate = new Date(selectedDate)
				const endDate = new Date(selectedDate)

				const [startHours, startMinutes] = formData.startTime.split(':')
				const [endHours, endMinutes] = formData.endTime.split(':')

				startDate.setHours(parseInt(startHours), parseInt(startMinutes))
				endDate.setHours(parseInt(endHours), parseInt(endMinutes))

				if (endDate < startDate) {
					endDate.setDate(endDate.getDate() + 1)
				}

				let overtimeReason = null
				let responsiblePerson: '' | 'Adilcan' | 'Boss' = ''

				if (isOvertime()) {
					overtimeReason = formData.overtimeReason
					if (
						overtimeReason === 'Company Request' &&
						!formData.responsiblePerson
					) {
						throw new Error("Mas'ul shaxsni tanlang")
					}
					responsiblePerson = formData.responsiblePerson || ''
				}

				const data: TimeEntryFormData = {
					startTime: startDate.toISOString(),
					endTime: endDate.toISOString(),
					date: selectedDate.toISOString().split('T')[0],
					overtimeReason,
					responsiblePerson,
				}

				const updatedEntry = await updateTimeEntry(entry._id, data)
				onUpdate(updatedEntry)
				handleClose()
			} catch (error) {
				console.error('Error:', error)
				setError(
					error instanceof Error
						? error.message
						: "Vaqt qo'shishda xatolik yuz berdi"
				)
			} finally {
				setLoading(false)
			}
		},
		[entry, selectedDate, formData, isOvertime, onUpdate, handleClose]
	)

	// Modal ochilganda ma'lumotlarni to'ldirish
	useEffect(() => {
		if (isOpen && entry) {
			handleOpen()
		}
	}, [isOpen, entry, handleOpen])

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='bg-[#0E1422] border-none text-white sm:max-w-[600px]'>
				<DialogHeader>
					<DialogTitle className='text-xl flex items-center gap-2'>
						<Pencil className='w-5 h-5 text-[#4E7BEE]' />
						Edit Time Entry
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='space-y-4 mt-4'>
					{error && (
						<p className='text-red-500 text-sm bg-red-500/10 p-3 rounded-lg'>
							{error}
						</p>
					)}

					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label className='text-sm flex items-center gap-1.5'>
								<Calendar className='w-4 h-4 text-gray-400' />
								Date
							</Label>
							<Input
								type='date'
								value={selectedDate.toISOString().split('T')[0]}
								onChange={e => setSelectedDate(new Date(e.target.value))}
								required
								className='bg-[#1A1F2E] border-none text-white text-sm h-10'
							/>
						</div>
						<div className='space-y-2'>
							<Label className='text-sm flex items-center gap-1.5'>
								<Clock className='w-4 h-4 text-gray-400' />
								Start Time
							</Label>
							<TimePicker
								value={formData.startTime}
								onChange={time => setFormData({ ...formData, startTime: time })}
							/>
						</div>
						<div className='space-y-2'>
							<Label className='text-sm flex items-center gap-1.5'>
								<Clock className='w-4 h-4 text-gray-400' />
								End Time
							</Label>
							<TimePicker
								value={formData.endTime}
								onChange={time => setFormData({ ...formData, endTime: time })}
							/>
						</div>
					</div>

					{/* Overtime Section */}
					{isOvertime() && (
						<div className='space-y-4'>
							<div className='space-y-2'>
								<Label className='text-sm flex items-center gap-1.5'>
									<AlertTriangle className='w-4 h-4 text-yellow-500' />
									Overtime Reason
								</Label>
								<select
									value={formData.overtimeReason || ''}
									onChange={e =>
										setFormData({
											...formData,
											overtimeReason: e.target
												.value as TimeEntry['overtimeReason'],
											responsiblePerson:
												e.target.value === 'Company Request'
													? formData.responsiblePerson
													: '',
										})
									}
									className='w-full bg-[#1A1F2E] border-none text-white rounded px-3 py-2 text-sm h-10'
									required
								>
									<option value=''>Select reason</option>
									<option value='Busy'>Busy</option>
									<option value='Last Order'>Last Order</option>
									<option value='Company Request'>Company Request</option>
								</select>
							</div>

							{formData.overtimeReason === 'Company Request' && (
								<div className='space-y-2'>
									<Label className='text-sm flex items-center gap-1.5'>
										<User className='w-4 h-4 text-gray-400' />
										Responsible Person
									</Label>
									<select
										value={formData.responsiblePerson || ''}
										onChange={e =>
											setFormData({
												...formData,
												responsiblePerson: e.target
													.value as TimeEntry['responsiblePerson'],
											})
										}
										className='w-full bg-[#1A1F2E] border-none text-white rounded px-3 py-2 text-sm h-10'
										required
									>
										<option value=''>Select person</option>
										<option value='Adilcan'>Adilcan</option>
										<option value='Boss'>Boss</option>
									</select>
								</div>
							)}
						</div>
					)}

					<DialogFooter className='flex justify-end gap-2 mt-6'>
						<Button
							type='button'
							onClick={handleClose}
							className='bg-gray-500 hover:bg-gray-600 text-white gap-2'
						>
							<XCircle className='w-4 h-4' />
							Cancel
						</Button>
						<Button
							type='submit'
							className='bg-[#4E7BEE] hover:bg-[#4E7BEE]/90 text-white gap-2'
							disabled={loading}
						>
							{loading ? (
								<>
									<div className='animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white'></div>
									Updating...
								</>
							) : (
								<>
									<Pencil className='w-4 h-4' />
									Update Entry
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
