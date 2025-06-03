'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { downloadWorkerPDF, getAllTimeEntries, logout } from '@/lib/api'
import { TimeEntry } from '@/types'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

export default function AdminPage() {
	const [entries, setEntries] = useState<TimeEntry[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
	const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
	const [selectedWorker, setSelectedWorker] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const router = useRouter()

	const loadEntries = useCallback(async () => {
		try {
			setLoading(true)
			const data = await getAllTimeEntries()
			setEntries(data)
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
						username: entry.user.username || '',
						position: entry.user.position || 'worker',
						totalHours: 0,
						regularDays: 0,
						overtimeDays: 0,
					}
				}
				acc[userId].totalHours += entry.hours
				if (entry.hours <= 12) {
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
					username: string
					position: string
					totalHours: number
					regularDays: number
					overtimeDays: number
				}
			>
		)
	}, [filteredEntries])

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

	async function handleDownloadPDF(userId: string) {
		try {
			await downloadWorkerPDF(userId, selectedMonth, selectedYear)
		} catch (error) {
			console.error('Error downloading PDF:', error)
		}
	}

	if (loading) {
		return (
			<main className='min-h-screen p-4 bg-[#0A0F1C]'>
				<div className='max-w-[1400px] mx-auto'>
					<p className='text-center text-white'>Loading...</p>
				</div>
			</main>
		)
	}

	return (
		<main className='min-h-screen p-2 sm:p-4 bg-[#0A0F1C]'>
			<div className='max-w-[1400px] mx-auto'>
				<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6'>
					<h1 className='text-xl sm:text-2xl font-bold text-[#4E7BEE]'>
						Admin Panel
					</h1>

					<div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto'>
						<select
							className='bg-[#1A1F2E] text-white px-3 py-2 rounded text-sm w-full sm:w-auto'
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
							className='bg-[#1A1F2E] text-white px-3 py-2 rounded text-sm w-full sm:w-auto'
							value={selectedYear}
							onChange={e => setSelectedYear(parseInt(e.target.value))}
						>
							{[2023, 2024, 2025, 2026].map(year => (
								<option key={year} value={year}>
									{year}
								</option>
							))}
						</select>
						<Button
							onClick={handleLogout}
							className='bg-[#FF3B6F] hover:bg-[#FF3B6F]/90 w-full sm:w-auto'
						>
							Logout
						</Button>
					</div>
				</div>

				<div className='flex flex-col lg:flex-row gap-4'>
					{/* Workers Statistics */}
					<div className='w-full'>
						<div className='grid grid-cols-3 gap-4 mb-4'>
							<Card className='bg-[#0E1422] border-none text-white p-4'>
								<h3 className='text-gray-400 text-sm'>Total Staff</h3>
								<p className='text-2xl font-bold text-[#4E7BEE]'>
									{Object.values(workerStats).length}
								</p>
							</Card>
							<Card className='bg-[#0E1422] border-none text-white p-4'>
								<h3 className='text-gray-400 text-sm'>Workers</h3>
								<p className='text-2xl font-bold text-[#4CC4C0]'>
									{
										Object.values(workerStats).filter(
											w => w.position === 'worker'
										).length
									}
								</p>
							</Card>
							<Card className='bg-[#0E1422] border-none text-white p-4'>
								<h3 className='text-gray-400 text-sm'>Riders</h3>
								<p className='text-2xl font-bold text-[#9B5DE5]'>
									{
										Object.values(workerStats).filter(
											w => w.position === 'rider'
										).length
									}
								</p>
							</Card>
						</div>
					</div>
				</div>

				<div className='flex flex-col lg:flex-row gap-4'>
					{/* Workers List Sidebar */}
					<div className='w-full lg:w-1/3 bg-[#0E1422] rounded-lg p-4'>
						<div className='mb-6'>
							<input
								type='text'
								placeholder='Search workers...'
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								className='w-full bg-[#1A1F2E] text-white px-4 py-3 rounded-lg text-sm border-none focus:ring-2 focus:ring-[#4E7BEE] outline-none placeholder:text-gray-400'
							/>
						</div>
						<div className='h-[calc(100vh-230px)] overflow-y-auto custom-scrollbar pr-2 space-y-3'>
							{filteredWorkers.map(worker => (
								<Card
									key={worker.id}
									className={`border-none text-white p-5 cursor-pointer transition-all hover:bg-[#1A1F2E] ${
										selectedWorker === worker.id
											? 'bg-[#1A1F2E] ring-2 ring-[#4E7BEE]'
											: 'bg-[#0A0F1C]'
									}`}
									onClick={() => setSelectedWorker(worker.id)}
								>
									<div className='flex flex-col gap-4'>
										<div className='flex justify-between items-start'>
											<div>
												<h2 className='text-lg font-semibold mb-1'>
													{worker.username}
												</h2>
												<p className='text-gray-400 text-sm'>
													{worker.position === 'worker' ? 'Worker' : 'Rider'}
												</p>
											</div>
											<div className='bg-[#4E7BEE]/10 px-3 py-1.5 rounded-full'>
												<p className='text-[#4E7BEE] font-medium'>
													{worker.totalHours.toFixed(1)} hours
												</p>
											</div>
										</div>
										<div className='grid grid-cols-2 gap-3'>
											<div className='bg-[#1A1F2E] p-3 rounded-lg'>
												<p className='text-gray-400 text-xs mb-1'>
													Regular Days
												</p>
												<p className='text-[#4CC4C0] font-semibold'>
													{worker.regularDays} days
												</p>
											</div>
											<div className='bg-[#1A1F2E] p-3 rounded-lg'>
												<p className='text-gray-400 text-xs mb-1'>Overtime</p>
												<p className='text-[#9B5DE5] font-semibold'>
													{worker.overtimeDays} days
												</p>
											</div>
										</div>
									</div>
								</Card>
							))}
						</div>
					</div>

					{/* Selected Worker Details */}
					<div className='w-full lg:w-2/3'>
						<Card className='bg-[#0E1422] border-none text-white p-6 h-[calc(100vh-120px)]'>
							{selectedWorkerData ? (
								<div className='h-full flex flex-col'>
									<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6'>
										<h2 className='text-xl font-semibold'>
											{selectedWorkerData.username} - Time History
										</h2>
										<Button
											className='bg-[#00875A] hover:bg-[#00875A]/90 w-full sm:w-auto px-6'
											onClick={() =>
												selectedWorker && handleDownloadPDF(selectedWorker)
											}
										>
											Download PDF
										</Button>
									</div>
									<div className='space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1'>
										{filteredEntries
											.filter(
												entry => entry.user && entry.user._id === selectedWorker
											)
											.map(entry => (
												<div
													key={entry._id}
													className='bg-[#1A1F2E] p-3 sm:p-4 rounded-lg'
												>
													<div className='grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4'>
														<div>
															<p className='text-gray-400 text-xs sm:text-sm'>
																Date
															</p>
															<p className='font-medium text-sm sm:text-base'>
																{new Date(entry.date).toLocaleDateString(
																	'en-US'
																)}
															</p>
														</div>
														<div>
															<p className='text-gray-400 text-xs sm:text-sm'>
																Time
															</p>
															<p className='font-medium text-sm sm:text-base'>
																{formatTime(entry.startTime)} -{' '}
																{formatTime(entry.endTime)}
															</p>
														</div>
														<div>
															<p className='text-gray-400 text-xs sm:text-sm'>
																Hours Worked
															</p>
															<p className='font-medium text-sm sm:text-base text-[#4E7BEE]'>
																{entry.hours.toFixed(1)} hours
															</p>
														</div>
														<div>
															<p className='text-gray-400 text-xs sm:text-sm'>
																Break
															</p>
															<p className='font-medium text-sm sm:text-base'>
																{entry.breakMinutes} minutes
															</p>
														</div>
													</div>
													<div className='mt-3'>
														<p className='text-gray-400 text-xs sm:text-sm'>
															Description
														</p>
														<p className='font-medium text-sm sm:text-base'>
															{entry.description}
														</p>
													</div>
												</div>
											))}
									</div>
								</div>
							) : (
								<p className='text-center text-gray-400'>
									Select a worker to view details
								</p>
							)}
						</Card>
					</div>
				</div>
			</div>
		</main>
	)
}
