import React, { useState, useEffect } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import Link from 'next/link';

export const PostForm: React.FC = () => {
	const [content, setContent] = useState('');
	const { publicKey, generateKeys, publishNote, loadProfile, profiles } = useNostrStore();

	// Remove the useEffect for auto-loading profile

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!content.trim()) return;

		await publishNote(content);
		setContent('');
	};

	return (
		<div className='bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6'>
			{publicKey && profiles[publicKey] && (
				<div className='flex items-center space-x-4 mb-4'>
					{profiles[publicKey].picture && (
						<img
							src={profiles[publicKey].picture}
							alt={profiles[publicKey].name || 'Profile'}
							className='w-10 h-10 rounded-full object-cover'
						/>
					)}
					<Link
						href={`/profile/${publicKey}`}
						className='text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400'
					>
						{profiles[publicKey].name || 'Anonymous'}
					</Link>
				</div>
			)}
			{!publicKey ? (
				<button
					onClick={generateKeys}
					className='w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded'
				>
					Generate Keys to Start Posting
				</button>
			) : (
				<form onSubmit={handleSubmit}>
					<textarea
						value={content}
						onChange={(e) => setContent(e.target.value)}
						className='w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white'
						placeholder="What's on your mind?"
						rows={3}
					/>
					<button
						type='submit'
						className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded'
						disabled={!content.trim()}
					>
						Post
					</button>
				</form>
			)}
		</div>
	);
};
