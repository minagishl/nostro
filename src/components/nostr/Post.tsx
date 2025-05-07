import React from 'react';
import Link from 'next/link';
import { MediaViewer } from './MediaViewer';
import { extractMediaUrls, formatContent } from '@/utils/content';
import { ReplyForm } from './ReplyForm';
import type { Event } from 'nostr-tools';

interface PostProps {
  event: Event;
  originalEvent?: Event; // Original event for reposts
  getUserDisplayName: (pubkey: string) => string;
  getUserProfileImage: (pubkey: string) => string;
  formatDate: (timestamp: number) => string;
  onReply: (event: Event) => void;
  onRepost: (event: Event) => void;
  onReact?: (emoji: string, event: Event) => Promise<void>;
  replyingToId?: string | null;
  showRepostInfo?: boolean;
  showReaction?: boolean;
  emojiOptions?: string[];
  showEmojiPickerId?: string | null;
  setShowEmojiPickerId?: (id: string | null) => void;
  onCloseReply?: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (eventId: string) => void;
}

export const Post: React.FC<PostProps> = ({
  event,
  originalEvent,
  getUserDisplayName,
  getUserProfileImage,
  formatDate,
  onReply,
  onRepost,
  onReact,
  replyingToId,
  showRepostInfo = false,
  showReaction = true,
  emojiOptions = ['👍', '❤️', '😂', '🙌', '🎉', '😮', '😢', '🔥'],
  showEmojiPickerId,
  setShowEmojiPickerId,
  onCloseReply,
  isBookmarked,
  onToggleBookmark,
}) => {
  const isRepost = event.kind === 6 && originalEvent;
  const displayEvent = isRepost ? originalEvent! : event;

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {isRepost && showRepostInfo && (
        <div className="flex items-center gap-2 px-4 pt-2 text-sm text-gray-500 dark:text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M17 1l4 4-4 4" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <path d="M7 23l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          <Link href={`/profile/${event.pubkey}`} className="font-semibold hover:underline">
            {getUserDisplayName(event.pubkey)}
          </Link>
          reposted
        </div>
      )}
      <div className="flex flex-col">
        <div className="p-4">
          <div className="flex gap-3">
            <Link
              href={`/profile/${displayEvent.pubkey}`}
              className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-200 dark:bg-gray-700"
            >
              {getUserProfileImage(displayEvent.pubkey) ? (
                <img
                  src={getUserProfileImage(displayEvent.pubkey)}
                  alt={`${getUserDisplayName(displayEvent.pubkey)}'s profile`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </Link>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <Link
                  href={`/profile/${displayEvent.pubkey}`}
                  className="text-[15px] font-semibold text-gray-900 no-underline hover:underline dark:text-gray-100"
                >
                  {getUserDisplayName(displayEvent.pubkey)}
                </Link>
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  {formatDate(displayEvent.created_at)}
                </span>
              </div>
              <div
                className="mt-1 max-w-full text-[15px] leading-relaxed break-words break-all whitespace-pre-wrap text-gray-900 dark:text-gray-100"
                dangerouslySetInnerHTML={{
                  __html: formatContent(displayEvent.content),
                }}
              />
              {extractMediaUrls(displayEvent.content).length > 0 && (
                <div className="mt-3">
                  <MediaViewer urls={extractMediaUrls(displayEvent.content)} />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 border-t border-gray-200 px-4 py-2 dark:border-gray-700">
          <button
            onClick={() => {
              onReply(displayEvent);
            }}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            Reply
          </button>
          <button
            onClick={() => onRepost(displayEvent)}
            className="flex items-center gap-2 text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 1l4 4-4 4" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <path d="M7 23l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            Repost
          </button>
          <button
            onClick={() => onToggleBookmark(event.id)}
            className={`flex items-center gap-2 ${isBookmarked ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'} dark:text-gray-400 dark:hover:text-yellow-400`}
            aria-label={isBookmarked ? 'ブックマーク解除' : 'ブックマーク'}
          >
            {isBookmarked ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5 3a2 2 0 00-2 2v12l7-4 7 4V5a2 2 0 00-2-2H5z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z"
                />
              </svg>
            )}
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          {showReaction && onReact && setShowEmojiPickerId && (
            <div className="relative">
              <button
                onClick={() =>
                  setShowEmojiPickerId(showEmojiPickerId === event.id ? null : event.id)
                }
                className="flex items-center gap-2 text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400"
              >
                <span role="img" aria-label="React">
                  😊
                </span>{' '}
                React
              </button>
              {showEmojiPickerId === event.id && (
                <div className="absolute z-10 mt-2 flex gap-1 rounded bg-white p-2 shadow dark:bg-gray-800">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      className="text-xl transition-transform hover:scale-125"
                      onClick={async () => {
                        await onReact(emoji, displayEvent);
                        setShowEmojiPickerId(null);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {replyingToId === displayEvent.id && (
          <ReplyForm replyTo={displayEvent} onClose={onCloseReply ?? (() => {})} />
        )}
      </div>
    </div>
  );
};
