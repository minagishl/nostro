import React from 'react';
import Link from 'next/link';
import { Search, Bookmark, Info, User, LogOut, Bell, Home } from 'lucide-react';
import { useNostrStore } from '@/store/useNostrStore';
import { LoginForm } from '@/components/nostr/LoginForm';
import { tv } from 'tailwind-variants';

const container = tv({
  base: 'ml-auto w-full max-w-3/4',
  variants: {
    full: {
      true: 'w-full max-w-full',
      false: 'w-full max-w-3/4',
    },
  },
});

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey, logout } = useNostrStore();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="fixed top-0 z-10 w-full bg-white shadow dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nostro</h1>
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="relative flex">
          {publicKey && (
            <aside className="fixed py-8">
              <nav className="space-y-2">
                <Link
                  href="/"
                  className="flex items-center gap-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Home className="h-5 w-5" />
                  <span>Home</span>
                </Link>
                <Link
                  href={`/profile/${publicKey}`}
                  className="flex items-center gap-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/notifications"
                  className="flex items-center gap-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                </Link>
                <Link
                  href="/search"
                  className="flex items-center gap-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Search className="h-5 w-5" />
                  <span>Search</span>
                </Link>
                <Link
                  href="/bookmarks"
                  className="flex items-center gap-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Bookmark className="h-5 w-5" />
                  <span>Bookmarks</span>
                </Link>
                <Link
                  href="/about"
                  className="flex items-center gap-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Info className="h-5 w-5" />
                  <span>About</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-lg p-2 text-indigo-600 hover:bg-gray-100 dark:text-indigo-400 dark:hover:bg-gray-700"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </nav>
            </aside>
          )}
          <main className="w-full flex-1 p-6">
            <div className={container({ full: !publicKey })}>
              {publicKey ? children : <LoginForm />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
