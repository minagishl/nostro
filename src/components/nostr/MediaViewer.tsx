import React, { useState, useEffect } from 'react';

interface MediaViewerProps {
	urls: string[];
}

type MediaType = 'image' | 'video' | 'unknown';

const getMediaType = (url: string): MediaType => {
	try {
		const parsedUrl = new URL(url);
		const ext = parsedUrl.pathname.split('.').pop()?.toLowerCase();
		if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
		if (['mp4', 'webm', 'mov'].includes(ext || '')) return 'video';
		return 'unknown';
	} catch {
		return 'unknown';
	}
};

interface MediaItemProps {
	url: string;
	type: MediaType;
	onLoad: () => void;
	onError: () => void;
	onClick: () => void;
	isExpanded?: boolean;
}

const MediaItem: React.FC<MediaItemProps> = ({
	url,
	type,
	onLoad,
	onError,
	onClick,
	isExpanded = false,
}) => {
	const [hasError, setHasError] = React.useState(false);
	const elementRef = React.useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = React.useState(false);

	// First useEffect for media loading
	React.useEffect(() => {
		const handleLoad = () => {
			onLoad();
		};
		if (isVisible || isExpanded) {
			if (type === 'image') {
				const img = new Image();
				img.onload = handleLoad;
				img.onerror = () => {
					setHasError(true);
					onError();
				};
				img.src = url;
			} else if (type === 'video') {
				const video = document.createElement('video');
				video.onloadeddata = handleLoad;
				video.onerror = onError;
				video.src = url;
			}
		}
	}, [isVisible, isExpanded, type, url, onLoad, onError]);

	// Second useEffect for intersection observer
	React.useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.1 }
		);

		if (elementRef.current) {
			observer.observe(elementRef.current);
		}

		return () => observer.disconnect();
	}, []);

	// Render logic
	if (hasError) {
		return (
			<div className='p-4 text-sm text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg'>
				Failed to load media
			</div>
		);
	}

	if (!isVisible && !isExpanded) {
		return (
			<div
				ref={elementRef}
				className='h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse'
			/>
		);
	}

	if (type === 'image') {
		return (
			<img
				src={url}
				alt='Media content'
				className={
					isExpanded
						? 'w-full h-full object-contain'
						: 'rounded-lg max-h-64 w-full object-contain cursor-pointer hover:opacity-90 bg-black'
				}
				onClick={onClick}
				onLoad={onLoad}
				onError={() => {
					setHasError(true);
					onError();
				}}
			/>
		);
	}

	if (type === 'video') {
		return (
			<video
				src={url}
				className='rounded-lg max-h-64 w-full object-contain bg-black'
				onClick={() => {}}
				onLoadedData={onLoad}
				onError={onError}
				controls
				poster={url + '#t=0.001'} // Show first frame as poster
				playsInline
				preload='metadata'
			/>
		);
	}

	return null;
};

export const MediaViewer: React.FC<MediaViewerProps> = ({ urls }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	};

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (isExpanded && (e.key === 'Escape' || e.key === 'Esc')) {
				setIsExpanded(false);
			}
		};

		// Control body scroll
		if (isExpanded) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			document.body.style.overflow = '';
		};
	}, [isExpanded]);

	if (!urls || urls.length === 0) return null;

	const validUrls = urls.filter((url) => getMediaType(url) !== 'unknown');
	if (validUrls.length === 0) return null;

	// If it's a video, do not expand
	if (isExpanded && getMediaType(validUrls[0]) === 'image') {
		return (
			<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/75'>
				<div className='relative w-screen h-screen p-8'>
					<button
						className='absolute top-8 right-8 text-white bg-black/50 hover:bg-black/75 rounded-full p-2'
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
					<MediaItem
						url={validUrls[0]}
						type='image'
						onLoad={() => {}}
						onError={() => {}}
						onClick={() => {}}
						isExpanded={true}
					/>
				</div>
				<div className='fixed inset-0' onClick={toggleExpand} />
			</div>
		);
	}

	return (
		<div className='mt-2 grid gap-2'>
			{validUrls.length === 1 && (
				<div className='relative'>
					<MediaItem
						url={validUrls[0]}
						type={getMediaType(validUrls[0])}
						onLoad={() => {}}
						onError={() => {}}
						onClick={getMediaType(validUrls[0]) === 'image' ? toggleExpand : () => {}}
					/>
				</div>
			)}

			{validUrls.length > 1 && (
				<div className='grid gap-2'>
					{validUrls.length % 2 === 0 ? (
						<div className='grid grid-cols-2 gap-2'>
							{validUrls.map((url, index) => (
								<MediaItem
									key={index}
									url={url}
									type={getMediaType(url)}
									onLoad={() => {}}
									onError={() => {}}
									onClick={getMediaType(url) === 'image' ? toggleExpand : () => {}}
								/>
							))}
						</div>
					) : (
						<>
							<div className='grid grid-cols-2 gap-2'>
								{validUrls.slice(0, validUrls.length - 1).map((url, index) => (
									<MediaItem
										key={index}
										url={url}
										type={getMediaType(url)}
										onLoad={() => {}}
										onError={() => {}}
										onClick={getMediaType(url) === 'image' ? toggleExpand : () => {}}
									/>
								))}
							</div>
							<MediaItem
								url={validUrls[validUrls.length - 1]}
								type={getMediaType(validUrls[validUrls.length - 1])}
								onLoad={() => {}}
								onError={() => {}}
								onClick={
									getMediaType(validUrls[validUrls.length - 1]) === 'image'
										? toggleExpand
										: () => {}
								}
							/>
						</>
					)}
				</div>
			)}
		</div>
	);
};
