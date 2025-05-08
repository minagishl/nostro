import { create } from 'zustand';
import { useNostrStore } from './useNostrStore';
import { Event } from 'nostr-tools';

export type Notification = {
  id: string;
  type: 'mention' | 'repost' | 'reaction';
  user: {
    name: string;
    pubkey: string;
  };
  content: string;
  timestamp: number;
  event: Event;
};

type NotificationsStore = {
  notifications: Notification[];
  lastTimestamp: number | null;
  hasMore: boolean;
  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;
  fetchNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  subscribeToNotifications: () => void;
};

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  notifications: [],
  lastTimestamp: null,
  hasMore: true,
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),
  clearNotifications: () => set({ notifications: [], lastTimestamp: null, hasMore: true }),
  fetchNotifications: async () => {
    const { pool, publicKey } = useNostrStore.getState();
    if (!pool || !publicKey) return;

    const notifications: Notification[] = [];
    const now = Math.floor(Date.now() / 1000);
    const oneWeekAgo = now - 7 * 24 * 60 * 60;

    // Fetch mentions
    const mentions = await pool.querySync(useNostrStore.getState().relays, {
      kinds: [1],
      '#p': [publicKey],
      since: oneWeekAgo,
    });

    // Fetch reposts
    const reposts = await pool.querySync(useNostrStore.getState().relays, {
      kinds: [6],
      '#p': [publicKey],
      since: oneWeekAgo,
    });

    // Fetch reactions
    const reactions = await pool.querySync(useNostrStore.getState().relays, {
      kinds: [7],
      '#p': [publicKey],
      since: oneWeekAgo,
    });

    // Process mentions
    for (const event of mentions) {
      if (event.pubkey === publicKey) continue;
      notifications.push({
        id: event.id,
        type: 'mention',
        user: {
          name: event.pubkey.slice(0, 8),
          pubkey: event.pubkey,
        },
        content: event.content,
        timestamp: event.created_at,
        event,
      });
    }

    // Process reposts
    for (const event of reposts) {
      if (event.pubkey === publicKey) continue;
      notifications.push({
        id: event.id,
        type: 'repost',
        user: {
          name: event.pubkey.slice(0, 8),
          pubkey: event.pubkey,
        },
        content: 'Reposted your note',
        timestamp: event.created_at,
        event,
      });
    }

    // Process reactions
    for (const event of reactions) {
      if (event.pubkey === publicKey) continue;
      const content = event.content || '❤️';
      notifications.push({
        id: event.id,
        type: 'reaction',
        user: {
          name: event.pubkey.slice(0, 8),
          pubkey: event.pubkey,
        },
        content: `Reacted with ${content}`,
        timestamp: event.created_at,
        event,
      });
    }

    // Sort by timestamp (newest first)
    notifications.sort((a, b) => b.timestamp - a.timestamp);

    set({
      notifications,
      lastTimestamp:
        notifications.length > 0 ? notifications[notifications.length - 1].timestamp : null,
      hasMore: notifications.length > 0,
    });
  },
  loadMoreNotifications: async () => {
    const { pool, publicKey } = useNostrStore.getState();
    const { lastTimestamp, hasMore } = get();
    if (!pool || !publicKey || !hasMore || !lastTimestamp) return;

    const notifications: Notification[] = [];
    const oneWeekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;

    // Fetch mentions
    const mentions = await pool.querySync(useNostrStore.getState().relays, {
      kinds: [1],
      '#p': [publicKey],
      since: oneWeekAgo,
      until: lastTimestamp - 1,
    });

    // Fetch reposts
    const reposts = await pool.querySync(useNostrStore.getState().relays, {
      kinds: [6],
      '#p': [publicKey],
      since: oneWeekAgo,
      until: lastTimestamp - 1,
    });

    // Fetch reactions
    const reactions = await pool.querySync(useNostrStore.getState().relays, {
      kinds: [7],
      '#p': [publicKey],
      since: oneWeekAgo,
      until: lastTimestamp - 1,
    });

    // Process mentions
    for (const event of mentions) {
      if (event.pubkey === publicKey) continue;
      notifications.push({
        id: event.id,
        type: 'mention',
        user: {
          name: event.pubkey.slice(0, 8),
          pubkey: event.pubkey,
        },
        content: event.content,
        timestamp: event.created_at,
        event,
      });
    }

    // Process reposts
    for (const event of reposts) {
      if (event.pubkey === publicKey) continue;
      notifications.push({
        id: event.id,
        type: 'repost',
        user: {
          name: event.pubkey.slice(0, 8),
          pubkey: event.pubkey,
        },
        content: 'Reposted your note',
        timestamp: event.created_at,
        event,
      });
    }

    // Process reactions
    for (const event of reactions) {
      if (event.pubkey === publicKey) continue;
      const content = event.content || '❤️';
      notifications.push({
        id: event.id,
        type: 'reaction',
        user: {
          name: event.pubkey.slice(0, 8),
          pubkey: event.pubkey,
        },
        content: `Reacted with ${content}`,
        timestamp: event.created_at,
        event,
      });
    }

    // Sort by timestamp (newest first)
    notifications.sort((a, b) => b.timestamp - a.timestamp);

    if (notifications.length === 0) {
      set({ hasMore: false });
      return;
    }

    set((state) => ({
      notifications: [...state.notifications, ...notifications],
      lastTimestamp: notifications[notifications.length - 1].timestamp,
      hasMore: notifications.length > 0,
    }));
  },
  subscribeToNotifications: () => {
    const { pool, publicKey, relays } = useNostrStore.getState();
    if (!pool || !publicKey) return;

    const now = Math.floor(Date.now() / 1000);
    const oneWeekAgo = now - 7 * 24 * 60 * 60;

    // Subscribe to mentions
    pool.subscribe(
      relays,
      {
        kinds: [1],
        '#p': [publicKey],
        since: oneWeekAgo,
      },
      {
        onevent: (event: Event) => {
          if (event.pubkey === publicKey) return;
          get().addNotification({
            id: event.id,
            type: 'mention',
            user: {
              name: event.pubkey.slice(0, 8),
              pubkey: event.pubkey,
            },
            content: event.content,
            timestamp: event.created_at,
            event,
          });
        },
      },
    );

    // Subscribe to reposts
    pool.subscribe(
      relays,
      {
        kinds: [6],
        '#p': [publicKey],
        since: oneWeekAgo,
      },
      {
        onevent: (event: Event) => {
          if (event.pubkey === publicKey) return;
          get().addNotification({
            id: event.id,
            type: 'repost',
            user: {
              name: event.pubkey.slice(0, 8),
              pubkey: event.pubkey,
            },
            content: 'Reposted your note',
            timestamp: event.created_at,
            event,
          });
        },
      },
    );

    // Subscribe to reactions
    pool.subscribe(
      relays,
      {
        kinds: [7],
        '#p': [publicKey],
        since: oneWeekAgo,
      },
      {
        onevent: (event: Event) => {
          if (event.pubkey === publicKey) return;
          const content = event.content || '❤️';
          get().addNotification({
            id: event.id,
            type: 'reaction',
            user: {
              name: event.pubkey.slice(0, 8),
              pubkey: event.pubkey,
            },
            content: `Reacted with ${content}`,
            timestamp: event.created_at,
            event,
          });
        },
      },
    );
  },
}));
