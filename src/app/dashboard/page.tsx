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
				`http://localhost:5000/api/time/${entryId}`,
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
			<div className='max-w-4xl mx-auto space-y-4 sm:space-y-6'>
				{/* Header */}
				<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0'>
					<div>
						<h1 className='text-xl sm:text-2xl font-bold text-white'>
							Dashboard
						</h1>
						{userData && (
							<p className='text-gray-400'>
								{userData.username} -{' '}
								{userData.position === 'worker' ? 'Ishchi' : 'Rider'}
							</p>
						)}
					</div>
					<Button
						onClick={handleLogout}
						className='w-full sm:w-auto bg-[#FF3B6F] hover:bg-[#FF3B6F]/90'
					>
						Chiqish
					</Button>
				</div>

				{/* Statistika */}
				<div className='grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4'>
					<Card className='bg-[#0E1422] border-none text-white p-3 sm:p-4'>
						<p className='text-gray-400 text-xs sm:text-sm'>Jami soatlar</p>
						<p className='text-[#4E7BEE] text-lg sm:text-xl font-bold'>
							{stats.totalHours.toFixed(1)} soat
						</p>
					</Card>
					<Card className='bg-[#0E1422] border-none text-white p-3 sm:p-4'>
						<p className='text-gray-400 text-xs sm:text-sm'>Oddiy kunlar</p>
						<p className='text-[#4CC4C0] text-lg sm:text-xl font-bold'>
							{stats.regularDays} kun
						</p>
					</Card>
					<Card className='bg-[#0E1422] border-none text-white p-3 sm:p-4'>
						<p className='text-gray-400 text-xs sm:text-sm'>
							Qo&apos;shimcha kunlar
						</p>
						<p className='text-[#9B5DE5] text-lg sm:text-xl font-bold'>
							{stats.overtimeDays} kun
						</p>
					</Card>
					<Card className='bg-[#0E1422] border-none text-white p-3 sm:p-4 flex items-center justify-center'>
						<Button
							onClick={handleDownloadPDF}
							className='bg-[#00875A] hover:bg-[#00875A]/90 w-full text-xs sm:text-base'
						>
							PDF yuklab olish
						</Button>
					</Card>
				</div>

				{/* Vaqt qo'shish formasi */}
				<Card className='bg-[#0E1422] border-none text-white'>
					<div className='p-4 sm:p-6'>
						<h2 className='text-lg sm:text-xl mb-4'>
							{editingEntry ? 'Vaqtni tahrirlash' : "Yangi vaqt qo'shish"}
						</h2>
						<form onSubmit={handleSubmit} className='space-y-4'>
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
								<div className='space-y-2'>
									<Label className='text-sm'>Sana</Label>
									<Input
										type='date'
										value={selectedDate.toISOString().split('T')[0]}
										onChange={e => setSelectedDate(new Date(e.target.value))}
										required
										className='bg-[#1A1F2E] border-none text-white text-sm'
									/>
								</div>
								<div className='space-y-2'>
									<Label className='text-sm'>Boshlash vaqti</Label>
									<TimePicker
										value={formData.startTime}
										onChange={time =>
											setFormData({ ...formData, startTime: time })
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label className='text-sm'>Tugatish vaqti</Label>
									<TimePicker
										value={formData.endTime}
										onChange={time =>
											setFormData({ ...formData, endTime: time })
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label className='text-sm'>Tanaffus (daqiqada)</Label>
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
										className='bg-[#1A1F2E] border-none text-white text-sm'
									/>
								</div>
							</div>
							<div className='space-y-2'>
								<Label className='text-sm'>Izoh</Label>
								<Input
									value={formData.description}
									onChange={e =>
										setFormData({ ...formData, description: e.target.value })
									}
									required
									placeholder='Ish haqida qisqacha izoh'
									className='bg-[#1A1F2E] border-none text-white text-sm'
								/>
							</div>
							<Button
								type='submit'
								disabled={loading}
								className='w-full sm:w-auto bg-gradient-to-r from-[#4E7BEE] to-[#4CC4C0]'
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
									className='ml-2 bg-gray-600 hover:bg-gray-700'
								>
									Bekor qilish
								</Button>
							)}
							{error && <p className='text-red-500 text-sm'>{error}</p>}
						</form>
					</div>
				</Card>

				{/* Vaqtlar ro'yxati */}
				<Card className='bg-[#0E1422] border-none text-white'>
					<div className='p-4 sm:p-6'>
						<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6'>
							<h2 className='text-lg sm:text-xl'>Mening vaqtlarim</h2>
							<div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
								<div className='flex items-center gap-2'>
									<Label className='text-sm'>Oy:</Label>
									<select
										value={selectedMonth}
										onChange={e => setSelectedMonth(parseInt(e.target.value))}
										className='bg-[#1A1F2E] border-none text-white rounded px-2 py-1 text-sm'
									>
										{months.map(month => (
											<option key={month.value} value={month.value}>
												{month.label}
											</option>
										))}
									</select>
								</div>
								<div className='flex items-center gap-2'>
									<Label className='text-sm'>Yil:</Label>
									<select
										value={selectedYear}
										onChange={e => setSelectedYear(parseInt(e.target.value))}
										className='bg-[#1A1F2E] border-none text-white rounded px-2 py-1 text-sm'
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
							<div className='space-y-3 sm:space-y-4'>
								{loading ? (
									<p className='text-center text-gray-400 text-sm'>
										Yuklanmoqda...
									</p>
								) : error ? (
									<p className='text-center text-red-500 text-sm'>{error}</p>
								) : filteredEntries.length === 0 ? (
									<p className='text-center text-gray-400 text-sm'>
										Bu oyda vaqtlar kiritilmagan
									</p>
								) : (
									filteredEntries.map(entry => (
										<div
											key={entry._id}
											className='bg-[#1A1F2E] rounded p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0'
										>
											<div>
												<p className='font-medium text-sm sm:text-base'>
													{entry.description}
												</p>
												<div className='text-xs sm:text-sm text-gray-400 space-y-1'>
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
											<div className='flex items-center gap-2'>
												<p className='font-bold text-lg sm:text-xl'>
													{entry.hours.toFixed(1)} soat
												</p>
												<Button
													onClick={() => handleEdit(entry)}
													className='p-2 h-8 w-8 bg-blue-600 hover:bg-blue-700'
												>
													<Pencil size={16} />
												</Button>
												<Button
													onClick={() => handleDelete(entry._id)}
													className='p-2 h-8 w-8 bg-red-600 hover:bg-red-700'
												>
													<Trash2 size={16} />
												</Button>
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
