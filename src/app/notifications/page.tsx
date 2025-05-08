'use client';

import { Notifications } from '@/components/notifications/Notifications';
import { Layout } from '@/components/layout/Layout';

export default function NotificationsPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        <Notifications />
      </div>
    </Layout>
  );
}
