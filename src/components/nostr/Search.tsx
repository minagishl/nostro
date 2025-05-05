'use client';

import { useState } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import { Timeline } from './Timeline';

export default function Search() {
  const [query, setQuery] = useState('');
  const searchEvents = useNostrStore((state) => state.searchEvents);
  const searchResults = useNostrStore((state) => state.searchResults);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchEvents(query);
    }
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="mb-6 flex gap-2 rounded-lg bg-white p-4 shadow dark:bg-gray-800"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts..."
          className="flex-1 rounded border border-gray-300 bg-white p-2 text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 dark:text-white"
        >
          Search
        </button>
      </form>
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
