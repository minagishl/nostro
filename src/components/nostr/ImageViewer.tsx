import React, { useState, useEffect } from 'react';

interface ImageViewerProps {
	urls: string[];
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ urls }) => {
	if (!urls || urls.length === 0) return null;
	const [isExpanded, setIsExpanded] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	};

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (isExpanded && (e.key === 'Escape' || e.key === 'Esc')) {
				setIsExpanded(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isExpanded]);

	const handleLoad = () => {
		setIsLoading(false);
	};

	const handleError = () => {
		setIsLoading(false);
		setHasError(true);
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

	const validUrls = urls.filter(isValidImageUrl);
	if (validUrls.length === 0) return null;

	if (isExpanded) {
		return (
			<div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75'>
				<div className='relative w-[calc(100%-4rem)] h-[calc(100%-4rem)] max-w-[90vw] max-h-[90vh]'>
					<button
						className='absolute -top-3 -right-3 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2'
						onClick={toggleExpand}
					>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							className='h-6 w-6'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M6 18L18 6M6 6l12 12'
							/>
						</svg>
					</button>
					<img
						src={validUrls[0]}
						alt='Full size'
						className='w-full h-full object-contain'
						onLoad={handleLoad}
						onError={handleError}
					/>
					{isLoading && (
						<div className='absolute inset-0 flex items-center justify-center'>
							<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
						</div>
					)}
				</div>
				<div className='fixed inset-0' onClick={toggleExpand} />
			</div>
		);
	}

	return (
		<div className='mt-2 grid gap-2'>
			{validUrls.length === 1 && (
				<div className='relative'>
					{isLoading && (
						<div className='absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg'>
							<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
						</div>
					)}
					{hasError ? (
						<div className='p-4 text-sm text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg'>
							Failed to load image
						</div>
					) : (
						<img
							src={validUrls[0]}
							alt='Post attachment'
							className='rounded-lg max-h-64 w-full object-contain cursor-pointer hover:opacity-90 bg-black'
							onClick={toggleExpand}
							onLoad={handleLoad}
							onError={handleError}
						/>
					)}
				</div>
			)}

			{validUrls.length > 1 && (
				<div className='grid gap-2'>
					{validUrls.length % 2 === 0 ? (
						<div className='grid grid-cols-2 gap-2'>
							{validUrls.map((url, index) => (
								<img
									key={index}
									src={url}
									alt={`Post attachment ${index + 1}`}
									className='rounded-lg h-64 w-full object-cover cursor-pointer hover:opacity-90 bg-black'
									onClick={toggleExpand}
									onLoad={handleLoad}
									onError={handleError}
								/>
							))}
						</div>
					) : (
						<>
							<div className='grid grid-cols-2 gap-2'>
								{validUrls.slice(0, validUrls.length - 1).map((url, index) => (
									<img
										key={index}
										src={url}
										alt={`Post attachment ${index + 1}`}
										className='rounded-lg h-64 w-full object-cover cursor-pointer hover:opacity-90 bg-black'
										onClick={toggleExpand}
										onLoad={handleLoad}
										onError={handleError}
									/>
								))}
							</div>
							<img
								src={validUrls[validUrls.length - 1]}
								alt={`Post attachment ${validUrls.length}`}
								className='rounded-lg h-64 w-full object-cover cursor-pointer hover:opacity-90 bg-black'
								onClick={toggleExpand}
								onLoad={handleLoad}
								onError={handleError}
							/>
						</>
					)}
				</div>
			)}
		</div>
	);
};
