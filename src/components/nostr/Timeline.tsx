import React, { useEffect, useRef, useState } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import { type Event as NostrEvent } from 'nostr-tools';
import Link from 'next/link';
import { MediaViewer } from './MediaViewer';
import { extractMediaUrls, formatContent } from '@/utils/content';
import { ReplyForm } from './ReplyForm';

interface TimelineProps {
  events?: NostrEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events: propEvents }) => {
  const {
    events: storeEvents,
    loadEvents,
    loadFollowing,
    loadProfile,
    profiles,
    publicKey,
    repostNote,
  } = useNostrStore();
  const events = propEvents || storeEvents;
  const [displayCount, setDisplayCount] = useState(10);
  const observerRef = useRef<HTMLDivElement>(null);
  const displayEvents = events.slice(0, displayCount);
  const [replyingTo, setReplyingTo] = useState<NostrEvent | null>(null);
  const [usernameCacheMap, setUsernameCacheMap] = useState<Record<string, string>>({});

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

  useEffect(() => {
    // This effect loads profile information and updates the username cache
    const loadProfiles = async () => {
      const uniquePubkeys = [...new Set(displayEvents.map((event) => event.pubkey))];

      const newCache = { ...usernameCacheMap };

      for (const pubkey of uniquePubkeys) {
        // Load profile only if it doesn't exist in the cache
        if (!usernameCacheMap[pubkey] && !profiles[pubkey]) {
          await loadProfile(pubkey);
        }

        // Update the cache if profile information is available
        if (profiles[pubkey] && !usernameCacheMap[pubkey]) {
          const username = profiles[pubkey].name || `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
          newCache[pubkey] = username;
        }
      }

      // Update state only if the cache has changed
      if (Object.keys(newCache).length > Object.keys(usernameCacheMap).length) {
        setUsernameCacheMap(newCache);
      }
    };

    loadProfiles();
  }, [displayEvents, loadProfile, profiles, usernameCacheMap]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getUserDisplayName = (pubkey: string) => {
    if (usernameCacheMap[pubkey]) {
      return usernameCacheMap[pubkey];
    }

    if (profiles[pubkey]?.name) {
      setUsernameCacheMap((prev) => ({ ...prev, [pubkey]: profiles[pubkey].name! }));
      return profiles[pubkey].name;
    }

    return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
  };

  return (
    <div className="space-y-4">
      {displayEvents.map((event) => (
        <div
          key={event.id}
          className="mb-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="flex flex-col">
            <div className="p-4">
              <div className="flex gap-3">
                <div className="h-12 w-12 flex-shrink-0 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <Link
                      href={`/profile/${event.pubkey}`}
                      className="text-[15px] font-semibold text-gray-900 no-underline hover:underline dark:text-gray-100"
                    >
                      {getUserDisplayName(event.pubkey)}
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
            <div className="flex items-center gap-4 border-t border-gray-200 px-4 py-2 dark:border-gray-700">
              <button
                onClick={() => setReplyingTo(event)}
                className="flex items-center gap-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                Reply
              </button>
              <button
                onClick={() => repostNote(event)}
                className="flex items-center gap-2 text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 1l4 4-4 4" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <path d="M7 23l-4-4 4-4" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                Repost
              </button>
            </div>
            {replyingTo?.id === event.id && (
              <ReplyForm replyTo={event} onClose={() => setReplyingTo(null)} />
            )}
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
