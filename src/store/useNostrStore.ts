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
  repostEvents: Record<string, Event>;
  searchResults: Event[];
  profiles: Record<string, ProfileMetadata>;
  nip05ToPubkey: Record<string, string>;
  following: string[];
  generateKeys: () => Promise<void>;
  setKeys: (privateKey: string) => void;
  loginWithExtension: () => Promise<void>;
  publishNote: (content: string) => Promise<void>;
  loadEvents: () => Promise<void>;
  loadUserEvents: (pubkey: string) => Promise<void>;
  loadProfile: (pubkey: string) => Promise<void>;
  lookupNip05: (identifier: string) => Promise<string | null>;
  searchEvents: (query: string) => Promise<void>;
  loadFollowing: () => Promise<void>;
  followUser: (pubkey: string) => Promise<void>;
  unfollowUser: (pubkey: string) => Promise<void>;
  replyToNote: (content: string, replyTo: Event) => Promise<void>;
  repostNote: (event: Event) => Promise<void>;
  getRepostedEvent: (repostEvent: Event) => Promise<Event | null>;
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
  following: [],
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
  repostEvents: {},
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
    const { pool, relays, publicKey, following } = get();

    // Use only a few relays for efficiency (limit the number of relays)
    const selectedRelays = relays.slice(0, 3);

    // If there are users being followed, prioritize their events
    const filter: Filter = {
      kinds: [1, 6],
      limit: 100,
    };

    if (publicKey && following.length > 0) {
      filter.authors = following;
    }

    // Retrieve all events in a single query
    console.log(`Fetching events from ${selectedRelays.length} relays`);
    const events = await pool.querySync(selectedRelays, filter);
    const sortedEvents = events.sort((a, b) => b.created_at - a.created_at);

    // Collect repost and original event IDs
    const repostsToFetch = sortedEvents.filter((event) => event.kind === 6);
    const originalEventIds = repostsToFetch
      .map((event) => event.tags.find((tag) => tag[0] === 'e')?.[1])
      .filter((id): id is string => !!id);

    // Only fetch in batch if there are original event IDs
    let repostEvents: Record<string, Event> = {};
    if (originalEventIds.length > 0) {
      const batchFilter: Filter = {
        ids: originalEventIds,
        kinds: [1],
      };

      console.log(`Fetching ${originalEventIds.length} original events in one batch`);
      const originalEvents = await pool.querySync(selectedRelays, batchFilter);

      // Map original events
      const originalEventMap: Record<string, Event> = {};
      originalEvents.forEach((event) => {
        originalEventMap[event.id] = event;
      });

      // Associate reposts with their original events
      repostsToFetch.forEach((repost) => {
        const originalId = repost.tags.find((tag) => tag[0] === 'e')?.[1];
        if (originalId && originalEventMap[originalId]) {
          repostEvents[repost.id] = originalEventMap[originalId];
        }
      });
    }

    set({ events: sortedEvents, repostEvents });
  },

  loadFollowing: async () => {
    const { pool, relays, publicKey } = get();
    if (!publicKey) return;

    const filter: Filter = {
      kinds: [3],
      authors: [publicKey],
      limit: 1,
    };

    const events = await pool.querySync(relays, filter);
    if (events.length > 0) {
      const contactList = events[0].tags.filter((tag) => tag[0] === 'p').map((tag) => tag[1]);
      set({ following: contactList });
    }
  },

  followUser: async (pubkey: string) => {
    const { pool, relays, publicKey, privateKey, following, isExtensionLogin } = get();
    if (!publicKey) return;

    const newFollowing = [...following, pubkey];
    const baseEvent = {
      kind: 3,
      pubkey: publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: newFollowing.map((pk) => ['p', pk]),
      content: '',
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
    set({ following: newFollowing });
  },

  unfollowUser: async (pubkey: string) => {
    const { pool, relays, publicKey, privateKey, following, isExtensionLogin } = get();
    if (!publicKey) return;

    const newFollowing = following.filter((pk) => pk !== pubkey);
    const baseEvent = {
      kind: 3,
      pubkey: publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: newFollowing.map((pk) => ['p', pk]),
      content: '',
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
    set({ following: newFollowing });
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

  replyToNote: async (content: string, replyTo: Event) => {
    const { pool, privateKey, publicKey, relays, isExtensionLogin } = get();
    if (!publicKey) return;

    const baseEvent = {
      kind: 1,
      pubkey: publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['e', replyTo.id],
        ['p', replyTo.pubkey],
      ],
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

  repostNote: async (event: Event) => {
    const { pool, privateKey, publicKey, relays, isExtensionLogin } = get();
    if (!publicKey) return;

    const baseEvent = {
      kind: 6,
      pubkey: publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['e', event.id],
        ['p', event.pubkey],
      ],
      content: '',
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

  getRepostedEvent: async (repostEvent: Event): Promise<Event | null> => {
    const { repostEvents } = get();

    // If already cached, return it
    if (repostEvents[repostEvent.id]) {
      return repostEvents[repostEvent.id];
    }

    // Since batch fetching is now done in loadEvents,
    // do not make individual requests; return null if not already fetched
    console.log('Original event not found in cache');
    return null;
  },
}));
