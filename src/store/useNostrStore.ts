import { create } from 'zustand';
import { SimplePool, getEventHash, getPublicKey, type Event, type Filter } from 'nostr-tools';
import { getPublicKeyFromExtension, signEventWithExtension } from '../utils/nostr';

const generatePrivateKey = async (): Promise<Uint8Array> => {
	return crypto.getRandomValues(new Uint8Array(32));
};

const bytesToHex = (bytes: Uint8Array): string => {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
};

const hexToBytes = (hex: string): Uint8Array => {
	return new Uint8Array(hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
};

interface ProfileMetadata {
	name?: string;
	about?: string;
	picture?: string;
	nip05?: string;
}

interface NostrState {
	pool: SimplePool;
	publicKey: string | null;
	privateKey: string | null;
	isExtensionLogin: boolean;
	relays: string[];
	events: Event[];
	searchResults: Event[];
	profiles: Record<string, ProfileMetadata>;
	nip05ToPubkey: Record<string, string>;
	generateKeys: () => Promise<void>;
	setKeys: (privateKey: string) => void;
	loginWithExtension: () => Promise<void>;
	publishNote: (content: string) => Promise<void>;
	loadEvents: () => Promise<void>;
	loadUserEvents: (pubkey: string) => Promise<void>;
	loadProfile: (pubkey: string) => Promise<void>;
	lookupNip05: (identifier: string) => Promise<string | null>;
	searchEvents: (query: string) => Promise<void>;
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

async function lookupNip05Pubkey(identifier: string): Promise<string | null> {
	try {
		let username: string;
		let domain: string;

		// Skip npub identifiers
		if (identifier.startsWith('npub')) return null;

		if (identifier.includes('@')) {
			[username, domain] = identifier.split('@');
			if (!username || !domain) return null;
		} else {
			// For domain-only identifiers, use '_' as username
			username = '_';
			domain = identifier;
		}

		const response = await fetch(`https://${domain}/.well-known/nostr.json?name=${username}`);
		const data = await response.json();
		return data?.names?.[username] || null;
	} catch (e) {
		console.error('Failed to lookup NIP-05:', e);
		return null;
	}
}

export const useNostrStore = create<NostrState>((set, get) => ({
	pool: new SimplePool(),
	publicKey: null,
	privateKey: null,
	isExtensionLogin: false,
	relays: [
		'wss://relay.damus.io',
		'wss://nostr.land',
		'wss://nostr.wine',
		'wss://nos.lol',
		'wss://relay-jp.nostr.wirednet.jp',
		'wss://yabu.me',
		'wss://r.kojira.io',
		'wss://relay.nostr.band',
		'wss://nrelay-jp.c-stellar.net',
	],
	events: [],
	searchResults: [],
	profiles: {},
	nip05ToPubkey: {},

	generateKeys: async () => {
		const privateKeyBytes = await generatePrivateKey();
		const privateKey = bytesToHex(privateKeyBytes);
		const publicKey = getPublicKey(privateKeyBytes);
		set({ privateKey, publicKey });
	},

	setKeys: (privateKeyHex: string) => {
		const privateKeyBytes = hexToBytes(privateKeyHex);
		const publicKey = getPublicKey(privateKeyBytes);
		set({ privateKey: privateKeyHex, publicKey });
	},

	loginWithExtension: async () => {
		const publicKey = await getPublicKeyFromExtension();
		if (!publicKey) return;
		set({ publicKey, privateKey: null, isExtensionLogin: true });
	},

	publishNote: async (content: string) => {
		const { pool, privateKey, publicKey, relays, isExtensionLogin } = get();
		if (!publicKey) return;

		const baseEvent = {
			kind: 1,
			pubkey: publicKey,
			created_at: Math.floor(Date.now() / 1000),
			tags: [],
			content,
		};

		const unsignedEvent: Event = {
			...baseEvent,
			id: getEventHash(baseEvent),
			sig: '',
		};

		let eventToPublish = unsignedEvent;

		if (isExtensionLogin) {
			const signedEvent = await signEventWithExtension(unsignedEvent);
			if (!signedEvent) return;
			eventToPublish = signedEvent;
		} else if (!privateKey) {
			return;
		}

		await Promise.all(relays.map((relay) => pool.publish([relay], eventToPublish)));
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

	loadUserEvents: async (pubkey: string) => {
		const { pool, relays } = get();
		const filter: Filter = {
			authors: [pubkey],
			kinds: [1],
			limit: 100,
		};

		const events = await pool.querySync(relays, filter);
		set({ events: events.sort((a, b) => b.created_at - a.created_at) });
	},

	loadProfile: async (pubkey: string) => {
		const { pool, relays, profiles, nip05ToPubkey } = get();
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
					if (isVerified) {
						// Format the NIP-05 identifier similarly to display
						const formattedNip05 = metadata.nip05.startsWith('_@')
							? metadata.nip05.slice(2)
							: metadata.nip05;
						metadata.nip05 = formattedNip05;
						set({ nip05ToPubkey: { ...nip05ToPubkey, [formattedNip05]: pubkey } });
					} else {
						metadata.nip05 = undefined;
					}
				}
				set({ profiles: { ...profiles, [pubkey]: metadata } });
			} catch (e) {
				console.error('Failed to parse profile metadata:', e);
			}
		}
	},

	lookupNip05: async (identifier: string): Promise<string | null> => {
		const { nip05ToPubkey } = get();
		if (nip05ToPubkey[identifier]) {
			return nip05ToPubkey[identifier];
		}

		const pubkey = await lookupNip05Pubkey(identifier);
		if (pubkey) {
			set({ nip05ToPubkey: { ...nip05ToPubkey, [identifier]: pubkey } });
			return pubkey;
		}

		return null;
	},

	searchEvents: async (query: string) => {
		const { pool, relays } = get();
		const filter: Filter = {
			kinds: [1],
			search: query,
			limit: 100,
		};

		const events = await pool.querySync(relays, filter);
		set({ searchResults: events.sort((a, b) => b.created_at - a.created_at) });
	},
}));
