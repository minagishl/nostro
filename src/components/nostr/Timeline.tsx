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
    repostEvents,
    getRepostedEvent,
  } = useNostrStore();
  const events = propEvents || storeEvents;
  const [displayCount, setDisplayCount] = useState(10);
  const observerRef = useRef<HTMLDivElement>(null);
  const displayEvents = events.slice(0, displayCount);
  const [replyingTo, setReplyingTo] = useState<NostrEvent | null>(null);
  const [usernameCacheMap, setUsernameCacheMap] = useState<Record<string, string>>({});
  const [profileImageCacheMap, setProfileImageCacheMap] = useState<Record<string, string>>({});
  const [repostedEventsState, setRepostedEventsState] = useState<Record<string, NostrEvent>>({});

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
    // This effect loads profile information and updates the username and profile image cache
    const loadProfiles = async () => {
      const uniquePubkeys = [
        ...new Set([
          ...displayEvents.map((event) => event.pubkey),
          ...displayEvents
            .filter((event) => event.kind === 6)
            .map((event) => {
              const originalEvent = repostedEventsState[event.id] || repostEvents[event.id];
              return originalEvent?.pubkey;
            })
            .filter(Boolean),
        ]),
      ];

      const newCache = { ...usernameCacheMap };
      const newImageCache = { ...profileImageCacheMap };

      for (const pubkey of uniquePubkeys) {
        // Load profile only if it doesn't exist in the cache
        if ((!usernameCacheMap[pubkey] || !profileImageCacheMap[pubkey]) && !profiles[pubkey]) {
          await loadProfile(pubkey);
        }

        // Update the cache if profile information is available
        if (profiles[pubkey]) {
          if (!usernameCacheMap[pubkey]) {
            const username = profiles[pubkey].name || `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
            newCache[pubkey] = username;
          }

          if (!profileImageCacheMap[pubkey] && profiles[pubkey].picture) {
            newImageCache[pubkey] = profiles[pubkey].picture!;
          }
        }
      }

      // Update state only if the cache has changed
      if (Object.keys(newCache).length > Object.keys(usernameCacheMap).length) {
        setUsernameCacheMap(newCache);
      }

      if (Object.keys(newImageCache).length > Object.keys(profileImageCacheMap).length) {
        setProfileImageCacheMap(newImageCache);
      }
    };

    loadProfiles();
  }, [
    displayEvents,
    loadProfile,
    profiles,
    usernameCacheMap,
    profileImageCacheMap,
    repostedEventsState,
    repostEvents,
  ]);

  useEffect(() => {
    const fetchRepostedEvents = async () => {
      const repostsToFetch = displayEvents.filter((event) => event.kind === 6);

      const newRepostedEvents = { ...repostedEventsState };

      for (const repost of repostsToFetch) {
        if (repostedEventsState[repost.id] || repostEvents[repost.id]) continue;

        const originalEvent = await getRepostedEvent(repost);
        if (originalEvent) {
          newRepostedEvents[repost.id] = originalEvent;

          if (!profiles[originalEvent.pubkey]) {
            await loadProfile(originalEvent.pubkey);
          }
        }
      }

      if (Object.keys(newRepostedEvents).length > 0) {
        setRepostedEventsState((prev) => ({ ...prev, ...newRepostedEvents }));
      }
    };

    fetchRepostedEvents();
  }, [displayEvents, getRepostedEvent, profiles, loadProfile, repostedEventsState, repostEvents]);

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

  const getUserProfileImage = (pubkey: string) => {
    if (profileImageCacheMap[pubkey]) {
      return profileImageCacheMap[pubkey];
    }

    if (profiles[pubkey]?.picture) {
      setProfileImageCacheMap((prev) => ({ ...prev, [pubkey]: profiles[pubkey].picture! }));
      return profiles[pubkey].picture;
    }

    return '';
  };

  const getOriginalEvent = (repostEvent: NostrEvent): NostrEvent | undefined => {
    return repostedEventsState[repostEvent.id] || repostEvents[repostEvent.id];
  };

  const isRepost = (event: NostrEvent): boolean => {
    return event.kind === 6;
  };

  return (
    <div className="space-y-4">
      {displayEvents.map((event) => {
        const originalEvent = isRepost(event) ? getOriginalEvent(event) : undefined;

        return (
          <div
            key={event.id}
            className="mb-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
          >
            {isRepost(event) && originalEvent && (
              <div className="flex items-center gap-2 px-4 pt-2 text-sm text-gray-500 dark:text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
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
                <Link href={`/profile/${event.pubkey}`} className="font-semibold hover:underline">
                  {getUserDisplayName(event.pubkey)}
                </Link>
                reposted
              </div>
            )}

            <div className="flex flex-col">
              <div className="p-4">
                <div className="flex gap-3">
                  <Link
                    href={`/profile/${isRepost(event) && originalEvent ? originalEvent.pubkey : event.pubkey}`}
                    className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-200 dark:bg-gray-700"
                  >
                    {getUserProfileImage(
                      isRepost(event) && originalEvent ? originalEvent.pubkey : event.pubkey,
                    ) ? (
                      <img
                        src={getUserProfileImage(
                          isRepost(event) && originalEvent ? originalEvent.pubkey : event.pubkey,
                        )}
                        alt={`${getUserDisplayName(isRepost(event) && originalEvent ? originalEvent.pubkey : event.pubkey)}'s profile`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <Link
                        href={`/profile/${isRepost(event) && originalEvent ? originalEvent.pubkey : event.pubkey}`}
                        className="text-[15px] font-semibold text-gray-900 no-underline hover:underline dark:text-gray-100"
                      >
                        {getUserDisplayName(
                          isRepost(event) && originalEvent ? originalEvent.pubkey : event.pubkey,
                        )}
                      </Link>
                      <span className="text-sm text-gray-400 dark:text-gray-500">
                        {formatDate(
                          isRepost(event) && originalEvent
                            ? originalEvent.created_at
                            : event.created_at,
                        )}
                      </span>
                    </div>
                    <div
                      className="mt-1 text-[15px] leading-relaxed break-words whitespace-pre-wrap text-gray-900 dark:text-gray-100"
                      dangerouslySetInnerHTML={{
                        __html: formatContent(
                          isRepost(event) && originalEvent ? originalEvent.content : event.content,
                        ),
                      }}
                    />
                    {extractMediaUrls(
                      isRepost(event) && originalEvent ? originalEvent.content : event.content,
                    ).length > 0 && (
                      <div className="mt-3">
                        <MediaViewer
                          urls={extractMediaUrls(
                            isRepost(event) && originalEvent
                              ? originalEvent.content
                              : event.content,
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 border-t border-gray-200 px-4 py-2 dark:border-gray-700">
                <button
                  onClick={() =>
                    setReplyingTo(isRepost(event) && originalEvent ? originalEvent : event)
                  }
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
                  onClick={() =>
                    repostNote(isRepost(event) && originalEvent ? originalEvent : event)
                  }
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
              {replyingTo?.id ===
                (isRepost(event) && originalEvent ? originalEvent.id : event.id) && (
                <ReplyForm
                  replyTo={isRepost(event) && originalEvent ? originalEvent : event}
                  onClose={() => setReplyingTo(null)}
                />
              )}
            </div>
          </div>
        );
      })}
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
