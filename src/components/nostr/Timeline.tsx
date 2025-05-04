import React, { useEffect, useRef, useState } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import { type Event as NostrEvent } from 'nostr-tools';
import Link from 'next/link';
import { MediaViewer } from './MediaViewer';
import { extractMediaUrls, formatContent } from '@/utils/content';

interface TimelineProps {
	events?: NostrEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events: propEvents }) => {
	const { events: storeEvents, loadEvents } = useNostrStore();
	const events = propEvents || storeEvents;
	const [displayCount, setDisplayCount] = useState(10);
	const observerRef = useRef<HTMLDivElement>(null);
	const displayEvents = events.slice(0, displayCount);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry.isIntersecting && events.length > displayCount) {
					setDisplayCount((prev) => prev + 10);
				}
			},
			{ threshold: 0.5 }
		);

		if (observerRef.current) {
			observer.observe(observerRef.current);
		}

		return () => observer.disconnect();
	}, [displayCount, events.length]);

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
			{displayEvents.map((event) => (
				<div key={event.id} className='bg-white dark:bg-gray-800 rounded-lg shadow p-4'>
					<div className='flex justify-between items-start mb-2'>
						<div className='flex flex-col'>
							<Link
								href={`/profile/${event.pubkey}`}
								className='text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
							>
								{event.pubkey.slice(0, 4)}...{event.pubkey.slice(-4)}
							</Link>
						</div>
						<div className='text-sm text-gray-500 dark:text-gray-400'>
							{formatDate(event.created_at)}
						</div>
					</div>
					<>
						<div
							className='text-gray-900 dark:text-white whitespace-pre-wrap break-words overflow-wrap-anywhere'
							dangerouslySetInnerHTML={{ __html: formatContent(event.content) }}
						/>
						{extractMediaUrls(event.content).length > 0 && (
							<MediaViewer urls={extractMediaUrls(event.content)} />
						)}
					</>
				</div>
			))}
			<div ref={observerRef} className='h-10' />
			{displayEvents.length === 0 && (
				<div className='text-center text-gray-500 dark:text-gray-400 py-8'>
					No posts yet. Be the first to post!
				</div>
			)}
		</div>
	);
};
