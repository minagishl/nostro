import { create } from 'zustand';
import { SimplePool, getEventHash, getPublicKey, type Event, type Filter } from 'nostr-tools';
import { randomBytes } from 'crypto';

const generatePrivateKey = (): Uint8Array => {
	return Uint8Array.from(randomBytes(32));
};

const bytesToHex = (bytes: Uint8Array): string => {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
};

const hexToBytes = (hex: string): Uint8Array => {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
	}
	return bytes;
};

interface ProfileMetadata {
	name?: string;
	about?: string;
	picture?: string;
	nip05?: string;
}

async function verifyNip05(identifier: string, pubkey: string): Promise<boolean> {
	try {
		const [username, domain] = identifier.split('@');
		if (!username || !domain) return false;

		const response = await fetch(`https://${domain}/.well-known/nostr.json?name=${username}`);
		const data = await response.json();
		return data?.names?.[username] === pubkey;
	} catch (e) {
		console.error('Failed to verify NIP-05:', e);
		return false;
	}
}

interface NostrState {
	pool: SimplePool;
	publicKey: string | null;
	privateKey: string | null;
	relays: string[];
	events: Event[];
	profiles: Record<string, ProfileMetadata>;
	generateKeys: () => void;
	setKeys: (privateKey: string) => void;
	publishNote: (content: string) => Promise<void>;
	loadEvents: () => Promise<void>;
	loadProfile: (pubkey: string) => Promise<void>;
}

export const useNostrStore = create<NostrState>((set, get) => ({
	pool: new SimplePool(),
	publicKey: null,
	privateKey: null,
	relays: ['wss://relay.damus.io', 'wss://relay.nostr.band', 'wss://nos.lol'],
	events: [],
	profiles: {},

	generateKeys: () => {
		const privateKeyBytes = generatePrivateKey();
		const privateKey = bytesToHex(privateKeyBytes);
		const publicKey = getPublicKey(privateKeyBytes);
		set({ privateKey, publicKey });
	},

	setKeys: (privateKeyHex: string) => {
		const privateKeyBytes = hexToBytes(privateKeyHex);
		const publicKey = getPublicKey(privateKeyBytes);
		set({ privateKey: privateKeyHex, publicKey });
	},

	publishNote: async (content: string) => {
		const { pool, privateKey, publicKey, relays } = get();
		if (!privateKey || !publicKey) return;

		const event: Event = {
			kind: 1,
			pubkey: publicKey,
			created_at: Math.floor(Date.now() / 1000),
			tags: [],
			content,
			id: getEventHash({
				kind: 1,
				pubkey: publicKey,
				created_at: Math.floor(Date.now() / 1000),
				tags: [],
				content,
			}),
			sig: '',
		};
		await Promise.all(relays.map((relay) => pool.publish([relay], event)));
	},

	loadEvents: async () => {
		const { pool, relays } = get();
		const filter: Filter = {
			kinds: [1],
			limit: 100,
		};

		const events = await pool.querySync(relays, filter);
		set({ events: events.sort((a, b) => b.created_at - a.created_at) });
	},

	loadProfile: async (pubkey: string) => {
		const { pool, relays, profiles } = get();
		if (profiles[pubkey]) return;

		const filter: Filter = {
			authors: [pubkey],
			kinds: [0],
			limit: 1,
		};

		const events = await pool.querySync(relays, filter);
		if (events.length > 0) {
			const profileEvent = events[0];
			try {
				const metadata: ProfileMetadata = JSON.parse(profileEvent.content);
				if (metadata.nip05) {
					const isVerified = await verifyNip05(metadata.nip05, pubkey);
					metadata.nip05 = isVerified ? metadata.nip05 : undefined;
				}
				set({ profiles: { ...profiles, [pubkey]: metadata } });
			} catch (e) {
				console.error('Failed to parse profile metadata:', e);
			}
		}
	},
}));
