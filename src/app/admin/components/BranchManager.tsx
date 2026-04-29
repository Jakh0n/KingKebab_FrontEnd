'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
	createBranch,
	deleteBranch,
	getAllBranches,
	updateBranch,
} from '@/lib/api'
import { Branch, BranchFormData } from '@/types'
import {
	Building2,
	Clock,
	Edit,
	List,
	Map,
	MapPin,
	MoreHorizontal,
	Phone,
	Plus,
	Search,
	Trash2,
	Users,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import BranchModal from './BranchModal'

const BranchMap = dynamic(() => import('./BranchMap'), {
	ssr: false,
	loading: () => (
		<div className='flex h-[520px] items-center justify-center rounded-2xl border border-border bg-[#1A1F2E]'>
			<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#4E7BEE]' />
		</div>
	),
})

export default function BranchManager() {
	const [branches, setBranches] = useState<Branch[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards')
	const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
	const [isEditing, setIsEditing] = useState(false)

	const loadBranches = useCallback(async () => {
		try {
			setLoading(true)
			const data = await getAllBranches()
			setBranches(data)
		} catch (error) {
			console.error('Error loading branches:', error)
			toast.error('Failed to load branches')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadBranches()
	}, [loadBranches])

	const handleAddBranch = async (branchData: BranchFormData) => {
		try {
			await createBranch(branchData)
			toast.success('Branch created successfully')
			setIsModalOpen(false)
			loadBranches()
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to create branch'
			toast.error(errorMessage)
		}
	}

	const handleEditBranch = async (branchData: BranchFormData) => {
		if (!editingBranch) return

		try {
			await updateBranch(editingBranch._id, branchData)
			toast.success('Branch updated successfully')
			setIsModalOpen(false)
			setEditingBranch(null)
			setIsEditing(false)
			loadBranches()
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to update branch'
			toast.error(errorMessage)
		}
	}

	const handleDeleteBranch = async (branchId: string) => {
		if (!confirm('Are you sure you want to deactivate this branch?')) return

		try {
			await deleteBranch(branchId)
			toast.success('Branch deactivated successfully')
			loadBranches()
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to deactivate branch'
			toast.error(errorMessage)
		}
	}

	const openAddModal = () => {
		setEditingBranch(null)
		setIsEditing(false)
		setIsModalOpen(true)
	}

	const openEditModal = (branch: Branch) => {
		setSelectedBranchId(branch._id)
		setEditingBranch(branch)
		setIsEditing(true)
		setIsModalOpen(true)
	}

	const closeModal = () => {
		setIsModalOpen(false)
		setEditingBranch(null)
		setIsEditing(false)
	}

	const filteredBranches = branches.filter(
		branch =>
			branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			branch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
			branch.location.city.toLowerCase().includes(searchQuery.toLowerCase())
	)
	const branchesWithCoordinates = filteredBranches.filter(
		branch =>
			typeof branch.location.coordinates?.latitude === 'number' &&
			typeof branch.location.coordinates.longitude === 'number'
	)
	const branchesMissingCoordinates = filteredBranches.filter(
		branch =>
			typeof branch.location.coordinates?.latitude !== 'number' ||
			typeof branch.location.coordinates.longitude !== 'number'
	)

	const formatOperatingHours = (branch: Branch) => {
		const days = [
			'monday',
			'tuesday',
			'wednesday',
			'thursday',
			'friday',
			'saturday',
			'sunday',
		]
		const openDays = days.filter(
			day =>
				branch.operatingHours[day as keyof typeof branch.operatingHours]?.isOpen
		)

		if (openDays.length === 7) {
			const firstDay = branch.operatingHours.monday
			// Check if all days have same hours
			const allSameHours = days.every(day => {
				const daySchedule =
					branch.operatingHours[day as keyof typeof branch.operatingHours]
				return (
					daySchedule?.isOpen &&
					daySchedule.open === firstDay.open &&
					daySchedule.close === firstDay.close
				)
			})

			if (allSameHours) {
				return `Daily ${firstDay.open}-${firstDay.close}`
			}
		}

		if (openDays.length === 0) return 'Closed'
		if (openDays.length === 7) return 'Open daily'
		return `Open ${openDays.length} days`
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
				<div>
					<h2 className='text-2xl font-bold text-white'>Branch Management</h2>
					<p className='text-gray-400'>
						Manage your restaurant branches and locations
					</p>
				</div>
				<Button
					onClick={openAddModal}
					className='bg-[#4E7BEE] hover:bg-[#4E7BEE]/90'
				>
					<Plus className='h-4 w-4 mr-2' />
					Add Branch
				</Button>
			</div>

			{/* Search and view switch */}
			<div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
				<div className='relative max-w-md flex-1'>
					<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
					<Input
						placeholder='Search branches...'
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						className='pl-10 bg-[#1A1F2E] border-none text-white'
					/>
				</div>
				<div className='flex rounded-full bg-[#1A1F2E] p-1'>
					<Button
						type='button'
						size='sm'
						variant={viewMode === 'cards' ? 'default' : 'ghost'}
						className='rounded-full'
						onClick={() => setViewMode('cards')}
					>
						<List className='mr-2 h-4 w-4' />
						Cards
					</Button>
					<Button
						type='button'
						size='sm'
						variant={viewMode === 'map' ? 'default' : 'ghost'}
						className='rounded-full'
						onClick={() => setViewMode('map')}
					>
						<Map className='mr-2 h-4 w-4' />
						Map
					</Button>
				</div>
			</div>

			{/* Loading */}
			{loading && (
				<div className='flex justify-center items-center py-8'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#4E7BEE]'></div>
				</div>
			)}

			{/* Branches Grid */}
			{!loading && viewMode === 'cards' && (
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
					{filteredBranches.map(branch => (
						<Card key={branch._id} className='bg-[#1A1F2E] border-none p-6'>
							<div className='flex justify-between items-start mb-4'>
								<div>
									<h3 className='text-lg font-semibold text-white flex items-center gap-2'>
										<Building2 className='h-5 w-5 text-[#4E7BEE]' />
										{branch.name}
									</h3>
									<p className='text-sm text-gray-400 font-mono'>
										{branch.code}
									</p>
								</div>
								<div className='flex items-center gap-2'>
									<div
										className={`h-3 w-3 rounded-full ${
											branch.isActive ? 'bg-green-500' : 'bg-red-500'
										}`}
									/>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
												<MoreHorizontal className='h-4 w-4' />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											align='end'
											className='bg-[#0E1422] text-white border-none'
										>
											<DropdownMenuItem
												onClick={() => openEditModal(branch)}
												className='hover:bg-[#1A1F2E]'
											>
												<Edit className='h-4 w-4 mr-2' />
												Edit
											</DropdownMenuItem>
											<DropdownMenuSeparator className='bg-gray-700' />
											<DropdownMenuItem
												onClick={() => handleDeleteBranch(branch._id)}
												className='hover:bg-red-600 text-red-400 hover:text-white'
											>
												<Trash2 className='h-4 w-4 mr-2' />
												Deactivate
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>

							<div className='space-y-3 text-sm'>
								{/* Location */}
								<div className='flex items-start gap-2'>
									<MapPin className='h-4 w-4 text-gray-400 mt-0.5' />
									<div className='text-gray-300'>
										<p>{branch.location.address}</p>
										<p>
											{branch.location.city}
											{branch.location.district &&
												`, ${branch.location.district}`}
										</p>
									</div>
								</div>

								{/* Contact */}
								{branch.contact?.phone && (
									<div className='flex items-center gap-2'>
										<Phone className='h-4 w-4 text-gray-400' />
										<p className='text-gray-300'>{branch.contact.phone}</p>
									</div>
								)}

								{/* Capacity */}
								<div className='flex items-center gap-2'>
									<Users className='h-4 w-4 text-gray-400' />
									<p className='text-gray-300'>
										{branch.capacity.maxWorkers} workers,{' '}
										{branch.capacity.maxRiders} riders
									</p>
								</div>

								{/* Operating Hours */}
								<div className='flex items-center gap-2'>
									<Clock className='h-4 w-4 text-gray-400' />
									<p className='text-gray-300'>
										{formatOperatingHours(branch)}
									</p>
								</div>

								{/* Skills Required */}
								{branch.requirements.skillsRequired.length > 0 && (
									<div className='pt-2'>
										<p className='text-xs text-gray-400 mb-1'>
											Required Skills:
										</p>
										<div className='flex flex-wrap gap-1'>
											{branch.requirements.skillsRequired.map(skill => (
												<span
													key={skill}
													className='px-2 py-1 bg-[#4E7BEE]/20 text-[#4E7BEE] rounded text-xs'
												>
													{skill}
												</span>
											))}
										</div>
									</div>
								)}
							</div>

							{/* Notes */}
							{branch.notes && (
								<div className='mt-4 pt-3 border-t border-gray-700'>
									<p className='text-xs text-gray-400 line-clamp-2'>
										{branch.notes}
									</p>
								</div>
							)}
						</Card>
					))}
				</div>
			)}

			{!loading && viewMode === 'map' && (
				<div className='grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]'>
					<Card className='bg-[#1A1F2E] border-none p-4'>
						<div className='mb-4'>
							<h3 className='text-lg font-semibold text-white'>Map Branches</h3>
							<p className='text-sm text-gray-400'>
								{branchesWithCoordinates.length} mapped,{' '}
								{branchesMissingCoordinates.length} missing coordinates
							</p>
						</div>
						<div className='custom-scrollbar apple-scrollbar max-h-[444px] space-y-3 overflow-y-auto pr-1'>
							{filteredBranches.map(branch => {
								const hasCoordinates =
									typeof branch.location.coordinates?.latitude === 'number' &&
									typeof branch.location.coordinates.longitude === 'number'
								const isSelected = selectedBranchId === branch._id

								return (
									<div
										key={branch._id}
										onClick={() => setSelectedBranchId(branch._id)}
										className={`w-full cursor-pointer rounded-xl border p-3 text-left transition ${
											isSelected
												? 'border-[#4E7BEE] bg-[#4E7BEE]/10'
												: 'border-gray-700 bg-[#0E1422] hover:border-[#4E7BEE]/60'
										}`}
									>
										<div className='flex items-start justify-between gap-3'>
											<div>
												<p className='font-semibold text-white'>{branch.name}</p>
												<p className='text-xs font-mono text-gray-400'>
													{branch.code}
												</p>
											</div>
											<span
												className={`rounded-full px-2 py-1 text-xs ${
													hasCoordinates
														? 'bg-green-500/10 text-green-400'
														: 'bg-yellow-500/10 text-yellow-400'
												}`}
											>
												{hasCoordinates ? 'Mapped' : 'No pin'}
											</span>
										</div>
										<p className='mt-2 line-clamp-2 text-sm text-gray-400'>
											{branch.location.address}, {branch.location.city}
										</p>
										{!hasCoordinates && (
											<Button
												type='button'
												size='sm'
												variant='outline'
												className='mt-3 bg-transparent text-white hover:bg-[#1A1F2E] hover:text-white'
												onClick={event => {
													event.stopPropagation()
													openEditModal(branch)
												}}
											>
												Add Coordinates
											</Button>
										)}
									</div>
								)
							})}
						</div>
					</Card>
					<BranchMap
						branches={filteredBranches}
						selectedBranchId={selectedBranchId}
						onBranchSelect={setSelectedBranchId}
						onEditBranch={openEditModal}
					/>
				</div>
			)}

			{/* Empty State */}
			{!loading && viewMode === 'cards' && filteredBranches.length === 0 && (
				<div className='text-center py-12'>
					<Building2 className='h-12 w-12 text-gray-600 mx-auto mb-4' />
					<h3 className='text-lg font-semibold text-white mb-2'>
						{searchQuery ? 'No branches found' : 'No branches yet'}
					</h3>
					<p className='text-gray-400 mb-4'>
						{searchQuery
							? 'Try adjusting your search terms'
							: 'Create your first branch to get started'}
					</p>
					{!searchQuery && (
						<Button
							onClick={openAddModal}
							className='bg-[#4E7BEE] hover:bg-[#4E7BEE]/90'
						>
							<Plus className='h-4 w-4 mr-2' />
							Add First Branch
						</Button>
					)}
				</div>
			)}

			{/* Modal */}
			<BranchModal
				isOpen={isModalOpen}
				onClose={closeModal}
				onSave={isEditing ? handleEditBranch : handleAddBranch}
				branch={editingBranch}
				isEditing={isEditing}
			/>
		</div>
	)
}
