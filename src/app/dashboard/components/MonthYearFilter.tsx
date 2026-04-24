'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthOption {
	value: number
	label: string
}

interface MonthYearFilterProps {
	selectedMonth: number
	selectedYear: number
	setSelectedMonth: (v: number) => void
	setSelectedYear: (v: number) => void
	setCurrentPage: (v: number | ((prev: number) => number)) => void
	months: readonly MonthOption[]
	loading: boolean
	logoutLoading: boolean
}

const YEARS = [2025, 2026] as const

export function MonthYearFilter({
	selectedMonth,
	selectedYear,
	setSelectedMonth,
	setSelectedYear,
	setCurrentPage,
	months,
	logoutLoading,
}: MonthYearFilterProps) {
	return (
		<div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
			<h2 className='flex items-center gap-2 text-base font-semibold sm:text-lg'>
				<CalendarDays className='h-5 w-5 text-primary' />
				Time entries
			</h2>

			<div className='flex flex-col items-stretch gap-2 sm:flex-row sm:items-center'>
				<div className='flex items-center gap-2'>
					<Label className='min-w-[48px] text-xs font-medium text-muted-foreground'>
						Month
					</Label>
					<Select
						value={String(selectedMonth)}
						onValueChange={value => {
							setSelectedMonth(parseInt(value, 10))
							setCurrentPage(1)
						}}
						disabled={logoutLoading}
					>
						<SelectTrigger className='h-9 w-full rounded-full sm:w-[160px]'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{months.map(month => (
								<SelectItem key={month.value} value={String(month.value)}>
									{month.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className='flex items-center gap-2'>
					<Label className='min-w-[48px] text-xs font-medium text-muted-foreground'>
						Year
					</Label>
					<Select
						value={String(selectedYear)}
						onValueChange={value => {
							setSelectedYear(parseInt(value, 10))
							setCurrentPage(1)
						}}
						disabled={logoutLoading}
					>
						<SelectTrigger className='h-9 w-full rounded-full sm:w-[120px]'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{YEARS.map(year => (
								<SelectItem key={year} value={String(year)}>
									{year}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	)
}

interface MonthYearPaginationProps {
	currentPage: number
	setCurrentPage: (v: number | ((prev: number) => number)) => void
	totalPages: number
	logoutLoading: boolean
}

export function MonthYearPagination({
	currentPage,
	setCurrentPage,
	totalPages,
	logoutLoading,
}: MonthYearPaginationProps) {
	if (totalPages <= 1) return null

	return (
		<div className='flex items-center justify-center gap-2'>
			<Button
				variant='outline'
				size='sm'
				className='rounded-full'
				onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
				disabled={currentPage === 1 || logoutLoading}
				aria-label='Previous page'
			>
				<ChevronLeft className='h-4 w-4' />
				Previous
			</Button>
			<span className='min-w-[96px] text-center text-sm text-muted-foreground'>
				Page {currentPage} of {totalPages}
			</span>
			<Button
				variant='outline'
				size='sm'
				className='rounded-full'
				onClick={() => setCurrentPage(prev => prev + 1)}
				disabled={currentPage >= totalPages || logoutLoading}
				aria-label='Next page'
			>
				Next
				<ChevronRight className='h-4 w-4' />
			</Button>
		</div>
	)
}
