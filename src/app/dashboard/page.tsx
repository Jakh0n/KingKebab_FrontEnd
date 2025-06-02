'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { downloadMyPDF, getMyTimeEntries, logout } from '@/lib/api'
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
			const token = localStorage.getItem('token')
			if (!token) {
				setError("Avtorizatsiyadan o'tilmagan")
				return
			}

			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/time/${entryId}`,
				{
					method: 'DELETE',
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			)

			if (!response.ok) {
				throw new Error("O'chirishda xatolik yuz berdi")
			}

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
			const token = localStorage.getItem('token')
			if (!token) {
				setError("Avtorizatsiyadan o'tilmagan")
				return
			}

			// Vaqtlarni to'g'ri formatga o'tkazish
			const [startHours, startMinutes] = formData.startTime.split(':')
			const [endHours, endMinutes] = formData.endTime.split(':')

			const startDate = new Date(selectedDate)
			startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0)

			const endDate = new Date(selectedDate)
			endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0)

			// Agar tugash vaqti boshlash vaqtidan kichik bo'lsa, keyingi kunga o'tkazamiz
			if (parseInt(endHours) < parseInt(startHours)) {
				endDate.setDate(endDate.getDate() + 1)
			}

			const url = editingEntry
				? `http://localhost:5000/api/time/${editingEntry._id}`
				: 'http://localhost:5000/api/time'

			const method = editingEntry ? 'PUT' : 'POST'

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					startTime: startDate.toISOString(),
					endTime: endDate.toISOString(),
					date: selectedDate.toISOString().split('T')[0],
					description: formData.description,
					breakMinutes: formData.breakMinutes,
				}),
			})

			if (!response.ok) {
				const errorText = await response.text()
				console.error('Server response:', errorText)
				try {
					const errorData = JSON.parse(errorText)
					setError(errorData.message || 'Xatolik yuz berdi')
				} catch {
					setError(`Server xatosi: ${response.status}`)
				}
				return
			}

			const updatedEntry = await response.json()

			if (editingEntry) {
				setEntries(
					entries.map(entry =>
						entry._id === editingEntry._id ? updatedEntry : entry
					)
				)
			} else {
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
		{ value: 1, label: 'Yanvar' },
		{ value: 2, label: 'Fevral' },
		{ value: 3, label: 'Mart' },
		{ value: 4, label: 'Aprel' },
		{ value: 5, label: 'May' },
		{ value: 6, label: 'Iyun' },
		{ value: 7, label: 'Iyul' },
		{ value: 8, label: 'Avgust' },
		{ value: 9, label: 'Sentabr' },
		{ value: 10, label: 'Oktabr' },
		{ value: 11, label: 'Noyabr' },
		{ value: 12, label: 'Dekabr' },
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
								{userData.position === 'worker' ? 'Ishchi' : 'Rider'}
							</p>
						)}
					</div>
					<Button
						onClick={handleLogout}
						className='w-full sm:w-auto bg-[#FF3B6F] hover:bg-[#FF3B6F]/90 text-sm'
					>
						Chiqish
					</Button>
				</div>

				{/* Statistika */}
				<div className='grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4'>
					<Card className='bg-[#0E1422] border-none text-white p-2 sm:p-4'>
						<p className='text-xs sm:text-sm text-gray-400'>Jami soatlar</p>
						<p className='text-base sm:text-xl font-bold text-[#4E7BEE]'>
							{stats.totalHours.toFixed(1)} soat
						</p>
					</Card>
					<Card className='bg-[#0E1422] border-none text-white p-2 sm:p-4'>
						<p className='text-xs sm:text-sm text-gray-400'>Oddiy kunlar</p>
						<p className='text-base sm:text-xl font-bold text-[#4CC4C0]'>
							{stats.regularDays} kun
						</p>
					</Card>
					<Card className='bg-[#0E1422] border-none text-white p-2 sm:p-4'>
						<p className='text-xs sm:text-sm text-gray-400'>
							Qo&apos;shimcha kunlar
						</p>
						<p className='text-base sm:text-xl font-bold text-[#9B5DE5]'>
							{stats.overtimeDays} kun
						</p>
					</Card>
					<Card className='bg-[#0E1422] border-none text-white p-2 sm:p-4'>
						<Button
							onClick={handleDownloadPDF}
							className='w-full bg-[#00875A] hover:bg-[#00875A]/90 text-xs sm:text-sm h-8 sm:h-10'
						>
							PDF yuklab olish
						</Button>
					</Card>
				</div>

				{/* Vaqt qo'shish formasi */}
				<Card className='bg-[#0E1422] border-none text-white'>
					<div className='p-3 sm:p-6'>
						<h2 className='text-base sm:text-xl mb-3 sm:mb-4'>
							{editingEntry ? 'Vaqtni tahrirlash' : "Yangi vaqt qo'shish"}
						</h2>
						<form onSubmit={handleSubmit} className='space-y-3 sm:space-y-4'>
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4'>
								<div className='space-y-1 sm:space-y-2'>
									<Label className='text-xs sm:text-sm'>Sana</Label>
									<Input
										type='date'
										value={selectedDate.toISOString().split('T')[0]}
										onChange={e => setSelectedDate(new Date(e.target.value))}
										required
										className='bg-[#1A1F2E] border-none text-white text-xs sm:text-sm h-8 sm:h-10'
									/>
								</div>
								<div className='space-y-1 sm:space-y-2'>
									<Label className='text-xs sm:text-sm'>Boshlash vaqti</Label>
									<TimePicker
										value={formData.startTime}
										onChange={time =>
											setFormData({ ...formData, startTime: time })
										}
									/>
								</div>
								<div className='space-y-1 sm:space-y-2'>
									<Label className='text-xs sm:text-sm'>Tugatish vaqti</Label>
									<TimePicker
										value={formData.endTime}
										onChange={time =>
											setFormData({ ...formData, endTime: time })
										}
									/>
								</div>
								<div className='space-y-1 sm:space-y-2'>
									<Label className='text-xs sm:text-sm'>
										Tanaffus (daqiqada)
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
										className='bg-[#1A1F2E] border-none text-white text-xs sm:text-sm h-8 sm:h-10'
									/>
								</div>
							</div>
							<div className='space-y-1 sm:space-y-2'>
								<Label className='text-xs sm:text-sm'>Izoh</Label>
								<Input
									value={formData.description}
									onChange={e =>
										setFormData({ ...formData, description: e.target.value })
									}
									required
									placeholder='Ish haqida qisqacha izoh'
									className='bg-[#1A1F2E] border-none text-white text-xs sm:text-sm h-8 sm:h-10'
								/>
							</div>
							<div className='flex gap-2 pt-2'>
								<Button
									type='submit'
									disabled={loading}
									className='flex-1 sm:flex-none bg-gradient-to-r from-[#4E7BEE] to-[#4CC4C0] text-xs sm:text-sm h-8 sm:h-10'
								>
									{loading
										? 'Saqlanmoqda...'
										: editingEntry
										? 'Yangilash'
										: 'Saqlash'}
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
										Bekor qilish
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
							<h2 className='text-base sm:text-xl'>Mening vaqtlarim</h2>
							<div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto'>
								<div className='flex items-center gap-2 w-full sm:w-auto'>
									<Label className='text-xs sm:text-sm min-w-[30px]'>Oy:</Label>
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
										Yil:
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
										Yuklanmoqda...
									</p>
								) : error ? (
									<p className='text-center text-red-500 text-xs sm:text-sm'>
										{error}
									</p>
								) : filteredEntries.length === 0 ? (
									<p className='text-center text-gray-400 text-xs sm:text-sm'>
										Bu oyda vaqtlar kiritilmagan
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
															Sana:{' '}
															{new Date(entry.date).toLocaleDateString('uz-UZ')}
														</p>
														<p>
															Vaqt: {formatTime(entry.startTime)} -{' '}
															{formatTime(entry.endTime)}
														</p>
														<p>Tanaffus: {entry.breakMinutes} daqiqa</p>
													</div>
												</div>
												<div className='flex items-center gap-2 self-end sm:self-center'>
													<p className='font-bold text-base sm:text-lg text-[#4CC4C0]'>
														{entry.hours.toFixed(1)} soat
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
