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

interface NostrState {
	pool: SimplePool;
	publicKey: string | null;
	privateKey: string | null;
	relays: string[];
	events: Event[];
	generateKeys: () => void;
	setKeys: (privateKey: string) => void;
	publishNote: (content: string) => Promise<void>;
	loadEvents: () => Promise<void>;
}

type NostrEvent = Event & {
	content: string;
	created_at: number;
	id: string;
	kind: number;
	pubkey: string;
	sig: string;
	tags: string[][];
};

export const useNostrStore = create<NostrState>((set, get) => ({
	pool: new SimplePool(),
	publicKey: null,
	privateKey: null,
	relays: ['wss://relay.damus.io', 'wss://relay.nostr.band', 'wss://nos.lol'],
	events: [],

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
}));
