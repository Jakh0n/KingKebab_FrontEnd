import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
	const token = request.cookies.get('token')?.value
	const { pathname } = request.nextUrl

	// Protected routes (routes that require authentication)
	const protectedRoutes = ['/dashboard', '/admin']

	// If trying to access protected route without token
	if (protectedRoutes.some(route => pathname.startsWith(route)) && !token) {
		return NextResponse.redirect(new URL('/login', request.url))
	}

	// If trying to access login, register, or root page with token
	if (
		(pathname === '/login' || pathname === '/register' || pathname === '/') &&
		token
	) {
		try {
			// Decode JWT token to check user role
			const payload = JSON.parse(atob(token.split('.')[1]))

			// Redirect based on user role
			if (payload.isAdmin) {
				return NextResponse.redirect(new URL('/admin', request.url))
			} else {
				return NextResponse.redirect(new URL('/dashboard', request.url))
			}
		} catch {
			// If token is invalid, clear it and allow access to login
			const response = NextResponse.next()
			response.cookies.delete('token')
			return response
		}
	}

	return NextResponse.next()
}

// Middleware qaysi path larda ishlashini ko'rsatish
export const config = {
	matcher: ['/', '/dashboard/:path*', '/admin/:path*', '/login', '/register'],
}
