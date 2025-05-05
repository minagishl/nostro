import React, { useState } from 'react';
import { type Event } from 'nostr-tools';
import { useNostrStore } from '@/store/useNostrStore';

interface ReplyFormProps {
  replyTo: Event;
  onClose: () => void;
}

export const ReplyForm: React.FC<ReplyFormProps> = ({ replyTo, onClose }) => {
  const [content, setContent] = useState('');
  const replyToNote = useNostrStore((state) => state.replyToNote);
  const publicKey = useNostrStore((state) => state.publicKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !publicKey) return;

    await replyToNote(content, replyTo);
    setContent('');
    onClose();
  };

  return (
    <div className="border-t border-gray-200 p-4 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your reply..."
          className="w-full rounded-lg border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          rows={3}
        />
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!content.trim() || !publicKey}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
          >
            Reply
          </button>
        </div>
      </form>
    </div>
  );
};
