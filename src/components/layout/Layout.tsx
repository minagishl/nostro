import React from 'react';
import Link from 'next/link';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	return (
		<div className='min-h-screen bg-gray-100 dark:bg-gray-900'>
			<header className='bg-white dark:bg-gray-800 shadow'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
					<div className='flex justify-between items-center'>
						<Link href='/'>
							<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Nostro</h1>
						</Link>
						<nav>
							<Link
								href='/search'
								className='text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
							>
								Search
							</Link>
						</nav>
					</div>
				</div>
			</header>
			<main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
				<div className='px-4 py-6 sm:px-0'>{children}</div>
			</main>
		</div>
	);
};
