import React from 'react';
import Link from 'next/link';
import { Search, Bookmark, Info, User, LogOut, Bell, Home, Settings } from 'lucide-react';
import { useNostrStore } from '@/store/useNostrStore';
import { LoginForm } from '@/components/nostr/LoginForm';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey, logout } = useNostrStore();

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
                <Link
                  href="/preferences"
                  className="flex items-center gap-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Settings className="h-5 w-5" />
                  <span>Preferences</span>
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
        </div>
      </div>
    </div>
  );
};
