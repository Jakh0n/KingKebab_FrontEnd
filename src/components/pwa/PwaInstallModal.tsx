'use client'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	detectPlatform,
	isInstallDismissed,
	isPwaInstalled,
	markInstallDismissed,
	type BeforeInstallPromptEvent,
	type DevicePlatform,
} from '@/lib/pwa'
import { Download, Plus, Share, Smartphone, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

export function PwaInstallModal() {
	const [open, setOpen] = useState(false)
	const [platform, setPlatform] = useState<DevicePlatform>('desktop')
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null)

	useEffect(() => {
		if (isPwaInstalled() || isInstallDismissed()) return

		setPlatform(detectPlatform())
		setOpen(true)

		const handleBeforeInstall = (event: Event) => {
			event.preventDefault()
			setDeferredPrompt(event as BeforeInstallPromptEvent)
		}

		const handleAppInstalled = () => {
			setDeferredPrompt(null)
			setOpen(false)
		}

		window.addEventListener('beforeinstallprompt', handleBeforeInstall)
		window.addEventListener('appinstalled', handleAppInstalled)

		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
			window.removeEventListener('appinstalled', handleAppInstalled)
		}
	}, [])

	const handleInstall = async () => {
		if (!deferredPrompt) return

		try {
			await deferredPrompt.prompt()
			const choice = await deferredPrompt.userChoice
			if (choice.outcome === 'accepted') {
				setOpen(false)
			}
			setDeferredPrompt(null)
		} catch {
			setDeferredPrompt(null)
		}
	}

	const handleDismiss = () => {
		markInstallDismissed()
		setOpen(false)
	}

	if (isPwaInstalled()) return null

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 sm:mx-0'>
						<Smartphone className='h-6 w-6 text-primary' />
					</div>
					<DialogTitle>Install King Kebab app</DialogTitle>
					<DialogDescription>
						Add King Kebab to your home screen for faster access, a full-screen
						experience, and one-tap login at the start of every shift.
					</DialogDescription>
				</DialogHeader>

				<ul className='space-y-2 text-sm text-muted-foreground'>
					<li className='flex items-center gap-2'>
						<Zap className='h-4 w-4 text-primary' />
						Opens instantly — no browser tabs to search.
					</li>
					<li className='flex items-center gap-2'>
						<Smartphone className='h-4 w-4 text-primary' />
						Full-screen, app-like experience.
					</li>
					<li className='flex items-center gap-2'>
						<Download className='h-4 w-4 text-primary' />
						Works offline for already-visited pages.
					</li>
				</ul>

				{platform === 'ios' && <IosInstructions />}
				{platform === 'android' && !deferredPrompt && <AndroidInstructions />}
				{platform === 'desktop' && !deferredPrompt && <DesktopInstructions />}

				<DialogFooter>
					<Button variant='ghost' onClick={handleDismiss}>
						Maybe later
					</Button>
					{deferredPrompt ? (
						<Button onClick={handleInstall}>
							<Download className='h-4 w-4' />
							Install
						</Button>
					) : (
						<Button onClick={handleDismiss}>Got it</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

function IosInstructions() {
	return (
		<InstructionList title='On iPhone / iPad (Safari):'>
			<InstructionStep index={1}>
				Tap the <Share className='inline h-4 w-4 align-text-bottom' /> Share
				button in the bottom toolbar.
			</InstructionStep>
			<InstructionStep index={2}>
				Choose <span className='font-medium'>Add to Home Screen</span>
				<Plus className='inline h-4 w-4 align-text-bottom' />.
			</InstructionStep>
			<InstructionStep index={3}>
				Tap <span className='font-medium'>Add</span> in the top-right corner.
			</InstructionStep>
		</InstructionList>
	)
}

function AndroidInstructions() {
	return (
		<InstructionList title='On Android (Chrome):'>
			<InstructionStep index={1}>
				Open the browser menu (three dots, top-right).
			</InstructionStep>
			<InstructionStep index={2}>
				Tap <span className='font-medium'>Install app</span> or{' '}
				<span className='font-medium'>Add to Home screen</span>.
			</InstructionStep>
			<InstructionStep index={3}>
				Confirm with <span className='font-medium'>Install</span>.
			</InstructionStep>
		</InstructionList>
	)
}

function DesktopInstructions() {
	return (
		<InstructionList title='On desktop (Chrome / Edge):'>
			<InstructionStep index={1}>
				Click the install icon in the address bar.
			</InstructionStep>
			<InstructionStep index={2}>
				Or open the browser menu and choose{' '}
				<span className='font-medium'>Install King Kebab</span>.
			</InstructionStep>
		</InstructionList>
	)
}

interface InstructionListProps {
	title: string
	children: React.ReactNode
}

function InstructionList({ title, children }: InstructionListProps) {
	return (
		<div className='rounded-md border bg-muted/40 p-3'>
			<p className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
				{title}
			</p>
			<ol className='space-y-1.5 text-sm text-foreground'>{children}</ol>
		</div>
	)
}

interface InstructionStepProps {
	index: number
	children: React.ReactNode
}

function InstructionStep({ index, children }: InstructionStepProps) {
	return (
		<li className='flex gap-2'>
			<span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground'>
				{index}
			</span>
			<span className='leading-5'>{children}</span>
		</li>
	)
}
