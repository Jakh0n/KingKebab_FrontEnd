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
	],
	poweredByHeader: false,
	// Add output configuration for static export if needed
	output: 'standalone',
	// Ensure images are optimized
	images: {
		domains: ['localhost', 'your-backend-domain.com'],
		unoptimized: false,
	},
	// Add experimental features for better performance
	experimental: {
		optimizeCss: true,
	},
}

export default nextConfig
