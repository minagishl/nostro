import { SimplePool, getEventHash, type Event } from 'nostr-tools';
import { signEventWithExtension } from '../../../utils/nostr';

export async function publishNote(
  pool: SimplePool,
  privateKey: string | null,
  publicKey: string | null,
  relays: string[],
  isExtensionLogin: boolean,
  content: string,
) {
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
}

export async function replyToNote(
  pool: SimplePool,
  privateKey: string | null,
  publicKey: string | null,
  relays: string[],
  isExtensionLogin: boolean,
  content: string,
  replyTo: Event,
) {
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
}

export async function repostNote(
  pool: SimplePool,
  privateKey: string | null,
  publicKey: string | null,
  relays: string[],
  isExtensionLogin: boolean,
  event: Event,
) {
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
}

export async function publishReaction(
  pool: SimplePool,
  privateKey: string | null,
  publicKey: string | null,
  relays: string[],
  isExtensionLogin: boolean,
  emoji: string,
  targetEvent: Event,
) {
  if (!publicKey) return;

  const baseEvent = {
    kind: 7, // Reaction event
    pubkey: publicKey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['e', targetEvent.id],
      ['p', targetEvent.pubkey],
    ],
    content: emoji, // The emoji itself
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
}
