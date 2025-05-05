import React, { useState, useEffect, useRef } from 'react';

// types
interface MediaViewerProps {
	urls: string[];
}

type MediaType = 'image' | 'video' | 'unknown';

// utilities
export const getMediaType = (url: string): MediaType => {
	try {
		// Remove query parameters from URL before parsing
		const urlWithoutQuery = url.split('?')[0];
		const parsed = new URL(urlWithoutQuery);
		const ext = parsed.pathname.split('.').pop()?.toLowerCase();
		if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
		if (['mp4', 'webm', 'mov'].includes(ext || '')) return 'video';
		return 'unknown';
	} catch {
		// If URL parsing fails, return 'unknown'
		console.error('Invalid URL:', url);
		return 'unknown';
	}
};

// hooks
function useIntersectionObserver(
	ref: React.RefObject<Element | null>,
	options: IntersectionObserverInit = {}
): boolean {
	const [isIntersecting, setIntersecting] = useState(false);

	useEffect(() => {
		if (!ref.current) return;
		const obs = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) {
				setIntersecting(true);
				obs.disconnect();
			}
		}, options);
		obs.observe(ref.current);

		return () => obs.disconnect();
	}, [ref, options]);

	return isIntersecting;
}

// lock scroll
function useBodyScrollLock(active: boolean) {
	useEffect(() => {
		document.body.style.overflow = active ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	}, [active]);
}

// MediaItem
interface MediaItemProps {
	url: string;
	onLoad: () => void;
	onError: () => void;
	onClick?: () => void;
	isExpanded?: boolean;
}
const MediaItem: React.FC<MediaItemProps> = ({
	url,
	onLoad,
	onError,
	onClick = () => {},
	isExpanded = false,
}) => {
	const type = getMediaType(url);
	const ref = useRef<HTMLDivElement>(null);
	const visible = useIntersectionObserver(ref, { threshold: 0.1 });
	const [error, setError] = useState(false);

	useEffect(() => {
		if (!visible && !isExpanded) return;

		if (type === 'image') {
			const img = new Image();
			img.onload = onLoad;
			img.onerror = () => {
				setError(true);
				onError();
			};
			img.src = url;
		} else if (type === 'video') {
			const video = document.createElement('video');
			video.onloadeddata = onLoad;
			video.onerror = onError;
			video.src = url;
		}
	}, [visible, isExpanded, type, url, onLoad, onError]);

	if (error) {
		return (
			<div className='p-4 text-sm text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg'>
				Failed to load media
			</div>
		);
	}

	if (!visible && !isExpanded) {
		return <div ref={ref} className='h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse' />;
	}

	if (type === 'image') {
		return (
			<img
				src={url}
				alt='Media content'
				className={
					isExpanded
						? 'w-full h-full object-contain'
						: 'rounded-lg max-h-64 h-full w-full object-contain cursor-pointer hover:opacity-90 bg-black'
				}
				onClick={onClick}
				onLoad={onLoad}
				onError={() => {
					setError(true);
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
				onLoadedData={onLoad}
				onError={onError}
				controls
				poster={`${url}#t=0.001`}
				playsInline
				preload='metadata'
			/>
		);
	}

	return null;
};

// Thumbnail Grid
interface GridProps {
	urls: string[];
	onThumbnailClick: (index: number) => void;
}
const ThumbnailGrid: React.FC<GridProps> = ({ urls, onThumbnailClick }) => {
	const count = urls.length;
	const isEven = count % 2 === 0;

	if (count === 1) {
		return (
			<MediaItem
				url={urls[0]}
				onLoad={() => {}}
				onError={() => {}}
				onClick={() => onThumbnailClick(0)}
			/>
		);
	}

	if (isEven) {
		return (
			<div className='grid grid-cols-2 gap-2'>
				{urls.map((url, i) => (
					<MediaItem
						key={i}
						url={url}
						onLoad={() => {}}
						onError={() => {}}
						onClick={() => onThumbnailClick(i)}
					/>
				))}
			</div>
		);
	}

	return (
		<>
			<div className='grid grid-cols-2 gap-2'>
				{urls.slice(0, count - 1).map((url, i) => (
					<MediaItem
						key={i}
						url={url}
						onLoad={() => {}}
						onError={() => {}}
						onClick={() => onThumbnailClick(i)}
					/>
				))}
			</div>
			<MediaItem
				url={urls[count - 1]}
				onLoad={() => {}}
				onError={() => {}}
				onClick={() => onThumbnailClick(count - 1)}
			/>
		</>
	);
};

// Main Viewer
export const MediaViewer: React.FC<MediaViewerProps> = ({ urls }) => {
	const validUrls = urls.filter((u) => getMediaType(u) !== 'unknown');
	const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
	const isExpanded = expandedIdx !== null;

	useBodyScrollLock(isExpanded);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (isExpanded && (e.key === 'Escape' || e.key === 'Esc')) {
				setExpandedIdx(null);
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [isExpanded]);

	if (!validUrls.length) return null;

	const handleThumbnailClick = (idx: number) => setExpandedIdx(idx);
	const closeExpanded = () => setExpandedIdx(null);

	return (
		<>
			{isExpanded && getMediaType(validUrls[expandedIdx!]) === 'image' && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/75'>
					<div className='relative w-screen h-screen p-8'>
						<button
							className='absolute top-8 right-8 size-10 text-white bg-black/50 hover:bg-black/75 rounded-full p-2 cursor-pointer'
							onClick={closeExpanded}
						>
							✕
						</button>
						<MediaItem
							url={validUrls[expandedIdx!]}
							onLoad={() => {}}
							onError={() => {}}
							isExpanded
						/>
					</div>
					<div className='fixed inset-0' onClick={closeExpanded} />
				</div>
			)}
			<div className='mt-2 grid gap-2'>
				<ThumbnailGrid urls={validUrls} onThumbnailClick={handleThumbnailClick} />
			</div>
		</>
	);
};
