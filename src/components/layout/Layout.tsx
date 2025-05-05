import React from 'react';
import Link from 'next/link';
import { useNostrStore } from '@/store/useNostrStore';
import { LoginForm } from '@/components/nostr/LoginForm';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey } = useNostrStore();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white shadow dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nostro</h1>
            </Link>
            {publicKey && (
              <nav className="space-x-6">
                <Link
                  href="/search"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Search
                </Link>
                <Link
                  href="/about"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  About
                </Link>
              </nav>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">{publicKey ? children : <LoginForm />}</div>
      </main>
    </div>
  );
};
