'use client';

import { Layout } from '@/components/layout/Layout';
import { Timeline } from '@/components/nostr/Timeline';

export default function Home() {
  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <Timeline />
      </div>
    </Layout>
  );
}
