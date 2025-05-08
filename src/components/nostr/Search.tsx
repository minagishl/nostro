'use client';

import { useState } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import { Timeline } from './Timeline';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts..."
          className="flex-1"
        />
        <Button type="submit">Search</Button>
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
