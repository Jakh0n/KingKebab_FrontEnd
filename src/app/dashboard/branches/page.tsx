'use client'

import { ModeToggle } from '@/components/ui/mode-toggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getActiveBranches } from '@/lib/api'
import { getTokenOrNull } from '@/lib/auth'
import { Branch } from '@/types'
import { ArrowLeft, Building2, MapPin, Navigation, Phone } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useEffect, useState } from 'react'
import { toast } from 'sonner'

const BranchMap = dynamic(() => import('@/components/branches/BranchMap'), {
	ssr: false,
	loading: () => (
		<div className='flex h-[100dvh] items-center justify-center bg-card'>
			<div className='h-8 w-8 animate-spin rounded-full border-b-2 border-primary' />
		</div>
	),
})

function hasValidCoordinates(branch: Branch): branch is Branch & {
	location: Branch['location'] & {
		coordinates: { latitude: number; longitude: number }
	}
} {
	const coordinates = branch.location.coordinates
	return (
		typeof coordinates?.latitude === 'number' &&
		typeof coordinates.longitude === 'number'
	)
}

function getDirectionsUrl(branch: Branch): string | null {
	if (!hasValidCoordinates(branch)) return null

	return `https://www.google.com/maps/dir/?api=1&destination=${branch.location.coordinates.latitude},${branch.location.coordinates.longitude}`
}

function isVisibleLocationPart(value?: string): value is string {
	const trimmedValue = value?.trim()
	return Boolean(trimmedValue && trimmedValue !== '-' && trimmedValue !== '—')
}

function formatBranchAddress(branch: Branch): string {
	return [
		branch.location.address,
		branch.location.city,
		branch.location.district,
	]
		.filter(isVisibleLocationPart)
		.join(', ')
}

export default function DashboardBranchesPage() {
	const router = useRouter()
	const [branches, setBranches] = useState<Branch[]>([])
	const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const mappedBranches = useMemo(
		() => branches.filter(hasValidCoordinates),
		[branches]
	)
	const selectedBranch =
		mappedBranches.find(branch => branch._id === selectedBranchId) ??
		mappedBranches[0]
	const selectedDirectionsUrl = selectedBranch
		? getDirectionsUrl(selectedBranch)
		: null

	useEffect(() => {
		if (!getTokenOrNull()) {
			router.push('/login')
			return
		}

		getActiveBranches()
			.then(setBranches)
			.catch(error => {
				toast.error(
					error instanceof Error ? error.message : 'Failed to load branches'
				)
			})
			.finally(() => setLoading(false))
	}, [router])

	return (
		<main className='relative h-[100dvh] overflow-hidden bg-background text-foreground'>
			{loading ? (
				<Card className='flex h-[100dvh] items-center justify-center rounded-none border-0'>
					<div className='h-8 w-8 animate-spin rounded-full border-b-2 border-primary' />
				</Card>
			) : (
				<BranchMap
					branches={branches}
					selectedBranchId={selectedBranchId}
					onBranchSelect={setSelectedBranchId}
					heightClassName='h-[100dvh]'
					containerClassName='h-[100dvh] overflow-hidden border-0 bg-card shadow-none'
				/>
			)}

			<div className='pointer-events-none absolute inset-x-0 top-0 z-[1000] bg-gradient-to-b from-background/95 via-background/70 to-transparent px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6'>
				<header className='pointer-events-auto mx-auto flex max-w-7xl items-center justify-between gap-3'>
					<Button asChild variant='secondary' className='rounded-full shadow-lg backdrop-blur'>
						<Link href='/dashboard'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back
						</Link>
					</Button>
					<ModeToggle compact />
				</header>

				<section className='pointer-events-auto mx-auto mt-4 max-w-7xl'>
					<div className='inline-flex items-center gap-3 rounded-3xl border border-border/70 bg-background/90 p-3 pr-4 shadow-xl backdrop-blur-xl'>
						<span className='rounded-2xl bg-primary/10 p-3'>
							<MapPin className='h-5 w-5 text-primary' />
						</span>
						<div className='min-w-0'>
							<h1 className='text-lg font-semibold tracking-tight'>Branch Map</h1>
							<p className='text-xs text-muted-foreground'>
								{mappedBranches.length} location{mappedBranches.length === 1 ? '' : 's'} nearby
							</p>
						</div>
					</div>
				</section>
			</div>

			{!loading && mappedBranches.length > 0 && (
				<section className='absolute inset-x-0 bottom-0 z-[1000] bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-12 sm:px-6'>
					<div className='mx-auto max-w-7xl space-y-3'>
						{selectedBranch && (
							<Card className='rounded-3xl border-border/80 bg-background/95 p-4 shadow-2xl backdrop-blur-xl'>
								<div className='flex items-start justify-between gap-3'>
									<div className='min-w-0'>
										<div className='flex items-center gap-2'>
											<span className='rounded-xl bg-primary/10 p-2'>
												<Building2 className='h-4 w-4 text-primary' />
											</span>
											<div className='min-w-0'>
												<h2 className='truncate text-base font-semibold'>
													{selectedBranch.name}
												</h2>
												<p className='text-xs text-muted-foreground'>
													{selectedBranch.code}
												</p>
											</div>
										</div>
										{formatBranchAddress(selectedBranch) && (
											<p className='mt-3 line-clamp-2 text-sm text-muted-foreground'>
												{formatBranchAddress(selectedBranch)}
											</p>
										)}
									</div>
									<div className='flex shrink-0 flex-col gap-2'>
										{selectedBranch.contact?.phone && (
											<Button asChild size='icon' variant='secondary' className='rounded-full'>
												<a href={`tel:${selectedBranch.contact.phone}`} aria-label='Call branch'>
													<Phone className='h-4 w-4' />
												</a>
											</Button>
										)}
										{selectedDirectionsUrl && (
											<Button asChild size='icon' className='rounded-full'>
												<a
													href={selectedDirectionsUrl}
													target='_blank'
													rel='noreferrer'
													aria-label='Get directions'
												>
													<Navigation className='h-4 w-4' />
												</a>
											</Button>
										)}
									</div>
								</div>
							</Card>
						)}

						<div className='custom-scrollbar flex gap-2 overflow-x-auto pb-1'>
							{mappedBranches.map(branch => {
								const isSelected = branch._id === selectedBranch?._id

								return (
									<button
										key={branch._id}
										type='button'
										onClick={() => setSelectedBranchId(branch._id)}
										className={`min-w-[170px] rounded-2xl border px-3 py-2 text-left shadow-lg backdrop-blur transition ${
											isSelected
												? 'border-primary bg-primary text-primary-foreground'
												: 'border-border/80 bg-background/90 text-foreground'
										}`}
									>
										<p className='truncate text-sm font-semibold'>{branch.name}</p>
										<p
											className={`truncate text-xs ${
												isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
											}`}
										>
											{formatBranchAddress(branch)}
										</p>
									</button>
								)
							})}
						</div>
					</div>
				</section>
			)}

			{!loading && branches.length > 0 && mappedBranches.length === 0 && (
				<div className='absolute inset-x-4 bottom-6 z-[1000] rounded-3xl border border-border bg-background/95 p-4 text-sm text-muted-foreground shadow-2xl backdrop-blur-xl'>
					Branch coordinates are missing. Please ask an admin to add branch pins.
				</div>
			)}
		</main>
	)
}
