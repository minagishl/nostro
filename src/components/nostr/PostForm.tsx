import React, { useState } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import Link from 'next/link';

export const PostForm: React.FC = () => {
  const [content, setContent] = useState('');
  const { publicKey, generateKeys, publishNote, profiles } = useNostrStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await publishNote(content);
    setContent('');
  };

  return (
    <div className="mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      {publicKey && profiles[publicKey] && (
        <div className="mb-4 flex items-center space-x-4">
          {profiles[publicKey].picture && (
            <img
              src={profiles[publicKey].picture}
              alt={profiles[publicKey].name || 'Profile'}
              className="h-10 w-10 rounded-full object-cover"
            />
          )}
          <Link
            href={`/profile/${publicKey}`}
            className="text-gray-900 hover:text-blue-500 dark:text-white dark:hover:text-blue-400"
          >
            {profiles[publicKey].name || 'Anonymous'}
          </Link>
        </div>
      )}
      {!publicKey ? (
        <button
          onClick={generateKeys}
          className="w-full rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
        >
          Generate Keys to Start Posting
        </button>
      ) : (
        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mb-4 w-full rounded border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="What's on your mind?"
            rows={3}
          />
          <button
            type="submit"
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
            disabled={!content.trim()}
          >
            Post
          </button>
        </form>
      )}
    </div>
  );
};
