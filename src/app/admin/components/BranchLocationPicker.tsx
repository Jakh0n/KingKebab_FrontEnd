'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

interface Coordinates {
	latitude: number
	longitude: number
}

interface BranchLocationPickerProps {
	value?: Coordinates
	onChange: (coordinates: Coordinates) => void
}

const BranchLocationPickerMap = dynamic(
	() => import('./BranchLocationPickerMap'),
	{
		ssr: false,
		loading: () => <Skeleton className='h-full w-full rounded-xl' />,
	}
)

export default function BranchLocationPicker({
	value,
	onChange,
}: BranchLocationPickerProps) {
	return (
		<div className='h-72 overflow-hidden rounded-xl border border-border bg-muted'>
			<BranchLocationPickerMap value={value} onChange={onChange} />
		</div>
	)
}
