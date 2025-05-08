'use client';

import { useEffect } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import { Timeline } from './Timeline';

type SearchProps = {
  query: string;
};

export default function Search({ query }: SearchProps) {
  const searchEvents = useNostrStore((state) => state.searchEvents);
  const searchResults = useNostrStore((state) => state.searchResults);

  useEffect(() => {
    if (query) {
      searchEvents(query);
    }
  }, [query, searchEvents]);

  return (
    <div className="w-full">
      <div className="mt-4">
        {searchResults.length > 0 ? (
          <Timeline events={searchResults} />
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">No results found</p>
        )}
      </div>
    </div>
  );
}
