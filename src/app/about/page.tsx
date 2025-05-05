'use client';

import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';

export default function About() {
  return (
    <Layout>
      <div className="w-full">
        <div className="mb-10 flex w-full flex-col space-y-6 rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">About Nostro</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Developer</h3>
              <Link
                href="https://github.com/minagishl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                @minagishl
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
