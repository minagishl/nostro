'use client';

import { Layout } from '@/components/layout/Layout';
import { Timeline } from '@/components/nostr/Timeline';
import { Head } from '@/components/ui/Head';
import { HomeIcon } from 'lucide-react';

export default function Home() {
  return (
    <Layout>
      <div className="flex flex-col">
        <Head icon={HomeIcon} title="Home" />
        <Timeline />
      </div>
    </Layout>
  );
}
