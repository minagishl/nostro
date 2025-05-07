'use client';

import { useEffect, useMemo } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import { Timeline } from '@/components/nostr/Timeline';
import { Layout } from '@/components/layout/Layout';

export default function BookmarksPage() {
  const { bookmarks, loadBookmarks, events } = useNostrStore();

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // Extract events that match the bookmark IDs
  const bookmarkedEvents = useMemo(
    () => events.filter((e) => bookmarks.includes(e.id)),
    [events, bookmarks],
  );

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Bookmarked Posts</h2>
        <Timeline events={bookmarkedEvents} />
        {bookmarkedEvents.length === 0 && (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">No bookmarks yet.</div>
        )}
      </div>
    </Layout>
  );
}
