import { SimplePool, type Event } from 'nostr-tools';

export interface ProfileMetadata {
  name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
}

export type Subscription = {
  unsub: () => void;
};

export interface NostrState {
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
  subscription: Subscription | null;
  nostrJsonCache: Record<string, unknown>;
  generateKeys: () => Promise<void>;
  setKeys: (privateKey: string) => void;
  loginWithExtension: () => Promise<void>;
  publishNote: (content: string) => Promise<void>;
  loadEvents: () => Promise<void>;
  unsubscribe: () => void;
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
  publishReaction: (emoji: string, targetEvent: Event) => Promise<void>;
}

export interface NostrJsonResponse {
  names: Record<string, string>;
}
