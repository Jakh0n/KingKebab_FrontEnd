'use client'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Branch, BranchFormData } from '@/types'
import { Loader2, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import BranchLocationPicker from './BranchLocationPicker'

interface BranchModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (branchData: BranchFormData) => void
	branch?: Branch | null
	isEditing?: boolean
}

interface NominatimResult {
	lat: string
	lon: string
	display_name: string
	address?: {
		city?: string
		town?: string
		village?: string
		suburb?: string
		state?: string
		county?: string
	}
}

const DEFAULT_OPERATING_HOURS = {
	monday: { isOpen: true, open: '08:00', close: '22:00' },
	tuesday: { isOpen: true, open: '08:00', close: '22:00' },
	wednesday: { isOpen: true, open: '08:00', close: '22:00' },
	thursday: { isOpen: true, open: '08:00', close: '22:00' },
	friday: { isOpen: true, open: '08:00', close: '22:00' },
	saturday: { isOpen: true, open: '08:00', close: '22:00' },
	sunday: { isOpen: true, open: '08:00', close: '22:00' },
}

const DEFAULT_CAPACITY = { maxWorkers: 5, maxRiders: 2 }
const DEFAULT_REQUIREMENTS = {
	minimumStaff: 2,
	skillsRequired: [] as BranchFormData['requirements'] extends infer R
		? R extends { skillsRequired: infer S }
			? S
			: never
		: never,
}

function generateBranchCode(name: string): string {
	const cleaned = name.toUpperCase().replace(/[^A-Z0-9]/g, '')
	const prefix = cleaned.slice(0, 6) || 'BR'
	const suffix = Math.floor(Math.random() * 10000)
		.toString()
		.padStart(4, '0')
	return `${prefix}${suffix}`.slice(0, 10)
}

function pickCity(result: NominatimResult): string {
	return (
		result.address?.city ||
		result.address?.town ||
		result.address?.village ||
		result.address?.suburb ||
		result.address?.county ||
		result.address?.state ||
		''
	)
}

export default function BranchModal({
	isOpen,
	onClose,
	onSave,
	branch,
	isEditing = false,
}: BranchModalProps) {
	const [name, setName] = useState('')
	const [address, setAddress] = useState('')
	const [latitude, setLatitude] = useState('')
	const [longitude, setLongitude] = useState('')
	const [city, setCity] = useState('')
	const [district, setDistrict] = useState('')
	const [code, setCode] = useState('')
	const [searching, setSearching] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		if (!isOpen) return

		if (isEditing && branch) {
			setName(branch.name)
			setAddress(branch.location.address || '')
			setLatitude(branch.location.coordinates?.latitude?.toString() || '')
			setLongitude(branch.location.coordinates?.longitude?.toString() || '')
			setCity(branch.location.city || '')
			setDistrict(branch.location.district || '')
			setCode(branch.code)
		} else {
			setName('')
			setAddress('')
			setLatitude('')
			setLongitude('')
			setCity('')
			setDistrict('')
			setCode('')
		}
		setError('')
	}, [isEditing, branch, isOpen])

	const selectedCoordinates =
		latitude.trim() && longitude.trim()
			? {
					latitude: Number(latitude),
					longitude: Number(longitude),
				}
			: undefined

	async function handleSearchAddress() {
		const query = address.trim()
		if (!query) {
			setError('Enter an address to search')
			return
		}

		try {
			setSearching(true)
			setError('')

			const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(
				query
			)}`
			const response = await fetch(url, {
				headers: { Accept: 'application/json' },
			})

			if (!response.ok) {
				throw new Error('Failed to search address')
			}

			const data = (await response.json()) as NominatimResult[]
			const result = data?.[0]
			if (!result) {
				setError('No location found for this address')
				return
			}

			setLatitude(Number(result.lat).toFixed(6))
			setLongitude(Number(result.lon).toFixed(6))
			setAddress(result.display_name)
			const detectedCity = pickCity(result)
			if (detectedCity) {
				setCity(detectedCity)
			}
			toast.success('Location found on the map')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to search address')
		} finally {
			setSearching(false)
		}
	}

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault()
		setError('')

		const trimmedName = name.trim()
		if (!trimmedName) {
			setError('Branch name is required')
			return
		}

		const hasLatitude = latitude.trim().length > 0
		const hasLongitude = longitude.trim().length > 0
		if (!hasLatitude || !hasLongitude) {
			setError('Pick the location on the map or search by address')
			return
		}

		const parsedLatitude = Number(latitude)
		const parsedLongitude = Number(longitude)
		if (
			Number.isNaN(parsedLatitude) ||
			Number.isNaN(parsedLongitude) ||
			parsedLatitude < -90 ||
			parsedLatitude > 90 ||
			parsedLongitude < -180 ||
			parsedLongitude > 180
		) {
			setError('Coordinates are invalid')
			return
		}

		const trimmedAddress = address.trim() || trimmedName
		const trimmedCity = city.trim() || trimmedAddress.split(',').pop()?.trim() || trimmedName
		const trimmedDistrict = district.trim()
		const finalCode = (
			code.trim() || (isEditing && branch?.code) || generateBranchCode(trimmedName)
		)
			.toUpperCase()
			.slice(0, 10)

		const payload: BranchFormData = {
			name: trimmedName,
			code: finalCode,
			location: {
				address: trimmedAddress,
				city: trimmedCity,
				district: trimmedDistrict,
				coordinates: {
					latitude: parsedLatitude,
					longitude: parsedLongitude,
				},
			},
			contact: { phone: '', email: '', manager: '' },
			operatingHours: DEFAULT_OPERATING_HOURS,
			capacity: DEFAULT_CAPACITY,
			requirements: DEFAULT_REQUIREMENTS,
			notes: '',
		}

		onSave(payload)
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='bg-[#0E1422] text-white border-none sm:max-w-[640px] max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='text-xl font-semibold text-white'>
						{isEditing ? 'Edit Branch' : 'New Branch'}
					</DialogTitle>
					<p className='text-sm text-gray-400'>
						Branch nomi va lokatsiyasini kiriting. Boshqa sozlamalar default holida saqlanadi.
					</p>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='mt-4 space-y-5'>
					<div className='space-y-2'>
						<Label htmlFor='name'>Branch Name *</Label>
						<Input
							id='name'
							value={name}
							onChange={event => setName(event.target.value)}
							className='bg-[#1A1F2E] border-none text-white'
							placeholder='e.g., King Kebab Konkuk'
							autoFocus
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='address'>Search by address (optional)</Label>
						<div className='flex gap-2'>
							<Input
								id='address'
								value={address}
								onChange={event => setAddress(event.target.value)}
								className='bg-[#1A1F2E] border-none text-white'
								placeholder='e.g., Konkuk Univ. Station, Seoul'
								onKeyDown={event => {
									if (event.key === 'Enter') {
										event.preventDefault()
										handleSearchAddress()
									}
								}}
							/>
							<Button
								type='button'
								onClick={handleSearchAddress}
								disabled={searching}
								className='bg-[#4E7BEE] hover:bg-[#4E7BEE]/90'
							>
								{searching ? (
									<Loader2 className='h-4 w-4 animate-spin' />
								) : (
									<Search className='h-4 w-4' />
								)}
							</Button>
						</div>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='latitude'>Latitude *</Label>
							<Input
								id='latitude'
								type='number'
								step='any'
								min='-90'
								max='90'
								value={latitude}
								onChange={event => setLatitude(event.target.value)}
								className='bg-[#1A1F2E] border-none text-white'
								placeholder='37.5665'
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='longitude'>Longitude *</Label>
							<Input
								id='longitude'
								type='number'
								step='any'
								min='-180'
								max='180'
								value={longitude}
								onChange={event => setLongitude(event.target.value)}
								className='bg-[#1A1F2E] border-none text-white'
								placeholder='126.9780'
							/>
						</div>
					</div>

					<div className='space-y-2'>
						<div className='flex items-center justify-between gap-3'>
							<Label>Pick location on map</Label>
							<p className='text-xs text-gray-400'>Click the map to set the pin</p>
						</div>
						<BranchLocationPicker
							value={
								selectedCoordinates &&
								!Number.isNaN(selectedCoordinates.latitude) &&
								!Number.isNaN(selectedCoordinates.longitude)
									? selectedCoordinates
									: undefined
							}
							onChange={coordinates => {
								setLatitude(coordinates.latitude.toFixed(6))
								setLongitude(coordinates.longitude.toFixed(6))
							}}
						/>
					</div>

					{error && <p className='text-sm text-red-500'>{error}</p>}

					<div className='flex justify-end gap-3 pt-2'>
						<Button
							type='button'
							onClick={onClose}
							variant='outline'
							className='bg-transparent text-white hover:bg-[#1A1F2E] hover:text-white'
						>
							Cancel
						</Button>
						<Button
							type='submit'
							className='bg-[#4E7BEE] hover:bg-[#4E7BEE]/90'
						>
							{isEditing ? 'Update Branch' : 'Create Branch'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
