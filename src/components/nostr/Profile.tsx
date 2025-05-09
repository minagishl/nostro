import React, { useEffect, useState } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import type { Event } from 'nostr-tools';
import { formatContent } from '@/utils/content';
import { Post } from './Post';
import { Copy } from 'lucide-react';

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
          : 'bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700'
      }`}
    >
      {isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
};

const formatDisplayIdentifier = (identifier: string | undefined, pubkey: string): string => {
  // If it's a NIP-05 identifier, show it
  if (identifier && !identifier.startsWith('_@')) {
    return identifier;
  }

  // For all other cases (including pubkey), show abbreviated version
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
};

export const Profile: React.FC<ProfileProps> = ({ pubkey }) => {
  const {
    profiles,
    loadProfile,
    loadUserEvents,
    events,
    repostNote,
    bookmarks,
    loadBookmarks,
    updateBookmarks,
  } = useNostrStore();
  const [replyingTo, setReplyingTo] = useState<Event | null>(null);

  useEffect(() => {
    loadProfile(pubkey);
    loadUserEvents(pubkey);
  }, [pubkey, loadProfile, loadUserEvents]);

  const profile = profiles[pubkey];
  const userEvents = events.filter((event: Event) => event.pubkey === pubkey);

  // Functions for displaying name, image, and date in the profile
  const getUserDisplayName = (pubkey: string) =>
    profiles[pubkey]?.name || `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
  const getUserProfileImage = (pubkey: string) => profiles[pubkey]?.picture || '';
  const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleString();
  const [showEmojiPickerId, setShowEmojiPickerId] = useState<string | null>(null);

  // Bookmark: use kind 30001 from useNostrStore
  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);
  const handleToggleBookmark = (eventId: string) => {
    const isBookmarked = bookmarks.includes(eventId);
    updateBookmarks(eventId, !isBookmarked);
  };

  const handleCopyPubkey = async () => {
    try {
      await navigator.clipboard.writeText(pubkey);
    } catch (err) {
      console.error('Failed to copy pubkey:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden border-b border-gray-200 shadow-sm dark:border-gray-700">
          <div className="p-6">
            <div className="flex items-start space-x-4">
              {profile?.picture ? (
                <img
                  src={profile.picture}
                  alt={profile?.name || 'Profile'}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full">
                  <span className="text-2xl text-gray-400 dark:text-gray-500">👤</span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                  {profile?.name || 'Anonymous'}
                  {profile?.nip05 && (
                    <span className="text-sm font-normal text-indigo-500" title="Verified name">
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
                  <div className="flex items-center gap-2">
                    <code className="flex space-x-2 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                      <span>{formatDisplayIdentifier(undefined, pubkey)}</span>
                      <button
                        onClick={handleCopyPubkey}
                        className="cursor-pointer items-center text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400"
                        title="Copy full pubkey"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </code>
                  </div>
                  <FollowButton targetPubkey={pubkey} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex w-full">
            <button className="relative items-center justify-center px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              Recent Posts
            </button>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {userEvents.map((event) => (
                <Post
                  key={event.id}
                  event={event}
                  getUserDisplayName={getUserDisplayName}
                  getUserProfileImage={getUserProfileImage}
                  formatDate={formatDate}
                  onReply={(e) => setReplyingTo(e)}
                  onRepost={repostNote}
                  onReact={async (emoji, targetEvent) => {
                    await useNostrStore.getState().publishReaction(emoji, targetEvent);
                  }}
                  replyingToId={replyingTo?.id}
                  onCloseReply={() => setReplyingTo(null)}
                  showRepostInfo={false}
                  showReaction={true}
                  emojiOptions={['👍', '❤️', '😂', '🙌', '🎉', '😮', '😢', '🔥']}
                  showEmojiPickerId={showEmojiPickerId}
                  setShowEmojiPickerId={setShowEmojiPickerId}
                  isBookmarked={bookmarks.includes(event.id)}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
              {userEvents.length === 0 && (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  No posts yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
