'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	addTimeEntry,
	deleteTimeEntry,
	getMyTimeEntries,
	logout,
	updateTimeEntry,
} from '@/lib/api'
import { TimeEntry, TimeEntryFormData } from '@/types'
import {
	AlertTriangle,
	Calendar,
	CalendarDays,
	CheckCircle2,
	Clock,
	FileText,
	LogOut,
	Pencil,
	Timer,
	Trash2,
	User,
	XCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { TimePicker } from '../../components/ui/time-picker'

export default function DashboardPage() {
	const [entries, setEntries] = useState<TimeEntry[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
	const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
	const [userData, setUserData] = useState<{
		id: string
		username: string
		position: string
	} | null>(null)
	const [formData, setFormData] = useState<TimeEntryFormData>({
		startTime: '',
		endTime: '',
		date: new Date().toISOString().split('T')[0],
		overtimeReason: null,
		responsiblePerson: '',
	})
	const [selectedDate, setSelectedDate] = useState(new Date())
	const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(false)

	// Soatlarni hisoblash funksiyasi
	const calculateHours = useCallback(
		(startTime: string, endTime: string): number => {
			const [startHours, startMinutes] = startTime.split(':').map(Number)
			const [endHours, endMinutes] = endTime.split(':').map(Number)

			let hours = endHours - startHours
			const minutes = (endMinutes - startMinutes) / 60

			if (hours < 0) {
				hours = 24 + hours
			}

			return hours + minutes
		},
		[]
	)

	// Ish vaqtidan tashqari ishlash tekshiruvi
	const isOvertime = useMemo(() => {
		if (!formData.startTime || !formData.endTime) return false
		return calculateHours(formData.startTime, formData.endTime) > 12
	}, [formData.startTime, formData.endTime, calculateHours])

	const loadEntries = useCallback(async () => {
		try {
			setLoading(true)
			setError('')
			const data = await getMyTimeEntries()

			if (!Array.isArray(data)) {
				setError("Ma'lumotlar formati noto'g'ri")
				return
			}

			const validEntries = data.map(entry => ({
				...entry,
				date: new Date(entry.date).toISOString().split('T')[0],
				startTime: new Date(entry.startTime).toISOString(),
				endTime: new Date(entry.endTime).toISOString(),
			}))

			setEntries(validEntries)
		} catch (err) {
			console.error('Error loading entries:', err)
			setError(
				err instanceof Error ? err.message : 'Vaqtlarni yuklashda xatolik'
			)
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		const token = localStorage.getItem('token')
		if (!token) {
			router.push('/login')
			return
		}

		const payload = JSON.parse(atob(token.split('.')[1]))
		setUserData({
			id: payload.userId,
			username: payload.username,
			position: payload.position,
		})

		loadEntries()
	}, [router, loadEntries])

	// Oy o'zgarganda yangi ma'lumotlarni yuklash
	useEffect(() => {
		if (userData) {
			loadEntries()
		}
	}, [selectedMonth, selectedYear, loadEntries, userData])

	const handleLogout = useCallback(() => {
		setIsLoading(true)
		logout()
		router.push('/login')
		setIsLoading(false)
	}, [router])

	// Tahrirlash funksiyasi
	const handleEditEntry = useCallback((entry: TimeEntry) => {
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
			responsiblePerson: entry.responsiblePerson,
		})
		setSelectedDate(new Date(entry.date))
		setEditingEntry(entry)
	}, [])

	// O'chirish funksiyasi
	const handleDelete = useCallback(
		async (entryId: string) => {
			if (!confirm("Rostdan ham bu vaqt yozuvini o'chirmoqchimisiz?")) {
				return
			}

			try {
				await deleteTimeEntry(entryId)
				// Ma'lumotlarni yangilash
				setEntries(entries.filter(entry => entry._id !== entryId))
			} catch (error) {
				console.error('Error:', error)
				setError(
					error instanceof Error
						? error.message
						: "O'chirishda xatolik yuz berdi"
				)
			}
		},
		[entries]
	)

	// Submit funksiyasini yangilash
	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()
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

				if (isOvertime) {
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

				let updatedEntry: TimeEntry
				if (editingEntry) {
					updatedEntry = await updateTimeEntry(editingEntry._id, data)
					setEntries(
						entries.map(entry =>
							entry._id === editingEntry._id ? updatedEntry : entry
						)
					)
				} else {
					updatedEntry = await addTimeEntry(data)
					setEntries([...entries, updatedEntry])
				}

				setFormData({
					startTime: '',
					endTime: '',
					date: new Date().toISOString().split('T')[0],
					overtimeReason: null,
					responsiblePerson: '',
				})
				setEditingEntry(null)
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
		[selectedDate, formData, isOvertime, editingEntry, entries]
	)

	// Vaqtlarni formatlash
	const formatTime = useCallback((timeStr: string) => {
		return new Date(timeStr).toLocaleTimeString('uz-UZ', {
			hour: '2-digit',
			minute: '2-digit',
		})
	}, [])

	// PDF yuklab olish funksiyasi
	// async function handleDownloadPDF() {
	// 	try {
	// 		await downloadMyPDF(selectedMonth, selectedYear)
	// 	} catch (error) {
	// 		console.error('Error downloading PDF:', error)
	// 		setError('PDF yuklab olishda xatolik yuz berdi')
	// 	}
	// }

	// Tanlangan oyning vaqtlarini filterlash va statistikani hisoblash
	const { filteredEntries, stats } = useMemo(() => {
		const filtered = entries
			.filter(entry => {
				const entryDate = new Date(entry.date)
				return (
					entryDate.getMonth() + 1 === selectedMonth &&
					entryDate.getFullYear() === selectedYear
				)
			})
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

		const totalHours = filtered.reduce((sum, entry) => sum + entry.hours, 0)
		const regularDays = filtered.filter(entry => entry.hours <= 12).length
		const overtimeDays = filtered.filter(entry => entry.hours > 12).length

		return {
			filteredEntries: filtered,
			stats: {
				totalHours,
				regularDays,
				overtimeDays,
			},
		}
	}, [entries, selectedMonth, selectedYear])

	// Oylar ro'yxati
	const months = useMemo(
		() => [
			{ value: 1, label: 'January' },
			{ value: 2, label: 'February' },
			{ value: 3, label: 'March' },
			{ value: 4, label: 'April' },
			{ value: 5, label: 'May' },
			{ value: 6, label: 'June' },
			{ value: 7, label: 'July' },
			{ value: 8, label: 'August' },
			{ value: 9, label: 'September' },
			{ value: 10, label: 'October' },
			{ value: 11, label: 'November' },
			{ value: 12, label: 'December' },
		],
		[]
	)

	return (
		<main className='min-h-screen p-2 sm:p-4 bg-[#0A0F1C]'>
			<div className='max-w-4xl mx-auto space-y-3 sm:space-y-6'>
				{/* Header */}
				<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-[#0E1422] p-3 sm:p-4 rounded-lg'>
					<div>
						<h1 className='text-lg sm:text-2xl font-bold text-white'>
							Dashboard
						</h1>
						{userData && (
							<p className='text-sm sm:text-base text-gray-400'>
								{userData.username} -{' '}
								{userData.position === 'worker' ? 'Worker' : 'Rider'}
							</p>
						)}
					</div>
					<Button
						onClick={handleLogout}
						className='w-full sm:w-auto bg-[#FF3B6F] hover:bg-[#FF3B6F]/90 text-sm cursor-pointer'
					>
						{isLoading ? (
							<span className='ml-1'>Logging out...</span>
						) : (
							<>
								<span className='ml-1'>Logout</span>
								<LogOut size={16} />
							</>
						)}
					</Button>
				</div>

				{/* Statistika */}
				<div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
					<Card className='bg-[#0E1422] border-none text-white p-4'>
						<div className='flex items-center gap-3'>
							<div className='bg-[#4E7BEE]/10 p-3 rounded-lg'>
								<Timer className='w-6 h-6 text-[#4E7BEE]' />
							</div>
							<div>
								<p className='text-gray-400 text-sm'>Total Hours</p>
								<p className='text-xl font-semibold text-[#4E7BEE]'>
									{stats.totalHours.toFixed(1)}h
								</p>
							</div>
						</div>
					</Card>

					<Card className='bg-[#0E1422] border-none text-white p-4'>
						<div className='flex items-center gap-3'>
							<div className='bg-[#4CC4C0]/10 p-3 rounded-lg'>
								<CheckCircle2 className='w-6 h-6 text-[#4CC4C0]' />
							</div>
							<div>
								<p className='text-gray-400 text-sm'>Regular Days</p>
								<p className='text-xl font-semibold text-[#4CC4C0]'>
									{stats.regularDays}d
								</p>
							</div>
						</div>
					</Card>

					<Card className='bg-[#0E1422] border-none text-white p-4'>
						<div className='flex items-center gap-3'>
							<div className='bg-[#FF3B6F]/10 p-3 rounded-lg'>
								<AlertTriangle className='w-6 h-6 text-[#FF3B6F]' />
							</div>
							<div>
								<p className='text-gray-400 text-sm'>Overtime Days</p>
								<p className='text-xl font-semibold text-[#FF3B6F]'>
									{stats.overtimeDays}d
								</p>
							</div>
						</div>
					</Card>
				</div>

				{/* Vaqt kiritish formasi */}
				<Card className='bg-[#0E1422] border-none text-white'>
					<div className='p-4 sm:p-6'>
						<h2 className='text-base sm:text-xl mb-4 flex items-center gap-2'>
							<FileText className='w-5 h-5 text-[#4E7BEE]' />
							{editingEntry ? 'Edit Time Entry' : 'Add New Time Entry'}
						</h2>
						<form onSubmit={handleSubmit} className='space-y-4'>
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
										onChange={time =>
											setFormData({ ...formData, startTime: time })
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label className='text-sm flex items-center gap-1.5'>
										<Clock className='w-4 h-4 text-gray-400' />
										End Time
									</Label>
									<TimePicker
										value={formData.endTime}
										onChange={time =>
											setFormData({ ...formData, endTime: time })
										}
									/>
								</div>
								{/* <div className='space-y-2'>
									<Label className='text-sm flex items-center gap-1.5'>
										<Coffee className='w-4 h-4 text-gray-400' />
										Break (minutes)
									</Label>
									<Input
										type='number'
										min='0'
										value={formData.breakMinutes}
										onChange={e =>
											setFormData({
												...formData,
												breakMinutes: parseInt(e.target.value) || 0,
											})
										}
										className='bg-[#1A1F2E] border-none text-white text-sm h-10'
									/>
								</div> */}
							</div>

							{/* <div className='space-y-2'>
								<Label className='text-sm flex items-center gap-1.5'>
									<FileText className='w-4 h-4 text-gray-400' />
									Description
								</Label>
								<Input
									value={formData.description}
									onChange={e =>
										setFormData({ ...formData, description: e.target.value })
									}
									placeholder='Enter work description'
									className='bg-[#1A1F2E] border-none text-white text-sm h-10'
								/>
							</div> */}

							{/* Ish vaqtidan tashqari ishlash sababi */}
							{isOvertime && (
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

							<div className='flex justify-end'>
								<Button
									type='submit'
									className='bg-[#4E7BEE] hover:bg-[#4E7BEE]/90 text-white'
									disabled={loading}
								>
									{loading ? (
										'Saving...'
									) : editingEntry ? (
										<>
											<Pencil className='w-4 h-4 mr-1' />
											Update Entry
										</>
									) : (
										<>
											<CheckCircle2 className='w-4 h-4 mr-1' />
											Add Entry
										</>
									)}
								</Button>
							</div>
						</form>
					</div>
				</Card>

				{/* Vaqt yozuvlari ro'yxati */}
				<Card className='bg-[#0E1422] border-none text-white'>
					<div className='p-4 sm:p-6'>
						<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
							<h2 className='text-base sm:text-xl flex items-center gap-2'>
								<CalendarDays className='w-5 h-5 text-[#4E7BEE]' />
								My Time Entries
							</h2>
							<div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto'>
								<div className='flex items-center gap-2 w-full sm:w-auto'>
									<Label className='text-sm min-w-[50px] flex items-center gap-1.5'>
										<Calendar className='w-4 h-4 text-gray-400' />
										Month:
									</Label>
									<select
										value={selectedMonth}
										onChange={e => setSelectedMonth(parseInt(e.target.value))}
										className='flex-1 sm:flex-none bg-[#1A1F2E] border-none text-white rounded px-3 py-2 text-sm h-10 cursor-pointer min-w-[120px]'
									>
										{months.map(month => (
											<option key={month.value} value={month.value}>
												{month.label}
											</option>
										))}
									</select>
								</div>
								<div className='flex items-center gap-2 w-full sm:w-auto'>
									<Label className='text-sm min-w-[50px] flex items-center gap-1.5'>
										<Calendar className='w-4 h-4 text-gray-400' />
										Year:
									</Label>
									<select
										value={selectedYear}
										onChange={e => setSelectedYear(parseInt(e.target.value))}
										className='flex-1 sm:flex-none bg-[#1A1F2E] border-none text-white rounded px-3 py-2 text-sm h-10 cursor-pointer min-w-[120px]'
									>
										{[2023, 2024, 2025].map(year => (
											<option key={year} value={year}>
												{year}
											</option>
										))}
									</select>
								</div>
							</div>
						</div>

						<div className='h-[400px] overflow-y-auto custom-scrollbar pr-2'>
							<div className='space-y-4'>
								{loading ? (
									<p className='text-center text-gray-400 text-sm'>
										Loading...
									</p>
								) : error ? (
									<p className='text-center text-red-500 text-sm'>{error}</p>
								) : filteredEntries.length === 0 ? (
									<div className='text-center text-gray-400 text-sm py-8'>
										<XCircle className='w-12 h-12 mx-auto mb-3 opacity-50' />
										<p>No time entries for this month</p>
									</div>
								) : (
									filteredEntries.map(entry => (
										<div
											key={entry._id}
											className='bg-[#1A1F2E] rounded-lg p-4 hover:bg-[#242B3D] transition-colors'
										>
											<div className='flex flex-col sm:flex-row justify-between gap-4'>
												<div className='flex-1'>
													<div className='flex items-center justify-between mb-2'>
														{entry.hours > 12 && (
															<div className='flex items-center gap-2 text-yellow-500'>
																<AlertTriangle className='w-4 h-4' />
																<span className='text-sm'>
																	{entry.overtimeReason}
																</span>
																{entry.overtimeReason === 'Company Request' && (
																	<span className='text-blue-400 text-sm'>
																		({entry.responsiblePerson})
																	</span>
																)}
															</div>
														)}
													</div>
													<div className='text-sm text-gray-400 space-y-1'>
														<p className='flex items-center gap-2'>
															<Calendar className='w-4 h-4' />
															{new Date(entry.date).toLocaleDateString('en-US')}
														</p>
														<p className='flex items-center gap-2'>
															<Clock className='w-4 h-4' />
															{formatTime(entry.startTime)} -{' '}
															{formatTime(entry.endTime)}
														</p>
														<p className='flex items-center gap-2'>
															<Timer className='w-4 h-4' />
															{entry.hours} hours
														</p>
													</div>
												</div>
												<div className='flex items-center gap-2'>
													<Button
														variant='ghost'
														size='icon'
														onClick={() => handleEditEntry(entry)}
														className='hover:bg-[#2A3447]'
													>
														<Pencil className='w-4 h-4' />
													</Button>
													<Button
														variant='ghost'
														size='icon'
														onClick={() => handleDelete(entry._id)}
														className='hover:bg-[#2A3447] text-red-500 hover:text-red-600'
													>
														<Trash2 className='w-4 h-4' />
													</Button>
												</div>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				</Card>
			</div>
		</main>
	)
}
