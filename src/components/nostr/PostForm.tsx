import React, { useState } from 'react';
import { useNostrStore } from '@/store/useNostrStore';

export const PostForm: React.FC = () => {
  const [content, setContent] = useState('');
  const { publicKey, generateKeys, publishNote } = useNostrStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await publishNote(content);
    setContent('');
  };

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="p-4">
        {!publicKey ? (
          <button
            onClick={generateKeys}
            className="w-full rounded bg-indigo-500 px-4 py-2 font-bold text-white hover:bg-indigo-600"
          >
            Generate Keys to Start Posting
          </button>
        ) : (
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mb-4 w-full rounded border bg-transparent p-2 text-[15px] dark:border-gray-600 dark:text-white"
              placeholder="What's on your mind?"
              rows={3}
            />
            <button
              type="submit"
              className="rounded bg-indigo-500 px-4 py-2 font-bold text-white hover:bg-indigo-600"
              disabled={!content.trim()}
            >
              Post
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
