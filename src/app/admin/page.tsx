'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { downloadWorkerPDF, getAllTimeEntries, logout } from '@/lib/api'
import { TimeEntry } from '@/types'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminPage() {
	const [entries, setEntries] = useState<TimeEntry[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
	const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
	const [selectedWorker, setSelectedWorker] = useState<string | null>(null)
	const router = useRouter()

	useEffect(() => {
		const token = localStorage.getItem('token')
		if (!token) {
			router.push('/login')
			return
		}

		loadEntries()
	}, [router])

	async function loadEntries() {
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
	}

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

	// Ishchilar bo'yicha statistika
	const workerStats = filteredEntries.reduce((acc, entry) => {
		if (!entry.user) return acc

		const userId = entry.user._id
		if (!acc[userId]) {
			acc[userId] = {
				id: userId,
				username: entry.user.username,
				position: entry.user.position,
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
	}, {} as Record<string, { id: string; username: string; position: string; totalHours: number; regularDays: number; overtimeDays: number }>)

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
							{[2023, 2024, 2025].map(year => (
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
					{/* Workers List */}
					<div className='w-full lg:w-1/3 h-[300px] lg:h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar pr-2'>
						<div className='space-y-3 sm:space-y-4'>
							{Object.values(workerStats).map(worker => (
								<Card
									key={worker.id}
									className={`bg-[#0E1422] border-none text-white p-4 sm:p-6 cursor-pointer transition-all hover:bg-[#1A1F2E] ${
										selectedWorker === worker.id ? 'ring-2 ring-[#4E7BEE]' : ''
									}`}
									onClick={() => setSelectedWorker(worker.id)}
								>
									<div className='flex flex-col gap-4'>
										<div className='flex justify-between items-start'>
											<div>
												<h2 className='text-base sm:text-xl font-semibold'>
													{worker.username}
												</h2>
												<p className='text-gray-400 text-sm'>
													{worker.position === 'worker' ? 'Worker' : 'Rider'}
												</p>
											</div>
											<div className='bg-[#4E7BEE]/10 px-3 py-1 rounded-full'>
												<p className='text-[#4E7BEE] font-medium text-sm sm:text-base'>
													{worker.totalHours.toFixed(1)} hours
												</p>
											</div>
										</div>
										<div className='grid grid-cols-2 gap-3 sm:gap-4'>
											<div className='bg-[#1A1F2E] p-3 rounded-lg'>
												<p className='text-gray-400 text-xs sm:text-sm'>
													Regular Days
												</p>
												<p className='text-[#4CC4C0] font-semibold text-sm sm:text-base'>
													{worker.regularDays} days
												</p>
											</div>
											<div className='bg-[#1A1F2E] p-3 rounded-lg'>
												<p className='text-gray-400 text-xs sm:text-sm'>
													Overtime
												</p>
												<p className='text-[#9B5DE5] font-semibold text-sm sm:text-base'>
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
						<Card className='bg-[#0E1422] border-none text-white p-4 sm:p-6 h-[400px] lg:h-[calc(100vh-120px)]'>
							{selectedWorker ? (
								<div className='h-full flex flex-col'>
									<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6'>
										<h2 className='text-lg sm:text-xl font-semibold'>
											{workerStats[selectedWorker].username} - Time History
										</h2>
										<Button
											className='bg-[#00875A] hover:bg-[#00875A]/90 w-full sm:w-auto'
											onClick={() => handleDownloadPDF(selectedWorker)}
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
								<p className='text-center text-gray-400 text-sm'>
									Select a worker
								</p>
							)}
						</Card>
					</div>
				</div>
			</div>
		</main>
	)
}
