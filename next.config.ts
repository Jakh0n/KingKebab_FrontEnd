import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	headers: async () => [
		{
			source: '/:path*',
			headers: [
				{
					key: 'X-Frame-Options',
					value: 'DENY',
				},
				{
					key: 'X-Content-Type-Options',
					value: 'nosniff',
				},
				{
					key: 'Referrer-Policy',
					value: 'strict-origin-when-cross-origin',
				},
				{
					key: 'X-XSS-Protection',
					value: '1; mode=block',
				},
				{
					key: 'Content-Security-Policy',
					value:
						"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://kingkebab-backend.onrender.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://kingkebab-backend.onrender.com; font-src 'self'; frame-ancestors 'none';",
				},
			],
		},
	],
	poweredByHeader: false,
}

export default nextConfig
