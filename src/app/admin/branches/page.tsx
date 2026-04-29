'use client'

import { ModeToggle } from '@/components/ui/mode-toggle'
import { Button } from '@/components/ui/button'
import { getTokenOrNull } from '@/lib/auth'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import BranchManager from '../components/BranchManager'

export default function AdminBranchesPage() {
	const router = useRouter()

	useEffect(() => {
		if (!getTokenOrNull()) {
			router.push('/login')
		}
	}, [router])

	return (
		<main className='min-h-screen bg-[#0E1422] px-4 py-6 sm:px-6 lg:px-8'>
			<div className='mx-auto max-w-7xl space-y-6'>
				<div className='flex items-center justify-between gap-3'>
					<Button
						asChild
						variant='outline'
						className='bg-transparent text-white hover:bg-[#1A1F2E] hover:text-white'
					>
						<Link href='/admin'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back to Admin
						</Link>
					</Button>
					<ModeToggle compact />
				</div>
				<BranchManager />
			</div>
		</main>
	)
}
