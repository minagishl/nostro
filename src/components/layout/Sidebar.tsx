import React, { useRef } from 'react';
import Link from 'next/link';
import { Search, Bookmark, Info, User, Bell, Home, Bolt, LucideIcon } from 'lucide-react';
import { useNostrStore } from '@/store/useNostrStore';
import { usePathname } from 'next/navigation';
import { tv } from 'tailwind-variants';
import { ICON_CONFIG } from '@/constants/icons';

const link = tv({
  base: 'flex items-center gap-2 rounded-lg p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100',
  variants: {
    active: {
      true: 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400',
    },
  },
});

type MenuItem = {
  href?: string;
  icon?: LucideIcon;
  label?: string;
  isLogout?: boolean;
  element?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
};

export const Sidebar: React.FC = () => {
  const { publicKey } = useNostrStore();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    searchInputRef.current?.focus();
  };

  const menuItems: MenuItem[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: `/profile/${publicKey}`, icon: User, label: 'Profile' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/search', icon: Search, label: 'Search', onClick: handleSearchClick },
    { href: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
    { href: '/about', icon: Info, label: 'About' },
    {
      element: <div key="divider" className="my-3 border-b border-gray-200 dark:border-gray-700" />,
    },
    { href: '/preferences', icon: Bolt, label: 'Preferences' },
  ];

  return (
    <aside className="sticky top-0 h-dvh w-80 shrink-0 overflow-y-auto px-6 py-4 pl-4">
      <nav className="space-y-2">
        {menuItems.map((item) => {
          if (item.element) {
            return item.element;
          }
          if (!item.href || !item.icon || !item.label) {
            return null;
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={link({ active: pathname === item.href })}
              onClick={item.onClick}
            >
              <item.icon
                className={`h-5 w-5 ${item.icon === Bolt ? 'rotate-90' : ''}`}
                strokeWidth={ICON_CONFIG.strokeWidth}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
