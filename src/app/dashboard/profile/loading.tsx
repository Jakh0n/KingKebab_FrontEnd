import { Skeleton } from '@/components/ui/skeleton'

export default function ProfileLoading() {
	return (
		<div className='min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-4 sm:p-8'>
			<div className='max-w-5xl mx-auto space-y-8'>
				{/* Header Section */}
				<div className='flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-900/50 backdrop-blur-lg border border-slate-800/50'>
					<Skeleton className='w-32 h-32 rounded-full' />
					<div className='flex-1 space-y-4'>
						<Skeleton className='h-8 w-48' />
						<Skeleton className='h-4 w-32' />
						<Skeleton className='h-4 w-64' />
					</div>
				</div>

				{/* Stats Grid */}
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
					{[...Array(4)].map((_, i) => (
						<div
							key={i}
							className='p-6 rounded-2xl bg-slate-900/50 backdrop-blur-lg border border-slate-800/50'
						>
							<Skeleton className='h-6 w-24 mb-2' />
							<Skeleton className='h-8 w-16' />
						</div>
					))}
				</div>

				{/* Profile Details */}
				<div className='space-y-6'>
					{/* Personal Info */}
					<div className='p-6 rounded-2xl bg-slate-900/50 backdrop-blur-lg border border-slate-800/50 space-y-4'>
						<Skeleton className='h-6 w-32 mb-4' />
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							{[...Array(4)].map((_, i) => (
								<Skeleton key={i} className='h-12' />
							))}
						</div>
					</div>

					{/* Skills */}
					<div className='p-6 rounded-2xl bg-slate-900/50 backdrop-blur-lg border border-slate-800/50'>
						<Skeleton className='h-6 w-24 mb-4' />
						<div className='flex flex-wrap gap-2'>
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className='h-8 w-20 rounded-full' />
							))}
						</div>
					</div>

					{/* Emergency Contact */}
					<div className='p-6 rounded-2xl bg-slate-900/50 backdrop-blur-lg border border-slate-800/50'>
						<Skeleton className='h-6 w-40 mb-4' />
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							{[...Array(3)].map((_, i) => (
								<Skeleton key={i} className='h-12' />
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
