'use client';

export const runtime = 'edge';

import { useEffect, useState, use } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Profile } from '@/components/nostr/Profile';
import { useNostrStore } from '@/store/useNostrStore';
import { nip19 } from 'nostr-tools';

export default function ProfilePage(props: { params: Promise<{ identifier: string }> }) {
  const params = use(props.params);
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [decodedIdentifier, setDecodedIdentifier] = useState<string>('');
  const lookupNip05 = useNostrStore((state) => state.lookupNip05);

  useEffect(() => {
    const loadPubkey = async () => {
      const decoded = decodeURIComponent(params.identifier);
      setDecodedIdentifier(decoded);

      // If it's a hex pubkey, use it directly
      if (/^[0-9a-f]{64}$/.test(decoded)) {
        setPubkey(decoded);
        return;
      }

      // If it's an npub or nprofile, decode it
      if (decoded.startsWith('npub1') || decoded.startsWith('nprofile1')) {
        try {
          const { type, data } = nip19.decode(decoded);
          if (type === 'npub') {
            setPubkey(data as string);
            return;
          }
          if (type === 'nprofile') {
            setPubkey(data.pubkey);
            return;
          }
        } catch (e) {
          console.error('Failed to decode Nostr identifier:', e);
        }
      }

      // Otherwise, treat it as a NIP-05 identifier and look it up
      try {
        const resolvedPubkey = await lookupNip05(decoded);
        if (resolvedPubkey) {
          setPubkey(resolvedPubkey);
        }
      } catch (e) {
        console.error('Failed to resolve NIP-05:', e);
      }
    };

    loadPubkey();
  }, [params.identifier, lookupNip05]);

  if (!pubkey) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Profile pubkey={pubkey} displayIdentifier={decodedIdentifier} />
    </Layout>
  );
}
