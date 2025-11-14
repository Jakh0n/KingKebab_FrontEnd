'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getMyTimeEntries, getUserProfile, updateUserProfile } from '@/lib/api'
import { User } from '@/types'
import {
	Activity,
	ArrowLeft,
	Award,
	Briefcase,
	Calendar,
	Camera,
	Clock,
	Mail,
	MapPin,
	Pencil,
	Phone,
	Shield,
	Star,
	TrendingUp,
	Upload,
	User as UserIcon,
	Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface ProfileStats {
	totalHours: number
	totalDays: number
	averageHours: number
	thisMonthHours: number
}

export default function UserProfile() {
	const router = useRouter()
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)
	const [isEditing, setIsEditing] = useState(false)
	const [uploading, setUploading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [stats, setStats] = useState<ProfileStats>({
		totalHours: 0,
		totalDays: 0,
		averageHours: 0,
		thisMonthHours: 0,
	})
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		phone: '',
		bio: '',
		department: '',
		photoUrl: '',
		hireDate: '',
		hourlyWage: 0,
		skills: [] as string[],
		emergencyContact: {
			name: '',
			phone: '',
			relationship: '',
		},
	})

	// Fallback base64 image upload for when UploadThing is not available
	const handleFallbackImageUpload = (file: File) => {
		console.log('Using fallback base64 upload method')
		setUploading(true)

		const reader = new FileReader()
		reader.onload = e => {
			const base64Image = e.target?.result as string
			console.log('Base64 image created for immediate preview')

			// Update form data with base64 for immediate display
			setFormData(prev => ({
				...prev,
				photoUrl: base64Image,
			}))

			// Update user state for immediate display
			setUser(prev =>
				prev
					? {
							...prev,
							photoUrl: base64Image,
					  }
					: null
			)

			// Save base64 image to localStorage for persistence
			if (user?._id) {
				const savedImageKey = `userImage_${user._id}`
				const userProfileKey = `userProfile_${user._id}`
				localStorage.setItem(savedImageKey, base64Image)

				const currentProfile = JSON.parse(
					localStorage.getItem(userProfileKey) || '{}'
				)
				localStorage.setItem(
					userProfileKey,
					JSON.stringify({
						...currentProfile,
						photoUrl: base64Image,
					})
				)
				console.log('Base64 image saved to localStorage')
			}

			toast.success('Profile image uploaded successfully! (Local storage)')
			setUploading(false)
		}

		reader.onerror = () => {
			console.error('Failed to read file')
			toast.error('Failed to process image')
			setUploading(false)
		}

		reader.readAsDataURL(file)
	}

	useEffect(() => {
		fetchUserProfile()
		fetchStats()
	}, [])

	const fetchStats = async () => {
		try {
			const timeEntries = await getMyTimeEntries()
			const now = new Date()
			const currentMonth = now.getMonth()
			const currentYear = now.getFullYear()

			// Backend bilan mos kelishi uchun to'g'ri yumaloqlash
			const totalHours = timeEntries.reduce((sum, entry) => {
				const entryHours = Number(entry.hours.toFixed(1))
				return sum + entryHours
			}, 0)
			const totalDays = timeEntries.length
			const averageHours = totalDays > 0 ? totalHours / totalDays : 0

			const thisMonthEntries = timeEntries.filter(entry => {
				const entryDate = new Date(entry.date)
				return (
					entryDate.getMonth() === currentMonth &&
					entryDate.getFullYear() === currentYear
				)
			})
			const thisMonthHours = thisMonthEntries.reduce((sum, entry) => {
				const entryHours = Number(entry.hours.toFixed(1))
				return sum + entryHours
			}, 0)

			setStats({
				totalHours: Number(totalHours.toFixed(1)),
				totalDays,
				averageHours: Number(averageHours.toFixed(1)),
				thisMonthHours: Number(thisMonthHours.toFixed(1)),
			})
		} catch (error) {
			console.log('Could not fetch stats:', error)
		}
	}

	const fetchUserProfile = async () => {
		try {
			console.log('Loading user profile from token...')
			const token = localStorage.getItem('token')
			console.log('Token exists:', !!token)

			if (!token) {
				throw new Error('No authentication token found')
			}

			// Get user data directly from token (no API call needed)
			const payload = JSON.parse(atob(token.split('.')[1]))

			// Load saved profile data from localStorage (user-specific key) as fallback
			const userProfileKey = `userProfile_${payload.userId}`
			const savedProfile = JSON.parse(
				localStorage.getItem(userProfileKey) || '{}'
			)

			// Also check for saved image data specifically
			const savedImageKey = `userImage_${payload.userId}`
			const savedImageData = localStorage.getItem(savedImageKey)

			const userData: User = {
				_id: payload.userId,
				username: payload.username,
				employeeId: payload.employeeId,
				position: payload.position,
				name: savedProfile.name || '',
				email: savedProfile.email || '',
				phone: savedProfile.phone || '',
				bio: savedProfile.bio || '',
				department: savedProfile.department || '',
				photoUrl: savedImageData || savedProfile.photoUrl || '',
				skills: savedProfile.skills || [],
				emergencyContact: savedProfile.emergencyContact || {
					name: '',
					phone: '',
					relationship: '',
				},
				hireDate: savedProfile.hireDate || new Date().toISOString(),
				isActive: true,
				lastLogin: new Date().toISOString(),
			}

			console.log('User data loaded:', userData)
			console.log('Image URL:', userData.photoUrl ? 'Image found' : 'No image')
			setUser(userData)
			setFormData({
				name: userData.name || '',
				email: userData.email || '',
				phone: userData.phone || '',
				bio: userData.bio || '',
				department: userData.department || '',
				photoUrl: userData.photoUrl || '',
				hireDate: userData.hireDate || '',
				hourlyWage: savedProfile.hourlyWage || userData.hourlyWage || 0,
				skills: userData.skills || [],
				emergencyContact: {
					name: userData.emergencyContact?.name || '',
					phone: userData.emergencyContact?.phone || '',
					relationship: userData.emergencyContact?.relationship || '',
				},
			})

			// Try to get profile data from API (preferred source)
			try {
				const apiUserData = await getUserProfile()
				console.log('Profile data received from API:', apiUserData)

				// Use API data as the primary source, but keep local image if it exists
				const finalPhotoUrl = savedImageData || apiUserData.photoUrl || ''

				setUser({
					...apiUserData,
					photoUrl: finalPhotoUrl,
				})
				setFormData({
					name: apiUserData.name || '',
					email: apiUserData.email || '',
					phone: apiUserData.phone || '',
					bio: apiUserData.bio || '',
					department: apiUserData.department || '',
					photoUrl: finalPhotoUrl,
					hireDate: apiUserData.hireDate || '',
					hourlyWage: apiUserData.hourlyWage || 0,
					skills: apiUserData.skills || [],
					emergencyContact: {
						name: apiUserData.emergencyContact?.name || '',
						phone: apiUserData.emergencyContact?.phone || '',
						relationship: apiUserData.emergencyContact?.relationship || '',
					},
				})
			} catch {
				console.log('API not available, using local data only')
			}
		} catch (error) {
			console.error('Error loading profile:', error)
			toast.error(
				`Failed to load profile: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			)
		} finally {
			setLoading(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			// Try to update via API first
			try {
				const updatedUser = await updateUserProfile(formData)
				setUser(updatedUser)
				setIsEditing(false)
				toast.success('Profile updated successfully')
				return
			} catch {
				console.log('API not available, saving locally')
			}

			// Fallback: Save locally with user-specific key
			const updatedUser = {
				...user!,
				...formData,
			}

			// Store in localStorage for persistence (user-specific key)
			const userProfileKey = `userProfile_${user!._id}`
			localStorage.setItem(userProfileKey, JSON.stringify(formData))

			// Also save image data separately
			if (formData.photoUrl) {
				const savedImageKey = `userImage_${user!._id}`
				localStorage.setItem(savedImageKey, formData.photoUrl)
				console.log('Image data saved separately to localStorage')
			}

			setUser(updatedUser)
			setIsEditing(false)
			toast.success(
				'Profile updated locally (will sync when server is available)'
			)
		} catch (error) {
			toast.error('Failed to update profile')
			console.error('Error updating profile:', error)
		}
	}

	// Improved image upload handler with better mobile support
	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0]
		if (!file) return

		console.log('=== MOBILE IMAGE UPLOAD DEBUG ===')
		console.log('File selected:', {
			name: file.name,
			size: file.size,
			type: file.type,
		})

		// Validate file size (2MB limit for base64 storage)
		if (file.size > 2 * 1024 * 1024) {
			toast.error('File size must be less than 2MB')
			return
		}

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file')
			return
		}

		// Use base64 method directly for now (avoiding UploadThing configuration issues)
		console.log('Using base64 upload method for mobile compatibility')
		handleFallbackImageUpload(file)
	}

	// Mobile-friendly image upload trigger
	const triggerImageUpload = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click()
		}
	}

	const addSkill = (skill: string) => {
		if (skill && !formData.skills.includes(skill)) {
			setFormData(prev => ({
				...prev,
				skills: [...prev.skills, skill],
			}))
		}
	}

	const removeSkill = (skillToRemove: string) => {
		setFormData(prev => ({
			...prev,
			skills: prev.skills.filter(skill => skill !== skillToRemove),
		}))
	}

	const formatDate = (dateString?: string) => {
		if (!dateString) return 'Not set'
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		})
	}

	const getTimeWorked = () => {
		if (!user?.hireDate) return 'Unknown'
		const hireDate = new Date(user.hireDate)
		const now = new Date()
		const diffTime = Math.abs(now.getTime() - hireDate.getTime())
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

		if (diffDays < 30) return `${diffDays} days`
		if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`
		return `${Math.floor(diffDays / 365)} years`
	}

	if (loading) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900'>
				<div className='w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6'>
					{/* Back Button Skeleton */}
					<div className='flex items-center justify-start'>
						<div className='h-10 w-40 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-xl animate-pulse border border-blue-600/30'></div>
					</div>

					{/* Header Card Skeleton */}
					<div className='relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-900/95 via-blue-950/95 to-slate-800/95 backdrop-blur-lg rounded-lg'>
						<div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'></div>
						<div className='relative z-10 p-6'>
							<div className='flex flex-col items-center gap-6 md:flex-row md:items-start'>
								{/* Avatar Skeleton */}
								<div className='relative'>
									<div className='w-32 h-32 bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-purple-600/30 rounded-full animate-pulse border-4 border-blue-600/60'></div>
									<div className='absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-blue-700/40 to-indigo-700/40 rounded-full animate-pulse'></div>
								</div>

								{/* User Info Skeleton */}
								<div className='flex-1 space-y-4 text-center md:text-left'>
									<div className='space-y-2'>
										<div className='h-8 w-48 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg animate-pulse mx-auto md:mx-0'></div>
										<div className='h-6 w-32 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg animate-pulse mx-auto md:mx-0'></div>
									</div>
									<div className='h-16 w-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-lg animate-pulse'></div>
								</div>
							</div>
						</div>
					</div>

					{/* Stats Cards Skeleton */}
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
						{/* Total Hours Card */}
						<div className='relative border-0 shadow-md bg-gradient-to-br from-slate-900/95 to-blue-950/95 backdrop-blur-lg rounded-lg overflow-hidden'>
							<div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500'></div>
							<div className='p-4 space-y-3'>
								<div className='flex items-center justify-between'>
									<div className='h-4 w-20 bg-gradient-to-r from-blue-400/25 to-indigo-400/25 rounded animate-pulse'></div>
									<div className='w-6 h-6 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-md animate-pulse'></div>
								</div>
								<div className='h-8 w-16 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 rounded animate-pulse'></div>
								<div className='h-3 w-24 bg-gradient-to-r from-blue-300/20 to-indigo-300/20 rounded animate-pulse'></div>
							</div>
						</div>

						{/* This Month Card */}
						<div className='relative border-0 shadow-md bg-gradient-to-br from-slate-900/95 to-blue-950/95 backdrop-blur-lg rounded-lg overflow-hidden'>
							<div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500'></div>
							<div className='p-4 space-y-3'>
								<div className='flex items-center justify-between'>
									<div className='h-4 w-20 bg-gradient-to-r from-indigo-400/25 to-purple-400/25 rounded animate-pulse'></div>
									<div className='w-6 h-6 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 rounded-md animate-pulse'></div>
								</div>
								<div className='h-8 w-16 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded animate-pulse'></div>
								<div className='h-3 w-24 bg-gradient-to-r from-indigo-300/20 to-purple-300/20 rounded animate-pulse'></div>
							</div>
						</div>

						{/* Average Hours Card */}
						<div className='relative border-0 shadow-md bg-gradient-to-br from-slate-900/95 to-blue-950/95 backdrop-blur-lg rounded-lg overflow-hidden'>
							<div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500'></div>
							<div className='p-4 space-y-3'>
								<div className='flex items-center justify-between'>
									<div className='h-4 w-20 bg-gradient-to-r from-purple-400/25 to-pink-400/25 rounded animate-pulse'></div>
									<div className='w-6 h-6 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-md animate-pulse'></div>
								</div>
								<div className='h-8 w-16 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded animate-pulse'></div>
								<div className='h-3 w-24 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded animate-pulse'></div>
							</div>
						</div>

						{/* Experience Card */}
						<div className='relative border-0 shadow-md bg-gradient-to-br from-slate-900/95 to-blue-950/95 backdrop-blur-lg rounded-lg overflow-hidden'>
							<div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-red-500'></div>
							<div className='p-4 space-y-3'>
								<div className='flex items-center justify-between'>
									<div className='h-4 w-20 bg-gradient-to-r from-pink-400/25 to-red-400/25 rounded animate-pulse'></div>
									<div className='w-6 h-6 bg-gradient-to-r from-pink-600/30 to-red-600/30 rounded-md animate-pulse'></div>
								</div>
								<div className='h-8 w-16 bg-gradient-to-r from-pink-500/30 to-red-500/30 rounded animate-pulse'></div>
								<div className='h-3 w-24 bg-gradient-to-r from-pink-300/20 to-red-300/20 rounded animate-pulse'></div>
							</div>
						</div>
					</div>

					{/* Profile Details Skeleton */}
					<div className='border-0 shadow-2xl bg-gradient-to-br from-slate-900/95 to-blue-950/95 backdrop-blur-lg rounded-lg overflow-hidden'>
						<div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'></div>
						<div className='p-4 space-y-4'>
							{/* Header */}
							<div className='flex items-center gap-3'>
								<div className='w-8 h-8 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-xl animate-pulse'></div>
								<div className='h-6 w-32 bg-gradient-to-r from-blue-400/25 to-indigo-400/25 rounded animate-pulse'></div>
							</div>

							{/* Profile Details */}
							<div className='space-y-3'>
								{/* Email */}
								<div className='flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10'>
									<div className='w-6 h-6 bg-gradient-to-r from-blue-600/40 to-indigo-600/40 rounded-lg animate-pulse'></div>
									<div className='flex-1 space-y-2'>
										<div className='h-3 w-16 bg-gradient-to-r from-blue-300/20 to-indigo-300/20 rounded animate-pulse'></div>
										<div className='h-4 w-32 bg-gradient-to-r from-blue-400/25 to-indigo-400/25 rounded animate-pulse'></div>
									</div>
								</div>

								{/* Phone */}
								<div className='flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10'>
									<div className='w-6 h-6 bg-gradient-to-r from-indigo-600/40 to-purple-600/40 rounded-lg animate-pulse'></div>
									<div className='flex-1 space-y-2'>
										<div className='h-3 w-16 bg-gradient-to-r from-indigo-300/20 to-purple-300/20 rounded animate-pulse'></div>
										<div className='h-4 w-32 bg-gradient-to-r from-indigo-400/25 to-purple-400/25 rounded animate-pulse'></div>
									</div>
								</div>

								{/* Joined Date */}
								<div className='flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10'>
									<div className='w-6 h-6 bg-gradient-to-r from-purple-600/40 to-pink-600/40 rounded-lg animate-pulse'></div>
									<div className='flex-1 space-y-2'>
										<div className='h-3 w-16 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded animate-pulse'></div>
										<div className='h-4 w-32 bg-gradient-to-r from-purple-400/25 to-pink-400/25 rounded animate-pulse'></div>
									</div>
								</div>
							</div>

							{/* Skills Skeleton */}
							<div className='space-y-3'>
								<div className='flex items-center gap-2'>
									<div className='w-3 h-3 bg-gradient-to-r from-blue-400/30 to-indigo-400/30 rounded animate-pulse'></div>
									<div className='h-4 w-16 bg-gradient-to-r from-blue-400/25 to-indigo-400/25 rounded animate-pulse'></div>
								</div>
								<div className='flex flex-wrap gap-2'>
									<div className='h-6 w-20 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-full animate-pulse'></div>
									<div className='h-6 w-24 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-full animate-pulse'></div>
									<div className='h-6 w-18 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full animate-pulse'></div>
								</div>
							</div>

							{/* Emergency Contact Skeleton */}
							<div className='p-4 bg-gradient-to-r from-red-600/10 to-pink-600/10 rounded-xl border border-red-600/30'>
								<div className='space-y-3'>
									<div className='flex items-center gap-2'>
										<div className='w-3 h-3 bg-gradient-to-r from-red-400/30 to-pink-400/30 rounded animate-pulse'></div>
										<div className='h-4 w-32 bg-gradient-to-r from-red-400/25 to-pink-400/25 rounded animate-pulse'></div>
									</div>
									<div className='space-y-2'>
										<div className='flex items-center gap-2'>
											<div className='w-4 h-4 bg-gradient-to-r from-red-400/30 to-orange-400/30 rounded animate-pulse'></div>
											<div className='h-4 w-28 bg-gradient-to-r from-red-300/20 to-orange-300/20 rounded animate-pulse'></div>
										</div>
										<div className='flex items-center gap-2'>
											<div className='w-4 h-4 bg-gradient-to-r from-orange-400/30 to-yellow-400/30 rounded animate-pulse'></div>
											<div className='h-4 w-32 bg-gradient-to-r from-orange-300/20 to-yellow-300/20 rounded animate-pulse'></div>
										</div>
										<div className='flex items-center gap-2'>
											<div className='w-4 h-4 bg-gradient-to-r from-yellow-400/30 to-red-400/30 rounded animate-pulse'></div>
											<div className='h-4 w-24 bg-gradient-to-r from-yellow-300/20 to-red-300/20 rounded animate-pulse'></div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Work Information Skeleton */}
					<div className='border-0 shadow-2xl bg-gradient-to-br from-slate-900/95 to-blue-950/95 backdrop-blur-lg rounded-lg overflow-hidden'>
						<div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'></div>
						<div className='p-4 space-y-4'>
							{/* Header */}
							<div className='flex items-center gap-3'>
								<div className='w-8 h-8 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-xl animate-pulse'></div>
								<div className='h-6 w-36 bg-gradient-to-r from-blue-400/25 to-indigo-400/25 rounded animate-pulse'></div>
							</div>

							{/* Work Info Cards */}
							<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
								{/* Username Card */}
								<div className='p-4 bg-gradient-to-br from-blue-600/10 via-blue-600/5 to-transparent rounded-2xl border border-blue-600/30'>
									<div className='space-y-3'>
										<div className='flex items-center justify-between'>
											<div className='w-10 h-10 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-xl animate-pulse'></div>
										</div>
										<div className='h-4 w-20 bg-gradient-to-r from-blue-300/20 to-indigo-300/20 rounded animate-pulse'></div>
										<div className='h-6 w-24 bg-gradient-to-r from-blue-400/25 to-indigo-400/25 rounded animate-pulse'></div>
									</div>
								</div>

								{/* Employee ID Card */}
								<div className='p-4 bg-gradient-to-br from-indigo-600/10 via-indigo-600/5 to-transparent rounded-2xl border border-indigo-600/30'>
									<div className='space-y-3'>
										<div className='flex items-center justify-between'>
											<div className='w-10 h-10 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 rounded-xl animate-pulse'></div>
										</div>
										<div className='h-4 w-20 bg-gradient-to-r from-indigo-300/20 to-purple-300/20 rounded animate-pulse'></div>
										<div className='h-6 w-24 bg-gradient-to-r from-indigo-400/25 to-purple-400/25 rounded animate-pulse'></div>
									</div>
								</div>

								{/* Position Card */}
								<div className='p-4 bg-gradient-to-br from-purple-600/10 via-purple-600/5 to-transparent rounded-2xl border border-purple-600/30'>
									<div className='space-y-3'>
										<div className='flex items-center justify-between'>
											<div className='w-10 h-10 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-xl animate-pulse'></div>
										</div>
										<div className='h-4 w-20 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded animate-pulse'></div>
										<div className='h-6 w-24 bg-gradient-to-r from-purple-400/25 to-pink-400/25 rounded animate-pulse'></div>
									</div>
								</div>

								{/* Department Card */}
								<div className='p-4 bg-gradient-to-br from-pink-600/10 via-pink-600/5 to-transparent rounded-2xl border border-pink-600/30'>
									<div className='space-y-3'>
										<div className='flex items-center justify-between'>
											<div className='w-10 h-10 bg-gradient-to-r from-pink-600/30 to-red-600/30 rounded-xl animate-pulse'></div>
										</div>
										<div className='h-4 w-20 bg-gradient-to-r from-pink-300/20 to-red-300/20 rounded animate-pulse'></div>
										<div className='h-6 w-24 bg-gradient-to-r from-pink-400/25 to-red-400/25 rounded animate-pulse'></div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900'>
			<div className='w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6'>
				{/* Back to Dashboard Button */}
				<div className='flex items-center justify-start'>
					<Button
						onClick={() => router.push('/dashboard')}
						variant='outline'
						className='flex items-center gap-2 bg-slate-900/70 border-blue-600/40 text-blue-300 hover:bg-blue-950/50 hover:border-blue-500 hover:text-blue-200 backdrop-blur-sm transition-all duration-300 rounded-xl px-4 py-2 shadow-lg'
					>
						<ArrowLeft className='w-4 h-4' />
						Back to Dashboard
					</Button>
				</div>

				{/* Header Card */}
				<Card className='relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-900/95 via-blue-950/95 to-slate-800/95 backdrop-blur-lg'>
					<div className='absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10'></div>
					<div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'></div>
					<CardContent className='relative z-10 p-6'>
						<div className='flex flex-col items-center gap-6 md:flex-row md:items-start text-white'>
							<div className='relative group'>
								<div className='absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300'></div>
								<Avatar className='relative w-32 h-32 border-4 border-blue-600/60 shadow-2xl ring-4 ring-blue-600/30'>
									<AvatarImage
										key={formData.photoUrl || user?.photoUrl || 'default'}
										src={formData.photoUrl || user?.photoUrl}
										alt={user?.name || user?.username}
										className='object-cover'
										onLoad={() =>
											console.log(
												'Image loaded successfully:',
												formData.photoUrl || user?.photoUrl
											)
										}
										onError={e => {
											console.log(
												'Image failed to load:',
												formData.photoUrl || user?.photoUrl
											)
											console.log('Error event:', e)
										}}
									/>
									<AvatarFallback className='text-4xl bg-gradient-to-br from-blue-700 to-indigo-700 text-white border-4 border-blue-600/40'>
										{user?.name ? (
											user.name.charAt(0).toUpperCase()
										) : user?.username ? (
											user.username.charAt(0).toUpperCase()
										) : (
											<UserIcon className='w-12 h-12' />
										)}
									</AvatarFallback>
								</Avatar>
								<Dialog open={isEditing} onOpenChange={setIsEditing}>
									<DialogTrigger asChild>
										<Button
											size='sm'
											className='absolute -bottom-2 -right-2 rounded-full w-10 h-10 p-0 bg-gradient-to-r from-blue-700 to-indigo-700 text-white hover:from-indigo-700 hover:to-purple-700 shadow-2xl border-2 border-white/20 transform hover:scale-110 transition-all duration-300'
											variant='outline'
										>
											<Pencil className='w-4 h-4' />
										</Button>
									</DialogTrigger>
									<DialogContent className=' max-h-[90vh] overflow-y-auto border-0 shadow-2xl bg-gradient-to-br from-slate-900/98 via-blue-950/98 to-slate-800/98 backdrop-blur-lg text-white w-[95vw] max-w-[95vw] sm:w-full sm:max-w-3xl'>
										<div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'></div>
										<DialogHeader className='pt-6'>
											<DialogTitle className='text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent'>
												✨ Edit Profile
											</DialogTitle>
										</DialogHeader>
										<form onSubmit={handleSubmit} className='space-y-6 pt-4'>
											{/* Basic Information */}
											<div className='space-y-4'>
												<div className='flex items-center gap-3'>
													<div className='w-6 h-6 rounded-lg bg-gradient-to-r from-blue-700 to-indigo-700 flex items-center justify-center shadow-lg'>
														<UserIcon className='w-3 h-3 text-white' />
													</div>
													<h3 className='text-lg font-bold text-white'>
														Basic Information
													</h3>
												</div>
												<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
													<div className='space-y-2'>
														<Label
															htmlFor='name'
															className='text-sm text-blue-200 font-medium'
														>
															🧑‍💼 Full Name
														</Label>
														<Input
															id='name'
															value={formData.name}
															onChange={e =>
																setFormData(prev => ({
																	...prev,
																	name: e.target.value,
																}))
															}
															placeholder='Enter your full name'
															className='bg-slate-900/60 border-blue-600/40 text-white placeholder:text-blue-300/60 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-10 shadow-inner backdrop-blur-sm'
														/>
													</div>
													<div className='space-y-2'>
														<Label
															htmlFor='email'
															className='text-sm text-blue-200 font-medium'
														>
															📧 Email
														</Label>
														<Input
															id='email'
															type='email'
															value={formData.email}
															onChange={e =>
																setFormData(prev => ({
																	...prev,
																	email: e.target.value,
																}))
															}
															placeholder='Enter your email'
															className='bg-slate-900/60 border-blue-600/40 text-white placeholder:text-blue-300/60 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-10 shadow-inner backdrop-blur-sm'
														/>
													</div>
													<div className='space-y-2'>
														<Label
															htmlFor='phone'
															className='text-sm text-blue-200 font-medium'
														>
															📱 Phone
														</Label>
														<Input
															id='phone'
															value={formData.phone}
															onChange={e =>
																setFormData(prev => ({
																	...prev,
																	phone: e.target.value,
																}))
															}
															placeholder='Enter your phone number'
															className='bg-slate-900/60 border-blue-600/40 text-white placeholder:text-blue-300/60 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-10 shadow-inner backdrop-blur-sm'
														/>
													</div>
													<div className='space-y-2'>
														<Label
															htmlFor='department'
															className='text-sm text-blue-200 font-medium'
														>
															🏢 Department
														</Label>
														<Select
															value={formData.department}
															onValueChange={value =>
																setFormData(prev => ({
																	...prev,
																	department: value,
																}))
															}
														>
															<SelectTrigger className='bg-slate-900/60 border-blue-600/40 text-white focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-10 shadow-inner backdrop-blur-sm'>
																<SelectValue placeholder='Select department' />
															</SelectTrigger>
															<SelectContent className='bg-slate-900/98 border-blue-600/40 text-white backdrop-blur-lg'>
																<SelectItem value='Kitchen'>
																	🍳 Kitchen
																</SelectItem>
																<SelectItem value='Delivery'>
																	🚚 Delivery
																</SelectItem>
																<SelectItem value='Management'>
																	👔 Management
																</SelectItem>
																<SelectItem value='Customer Service'>
																	🎧 Customer Service
																</SelectItem>
															</SelectContent>
														</Select>
													</div>
													<div className='space-y-2'>
														<Label
															htmlFor='hireDate'
															className='text-sm text-blue-200 font-medium'
														>
															📅 Hire Date
														</Label>
														<Input
															id='hireDate'
															type='date'
															value={
																formData.hireDate
																	? new Date(formData.hireDate)
																			.toISOString()
																			.split('T')[0]
																	: ''
															}
															onChange={e =>
																setFormData(prev => ({
																	...prev,
																	hireDate: e.target.value,
																}))
															}
															className='bg-slate-900/60 border-blue-600/40 text-white focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-10 shadow-inner backdrop-blur-sm'
														/>
													</div>
													<div className='space-y-2'>
														<Label
															htmlFor='hourlyWage'
															className='text-sm text-blue-200 font-medium'
														>
															💰 Soatlik Ish Haqqi (KRW)
														</Label>
														<Input
															id='hourlyWage'
															type='number'
															min='0'
															step='100'
															value={formData.hourlyWage || 0}
															onChange={e =>
																setFormData(prev => ({
																	...prev,
																	hourlyWage: parseFloat(e.target.value) || 0,
																}))
															}
															placeholder='Masalan: 10000'
															className='bg-slate-900/60 border-blue-600/40 text-white placeholder:text-blue-300/60 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-10 shadow-inner backdrop-blur-sm'
														/>
														<p className='text-xs text-blue-300/70'>
															Koreya wonida kiriting (masalan: 10000)
														</p>
													</div>
												</div>
												<div className='space-y-2'>
													<Label
														htmlFor='bio'
														className='text-sm text-blue-200 font-medium'
													>
														📝 Bio
													</Label>
													<Textarea
														id='bio'
														value={formData.bio}
														onChange={e =>
															setFormData(prev => ({
																...prev,
																bio: e.target.value,
															}))
														}
														placeholder='Tell us about yourself...'
														rows={3}
														className='bg-slate-900/60 border-blue-600/40 text-white placeholder:text-blue-300/60 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl shadow-inner resize-none backdrop-blur-sm'
													/>
												</div>
											</div>

											{/* Profile Image - Improved Mobile Support */}
											<div className='space-y-4'>
												<div className='flex items-center gap-3'>
													<div className='w-6 h-6 rounded-lg bg-gradient-to-r from-indigo-700 to-purple-700 flex items-center justify-center shadow-lg'>
														<Camera className='w-3 h-3 text-white' />
													</div>
													<h3 className='text-lg font-bold text-white'>
														Profile Image
													</h3>
												</div>
												<div className='flex flex-col items-center space-y-4 p-6 bg-slate-900/40 rounded-2xl border border-blue-600/30 backdrop-blur-sm'>
													{formData.photoUrl && (
														<div className='relative group'>
															<div className='absolute -inset-2 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-full blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300'></div>
															<Avatar className='relative w-24 h-24 border-4 border-blue-600/60 shadow-2xl'>
																<AvatarImage
																	src={formData.photoUrl}
																	alt='Preview'
																	className='object-cover'
																/>
																<AvatarFallback className='bg-gradient-to-br from-blue-700 to-indigo-700 text-white'>
																	<UserIcon className='w-8 h-8' />
																</AvatarFallback>
															</Avatar>
														</div>
													)}

													{/* Hidden file input */}
													<input
														ref={fileInputRef}
														type='file'
														accept='image/*'
														onChange={handleImageUpload}
														className='hidden'
														capture='environment' // Mobile camera preference
													/>

													{/* Mobile-friendly upload buttons */}
													<div className='flex flex-col sm:flex-row gap-3 w-full'>
														<Button
															type='button'
															onClick={triggerImageUpload}
															disabled={uploading}
															className='flex-1 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg rounded-xl h-12 font-semibold transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
														>
															{uploading ? (
																<>
																	<Upload className='w-4 h-4 mr-2 animate-spin' />
																	Uploading...
																</>
															) : (
																<>
																	<Camera className='w-4 h-4 mr-2' />
																	Choose Photo
																</>
															)}
														</Button>
													</div>

													<p className='text-xs text-blue-300/70 text-center'>
														Maximum file size: 4MB
														<br />
														Supported formats: JPG, PNG, GIF
													</p>
												</div>
											</div>

											{/* Skills */}
											<div className='space-y-4'>
												<div className='flex items-center gap-3'>
													<div className='w-6 h-6 rounded-lg bg-gradient-to-r from-purple-700 to-pink-700 flex items-center justify-center shadow-lg'>
														<Star className='w-3 h-3 text-white' />
													</div>
													<h3 className='text-lg font-bold text-white'>
														Skills
													</h3>
												</div>
												<div className='space-y-3'>
													<div className='flex flex-wrap gap-2'>
														{formData.skills.map((skill, index) => (
															<Badge
																key={index}
																variant='secondary'
																className='bg-blue-700/30 text-blue-200 hover:bg-blue-600/40 px-3 py-1 rounded-full border border-blue-600/40 backdrop-blur-sm'
															>
																{skill}
																<button
																	type='button'
																	onClick={() => removeSkill(skill)}
																	className='ml-2 text-blue-300 hover:text-red-400 transition-colors duration-200'
																>
																	×
																</button>
															</Badge>
														))}
													</div>
													<div className='flex gap-2'>
														<Input
															placeholder='Add a skill...'
															className='bg-slate-900/60 border-blue-600/40 text-white placeholder:text-blue-300/60 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-10 shadow-inner backdrop-blur-sm'
															onKeyPress={e => {
																if (e.key === 'Enter') {
																	e.preventDefault()
																	const input = e.target as HTMLInputElement
																	if (input.value.trim()) {
																		addSkill(input.value.trim())
																		input.value = ''
																	}
																}
															}}
														/>
														<Button
															type='button'
															onClick={e => {
																const input = (e.target as HTMLElement)
																	.previousElementSibling as HTMLInputElement
																if (input?.value.trim()) {
																	addSkill(input.value.trim())
																	input.value = ''
																}
															}}
															className='bg-gradient-to-r from-purple-700 to-pink-700 hover:from-pink-700 hover:to-red-700 text-white rounded-xl px-4 shadow-lg transform hover:scale-105 transition-all duration-300'
														>
															Add
														</Button>
													</div>
												</div>
											</div>

											{/* Emergency Contact */}
											<div className='space-y-4'>
												<div className='flex items-center gap-3'>
													<div className='w-6 h-6 rounded-lg bg-gradient-to-r from-red-700 to-orange-700 flex items-center justify-center shadow-lg'>
														<Shield className='w-3 h-3 text-white' />
													</div>
													<h3 className='text-lg font-bold text-white'>
														Emergency Contact
													</h3>
												</div>
												<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
													<div className='space-y-2'>
														<Label
															htmlFor='emergencyName'
															className='text-sm text-blue-200 font-medium'
														>
															👤 Name
														</Label>
														<Input
															id='emergencyName'
															value={formData.emergencyContact.name}
															onChange={e =>
																setFormData(prev => ({
																	...prev,
																	emergencyContact: {
																		...prev.emergencyContact,
																		name: e.target.value,
																	},
																}))
															}
															placeholder='Emergency contact name'
															className='bg-slate-900/60 border-blue-600/40 text-white placeholder:text-blue-300/60 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-10 shadow-inner backdrop-blur-sm'
														/>
													</div>
													<div className='space-y-2'>
														<Label
															htmlFor='emergencyPhone'
															className='text-sm text-blue-200 font-medium'
														>
															📞 Phone
														</Label>
														<Input
															id='emergencyPhone'
															value={formData.emergencyContact.phone}
															onChange={e =>
																setFormData(prev => ({
																	...prev,
																	emergencyContact: {
																		...prev.emergencyContact,
																		phone: e.target.value,
																	},
																}))
															}
															placeholder='Emergency contact phone'
															className='bg-slate-900/60 border-blue-600/40 text-white placeholder:text-blue-300/60 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-10 shadow-inner backdrop-blur-sm'
														/>
													</div>
													<div className='space-y-2'>
														<Label
															htmlFor='emergencyRelationship'
															className='text-sm text-blue-200 font-medium'
														>
															💝 Relationship
														</Label>
														<Select
															value={formData.emergencyContact.relationship}
															onValueChange={value =>
																setFormData(prev => ({
																	...prev,
																	emergencyContact: {
																		...prev.emergencyContact,
																		relationship: value,
																	},
																}))
															}
														>
															<SelectTrigger className='bg-slate-900/60 border-blue-600/40 text-white focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-10 shadow-inner backdrop-blur-sm'>
																<SelectValue placeholder='Relationship' />
															</SelectTrigger>
															<SelectContent className='bg-slate-900/98 border-blue-600/40 text-white backdrop-blur-lg'>
																<SelectItem value='Parent'>Parent</SelectItem>
																<SelectItem value='Spouse'>Spouse</SelectItem>
																<SelectItem value='Sibling'>Sibling</SelectItem>
																<SelectItem value='Friend'>Friend</SelectItem>
																<SelectItem value='Other'>Other</SelectItem>
															</SelectContent>
														</Select>
													</div>
												</div>
											</div>

											<div className='flex flex-col sm:flex-row gap-3 pt-6 border-t border-blue-600/30'>
												<Button
													type='submit'
													className='flex-1 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white shadow-2xl rounded-xl h-10 font-semibold transform hover:scale-105 transition-all duration-300'
												>
													💾 Save Changes
												</Button>
												<Button
													type='button'
													variant='outline'
													className='border-blue-600/50 text-blue-300 hover:bg-blue-600/10 rounded-xl h-10 font-semibold transform hover:scale-105 transition-all duration-300'
													onClick={() => {
														setIsEditing(false)
														setFormData({
															name: user?.name || '',
															email: user?.email || '',
															phone: user?.phone || '',
															bio: user?.bio || '',
															department: user?.department || '',
															photoUrl: user?.photoUrl || '',
															hireDate: user?.hireDate || '',
															hourlyWage: user?.hourlyWage || 0,
															skills: user?.skills || [],
															emergencyContact: {
																name: user?.emergencyContact?.name || '',
																phone: user?.emergencyContact?.phone || '',
																relationship:
																	user?.emergencyContact?.relationship || '',
															},
														})
													}}
												>
													❌ Cancel
												</Button>
											</div>
										</form>
									</DialogContent>
								</Dialog>
							</div>

							<div className='flex-1 text-center md:text-left space-y-4'>
								<div className='flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4'>
									<h1 className='text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent'>
										{user?.name || user?.username || 'User'}
									</h1>
									{user?.isAdmin && (
										<Badge className='bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg rounded-full px-3 py-1 text-sm font-semibold'>
											<Shield className='w-3 h-3 mr-1' />
											👑 Admin
										</Badge>
									)}
									{user?.isActive && (
										<Badge className='bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg rounded-full px-3 py-1 text-sm font-semibold'>
											<Activity className='w-3 h-3 mr-1' />✅ Active
										</Badge>
									)}
								</div>

								{user?.name && (
									<p className='text-blue-200 text-xl font-medium'>
										@{user.username}
									</p>
								)}

								<div className='flex flex-wrap items-center justify-center md:justify-start gap-4 text-blue-100'>
									<div className='flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 backdrop-blur-sm'>
										<Briefcase className='w-4 h-4 text-blue-400' />
										<span className='capitalize font-medium text-sm'>
											{user?.position}
										</span>
									</div>
									<div className='flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 backdrop-blur-sm'>
										<MapPin className='w-4 h-4 text-indigo-400' />
										<span className='font-medium text-sm'>
											{user?.department || 'No department'}
										</span>
									</div>
									<div className='flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 backdrop-blur-sm'>
										<Calendar className='w-4 h-4 text-purple-400' />
										<span className='font-medium text-sm'>
											{getTimeWorked()} with us
										</span>
									</div>
								</div>

								{user?.bio && (
									<div className='bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10'>
										<p className='text-blue-100 text-sm leading-relaxed max-w-2xl'>
											{user.bio}
										</p>
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					{/* Stats Cards */}
					<div className='lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3'>
						<Card className='border-0 shadow-md bg-gradient-to-br from-slate-900/95 to-blue-950/95 backdrop-blur-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'>
							<div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500'></div>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3'>
								<CardTitle className='text-sm font-bold text-white'>
									⏰ Total Hours
								</CardTitle>
								<div className='w-6 h-6 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300'>
									<Clock className='h-3 w-3 text-white' />
								</div>
							</CardHeader>
							<CardContent className='pt-0 px-3 pb-2'>
								<div className='text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent'>
									{stats.totalHours}h
								</div>
								<p className='text-xs text-blue-300 mt-0.5'>
									📊 Across {stats.totalDays} working days
								</p>
							</CardContent>
						</Card>

						<Card className='border-0 shadow-md bg-gradient-to-br from-slate-900/95 to-blue-950/95 backdrop-blur-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'>
							<div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500'></div>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3'>
								<CardTitle className='text-sm font-bold text-white'>
									📈 This Month
								</CardTitle>
								<div className='w-6 h-6 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300'>
									<TrendingUp className='h-3 w-3 text-white' />
								</div>
							</CardHeader>
							<CardContent className='pt-0 px-3 pb-2'>
								<div className='text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent'>
									{stats.thisMonthHours}h
								</div>
								<p className='text-xs text-blue-300 mt-0.5'>
									🚀 Current month progress
								</p>
							</CardContent>
						</Card>

						<Card className='border-0 shadow-md bg-gradient-to-br from-slate-900/95 to-blue-950/95 backdrop-blur-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'>
							<div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500'></div>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3'>
								<CardTitle className='text-sm font-bold text-white'>
									⚡ Average Hours
								</CardTitle>
								<div className='w-6 h-6 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300'>
									<Award className='h-3 w-3 text-white' />
								</div>
							</CardHeader>
							<CardContent className='pt-0 px-3 pb-2'>
								<div className='text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'>
									{stats.averageHours}h
								</div>
								<p className='text-xs text-blue-300 mt-0.5'>
									📊 Per working day
								</p>
							</CardContent>
						</Card>

						<Card className='border-0 shadow-md bg-gradient-to-br from-slate-900/95 to-blue-950/95 backdrop-blur-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 group'>
							<div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-red-500'></div>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3'>
								<CardTitle className='text-sm font-bold text-white'>
									🌟 Experience
								</CardTitle>
								<div className='w-6 h-6 rounded-md bg-gradient-to-r from-pink-600 to-red-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300'>
									<Star className='h-2.5 w-2.5 text-white' />
								</div>
							</CardHeader>
							<CardContent className='pt-0 px-3 pb-2'>
								<div className='text-xl font-bold bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent'>
									{getTimeWorked()}
								</div>
								<p className='text-xs text-blue-300 mt-0.5'>
									📅 Since {formatDate(user?.hireDate)}
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Profile Details */}
					<Card className='border-0 shadow-2xl bg-gradient-to-br from-slate-900/95 to-blue-950/95 backdrop-blur-lg'>
						<div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'></div>
						<CardHeader className='pt-4 px-4'>
							<CardTitle className='flex items-center gap-3 text-white text-lg font-bold'>
								<div className='w-8 h-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg'>
									<Users className='w-4 h-4 text-white' />
								</div>
								👤 Profile Details
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4 pt-2 px-4 pb-4'>
							<div className='space-y-3'>
								<div className='flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm'>
									<div className='w-6 h-6 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center'>
										<Mail className='w-3 h-3 text-white' />
									</div>
									<div className='min-w-0 flex-1'>
										<p className='text-xs text-blue-300 uppercase tracking-wider'>
											Email
										</p>
										<p className='text-sm text-white font-medium truncate'>
											{user?.email || 'No email set'}
										</p>
									</div>
								</div>
								<div className='flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm'>
									<div className='w-6 h-6 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center'>
										<Phone className='w-3 h-3 text-white' />
									</div>
									<div className='min-w-0 flex-1'>
										<p className='text-xs text-blue-300 uppercase tracking-wider'>
											Phone
										</p>
										<p className='text-sm text-white font-medium truncate'>
											{user?.phone || 'No phone set'}
										</p>
									</div>
								</div>
								<div className='flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm'>
									<div className='w-6 h-6 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center'>
										<Calendar className='w-3 h-3 text-white' />
									</div>
									<div className='min-w-0 flex-1'>
										<p className='text-xs text-blue-300 uppercase tracking-wider'>
											Joined
										</p>
										<p className='text-sm text-white font-medium'>
											{formatDate(user?.hireDate)}
										</p>
									</div>
								</div>
							</div>

							{user?.skills && user.skills.length > 0 && (
								<div className='space-y-3'>
									<h4 className='text-sm font-bold text-white flex items-center gap-2'>
										<Star className='w-3 h-3 text-blue-400' />
										🎯 Skills
									</h4>
									<div className='flex flex-wrap gap-2'>
										{user.skills.map((skill, index) => (
											<Badge
												key={index}
												variant='secondary'
												className='text-xs bg-blue-600/20 text-blue-300 border border-blue-600/50 rounded-full px-3 py-1 font-medium'
											>
												{skill}
											</Badge>
										))}
									</div>
								</div>
							)}

							{user?.emergencyContact?.name && (
								<div className='space-y-3 p-4 bg-gradient-to-r from-red-600/10 to-pink-600/10 rounded-xl border border-red-600/30 backdrop-blur-sm'>
									<h4 className='text-sm font-bold text-white flex items-center gap-2'>
										<Phone className='w-3 h-3 text-red-400' />
										🚨 Emergency Contact
									</h4>
									<div className='text-sm text-blue-200 space-y-2'>
										<div className='flex items-center gap-2'>
											<span className='text-red-400'>👤</span>
											<span className='font-medium text-white truncate'>
												{user.emergencyContact.name}
											</span>
										</div>
										<div className='flex items-center gap-2'>
											<span className='text-red-400'>📞</span>
											<span className='truncate'>
												{user.emergencyContact.phone}
											</span>
										</div>
										<div className='flex items-center gap-2'>
											<span className='text-red-400'>❤️</span>
											<span className='text-xs text-blue-300 truncate'>
												{user.emergencyContact.relationship}
											</span>
										</div>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Work Information */}
				<Card className='border-0 shadow-2xl bg-gradient-to-br from-slate-900/95 to-blue-950/95 backdrop-blur-lg'>
					<div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'></div>
					<CardHeader className='pt-4 px-4'>
						<CardTitle className='text-white text-lg font-bold flex items-center gap-3'>
							<div className='w-8 h-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg'>
								<Briefcase className='w-4 h-4 text-white' />
							</div>
							💼 Work Information
						</CardTitle>
					</CardHeader>
					<CardContent className='pt-2 px-4 pb-4'>
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
							<div className='group p-4 bg-gradient-to-br from-blue-600/10 via-blue-600/5 to-transparent rounded-2xl border border-blue-600/30 hover:border-blue-600/50 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm'>
								<div className='flex items-center justify-between mb-3'>
									<div className='w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300'>
										<UserIcon className='w-5 h-5 text-white' />
									</div>
								</div>
								<p className='text-sm font-medium text-blue-300 mb-2'>
									👤 Username
								</p>
								<p className='text-lg font-bold text-white truncate'>
									{user?.username}
								</p>
							</div>

							<div className='group p-4 bg-gradient-to-br from-indigo-600/10 via-indigo-600/5 to-transparent rounded-2xl border border-indigo-600/30 hover:border-indigo-600/50 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm'>
								<div className='flex items-center justify-between mb-3'>
									<div className='w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300'>
										<Award className='w-5 h-5 text-white' />
									</div>
								</div>
								<p className='text-sm font-medium text-blue-300 mb-2'>
									🆔 Employee ID
								</p>
								<p className='text-lg font-bold text-white truncate'>
									{user?.employeeId}
								</p>
							</div>

							<div className='group p-4 bg-gradient-to-br from-purple-600/10 via-purple-600/5 to-transparent rounded-2xl border border-purple-600/30 hover:border-purple-600/50 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm'>
								<div className='flex items-center justify-between mb-3'>
									<div className='w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300'>
										<Briefcase className='w-5 h-5 text-white' />
									</div>
								</div>
								<p className='text-sm font-medium text-blue-300 mb-2'>
									💼 Position
								</p>
								<p className='text-lg font-bold text-white capitalize truncate'>
									{user?.position}
								</p>
							</div>

							<div className='group p-4 bg-gradient-to-br from-pink-600/10 via-pink-600/5 to-transparent rounded-2xl border border-pink-600/30 hover:border-pink-600/50 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm'>
								<div className='flex items-center justify-between mb-3'>
									<div className='w-10 h-10 rounded-xl bg-gradient-to-r from-pink-600 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300'>
										<MapPin className='w-5 h-5 text-white' />
									</div>
								</div>
								<p className='text-sm font-medium text-blue-300 mb-2'>
									🏢 Department
								</p>
								<p className='text-lg font-bold text-white truncate'>
									{user?.department || 'Not assigned'}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
