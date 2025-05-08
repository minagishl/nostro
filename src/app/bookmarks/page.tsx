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
        <div className="border-b border-gray-200 px-4 py-2.5 dark:border-gray-700">
          <h1 className="font-medium text-gray-900 dark:text-gray-100">Bookmarks</h1>
        </div>
        <Timeline events={bookmarkedEvents} />
        {bookmarkedEvents.length === 0 && (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">No bookmarks yet.</div>
        )}
      </div>
    </Layout>
  );
}
