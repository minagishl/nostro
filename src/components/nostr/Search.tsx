'use client';

import { useState } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import { Timeline } from './Timeline';

export default function Search() {
	const [query, setQuery] = useState('');
	const searchEvents = useNostrStore((state) => state.searchEvents);
	const events = useNostrStore((state) => state.events);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (query.trim()) {
			searchEvents(query);
		}
	};

	return (
		<div className='w-full p-4'>
			<form onSubmit={handleSubmit} className='flex gap-2'>
				<input
					type='text'
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder='Search posts...'
					className='flex-1 p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
				/>
				<button
					type='submit'
					className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
				>
					Search
				</button>
			</form>
			<div className='mt-4'>
				{events.length > 0 ? (
					<Timeline events={events} />
				) : (
					<p className='text-gray-500 dark:text-gray-400 text-center'>No results found</p>
				)}
			</div>
		</div>
	);
}
