'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Profile } from '@/components/nostr/Profile';
import { useNostrStore } from '@/store/useNostrStore';

export default function ProfilePage({ params }: { params: { identifier: string } }) {
	const [pubkey, setPubkey] = useState<string | null>(null);
	const lookupNip05 = useNostrStore((state) => state.lookupNip05);

	useEffect(() => {
		const loadPubkey = async () => {
			// If it's a hex pubkey, use it directly
			if (/^[0-9a-f]{64}$/.test(params.identifier)) {
				setPubkey(params.identifier);
				return;
			}

			// Otherwise, treat it as a NIP-05 identifier and look it up
			try {
				const resolvedPubkey = await lookupNip05(params.identifier);
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
				<div className='flex justify-center items-center py-12'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
				</div>
			</Layout>
		);
	}

	return (
		<Layout>
			<Profile pubkey={pubkey} displayIdentifier={params.identifier} />
		</Layout>
	);
}
