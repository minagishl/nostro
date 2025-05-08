'use client';

import { Notifications } from '@/components/notifications/Notifications';
import { Layout } from '@/components/layout/Layout';

export default function NotificationsPage() {
  return (
    <Layout>
      <div className="container mx-auto">
        <Notifications />
      </div>
    </Layout>
  );
}
