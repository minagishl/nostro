import { Layout } from '@/components/layout/Layout';

export default function NotFound() {
	return (
		<Layout>
			<div className='text-center py-12'>
				<h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>Profile Not Found</h2>
				<p className='text-gray-600 dark:text-gray-400 mb-6'>
					The profile you&apos;re looking for doesn&apos;t exist or couldn&apos;t be found.
				</p>
				<a href='/' className='text-blue-500 hover:text-blue-600 dark:hover:text-blue-400'>
					Return to Home
				</a>
			</div>
		</Layout>
	);
}
