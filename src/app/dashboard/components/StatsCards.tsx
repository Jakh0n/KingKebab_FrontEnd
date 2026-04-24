'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle2, Timer, type LucideIcon } from 'lucide-react'
import type { DashboardStats } from '../hooks/useDashboardStats'

type Tone = 'primary' | 'success' | 'warning'

interface StatItem {
	label: string
	value: string
	icon: LucideIcon
	tone: Tone
}

const TONE_STYLES: Record<Tone, { tile: string; icon: string }> = {
	primary: {
		tile: 'bg-primary/10',
		icon: 'text-primary',
	},
	success: {
		tile: 'bg-success/10',
		icon: 'text-success',
	},
	warning: {
		tile: 'bg-warning/10',
		icon: 'text-warning',
	},
}

interface StatsCardsProps {
	stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
	const items: StatItem[] = [
		{
			label: 'Total hours',
			value: `${stats.totalHours.toFixed(1)}h`,
			icon: Timer,
			tone: 'primary',
		},
		{
			label: 'Regular days',
			value: `${stats.regularDays}d`,
			icon: CheckCircle2,
			tone: 'success',
		},
		{
			label: 'Overtime days',
			value: `${stats.overtimeDays}d`,
			icon: AlertTriangle,
			tone: 'warning',
		},
	]

	return (
		<section className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
			{items.map(item => (
				<StatCard key={item.label} item={item} />
			))}
		</section>
	)
}

function StatCard({ item }: { item: StatItem }) {
	const { tile, icon } = TONE_STYLES[item.tone]
	const Icon = item.icon

	return (
		<Card className='flex flex-row items-center gap-4 rounded-2xl p-4 shadow-card'>
			<div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', tile)}>
				<Icon className={cn('h-5 w-5', icon)} />
			</div>
			<div className='min-w-0'>
				<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
					{item.label}
				</p>
				<p className='text-2xl font-semibold tracking-tight'>{item.value}</p>
			</div>
		</Card>
	)
}
