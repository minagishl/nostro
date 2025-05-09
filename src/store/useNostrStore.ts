import { create } from 'zustand';
import { SimplePool, getEventHash, getPublicKey, type Event, type Filter } from 'nostr-tools';
import { getPublicKeyFromExtension, signEventWithExtension } from '../utils/nostr';
import { type NostrState, type Subscription } from './nostr/types';
import { generatePrivateKey, bytesToHex, hexToBytes } from './nostr/utils/crypto';
import { verifyNip05, lookupNip05Pubkey } from './nostr/services/nip05';
import { publishNote, replyToNote, repostNote, publishReaction } from './nostr/services/events';

export const useNostrStore = create<NostrState>((set, get) => ({
  pool: new SimplePool(),
  publicKey: null,
  privateKey: null,
  isExtensionLogin: false,
  following: [],
  subscription: null,
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
  nostrJsonCache: {},

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
    await publishNote(pool, privateKey, publicKey, relays, isExtensionLogin, content);
  },

  unsubscribe: () => {
    const { subscription } = get();
    if (subscription) {
      subscription.unsub();
      set({ subscription: null });
    }
  },

  loadEvents: async () => {
    const { pool, relays, publicKey, following, subscription } = get();

    // Unsubscribe from existing subscription if any
    if (subscription) {
      subscription.unsub();
    }

    // Use only a few relays for efficiency
    const selectedRelays = relays.slice(0, 3);

    // Create filter for the events we want to receive
    const filter: Filter = {
      kinds: [1, 6],
      limit: 100,
    };

    if (publicKey && following.length > 0) {
      filter.authors = following;
    }

    // First, load initial events synchronously
    const initialEvents = await pool.querySync(selectedRelays, filter);
    set({
      events: initialEvents.sort((a: Event, b: Event) => b.created_at - a.created_at),
    });

    // Then set up subscription for real-time updates
    try {
      const sub = pool.subscribe(selectedRelays, filter, {
        onevent: (event: Event) => {
          // Handle reposts
          if (event.kind === 6) {
            const originalId = event.tags.find((tag) => tag[0] === 'e')?.[1];
            if (originalId) {
              // Fetch the original event
              const originalFilter: Filter = {
                ids: [originalId],
                kinds: [1],
              };

              void pool.get(selectedRelays, originalFilter).then((originalEvent: Event | null) => {
                if (originalEvent) {
                  set((state) => ({
                    repostEvents: { ...state.repostEvents, [event.id]: originalEvent },
                  }));
                }
              });
            }
          }

          // Add new event to the list if it doesn't exist
          set((state) => {
            // Check if event already exists
            if (state.events.some((e) => e.id === event.id)) {
              return state;
            }
            const newEvents = [event, ...state.events];
            return {
              events: newEvents.sort((a: Event, b: Event) => b.created_at - a.created_at),
            };
          });
        },
      });

      // Convert RelaySubscription to our Subscription type
      const subscription: Subscription = { unsub: () => sub.close() };
      set({ subscription });
    } catch (error) {
      console.error('Failed to create subscription:', error);
    }
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
      const contactList = events[0].tags
        .filter((tag: string[]) => tag[0] === 'p')
        .map((tag: string[]) => tag[1]);
      set({ following: contactList });
    }
  },

  followUser: async (pubkey: string) => {
    const { pool, relays, publicKey, privateKey, isExtensionLogin, loadFollowing } = get();
    if (!publicKey) return;

    // Get the latest following list
    await loadFollowing();
    const { following } = get();

    // If already following, do nothing
    if (following.includes(pubkey)) return;

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
    set({ events: events.sort((a: Event, b: Event) => b.created_at - a.created_at) });
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
        const metadata = JSON.parse(profileEvent.content);
        if (metadata.nip05) {
          const isVerified = await verifyNip05(metadata.nip05, pubkey, get().nostrJsonCache);
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

    const pubkey = await lookupNip05Pubkey(identifier, get().nostrJsonCache);
    if (pubkey) {
      set({ nip05ToPubkey: { ...nip05ToPubkey, [identifier]: pubkey } });
      return pubkey;
    }

    return null;
  },

  searchEvents: async (query: string) => {
    const { pool } = get();
    const searchRelay = 'wss://relay.nostr.band';
    const filter: Filter = {
      kinds: [1],
      search: query,
      limit: 100,
    };

    const events = await pool.querySync([searchRelay], filter);
    set({ searchResults: events.sort((a: Event, b: Event) => b.created_at - a.created_at) });
  },

  replyToNote: async (content: string, replyTo: Event) => {
    const { pool, privateKey, publicKey, relays, isExtensionLogin } = get();
    await replyToNote(pool, privateKey, publicKey, relays, isExtensionLogin, content, replyTo);
  },

  repostNote: async (event: Event) => {
    const { pool, privateKey, publicKey, relays, isExtensionLogin } = get();
    await repostNote(pool, privateKey, publicKey, relays, isExtensionLogin, event);
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

  publishReaction: async (emoji: string, targetEvent: Event) => {
    const { pool, privateKey, publicKey, relays, isExtensionLogin } = get();
    await publishReaction(
      pool,
      privateKey,
      publicKey,
      relays,
      isExtensionLogin,
      emoji,
      targetEvent,
    );
  },

  // Bookmarks
  bookmarks: [],
  loadBookmarks: async () => {
    const { pool, relays, publicKey } = get();
    if (!publicKey) return;
    const filter: Filter = {
      kinds: [30001],
      authors: [publicKey],
      limit: 1,
    };
    const events = await pool.querySync(relays, filter);
    if (events.length > 0) {
      // Extract ['e', <eventId>] from the tags of kind 30001
      const ids = events[0].tags
        .filter((tag: string[]) => tag[0] === 'e')
        .map((tag: string[]) => tag[1]);
      set({ bookmarks: ids });
    } else {
      set({ bookmarks: [] });
    }
  },

  updateBookmarks: async (eventId: string, add: boolean) => {
    const { pool, relays, publicKey, privateKey, isExtensionLogin, bookmarks } = get();
    if (!publicKey) return;
    let newBookmarks: string[];
    if (add) {
      newBookmarks = Array.from(new Set([...bookmarks, eventId]));
    } else {
      newBookmarks = bookmarks.filter((id) => id !== eventId);
    }

    // Publish a kind 30001 event
    const baseEvent = {
      kind: 30001,
      pubkey: publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: newBookmarks.map((id) => ['e', id]),
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
    set({ bookmarks: newBookmarks });
  },

  logout: () => {
    localStorage.removeItem('nostro:login');
    set({
      publicKey: null,
      privateKey: null,
      isExtensionLogin: false,
      following: [],
      events: [],
      repostEvents: {},
      searchResults: [],
      profiles: {},
      nip05ToPubkey: {},
      bookmarks: [],
    });
  },
}));
