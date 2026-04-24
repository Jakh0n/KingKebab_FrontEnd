'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TimeEntry } from '@/types'
import {
	AlertTriangle,
	Clock,
	Inbox,
	Pencil,
	Trash2,
	User,
} from 'lucide-react'
import { MonthYearFilter, MonthYearPagination } from './MonthYearFilter'

interface MonthOption {
	value: number
	label: string
}

interface TimeEntriesListProps {
	filteredEntries: TimeEntry[]
	loading: boolean
	error: string
	selectedMonth: number
	selectedYear: number
	setSelectedMonth: (v: number) => void
	setSelectedYear: (v: number) => void
	currentPage: number
	setCurrentPage: (v: number | ((prev: number) => number)) => void
	totalPages: number
	months: readonly MonthOption[]
	logoutLoading: boolean
	formatTime: (timeStr: string) => string
	onEditEntry: (entry: TimeEntry) => void
	onDelete: (entryId: string) => void
}

const EDIT_WINDOW_DAYS = 2

function daysSince(dateIso: string): number {
	const diff = Math.abs(Date.now() - new Date(dateIso).getTime())
	return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatEntryDate(dateIso: string): string {
	return new Date(dateIso).toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	})
}

export function TimeEntriesList({
	filteredEntries,
	loading,
	error,
	selectedMonth,
	selectedYear,
	setSelectedMonth,
	setSelectedYear,
	currentPage,
	setCurrentPage,
	totalPages,
	months,
	logoutLoading,
	formatTime,
	onEditEntry,
	onDelete,
}: TimeEntriesListProps) {
	return (
		<Card className='gap-0 rounded-2xl p-4 shadow-card sm:p-6'>
			<MonthYearFilter
				selectedMonth={selectedMonth}
				selectedYear={selectedYear}
				setSelectedMonth={setSelectedMonth}
				setSelectedYear={setSelectedYear}
				setCurrentPage={setCurrentPage}
				months={months}
				loading={loading}
				logoutLoading={logoutLoading}
			/>

			<div className='mb-4 max-h-[480px] overflow-y-auto apple-scrollbar'>
				{loading ? (
					<EmptyState label='Loading…' />
				) : error ? (
					<EmptyState label={error} tone='destructive' />
				) : filteredEntries.length === 0 ? (
					<EmptyState
						label='No time entries for this month'
						icon={<Inbox className='h-10 w-10 text-muted-foreground/60' />}
					/>
				) : (
					<ul className='divide-y'>
						{filteredEntries.map(entry => {
							const isOvertime = entry.hours > 12
							const canEdit = daysSince(entry.date) <= EDIT_WINDOW_DAYS

							return (
								<li key={entry._id} className='py-4 first:pt-0 last:pb-0'>
									<article className='flex flex-col gap-3'>
										<header className='flex items-start justify-between gap-3'>
											<div>
												<p className='text-sm font-semibold'>
													{formatEntryDate(entry.date)}
												</p>
												<p className='mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground'>
													<Clock className='h-3.5 w-3.5' />
													{formatTime(entry.startTime)} –{' '}
													{formatTime(entry.endTime)}
												</p>
											</div>

											<div className='flex items-center gap-2'>
												<StatusPill overtime={isOvertime} />
												<Button
													variant='ghost'
													size='icon'
													onClick={() => onEditEntry(entry)}
													disabled={logoutLoading || !canEdit}
													aria-label='Edit entry'
													className={cn(
														'h-8 w-8 rounded-full',
														!canEdit && 'cursor-not-allowed opacity-40'
													)}
												>
													<Pencil className='h-4 w-4' />
												</Button>
												<Button
													variant='ghost'
													size='icon'
													onClick={() => onDelete(entry._id)}
													disabled={logoutLoading}
													aria-label='Delete entry'
													className='h-8 w-8 rounded-full text-destructive hover:text-destructive'
												>
													<Trash2 className='h-4 w-4' />
												</Button>
											</div>
										</header>

										<div className='flex items-baseline justify-between rounded-xl bg-muted/60 px-3 py-2.5'>
											<span className='text-xs uppercase tracking-wide text-muted-foreground'>
												Hours
											</span>
											<span className='text-lg font-semibold tracking-tight'>
												{entry.hours.toFixed(1)}h
											</span>
										</div>

										{isOvertime && entry.overtimeReason && (
											<div className='space-y-2 rounded-xl border border-warning/30 bg-warning/5 p-3'>
												<InfoRow
													icon={<AlertTriangle className='h-4 w-4 text-warning' />}
													label='Overtime reason'
													value={entry.overtimeReason}
												/>
												{entry.overtimeReason === 'Company Request' &&
													entry.responsiblePerson && (
														<InfoRow
															icon={<User className='h-4 w-4 text-primary' />}
															label='Responsible'
															value={entry.responsiblePerson}
														/>
													)}
											</div>
										)}
									</article>
								</li>
							)
						})}
					</ul>
				)}
			</div>

			<MonthYearPagination
				currentPage={currentPage}
				setCurrentPage={setCurrentPage}
				totalPages={totalPages}
				logoutLoading={logoutLoading}
			/>
		</Card>
	)
}

function StatusPill({ overtime }: { overtime: boolean }) {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
				overtime
					? 'bg-warning/10 text-warning'
					: 'bg-success/10 text-success'
			)}
		>
			{overtime ? 'Overtime' : 'Regular'}
		</span>
	)
}

interface InfoRowProps {
	icon: React.ReactNode
	label: string
	value: string
}

function InfoRow({ icon, label, value }: InfoRowProps) {
	return (
		<div className='flex items-center gap-2 text-sm'>
			{icon}
			<span className='text-muted-foreground'>{label}:</span>
			<span className='font-medium'>{value}</span>
		</div>
	)
}

interface EmptyStateProps {
	label: string
	icon?: React.ReactNode
	tone?: 'default' | 'destructive'
}

function EmptyState({ label, icon, tone = 'default' }: EmptyStateProps) {
	return (
		<div className='flex flex-col items-center justify-center gap-3 py-10 text-center'>
			{icon}
			<p
				className={cn(
					'text-sm',
					tone === 'destructive' ? 'text-destructive' : 'text-muted-foreground'
				)}
			>
				{label}
			</p>
		</div>
	)
}
