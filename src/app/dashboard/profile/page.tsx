'use client'

import UserProfile from '@/components/shared/UserProfile'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
	const router = useRouter()

	return (
		<main className='min-h-screen bg-[#0A0E1A] text-white p-4'>
			<div className='max-w-4xl mx-auto space-y-6'>
				{/* Header */}
				<div className='flex items-center justify-between bg-[#0E1422] p-4 rounded-lg'>
					<div className='flex items-center gap-4'>
						<Button
							onClick={() => router.back()}
							variant='outline'
							size='sm'
							className='bg-transparent border-[#4E7BEE]/20 text-[#4E7BEE] hover:bg-[#4E7BEE]/10'
						>
							<ArrowLeft className='w-4 h-4 mr-2' />
							Back
						</Button>
						<Image
							src='/cropped-kinglogo.avif'
							alt='King Kebab Logo'
							className='w-10 h-10 object-contain'
							width={100}
							height={100}
						/>
						<div>
							<h1 className='text-2xl font-bold text-white'>User Profile</h1>
							<p className='text-gray-400 text-sm'>
								Manage your profile information
							</p>
						</div>
					</div>
				</div>

				{/* Profile Component */}
				<div className='flex justify-center'>
					<UserProfile />
				</div>
			</div>
		</main>
	)
}
