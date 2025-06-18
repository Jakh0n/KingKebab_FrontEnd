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

	// If trying to access login or register page with token
	if ((pathname === '/login' || pathname === '/register') && token) {
		return NextResponse.redirect(new URL('/dashboard', request.url))
	}

	return NextResponse.next()
}

// Middleware qaysi path larda ishlashini ko'rsatish
export const config = {
	matcher: ['/', '/dashboard/:path*', '/admin/:path*', '/login', '/register'],
}
