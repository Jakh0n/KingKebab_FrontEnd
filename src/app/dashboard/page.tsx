'use client'

import { EditTimeEntryModal } from '@/components/EditTimeEntryModal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	addTimeEntry,
	deleteTimeEntry,
	getMyTimeEntries,
	logout,
} from '@/lib/api'
import { notifyTimeEntry } from '@/lib/telegramNotifications'
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
	Sparkles,
	Timer,
	Trash2,
	User,
	XCircle,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast, Toaster } from 'sonner'
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
		employeeId?: string
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
	const [logoutLoading, setLogoutLoading] = useState(false)
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const [expandedAnnouncements, setExpandedAnnouncements] = useState<{
		[key: string]: boolean
	}>({})
	const [showBetaModal, setShowBetaModal] = useState(true)
	const [currentPage, setCurrentPage] = useState(1)

	// Soatlarni hisoblash funksiyasi - backend bilan mos kelishi uchun
	const calculateHours = useCallback(
		(startTime: string, endTime: string): number => {
			const [startHours, startMinutes] = startTime.split(':').map(Number)
			const [endHours, endMinutes] = endTime.split(':').map(Number)

			let workHours
			if (
				endHours < startHours ||
				(endHours === startHours && endMinutes < startMinutes)
			) {
				// Agar tugash vaqti boshlanish vaqtidan kichik bo'lsa (masalan, 21:00 - 09:00)
				workHours = 24 - startHours + endHours
				workHours = workHours + (endMinutes - startMinutes) / 60
			} else {
				// Oddiy holat (masalan, 09:00 - 17:00)
				workHours = endHours - startHours + (endMinutes - startMinutes) / 60
			}

			// Backend bilan bir xil: Number(workHours.toFixed(1))
			return Number(workHours.toFixed(1))
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

			// Cache key yaratish
			const cacheKey = `timeEntries_${selectedMonth}_${selectedYear}`

			// Har doim fresh data olish uchun cache ni tekshirmasdan to'g'ridan-to'g'ri API dan olish
			const data = await getMyTimeEntries()

			if (!Array.isArray(data)) {
				setError('Invalid data format')
				return
			}

			const validEntries = data.map(entry => ({
				...entry,
				date: new Date(entry.date).toISOString().split('T')[0],
				startTime: new Date(entry.startTime).toISOString(),
				endTime: new Date(entry.endTime).toISOString(),
				// Backend calculation bilan mos kelishi uchun
				hours: Number(entry.hours.toFixed(1)),
			}))

			// Cache ga saqlash
			localStorage.setItem(cacheKey, JSON.stringify(validEntries))
			setEntries(validEntries)
		} catch (err) {
			console.error('Error loading entries:', err)
			// Fallback: cache dan olishga harakat qilish
			const cacheKey = `timeEntries_${selectedMonth}_${selectedYear}`
			const cachedData = localStorage.getItem(cacheKey)
			if (cachedData) {
				console.log('Using cached data as fallback')
				setEntries(JSON.parse(cachedData))
			} else {
				setError(err instanceof Error ? err.message : 'Failed to load data')
			}
		} finally {
			setLoading(false)
		}
	}, [selectedMonth, selectedYear])

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
			employeeId: payload.employeeId,
		})

		loadEntries()
	}, [router, loadEntries])

	// Oy o'zgarganda yangi ma'lumotlarni yuklash
	useEffect(() => {
		if (userData) {
			loadEntries()
		}
	}, [selectedMonth, selectedYear, loadEntries, userData])

	const handleLogout = useCallback(async () => {
		try {
			setLogoutLoading(true)
			toast.info('Logging out...', {
				description: 'Please wait while we log you out safely.',
				duration: 2000,
			})

			// Add a small delay to show the loading state
			await new Promise(resolve => setTimeout(resolve, 1000))

			await logout()

			// Clear all local storage data
			localStorage.removeItem('token')
			localStorage.removeItem('position')
			localStorage.removeItem('employeeId')

			router.push('/login')
		} catch (error) {
			console.error('Logout error:', error)
			toast.error('Error logging out. Please try again.')
		} finally {
			setLogoutLoading(false)
		}
	}, [router])

	// Tahrirlash funksiyasi
	const handleEditEntry = useCallback((entry: TimeEntry) => {
		// 2 kundan ko'p vaqt o'tgan bo'lsa, tahrirlashga ruxsat bermaymiz
		const entryDate = new Date(entry.date)
		const today = new Date()
		const diffTime = Math.abs(today.getTime() - entryDate.getTime())
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

		if (diffDays > 2) {
			toast.error('Cannot edit!', {
				description: 'Cannot edit time entries older than 2 days.',
				duration: 3000,
				style: {
					background: '#1A1F2E',
					border: '1px solid #FF3B6F',
					color: 'white',
				},
			})
			return
		}

		setEditingEntry(entry)
		setIsEditModalOpen(true)
	}, [])

	// Modal yopilganda
	const handleModalClose = useCallback(() => {
		setIsEditModalOpen(false)
		setEditingEntry(null)
	}, [])

	// Yozuv yangilanganda
	const handleEntryUpdate = useCallback(
		(updatedEntry: TimeEntry) => {
			setEntries(
				entries.map(entry =>
					entry._id === updatedEntry._id ? updatedEntry : entry
				)
			)
		},
		[entries]
	)

	// O'chirish funksiyasi
	const handleDelete = useCallback(
		async (entryId: string) => {
			if (!confirm('Are you sure you want to delete this time entry?')) {
				return
			}

			try {
				await deleteTimeEntry(entryId)
				// Ma'lumotlarni yangilash
				setEntries(entries.filter(entry => entry._id !== entryId))
			} catch (error) {
				console.error('Error:', error)
				setError(
					error instanceof Error ? error.message : 'Error deleting entry'
				)
			}
		},
		[entries]
	)

	// Submit funksiyasi
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
						throw new Error('Please select a responsible person')
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

				const newEntry = await addTimeEntry(data)

				// Format the new entry to match existing entries format
				const formattedEntry = {
					...newEntry,
					date: new Date(newEntry.date).toISOString().split('T')[0],
					startTime: new Date(newEntry.startTime).toISOString(),
					endTime: new Date(newEntry.endTime).toISOString(),
					hours: Number(newEntry.hours.toFixed(1)),
				}

				setEntries([...entries, formattedEntry])

				// Send Telegram notification from frontend
				if (userData) {
					try {
						await notifyTimeEntry(
							{
								user: userData,
								date: data.date,
								startTime: data.startTime,
								endTime: data.endTime,
								hours: formattedEntry.hours,
								overtimeReason: data.overtimeReason,
								responsiblePerson: data.responsiblePerson,
							},
							'added'
						)
					} catch (telegramError) {
						console.log('Telegram notification failed:', telegramError)
						// Don't show error to user - notifications are optional
					}
				}

				// Formani tozalash
				setFormData({
					startTime: '',
					endTime: '',
					date: new Date().toISOString().split('T')[0],
					overtimeReason: null,
					responsiblePerson: '',
				})

				// Loading holatini o'zgartirish
				setLoading(false)

				// Xatolik xabarini tozalash
				setError('')
			} catch (error) {
				console.error('Error:', error)
				setError(error instanceof Error ? error.message : 'Error saving data')
				setLoading(false)
			}
		},
		[selectedDate, formData, isOvertime, entries, userData]
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
	const { filteredEntries, stats, totalPages } = useMemo(() => {
		// Avval barcha yozuvlarni filterlash
		const allFilteredEntries = entries
			.filter(entry => {
				const entryDate = new Date(entry.date)
				return (
					entryDate.getMonth() + 1 === selectedMonth &&
					entryDate.getFullYear() === selectedYear
				)
			})
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

		// Pagination uchun
		const itemsPerPage = 10
		const startIndex = (currentPage - 1) * itemsPerPage
		const endIndex = startIndex + itemsPerPage

		// Sahifadagi yozuvlarni ajratib olish
		const paginatedEntries = allFilteredEntries.slice(startIndex, endIndex)

		// Statistikani hisoblash - backend bilan mos kelishi uchun to'g'ri yumaloqlash
		const stats = allFilteredEntries.reduce(
			(acc, entry) => {
				// Backend Number(workHours.toFixed(1)) bilan mos kelishi uchun
				const entryHours = Number(entry.hours.toFixed(1))
				acc.totalHours += entryHours
				if (entryHours <= 12) {
					acc.regularDays++
				} else {
					acc.overtimeDays++
				}
				return acc
			},
			{
				totalHours: 0,
				regularDays: 0,
				overtimeDays: 0,
			}
		)

		// Total hours ni ham to'g'ri yumaloqlash
		stats.totalHours = Number(stats.totalHours.toFixed(1))

		return {
			filteredEntries: paginatedEntries,
			stats,
			totalPages: Math.ceil(allFilteredEntries.length / itemsPerPage),
		}
	}, [entries, selectedMonth, selectedYear, currentPage])

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

	const toggleAnnouncement = (id: string) => {
		setExpandedAnnouncements(prev => ({
			...prev,
			[id]: !prev[id],
		}))
	}

	return (
		<main className='min-h-screen p-2 sm:p-4 bg-[#0A0F1C]'>
			<div
				className={`${
					logoutLoading ? 'opacity-60 pointer-events-none' : ''
				} transition-all duration-300`}
			>
				<Dialog open={showBetaModal} onOpenChange={setShowBetaModal}>
					<DialogContent className='bg-[#1A1F2E] border border-[#4E7BEE] text-white'>
						<DialogHeader>
							<div className='flex items-center gap-3 mb-2'>
								<div className='h-10 w-10 bg-[#4E7BEE]/10 rounded-full flex items-center justify-center'>
									<Sparkles className='h-5 w-5 text-[#4E7BEE]' />
								</div>
								<div>
									<DialogTitle className='text-lg font-semibold flex items-center gap-2'>
										Beta Version
										<span className='px-1.5 py-0.5 rounded-full bg-[#4E7BEE]/10 text-[#4E7BEE] text-xs'>
											v0.1.0
										</span>
									</DialogTitle>
								</div>
							</div>
							<DialogDescription className='text-gray-400'>
								This app is currently in Beta (test) mode. Please write your
								times in your notes. After the beta version, you can use it
								normally.
							</DialogDescription>
						</DialogHeader>
						<div className='mt-4 flex justify-end'>
							<Button
								onClick={() => setShowBetaModal(false)}
								className='bg-[#4E7BEE] hover:bg-[#4E7BEE]/90 text-white'
							>
								I Understand
							</Button>
						</div>
					</DialogContent>
				</Dialog>
				<Toaster richColors position='top-right' theme='dark' />
				<div className='max-w-4xl mx-auto space-y-3 sm:space-y-6'>
					{/* Header */}
					<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-[#0E1422] p-3 sm:p-4 rounded-lg'>
						<div className='flex items-center gap-4'>
							<Image
								src='/cropped-kinglogo.avif'
								alt='King Kebab Logo'
								className='w-12 h-12 object-contain'
								width={100}
								height={100}
							/>
							<div>
								<h1 className='text-lg sm:text-2xl font-bold text-white'>
									Dashboard
								</h1>
								{userData && (
									<div className='flex items-center gap-2'>
										<p className='text-sm sm:text-base text-gray-400'>
											{userData.username}
										</p>
										<span className='px-2 py-0.5 bg-[#4E7BEE]/10 text-[#4E7BEE] text-xs rounded-full border border-[#4E7BEE]/20'>
											ID: {userData.employeeId || 'N/A'}
										</span>
										<span className='text-sm sm:text-base text-gray-400'>
											-{' '}
											{userData.position === 'worker'
												? 'Worker'
												: userData.position === 'rider'
												? 'Rider'
												: 'Monthly'}
										</span>
									</div>
								)}
							</div>
						</div>

						<div className='flex gap-2 w-full sm:w-auto'>
							<Button
								onClick={() => router.push('/dashboard/profile')}
								variant='outline'
								className='flex-1 sm:flex-none bg-transparent border-[#4CC4C0]/20 text-[#4CC4C0] hover:bg-[#4CC4C0]/10 text-sm'
								disabled={logoutLoading}
							>
								<User size={16} className='mr-1' />
								Profile
							</Button>
							<Button
								onClick={handleLogout}
								className='flex-1 sm:flex-none bg-[#FF3B6F] hover:bg-[#FF3B6F]/90 text-sm cursor-pointer'
								disabled={logoutLoading}
							>
								{logoutLoading ? (
									<>
										<div className='animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2'></div>
										Logging out...
									</>
								) : (
									<>
										<span className='ml-1'>Logout</span>
										<LogOut size={16} />
									</>
								)}
							</Button>
						</div>
					</div>

					{/* E'lonlar Banner */}
					<Card className='bg-[#0E1422] border-none text-white overflow-hidden'>
						<div className='relative bg-gradient-to-r from-[#4E7BEE]/20 to-[#4CC4C0]/20 p-4 sm:p-6'>
							{/* Bezak elementlari */}
							<div className='absolute top-0 right-0 w-32 h-32 bg-[#4E7BEE]/10 rounded-full -translate-y-1/2 translate-x-1/2'></div>
							<div className='absolute bottom-0 left-0 w-24 h-24 bg-[#4CC4C0]/10 rounded-full translate-y-1/2 -translate-x-1/2'></div>

							{/* Asosiy kontent */}
							<div className='relative'>
								<div className='flex items-center gap-2 mb-4'>
									<div className=' rounded-lg'>
										<Image src='/bell.png' alt='Bell' width={40} height={40} />
									</div>
									<h2 className='text-lg sm:text-2xl font-bold text-white'>
										Important Announcements
									</h2>
								</div>

								<div className='space-y-3'>
									<div className='bg-[#1A1F2E] p-3 sm:p-4 rounded-lg border border-[#4E7BEE]/20 hover:border-[#4E7BEE]/40 transition-all duration-300'>
										<div className='flex items-center gap-2 mb-2'>
											<div className='bg-[#4E7BEE]/10 p-1.5 rounded'>
												<FileText className='w-4 h-4 text-[#4E7BEE]' />
											</div>
											<p className='text-sm sm:text-base font-medium text-[#4E7BEE]'>
												New Work Time Tracking System
											</p>
										</div>
										<div className='relative'>
											<p
												className={`text-xs sm:text-sm text-gray-400 mt-1 ${
													!expandedAnnouncements['system'] ? 'line-clamp-3' : ''
												}`}
											>
												Dear, King Kebab Family, We are excited to announce the
												launch of our new Work Time Tracking System, designed to
												improve efficiency and accuracy in tracking working
												hours. Starting from new month, all team members will
												begin using the system, and we appreciate your
												cooperation in making this transition smooth.
											</p>
											{!expandedAnnouncements['system'] && (
												<button
													onClick={() => toggleAnnouncement('system')}
													className='text-[#4E7BEE] text-xs hover:underline mt-1'
												>
													Read More
												</button>
											)}
											{expandedAnnouncements['system'] && (
												<button
													onClick={() => toggleAnnouncement('system')}
													className='text-[#4E7BEE] text-xs hover:underline mt-1'
												>
													Show Less
												</button>
											)}
										</div>
									</div>

									{/* <div className='bg-[#1A1F2E] p-3 sm:p-4 rounded-lg border border-[#4CC4C0]/20 hover:border-[#4CC4C0]/40 transition-all duration-300'>
										<div className='flex items-center gap-2 mb-2'>
											<div className='bg-[#4CC4C0]/10 p-1.5 rounded'>
												<AlertTriangle className='w-4 h-4 text-[#4CC4C0]' />
											</div>
											<p className='text-sm sm:text-base font-medium text-[#4CC4C0]'>
												Kitchen Rules
											</p>
										</div>
										<div className='relative'>
											<p
												className={`text-xs sm:text-sm text-gray-400 mt-1 ${
													!expandedAnnouncements['salary'] ? 'line-clamp-3' : ''
												}`}
											>
												Hello King Kebab Family, please ensure we use fewer sauces
												for the kebabs, pay close attention to kebab quality, and
												maintain a clean kitchen at all times. Thank you for your
												continued dedication !
											</p>
											{!expandedAnnouncements['salary'] && (
												<button
													onClick={() => toggleAnnouncement('salary')}
													className='text-[#4CC4C0] text-xs hover:underline mt-1'
												>
													Read More
												</button>
											)}
											{expandedAnnouncements['salary'] && (
												<button
													onClick={() => toggleAnnouncement('salary')}
													className='text-[#4CC4C0] text-xs hover:underline mt-1'
												>
													Show Less
												</button>
											)}
										</div>
									</div> */}
								</div>
							</div>
						</div>
					</Card>

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
								Add New Time Entry
							</h2>
							<form onSubmit={handleSubmit} className='space-y-4'>
								<fieldset disabled={logoutLoading} className='space-y-4'>
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
										<div className='space-y-2'>
											<Label className='text-sm flex items-center gap-1.5'>
												<Calendar className='w-4 h-4 text-gray-400' />
												Date
											</Label>
											<Input
												type='date'
												value={selectedDate.toISOString().split('T')[0]}
												onChange={e =>
													setSelectedDate(new Date(e.target.value))
												}
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
									</div>

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
													<option value='Company Request'>
														Company Request
													</option>
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

									{/* Submit tugmasi */}
									<div className='flex justify-end gap-2'>
										<Button
											type='submit'
											className='bg-[#4E7BEE] hover:bg-[#4E7BEE]/90 text-white gap-2'
											disabled={loading || logoutLoading}
										>
											{loading ? (
												<>
													<div className='animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white'></div>
													Saving...
												</>
											) : (
												<>
													<CheckCircle2 className='w-4 h-4' />
													Add Entry
												</>
											)}
										</Button>
									</div>
								</fieldset>
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
											onChange={e => {
												setSelectedMonth(parseInt(e.target.value))
												setCurrentPage(1)
											}}
											className='flex-1 sm:flex-none bg-[#1A1F2E] border-none text-white rounded px-3 py-2 text-sm h-10 cursor-pointer min-w-[120px]'
											disabled={logoutLoading}
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
											onChange={e => {
												setSelectedYear(parseInt(e.target.value))
												setCurrentPage(1)
											}}
											className='flex-1 sm:flex-none bg-[#1A1F2E] border-none text-white rounded px-3 py-2 text-sm h-10 cursor-pointer min-w-[120px]'
											disabled={logoutLoading}
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

							{/* Time entries list */}
							<div className='h-[400px] overflow-y-auto custom-scrollbar pr-2 mb-4'>
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
									<div className='space-y-4'>
										{filteredEntries.map(entry => {
											const isOvertime = entry.hours > 12
											return (
												<div
													key={entry._id}
													className={`bg-gradient-to-r ${
														isOvertime
															? 'from-[#1A1F2E] to-yellow-950/10 border-l-4 border-l-yellow-500'
															: 'from-[#1A1F2E] to-[#1A1F2E] border-l-4 border-l-emerald-500'
													} rounded-lg transition-all duration-300 hover:shadow-lg`}
												>
													<div className='p-5'>
														{/* Yuqori qism: Sana, Status va Amallar */}
														<div className='flex items-center justify-between mb-4'>
															<div className='flex items-center gap-3'>
																<div className='bg-[#4E7BEE]/10 p-2.5 rounded-lg'>
																	<CalendarDays className='w-5 h-5 text-[#4E7BEE]' />
																</div>
																<div>
																	<p className='text-sm text-gray-400'>Date</p>
																	<p className='font-medium'>
																		{new Date(entry.date).toLocaleDateString(
																			'en-US',
																			{
																				weekday: 'short',
																				month: 'short',
																				day: 'numeric',
																			}
																		)}
																	</p>
																</div>
															</div>
															<div className='flex items-center gap-3'>
																<div
																	className={`px-3 py-1.5 rounded-full ${
																		isOvertime
																			? 'bg-yellow-500/10'
																			: 'bg-emerald-500/10'
																	}`}
																>
																	<p
																		className={`text-sm font-medium ${
																			isOvertime
																				? 'text-yellow-500'
																				: 'text-emerald-500'
																		}`}
																	>
																		{isOvertime ? 'Overtime' : 'Regular'}
																	</p>
																</div>
																<div className='flex gap-1'>
																	<Button
																		variant='ghost'
																		onClick={() => handleEditEntry(entry)}
																		disabled={
																			logoutLoading ||
																			Math.ceil(
																				Math.abs(
																					new Date().getTime() -
																						new Date(entry.date).getTime()
																				) /
																					(1000 * 60 * 60 * 24)
																			) > 2
																		}
																		className={`hover:bg-[#2A3447] h-8 w-8 ${
																			Math.ceil(
																				Math.abs(
																					new Date().getTime() -
																						new Date(entry.date).getTime()
																				) /
																					(1000 * 60 * 60 * 24)
																			) > 2
																				? 'text-gray-500 cursor-not-allowed'
																				: 'text-[#4E7BEE] hover:text-[#4E7BEE]/80'
																		}`}
																	>
																		<Pencil className='w-4 h-4' />
																	</Button>
																	<Button
																		variant='ghost'
																		onClick={() => handleDelete(entry._id)}
																		className='hover:bg-[#2A3447] text-red-500 hover:text-red-600 h-8 w-8'
																		disabled={logoutLoading}
																	>
																		<Trash2 className='w-4 h-4' />
																	</Button>
																</div>
															</div>
														</div>

														{/* Asosiy ma'lumotlar */}
														<div className='space-y-4'>
															{/* Ish vaqti */}
															<div className='flex items-center gap-4 bg-[#0E1422] p-4 rounded-lg'>
																<div className='bg-[#4CC4C0]/10 p-2.5 rounded-lg'>
																	<Clock className='w-5 h-5 text-[#4CC4C0]' />
																</div>
																<div className='flex-1'>
																	<p className='text-sm text-gray-400'>
																		Working Hours
																	</p>
																	<div className='flex items-center justify-between'>
																		<p className='font-medium text-[#4CC4C0]'>
																			{formatTime(entry.startTime)} -{' '}
																			{formatTime(entry.endTime)}
																		</p>
																		<p className='text-[#4E7BEE] font-medium'>
																			{entry.hours.toFixed(1)} hours
																		</p>
																	</div>
																</div>
															</div>

															{/* Overtime ma'lumotlari */}
															{isOvertime && entry.overtimeReason && (
																<div className='relative'>
																	<div className='absolute left-4 top-0 bottom-0 w-0.5 bg-yellow-500/20'></div>
																	<div className='space-y-4 pl-8'>
																		{/* Overtime sababi */}
																		<div className='flex items-center gap-3'>
																			<div className='bg-yellow-500/10 p-2.5 rounded-lg'>
																				<AlertTriangle className='w-5 h-5 text-yellow-500' />
																			</div>
																			<div>
																				<p className='text-sm text-gray-400'>
																					Overtime Reason
																				</p>
																				<p className='font-medium text-yellow-500'>
																					{entry.overtimeReason}
																				</p>
																			</div>
																		</div>

																		{/* Mas'ul shaxs */}
																		{entry.overtimeReason ===
																			'Company Request' &&
																			entry.responsiblePerson && (
																				<div className='flex items-center gap-3'>
																					<div className='bg-blue-500/10 p-2.5 rounded-lg'>
																						<User className='w-5 h-5 text-blue-500' />
																					</div>
																					<div>
																						<p className='text-sm text-gray-400'>
																							Responsible Person
																						</p>
																						<p className='font-medium text-blue-500'>
																							{entry.responsiblePerson}
																						</p>
																					</div>
																				</div>
																			)}
																	</div>
																</div>
															)}
														</div>
													</div>
												</div>
											)
										})}
									</div>
								)}
							</div>

							{/* Pagination */}
							{totalPages > 1 && (
								<div className='flex items-center justify-center gap-2'>
									<Button
										variant='outline'
										size='sm'
										onClick={() =>
											setCurrentPage(prev => Math.max(1, prev - 1))
										}
										disabled={currentPage === 1 || logoutLoading}
										className='bg-[#1A1F2E] border-none text-white hover:bg-[#2A3447] cursor-pointer'
									>
										Previous
									</Button>
									<span className='text-sm text-gray-400'>
										Page {currentPage} of {totalPages}
									</span>
									<Button
										variant='outline'
										size='sm'
										onClick={() => setCurrentPage(prev => prev + 1)}
										disabled={currentPage >= totalPages || logoutLoading}
										className='bg-[#1A1F2E] border-none text-white hover:bg-[#2A3447] cursor-pointer'
									>
										Next
									</Button>
								</div>
							)}
						</div>
					</Card>
				</div>

				{/* Edit Modal */}
				<EditTimeEntryModal
					isOpen={isEditModalOpen}
					onClose={handleModalClose}
					entry={editingEntry}
					onUpdate={handleEntryUpdate}
				/>
			</div>
		</main>
	)
}
