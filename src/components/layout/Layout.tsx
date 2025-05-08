import React from 'react';
import Link from 'next/link';
import { Search, Bookmark, Info, User, LogOut, Bell } from 'lucide-react';
import { useNostrStore } from '@/store/useNostrStore';
import { LoginForm } from '@/components/nostr/LoginForm';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey, logout } = useNostrStore();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white shadow dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nostro</h1>
            </Link>
          </div>
        </div>
      </header>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {publicKey && (
          <aside className="w-64 bg-white shadow dark:bg-gray-800">
            <nav className="space-y-2 p-4">
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
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-2xl">{publicKey ? children : <LoginForm />}</div>
        </main>
      </div>
    </div>
  );
};
