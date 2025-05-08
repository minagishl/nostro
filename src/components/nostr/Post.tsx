import React from 'react';
import {
  MessageCircle,
  Repeat2,
  User,
  Bookmark,
  BookmarkCheck,
  Smile,
  Ellipsis,
} from 'lucide-react';
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
    <div className="dark:bg-gray-900">
      {isRepost && showRepostInfo && (
        <div className="flex items-center gap-2 px-4 pt-2 text-sm text-gray-500 dark:text-gray-400">
          <Repeat2 className="h-4 w-4" />
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
                  <User className="h-6 w-6" />
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
        <div className="flex items-center justify-between gap-4 px-4 pt-2 pb-6">
          <button
            onClick={() => {
              onReply(displayEvent);
            }}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <button
            onClick={() => onRepost(displayEvent)}
            className="flex items-center gap-2 text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400"
          >
            <Repeat2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => onToggleBookmark(event.id)}
            className={`flex items-center gap-2 ${isBookmarked ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'} dark:text-gray-400 dark:hover:text-yellow-400`}
            aria-label={isBookmarked ? 'ブックマーク解除' : 'ブックマーク'}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-5 w-5" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </button>
          {showReaction && onReact && setShowEmojiPickerId && (
            <div className="relative">
              <button
                onClick={() =>
                  setShowEmojiPickerId(showEmojiPickerId === event.id ? null : event.id)
                }
                className="flex items-center gap-2 text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400"
              >
                <Smile className="h-5 w-5" />
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
          <button className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400">
            <Ellipsis className="h-5 w-5" />
          </button>
        </div>
        {replyingToId === displayEvent.id && (
          <ReplyForm replyTo={displayEvent} onClose={onCloseReply ?? (() => {})} />
        )}
      </div>
    </div>
  );
};
