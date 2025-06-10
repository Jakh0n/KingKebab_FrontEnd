import { ApiError, AuthResponse, TimeEntry, TimeEntryFormData } from '@/types'
import Cookies from 'js-cookie'

const API_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	'https://kingkebab-backend.onrender.com/api'

async function handleResponse<T>(response: Response): Promise<T> {
	const data = await response.json()
	if (!response.ok) {
		const errorMessage = (data as ApiError).message || "Noma'lum xato yuz berdi"
		throw new Error(errorMessage)
	}
	return data as T
}

export async function login(
	username: string,
	password: string
): Promise<AuthResponse> {
	const response = await fetch(`${API_URL}/auth/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ username, password }),
	})
	const data = await handleResponse<AuthResponse>(response)

	// Token va position ni localStorage va cookie ga saqlash
	localStorage.setItem('token', data.token)
	localStorage.setItem('position', data.position)
	Cookies.set('token', data.token, { expires: 1 }) // 1 kunlik cookie

	return data
}

export async function register(
	username: string,
	password: string,
	position: string
): Promise<AuthResponse> {
	const response = await fetch(`${API_URL}/auth/register`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ username, password, position }),
	})
	const data = await handleResponse<AuthResponse>(response)

	// Token va position ni localStorage va cookie ga saqlash
	localStorage.setItem('token', data.token)
	localStorage.setItem('position', data.position)
	Cookies.set('token', data.token, { expires: 1 }) // 1 kunlik cookie

	return data
}

export async function addTimeEntry(
	data: TimeEntryFormData
): Promise<TimeEntry> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	// Ma'lumotlarni tekshirish
	if (!data.startTime || !data.endTime || !data.date) {
		throw new Error("Barcha maydonlarni to'ldiring")
	}

	// Vaqtlarni to'g'ri formatga o'tkazish
	const formattedData = {
		...data,
		startTime: data.startTime,
		endTime: data.endTime,
		date: data.date,
	}

	console.log('Sending data:', formattedData)

	const response = await fetch(`${API_URL}/time`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(formattedData),
	})

	return handleResponse<TimeEntry>(response)
}

export async function getMyTimeEntries(): Promise<TimeEntry[]> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/time/my-entries`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
	return handleResponse<TimeEntry[]>(response)
}

export async function getAllTimeEntries(): Promise<TimeEntry[]> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	const response = await fetch(`${API_URL}/time/all`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
	return handleResponse<TimeEntry[]>(response)
}

export async function downloadWorkerPDF(
	userId: string,
	month: number,
	year: number
) {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('No token found')

	const response = await fetch(
		`${API_URL}/time/worker-pdf/${userId}/${month}/${year}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	)

	if (!response.ok) {
		throw new Error('Failed to download PDF')
	}

	const blob = await response.blob()
	const url = window.URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url

	// Get filename from Content-Disposition header
	const contentDisposition = response.headers.get('Content-Disposition')
	let filename = `worker-time-${userId}-${month}-${year}.pdf`

	if (contentDisposition) {
		const filenameMatch = contentDisposition.match(/filename="(.+)"/)
		if (filenameMatch) {
			filename = filenameMatch[1]
		}
	}

	a.download = filename
	document.body.appendChild(a)
	a.click()
	window.URL.revokeObjectURL(url)
	document.body.removeChild(a)
}

export async function downloadMyPDF(month: number, year: number) {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('No token found')

	const response = await fetch(`${API_URL}/time/my-pdf/${month}/${year}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})

	if (!response.ok) {
		throw new Error('Failed to download PDF')
	}

	const blob = await response.blob()
	const url = window.URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url

	// Get filename from Content-Disposition header
	const contentDisposition = response.headers.get('Content-Disposition')
	let filename = `my-time-${month}-${year}.pdf`

	if (contentDisposition) {
		const filenameMatch = contentDisposition.match(/filename="(.+)"/)
		if (filenameMatch) {
			filename = filenameMatch[1]
		}
	}

	a.download = filename
	document.body.appendChild(a)
	a.click()
	window.URL.revokeObjectURL(url)
	document.body.removeChild(a)
}

export async function deleteTimeEntry(entryId: string): Promise<void> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('No token found')

	const response = await fetch(`${API_URL}/time/${entryId}`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})

	if (!response.ok) {
		throw new Error("O'chirishda xatolik yuz berdi")
	}
}

export async function updateTimeEntry(
	id: string,
	data: TimeEntryFormData
): Promise<TimeEntry> {
	const token = localStorage.getItem('token')
	if (!token) throw new Error('Not authenticated')

	// Ma'lumotlarni tekshirish
	if (!data.startTime || !data.endTime || !data.date) {
		throw new Error("Barcha maydonlarni to'ldiring")
	}

	// Vaqtlarni to'g'ri formatga o'tkazish
	const formattedData = {
		...data,
		startTime: data.startTime,
		endTime: data.endTime,
		date: data.date,
	}

	const response = await fetch(`${API_URL}/time/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(formattedData),
	})

	return handleResponse<TimeEntry>(response)
}

// Logout funksiyasini qo'shamiz
export function logout() {
	localStorage.removeItem('token')
	localStorage.removeItem('position')
	Cookies.remove('token')
}

export async function registerWorker(data: {
	username: string
	password: string
	position: string
	isAdmin: boolean
}) {
	try {
		const token = localStorage.getItem('token')
		if (!token) throw new Error('No token found')

		const response = await fetch(`${API_URL}/auth/register`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(data),
		})

		const responseData = await response.json()

		if (!response.ok) {
			throw new Error(responseData.message || 'Failed to register worker')
		}

		return responseData
	} catch (error) {
		console.error('Registration error:', error)
		throw error
	}
}
