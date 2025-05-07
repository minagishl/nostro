import React, { useEffect, useState } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import type { Event } from 'nostr-tools';
import { formatContent } from '@/utils/content';
import { Post } from './Post';

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

  // Functions for displaying name, image, and date in the profile
  const getUserDisplayName = (pubkey: string) =>
    profiles[pubkey]?.name || `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
  const getUserProfileImage = (pubkey: string) => profiles[pubkey]?.picture || '';
  const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleString();
  const [showEmojiPickerId, setShowEmojiPickerId] = useState<string | null>(null);

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
          />
        ))}
        {userEvents.length === 0 && (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">No posts yet.</div>
        )}
      </div>
    </div>
  );
};
