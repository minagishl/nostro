'use client';

import { Layout } from '@/components/layout/Layout';
import { Profile } from '@/components/nostr/Profile';

export default function ProfilePage({ params }: { params: { pubkey: string } }) {
	return (
		<Layout>
			<Profile pubkey={params.pubkey} />
		</Layout>
	);
}
