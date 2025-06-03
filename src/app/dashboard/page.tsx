'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	addTimeEntry,
	deleteTimeEntry,
	downloadMyPDF,
	getMyTimeEntries,
	logout,
	updateTimeEntry,
} from '@/lib/api'
import { TimeEntry, TimeEntryFormData } from '@/types'
import { Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
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
		description: '',
		breakMinutes: 0,
	})
	const [selectedDate, setSelectedDate] = useState(new Date())
	const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
	const router = useRouter()

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

	function handleLogout() {
		logout()
		router.push('/login')
	}

	// Tahrirlash funksiyasi
	const handleEdit = (entry: TimeEntry) => {
		setEditingEntry(entry)
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
			description: entry.description,
			breakMinutes: entry.breakMinutes,
		})
		setSelectedDate(new Date(entry.date))
	}

	// O'chirish funksiyasi
	const handleDelete = async (entryId: string) => {
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
				error instanceof Error ? error.message : "O'chirishda xatolik yuz berdi"
			)
		}
	}

	// Submit funksiyasini yangilash
	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)
		setError('')

		try {
			if (!formData.startTime || !formData.endTime) {
				throw new Error('Boshlash va tugatish vaqtlarini kiriting')
			}

			// Vaqtlarni to'g'ri formatga o'tkazish
			const [startHours, startMinutes] = formData.startTime.split(':')
			const [endHours, endMinutes] = formData.endTime.split(':')

			// Boshlang'ich sana obyektini yaratish
			const startDate = new Date(selectedDate)
			startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0)

			// Tugash sana obyektini yaratish
			const endDate = new Date(selectedDate)
			endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0)

			// Agar tugash vaqti boshlang'ich vaqtdan kichik bo'lsa
			// (masalan, 23:00 - 01:00), tugash vaqtiga bir kun qo'shamiz
			if (endDate < startDate) {
				endDate.setDate(endDate.getDate() + 1)
			}

			// Vaqt farqini milliskundlarda hisoblash
			const timeDiff = endDate.getTime() - startDate.getTime()

			// Vaqt farqini soatlarga aylantirish
			const hoursDiff = timeDiff / (1000 * 60 * 60)

			// Agar vaqt farqi manfiy yoki 24 soatdan ko'p bo'lsa
			if (hoursDiff < 0 || hoursDiff > 24) {
				throw new Error("Noto'g'ri vaqt oralig'i kiritildi")
			}

			const data = {
				startTime: startDate.toISOString(),
				endTime: endDate.toISOString(),
				date: selectedDate.toISOString().split('T')[0],
				description: formData.description,
				breakMinutes: parseInt(formData.breakMinutes.toString()) || 0,
			}

			console.log('Preparing data:', {
				...data,
				startTimeLocal: startDate.toLocaleString(),
				endTimeLocal: endDate.toLocaleString(),
				dateLocal: selectedDate.toLocaleString(),
			})

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

			// Formani tozalash
			setFormData({
				startTime: '',
				endTime: '',
				description: '',
				breakMinutes: 0,
				date: new Date().toISOString().split('T')[0],
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
	}

	// Vaqtlarni formatlash
	function formatTime(timeStr: string) {
		return new Date(timeStr).toLocaleTimeString('uz-UZ', {
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	// PDF yuklab olish funksiyasi
	async function handleDownloadPDF() {
		try {
			await downloadMyPDF(selectedMonth, selectedYear)
		} catch (error) {
			console.error('Error downloading PDF:', error)
			setError('PDF yuklab olishda xatolik yuz berdi')
		}
	}

	// Tanlangan oyning vaqtlarini filterlash
	const filteredEntries = entries
		.filter(entry => {
			const entryDate = new Date(entry.date)
			return (
				entryDate.getMonth() + 1 === selectedMonth &&
				entryDate.getFullYear() === selectedYear
			)
		})
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

	// Statistikani hisoblash
	const stats = {
		totalHours: filteredEntries.reduce((sum, entry) => sum + entry.hours, 0),
		regularDays: filteredEntries.filter(entry => entry.hours <= 12).length,
		overtimeDays: filteredEntries.filter(entry => entry.hours > 12).length,
	}

	// Oylar ro'yxati
	const months = [
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
	]

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
						className='w-full sm:w-auto bg-[#FF3B6F] hover:bg-[#FF3B6F]/90 text-sm'
					>
						Logout
					</Button>
				</div>

				{/* Statistika */}
				<div className='grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4'>
					<Card className='bg-[#0E1422] border-none text-white p-2 sm:p-4'>
						<p className='text-xs sm:text-sm text-gray-400'>Total Hours</p>
						<p className='text-base sm:text-xl font-bold text-[#4E7BEE]'>
							{stats.totalHours.toFixed(1)} hours
						</p>
					</Card>
					<Card className='bg-[#0E1422] border-none text-white p-2 sm:p-4'>
						<p className='text-xs sm:text-sm text-gray-400'>Regular Days</p>
						<p className='text-base sm:text-xl font-bold text-[#4CC4C0]'>
							{stats.regularDays} days
						</p>
					</Card>
					<Card className='bg-[#0E1422] border-none text-white p-2 sm:p-4'>
						<p className='text-xs sm:text-sm text-gray-400'>Overtime Days</p>
						<p className='text-base sm:text-xl font-bold text-[#9B5DE5]'>
							{stats.overtimeDays} days
						</p>
					</Card>
					<Card className='bg-[#0E1422] border-none text-white p-2 sm:p-4'>
						<Button
							onClick={handleDownloadPDF}
							className='w-full bg-[#00875A] hover:bg-[#00875A]/90 text-xs sm:text-sm h-8 sm:h-10'
						>
							Download PDF
						</Button>
					</Card>
				</div>

				{/* Vaqt qo'shish formasi */}
				<Card className='bg-[#0E1422] border-none text-white'>
					<div className='p-3 sm:p-6'>
						<h2 className='text-base sm:text-xl mb-3 sm:mb-4'>
							{editingEntry ? 'Edit Time Entry' : 'Add New Time Entry'}
						</h2>
						<form onSubmit={handleSubmit} className='space-y-3 sm:space-y-4'>
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4'>
								<div className='space-y-1 sm:space-y-2'>
									<Label className='text-xs sm:text-sm'>Date</Label>
									<Input
										type='date'
										value={selectedDate.toISOString().split('T')[0]}
										onChange={e => setSelectedDate(new Date(e.target.value))}
										required
										className='bg-[#1A1F2E] border-none text-white text-xs sm:text-sm h-8 sm:h-10'
									/>
								</div>
								<div className='space-y-1 sm:space-y-2'>
									<Label className='text-xs sm:text-sm'>Start Time</Label>
									<TimePicker
										value={formData.startTime}
										onChange={time =>
											setFormData({ ...formData, startTime: time })
										}
									/>
								</div>
								<div className='space-y-1 sm:space-y-2'>
									<Label className='text-xs sm:text-sm'>End Time</Label>
									<TimePicker
										value={formData.endTime}
										onChange={time =>
											setFormData({ ...formData, endTime: time })
										}
									/>
								</div>
								<div className='space-y-1 sm:space-y-2'>
									<Label className='text-xs sm:text-sm'>Break (minutes)</Label>
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
										className='bg-[#1A1F2E] border-none text-white text-xs sm:text-sm h-8 sm:h-10'
									/>
								</div>
							</div>
							<div className='space-y-1 sm:space-y-2'>
								<Label className='text-xs sm:text-sm'>Description</Label>
								<Input
									value={formData.description}
									onChange={e =>
										setFormData({ ...formData, description: e.target.value })
									}
									required
									placeholder='Brief description of work'
									className='bg-[#1A1F2E] border-none text-white text-xs sm:text-sm h-8 sm:h-10'
								/>
							</div>
							<div className='flex gap-2 pt-2'>
								<Button
									type='submit'
									disabled={loading}
									className='flex-1 sm:flex-none bg-gradient-to-r from-[#4E7BEE] to-[#4CC4C0] text-xs sm:text-sm h-8 sm:h-10'
								>
									{loading ? 'Saving...' : editingEntry ? 'Update' : 'Save'}
								</Button>
								{editingEntry && (
									<Button
										type='button'
										onClick={() => {
											setEditingEntry(null)
											setFormData({
												startTime: '',
												endTime: '',
												description: '',
												breakMinutes: 0,
												date: new Date().toISOString().split('T')[0],
											})
										}}
										className='flex-1 sm:flex-none bg-gray-600 hover:bg-gray-700 text-xs sm:text-sm h-8 sm:h-10'
									>
										Cancel
									</Button>
								)}
							</div>
							{error && (
								<p className='text-red-500 text-xs sm:text-sm'>{error}</p>
							)}
						</form>
					</div>
				</Card>

				{/* Vaqtlar ro'yxati */}
				<Card className='bg-[#0E1422] border-none text-white'>
					<div className='p-3 sm:p-6'>
						<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6'>
							<h2 className='text-base sm:text-xl'>My Time Entries</h2>
							<div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto'>
								<div className='flex items-center gap-2 w-full sm:w-auto'>
									<Label className='text-xs sm:text-sm min-w-[30px]'>
										Month:
									</Label>
									<select
										value={selectedMonth}
										onChange={e => setSelectedMonth(parseInt(e.target.value))}
										className='flex-1 sm:flex-none bg-[#1A1F2E] border-none text-white rounded px-2 py-1 text-xs sm:text-sm h-8 sm:h-10'
									>
										{months.map(month => (
											<option key={month.value} value={month.value}>
												{month.label}
											</option>
										))}
									</select>
								</div>
								<div className='flex items-center gap-2 w-full sm:w-auto'>
									<Label className='text-xs sm:text-sm min-w-[30px]'>
										Year:
									</Label>
									<select
										value={selectedYear}
										onChange={e => setSelectedYear(parseInt(e.target.value))}
										className='flex-1 sm:flex-none bg-[#1A1F2E] border-none text-white rounded px-2 py-1 text-xs sm:text-sm h-8 sm:h-10'
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
						<div className='h-[300px] sm:h-[400px] overflow-y-auto custom-scrollbar pr-2'>
							<div className='space-y-2 sm:space-y-4'>
								{loading ? (
									<p className='text-center text-gray-400 text-xs sm:text-sm'>
										Loading...
									</p>
								) : error ? (
									<p className='text-center text-red-500 text-xs sm:text-sm'>
										{error}
									</p>
								) : filteredEntries.length === 0 ? (
									<p className='text-center text-gray-400 text-xs sm:text-sm'>
										No time entries for this month
									</p>
								) : (
									filteredEntries.map(entry => (
										<div
											key={entry._id}
											className='bg-[#1A1F2E] rounded-lg p-3 sm:p-4'
										>
											<div className='flex flex-col sm:flex-row justify-between gap-2 sm:gap-4'>
												<div className='flex-1'>
													<p className='font-medium text-sm sm:text-base mb-1'>
														{entry.description}
													</p>
													<div className='text-xs text-gray-400 space-y-0.5'>
														<p>
															Date:{' '}
															{new Date(entry.date).toLocaleDateString('en-US')}
														</p>
														<p>
															Time: {formatTime(entry.startTime)} -{' '}
															{formatTime(entry.endTime)}
														</p>
														<p>Break: {entry.breakMinutes} minutes</p>
													</div>
												</div>
												<div className='flex items-center gap-2 self-end sm:self-center'>
													<p className='font-bold text-base sm:text-lg text-[#4CC4C0]'>
														{entry.hours.toFixed(1)} hours
													</p>
													<div className='flex gap-1'>
														<Button
															onClick={() => handleEdit(entry)}
															className='p-1.5 h-7 w-7 bg-blue-600 hover:bg-blue-700'
														>
															<Pencil size={14} />
														</Button>
														<Button
															onClick={() => handleDelete(entry._id)}
															className='p-1.5 h-7 w-7 bg-red-600 hover:bg-red-700'
														>
															<Trash2 size={14} />
														</Button>
													</div>
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
