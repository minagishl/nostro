import { FC } from 'react';
import Link from 'next/link';
import { AtSign, Repeat, Smile } from 'lucide-react';

type NotificationItemProps = {
  type: 'mention' | 'repost' | 'reaction';
  user: {
    name: string;
    pubkey: string;
  };
  content: string;
  timestamp: string;
};

export const NotificationItem: FC<NotificationItemProps> = ({ type, user, content, timestamp }) => {
  const getIcon = () => {
    switch (type) {
      case 'mention':
        return <AtSign className="h-4 w-4 text-blue-500" />;
      case 'repost':
        return <Repeat className="h-4 w-4 text-green-500" />;
      case 'reaction':
        return <Smile className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="flex items-start gap-4 border-b border-gray-200 p-4 last:border-0 dark:border-gray-700">
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/profile/${user.pubkey}`}
            className="font-medium text-gray-900 hover:underline dark:text-white"
          >
            {user.name}
          </Link>
          <span className="text-gray-500 dark:text-gray-400">
            {type === 'mention' && 'mentioned you'}
            {type === 'repost' && 'reposted your note'}
            {type === 'reaction' && 'reacted to your note'}
          </span>
        </div>
        <p className="mt-1 text-gray-600 dark:text-gray-300">{content}</p>
        <time className="mt-1 text-sm text-gray-500 dark:text-gray-400">{timestamp}</time>
      </div>
    </div>
  );
};
