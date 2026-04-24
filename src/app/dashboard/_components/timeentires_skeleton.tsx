import { Skeleton } from '@/components/ui/skeleton'

const TimeEntriesSkeleton = () => {
	return (
		<div>
			<div className='h-[400px] overflow-y-auto custom-scrollbar pr-2 mb-4'>
				<div className='space-y-4'>
					{[...Array(3)].map((_, index) => (
						<div
							key={index}
							className='bg-gradient-to-r from-[#1A1F2E] to-[#1A1F2E] border-l-4 border-l-[#2A3447] rounded-lg'
						>
							<div className='p-5'>
								{/* Header section */}
								<div className='flex items-center justify-between mb-4'>
									<div className='flex items-center gap-3'>
										<Skeleton className='w-11 h-11 rounded-lg bg-[#2A3447]' />
										<div className='space-y-2'>
											<Skeleton className='h-3 w-12 bg-[#2A3447]' />
											<Skeleton className='h-4 w-20 bg-[#2A3447]' />
										</div>
									</div>
									<div className='flex items-center gap-3'>
										<Skeleton className='h-7 w-16 rounded-full bg-[#2A3447]' />
										<div className='flex gap-1'>
											<Skeleton className='h-8 w-8 rounded bg-[#2A3447]' />
											<Skeleton className='h-8 w-8 rounded bg-[#2A3447]' />
										</div>
									</div>
								</div>

								{/* Main content */}
								<div className='space-y-4'>
									{/* Working hours section */}
									<div className='flex items-center gap-4 bg-[#0E1422] p-4 rounded-lg'>
										<Skeleton className='w-11 h-11 rounded-lg bg-[#2A3447]' />
										<div className='flex-1 space-y-2'>
											<Skeleton className='h-3 w-24 bg-[#2A3447]' />
											<div className='flex items-center justify-between'>
												<Skeleton className='h-4 w-32 bg-[#2A3447]' />
												<Skeleton className='h-4 w-16 bg-[#2A3447]' />
											</div>
										</div>
									</div>

									{/* Overtime section (appears on alternating entries) */}
									{index % 2 === 0 && (
										<div className='relative'>
											<div className='absolute left-4 top-0 bottom-0 w-0.5 bg-[#2A3447]/30'></div>
											<div className='space-y-4 pl-8'>
												{/* Overtime reason */}
												<div className='flex items-center gap-3'>
													<Skeleton className='w-11 h-11 rounded-lg bg-[#2A3447]' />
													<div className='space-y-2'>
														<Skeleton className='h-3 w-28 bg-[#2A3447]' />
														<Skeleton className='h-4 w-36 bg-[#2A3447]' />
													</div>
												</div>

												{/* Responsible person */}
												<div className='flex items-center gap-3'>
													<Skeleton className='w-11 h-11 rounded-lg bg-[#2A3447]' />
													<div className='space-y-2'>
														<Skeleton className='h-3 w-32 bg-[#2A3447]' />
														<Skeleton className='h-4 w-28 bg-[#2A3447]' />
													</div>
												</div>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Pagination skeleton */}
			<div className='flex items-center justify-center gap-2'>
				<Skeleton className='h-8 w-20 bg-[#1A1F2E]' />
				<Skeleton className='h-4 w-24 bg-[#2A3447]' />
				<Skeleton className='h-8 w-16 bg-[#1A1F2E]' />
			</div>
		</div>
	)
}

export default TimeEntriesSkeleton
