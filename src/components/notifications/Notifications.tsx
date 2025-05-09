import { useState, useEffect } from 'react';
import { Bell, AtSign, Repeat, Smile } from 'lucide-react';
import { useNotificationsStore } from '@/store/useNotificationsStore';
import { NotificationItem } from './NotificationItem';
import { tv } from 'tailwind-variants';
import { ICON_CONFIG } from '@/constants/icons';

const notificationTabs = tv({
  base: 'flex items-center gap-2 px-4 py-3 text-sm font-medium relative w-1/4 justify-center',
  variants: {
    active: {
      true: 'text-indigo-600 dark:text-indigo-400 after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-1/4 after:border-b-2 after:border-indigo-500',
      false: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
    },
  },
});

type NotificationType = 'all' | 'mentions' | 'reposts' | 'reactions';

export const Notifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NotificationType>('all');
  const {
    notifications,
    fetchNotifications,
    subscribeToNotifications,
    loadMoreNotifications,
    hasMore,
  } = useNotificationsStore();

  useEffect(() => {
    fetchNotifications();
    subscribeToNotifications();
  }, [fetchNotifications, subscribeToNotifications]);

  const tabs = [
    { id: 'all', label: 'All', icon: Bell },
    { id: 'mentions', label: 'Mentions', icon: AtSign },
    { id: 'reposts', label: 'Reposts', icon: Repeat },
    { id: 'reactions', label: 'Reactions', icon: Smile },
  ] as const;

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'mentions') return notification.type === 'mention';
    if (activeTab === 'reposts') return notification.type === 'repost';
    if (activeTab === 'reactions') return notification.type === 'reaction';
    return true;
  });

  return (
    <div className="rounded-lg">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex w-full justify-between px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={notificationTabs({ active: activeTab === tab.id })}
              >
                <Icon className="h-4 w-4" strokeWidth={ICON_CONFIG.strokeWidth} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div>
        {filteredNotifications.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            {activeTab === 'all' && 'No notifications yet'}
            {activeTab === 'mentions' && 'No mentions yet'}
            {activeTab === 'reposts' && 'No reposts yet'}
            {activeTab === 'reactions' && 'No reactions yet'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.map((notification, index) => (
              <NotificationItem
                key={index + notification.id}
                type={notification.type}
                user={notification.user}
                content={notification.content}
                timestamp={new Date(notification.timestamp * 1000).toLocaleString()}
              />
            ))}
            {hasMore ? (
              <div className="py-4 text-center">
                <button
                  onClick={loadMoreNotifications}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  Load More
                </button>
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No more notifications
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
