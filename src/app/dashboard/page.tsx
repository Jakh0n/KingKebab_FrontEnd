'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	addTimeEntry,
	downloadMyPDF,
	getMyTimeEntries,
	logout,
} from '@/lib/api'
import { TimeEntry, TimeEntryFormData } from '@/types'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
		startTime: '09:00',
		endTime: '21:00',
		date: new Date().toISOString().split('T')[0],
		description: '',
		breakMinutes: 0,
	})
	const router = useRouter()

	useEffect(() => {
		const token = localStorage.getItem('token')
		if (!token) {
			router.push('/login')
			return
		}

		// JWT dan foydalanuvchi ma'lumotlarini olish
		const payload = JSON.parse(atob(token.split('.')[1]))
		setUserData({
			id: payload.userId,
			username: payload.username,
			position: payload.position,
		})

		loadEntries()
	}, [router])

	async function loadEntries() {
		try {
			setLoading(true)
			setError('')
			console.log('Loading entries...')
			const data = await getMyTimeEntries()
			console.log('Loaded entries:', data)

			// Ma'lumotlarni tekshirish
			if (!Array.isArray(data)) {
				console.error('Loaded data is not an array:', data)
				setError("Ma'lumotlar formati noto'g'ri")
				return
			}

			// Har bir yozuvni tekshirish
			const validEntries = data.map(entry => ({
				...entry,
				date: new Date(entry.date).toISOString().split('T')[0],
				startTime: new Date(entry.startTime).toISOString(),
				endTime: new Date(entry.endTime).toISOString(),
			}))

			console.log('Processed entries:', validEntries)
			setEntries(validEntries)

			// Filterlangan ma'lumotlarni tekshirish
			const filtered = validEntries.filter(entry => {
				const entryDate = new Date(entry.date)
				const entryMonth = entryDate.getMonth() + 1
				const entryYear = entryDate.getFullYear()
				const isMatching =
					entryMonth === selectedMonth && entryYear === selectedYear
				console.log('Filtering entry:', {
					date: entry.date,
					entryMonth,
					selectedMonth,
					entryYear,
					selectedYear,
					isMatching,
				})
				return isMatching
			})
			console.log('Filtered entries:', filtered)
		} catch (err) {
			console.error('Error loading entries:', err)
			setError(
				err instanceof Error ? err.message : 'Vaqtlarni yuklashda xatolik'
			)
		} finally {
			setLoading(false)
		}
	}

	function handleLogout() {
		logout()
		router.push('/login')
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)
		setError('')

		try {
			// Vaqtlarni tekshirish
			const startDate = new Date(`${formData.date}T${formData.startTime}`)
			const endDate = new Date(`${formData.date}T${formData.endTime}`)

			if (endDate < startDate) {
				setError("Tugash vaqti boshlash vaqtidan katta bo'lishi kerak")
				setLoading(false)
				return
			}

			await addTimeEntry({
				...formData,
				breakMinutes: parseInt(formData.breakMinutes.toString()) || 0,
			})

			// Formani tozalash
			setFormData({
				startTime: '09:00',
				endTime: '21:00',
				date: new Date().toISOString().split('T')[0],
				description: '',
				breakMinutes: 0,
			})

			// Yangi ma'lumotlarni yuklash
			await loadEntries()
		} catch (err) {
			console.error('Error adding time entry:', err)
			setError(
				err instanceof Error ? err.message : "Vaqt qo'shishda xatolik yuz berdi"
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
			const entryMonth = entryDate.getMonth() + 1
			const entryYear = entryDate.getFullYear()
			return entryMonth === selectedMonth && entryYear === selectedYear
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
							Yangi vaqt qo&apos;shish
						</h2>
						<form onSubmit={handleSubmit} className='space-y-4'>
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
								<div className='space-y-2'>
									<Label className='text-sm'>Sana</Label>
									<Input
										type='date'
										value={formData.date}
										onChange={e =>
											setFormData({ ...formData, date: e.target.value })
										}
										required
										className='bg-[#1A1F2E] border-none text-white text-sm'
									/>
								</div>
								<div className='space-y-2'>
									<Label className='text-sm'>Boshlash vaqti</Label>
									<Input
										type='time'
										value={formData.startTime}
										onChange={e =>
											setFormData({ ...formData, startTime: e.target.value })
										}
										required
										className='bg-[#1A1F2E] border-none text-white text-sm'
									/>
								</div>
								<div className='space-y-2'>
									<Label className='text-sm'>Tugatish vaqti</Label>
									<Input
										type='time'
										value={formData.endTime}
										onChange={e =>
											setFormData({ ...formData, endTime: e.target.value })
										}
										required
										className='bg-[#1A1F2E] border-none text-white text-sm'
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
								{loading ? 'Saqlanmoqda...' : 'Saqlash'}
							</Button>
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
											<p className='font-bold text-lg sm:text-xl self-end sm:self-auto'>
												{entry.hours.toFixed(1)} soat
											</p>
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
