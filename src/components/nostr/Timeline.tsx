import React, { useEffect, useRef, useState } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import { type Event as NostrEvent } from 'nostr-tools';
import { Post } from './Post';

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
    unsubscribe,
    publishReaction,
  } = useNostrStore();
  const events = propEvents || storeEvents;
  const [displayCount, setDisplayCount] = useState(10);
  const observerRef = useRef<HTMLDivElement>(null);
  const displayEvents = events.slice(0, displayCount);
  const [replyingTo, setReplyingTo] = useState<NostrEvent | null>(null);
  const [usernameCacheMap, setUsernameCacheMap] = useState<Record<string, string>>({});
  const [profileImageCacheMap, setProfileImageCacheMap] = useState<Record<string, string>>({});
  const [repostedEventsState, setRepostedEventsState] = useState<Record<string, NostrEvent>>({});
  const [showEmojiPickerId, setShowEmojiPickerId] = useState<string | null>(null);
  const emojiOptions = ['👍', '❤️', '😂', '🙌', '🎉', '😮', '😢', '🔥'];

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
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [loadEvents, loadFollowing, publicKey, unsubscribe]);

  useEffect(() => {
    // This effect loads profile information and updates the username and profile image cache
    const loadProfiles = async () => {
      // Get all pubkeys from both the original events and repost events
      const allPubkeys = new Set<string>();

      // Add pubkeys from all events
      displayEvents.forEach((event) => {
        // Add the event author's pubkey
        allPubkeys.add(event.pubkey);

        // If it's a repost, add the original author's pubkey
        if (event.kind === 6) {
          const originalEvent = repostedEventsState[event.id] || repostEvents[event.id];
          if (originalEvent?.pubkey) {
            allPubkeys.add(originalEvent.pubkey);
          }
        }
      });

      const newCache = { ...usernameCacheMap };
      const newImageCache = { ...profileImageCacheMap };

      for (const pubkey of allPubkeys) {
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
          <Post
            key={event.id}
            event={event}
            originalEvent={originalEvent}
            getUserDisplayName={getUserDisplayName}
            getUserProfileImage={getUserProfileImage}
            formatDate={formatDate}
            onReply={(e) => setReplyingTo(e)}
            onRepost={repostNote}
            onReact={publishReaction}
            replyingToId={replyingTo?.id}
            onCloseReply={() => setReplyingTo(null)}
            showRepostInfo={true}
            showReaction={true}
            emojiOptions={emojiOptions}
            showEmojiPickerId={showEmojiPickerId}
            setShowEmojiPickerId={setShowEmojiPickerId}
          />
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
