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
import {
	getMyTimeEntries,
	getUserProfile,
	updateUserProfile,
	uploadProfileImage,
} from '@/lib/api'
import { User } from '@/types'
import {
	Activity,
	ArrowLeft,
	Award,
	Briefcase,
	Calendar,
	Clock,
	Mail,
	MapPin,
	Pencil,
	Phone,
	Shield,
	Star,
	TrendingUp,
	User as UserIcon,
	Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

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
		skills: [] as string[],
		emergencyContact: {
			name: '',
			phone: '',
			relationship: '',
		},
	})

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

			const totalHours = timeEntries.reduce(
				(sum, entry) => sum + entry.hours,
				0
			)
			const totalDays = timeEntries.length
			const averageHours = totalDays > 0 ? totalHours / totalDays : 0

			const thisMonthEntries = timeEntries.filter(entry => {
				const entryDate = new Date(entry.date)
				return (
					entryDate.getMonth() === currentMonth &&
					entryDate.getFullYear() === currentYear
				)
			})
			const thisMonthHours = thisMonthEntries.reduce(
				(sum, entry) => sum + entry.hours,
				0
			)

			setStats({
				totalHours: Math.round(totalHours * 100) / 100,
				totalDays,
				averageHours: Math.round(averageHours * 100) / 100,
				thisMonthHours: Math.round(thisMonthHours * 100) / 100,
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
			console.log(
				'Image URL from localStorage:',
				savedImageData ? 'Base64 image found' : 'No saved image'
			)
			setUser(userData)
			setFormData({
				name: userData.name || '',
				email: userData.email || '',
				phone: userData.phone || '',
				bio: userData.bio || '',
				department: userData.department || '',
				photoUrl: userData.photoUrl || '',
				hireDate: userData.hireDate || '',
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

			// Also save image data separately if it's a base64 image
			if (formData.photoUrl && formData.photoUrl.startsWith('data:')) {
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

	// Function to get image URL that works around CORS issues
	const getImageUrl = (photoUrl: string | undefined) => {
		if (!photoUrl) return ''

		// If it's already a data URL (base64), use it directly
		if (photoUrl.startsWith('data:')) {
			return photoUrl
		}

		// If it's a server URL, we need to handle CORS
		if (photoUrl.includes('kingkebab-backend.onrender.com')) {
			// For now, let's try to load it directly and fall back to placeholder if it fails
			return photoUrl
		}

		return photoUrl
	}

	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0]
		if (!file) return

		console.log('=== IMAGE UPLOAD DEBUG ===')
		console.log('File selected:', {
			name: file.name,
			size: file.size,
			type: file.type,
			lastModified: file.lastModified,
		})
		console.log(
			'API URL being used:',
			process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
		)
		console.log('Token available:', !!localStorage.getItem('token'))

		// Validate file size (2MB limit)
		if (file.size > 2 * 1024 * 1024) {
			toast.error('File size must be less than 2MB')
			return
		}

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file')
			return
		}

		setUploading(true)

		// First, create a local preview immediately
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

			// Save base64 image to localStorage immediately for persistence across refreshes
			if (user?._id) {
				const savedImageKey = `userImage_${user._id}`
				localStorage.setItem(savedImageKey, base64Image)
				console.log(
					'Base64 image saved to localStorage with key:',
					savedImageKey
				)
			}
		}
		reader.readAsDataURL(file)

		// Then try to upload to server in background
		try {
			console.log('Calling uploadProfileImage API function...')
			const result = await uploadProfileImage(file)
			console.log('Upload successful:', result)
			console.log('result.user.photoUrl:', result.user.photoUrl)
			console.log('result.imageUrl:', result.imageUrl)

			// Server upload successful - we can keep the base64 image since server images have CORS issues
			// Save the server URL to localStorage for reference
			if (user?._id) {
				const userProfileKey = `userProfile_${user._id}`
				const currentProfile = JSON.parse(
					localStorage.getItem(userProfileKey) || '{}'
				)
				localStorage.setItem(
					userProfileKey,
					JSON.stringify({
						...currentProfile,
						serverPhotoUrl: result.user.photoUrl || result.imageUrl, // Server URL for reference
						photoUrl: formData.photoUrl, // Keep base64 for display
					})
				)
				console.log('Saved to localStorage with key:', userProfileKey)
			}

			toast.success('Profile image uploaded successfully!')
		} catch (error) {
			console.error('Server upload failed:', error)

			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error'
			console.log('Error message:', errorMessage)

			// Show error but keep the local preview
			if (
				errorMessage.includes('Failed to fetch') ||
				errorMessage.includes('NetworkError')
			) {
				toast.error(
					'Network error: Image saved locally, will sync when server is available'
				)
			} else if (
				errorMessage.includes('401') ||
				errorMessage.includes('authenticate')
			) {
				toast.error('Authentication error: Image saved locally')
			} else {
				toast.error('Server upload failed: Image saved locally')
			}
		} finally {
			setUploading(false)
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
			<div className='min-h-screen bg-gradient-to-br bg-slate-900'>
				<div className='w-full max-w-6xl mx-auto p-6'>
					<div className='animate-pulse space-y-6'>
						<div className='h-64 bg-slate-900/80 rounded-lg'></div>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<div className='h-48 bg-slate-900/50 rounded-lg'></div>
							<div className='h-48 bg-slate-900/50 rounded-lg'></div>
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
										src={getImageUrl(formData.photoUrl || user?.photoUrl)}
										alt={user?.name || user?.username}
										className='object-cover'
										onLoad={() =>
											console.log(
												'Image loaded successfully:',
												getImageUrl(formData.photoUrl || user?.photoUrl)
											)
										}
										onError={e => {
											console.log(
												'Image failed to load:',
												getImageUrl(formData.photoUrl || user?.photoUrl)
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

											{/* Profile Image */}
											<div className='space-y-4'>
												<div className='flex items-center gap-3'>
													<div className='w-6 h-6 rounded-lg bg-gradient-to-r from-indigo-700 to-purple-700 flex items-center justify-center shadow-lg'>
														<UserIcon className='w-3 h-3 text-white' />
													</div>
													<h3 className='text-lg font-bold text-white'>
														Profile Image
													</h3>
												</div>
												<div className='flex flex-col items-center space-y-4 p-4 bg-slate-900/40 rounded-2xl border border-blue-600/30 backdrop-blur-sm'>
													{formData.photoUrl && (
														<div className='relative group'>
															<div className='absolute -inset-2 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-full blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300'></div>
															<Avatar className='relative w-24 h-24 border-4 border-blue-600/60 shadow-2xl'>
																<AvatarImage
																	src={getImageUrl(formData.photoUrl)}
																	alt='Preview'
																	className='object-cover'
																/>
																<AvatarFallback className='bg-gradient-to-br from-blue-700 to-indigo-700 text-white'>
																	<UserIcon className='w-8 h-8' />
																</AvatarFallback>
															</Avatar>
														</div>
													)}
													<div>
														<input
															type='file'
															accept='image/*'
															onChange={handleImageUpload}
															className='hidden'
															id='image-upload'
														/>
														<Label
															htmlFor='image-upload'
															className='cursor-pointer inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-blue-700 to-indigo-700 text-white hover:from-indigo-700 hover:to-purple-700 h-10 px-4 py-2 shadow-lg transform hover:scale-105'
														>
															{uploading
																? '⏳ Uploading...'
																: '📸 Choose Image'}
														</Label>
													</div>
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
												<div className='flex flex-wrap gap-2 mb-4'>
													{formData.skills.map((skill, index) => (
														<Badge
															key={index}
															variant='secondary'
															className='cursor-pointer bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-600/50 rounded-full px-3 py-1 text-sm font-medium transform hover:scale-105 transition-all duration-200'
															onClick={() => removeSkill(skill)}
														>
															{skill} ❌
														</Badge>
													))}
												</div>
												<div className='flex gap-3'>
													<Input
														placeholder='Add a skill and press Enter...'
														onKeyPress={(
															e: React.KeyboardEvent<HTMLInputElement>
														) => {
															if (e.key === 'Enter') {
																e.preventDefault()
																addSkill(e.currentTarget.value)
																e.currentTarget.value = ''
															}
														}}
														className='bg-slate-900/60 border-blue-600/40 text-white placeholder:text-blue-300/60 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-10 shadow-inner backdrop-blur-sm'
													/>
												</div>
											</div>

											{/* Emergency Contact */}
											<div className='space-y-4'>
												<div className='flex items-center gap-3'>
													<div className='w-6 h-6 rounded-lg bg-gradient-to-r from-pink-700 to-red-700 flex items-center justify-center shadow-lg'>
														<Phone className='w-3 h-3 text-white' />
													</div>
													<h3 className='text-lg font-bold text-white'>
														Emergency Contact
													</h3>
												</div>
												<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
													<div className='space-y-2'>
														<Label
															htmlFor='emergency-name'
															className='text-sm text-blue-200 font-medium'
														>
															👤 Name
														</Label>
														<Input
															id='emergency-name'
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
															placeholder='Contact name'
															className='bg-slate-900/60 border-blue-600/40 text-white placeholder:text-blue-300/60 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-10 shadow-inner backdrop-blur-sm'
														/>
													</div>
													<div className='space-y-2'>
														<Label
															htmlFor='emergency-phone'
															className='text-sm text-blue-200 font-medium'
														>
															📞 Phone
														</Label>
														<Input
															id='emergency-phone'
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
															placeholder='Contact phone'
															className='bg-slate-900/60 border-blue-600/40 text-white placeholder:text-blue-300/60 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-10 shadow-inner backdrop-blur-sm'
														/>
													</div>
													<div className='space-y-2'>
														<Label
															htmlFor='emergency-relationship'
															className='text-sm text-blue-200 font-medium'
														>
															❤️ Relationship
														</Label>
														<Input
															id='emergency-relationship'
															value={formData.emergencyContact.relationship}
															onChange={e =>
																setFormData(prev => ({
																	...prev,
																	emergencyContact: {
																		...prev.emergencyContact,
																		relationship: e.target.value,
																	},
																}))
															}
															placeholder='Relationship'
															className='bg-slate-900/60 border-blue-600/40 text-white placeholder:text-blue-300/60 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-10 shadow-inner backdrop-blur-sm'
														/>
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
