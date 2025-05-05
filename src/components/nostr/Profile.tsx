import React, { useEffect } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import type { Event } from 'nostr-tools';
import { MediaViewer } from './MediaViewer';
import { extractMediaUrls, formatContent } from '@/utils/content';

interface ProfileProps {
  pubkey: string;
  displayIdentifier?: string;
}

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
  const { profiles, loadProfile, loadUserEvents, events } = useNostrStore();

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
                className="mt-2 text-gray-600 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: formatContent(profile.about) }}
              />
            )}
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <code>{formatDisplayIdentifier(displayIdentifier, pubkey)}</code>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Posts</h3>
        {userEvents.map((event) => (
          <div key={event.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              {new Date(event.created_at * 1000).toLocaleString()}
            </div>
            <>
              <div
                className="whitespace-pre-wrap text-gray-900 dark:text-white"
                dangerouslySetInnerHTML={{ __html: formatContent(event.content) }}
              />
              {extractMediaUrls(event.content).length > 0 && (
                <MediaViewer urls={extractMediaUrls(event.content)} />
              )}
            </>
          </div>
        ))}
        {userEvents.length === 0 && (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">No posts yet.</div>
        )}
      </div>
    </div>
  );
};
