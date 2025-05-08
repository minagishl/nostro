'use client';

import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { useEffect, useState } from 'react';

export default function About() {
  const [license, setLicense] = useState<string>('');

  useEffect(() => {
    const fetchLicense = async () => {
      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/minagishl/nostro/refs/heads/main/LICENSE',
        );
        const text = await response.text();
        setLicense(text);
      } catch (error) {
        console.error('Failed to fetch license:', error);
      }
    };

    fetchLicense();
  }, []);

  return (
    <Layout>
      <div className="w-full">
        <div className="mb-10 flex w-full flex-col space-y-6 p-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200">About</h3>
              <p className="text-gray-600 dark:text-gray-400">
                This client was created by{' '}
                <Link
                  href="https://github.com/minagishl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-400"
                >
                  @minagishl
                </Link>
              </p>
              {license && (
                <div className="mt-4">
                  <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
                    License
                  </h3>
                  <div className="rounded bg-gray-50 px-4 dark:bg-gray-800">
                    <pre className="overflow-x-scroll bg-gray-50 py-4 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      {license}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
