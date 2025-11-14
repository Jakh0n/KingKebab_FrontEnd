'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	createAnnouncement,
	getAllTimeEntries,
	logout,
	registerWorker,
} from '@/lib/api'
import { TimeEntry } from '@/types'
import {
	AlertTriangle,
	Bell,
	Bike,
	CalendarDays,
	ChefHat,
	ChevronRight,
	Clock,
	Download,
	LogOut,
	Menu,
	Search,
	Settings,
	Timer,
	User,
	UserPlus,
	Users,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import AddWorkerModal from './components/AddWorkerModal'
import AnnouncementModal from './components/AnnouncementModal'

export default function AdminPage() {
	const [entries, setEntries] = useState<TimeEntry[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
	const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
	const [selectedWorker, setSelectedWorker] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)
	const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false)
	const router = useRouter()

	const loadEntries = useCallback(async () => {
		try {
			setLoading(true)
			const data = await getAllTimeEntries()

			// Backend calculation bilan mos kelishi uchun hours ni normalize qilish
			const normalizedEntries = data.map(entry => ({
				...entry,
				hours: Number(entry.hours.toFixed(1)),
			}))

			setEntries(normalizedEntries)
		} catch (err) {
			if (
				err instanceof Error &&
				err.message.includes('Admin access required')
			) {
				router.push('/dashboard')
			}
			console.error('Error loading entries:', err)
		} finally {
			setLoading(false)
		}
	}, [router])

	useEffect(() => {
		const token = localStorage.getItem('token')
		if (!token) {
			router.push('/login')
			return
		}

		loadEntries()
	}, [router, loadEntries])

	// Oy yoki yil o'zgarganda ma'lumotlarni yangilash
	useEffect(() => {
		loadEntries()
	}, [selectedMonth, selectedYear, loadEntries])

	function handleLogout() {
		logout()
		router.push('/login')
	}

	// Vaqtlarni formatlash
	function formatTime(timeStr: string) {
		return new Date(timeStr).toLocaleTimeString('uz-UZ', {
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	// Oylar ro'yxati
	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	]

	// Tanlangan oyga tegishli yozuvlarni filterlash
	const filteredEntries = entries.filter(entry => {
		const entryDate = new Date(entry.date)
		return (
			entryDate.getMonth() + 1 === selectedMonth &&
			entryDate.getFullYear() === selectedYear
		)
	})

	// Ishchilar bo'yicha statistika - useMemo bilan optimallashtirish
	const workerStats = useMemo(() => {
		return filteredEntries.reduce(
			(acc, entry) => {
				if (!entry.user?._id) return acc

				const userId = entry.user._id
				if (!acc[userId]) {
					acc[userId] = {
						id: userId,
						employeeId: entry.user.employeeId || entry.employeeId || 'N/A',
						username: entry.user.username || '',
						position: entry.user.position || 'worker',
						totalHours: 0,
						regularDays: 0,
						overtimeDays: 0,
					}
				}

				// Backend bilan mos kelishi uchun to'g'ri yumaloqlash
				const entryHours = Number(entry.hours.toFixed(1))
				acc[userId].totalHours += entryHours

				if (entryHours <= 12) {
					acc[userId].regularDays++
				} else {
					acc[userId].overtimeDays++
				}
				return acc
			},
			{} as Record<
				string,
				{
					id: string
					employeeId: string
					username: string
					position: string
					totalHours: number
					regularDays: number
					overtimeDays: number
				}
			>
		)
	}, [filteredEntries])

	// Total hours ni to'g'ri yumaloqlash
	Object.values(workerStats).forEach(worker => {
		worker.totalHours = Number(worker.totalHours.toFixed(1))
	})

	// Tanlangan ishchi ma'lumotlari
	const selectedWorkerData = useMemo(() => {
		return selectedWorker ? workerStats[selectedWorker] : null
	}, [selectedWorker, workerStats])

	// Filter workers based on search query
	const filteredWorkers = useMemo(() => {
		const workers = Object.values(workerStats)
		if (!searchQuery) return workers

		const query = searchQuery.toLowerCase()
		return workers.filter(worker =>
			worker.username.toLowerCase().includes(query)
		)
	}, [workerStats, searchQuery])

	// async function handleDownloadPDF(userId: string) {
	// 	try {
	// 		setPdfLoading(true)
	// 		await downloadWorkerPDF(userId, selectedMonth, selectedYear)
	// 		toast.success('PDF downloaded successfully')
	// 	} catch (error) {
	// 		console.error('Error downloading PDF:', error)
	// 		toast.error('Error downloading PDF')
	// 	} finally {
	// 		setPdfLoading(false)
	// 	}
	// }

	const handleAddWorker = async (workerData: {
		username: string
		password: string
		position: string
		isAdmin: boolean
		employeeId: string
	}) => {
		try {
			await registerWorker(workerData)
			setIsAddModalOpen(false)
			await loadEntries() // Refresh the list
			toast.success('Worker added successfully')
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to add worker'
			)
		}
	}

	const handleDownloadExcel = () => {
		console.log('Worker Stats before Excel:', Object.values(workerStats))

		// Filter out monthly users - only include worker and rider positions
		const regularWorkers = Object.values(workerStats).filter(
			worker => worker.position === 'worker' || worker.position === 'rider'
		)

		// Workers statistics in English (excluding monthly users)
		const excelData = regularWorkers.map(worker => {
			console.log('Processing worker:', worker)
			return {
				'Employee ID': worker.employeeId || 'N/A',
				'Employee Name': worker.username,
				'Total Hours': worker.totalHours,
				'Total Days': worker.regularDays + worker.overtimeDays,
				'Regular Days': worker.regularDays,
				'Overtime Days': worker.overtimeDays,
				Position: worker.position === 'worker' ? 'Worker' : 'Rider',
			}
		})

		console.log('Excel Data:', excelData)

		const ws = XLSX.utils.json_to_sheet(excelData)
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(
			wb,
			ws,
			`${months[selectedMonth - 1]} ${selectedYear}`
		)

		// Create filename with selected month and year
		const fileName = `King_Kebab_${
			months[selectedMonth - 1]
		}_${selectedYear}.xlsx`
		XLSX.writeFile(wb, fileName)
	}

	const handleDownloadMonthlyExcel = () => {
		// Filter only monthly users
		const monthlyWorkers = Object.values(workerStats).filter(
			worker => worker.position === 'monthly'
		)

		if (monthlyWorkers.length === 0) {
			toast.error('No monthly users found for this period')
			return
		}

		// Monthly workers statistics in English
		const excelData = monthlyWorkers.map(worker => {
			return {
				'Employee ID': worker.employeeId || 'N/A',
				'Employee Name': worker.username,
				'Total Hours': worker.totalHours,
				'Total Days': worker.regularDays + worker.overtimeDays,
				'Regular Days': worker.regularDays,
				'Overtime Days': worker.overtimeDays,
				Position: 'Monthly',
			}
		})

		const ws = XLSX.utils.json_to_sheet(excelData)
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(
			wb,
			ws,
			`Monthly Users - ${months[selectedMonth - 1]} ${selectedYear}`
		)

		// Create filename with selected month and year for monthly users only
		const fileName = `King_Kebab_Monthly_Users_${
			months[selectedMonth - 1]
		}_${selectedYear}.xlsx`
		XLSX.writeFile(wb, fileName)

		toast.success(
			`Monthly users data downloaded (${monthlyWorkers.length} users)`
		)
	}

	if (loading) {
		return (
			<main className='min-h-screen p-2 sm:p-4 bg-[#0A0F1C]'>
				<div className='max-w-[1400px] mx-auto flex items-center justify-center h-screen'>
					<div className='flex flex-col items-center gap-2'>
						<div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4E7BEE]'></div>
						<p className='text-white text-sm'>Loading...</p>
					</div>
				</div>
			</main>
		)
	}

	return (
		<main className='min-h-screen p-2 sm:p-4 lg:p-6 bg-[#0A0F1C]'>
			<div className='max-w-7xl mx-auto space-y-4'>
				{/* Header */}
				<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 bg-[#0E1422] p-3 sm:p-4 rounded-lg'>
					<div className='flex items-center gap-4 w-full sm:w-auto'>
						<Image
							src='/cropped-kinglogo.avif'
							alt='King Kebab Logo'
							className='w-10 h-10 sm:w-12 sm:h-12 object-contain'
							width={100}
							height={100}
						/>
						<div>
							<h1 className='text-base sm:text-lg md:text-2xl font-bold text-white'>
								King Kebab | Admin Panel
							</h1>
						</div>
					</div>

					<div className='flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end'>
						<div className='flex items-center gap-2 flex-1 sm:flex-auto'>
							<select
								className='bg-[#1A1F2E] text-white px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm w-full sm:w-[140px] border border-gray-700 focus:border-[#4E7BEE] focus:ring-1 focus:ring-[#4E7BEE] outline-none transition-all cursor-pointer'
								value={selectedMonth}
								onChange={e => setSelectedMonth(parseInt(e.target.value))}
							>
								{months.map((month, index) => (
									<option key={index + 1} value={index + 1}>
										{month}
									</option>
								))}
							</select>

							<select
								className='bg-[#1A1F2E] text-white px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm w-[80px] sm:w-[100px] border border-gray-700 focus:border-[#4E7BEE] focus:ring-1 focus:ring-[#4E7BEE] outline-none transition-all cursor-pointer'
								value={selectedYear}
								onChange={e => setSelectedYear(parseInt(e.target.value))}
							>
								{Array.from(
									{ length: 5 },
									(_, i) => new Date().getFullYear() - 2 + i
								).map(year => (
									<option key={year} value={year}>
										{year}
									</option>
								))}
							</select>
						</div>

						{/* Admin Actions Dropdown */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant='ghost'
									size='icon'
									className='h-9 w-9 sm:h-10 sm:w-10 bg-[#1A1F2E] hover:bg-[#2A3447] flex-shrink-0'
								>
									<Menu className='h-4 w-4 sm:h-5 sm:w-5 text-[#4E7BEE]' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align='end'
								className='w-56 bg-[#1A1F2E] border-[#2A3447] text-white'
							>
								<DropdownMenuItem
									className='hover:bg-[#2A3447] cursor-pointer group'
									onClick={() => setIsAddModalOpen(true)}
								>
									<UserPlus className='mr-2 h-4 w-4 text-[#4CC4C0] group-hover:text-[#4CC4C0]/80' />
									<span>Add Worker</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									className='hover:bg-[#2A3447] cursor-pointer group'
									onClick={() => setIsAnnouncementModalOpen(true)}
								>
									<Bell className='mr-2 h-4 w-4 text-[#4CC4C0] group-hover:text-[#4CC4C0]/80' />
									<span>Add Announcement</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									className='hover:bg-[#2A3447] cursor-pointer group'
									onClick={handleDownloadExcel}
								>
									<Download className='mr-2 h-4 w-4 text-[#4E7BEE] group-hover:text-[#4E7BEE]/80' />
									<span>Download Excel (All)</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									className='hover:bg-[#2A3447] cursor-pointer group'
									onClick={handleDownloadMonthlyExcel}
								>
									<CalendarDays className='mr-2 h-4 w-4 text-purple-400 group-hover:text-purple-400/80' />
									<span>Download Monthly Users</span>
								</DropdownMenuItem>
								<DropdownMenuItem className='hover:bg-[#2A3447] cursor-pointer group'>
									<Settings className='mr-2 h-4 w-4 text-[#4E7BEE] group-hover:text-[#4E7BEE]/80' />
									<span>Settings</span>
								</DropdownMenuItem>
								<DropdownMenuSeparator className='bg-[#2A3447]' />
								<DropdownMenuItem
									className='hover:bg-[#2A3447] cursor-pointer group text-[#FF3B6F] focus:text-[#FF3B6F]'
									onClick={handleLogout}
								>
									<LogOut className='mr-2 h-4 w-4 group-hover:text-[#FF3B6F]/80' />
									<span>Logout</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Main Content */}
				<>
					{/* Stats Grid */}
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
						<Card className='bg-[#0E1422] border-none text-white p-4 sm:p-5 hover:bg-[#1A1F2E] transition-all duration-300'>
							<div className='flex items-center gap-3'>
								<div className='bg-[#4E7BEE]/10 p-3 rounded-xl'>
									<Users className='w-6 h-6 text-[#4E7BEE]' />
								</div>
								<div className='flex-1'>
									<h3 className='text-gray-400 text-sm mb-1'>Total Staff</h3>
									<p className='text-2xl font-bold text-[#4E7BEE]'>
										{Object.values(workerStats).length}
									</p>
								</div>
							</div>
						</Card>
						<Card className='bg-[#0E1422] border-none text-white p-4 sm:p-5 hover:bg-[#1A1F2E] transition-all duration-300'>
							<div className='flex items-center gap-3'>
								<div className='bg-[#4CC4C0]/10 p-3 rounded-xl'>
									<ChefHat className='w-6 h-6 text-[#4CC4C0]' />
								</div>
								<div className='flex-1'>
									<h3 className='text-gray-400 text-sm mb-1'>Worker(s)</h3>
									<p className='text-2xl font-bold text-[#4CC4C0]'>
										{
											Object.values(workerStats).filter(
												w => w.position === 'worker'
											).length
										}
									</p>
								</div>
							</div>
						</Card>
						<Card className='bg-[#0E1422] border-none text-white p-4 sm:p-5 hover:bg-[#1A1F2E] transition-all duration-300'>
							<div className='flex items-center gap-3'>
								<div className='bg-[#9B5DE5]/10 p-3 rounded-xl'>
									<Bike className='w-6 h-6 text-[#9B5DE5]' />
								</div>
								<div className='flex-1'>
									<h3 className='text-gray-400 text-sm mb-1'>Rider(s)</h3>
									<p className='text-2xl font-bold text-[#9B5DE5]'>
										{
											Object.values(workerStats).filter(
												w => w.position === 'rider'
											).length
										}
									</p>
								</div>
							</div>
						</Card>
						<Card className='bg-[#0E1422] border-none text-white p-4 sm:p-5 hover:bg-[#1A1F2E] transition-all duration-300'>
							<div className='flex items-center gap-3'>
								<div className='bg-purple-500/10 p-3 rounded-xl'>
									<CalendarDays className='w-6 h-6 text-purple-400' />
								</div>
								<div className='flex-1'>
									<h3 className='text-gray-400 text-sm mb-1'>Monthly</h3>
									<p className='text-2xl font-bold text-purple-400'>
										{
											Object.values(workerStats).filter(
												w => w.position === 'monthly'
											).length
										}
									</p>
								</div>
							</div>
						</Card>
					</div>

					{/* Main Content */}
					<div className='flex flex-col lg:flex-row gap-4'>
						{/* Workers List */}
						<div className='w-full lg:w-1/3 bg-[#0E1422] rounded-lg p-3 sm:p-4'>
							{/* Search Input */}
							<div className='relative mb-4'>
								<input
									type='text'
									placeholder='Search workers...'
									value={searchQuery}
									onChange={e => setSearchQuery(e.target.value)}
									className='w-full bg-[#1A1F2E] text-white pl-9 pr-4 py-2.5 rounded-lg text-sm border border-gray-700 focus:border-[#4E7BEE] focus:ring-1 focus:ring-[#4E7BEE] outline-none transition-all'
								/>
								<Search
									size={16}
									className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
								/>
							</div>

							<div className='h-[calc(100vh-380px)] sm:h-[calc(100vh-320px)] lg:h-[calc(100vh-230px)] overflow-y-auto custom-scrollbar pr-2 space-y-3'>
								{filteredWorkers.map(worker => (
									<Card
										key={worker.id}
										className={`border-none text-white p-3 sm:p-4 cursor-pointer transition-all hover:bg-[#1A1F2E] ${
											selectedWorker === worker.id
												? 'bg-[#1A1F2E] ring-2 ring-[#4E7BEE]'
												: 'bg-[#0A0F1C]'
										}`}
										onClick={() => setSelectedWorker(worker.id)}
									>
										<div className='flex flex-col gap-3'>
											<div className='flex justify-between items-start'>
												<div>
													<h2 className='text-base sm:text-lg font-semibold mb-0.5 sm:mb-1 flex items-center gap-2'>
														{worker.position === 'worker' ? (
															<ChefHat size={16} className='text-[#4CC4C0]' />
														) : worker.position === 'rider' ? (
															<Bike size={16} className='text-[#9B5DE5]' />
														) : (
															<CalendarDays
																size={16}
																className='text-purple-400'
															/>
														)}
														{worker.username}
													</h2>
													<div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3'>
														<p className='text-gray-400 text-xs sm:text-sm'>
															{worker.position === 'worker'
																? 'Worker'
																: worker.position === 'rider'
																? 'Rider'
																: 'Monthly'}
														</p>
														<span className='px-2 py-0.5 bg-[#4E7BEE]/10 text-[#4E7BEE] text-xs rounded border border-[#4E7BEE]/20'>
															ID: {worker.employeeId || 'N/A'}
														</span>
													</div>
												</div>
												<div className='bg-[#4E7BEE]/10 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full flex items-center gap-1.5'>
													<Clock size={12} className='text-[#4E7BEE]' />
													<p className='text-[#4E7BEE] font-medium text-xs sm:text-sm'>
														{worker.totalHours.toFixed(1)}h
													</p>
												</div>
											</div>
											<div className='grid grid-cols-2 gap-2 sm:gap-3'>
												<div className='bg-[#1A1F2E] p-2 sm:p-3 rounded-lg'>
													<p className='text-gray-400 text-xs mb-0.5 sm:mb-1 flex items-center gap-1'>
														<CalendarDays size={12} />
														Regular
													</p>
													<p className='text-[#4CC4C0] font-semibold text-sm'>
														{worker.regularDays}d
													</p>
												</div>
												<div className='bg-[#1A1F2E] p-2 sm:p-3 rounded-lg'>
													<p className='text-gray-400 text-xs mb-0.5 sm:mb-1 flex items-center gap-1'>
														<Timer size={12} />
														Overtime
													</p>
													<p className='text-[#9B5DE5] font-semibold text-sm'>
														{worker.overtimeDays}d
													</p>
												</div>
											</div>
										</div>
									</Card>
								))}
							</div>
						</div>

						{/* Worker Details */}
						<div className='w-full lg:w-2/3'>
							<Card className='bg-[#0E1422] border-none text-white p-3 sm:p-4 lg:p-6 h-[calc(100vh-380px)] sm:h-[calc(100vh-320px)] lg:h-[calc(100vh-230px)]'>
								{selectedWorkerData ? (
									<div className='h-full flex flex-col'>
										<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6'>
											<h2 className='text-lg sm:text-xl font-semibold flex items-center gap-2'>
												{selectedWorkerData.position === 'worker' ? (
													<ChefHat size={20} className='text-[#4CC4C0]' />
												) : (
													<Bike size={20} className='text-[#9B5DE5]' />
												)}
												{selectedWorkerData.username}
											</h2>
											{/* <Button
											className='bg-[#00875A] hover:bg-[#00875A]/90 w-full sm:w-auto px-4 sm:px-6 gap-2 h-9 sm:h-10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
											onClick={() =>
												selectedWorker && handleDownloadPDF(selectedWorker)
											}
											disabled={pdfLoading}
										>
											{pdfLoading ? (
												<Loader2 className='w-4 h-4 animate-spin' />
											) : (
												<Download size={16} />
											)}
											<span className='hidden sm:inline '>Download PDF</span>
											<span className='sm:hidden'>PDF</span>
										</Button> */}
										</div>
										<div className='space-y-2 sm:space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1'>
											{filteredEntries
												.filter(
													entry =>
														entry.user && entry.user._id === selectedWorker
												)
												.map(entry => {
													const isOvertime = entry.hours > 12
													return (
														<div
															key={entry._id}
															className={`bg-[#1A1F2E] p-4 rounded-lg transition-all duration-300 border ${
																isOvertime
																	? 'border-yellow-500/20'
																	: 'border-gray-800'
															} hover:bg-[#242B3D]`}
														>
															<div className='flex flex-col gap-4'>
																{/* Sana va Soatlar */}
																<div className='flex items-center justify-between'>
																	<div className='flex items-center gap-3'>
																		<div className='bg-[#4E7BEE]/10 p-2.5 rounded-lg'>
																			<CalendarDays className='w-5 h-5 text-[#4E7BEE]' />
																		</div>
																		<div>
																			<p className='text-sm text-gray-400'>
																				Date
																			</p>
																			<p className='font-medium'>
																				{new Date(
																					entry.date
																				).toLocaleDateString('en-US', {
																					weekday: 'short',
																					month: 'short',
																					day: 'numeric',
																				})}
																			</p>
																		</div>
																	</div>
																	<div className='flex flex-col items-end gap-1'>
																		<div
																			className={`px-3 py-1 rounded-full ${
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
																		<p className='text-[#4E7BEE] text-sm font-medium'>
																			{entry.hours.toFixed(1)} hours
																		</p>
																	</div>
																</div>

																{/* Ish vaqti */}
																<div className='flex items-center gap-3 bg-[#0E1422] p-3 rounded-lg'>
																	<div className='bg-[#4CC4C0]/10 p-2.5 rounded-lg'>
																		<Clock className='w-5 h-5 text-[#4CC4C0]' />
																	</div>
																	<div>
																		<p className='text-sm text-gray-400'>
																			Working Hours
																		</p>
																		<p className='font-medium text-[#4CC4C0]'>
																			{formatTime(entry.startTime)} -{' '}
																			{formatTime(entry.endTime)}
																		</p>
																	</div>
																</div>

																{/* Overtime ma'lumotlari */}
																{isOvertime && entry.overtimeReason && (
																	<div className='bg-yellow-500/5 p-4 rounded-lg border border-yellow-500/10 space-y-3'>
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

																		{entry.overtimeReason ===
																			'Company Request' &&
																			entry.responsiblePerson && (
																				<div className='flex items-center gap-3 pt-2 border-t border-yellow-500/10'>
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
																)}
															</div>
														</div>
													)
												})}
										</div>
									</div>
								) : (
									<p className='text-center text-gray-400 flex items-center justify-center gap-2 h-full text-sm'>
										<ChevronRight size={18} />
										Select a worker to view details
									</p>
								)}
							</Card>
						</div>
					</div>

					<AddWorkerModal
						isOpen={isAddModalOpen}
						onClose={() => setIsAddModalOpen(false)}
						onAdd={handleAddWorker}
					/>

					<AnnouncementModal
						isOpen={isAnnouncementModalOpen}
						onClose={() => setIsAnnouncementModalOpen(false)}
						onSubmit={async data => {
							try {
								await createAnnouncement(data)
								setIsAnnouncementModalOpen(false)
								toast.success('Announcement added successfully')
							} catch (error) {
								toast.error(
									error instanceof Error
										? error.message
										: 'Failed to add announcement'
								)
							}
						}}
					/>
				</>
			</div>
		</main>
	)
}
