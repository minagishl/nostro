import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';

export default function About() {
	return (
		<Layout>
			<div className='w-full'>
				<div className='flex flex-col rounded-xl shadow-lg p-8 mb-10 bg-white dark:bg-gray-800 w-full space-y-6'>
					<h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>About Nostro</h2>
					<div className='space-y-6'>
						<div className='space-y-2'>
							<h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>Developer</h3>
							<Link
								href='https://github.com/minagishl'
								target='_blank'
								rel='noopener noreferrer'
								className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
							>
								@minagishl
							</Link>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}
