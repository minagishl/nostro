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
  const { events: storeEvents, loadEvents, loadFollowing, publicKey } = useNostrStore();
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
      { threshold: 0.5 },
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [displayCount, events.length]);

  useEffect(() => {
    const init = async () => {
      if (publicKey) {
        await loadFollowing();
      }
      await loadEvents();
    };

    init();
    const interval = setInterval(loadEvents, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [loadEvents, loadFollowing, publicKey]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="space-y-4">
      {displayEvents.map((event) => (
        <div
          key={event.id}
          className="mb-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="p-4">
            <div className="flex gap-3">
              <div className="h-12 w-12 flex-shrink-0 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <Link
                    href={`/profile/${event.pubkey}`}
                    className="text-[15px] font-semibold text-gray-900 no-underline hover:underline dark:text-gray-100"
                  >
                    {event.pubkey.slice(0, 8)}...{event.pubkey.slice(-8)}
                  </Link>
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    {formatDate(event.created_at)}
                  </span>
                </div>
                <div
                  className="mt-1 text-[15px] leading-relaxed break-words whitespace-pre-wrap text-gray-900 dark:text-gray-100"
                  dangerouslySetInnerHTML={{ __html: formatContent(event.content) }}
                />
                {extractMediaUrls(event.content).length > 0 && (
                  <div className="mt-3">
                    <MediaViewer urls={extractMediaUrls(event.content)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      <div ref={observerRef} className="h-10" />
      {displayEvents.length === 0 && (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          {publicKey
            ? 'There are no posts from users you follow. Try following new users!'
            : 'Log in to see posts from users you follow.'}
        </div>
      )}
    </div>
  );
};
