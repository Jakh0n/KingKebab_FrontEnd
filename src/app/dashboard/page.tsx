'use client'

declare global {
	interface Window {
		SpeechRecognition: unknown
		webkitSpeechRecognition: unknown
	}
}

import { EditTimeEntryModal } from '@/components/EditTimeEntryModal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
	addTimeEntry,
	deleteTimeEntry,
	getAnnouncements,
	getUserProfile,
	logout,
	updateUserProfile,
} from '@/lib/api'
import { getTokenOrNull } from '@/lib/auth'
import { notifyTimeEntry } from '@/lib/telegramNotifications'
import { Announcement, TimeEntry, TimeEntryFormData } from '@/types'
import {
	AlertTriangle,
	Bell,
	Calendar,
	CheckCircle2,
	Clock,
	FileText,
	Loader2,
	Mic,
	MicOff,
	Sparkles,
	User,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { TimePicker } from '../../components/ui/time-picker'
import { DashboardHeader } from './components/DashboardHeader'
import { MenuSurveyModal } from './components/MenuSurveyModal'
import { StatsCards } from './components/StatsCards'
import { TimeEntriesList } from './components/TimeEntriesList'
import { useDashboardStats } from './hooks/useDashboardStats'
import { useMonthFilter } from './hooks/useMonthFilter'
import { useTimeEntries } from './hooks/useTimeEntries'

const OVERTIME_THRESHOLD_HOURS = 12
const EDIT_WINDOW_DAYS = 2
const RECENT_HISTORY_MONTHS = 3
const SUGGESTION_MIN_OCCURRENCES = 2
const QUARTER_HOUR_MINUTES = 15

interface AnnouncementStyle {
	icon: typeof FileText
	accent: string
	tile: string
	border: string
}

const ANNOUNCEMENT_STYLES: Record<Announcement['type'], AnnouncementStyle> = {
	info: {
		icon: FileText,
		accent: 'text-primary',
		tile: 'bg-primary/10',
		border: 'border-primary/15',
	},
	warning: {
		icon: AlertTriangle,
		accent: 'text-warning',
		tile: 'bg-warning/10',
		border: 'border-warning/20',
	},
	success: {
		icon: CheckCircle2,
		accent: 'text-success',
		tile: 'bg-success/10',
		border: 'border-success/20',
	},
}

interface SmartSuggestion {
	startTime: string
	endTime: string
	message: string
	count: number
}

export default function DashboardPage() {
	const router = useRouter()

	const {
		selectedMonth,
		selectedYear,
		setSelectedMonth,
		setSelectedYear,
		currentPage,
		setCurrentPage,
		months,
	} = useMonthFilter()

	const {
		entries,
		loading,
		error,
		setLoading,
		setError,
		loadEntries,
		setEntries,
	} = useTimeEntries(selectedMonth, selectedYear)

	const { filteredEntries, stats, totalPages } = useDashboardStats(
		entries,
		selectedMonth,
		selectedYear,
		currentPage
	)

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
		latePerson: '',
	})
	const [selectedDate, setSelectedDate] = useState(new Date())
	const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
	const [logoutLoading, setLogoutLoading] = useState(false)
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const [expandedAnnouncements, setExpandedAnnouncements] = useState<
		Record<string, boolean>
	>({})
	const [announcements, setAnnouncements] = useState<Announcement[]>([])
	const [showSurveyModal, setShowSurveyModal] = useState(false)
	const [, setSurveyCompleted] = useState<boolean | null>(null)
	const [isListening, setIsListening] = useState(false)
	const [speechSupported, setSpeechSupported] = useState(false)

	const calculateHours = useCallback(
		(startTime: string, endTime: string): number => {
			const [startHours, startMinutes] = startTime.split(':').map(Number)
			const [endHours, endMinutes] = endTime.split(':').map(Number)

			let workHours: number
			if (
				endHours < startHours ||
				(endHours === startHours && endMinutes < startMinutes)
			) {
				workHours = 24 - startHours + endHours
				workHours = workHours + (endMinutes - startMinutes) / 60
			} else {
				workHours = endHours - startHours + (endMinutes - startMinutes) / 60
			}

			return Number(workHours.toFixed(1))
		},
		[]
	)

	const isOvertime = useMemo(() => {
		if (!formData.startTime || !formData.endTime) return false
		return calculateHours(formData.startTime, formData.endTime) > OVERTIME_THRESHOLD_HOURS
	}, [formData.startTime, formData.endTime, calculateHours])

	useEffect(() => {
		const token = getTokenOrNull()
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
		getAnnouncements()
			.then(setAnnouncements)
			.catch(() => setAnnouncements([]))

		getUserProfile()
			.then(user => {
				const completed = user.surveyCompleted ?? false
				setSurveyCompleted(completed)
				setShowSurveyModal(!completed)
			})
			.catch(() => setSurveyCompleted(false))
	}, [router, loadEntries])

	useEffect(() => {
		if (userData) loadEntries()
	}, [selectedMonth, selectedYear, loadEntries, userData])

	const handleLogout = useCallback(async () => {
		try {
			setLogoutLoading(true)
			toast.info('Signing out…', { duration: 1500 })
			await new Promise(resolve => setTimeout(resolve, 800))
			await logout()

			localStorage.removeItem('token')
			localStorage.removeItem('position')
			localStorage.removeItem('employeeId')

			router.push('/login')
		} catch (err) {
			console.error('Logout error:', err)
			toast.error('Error signing out. Please try again.')
		} finally {
			setLogoutLoading(false)
		}
	}, [router])

	const handleEditEntry = useCallback((entry: TimeEntry) => {
		const diffDays = Math.ceil(
			Math.abs(Date.now() - new Date(entry.date).getTime()) /
				(1000 * 60 * 60 * 24)
		)

		if (diffDays > EDIT_WINDOW_DAYS) {
			toast.error('Cannot edit', {
				description: `Entries older than ${EDIT_WINDOW_DAYS} days are locked.`,
			})
			return
		}

		setEditingEntry(entry)
		setIsEditModalOpen(true)
	}, [])

	const handleModalClose = useCallback(() => {
		setIsEditModalOpen(false)
		setEditingEntry(null)
	}, [])

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

	const handleDelete = useCallback(
		async (entryId: string) => {
			if (!confirm('Are you sure you want to delete this time entry?')) return

			try {
				await deleteTimeEntry(entryId)
				setEntries(entries.filter(entry => entry._id !== entryId))
			} catch (err) {
				console.error('Delete error:', err)
				setError(err instanceof Error ? err.message : 'Error deleting entry')
			}
		},
		[entries]
	)

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

				let overtimeReason: TimeEntry['overtimeReason'] = null
				let responsiblePerson: TimeEntry['responsiblePerson'] = ''

				if (isOvertime) {
					overtimeReason = formData.overtimeReason
					if (
						overtimeReason === 'Company Request' &&
						!formData.responsiblePerson
					) {
						throw new Error('Please select a responsible person')
					}
					if (overtimeReason === 'Late Arrival' && !formData.latePerson) {
						throw new Error('Please enter who was late')
					}
					responsiblePerson = formData.responsiblePerson || ''
				}

				const data: TimeEntryFormData = {
					startTime: startDate.toISOString(),
					endTime: endDate.toISOString(),
					date: selectedDate.toISOString().split('T')[0],
					overtimeReason,
					responsiblePerson,
					latePerson:
						isOvertime && overtimeReason === 'Late Arrival'
							? formData.latePerson
							: '',
				}

				const newEntry = await addTimeEntry(data)
				const formattedEntry = {
					...newEntry,
					date: new Date(newEntry.date).toISOString().split('T')[0],
					startTime: new Date(newEntry.startTime).toISOString(),
					endTime: new Date(newEntry.endTime).toISOString(),
					hours: Number(newEntry.hours.toFixed(1)),
				}

				setEntries([...entries, formattedEntry])

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
								latePerson: data.latePerson,
							},
							'added'
						)
					} catch (notifyErr) {
						console.log('Telegram notification failed:', notifyErr)
					}
				}

				setFormData({
					startTime: '',
					endTime: '',
					date: new Date().toISOString().split('T')[0],
					overtimeReason: null,
					responsiblePerson: '',
					latePerson: '',
				})
				setLoading(false)
				setError('')
			} catch (err) {
				console.error('Submit error:', err)
				setError(err instanceof Error ? err.message : 'Error saving data')
				setLoading(false)
			}
		},
		[selectedDate, formData, isOvertime, entries, userData]
	)

	const formatTime = useCallback((timeStr: string) => {
		return new Date(timeStr).toLocaleTimeString('uz-UZ', {
			hour: '2-digit',
			minute: '2-digit',
		})
	}, [])

	useEffect(() => {
		if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
			setSpeechSupported(true)
		}
	}, [])

	const parseTimeEntry = useCallback((text: string) => {
		const timeMatches = text.match(
			/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?m\.?|p\.?m\.?)?\b/gi
		)

		if (!timeMatches || timeMatches.length < 2) return null

		const convertTo24Hour = (time: string, isEndTime = false): string => {
			const match = time.match(
				/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?m\.?|p\.?m\.?)?/i
			)
			if (!match) return ''

			let hours = parseInt(match[1])
			const minutes = match[2] ? parseInt(match[2]) : 0
			const period = match[3]?.toLowerCase().replace(/\./g, '')

			if (period === 'pm' && hours !== 12) hours += 12
			else if (period === 'am' && hours === 12) hours = 0
			else if (!period) {
				if (hours >= 1 && hours <= 7 && isEndTime) hours += 12
				else if (hours >= 8 && hours <= 11 && isEndTime) hours += 12
			}

			return `${hours.toString().padStart(2, '0')}:${minutes
				.toString()
				.padStart(2, '0')}`
		}

		return {
			startTime: convertTo24Hour(timeMatches[0], false),
			endTime: convertTo24Hour(timeMatches[1], true),
		}
	}, [])

	const startSpeechRecognition = useCallback(() => {
		if (!speechSupported) {
			toast.error('Speech recognition is not supported in this browser')
			return
		}

		interface SpeechRecognitionEvent {
			results: {
				[key: number]: { [key: number]: { transcript: string } }
			}
		}
		interface SpeechRecognitionErrorEvent {
			error: string
		}
		interface SpeechRecognitionConstructor {
			new (): {
				continuous: boolean
				interimResults: boolean
				lang: string
				onstart: (() => void) | null
				onresult: ((event: SpeechRecognitionEvent) => void) | null
				onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
				onend: (() => void) | null
				start: () => void
			}
		}

		const Ctor = (window.SpeechRecognition ||
			window.webkitSpeechRecognition) as SpeechRecognitionConstructor
		const recognition = new Ctor()
		recognition.continuous = false
		recognition.interimResults = false
		recognition.lang = 'en-US'

		setIsListening(true)

		recognition.onstart = () => {
			toast.info('Listening…', {
				description: 'Say: "worked from 9 AM to 6 PM"',
			})
		}

		recognition.onresult = event => {
			const transcript = event.results[0][0].transcript
			const parsed = parseTimeEntry(transcript)

			if (parsed?.startTime && parsed.endTime) {
				setFormData(prev => ({
					...prev,
					startTime: parsed.startTime,
					endTime: parsed.endTime,
				}))
				toast.success('Voice recognized', {
					description: `${parsed.startTime} – ${parsed.endTime}`,
				})
			} else {
				toast.warning('Could not understand', {
					description: `"${transcript}"`,
				})
			}
		}

		recognition.onerror = event => {
			console.error('Speech recognition error:', event.error)
			toast.error('Speech recognition error', {
				description:
					event.error === 'no-speech' ? 'No speech detected' : 'Please try again',
			})
		}

		recognition.onend = () => setIsListening(false)
		recognition.start()
	}, [speechSupported, parseTimeEntry])

	const stopSpeechRecognition = useCallback(() => setIsListening(false), [])

	const smartSuggestion = useMemo<SmartSuggestion | null>(() => {
		if (entries.length === 0) return null

		const cutoff = new Date()
		cutoff.setMonth(cutoff.getMonth() - RECENT_HISTORY_MONTHS)

		const recent = entries.filter(entry => new Date(entry.date) >= cutoff)
		if (recent.length === 0) return null

		const groups = new Map<string, { count: number; startTime: string; endTime: string }>()

		for (const entry of recent) {
			const start = new Date(entry.startTime)
			const end = new Date(entry.endTime)

			const roundedStart =
				Math.round((start.getHours() * 60 + start.getMinutes()) / QUARTER_HOUR_MINUTES) *
				QUARTER_HOUR_MINUTES
			const roundedEnd =
				Math.round((end.getHours() * 60 + end.getMinutes()) / QUARTER_HOUR_MINUTES) *
				QUARTER_HOUR_MINUTES

			const format = (mins: number) => {
				const h = Math.floor(mins / 60) % 24
				const m = mins % 60
				return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
			}

			const startStr = format(roundedStart)
			const endStr = format(roundedEnd)
			const key = `${startStr}-${endStr}`

			const existing = groups.get(key)
			if (existing) existing.count++
			else groups.set(key, { count: 1, startTime: startStr, endTime: endStr })
		}

		let best: SmartSuggestion | null = null
		groups.forEach(group => {
			if (group.count >= SUGGESTION_MIN_OCCURRENCES && (!best || group.count > best.count)) {
				best = {
					startTime: group.startTime,
					endTime: group.endTime,
					message: `Your usual shift: ${group.startTime} – ${group.endTime} (${group.count}× in last ${RECENT_HISTORY_MONTHS} months)`,
					count: group.count,
				}
			}
		})

		return best
	}, [entries])

	const handleApplySuggestion = useCallback(() => {
		if (!smartSuggestion) return
		setFormData(prev => ({
			...prev,
			startTime: smartSuggestion.startTime,
			endTime: smartSuggestion.endTime,
		}))
		toast.success('Suggestion applied', {
			description: `${smartSuggestion.startTime} – ${smartSuggestion.endTime}`,
		})
	}, [smartSuggestion])

	const toggleAnnouncement = (id: string) => {
		setExpandedAnnouncements(prev => ({ ...prev, [id]: !prev[id] }))
	}

	const activeAnnouncements = announcements.filter(a => a.isActive)

	return (
		<main className='min-h-screen bg-background pb-12'>
			<div
				className={cn(
					'mx-auto flex max-w-4xl flex-col gap-6 px-4 pb-6 transition-opacity sm:px-6',
					logoutLoading && 'pointer-events-none opacity-60'
				)}
			>
				<MenuSurveyModal
					isOpen={showSurveyModal}
					onComplete={() => {
						setShowSurveyModal(false)
						setSurveyCompleted(true)
					}}
					onSubmit={async responses => {
						await updateUserProfile({
							surveyResponses: responses,
							surveyCompleted: true,
						})
					}}
				/>

				<DashboardHeader
					userData={userData}
					onLogout={handleLogout}
					logoutLoading={logoutLoading}
				/>

				{activeAnnouncements.length > 0 && (
					<Card className='gap-4 rounded-2xl p-4 shadow-card sm:p-6'>
						<div className='flex items-center gap-2'>
							<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
								<Bell className='h-4 w-4 text-primary' />
							</div>
							<h2 className='text-base font-semibold tracking-tight sm:text-lg'>
								Announcements
							</h2>
						</div>

						<ul className='space-y-2'>
							{activeAnnouncements.map(announcement => {
								const style =
									ANNOUNCEMENT_STYLES[announcement.type] ?? ANNOUNCEMENT_STYLES.info
								const Icon = style.icon
								const isExpanded = !!expandedAnnouncements[announcement._id]
								const isLong = announcement.content.length > 120

								return (
									<li
										key={announcement._id}
										className={cn(
											'rounded-xl border bg-background p-3',
											style.border
										)}
									>
										<div className='mb-1.5 flex items-center gap-2'>
											<div
												className={cn(
													'flex h-6 w-6 items-center justify-center rounded-md',
													style.tile
												)}
											>
												<Icon className={cn('h-3.5 w-3.5', style.accent)} />
											</div>
											<p className={cn('text-sm font-medium', style.accent)}>
												{announcement.title}
											</p>
										</div>
										<p
											className={cn(
												'whitespace-pre-wrap text-sm text-muted-foreground',
												!isExpanded && 'line-clamp-3'
											)}
										>
											{announcement.content}
										</p>
										{isLong && (
											<button
												type='button'
												onClick={() => toggleAnnouncement(announcement._id)}
												className={cn(
													'mt-1 text-xs font-medium hover:underline',
													style.accent
												)}
											>
												{isExpanded ? 'Show less' : 'Read more'}
											</button>
										)}
									</li>
								)
							})}
						</ul>
					</Card>
				)}

				<StatsCards stats={stats} />

				<Card className='gap-5 rounded-2xl p-4 shadow-card sm:p-6'>
					<div className='flex items-center justify-between'>
						<h2 className='flex items-center gap-2 text-base font-semibold sm:text-lg'>
							<FileText className='h-5 w-5 text-primary' />
							Add time entry
						</h2>
						{speechSupported && (
							<Button
								type='button'
								variant={isListening ? 'destructive' : 'secondary'}
								size='sm'
								className='rounded-full'
								onClick={
									isListening ? stopSpeechRecognition : startSpeechRecognition
								}
								disabled={loading || logoutLoading}
							>
								{isListening ? (
									<>
										<MicOff className='h-4 w-4' />
										Stop
									</>
								) : (
									<>
										<Mic className='h-4 w-4' />
										Voice
									</>
								)}
							</Button>
						)}
					</div>

					{smartSuggestion && !formData.startTime && !formData.endTime && (
						<div className='flex items-start justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3'>
							<div className='flex items-start gap-2.5'>
								<Sparkles className='mt-0.5 h-4 w-4 flex-shrink-0 text-primary' />
								<div>
									<p className='text-sm font-medium'>Smart suggestion</p>
									<p className='text-xs text-muted-foreground'>
										{smartSuggestion.message}
									</p>
								</div>
							</div>
							<Button
								type='button'
								size='sm'
								className='rounded-full'
								onClick={handleApplySuggestion}
							>
								Use
							</Button>
						</div>
					)}

					<form onSubmit={handleSubmit} className='space-y-4'>
						<fieldset disabled={logoutLoading} className='space-y-4'>
							<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
								<div className='space-y-1.5'>
									<Label className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
										<Calendar className='h-3.5 w-3.5' />
										Date
									</Label>
									<Input
										type='date'
										value={selectedDate.toISOString().split('T')[0]}
										onChange={e => setSelectedDate(new Date(e.target.value))}
										required
									/>
								</div>
								<div className='space-y-1.5'>
									<Label className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
										<Clock className='h-3.5 w-3.5' />
										Start time
									</Label>
									<TimePicker
										value={formData.startTime}
										onChange={time => setFormData({ ...formData, startTime: time })}
									/>
								</div>
								<div className='space-y-1.5 sm:col-span-2'>
									<Label className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
										<Clock className='h-3.5 w-3.5' />
										End time
									</Label>
									<TimePicker
										value={formData.endTime}
										onChange={time => setFormData({ ...formData, endTime: time })}
									/>
								</div>
							</div>

							{isOvertime && (
								<div className='space-y-4 rounded-xl border border-warning/30 bg-warning/5 p-4'>
									<div className='space-y-1.5'>
										<Label className='flex items-center gap-1.5 text-xs font-medium'>
											<AlertTriangle className='h-3.5 w-3.5 text-warning' />
											Overtime reason
										</Label>
										<Select
											value={formData.overtimeReason ?? ''}
											onValueChange={value =>
												setFormData({
													...formData,
													overtimeReason: value as TimeEntry['overtimeReason'],
													responsiblePerson:
														value === 'Company Request'
															? formData.responsiblePerson
															: '',
													latePerson:
														value === 'Late Arrival' ? formData.latePerson : '',
												})
											}
										>
											<SelectTrigger className='h-9 w-full'>
												<SelectValue placeholder='Select reason' />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='Busy'>Busy</SelectItem>
												<SelectItem value='Last Order'>Last Order</SelectItem>
												<SelectItem value='Company Request'>
													Company Request
												</SelectItem>
												<SelectItem value='Late Arrival'>Late Arrival</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{formData.overtimeReason === 'Company Request' && (
										<div className='space-y-1.5'>
											<Label className='flex items-center gap-1.5 text-xs font-medium'>
												<User className='h-3.5 w-3.5' />
												Responsible person
											</Label>
											<Select
												value={formData.responsiblePerson || ''}
												onValueChange={value =>
													setFormData({
														...formData,
														responsiblePerson:
															value as TimeEntry['responsiblePerson'],
													})
												}
											>
												<SelectTrigger className='h-9 w-full'>
													<SelectValue placeholder='Select person' />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value='Adilcan'>Adilcan</SelectItem>
													<SelectItem value='Boss'>Boss</SelectItem>
												</SelectContent>
											</Select>
										</div>
									)}

									{formData.overtimeReason === 'Late Arrival' && (
										<div className='space-y-1.5'>
											<Label className='flex items-center gap-1.5 text-xs font-medium'>
												<User className='h-3.5 w-3.5' />
												Who was late?
											</Label>
											<Input
												type='text'
												value={formData.latePerson || ''}
												onChange={e =>
													setFormData({ ...formData, latePerson: e.target.value })
												}
												placeholder='Enter name'
												required
											/>
										</div>
									)}
								</div>
							)}

							<div className='flex justify-end'>
								<Button
									type='submit'
									className='rounded-full'
									size='lg'
									disabled={loading || logoutLoading}
								>
									{loading ? (
										<>
											<Loader2 className='h-4 w-4 animate-spin' />
											Saving…
										</>
									) : (
										<>
											<CheckCircle2 className='h-4 w-4' />
											Add entry
										</>
									)}
								</Button>
							</div>
						</fieldset>
					</form>
				</Card>

				<TimeEntriesList
					filteredEntries={filteredEntries}
					loading={loading}
					error={error}
					selectedMonth={selectedMonth}
					selectedYear={selectedYear}
					setSelectedMonth={setSelectedMonth}
					setSelectedYear={setSelectedYear}
					currentPage={currentPage}
					setCurrentPage={setCurrentPage}
					totalPages={totalPages}
					months={months}
					logoutLoading={logoutLoading}
					formatTime={formatTime}
					onEditEntry={handleEditEntry}
					onDelete={handleDelete}
				/>
			</div>

			<EditTimeEntryModal
				isOpen={isEditModalOpen}
				onClose={handleModalClose}
				entry={editingEntry}
				onUpdate={handleEntryUpdate}
			/>
		</main>
	)
}
