import React, { useRef } from 'react';
import { Search } from 'lucide-react';
import { useNostrStore } from '@/store/useNostrStore';
import { LoginForm } from '@/components/nostr/LoginForm';
import { PostForm } from '@/components/nostr/PostForm';
import { ICON_CONFIG } from '@/constants/icons';
import { Sidebar } from './Sidebar';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey } = useNostrStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen antialiased dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="flex w-full">
          <aside className="sticky top-0 h-dvh w-80 shrink-0 overflow-y-auto px-6 py-8 pt-4 pr-4">
            <nav className="space-y-4">
              <div className="relative">
                <Search
                  className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                  strokeWidth={ICON_CONFIG.strokeWidth}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search"
                  className="w-full rounded-md bg-gray-100 py-2.5 pr-2 pl-10 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
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
          {publicKey && <Sidebar />}
        </div>
      </div>
    </div>
  );
};
