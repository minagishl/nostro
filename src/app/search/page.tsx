'use client';

import Search from '@/components/nostr/Search';
import { useSearchParams } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');

  if (!query) {
    redirect('/');
  }

  return (
    <Layout>
      <div className="border-b border-gray-200 px-4 py-2.5 dark:border-gray-700">
        <h1 className="font-medium text-gray-900 dark:text-gray-100">
          Search for &quot;{query}&quot;
        </h1>
      </div>
      <Search query={query} />
    </Layout>
  );
}
