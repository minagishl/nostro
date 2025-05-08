import React from 'react';
import Link from 'next/link';
import { Search, Bookmark, Info, User, Bell, Home, Settings, LucideIcon } from 'lucide-react';
import { useNostrStore } from '@/store/useNostrStore';
import { LoginForm } from '@/components/nostr/LoginForm';

type MenuItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  isLogout?: boolean;
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey } = useNostrStore();

  const menuItems: MenuItem[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: `/profile/${publicKey}`, icon: User, label: 'Profile' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
    { href: '/about', icon: Info, label: 'About' },
    { href: '/preferences', icon: Settings, label: 'Preferences' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex w-full">
          <aside className="sticky top-0 h-dvh w-60 shrink-0 overflow-y-auto px-6 py-8">
            <nav className="space-y-2"></nav>
          </aside>
          <main className="mt-4 flex-1 overflow-y-auto rounded-md border border-gray-200 py-4 dark:border-gray-700">
            <div
              className={
                !publicKey ? 'flex h-full items-center justify-center' : 'mx-auto max-w-xl'
              }
            >
              {publicKey ? children : <LoginForm />}
            </div>
          </main>
          {publicKey && (
            <aside className="sticky top-0 h-dvh w-60 shrink-0 overflow-y-auto px-6 py-8">
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 rounded-lg p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};
