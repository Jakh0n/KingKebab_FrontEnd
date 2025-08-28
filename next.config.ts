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
			],
		},
		{
			source: '/sw.js',
			headers: [
				{
					key: 'Cache-Control',
					value: 'no-cache, no-store, must-revalidate',
				},
				{
					key: 'Pragma',
					value: 'no-cache',
				},
				{
					key: 'Expires',
					value: '0',
				},
			],
		},
	],
	poweredByHeader: false,
}

export default nextConfig
