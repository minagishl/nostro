import React, { useState } from 'react';

interface ImageViewerProps {
	url: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ url }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	};

	// Basic image URL validation
	const isValidImageUrl = (url: string): boolean => {
		try {
			const parsedUrl = new URL(url);
			const ext = parsedUrl.pathname.split('.').pop()?.toLowerCase();
			return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
		} catch {
			return false;
		}
	};

	if (!isValidImageUrl(url)) {
		return null;
	}

	if (isExpanded) {
		return (
			<div
				className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75'
				onClick={toggleExpand}
			>
				<img src={url} alt='Full size' className='max-h-screen max-w-screen p-4 object-contain' />
			</div>
		);
	}

	return (
		<div className='mt-2'>
			<img
				src={url}
				alt='Post attachment'
				className='rounded-lg max-h-64 cursor-pointer hover:opacity-90'
				onClick={toggleExpand}
			/>
		</div>
	);
};
