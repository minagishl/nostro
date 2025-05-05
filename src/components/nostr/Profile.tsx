import React, { useEffect, useState } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import type { Event } from 'nostr-tools';
import { MediaViewer } from './MediaViewer';
import { extractMediaUrls, formatContent } from '@/utils/content';
import { ReplyForm } from './ReplyForm';

interface ProfileProps {
  pubkey: string;
  displayIdentifier?: string;
}

interface FollowButtonProps {
  targetPubkey: string;
}

const FollowButton: React.FC<FollowButtonProps> = ({ targetPubkey }) => {
  const { publicKey, following, followUser, unfollowUser } = useNostrStore();
  const isFollowing = following.includes(targetPubkey);

  if (!publicKey || publicKey === targetPubkey) return null;

  const handleClick = async () => {
    if (isFollowing) {
      await unfollowUser(targetPubkey);
    } else {
      await followUser(targetPubkey);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`rounded px-4 py-2 text-sm font-semibold ${
        isFollowing
          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
      }`}
    >
      {isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
};

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
  const { profiles, loadProfile, loadUserEvents, events, repostNote } = useNostrStore();
  const [replyingTo, setReplyingTo] = useState<Event | null>(null);

  useEffect(() => {
    loadProfile(pubkey);
    loadUserEvents(pubkey);
  }, [pubkey, loadProfile, loadUserEvents]);

  const profile = profiles[pubkey];
  const userEvents = events.filter((event: Event) => event.pubkey === pubkey);

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <div className="flex items-start space-x-4">
          {profile?.picture && (
            <img
              src={profile.picture}
              alt={profile?.name || 'Profile'}
              className="h-16 w-16 rounded-full object-cover"
            />
          )}
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
              {profile?.name || 'Anonymous'}
              {profile?.nip05 && (
                <span className="text-sm font-normal text-blue-500" title="Verified name">
                  ✓ {formatDisplayIdentifier(profile.nip05, pubkey)}
                </span>
              )}
            </h2>
            {profile?.about && (
              <p
                className="mt-2 leading-relaxed break-words whitespace-pre-wrap text-gray-600 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: formatContent(profile.about) }}
              />
            )}
            <div className="mt-2 flex items-center justify-between">
              <code className="text-sm text-gray-500 dark:text-gray-400">
                {formatDisplayIdentifier(displayIdentifier, pubkey)}
              </code>
              <FollowButton targetPubkey={pubkey} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Posts</h3>
        {userEvents.map((event) => (
          <div key={event.id} className="rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="p-4">
              <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                {new Date(event.created_at * 1000).toLocaleString()}
              </div>
              <div
                className="whitespace-pre-wrap text-gray-900 dark:text-white"
                dangerouslySetInnerHTML={{ __html: formatContent(event.content) }}
              />
              {extractMediaUrls(event.content).length > 0 && (
                <div className="mt-3">
                  <MediaViewer urls={extractMediaUrls(event.content)} />
                </div>
              )}
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
        ))}
        {userEvents.length === 0 && (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">No posts yet.</div>
        )}
      </div>
    </div>
  );
};
