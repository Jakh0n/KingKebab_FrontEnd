import Link from 'next/link'

const Footer = () => {
	return (
		<footer className='bg-gray-900 py-6'>
			<div className='container mx-auto px-4'>
				<div className='flex justify-between items-center'>
					<p className='text-gray-500 text-sm'>
						© {new Date().getFullYear()} King Kebab
					</p>

					<div className='flex items-center gap-4'>
						<Link
							href='https://www.linkedin.com/in/jakhon-yokubov/'
							target='_blank'
							className='px-4 py-1.5 border rounded-full text-sm transition-all duration-300 text-gray-500'
						>
							By Jakhon Yokubov
						</Link>
					</div>
				</div>
			</div>
		</footer>
	)
}

export default Footer
