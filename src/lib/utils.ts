import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export async function sendTelegramMessage(message: string) {
	const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
	const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID

	if (!botToken || !chatId) {
		throw new Error('Bot token yoki chat ID topilmadi!')
	}

	const url = `https://api.telegram.org/bot${botToken}/sendMessage`

	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: chatId,
			text: message,
			parse_mode: 'HTML',
		}),
	})

	if (!res.ok) {
		const err = await res.json()
		throw new Error('Telegramga yuborishda xatolik: ' + JSON.stringify(err))
	}

	return await res.json()
}
