'use client';

import { Layout } from '@/components/layout/Layout';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Layout>
      <div className="py-12 text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Profile Not Found</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          The profile you&apos;re looking for doesn&apos;t exist or couldn&apos;t be found.
        </p>
        <Link href="/" className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400">
          Return to Home
        </Link>
      </div>
    </Layout>
  );
}
