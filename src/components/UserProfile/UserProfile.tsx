import { OurFileRouter } from '@/app/api/uploadthing/core'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserProfile as UserProfileType } from '@/types/user'
import { generateReactHelpers } from '@uploadthing/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

const { useUploadThing } = generateReactHelpers<OurFileRouter>()

interface UserProfileProps {
	profile: UserProfileType
	onUpdate: (data: { name?: string; photoUrl?: string }) => Promise<void>
}

export function UserProfile({ profile, onUpdate }: UserProfileProps) {
	const [isEditing, setIsEditing] = useState(false)
	const [name, setName] = useState(profile.name)
	const [isUploading, setIsUploading] = useState(false)

	const { startUpload } = useUploadThing('imageUploader')

	const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files?.[0]) return

		try {
			setIsUploading(true)
			const file = e.target.files[0]
			const uploadResponse = await startUpload([file])
			const res = uploadResponse?.[0]

			if (res?.url) {
				await onUpdate({ photoUrl: res.url })
				toast.success('Profile photo updated successfully')
			}
		} catch (error) {
			toast.error('Failed to upload photo')
			console.error(error)
		} finally {
			setIsUploading(false)
		}
	}

	const handleSave = async () => {
		try {
			await onUpdate({ name })
			setIsEditing(false)
			toast.success('Profile updated successfully')
		} catch (error) {
			toast.error('Failed to update profile')
			console.error(error)
		}
	}

	return (
		<Card className='w-full max-w-2xl mx-auto'>
			<CardHeader>
				<CardTitle>Profile Information</CardTitle>
			</CardHeader>
			<CardContent className='space-y-6'>
				<div className='flex flex-col items-center space-y-4'>
					<div className='relative'>
						<Avatar className='h-24 w-24'>
							<AvatarImage src={profile.photoUrl} alt={profile.name} />
							<AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
						</Avatar>
						<div className='absolute bottom-0 right-0'>
							<Input
								type='file'
								accept='image/*'
								className='hidden'
								id='photo-upload'
								onChange={handlePhotoUpload}
								disabled={isUploading}
							/>
							<Label
								htmlFor='photo-upload'
								className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-2 cursor-pointer'
							>
								{isUploading ? 'Uploading...' : 'Edit'}
							</Label>
						</div>
					</div>
				</div>

				<div className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='name'>Name</Label>
						{isEditing ? (
							<Input
								id='name'
								value={name}
								onChange={e => setName(e.target.value)}
							/>
						) : (
							<p className='text-lg font-medium'>{profile.name}</p>
						)}
					</div>

					<div className='space-y-2'>
						<Label>Username</Label>
						<p className='text-lg font-medium'>{profile.username}</p>
					</div>

					<div className='space-y-2'>
						<Label>Employee ID</Label>
						<p className='text-lg font-medium'>{profile.employeeId}</p>
					</div>

					<div className='flex justify-end space-x-2 pt-4'>
						{isEditing ? (
							<>
								<Button variant='outline' onClick={() => setIsEditing(false)}>
									Cancel
								</Button>
								<Button onClick={handleSave}>Save</Button>
							</>
						) : (
							<Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
