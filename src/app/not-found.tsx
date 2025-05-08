'use client';

import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';

export default function NotFound() {
  return (
    <Layout>
      <div className="flex w-full flex-col items-center justify-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          404 - Page Not Found
        </h2>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Return Home
        </Link>
      </div>
    </Layout>
  );
}
