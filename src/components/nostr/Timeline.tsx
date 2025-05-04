import React, { useEffect } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import Link from 'next/link';

export const Timeline: React.FC = () => {
	const { events, loadEvents } = useNostrStore();

	useEffect(() => {
		loadEvents();
		const interval = setInterval(loadEvents, 10000); // Refresh every 10 seconds
		return () => clearInterval(interval);
	}, [loadEvents]);

	const formatDate = (timestamp: number) => {
		return new Date(timestamp * 1000).toLocaleString();
	};

	return (
		<div className='space-y-4'>
			{events.map((event) => (
				<div key={event.id} className='bg-white dark:bg-gray-800 rounded-lg shadow p-4'>
					<div className='flex justify-between items-start mb-2'>
						<Link
							href={`/profile/${event.pubkey}`}
							className='font-mono text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
						>
							{event.pubkey.slice(0, 8)}...{event.pubkey.slice(-8)}
						</Link>
						<div className='text-sm text-gray-500 dark:text-gray-400'>
							{formatDate(event.created_at)}
						</div>
					</div>
					<div className='text-gray-900 dark:text-white whitespace-pre-wrap'>{event.content}</div>
				</div>
			))}
			{events.length === 0 && (
				<div className='text-center text-gray-500 dark:text-gray-400 py-8'>
					No posts yet. Be the first to post!
				</div>
			)}
		</div>
	);
};
