import React, { useRef } from 'react';
import Link from 'next/link';
import { Search, Bookmark, Info, User, Bell, Home, Settings, LucideIcon } from 'lucide-react';
import { useNostrStore } from '@/store/useNostrStore';
import { LoginForm } from '@/components/nostr/LoginForm';
import { usePathname, useRouter } from 'next/navigation';
import { tv } from 'tailwind-variants';
import { PostForm } from '@/components/nostr/PostForm';

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

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey } = useNostrStore();
  const pathname = usePathname();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    searchInputRef.current?.focus();
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      router.push(`/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`);
    }
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
    { href: '/preferences', icon: Settings, label: 'Preferences' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="flex w-full">
          <aside className="sticky top-0 h-dvh w-80 shrink-0 overflow-y-auto px-6 py-8 pt-4 pr-4">
            <nav className="space-y-4">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search"
                  className="w-full rounded-md bg-gray-100 py-2.5 pr-2 pl-10 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
                  onKeyDown={handleSearchSubmit}
                />
              </div>
              <PostForm />
            </nav>
          </aside>
          <main className="my-4 flex-1 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700">
            <div className={!publicKey ? 'flex h-full items-center justify-center' : 'w-full'}>
              {publicKey ? children : <LoginForm />}
            </div>
          </main>
          {publicKey && (
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
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};
