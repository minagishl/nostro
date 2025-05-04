import React, { useEffect } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import type { Event } from 'nostr-tools';
import { ImageViewer } from './ImageViewer';
import { extractImageUrls, formatContent } from '@/utils/content';

interface ProfileProps {
	pubkey: string;
	displayIdentifier?: string;
}

const formatDisplayIdentifier = (identifier: string | undefined, pubkey: string): string => {
	if (!identifier) {
		return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
	}
	// If it's just a domain (e.g., "_@example.com"), show only the domain
	if (identifier.startsWith('_@')) {
		return identifier.slice(2);
	}
	return identifier;
};

export const Profile: React.FC<ProfileProps> = ({ pubkey, displayIdentifier }) => {
	const { profiles, loadProfile, events } = useNostrStore();

	useEffect(() => {
		loadProfile(pubkey);
	}, [pubkey, loadProfile]);

	const profile = profiles[pubkey];
	const userEvents = events.filter((event: Event) => event.pubkey === pubkey);

	return (
		<div className='space-y-6'>
			<div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
				<div className='flex items-center space-x-4'>
					{profile?.picture && (
						<img
							src={profile.picture}
							alt={profile?.name || 'Profile'}
							className='w-16 h-16 rounded-full object-cover'
						/>
					)}
					<div>
						<h2 className='text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2'>
							{profile?.name || 'Anonymous'}
							{profile?.nip05 && (
								<span className='text-sm font-normal text-blue-500' title='Verified name'>
									✓ {formatDisplayIdentifier(profile.nip05, pubkey)}
								</span>
							)}
						</h2>
						{profile?.about && (
							<p className='text-gray-600 dark:text-gray-300 mt-2'>{profile.about}</p>
						)}
						<div className='text-sm text-gray-500 dark:text-gray-400 mt-2'>
							<code>{formatDisplayIdentifier(displayIdentifier, pubkey)}</code>
						</div>
					</div>
				</div>
			</div>

			<div className='space-y-4'>
				<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Recent Posts</h3>
				{userEvents.map((event) => (
					<div key={event.id} className='bg-white dark:bg-gray-800 rounded-lg shadow p-4'>
						<div className='text-sm text-gray-500 dark:text-gray-400 mb-2'>
							{new Date(event.created_at * 1000).toLocaleString()}
						</div>
						<>
							<div
								className='text-gray-900 dark:text-white whitespace-pre-wrap'
								dangerouslySetInnerHTML={{ __html: formatContent(event.content) }}
							/>
							{extractImageUrls(event.content).map((url, index) => (
								<ImageViewer key={`${event.id}-img-${index}`} url={url} />
							))}
						</>
					</div>
				))}
				{userEvents.length === 0 && (
					<div className='text-center text-gray-500 dark:text-gray-400 py-8'>No posts yet.</div>
				)}
			</div>
		</div>
	);
};
